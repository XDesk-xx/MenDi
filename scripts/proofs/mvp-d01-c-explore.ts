// Rebuildable Explore experiment; P07 now verifies the implemented local save.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fork, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startAction, saveRun, submitRun } from '../../src/application/actions.ts';
import { writeAction, replaceDraft } from '../../src/adapters/action-store.ts';
import { readWorkspace } from '../../src/adapters/workspace.ts';
import { currentRun, readRun } from '../../src/adapters/runs.ts';
import { managedPath } from '../../src/adapters/paths.ts';
import { inspectProject } from '../../src/adapters/project.ts';
import { runProcess, type ProcessRunner } from '../../src/adapters/openspec.ts';
import { MendiError } from '../../src/core/errors.ts';
import { fixture, isolatedEnv, openspecEntry, repository, scopeFile } from '../../tests/helpers.ts';

const script = fileURLToPath(import.meta.url);
const [mode, project, operation, phase] = process.argv.slice(2);
function errorRecord(error: unknown) {
  return error instanceof MendiError
    ? { code: error.code, message: error.message, details: error.details }
    : { message: String(error) };
}
if (mode === '--fault' || mode === '--hold') {
  try {
    const observeWrite = (observed: string) => {
      if (mode === '--fault' && observed === phase) throw new Error(`injected ${phase}`);
      if (mode !== '--hold' || observed !== 'lock-acquired') return;
      process.send?.({ ready: true });
      const deadline = Date.now() + 15_000;
      while (!fs.existsSync(operation)) {
        if (Date.now() > deadline) throw new Error('release timed out');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
      }
    };
    const result =
      operation === 'submit'
        ? submitRun(
            {
              project,
              role: 'author',
              actor: 'author-one',
              runRef: currentRun(project, readWorkspace(project)!)!.ref,
              outcome: 'complete',
              result: '受控完成提交；故障在替换之后注入',
            },
            { observeWrite },
          )
        : startAction(
            {
              project,
              changeId: 'proof-entry',
              type: 'explore',
              role: 'author',
              actor: 'author-one',
            },
            { observeWrite },
          );
    console.log(JSON.stringify({ ok: true, result }));
  } catch (error) {
    console.log(JSON.stringify({ ok: false, error: errorRecord(error) }));
    process.exitCode = 1;
  }
} else {
  assert.equal(
    mode,
    '--output',
    'usage: node scripts/proofs/mvp-d01-c-explore.ts --output <new-directory>',
  );
  const output = path.resolve(project);
  fs.mkdirSync(output, { recursive: false });
  fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
  const parent = fs.mkdtempSync(path.join(repository, '.tmp/mvp-d01-c-explore-'));
  const env = isolatedEnv(parent);
  const commands: unknown[] = [];
  const observations: unknown[] = [];
  const cases: { id: string; purpose: string; status: string; observation: unknown }[] = [];
  function command(entry: string, args: string[], cwd: string, expected = 0) {
    const result = spawnSync(process.execPath, [entry, ...args], {
      cwd,
      env,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30_000,
    });
    commands.push({
      entry,
      args,
      cwd,
      exitCode: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.equal(result.status, expected, result.stdout + result.stderr);
    return JSON.parse(result.stdout) as ReturnType<typeof startAction> & {
      error: { code: string };
      artifactId: string;
      context: string;
      rules: string[];
      instruction: string;
      template: string;
    };
  }
  function cli(root: string, args: string[], expected = 0) {
    return command(
      path.join(repository, 'dist/drivers/cli.js'),
      [...args, '--project', root, '--json'],
      root,
      expected,
    );
  }
  function target(name: string) {
    const root = fixture(parent, 'minimal-project', name);
    command(openspecEntry, ['new', 'change', 'proof-entry', '--json'], root);
    cli(root, [
      'delivery',
      'open',
      '--id',
      'd01',
      '--title',
      'C Explore 受控目标',
      '--scope',
      scopeFile(root),
      '--change',
      'proof-entry',
      '--slot',
      'A',
    ]);
    fs.writeFileSync(
      path.join(root, 'body.md'),
      '受控实验工作；不作为 MenDi 当前 Change 的审核。\n',
    );
    return root;
  }
  function start(root: string, type = 'explore', extra: string[] = []) {
    return cli(root, [
      'action',
      'start',
      '--change',
      'proof-entry',
      '--type',
      type,
      '--role',
      type.startsWith('review') ? 'reviewer' : 'author',
      '--actor',
      type.startsWith('review') ? 'reviewer-one' : 'author-one',
      ...extra,
    ]);
  }
  function save(root: string, ref: string, role = 'author') {
    return cli(root, [
      'run',
      'save',
      '--run',
      ref,
      '--role',
      role,
      '--actor',
      `${role}-one`,
      '--body',
      'body.md',
    ]);
  }
  function submit(root: string, ref: string, outcome = 'complete', verdict?: string) {
    const role = verdict ? 'reviewer' : 'author';
    return cli(root, [
      'run',
      'submit',
      '--run',
      ref,
      '--role',
      role,
      '--actor',
      `${role}-one`,
      '--outcome',
      outcome,
      '--result',
      '受控实验结果',
      ...(verdict ? ['--verdict', verdict] : []),
    ]);
  }
  function bytes(root: string, ref: string) {
    return fs.readFileSync(managedPath(root, ref));
  }
  function scene(root: string, refs: string[]) {
    const files: Record<string, string> = {};
    for (const ref of [...refs, '.mendi/write.lock']) {
      files[ref] = bytes(root, ref).toString('utf8');
      const directory = path.posix.dirname(ref);
      const prefix = path.posix.basename(ref) + '.';
      for (const name of fs.readdirSync(managedPath(root, directory))) {
        if (name.startsWith(prefix) && name.endsWith('.tmp')) {
          const temporary = `${directory}/${name}`;
          files[temporary] = bytes(root, temporary).toString('utf8');
        }
      }
    }
    return files;
  }
  function expectedError(action: () => unknown, code: string) {
    let record: unknown;
    assert.throws(action, (error) => {
      assert.ok(error instanceof MendiError);
      assert.equal(error.code, code);
      record = errorRecord(error);
      return true;
    });
    observations.push(record);
    return record;
  }
  function pass(id: string, purpose: string, observation: unknown) {
    cases.push({ id, purpose, status: 'passed', observation });
    console.log(`${id} passed: ${purpose}`);
  }
  // The candidate uses current local safety adapters. It deliberately never selects OpenSpec.
  // Formal submit/review continue remain the real application operations below.
  function candidateLocalSave(
    root: string,
    ref: string,
    actor = 'author-one',
    role = 'author',
    bodyFile = 'body.md',
  ) {
    root = inspectProject(root).root;
    const body = fs.readFileSync(path.resolve(root, bodyFile), 'utf8');
    return writeAction(root, 'explore-candidate-local-save', (workspace, written) => {
      assert.equal(workspace.state, 'open');
      assert.ok(workspace.activeChangeId);
      const run = currentRun(root, workspace);
      if (!run || run.ref !== ref) throw new MendiError('run-not-current', '实验：必须是当前 Run');
      if (run.record.actorId !== actor || run.record.role !== role)
        throw new MendiError('action-role-mismatch', '实验：角色 / actor 不匹配');
      if (run.record.status !== 'draft')
        throw new MendiError('run-already-submitted', '实验：不能改提交');
      return replaceDraft(root, run, run.header, body, written);
    });
  }
  let failed: unknown;
  try {
    const root = target('stage-and-actors');
    const instructions = command(
      openspecEntry,
      ['instructions', 'proposal', '--change', 'proof-entry', '--json'],
      root,
    );
    assert.equal(instructions.artifactId, 'proposal');
    assert.match(instructions.context, /MINIMAL_CONTEXT_SENTINEL/);
    assert.ok(instructions.rules.some((rule) => rule.includes('MINIMAL_PROPOSAL_RULE_SENTINEL')));
    assert.ok(instructions.instruction.length && instructions.template.length);
    const first = start(root, 'explore', ['--tool', 'openspec']);
    assert.match(JSON.stringify(first.methods), /真实 proof/);
    assert.equal(first.run.status, 'draft');
    assert.equal(first.next.action, 'run-save-or-submit');
    pass('P01', '真实 instructions / context / rules 与阶段方法可读，未自动生成方案或批准', {
      root,
      instructions,
      methods: first.methods,
      next: first.next,
    });

    save(root, first.run.ref);
    submit(root, first.run.ref, 'continuing');
    const firstBytes = bytes(root, first.run.ref);
    const wrongActor = cli(
      root,
      [
        'action',
        'continue',
        '--action',
        first.run.actionId,
        '--role',
        'author',
        '--actor',
        'new-session-label',
      ],
      1,
    );
    assert.equal(wrongActor.error.code, 'action-role-mismatch');
    const second = cli(root, [
      'action',
      'continue',
      '--action',
      first.run.actionId,
      '--role',
      'author',
      '--actor',
      'author-one',
    ]);
    assert.equal(second.run.actionId, first.run.actionId);
    assert.deepEqual(bytes(root, first.run.ref), firstBytes);
    const wrongDraftActor = cli(
      root,
      [
        'run',
        'save',
        '--run',
        second.run.ref,
        '--role',
        'author',
        '--actor',
        'new-session-label',
        '--body',
        'body.md',
      ],
      1,
    );
    assert.equal(wrongDraftActor.error.code, 'action-role-mismatch');
    save(root, second.run.ref);
    submit(root, second.run.ref);
    pass('P02', '新进程沿用稳定 actor 可继续，换标签与接管 draft 拒绝', {
      first: first.run.ref,
      second: second.run.ref,
      actionId: second.run.actionId,
      rejected: [wrongActor.error, wrongDraftActor.error],
    });

    const review = start(root, 'review-explore', ['--author-run', second.run.ref]);
    save(root, review.run.ref, 'reviewer');
    submit(root, review.run.ref, 'complete', 'changes-requested');
    const requestedBytes = bytes(root, review.run.ref);
    const revision = start(root, 'revise-explore', ['--revises', second.run.ref]);
    save(root, revision.run.ref);
    submit(root, revision.run.ref);
    const rejection = start(root, 'review-explore', ['--author-run', revision.run.ref]);
    save(root, rejection.run.ref, 'reviewer');
    const rejected = submit(root, rejection.run.ref, 'complete', 'rejected');
    const rejectedBytes = bytes(root, rejection.run.ref);
    assert.equal(rejected.next.role, 'owner');
    const restart = cli(
      root,
      [
        'action',
        'start',
        '--change',
        'proof-entry',
        '--type',
        'revise-explore',
        '--role',
        'author',
        '--actor',
        'author-one',
        '--revises',
        revision.run.ref,
      ],
      1,
    );
    const resume = cli(
      root,
      [
        'action',
        'continue',
        '--action',
        rejection.run.actionId,
        '--role',
        'reviewer',
        '--actor',
        'reviewer-one',
      ],
      1,
    );
    assert.equal(restart.error.code, 'action-state-conflict');
    assert.equal(resume.error.code, 'action-state-conflict');
    assert.deepEqual(bytes(root, rejection.run.ref), rejectedBytes);
    assert.deepEqual(bytes(root, review.run.ref), requestedBytes);
    pass('P03', '修改要求可进入新修订；rejected 停在 Owner 且没有普通恢复入口', {
      requested: review.run.ref,
      revision: revision.run.ref,
      rejected: rejection.run.ref,
      next: rejected.next,
      errors: [restart.error, resume.error],
      fixtureVerdictsOnly: true,
    });

    const heldRoot = target('live-lock');
    const release = path.join(heldRoot, 'release');
    const child = fork(script, ['--hold', heldRoot, release], {
      cwd: heldRoot,
      env,
      silent: true,
      windowsHide: true,
    });
    let childOutput = '';
    child.stdout?.on('data', (chunk) => {
      childOutput += String(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      childOutput += String(chunk);
    });
    const exited = new Promise<number | null>((resolve) => child.once('exit', resolve));
    try {
      await new Promise<void>((resolve, reject) => {
        child.once('message', () => resolve());
        child.once('error', reject);
        child.once('exit', () => reject(new Error('writer exited before lock ready')));
      });
      const lock = bytes(heldRoot, '.mendi/write.lock');
      assert.equal(JSON.parse(lock.toString()).pid, child.pid);
      const query = cli(heldRoot, ['status'], 1);
      const writer = cli(
        heldRoot,
        [
          'action',
          'start',
          '--change',
          'proof-entry',
          '--type',
          'explore',
          '--role',
          'author',
          '--actor',
          'other',
        ],
        1,
      );
      assert.equal(query.error.code, 'write-in-progress-or-interrupted');
      assert.equal(writer.error.code, 'write-in-progress-or-interrupted');
      assert.deepEqual(bytes(heldRoot, '.mendi/write.lock'), lock);
      observations.push({
        liveWriterPid: child.pid,
        lock: JSON.parse(lock.toString()),
        query: query.error,
        writer: writer.error,
      });
    } finally {
      fs.writeFileSync(release, 'release');
      assert.equal(await exited, 0, childOutput);
      commands.push({
        entry: script,
        args: ['--hold', heldRoot, release],
        stdout: childOutput,
        exitCode: 0,
      });
    }
    assert.ok(!fs.existsSync(path.join(heldRoot, '.mendi/write.lock')));
    cli(heldRoot, ['status']);
    pass('P04', '真实活跃写者持锁时查询 / 第二写者拒绝，原写者正常退出后可查', {
      root: heldRoot,
      childPid: child.pid,
    });

    const beforeRoot = target('before-pointer');
    const manifestRef = '.mendi/delivery-groups/d01/manifest.json';
    const manifestBytes = bytes(beforeRoot, manifestRef);
    const before = command(
      script,
      ['--fault', beforeRoot, 'start', 'before-manifest-commit'],
      beforeRoot,
      1,
    );
    assert.equal(before.error.code, 'workspace-write-failed');
    assert.deepEqual(bytes(beforeRoot, manifestRef), manifestBytes);
    const reservation = '.mendi/runs/d01/001-changes/proof-entry/001-explore/run.md';
    assert.equal(readRun(beforeRoot, reservation, 'd01', 'proof-entry').record.status, 'draft');
    assert.equal(cli(beforeRoot, ['status'], 1).error.code, 'write-in-progress-or-interrupted');
    pass('P05', '指针提交前失败：已写 draft 不等于已关联成功，保留锁 / 临时 manifest / 占号', {
      root: beforeRoot,
      error: before.error,
      originalManifestUnchanged: true,
      reservation,
      scene: scene(beforeRoot, [manifestRef, reservation]),
    });

    const afterRoot = target('after-submit');
    const draft = start(afterRoot);
    save(afterRoot, draft.run.ref);
    const after = command(
      script,
      ['--fault', afterRoot, 'submit', 'before-readback'],
      afterRoot,
      1,
    );
    assert.equal(after.error.code, 'workspace-write-failed');
    const committed = readRun(afterRoot, draft.run.ref, 'd01', 'proof-entry');
    assert.equal(committed.record.status, 'submitted');
    assert.equal(committed.record.outcome, 'complete');
    const committedBytes = bytes(afterRoot, draft.run.ref);
    assert.equal(cli(afterRoot, ['status'], 1).error.code, 'write-in-progress-or-interrupted');
    assert.equal(
      cli(
        afterRoot,
        [
          'run',
          'submit',
          '--run',
          draft.run.ref,
          '--role',
          'author',
          '--actor',
          'author-one',
          '--outcome',
          'complete',
          '--result',
          '不得重提',
        ],
        1,
      ).error.code,
      'write-in-progress-or-interrupted',
    );
    assert.deepEqual(bytes(afterRoot, draft.run.ref), committedBytes);
    pass('P06', '提交替换后报告失败：实际 submitted 保留，不能把非零退出当成未提交或自动重提', {
      root: afterRoot,
      error: after.error,
      committed: committed.record,
      failedChildHasExited: true,
      scene: scene(afterRoot, [manifestRef, draft.run.ref]),
    });

    const offlineRoot = target('upstream-status-unavailable');
    const offlineDraft = start(offlineRoot);
    const upstreamCalls: unknown[] = [];
    const unavailable: ProcessRunner = (entry, args, cwd) => {
      const result =
        args[0] === 'status'
          ? {
              status: 1,
              signal: null,
              stdout: '',
              stderr: 'controlled status outage; version/list use real fixed CLI',
            }
          : runProcess(entry, args, cwd);
      upstreamCalls.push({ entry, args, cwd, ...result });
      return result;
    };
    const input = {
      project: offlineRoot,
      role: 'author',
      actor: 'author-one',
      runRef: offlineDraft.run.ref,
    };
    const saved = saveRun({ ...input, bodyFile: 'body.md' }, { runner: unavailable });
    assert.equal(upstreamCalls.length, 0);
    assert.equal(saved.executionMode, 'local-only');
    assert.equal(saved.openspec, null);
    const offlineBytes = bytes(offlineRoot, offlineDraft.run.ref);
    expectedError(
      () =>
        submitRun(
          { ...input, outcome: 'complete', result: 'failure note' },
          { runner: unavailable },
        ),
      'upstream-execution-failed',
    );
    assert.deepEqual(bytes(offlineRoot, offlineDraft.run.ref), offlineBytes);
    candidateLocalSave(offlineRoot, offlineDraft.run.ref);
    assert.match(
      readRun(offlineRoot, offlineDraft.run.ref, 'd01', 'proof-entry').body,
      /受控实验工作/,
    );
    assert.equal(currentRun(offlineRoot, readWorkspace(offlineRoot)!)!.record.status, 'draft');
    pass('P07', '产品 save 不访问上游，正式 submit 仍依赖 status；草稿保存不完成提交', {
      root: offlineRoot,
      upstreamCalls,
      candidateOnly: false,
    });

    const candidateBytes = bytes(offlineRoot, offlineDraft.run.ref);
    expectedError(
      () => candidateLocalSave(offlineRoot, offlineDraft.run.ref, 'other'),
      'action-role-mismatch',
    );
    expectedError(
      () => candidateLocalSave(offlineRoot, offlineDraft.run.ref, 'author-one', 'reviewer'),
      'action-role-mismatch',
    );
    expectedError(() => candidateLocalSave(offlineRoot, 'missing-old-run.md'), 'run-not-current');
    assert.throws(
      () =>
        candidateLocalSave(
          offlineRoot,
          offlineDraft.run.ref,
          'author-one',
          'author',
          'missing-body.md',
        ),
      /ENOENT/,
    );
    const runFile = managedPath(offlineRoot, offlineDraft.run.ref);
    fs.renameSync(runFile, `${runFile}.held`);
    try {
      expectedError(
        () => candidateLocalSave(offlineRoot, offlineDraft.run.ref),
        'run-input-missing',
      );
    } finally {
      fs.renameSync(`${runFile}.held`, runFile);
    }
    const savedManifest = bytes(offlineRoot, manifestRef);
    expectedError(() => managedPath(offlineRoot, '../outside/run.md'), 'unsafe-reference');
    const invalidManifest = JSON.parse(savedManifest.toString());
    invalidManifest.changeBindings[0].latestRunRef = '../outside/run.md';
    fs.writeFileSync(managedPath(offlineRoot, manifestRef), JSON.stringify(invalidManifest));
    try {
      expectedError(() => candidateLocalSave(offlineRoot, '../outside/run.md'), 'invalid-record');
    } finally {
      fs.writeFileSync(managedPath(offlineRoot, manifestRef), savedManifest);
    }
    expectedError(() => candidateLocalSave(afterRoot, draft.run.ref), 'write-conflict');
    const config = path.join(offlineRoot, 'openspec/config.yaml');
    fs.renameSync(config, `${config}.held`);
    try {
      expectedError(
        () => candidateLocalSave(offlineRoot, offlineDraft.run.ref),
        'local-config-missing',
      );
    } finally {
      fs.renameSync(`${config}.held`, config);
    }
    assert.deepEqual(bytes(offlineRoot, offlineDraft.run.ref), candidateBytes);
    submit(offlineRoot, offlineDraft.run.ref);
    expectedError(
      () => candidateLocalSave(offlineRoot, offlineDraft.run.ref),
      'run-already-submitted',
    );
    const reviewer = start(offlineRoot, 'review-explore', ['--author-run', offlineDraft.run.ref]);
    const authorFile = managedPath(offlineRoot, offlineDraft.run.ref);
    fs.renameSync(authorFile, `${authorFile}.held`);
    try {
      candidateLocalSave(offlineRoot, reviewer.run.ref, 'reviewer-one', 'reviewer');
      expectedError(
        () =>
          submitRun({
            project: offlineRoot,
            runRef: reviewer.run.ref,
            role: 'reviewer',
            actor: 'reviewer-one',
            outcome: 'complete',
            result: '不能跳过必要 Author 输入',
            verdict: 'approved',
          }),
        'run-input-missing',
      );
    } finally {
      fs.renameSync(`${authorFile}.held`, authorFile);
    }
    pass(
      'P08',
      '本地候选保存仍拒绝错身份 / 陈旧 / 缺失 / 越界 / 锁 / 已提交；Review 正式提交仍要求固定 Author',
      { root: offlineRoot, unchangedOnRejectedSaves: true, candidateReviewSaveIsDraftOnly: true },
    );
  } catch (error) {
    failed = errorRecord(error);
  }
  const report = {
    node: process.version,
    openspecEntry,
    sandbox: parent,
    cases,
    passed: cases.length,
    total: 8,
    observations,
    ...(failed ? { failure: failed } : {}),
    limitations: [
      'fixture verdicts are not independent review of this Change',
      'status outage is injected at ProcessRunner; version/list and all normal CLI paths are real',
      'candidate local save exists only in this proof script',
      'fault observers are controlled exceptions, not arbitrary power-loss durability',
      'Owner resolution is covered separately; no lock disposition product command is implemented',
    ],
  };
  fs.writeFileSync(path.join(output, 'commands.json'), JSON.stringify(commands, null, 2) + '\n', {
    flag: 'wx',
  });
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', {
    flag: 'wx',
  });
  console.log(
    JSON.stringify({
      passed: cases.length,
      total: 8,
      commands: commands.length,
      output,
      ...(failed ? { failure: failed } : {}),
    }),
  );
  if (failed) process.exitCode = 1;
}
