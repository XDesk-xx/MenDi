// MVP-D01-A Explore experiment only. This is not the MenDi product CLI.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

interface CommandResult {
  executable: string;
  args: string[];
  cwd: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
}
interface Root {
  path: string;
  source: string;
}
interface ListOutput {
  root: Root | null;
  changes: { name: string }[];
}
interface StatusOutput {
  root: Root;
  actionContext: { mode: string };
  isPlanningComplete: boolean;
  artifacts: { id: string; status: string }[];
}
interface ProbeProject {
  activeDeliveryId: string;
  deliveries: { id: string; manifestRef: string }[];
}
interface ProbeDelivery {
  id: string;
  state: string;
  activeChangeId: string;
  changeBindings: { changeId: string; stage: string }[];
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function errorCode(error: unknown): string {
  return error instanceof Error && 'code' in error && typeof error.code === 'string'
    ? error.code
    : 'probe-error';
}

const script = fileURLToPath(import.meta.url);
const repository = path.resolve(path.dirname(script), '../..');
const fixedCli = 'D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js';
const { parse: parseYaml } = createRequire(fixedCli)('yaml') as { parse(source: string): unknown };
const args = process.argv.slice(2);

function execute(
  program: string,
  parameters: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = process.env,
): CommandResult {
  const result = spawnSync(program, parameters, {
    cwd,
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
  });
  if (result.error) throw result.error;
  return {
    executable: program,
    args: parameters,
    cwd,
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function parseJson<T>(command: CommandResult): T {
  return JSON.parse(command.stdout);
}

function fault(code: string, detail: string) {
  return Object.assign(new Error(detail), { code });
}

function inspectLocalRoot(target: string, cli: string) {
  const canonical = fs.realpathSync(target);
  const config = path.join(canonical, 'openspec/config.yaml');
  if (!fs.existsSync(config)) throw fault('local-config-missing', config);
  let settings: unknown;
  try {
    settings = parseYaml(fs.readFileSync(config, 'utf8'));
  } catch (error) {
    throw fault('invalid-local-config', errorMessage(error));
  }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    throw fault('invalid-local-config', config);
  }
  const configObject = settings as Record<string, unknown>;
  if (Object.hasOwn(configObject, 'store')) {
    throw fault('unsupported-store-declaration', config);
  }
  if (configObject.schema !== undefined && configObject.schema !== 'spec-driven') {
    throw fault('unsupported-schema', String(configObject.schema));
  }
  const result = execute(process.execPath, [cli, 'list', '--json'], canonical);
  const output = parseJson<ListOutput>(result);
  if (result.exitCode !== 0 || !output.root) {
    throw fault('upstream-root-error', JSON.stringify(output));
  }
  if (output.root!.source !== 'nearest') {
    throw fault('unsupported-root-source', JSON.stringify(output.root));
  }
  if (path.relative(canonical, fs.realpathSync(output.root!.path)) !== '') {
    throw fault('root-mismatch', JSON.stringify(output.root));
  }
  return { canonical, output };
}

// A deliberately small storage probe: no Action writer, Review or lifecycle engine.
function probeOpen(target: string, changeId: string, cli: string) {
  const { canonical, output } = inspectLocalRoot(target, cli);
  if (!output.changes.some((change) => change.name === changeId)) {
    throw fault('change-not-found', changeId);
  }
  const mendi = path.join(canonical, '.mendi');
  if (fs.existsSync(mendi)) throw fault('existing-mendi-state', mendi);
  const deliveryId = 'proof-delivery';
  const manifestRef = `.mendi/delivery-groups/${deliveryId}/manifest.json`;
  const manifest = {
    id: deliveryId,
    title: '最小 Delivery 持久化实验',
    state: 'open',
    changeBindings: [{ changeId, stage: 'explore' }],
    activeChangeId: changeId,
  };
  fs.mkdirSync(path.dirname(path.join(canonical, manifestRef)), { recursive: true });
  fs.writeFileSync(path.join(canonical, manifestRef), JSON.stringify(manifest, null, 2) + '\n', {
    flag: 'wx',
  });
  fs.writeFileSync(
    path.join(mendi, 'project.json'),
    JSON.stringify(
      {
        name: 'proof-target',
        activeDeliveryId: deliveryId,
        deliveries: [{ id: deliveryId, manifestRef }],
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
  return { deliveryId, manifestRef, upstreamRoot: output.root };
}

function probeQuery(target: string, cli: string) {
  const { canonical } = inspectLocalRoot(target, cli);
  const project = JSON.parse(
    fs.readFileSync(path.join(canonical, '.mendi/project.json'), 'utf8'),
  ) as ProbeProject;
  const ref = project.deliveries.find(
    (delivery) => delivery.id === project.activeDeliveryId,
  )!.manifestRef;
  const delivery = JSON.parse(fs.readFileSync(path.join(canonical, ref), 'utf8')) as ProbeDelivery;
  const result = execute(
    process.execPath,
    [cli, 'status', '--change', delivery.activeChangeId, '--json'],
    canonical,
  );
  assert.equal(result.exitCode, 0, result.stderr || result.stdout);
  const upstream = parseJson<StatusOutput>(result);
  assert.equal(path.relative(canonical, fs.realpathSync(upstream.root!.path)), '');
  return {
    deliveryId: delivery.id,
    state: delivery.state,
    changeId: delivery.activeChangeId,
    next: delivery.changeBindings.find((change) => change.changeId === delivery.activeChangeId)!
      .stage,
    upstreamReady: upstream.artifacts
      .filter((artifact) => artifact.status === 'ready')
      .map((artifact) => artifact.id),
    upstreamPlanningComplete: upstream.isPlanningComplete,
  };
}

if (args[0] === 'probe-open' || args[0] === 'probe-query') {
  try {
    const result =
      args[0] === 'probe-open'
        ? probeOpen(args[1], args[2], args[3])
        : probeQuery(args[1], args[2]);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stdout.write(
      JSON.stringify({ error: errorCode(error), message: errorMessage(error) }, null, 2) + '\n',
    );
    process.exitCode = 1;
  }
} else {
  assert.equal(
    args[0],
    '--output',
    'Usage: node scripts/proofs/mvp-d01-a-explore.ts --output <new-result-directory>',
  );
  assert.ok(args[1], 'A fresh result directory is required.');
  const outputDir = path.resolve(args[1]);
  fs.mkdirSync(outputDir); // Never overwrite a prior attempt.
  fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
  const sandbox = fs.mkdtempSync(path.join(repository, '.tmp/mvp-d01-a-explore-'));
  const env = {
    ...process.env,
    XDG_CONFIG_HOME: path.join(sandbox, 'global-config'),
    XDG_DATA_HOME: path.join(sandbox, 'global-data'),
    OPENSPEC_TELEMETRY: '0',
  };
  const commands: CommandResult[] = [];
  const checks: { id: string; title: string; result: 'passed' | 'failed'; error?: string }[] = [];
  const observations: Record<string, unknown> = {};
  function call(parameters: string[], cwd: string) {
    const command = execute(process.execPath, [fixedCli, ...parameters], cwd, env);
    commands.push(command);
    return command;
  }
  function probe(mode: 'probe-open' | 'probe-query', target: string, changeId?: string) {
    const parameters =
      mode === 'probe-open'
        ? [script, mode, target, changeId!, fixedCli]
        : [script, mode, target, fixedCli];
    const command = execute(process.execPath, parameters, repository, env);
    commands.push(command);
    return command;
  }
  function check(id: string, title: string, action: () => void) {
    try {
      action();
      checks.push({ id, title, result: 'passed' });
      console.log(`PASS ${id}: ${title}`);
    } catch (error) {
      checks.push({ id, title, result: 'failed', error: errorMessage(error) });
      console.log(`FAIL ${id}: ${errorMessage(error)}`);
    }
  }
  function fixture(name: string) {
    const target = path.join(sandbox, name);
    fs.cpSync(path.join(repository, 'tests/fixtures', name), target, { recursive: true });
    return target;
  }
  function snapshot(target: string) {
    const files: Record<string, string> = {};
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else
          files[path.relative(target, file)] = createHash('sha256')
            .update(fs.readFileSync(file))
            .digest('hex');
      }
    }
    walk(target);
    return files;
  }
  const minimal = fixture('minimal-project');
  const existing = fixture('existing-openspec-project');
  const pointer = fixture('declared-store-project');
  const invalid = fixture('invalid-openspec-project');
  const initial = { minimal: snapshot(minimal), existing: snapshot(existing) };
  check('P01', '固定 OpenSpec 版本、新项目和已有 context / rules 的真实接入', () => {
    const version = call(['--version'], repository);
    assert.equal(version.exitCode, 0);
    assert.equal(version.stdout.trim(), '1.14.1');
    observations.openspecVersion = version.stdout.trim();
    for (const [target, prefix] of [
      [minimal, 'MINIMAL'],
      [existing, 'EXISTING'],
    ] as const) {
      const root = call(['list', '--json'], target);
      assert.equal(root.exitCode, 0);
      assert.equal(path.relative(target, parseJson<ListOutput>(root).root!.path), '');
      assert.equal(parseJson<ListOutput>(root).root!.source, 'nearest');
      const created = call(
        ['new', 'change', 'proof-entry', '--goal', '受控接入实验', '--json'],
        target,
      );
      assert.equal(created.exitCode, 0, created.stdout);
      assert.equal(parseJson<{ change: { schema: string } }>(created).change.schema, 'spec-driven');
      const list = call(['list', '--json'], target);
      assert.ok(
        parseJson<ListOutput>(list).changes.some((change) => change.name === 'proof-entry'),
      );
      const status = call(['status', '--change', 'proof-entry', '--json'], target);
      assert.equal(status.exitCode, 0, status.stdout);
      assert.equal(parseJson<StatusOutput>(status).actionContext.mode, 'repo-local');
      assert.equal(parseJson<StatusOutput>(status).isPlanningComplete, false);
      const instructions = call(
        ['instructions', 'proposal', '--change', 'proof-entry', '--json'],
        target,
      );
      assert.equal(instructions.exitCode, 0, instructions.stdout);
      assert.ok(
        parseJson<{ context: string; rules: string[] }>(instructions).context.includes(
          prefix + '_CONTEXT_SENTINEL',
        ),
      );
      assert.ok(
        parseJson<{ context: string; rules: string[] }>(instructions).rules.some((rule) =>
          rule.includes(prefix + '_PROPOSAL_RULE_SENTINEL'),
        ),
      );
      observations[prefix.toLowerCase() + 'Root'] = parseJson<ListOutput>(list).root;
    }
  });
  check('P02', '最小 Delivery 范围和 Change 关联可跨进程读回，已有状态不会覆盖', () => {
    for (const target of [minimal, existing]) {
      const opened = probe('probe-open', target, 'proof-entry');
      assert.equal(opened.exitCode, 0, opened.stdout);
      const queried = probe('probe-query', target);
      assert.equal(queried.exitCode, 0, queried.stdout);
      assert.deepEqual(parseJson<unknown>(queried), {
        deliveryId: 'proof-delivery',
        state: 'open',
        changeId: 'proof-entry',
        next: 'explore',
        upstreamReady: ['proposal'],
        upstreamPlanningComplete: false,
      });
      const beforeDuplicate = snapshot(target);
      const duplicate = probe('probe-open', target, 'proof-entry');
      assert.equal(duplicate.exitCode, 1);
      assert.equal(parseJson<{ error: string }>(duplicate).error, 'existing-mendi-state');
      assert.deepEqual(snapshot(target), beforeDuplicate);
    }
  });
  check('P03', '从目标子目录调用会选祖先根，显式目标守卫在写前拒绝', () => {
    const nested = path.join(existing, 'nested-target');
    fs.mkdirSync(nested);
    const before = snapshot(existing);
    const observed = call(['list', '--json'], nested);
    assert.equal(observed.exitCode, 0);
    assert.equal(path.relative(existing, parseJson<ListOutput>(observed).root!.path), '');
    observations.nestedRoot = parseJson<ListOutput>(observed).root;
    const refused = probe('probe-open', nested, 'proof-entry');
    assert.equal(refused.exitCode, 1);
    assert.equal(parseJson<{ error: string }>(refused).error, 'local-config-missing');
    assert.deepEqual(snapshot(existing), before);
  });
  check('P04', '裸 openspec 目录不构成目标根，拒绝采用仓库祖先根', () => {
    const empty = path.join(sandbox, 'empty-target');
    fs.mkdirSync(path.join(empty, 'openspec'), { recursive: true });
    const before = snapshot(empty);
    const observed = call(['list', '--json'], empty);
    assert.equal(observed.exitCode, 0);
    assert.equal(path.relative(repository, parseJson<ListOutput>(observed).root!.path), '');
    observations.emptyTargetRoot = parseJson<ListOutput>(observed).root;
    const refused = probe('probe-open', empty, 'proof-entry');
    assert.equal(refused.exitCode, 1);
    assert.equal(parseJson<{ error: string }>(refused).error, 'local-config-missing');
    assert.deepEqual(snapshot(empty), before);
  });
  check('P05', '声明未注册 store 或损坏配置时报告实际错误，目标不被写入', () => {
    for (const target of [pointer, invalid]) {
      const before = snapshot(target);
      const observed = call(['list', '--json'], target);
      assert.equal(observed.exitCode, 1, observed.stdout);
      assert.equal(parseJson<ListOutput>(observed).root, null);
      const refused = probe('probe-open', target, 'proof-entry');
      assert.equal(refused.exitCode, 1);
      assert.equal(
        parseJson<{ error: string }>(refused).error,
        target === pointer ? 'unsupported-store-declaration' : 'invalid-local-config',
      );
      assert.deepEqual(snapshot(target), before);
      observations[path.basename(target)] = parseJson<ListOutput>(observed);
    }
  });
  check('P06', '现有文档和配置字节保留；试验输出可以由受控输入重新生成', () => {
    for (const [name, target] of [
      ['minimal', minimal],
      ['existing', existing],
    ] as const) {
      const after = snapshot(target);
      for (const [file, digest] of Object.entries(initial[name]))
        assert.equal(after[file], digest, file);
    }
    assert.ok(
      fs.existsSync(path.join(existing, '.mendi/delivery-groups/proof-delivery/manifest.json')),
    );
    assert.ok(path.dirname(sandbox) === path.join(repository, '.tmp'));
    observations.sandboxInitiallyFresh = true;
  });
  check('P07', '真实本地规格结构会优先于 store / 损坏配置；接入实验仍在写前拒绝', () => {
    for (const target of [pointer, invalid]) {
      fs.mkdirSync(path.join(target, 'openspec/changes'));
      const before = snapshot(target);
      const observed = call(['list', '--json'], target);
      assert.equal(observed.exitCode, 0, observed.stdout);
      assert.equal(parseJson<ListOutput>(observed).root!.source, 'nearest');
      assert.equal(path.relative(target, parseJson<ListOutput>(observed).root!.path), '');
      const refused = probe('probe-open', target, 'proof-entry');
      assert.equal(refused.exitCode, 1);
      assert.equal(
        parseJson<{ error: string }>(refused).error,
        target === pointer ? 'unsupported-store-declaration' : 'invalid-local-config',
      );
      assert.deepEqual(snapshot(target), before);
      observations[path.basename(target) + '-with-planning-shape'] =
        parseJson<ListOutput>(observed);
    }
  });
  check('P08', '不存在的 Change 和其他 schema 在写前明确拒绝', () => {
    const beforeMissing = snapshot(minimal);
    const missing = probe('probe-open', minimal, 'missing-proof-change');
    assert.equal(missing.exitCode, 1);
    assert.equal(parseJson<{ error: string }>(missing).error, 'change-not-found');
    assert.deepEqual(snapshot(minimal), beforeMissing);
    const otherSchema = path.join(sandbox, 'other-schema-target');
    fs.mkdirSync(path.join(otherSchema, 'openspec'), { recursive: true });
    fs.writeFileSync(
      path.join(otherSchema, 'openspec/config.yaml'),
      'schema: custom-proof-schema\n',
    );
    const beforeSchema = snapshot(otherSchema);
    const refused = probe('probe-open', otherSchema, 'proof-entry');
    assert.equal(refused.exitCode, 1);
    assert.equal(parseJson<{ error: string }>(refused).error, 'unsupported-schema');
    assert.deepEqual(snapshot(otherSchema), beforeSchema);
  });
  const report = {
    kind: 'mendi-mvp-d01-a-explore-proof',
    recordedAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    openspecEntry: fixedCli,
    fixturesRef: 'tests/fixtures/',
    scriptRef: 'scripts/proofs/mvp-d01-a-explore.ts',
    sandbox,
    result: checks.every((item) => item.result === 'passed') ? 'passed' : 'failed',
    checks,
    observations,
    limitations: [
      'This is an experimental storage/root guard, not the MenDi product CLI.',
      'The two-file write does not establish crash recovery or concurrent writer safety.',
      'Next is a stored Explore stage projection; Review and later lifecycle policy are not implemented.',
      'Windows and the selected OpenSpec 1.14.1 only; registered stores, other schemas and platforms are not accepted here.',
      'A fresh experiment directory is used; the entire repository .tmp was not cleared.',
    ],
  };
  fs.writeFileSync(
    path.join(outputDir, 'commands.json'),
    JSON.stringify(commands, null, 2) + '\n',
    { flag: 'wx' },
  );
  fs.writeFileSync(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2) + '\n', {
    flag: 'wx',
  });
  process.exitCode = report.result === 'passed' ? 0 : 1;
}
