import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import type { InstallationSession } from '../../scripts/prepare-installation-tests.ts';

test('真实安装、双目标 / 跨 cwd、新交接失败与恢复、Storybook 并用和已有 Change Propose 交接', () => {
  const input = process.env.MENDI_INSTALLATION_SESSION;
  assert.ok(
    input && path.isAbsolute(input),
    '先显式准备并设置 MENDI_INSTALLATION_SESSION；不自动安装或跳过',
  );
  const session = JSON.parse(fs.readFileSync(input, 'utf8')) as InstallationSession;
  assert.ok(session.targets.length === 2 && fs.existsSync(session.installedCLI));
  const [alpha, beta] = session.targets;
  const evidence = path.join(session.evidence, 'handoff');
  assert.ok(!fs.existsSync(evidence), '需要新测试结果，不覆盖旧证据');
  fs.mkdirSync(evidence);
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    OPENSPEC_TELEMETRY: '0',
    XDG_CONFIG_HOME: path.join(session.evidence, 'global-config'),
    XDG_DATA_HOME: path.join(session.evidence, 'global-data'),
  };
  delete env.NODE_TEST_CONTEXT;
  function command(target: string, args: string[], exit = 0) {
    const result = spawnSync(
      process.execPath,
      [session.installedCLI, ...args, '--project', target, '--json'],
      {
        cwd: target === alpha ? beta : session.installation,
        env,
        encoding: 'utf8',
        windowsHide: true,
        timeout: 30_000,
      },
    );
    fs.appendFileSync(
      path.join(evidence, 'commands.jsonl'),
      JSON.stringify({
        executable: process.execPath,
        args: [session.installedCLI, ...args, '--project', target, '--json'],
        cwd: target === alpha ? beta : session.installation,
        exitCode: result.status,
        signal: result.signal,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.error?.message,
      }) + '\n',
    );
    assert.equal(result.status, exit, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  }
  function start(target: string, type: string, extra: string[] = [], exit = 0) {
    return command(
      target,
      [
        'action',
        'start',
        '--change',
        'local-note-work',
        '--type',
        type,
        '--role',
        type.startsWith('review-') ? 'reviewer' : 'author',
        '--actor',
        type.startsWith('review-') ? 'fixture-reviewer' : 'installation-author',
        ...extra,
      ],
      exit,
    );
  }
  function finish(target: string, ref: string, outcome = 'complete', reviewer = false) {
    const actor = [
      '--role',
      reviewer ? 'reviewer' : 'author',
      '--actor',
      reviewer ? 'fixture-reviewer' : 'installation-author',
    ];
    fs.writeFileSync(
      path.join(target, 'work.md'),
      '受控阶段记录；Reviewer verdict 仅安装测试夹具，不批准根 Change。\n',
    );
    command(target, ['run', 'save', '--run', ref, ...actor, '--body', 'work.md']);
    command(target, [
      'run',
      'submit',
      '--run',
      ref,
      ...actor,
      '--outcome',
      outcome,
      '--result',
      '受控阶段完成',
      ...(reviewer ? ['--verdict', 'approved'] : []),
    ]);
  }
  function protectedState(target: string) {
    const state: Record<string, Buffer> = {};
    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(file);
        else state[path.relative(target, file)] = fs.readFileSync(file);
      }
    }
    walk(path.join(target, '.mendi'));
    return state;
  }
  const installedMethods = fs.readFileSync(
    path.join(session.installedRoot, 'skills/actions/explore/SKILL.md'),
  );
  const betaBefore = protectedState(beta);
  const a = start(alpha, 'explore');
  assert.deepEqual(protectedState(beta), betaBefore);
  assert.equal(
    a.methods.stage.file,
    path.join(session.installedRoot, 'skills/actions/explore/SKILL.md'),
  );
  assert.equal(a.methods.upstream[0].projectRoot, fs.realpathSync(alpha));
  assert.equal(a.methods.upstream[0].content, fs.readFileSync(a.methods.upstream[0].file, 'utf8'));
  const betaMethod = path.join(beta, '.agents/skills/openspec-explore/SKILL.md');
  const originalBeta = fs.readFileSync(betaMethod);
  fs.unlinkSync(betaMethod);
  assert.equal(start(beta, 'explore', [], 1).error.code, 'skill-unavailable');
  assert.deepEqual(protectedState(beta), betaBefore);
  assert.equal(command(beta, ['next']).ok, true);
  fs.writeFileSync(betaMethod, originalBeta);
  const b = start(beta, 'explore');
  assert.equal(b.methods.upstream[0].projectRoot, fs.realpathSync(beta));
  assert.notEqual(b.methods.upstream[0].file, a.methods.upstream[0].file);
  finish(alpha, a.run.ref, 'continuing');
  const submitted = protectedState(alpha);
  const alphaMethod = a.methods.upstream[0].file;
  const originalAlpha = fs.readFileSync(alphaMethod);
  fs.unlinkSync(alphaMethod);
  const continuedArgs = [
    'action',
    'continue',
    '--action',
    a.run.actionId,
    '--role',
    'author',
    '--actor',
    'installation-author',
  ];
  assert.equal(command(alpha, continuedArgs, 1).error.code, 'skill-unavailable');
  assert.deepEqual(protectedState(alpha), submitted);
  fs.writeFileSync(
    alphaMethod,
    originalAlpha.toString() + '\n当前目标局部说明：只处理本地 notes。\n',
  );
  const continued = command(alpha, continuedArgs);
  assert.match(continued.methods.upstream[0].content, /当前目标局部说明/);
  finish(alpha, continued.run.ref);
  const r = start(alpha, 'review-explore', ['--author-run', continued.run.ref]);
  assert.deepEqual(r.methods.upstream, []);
  finish(alpha, r.run.ref, 'complete', true);
  const propose = start(alpha, 'propose', ['--tool', 'storybook']);
  assert.equal(propose.methods.upstream[0].name, 'openspec-propose');
  assert.equal(propose.methods.guidance[0].ref, 'skills/tools/storybook/SKILL.md');
  fs.writeFileSync(path.join(evidence, 'propose-handoff.json'), JSON.stringify(propose, null, 2));
  const instructions = command(alpha, [
    'action',
    'instructions',
    '--action',
    propose.run.actionId,
    '--artifact',
    'proposal',
  ]);
  fs.writeFileSync(
    path.join(evidence, 'proposal-instructions.json'),
    JSON.stringify(instructions, null, 2),
  );
  assert.match(instructions.instructions.context, /离线笔记/);
  assert.deepEqual(
    fs.readFileSync(path.join(session.installedRoot, 'skills/actions/explore/SKILL.md')),
    installedMethods,
  );
  assert.equal(fs.existsSync(path.join(session.installedRoot, '.mendi')), false);
  fs.writeFileSync(
    path.join(evidence, 'summary.json'),
    JSON.stringify(
      {
        installation: session.installation,
        targets: session.targets,
        proposeRun: propose.run.ref,
        proposeAction: propose.run.actionId,
        result: 'handoff-verified-awaiting-agent-planning',
      },
      null,
      2,
    ),
  );
});
