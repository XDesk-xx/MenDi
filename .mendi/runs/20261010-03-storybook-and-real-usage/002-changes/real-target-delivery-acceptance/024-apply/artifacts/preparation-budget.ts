import assert from "node:assert/strict";
import { spawn, execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createServer, createConnection } from "node:net";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

// 本 Run 的固定短时宿主调用记录；不是目标业务执行器，也不接受任意命令。
const mode = process.argv[2];
const source = fileURLToPath(import.meta.url);
const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

if (mode === "child-short") {
  await delay(650);
  console.log("SHORT_DONE");
} else if (mode === "child-listener") {
  const server = createServer();
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    assert(address && typeof address !== "string");
    console.log(`LISTENING ${address.port}`);
  });
  // 仅为异常宿主退出的兜底，不作为正式停止确认。
  setTimeout(() => server.close(), 60_000);
} else {
  assert(mode === "normal" || mode === "deadline" || mode === "cancel");
  const started = performance.now();
  const budgetMs =
    mode === "deadline" ? 1800 : mode === "cancel" ? 20_000 : 5000;
  const deadline = started + budgetMs;
  const controller = new AbortController();
  let reason: "timeout" | "cancelled" | undefined;
  let sigintCount = 0;
  const steps: Array<Record<string, unknown>> = [];
  const terminate = (cause: "timeout" | "cancelled") => {
    if (!reason) {
      reason = cause;
      controller.abort(cause);
    }
  };
  process.on("SIGINT", () => {
    sigintCount++;
    terminate("cancelled");
  });
  const groupTimer = setTimeout(() => terminate("timeout"), budgetMs);

  async function runStep(childMode: "child-short" | "child-listener") {
    const remainingMs = deadline - performance.now();
    if (reason || remainingMs <= 0) {
      if (!reason) terminate("timeout");
      return;
    }
    const allowanceMs = Math.min(
      mode === "cancel" ? 15_000 : 5000,
      remainingMs,
    );
    const at = performance.now();
    const child = spawn(process.execPath, [source, childMode], {
      cwd: "D:/Projects/MenDi/tests/fixtures/d03-c-vue-project",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      detached: process.platform === "win32",
    });
    let stdout = "";
    let stderr = "";
    let port: number | undefined;
    let readyPrinted = false;
    let closed = false;
    let spawnError: string | undefined;
    let code: number | null = null;
    let signal: NodeJS.Signals | null = null;
    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
      const found = stdout.match(/LISTENING (\d+)/);
      if (found) port = Number(found[1]);
      if (mode === "cancel" && port && !readyPrinted) {
        readyPrinted = true;
        console.log(
          `CANCEL_READY host=${process.pid} child=${child.pid} port=${port}`,
        );
      }
    });
    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });
    child.on("error", (error) => {
      spawnError = error.message;
    });
    const close = new Promise<void>((resolve) =>
      child.once("close", (exitCode, exitSignal) => {
        closed = true;
        code = exitCode;
        signal = exitSignal;
        resolve();
      }),
    );
    let wakeAbort: (() => void) | undefined;
    const aborted = new Promise<void>((resolve) => {
      wakeAbort = resolve;
    });
    const onAbort = () => wakeAbort?.();
    controller.signal.addEventListener("abort", onAbort, { once: true });
    const stepTimer = setTimeout(() => terminate("timeout"), allowanceMs);
    if (controller.signal.aborted) onAbort();
    await Promise.race([close, aborted]);
    clearTimeout(stepTimer);
    controller.signal.removeEventListener("abort", onAbort);
    if (performance.now() >= deadline && !reason) terminate("timeout");

    const stopStarted = performance.now();
    let kill: Record<string, unknown> | undefined;
    if (reason && !closed && child.pid) {
      // 只停止仍由本次 ChildProcess 持有的活跃树。
      kill = await new Promise((resolve) => {
        execFile(
          "taskkill.exe",
          ["/PID", String(child.pid), "/T", "/F"],
          { timeout: 5000, windowsHide: true },
          (error, out, err) => {
            resolve({
              command: ["taskkill.exe", "/PID", child.pid, "/T", "/F"],
              error: error?.message ?? null,
              stdout: out,
              stderr: err,
            });
          },
        );
      });
    }
    if (!closed) await Promise.race([close, delay(5000)]);
    let listenerEnded: boolean | null = null;
    if (port) {
      const ownedPort = port;
      listenerEnded = await new Promise<boolean>((resolve) => {
        const socket = createConnection({ host: "127.0.0.1", port: ownedPort });
        socket.setTimeout(2000);
        socket.once("connect", () => {
          socket.destroy();
          resolve(false);
        });
        socket.once("error", (error: NodeJS.ErrnoException) => {
          socket.destroy();
          resolve(error.code === "ECONNREFUSED");
        });
        socket.once("timeout", () => {
          socket.destroy();
          resolve(false);
        });
      });
    }
    const pipesClosed = child.stdout.destroyed && child.stderr.destroyed;
    const accepted =
      !reason &&
      closed &&
      code === 0 &&
      !spawnError &&
      performance.now() < deadline &&
      pipesClosed &&
      listenerEnded !== false;
    steps.push({
      childMode,
      pid: child.pid,
      remainingMs,
      allowanceMs,
      durationMs: performance.now() - at,
      code,
      signal,
      spawnError,
      stdout,
      stderr,
      closed,
      pipesClosed,
      port,
      listenerEnded,
      kill,
      stopDurationMs: performance.now() - stopStarted,
      accepted,
    });
    if (!accepted && !reason) throw new Error("normal child did not pass");
  }

  try {
    await runStep("child-short");
    await runStep(mode === "normal" ? "child-short" : "child-listener");
    // 后项是启动事实；到期 / 取消时不得出现。
    let followingStarted = false;
    if (!reason && performance.now() < deadline) followingStarted = true;
    const result = {
      mode,
      budgetMs,
      elapsedMs: performance.now() - started,
      reason: reason ?? null,
      sigintCount,
      followingStarted,
      steps,
    };
    writeFileSync(
      new URL(`./budget-${mode}.json`, import.meta.url),
      JSON.stringify(result, null, 2) + "\n",
      { flag: "wx" },
    );
    assert.equal(steps.length, 2);
    assert.equal(steps[0]?.accepted, true);
    assert.equal(steps[1]?.closed, true);
    assert.equal(steps[1]?.pipesClosed, true);
    if (mode === "normal") {
      assert.equal(reason, undefined);
      assert.equal(followingStarted, true);
      assert.equal(steps[1]?.accepted, true);
    } else {
      assert.equal(reason, mode === "cancel" ? "cancelled" : "timeout");
      assert.equal(followingStarted, false);
      assert.equal(steps[1]?.accepted, false);
      assert.equal(steps[1]?.listenerEnded, true);
      assert(Number(steps[1]?.stopDurationMs) < 12_000);
      if (mode === "cancel") assert(sigintCount > 0);
      else assert(Number(steps[1]?.allowanceMs) < budgetMs - 600);
      process.exitCode = mode === "cancel" ? 130 : 124;
    }
    console.log(
      JSON.stringify({
        mode,
        reason: result.reason,
        followingStarted,
        sigintCount,
        closed: steps[1]?.closed,
        listenerEnded: steps[1]?.listenerEnded,
      }),
    );
  } finally {
    clearTimeout(groupTimer);
  }
}
