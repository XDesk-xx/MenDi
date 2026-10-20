import fs from 'node:fs';
import path from 'node:path';
import { run } from 'node:test';
import type { TestEvent } from 'node:test/reporters';
import { spawnSync } from 'node:child_process';
import net from 'node:net';
import type { GroupRequest } from '../../src/core/group-report.ts';

// 目标拥有执行的受控参考接线；不解析 stdout，也不将 Node 事件直接当最终组事实。
const requestFile = process.env.MENDI_GROUP_TEST_REQUEST!;
const reportFile = process.env.MENDI_GROUP_TEST_REPORT!;
const request = JSON.parse(fs.readFileSync(requestFile, 'utf8')) as GroupRequest;
if (reportFile !== path.resolve(request.projectRoot, request.reportRef))
  throw new Error('本次路径不一致');
const control = fs.existsSync('group-control.json')
  ? (JSON.parse(fs.readFileSync('group-control.json', 'utf8')) as {
      stopAfter?: string;
      wrapperZero?: boolean;
      ports?: Record<string, number>;
      unknownCleanup?: string;
      preparationFile?: string;
      preparationState?: 'blocked' | 'failed';
    })
  : {};
const facts: Record<string, unknown>[] = [];
let environmentFailure: unknown;
const started = performance.now();
const utc = new Date().toISOString();
const controller = new AbortController();
let cancelled = false;
process.on('SIGINT', () => {
  cancelled = true;
  controller.abort();
});
const unsafe = new Set<string>();
let cleanupUnknown = false;
for (const id of request.selection) {
  const g = request.plan.groups.find((g) => g.id === id)!;
  const base = {
    id,
    selection: g.selection,
    exclusions: g.exclusions.map((e) => e.id),
    cleanup: 'confirmed',
    enumerated: true,
    finished: true,
  };
  if (cancelled) {
    facts.push({ ...base, state: 'not-run', reason: '全局取消' });
    continue;
  }
  if (control.stopAfter && facts.some((f) => f.id === control.stopAfter)) {
    facts.push({ ...base, state: 'not-run', reason: '显式有界停止，后续可继续' });
    continue;
  }
  if (
    g.dependsOn.some(
      (dep) =>
        (facts.find((f) => f.id === dep) ?? request.prerequisites.find((f) => f.id === dep))
          ?.state !== 'passed',
    ) ||
    g.resources.some((r) => unsafe.has(r))
  ) {
    facts.push({ ...base, state: 'blocked', reason: '必要前置 / 共享资源未确认' });
    continue;
  }
  fs.appendFileSync(
    path.resolve(request.projectRoot, request.eventsRef),
    JSON.stringify({
      attempt: request.runRef,
      group: id,
      clock: 'target',
      utc: new Date().toISOString(),
      elapsedMs: performance.now() - started,
      event: { type: 'group:prepare' },
    }) + '\n',
  );
  let server: net.Server | undefined;
  if (id === 'middle' && control.preparationFile && !fs.existsSync(control.preparationFile)) {
    const identity = path.resolve(control.preparationFile);
    if (!identity.startsWith(request.projectRoot + path.sep)) throw new Error('准备资源须归属目标');
    environmentFailure = {
      phase: 'preparation',
      groupIds: [id],
      resources: [{ id: 'ready-file', projectRoot: request.projectRoot, identity }],
    };
    if (control.preparationState !== 'failed') {
      facts.push({ ...base, state: 'blocked', reason: '本项目已知准备文件尚未就绪' });
      continue;
    }
    if (g.kind !== 'command')
      throw new Error('failed 准备场景必须执行真实准备命令，不伪造测试计数');
  }
  const port = control.ports?.[id];
  if (port) {
    server = net.createServer();
    const owned = await new Promise<boolean>((resolve) => {
      server!.once('error', () => resolve(false));
      server!.listen(port, '127.0.0.1', () => resolve(true));
    });
    if (!owned) {
      facts.push({
        ...base,
        state: 'blocked',
        reason: '陌生端口已占用',
      });
      continue;
    }
  }
  const began = performance.now();
  let exitCode = 0;
  let counts: Record<string, number> | undefined;
  const excluded = new Map<string, string>();
  if (g.kind === 'command') {
    if (g.command !== `node ${g.selection.join(' ')}`)
      throw new Error('参考命令必须与实际 Node 参数一致');
    const result = spawnSync(process.execPath, g.selection, {
      cwd: request.projectRoot,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    exitCode = result.status ?? 1;
  } else {
    let summary: Extract<TestEvent, { type: 'test:summary' }>['data'] | undefined;
    let lateError = false;
    const fileSummaries = new Map<string, Extract<TestEvent, { type: 'test:summary' }>['data']>();
    for await (const item of run({
      files: g.selection.map((file) => path.resolve(file)),
      concurrency: 1,
      signal: controller.signal,
    })) {
      const event = item as TestEvent;
      fs.appendFileSync(
        path.resolve(request.projectRoot, request.eventsRef),
        JSON.stringify(
          {
            attempt: request.runRef,
            group: id,
            clock: 'target',
            utc: new Date().toISOString(),
            elapsedMs: performance.now() - started,
            event,
          },
          (_key, v: unknown) =>
            v instanceof Error
              ? {
                  name: v.name,
                  message: v.message,
                  code: (v as Error & { code?: string }).code,
                  failureType: (v as Error & { failureType?: string }).failureType,
                }
              : v,
        ) + '\n',
      );
      if (event.type === 'test:summary' && event.data.file === undefined) summary = event.data;
      if (event.type === 'test:summary' && event.data.file !== undefined)
        fileSummaries.set(event.data.file, event.data);
      if (
        event.type === 'test:fail' &&
        (event.data.details.error as Error & { failureType?: string })?.failureType !==
          'testAborted'
      )
        lateError = true;
      if (
        (event.type === 'test:pass' || event.type === 'test:fail') &&
        g.exclusions.some((x) => x.id === event.data.name)
      )
        excluded.set(
          event.data.name,
          event.data.skip
            ? 'skipped'
            : event.data.todo
              ? 'todo'
              : event.type === 'test:pass'
                ? 'passed'
                : 'failed',
        );
    }
    if (!summary) throw new Error('缺 Node 根结束摘要');
    // 根可能把文件内 cancelled 折成文件容器 failed；业务计数取各文件真实摘要，根另核结束错误。
    // 空文件只有根容器成功，没有业务文件摘要，因此实际业务范围为零。
    counts = { total: 0, passed: 0, failed: 0, cancelled: 0, skipped: 0, todo: 0, pending: 0 };
    for (const { counts: c } of fileSummaries.values()) {
      counts.total += c.tests;
      counts.passed += c.passed;
      counts.failed += c.tests - c.passed - c.cancelled - c.skipped - c.todo;
      counts.cancelled += c.cancelled;
      counts.skipped += c.skipped;
      counts.todo += c.todo;
    }
    for (const category of excluded.values()) {
      counts.total--;
      counts[category]--;
    }
    if (counts.cancelled > 0) {
      cancelled = true;
      controller.abort();
    }
    if (excluded.size !== g.exclusions.length) throw new Error('排除身份缺观察');
    exitCode =
      !summary.success ||
      lateError ||
      counts.total === 0 ||
      ['failed', 'cancelled', 'skipped', 'todo', 'pending'].some((k) => counts![k] > 0)
        ? 1
        : 0;
  }
  if (server)
    await new Promise<void>((resolve, reject) =>
      server!.close((error) => (error ? reject(error) : resolve())),
    );
  const unknown = control.unknownCleanup === id;
  if (unknown) {
    cleanupUnknown = true;
    for (const r of g.resources) unsafe.add(r);
  }
  facts.push({
    ...base,
    state: unknown ? 'unknown' : cancelled ? 'interrupted' : exitCode === 0 ? 'passed' : 'failed',
    cleanup: unknown ? 'unknown' : 'confirmed',
    reason: unknown ? '夹具保留清理未确认' : cancelled ? '全局取消' : '',
    exitCode,
    counts,
    ...(g.kind === 'command'
      ? {
          command: g.command,
          artifacts: g.artifacts!.map((p) => ({ path: p, exists: fs.existsSync(p) })),
        }
      : {}),
    durationMs: performance.now() - began,
  });
}
const duration = performance.now() - started;
fs.writeFileSync(
  reportFile,
  JSON.stringify(
    {
      protocol: request.protocol,
      request,
      complete: true,
      cleanup: cleanupUnknown ? 'unknown' : 'confirmed',
      groups: facts,
      ...(environmentFailure ? { environmentFailure } : {}),
      timing: [
        {
          id: 'target',
          clock: 'target',
          utc,
          startMs: 0,
          durationMs: duration,
          phase: '目标执行 / 清理',
        },
      ],
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
process.exitCode = control.wrapperZero
  ? 0
  : facts.some(
        (f) => request.plan.groups.find((g) => g.id === f.id)!.required && f.state !== 'passed',
      )
    ? 1
    : 0;
