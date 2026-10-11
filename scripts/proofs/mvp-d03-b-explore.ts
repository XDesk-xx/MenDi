import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { uiCommand, pnpmEntry } from '../test-ui.ts';
import { readTargetMethod } from './d03-b/method-reading.ts';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.resolve(process.argv[2] ?? '');
const phase = process.argv[3];
assert.ok(
  process.argv[2] && ['prepare', 'verify'].includes(phase),
  '需要证据目录和 prepare / verify',
);
const cli = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const change = 'local-note-work';
let commandNumber = 0;
function run(name: string, cwd: string, args: string[], expected = 0) {
  const result = uiCommand(cwd, args);
  fs.writeFileSync(
    path.join(output, `${phase}-${++commandNumber}-${name}.json`),
    JSON.stringify(
      {
        cwd,
        executable: process.execPath,
        args,
        exitCode: result.status,
        signal: result.signal,
        error: result.error?.message,
        stdout: result.stdout,
        stderr: result.stderr,
      },
      null,
      2,
    ),
    { flag: 'wx' },
  );
  assert.equal(result.status, expected, `${name}: ${result.stderr || result.stdout}`);
  return result.stdout;
}
function save(name: string, value: unknown) {
  fs.writeFileSync(path.join(output, name + '.json'), JSON.stringify(value, null, 2) + '\n', {
    flag: 'wx',
  });
}
interface Session {
  installation: string;
  targets: string[];
  installedCLI: string;
  installedRoot: string;
}
if (phase === 'prepare') {
  assert.ok(!fs.existsSync(output), '证据目录已占用');
  fs.mkdirSync(output, { recursive: true });
  const installation = path.join('D:/tools/mendi/proofs/d03-b-009', path.basename(output));
  assert.ok(!fs.existsSync(installation), '独立安装目录已占用');
  run('build', repository, [path.join(repository, 'node_modules/typescript/bin/tsc')]);
  run('pack', repository, [pnpmEntry, 'pack', '--pack-destination', output]);
  fs.mkdirSync(installation, { recursive: true });
  fs.writeFileSync(
    path.join(installation, 'package.json'),
    JSON.stringify({ name: 'mendi-proof-install', private: true, type: 'module' }),
  );
  run('install', installation, [
    pnpmEntry,
    'add',
    '--offline',
    '--ignore-scripts',
    path.join(output, 'mendi-0.1.0.tgz'),
  ]);
  const installedRoot = fs.realpathSync(path.join(installation, 'node_modules/mendi'));
  assert.ok(!installedRoot.startsWith(repository), '仍在开发仓库中');
  const installedCLI = path.join(installedRoot, 'dist/drivers/cli.js');
  const sandbox = fs.mkdtempSync(path.join(repository, '.tmp/mendi-d03-b-009-'));
  const targets = ['alpha', 'beta'].map((name) => path.join(sandbox, name));
  for (const [index, target] of targets.entries()) {
    fs.cpSync(path.join(repository, 'tests/fixtures/d03-b-project'), target, { recursive: true });
    fs.renameSync(path.join(target, 'package-input.json'), path.join(target, 'package.json'));
    run(`init-${index}`, target, [
      cli,
      'init',
      '--tools',
      'codex',
      '--profile',
      'core',
      '--no-animation',
    ]);
    run(`new-${index}`, target, [cli, 'new', 'change', change]);
    fs.writeFileSync(
      path.join(target, 'scope.json'),
      JSON.stringify({
        goal: '独立安装与方法来源的受控探索',
        plannedChanges: [{ slot: 'A', title: '离线笔记', dependsOn: [] }],
      }),
    );
    run(`open-${index}`, installation, [
      installedCLI,
      'delivery',
      'open',
      '--project',
      target,
      '--id',
      `proof-${index}`,
      '--title',
      '方法交接探索',
      '--scope',
      'scope.json',
      '--role',
      'author',
      '--actor',
      'proof-author',
      '--json',
    ]);
    run(`bind-${index}`, installation, [
      installedCLI,
      'change',
      'bind',
      '--project',
      target,
      '--change',
      change,
      '--slot',
      'A',
      '--json',
    ]);
  }
  const handoffs = targets.map((target) => readTargetMethod(target, 'openspec-explore'));
  assert.notEqual(handoffs[0].file, handoffs[1].file);
  assert.ok(
    handoffs.every(
      (item) => item.metadata?.version === '1.0' && item.metadata.generatedBy === '1.14.1',
    ),
  );
  save(
    'actual-generated-methods',
    targets.map((target) => ({
      target,
      files: fs.readdirSync(path.join(target, '.agents/skills')),
      handoff: readTargetMethod(target, 'openspec-explore'),
    })),
  );
  save('official-propose', readTargetMethod(targets[0], 'openspec-propose'));
  const loaded = await import(
    pathToFileURL(path.join(installedRoot, 'dist/adapters/methods.js')).href
  );
  const bundled = loaded.loadMethods('apply', ['storybook']);
  assert.ok(bundled.stage.file.startsWith(installedRoot));
  assert.ok(bundled.guidance[0].file.startsWith(installedRoot));
  save('apply-storybook-combination', {
    bundled,
    upstreamCandidate: readTargetMethod(targets[0], 'openspec-apply-change'),
    caveat: '仅真实文件组合实验，当前产品没有目标方法接线，不认证 Apply 已执行。',
  });
  run('proposal-instructions', targets[0], [
    cli,
    'instructions',
    'proposal',
    '--change',
    change,
    '--json',
  ]);
  save('session', { installation, targets, installedCLI, installedRoot });
  console.log(JSON.stringify({ phase, installation, targets, result: 'prepared-and-readable' }));
} else {
  const { installation, targets, installedCLI, installedRoot } = JSON.parse(
    fs.readFileSync(path.join(output, 'session.json'), 'utf8'),
  ) as Session;
  const target = targets[0];
  const methodFile = path.join(target, '.agents/skills/openspec-explore/SKILL.md');
  const original = fs.readFileSync(methodFile);
  const projectBefore = fs.readFileSync(path.join(target, '.mendi/project.json'));
  const manifestFile = path.join(target, '.mendi/delivery-groups/proof-0/manifest.json');
  const manifestBefore = fs.readFileSync(manifestFile);
  const negatives: { case: string; error: string; recordsUnchanged: boolean }[] = [];
  const fail = (name: string, mutate: () => void, restore: () => void) => {
    mutate();
    try {
      let message = '';
      try {
        readTargetMethod(target, 'openspec-explore');
      } catch (error) {
        message = String(error);
      }
      assert.ok(message, `${name} 未拒绝`);
      assert.ok(projectBefore.equals(fs.readFileSync(path.join(target, '.mendi/project.json'))));
      assert.ok(manifestBefore.equals(fs.readFileSync(manifestFile)));
      negatives.push({ case: name, error: message, recordsUnchanged: true });
    } finally {
      restore();
    }
  };
  fail(
    'missing',
    () => fs.renameSync(methodFile, methodFile + '.saved'),
    () => fs.renameSync(methodFile + '.saved', methodFile),
  );
  fail(
    'unreadable-directory',
    () => {
      fs.unlinkSync(methodFile);
      fs.mkdirSync(methodFile);
    },
    () => {
      fs.rmdirSync(methodFile);
      fs.writeFileSync(methodFile, original);
    },
  );
  fail(
    'wrong-baseline',
    () =>
      fs.writeFileSync(
        methodFile,
        original.toString().replace('generatedBy: "1.14.1"', 'generatedBy: "1.14.0"'),
      ),
    () => fs.writeFileSync(methodFile, original),
  );
  fail(
    'wrong-identity',
    () =>
      fs.writeFileSync(
        methodFile,
        original.toString().replace('name: openspec-explore', 'name: unrelated-method'),
      ),
    () => fs.writeFileSync(methodFile, original),
  );
  save('candidate-negative-cases', {
    cases: negatives,
    limitation:
      'Explore 读取候选的前置实验；不是当前产品已经拒绝这些目标方法故障的证明。不可读负例为 EISDIR，不认证 Windows ACL。',
  });
  const unused = path.join(target, '.agents/skills/openspec-sync-specs');
  fs.renameSync(unused, unused + '.saved');
  try {
    readTargetMethod(target, 'openspec-explore');
    run('query-without-unrelated-method', installation, [
      installedCLI,
      'next',
      '--project',
      target,
      '--json',
    ]);
  } finally {
    fs.renameSync(unused + '.saved', unused);
  }
  const started = JSON.parse(
    run('start-installed', targets[1], [
      installedCLI,
      'action',
      'start',
      '--project',
      target,
      '--change',
      change,
      '--type',
      'explore',
      '--role',
      'author',
      '--actor',
      'proof-author',
      '--tool',
      'storybook',
      '--json',
    ]),
  );
  assert.ok(started.methods.stage.file.startsWith(installedRoot));
  assert.ok(started.methods.guidance[0].file.startsWith(installedRoot));
  fs.writeFileSync(
    path.join(target, 'notes.md'),
    '独立安装方法路径真实有效；目标上游读取仍需接线。',
  );
  run('save', installation, [
    installedCLI,
    'run',
    'save',
    '--project',
    target,
    '--run',
    started.run.ref,
    '--role',
    'author',
    '--actor',
    'proof-author',
    '--body',
    path.join(target, 'notes.md'),
    '--json',
  ]);
  run('continuing', installation, [
    installedCLI,
    'run',
    'submit',
    '--project',
    target,
    '--run',
    started.run.ref,
    '--role',
    'author',
    '--actor',
    'proof-author',
    '--outcome',
    'continuing',
    '--result',
    '方法交接边界探索',
    '--json',
  ]);
  const submitted = fs.readFileSync(path.join(target, started.run.ref));
  const submittedManifest = fs.readFileSync(manifestFile);
  const bundledFile = path.join(installedRoot, 'skills/actions/explore/SKILL.md');
  fs.renameSync(bundledFile, bundledFile + '.saved');
  try {
    run(
      'continue-missing-bundled',
      installation,
      [
        installedCLI,
        'action',
        'continue',
        '--project',
        target,
        '--action',
        started.run.actionId,
        '--role',
        'author',
        '--actor',
        'proof-author',
        '--json',
      ],
      1,
    );
    assert.ok(submitted.equals(fs.readFileSync(path.join(target, started.run.ref))));
    assert.ok(submittedManifest.equals(fs.readFileSync(manifestFile)));
    run('query-missing-bundled', installation, [
      installedCLI,
      'next',
      '--project',
      target,
      '--json',
    ]);
  } finally {
    fs.renameSync(bundledFile + '.saved', bundledFile);
  }
  const betaMethod = path.join(targets[1], '.agents/skills/openspec-explore/SKILL.md');
  fs.renameSync(betaMethod, betaMethod + '.saved');
  try {
    const gap = JSON.parse(
      run('current-product-missing-target-method', installation, [
        installedCLI,
        'action',
        'start',
        '--project',
        targets[1],
        '--change',
        change,
        '--type',
        'explore',
        '--role',
        'author',
        '--actor',
        'proof-author',
        '--json',
      ]),
    );
    assert.ok(gap.run.ref && !gap.methods.upstream);
    save('confirmed-product-gap', {
      currentProductAllocatedRun: gap.run.ref,
      targetMethodAbsent: true,
      message:
        '当前产品未读取目标上游方法；候选检查必须正式接入 start / continue。已有自有方法失败边界可复用。',
    });
  } finally {
    fs.renameSync(betaMethod + '.saved', betaMethod);
  }
  run('planning-validation', target, [cli, 'validate', change, '--strict', '--json']);
  const listed = JSON.parse(run('single-bound-change', target, [cli, 'list', '--json']));
  assert.equal(listed.changes.length, 1);
  assert.equal(listed.changes[0].name, change);
  const apply = JSON.parse(
    run('apply-instructions', target, [cli, 'instructions', 'apply', '--change', change, '--json']),
  );
  save('summary', {
    result: 'proof-supported',
    platform: process.platform,
    node: process.version,
    pnpmEntry,
    installation,
    independentBundledPaths: true,
    targetMethodHandoff: true,
    metadataDistinguished: true,
    candidateNegativeCases: negatives.length,
    productContinueFailurePreservedBytes: true,
    currentProductGapConfirmed: true,
    existingChangeCount: 1,
    applyState: apply.state,
    noReviewerRun: true,
    noArchiveExecuted: true,
    limitations: [
      'Explore 候选读取未接入产品',
      '离线安装使用已有 store，非冷安装认证',
      '不可读使用 EISDIR，非 ACL 认证',
      '只有 Windows / pnpm 与当前上游基线',
      '未认证 WebCodex、Vue、MCP 或完整真实交付',
    ],
  });
  console.log(JSON.stringify({ phase, result: 'proof-supported', output }));
}
