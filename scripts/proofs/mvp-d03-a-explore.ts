import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { assertStories, launch, pnpmEntry, run, stopOwned, waitReady } from './d03-a/processes.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
assert.ok(process.argv[2], '需要新证据目录，不覆盖旧结果。');
const output = path.resolve(process.argv[2]);
assert.ok(!fs.existsSync(output), '证据目录已存在，另选新目录。');
fs.mkdirSync(output);
const commands = path.join(output, 'commands');
fs.mkdirSync(commands);
const fixture = path.join(repo, 'tests/fixtures/storybook-project');
fs.mkdirSync(path.join(repo, '.tmp'), { recursive: true });
const sandbox = fs.mkdtempSync(path.join(repo, '.tmp/mendi-d03-a-'));
const target = path.join(sandbox, 'ui-target');
fs.cpSync(fixture, target, {
  recursive: true,
  filter: (source) => !path.relative(fixture, source).split(path.sep).includes('node_modules'),
});
const cli = path.join(repo, 'dist/drivers/cli.js');
const scenes: Record<string, unknown>[] = [];
const packageInput = fs.readFileSync(path.join(repo, 'package.json'));
await run(commands, 'dependencies', target, [
  pnpmEntry,
  'install',
  '--frozen-lockfile',
  '--offline',
  '--ignore-scripts',
]);
await run(commands, 'target-typecheck', target, [pnpmEntry, 'run', 'typecheck']);
const opened = await run(commands, 'target-open', repo, [
  cli,
  'delivery',
  'open',
  '--project',
  target,
  '--id',
  'proof-ui',
  '--title',
  'Storybook proof',
  '--scope',
  'delivery-scope.json',
  '--role',
  'author',
  '--actor',
  'd03-a-proof-author',
  '--json',
]);
assert.equal(JSON.parse(opened.stdout).ok, true);
const listed = await run(commands, 'entries', repo, [
  cli,
  'test',
  'list',
  '--project',
  target,
  '--json',
]);
fs.writeFileSync(path.join(output, 'entries.json'), listed.stdout);
const service = launch(commands, 'storybook-service', target, [
  pnpmEntry,
  'run',
  'preview:components',
]);
let stopped = false;
try {
  const index = await waitReady(service);
  fs.writeFileSync(path.join(output, 'story-index.json'), JSON.stringify(index, null, 2) + '\n');
  const execute = async (name: string, expectedExit: number) => {
    const result = await run(
      commands,
      name,
      repo,
      [
        cli,
        'test',
        'run',
        '--project',
        target,
        '--kind',
        'focused',
        '--actor',
        'd03-a-proof-author',
        '--pnpm-bin',
        pnpmEntry,
        '--json',
      ],
      expectedExit,
    );
    const value = JSON.parse(result.stdout);
    fs.writeFileSync(path.join(output, name + '.json'), result.stdout);
    return value;
  };
  const first = await execute('baseline-stories', 0);
  assert.equal(first.outcome, 'passed');
  const browser = await run(commands, 'baseline-browser', target, [
    pnpmEntry,
    'run',
    'inspect:browser',
    path.join(output, 'baseline-browser'),
    '次数：',
  ]);
  scenes.push({
    id: 'P01',
    purpose: '真实组件渲染、用户点击和 disabled 状态；已有异名脚本接入',
    outcome: first.outcome,
    browserLog: browser.result,
    executionId: first.executionId,
  });
  const source = path.join(target, 'src/Counter.ts');
  const original = fs.readFileSync(source, 'utf8');
  assert.ok(original.includes('count += 1;'));
  fs.writeFileSync(source, original.replace('count += 1;', 'count += 2;'));
  const negative = await execute('defect-stories', 1);
  assert.equal(negative.outcome, 'failed');
  fs.writeFileSync(source, original.replace("'次数：'", "'确认次数：'"));
  const fresh = await execute('changed-stories', 0);
  assert.equal(fresh.outcome, 'passed');
  assert.notEqual(first.executionId, fresh.executionId);
  await run(commands, 'changed-browser', target, [
    pnpmEntry,
    'run',
    'inspect:browser',
    path.join(output, 'changed-browser'),
    '确认次数：',
  ]);
  const prior = await run(commands, 'old-result-readback', repo, [
    cli,
    'test',
    'status',
    '--project',
    target,
    '--execution',
    first.executionId,
    '--json',
  ]);
  fs.writeFileSync(path.join(output, 'old-result-readback.json'), prior.stdout);
  scenes.push({
    id: 'P02',
    purpose: '真实错误必须失败；源修改后重新验证，不沿用旧视觉或旧 PASS',
    baseline: first.executionId,
    defect: negative.executionId,
    changed: fresh.executionId,
  });
  const reuseIndex = await assertStories('http://127.0.0.1:6113');
  assert.equal(service.finished(), false);
  assert.deepEqual(Object.keys(reuseIndex.entries), Object.keys(index.entries));
  const foreign = createServer((_request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ entries: {} }));
  });
  await new Promise<void>((resolve) => foreign.listen(0, '127.0.0.1', resolve));
  try {
    const address = foreign.address();
    assert.ok(address && typeof address !== 'string');
    const url = 'http://127.0.0.1:' + address.port;
    assert.equal((await fetch(url + '/index.json')).status, 200);
    await assert.rejects(() => assertStories(url));
    scenes.push({
      id: 'P03',
      purpose: '复用已知本次服务不再启动；HTTP 200 不等于正确 Storybook',
      ownedChildPid: service.child.pid,
      targetRoot: target,
      command: 'preview:components',
      reused: true,
      foreignHttp200Rejected: true,
      limit:
        '只认证已掌握启动根与命令的本次服务；任意既有服务归属与同 story ID 的异项目须进一步明确，不能只凭 index 推断。',
    });
  } finally {
    await new Promise<void>((resolve, reject) =>
      foreign.close((error) => (error ? reject(error) : resolve())),
    );
  }
  const stop = await stopOwned(commands, service);
  stopped = true;
  scenes.push({
    id: 'P04',
    purpose: '只停止实际启动的本次服务，确认 child / 日志关闭和监听不可用',
    ...stop,
  });
} finally {
  if (!stopped && !service.finished()) await stopOwned(commands, service);
}
const noUi = path.join(sandbox, 'no-ui');
fs.mkdirSync(path.join(noUi, 'openspec'), { recursive: true });
fs.copyFileSync(
  path.join(fixture, 'openspec/config.yaml'),
  path.join(noUi, 'openspec/config.yaml'),
);
fs.writeFileSync(
  path.join(noUi, 'package.json'),
  JSON.stringify({ name: 'no-ui-proof', private: true, type: 'module', scripts: {} }),
);
fs.writeFileSync(
  path.join(noUi, 'scope.json'),
  JSON.stringify({
    goal: '无 UI 项目不依赖 Storybook / MCP',
    plannedChanges: [{ slot: 'Backend', title: '本地后台目标', dependsOn: [] }],
  }),
);
await run(commands, 'no-ui-open', repo, [
  cli,
  'delivery',
  'open',
  '--project',
  noUi,
  '--id',
  'no-ui',
  '--title',
  'No UI proof',
  '--scope',
  'scope.json',
  '--json',
]);
const noUiNext = await run(commands, 'no-ui-next', repo, [
  cli,
  'next',
  '--project',
  noUi,
  '--json',
]);
assert.equal(JSON.parse(noUiNext.stdout).ok, true);
assert.ok(!fs.existsSync(path.join(noUi, 'node_modules')));
assert.ok(fs.readFileSync(path.join(repo, 'package.json')).equals(packageInput));
scenes.push({
  id: 'P05',
  purpose: '无 Storybook / MCP / node_modules 的隔离非 UI 项目仍可 Open / query',
  outcome: 'passed',
  limit: '不是无 UI 项目的完整实施或正式验收。',
});
const executions = path.join(target, '.mendi/delivery-groups/proof-ui/tests');
fs.cpSync(executions, path.join(output, 'product-test-results'), { recursive: true });
const report = {
  result: 'proof-supported',
  target,
  noUi,
  sandbox,
  versions: {
    node: process.version,
    pnpm: '11.22.0',
    storybook: '10.6.1',
    renderer: '@storybook/html-vite',
    vitestAddon: '10.6.1',
    vitest: '4.1.11',
    playwright: '1.60.0',
    vite: '8.3.0',
  },
  scenes,
  mcp: { enabled: false, verified: false },
  limits: [
    '仅 HTML-Vite / Windows 的受控组件，未认证 React / Vue / MCP 或生产接线。',
    '服务复用只有本次启动的明确对象，不证明未知既有服务归属。',
    '未改产品 src，不作正式 Full Test 或独立 Review verdict。',
  ],
};
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
