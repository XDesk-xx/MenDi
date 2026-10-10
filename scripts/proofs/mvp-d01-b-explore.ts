// Explore-only persistence experiment. Not wired into the product CLI.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { managedPath } from '../../src/adapters/paths.ts';

const script = fileURLToPath(import.meta.url);
const repository = path.resolve(path.dirname(script), '../..');
const delivery = 'proof-delivery';
const change = 'proof-change';
const base = `.mendi/runs/${delivery}`;
const changeDir = `${base}/003-changes/${change}`;
const stages = {
  explore: {
    role: 'author',
    skillRef: '.agents/skills/openspec-explore/SKILL.md',
    skillName: 'openspec-explore',
  },
  'review-explore': {
    role: 'reviewer',
    skillRef: 'skills/proof-review-explore/SKILL.md',
    skillName: 'proof-review-explore',
  },
} as const;
type Stage = keyof typeof stages;
interface Request {
  operation: 'append' | 'read';
  type?: Stage;
  role?: string;
  actor?: string;
  actionId?: string;
  outcome?: 'continuing' | 'complete';
  skillRef?: string;
  authorRunRef?: string;
  verdict?: 'approved' | 'changes-requested' | 'rejected';
  expectedNumber?: number;
  runRef?: string;
  extensions?: unknown;
}
interface RecordData {
  deliveryId: string;
  changeId: string;
  actionId: string;
  actionType: Stage;
  role: string;
  actor: string;
  outcome: string;
  status: string;
  skillRef: string;
  authorRunRef?: string;
  verdict?: string;
  extensions?: unknown;
}
function reject(code: string): never {
  throw new Error(code);
}
function readRun(root: string, ref: string): RecordData {
  const file = managedPath(root, ref);
  if (!fs.existsSync(file)) reject('required-run-missing');
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(fs.readFileSync(file, 'utf8'));
  if (!match) reject('invalid-run-header');
  const data = parse(match[1]) as RecordData;
  if (data.deliveryId !== delivery || data.changeId !== change || data.status !== 'submitted')
    reject('run-identity-or-state');
  return data;
}
function runRefs(root: string, dir = base): { number: number; ref: string }[] {
  const result: { number: number; ref: string }[] = [];
  const directory = managedPath(root, dir);
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const ref = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      const match = /^(\d{3,})-(?!changes$).+$/.exec(entry.name);
      // A reservation without run.md still consumes its number after interruption.
      if (match) result.push({ number: Number(match[1]), ref: `${ref}/run.md` });
      else result.push(...runRefs(root, ref));
    }
  }
  if (new Set(result.map((r) => r.number)).size !== result.length) reject('duplicate-run-number');
  return result.sort((a, b) => a.number - b.number);
}
function worker(root: string, input: Request): unknown {
  if (input.operation === 'read')
    return { ok: true, record: readRun(root, input.runRef ?? reject('run-ref-required')) };
  const stage = input.type && stages[input.type];
  if (!stage || input.role !== stage.role) reject('stage-role-mismatch');
  if (!input.actor || !input.actionId || !/^[a-z0-9-]+$/.test(input.actionId))
    reject('action-identity-required');
  if (!['continuing', 'complete'].includes(input.outcome ?? '')) reject('outcome-required');
  const skillRef = input.skillRef ?? stage.skillRef;
  if (skillRef !== stage.skillRef) reject('stage-skill-mismatch');
  const skillFile = managedPath(root, skillRef);
  if (!fs.existsSync(skillFile)) reject('required-skill-missing');
  const skill = fs.readFileSync(skillFile, 'utf8');
  if (!skill.includes(`name: ${stage.skillName}`)) reject('stage-skill-content-mismatch');
  const lock = managedPath(root, `${base}/proof-write.lock`);
  const fd = fs.openSync(lock, 'wx');
  try {
    const runs = runRefs(root);
    const number = (runs.at(-1)?.number ?? 0) + 1;
    if (input.expectedNumber !== undefined && input.expectedNumber !== number)
      reject('run-number-conflict');
    const incompleteReservations = runs.filter((r) => !fs.existsSync(managedPath(root, r.ref)));
    const currentRuns = runs.filter(
      (r) => r.ref.startsWith(`${changeDir}/`) && fs.existsSync(managedPath(root, r.ref)),
    );
    const latestRef = currentRuns.at(-1)?.ref;
    const latest = latestRef ? readRun(root, latestRef) : null;
    if (latest?.actionId === input.actionId) {
      if (
        latest.actionType !== input.type ||
        latest.role !== input.role ||
        latest.actor !== input.actor
      )
        reject('action-identity-mismatch');
      if (latest.outcome === 'complete') reject('action-already-complete');
    } else if (currentRuns.some((r) => readRun(root, r.ref).actionId === input.actionId)) {
      reject('old-action-not-current');
    }
    if (input.type === 'review-explore') {
      const authorRef = input.authorRunRef ?? reject('author-run-required');
      const author = readRun(root, authorRef);
      if (
        author.actionType !== 'explore' ||
        author.role !== 'author' ||
        author.outcome !== 'complete'
      )
        reject('author-not-complete');
      if (author.actor === input.actor) reject('self-review');
      if (authorRef !== latestRef) reject('author-not-current');
      if (!['approved', 'changes-requested', 'rejected'].includes(input.verdict ?? ''))
        reject('verdict-required');
    }
    const record: RecordData = {
      deliveryId: delivery,
      changeId: change,
      actionId: input.actionId,
      actionType: input.type!,
      role: input.role!,
      actor: input.actor!,
      status: 'submitted',
      outcome: input.outcome!,
      skillRef,
      ...(input.type === 'review-explore'
        ? { authorRunRef: input.authorRunRef, verdict: input.verdict }
        : {}),
      ...(input.extensions !== undefined ? { extensions: input.extensions } : {}),
    };
    const ref = `${changeDir}/${String(number).padStart(3, '0')}-${input.type}/run.md`;
    const file = managedPath(root, ref);
    fs.mkdirSync(path.dirname(file));
    fs.writeFileSync(file, `---\n${stringify(record)}---\n\n隔离实验提交，不是实际项目审核。\n`, {
      flag: 'wx',
    });
    assert.deepEqual(readRun(root, ref), record);
    return { ok: true, number, runRef: ref, record, skillLoaded: true, incompleteReservations };
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}
if (process.argv[2] === '--worker') {
  try {
    console.log(
      JSON.stringify(worker(process.argv[3]!, JSON.parse(fs.readFileSync(0, 'utf8')) as Request)),
    );
  } catch (error) {
    console.log(
      JSON.stringify({
        ok: false,
        code:
          error instanceof Error
            ? 'code' in error
              ? String(error.code)
              : error.message
            : String(error),
      }),
    );
    process.exitCode = 1;
  }
} else {
  const outputArg = process.argv.indexOf('--output');
  if (outputArg < 0 || !process.argv[outputArg + 1]) throw new Error('--output required');
  const output = managedPath(repository, process.argv[outputArg + 1]!);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.mkdirSync(output); // Never overwrite an earlier proof result.
  fs.mkdirSync(path.join(repository, '.tmp'), { recursive: true });
  const root = fs.mkdtempSync(path.join(repository, '.tmp/mvp-d01-b-explore-'));
  fs.mkdirSync(path.join(root, changeDir), { recursive: true });
  for (const [ref, source] of [
    [stages.explore.skillRef, '.agents/skills/openspec-explore/SKILL.md'],
    [stages['review-explore'].skillRef, 'tests/fixtures/action-handoff/reviewer-skill.md'],
  ]) {
    const dest = path.join(root, ref!);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(repository, source!), dest);
  }
  for (const ref of [
    `${base}/001-delivery-open/run.md`,
    `${base}/002-revise-delivery-open/run.md`,
    `${base}/003-changes/previous-change/015-archive/run.md`,
  ]) {
    const file = path.join(root, ref);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '隔离实验历史占号输入。\n');
  }
  const commands: unknown[] = [];
  const results: { id: string; passed: boolean; detail?: string }[] = [];
  function call(input: Request, expectedCode?: string) {
    const result = spawnSync(process.execPath, [script, '--worker', root], {
      input: JSON.stringify(input),
      encoding: 'utf8',
      timeout: 15000,
    });
    commands.push({
      input,
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error?.message,
    });
    assert.equal(result.status, expectedCode ? 1 : 0, result.stdout || result.stderr);
    const value = JSON.parse(result.stdout);
    if (expectedCode) assert.equal(value.code, expectedCode);
    return value;
  }
  function check(id: string, test: () => void) {
    try {
      test();
      results.push({ id, passed: true });
    } catch (error) {
      results.push({
        id,
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const author: Request = {
    operation: 'append',
    type: 'explore',
    role: 'author',
    actor: 'fixture-author',
    actionId: 'explore-one',
    outcome: 'continuing',
  };
  let first = '';
  let second = '';
  let review = '';
  let original = Buffer.alloc(0);
  check('P01-role-skill-and-global-number', () => {
    const one = call({ ...author, expectedNumber: 16 });
    first = one.runRef;
    assert.equal(one.number, 16);
    assert.equal(one.record.skillRef, stages.explore.skillRef);
    assert.equal(one.skillLoaded, true);
    original = fs.readFileSync(path.join(root, first));
  });
  check('P02-same-action-two-runs-and-process-readback', () => {
    const two = call({
      ...author,
      outcome: 'complete',
      expectedNumber: 17,
      extensions: { historicalRef: 'missing-old.md', unknownRef: { nestedRef: '../outside' } },
    });
    second = two.runRef;
    assert.equal(two.record.actionId, call({ operation: 'read', runRef: first }).record.actionId);
    assert.equal(call({ operation: 'read', runRef: second }).record.outcome, 'complete');
    assert.deepEqual(fs.readFileSync(path.join(root, first)), original);
  });
  check('P03-wrong-role-skill-duplicate-and-completed-action', () => {
    call({ ...author, role: 'reviewer' }, 'stage-role-mismatch');
    call({ ...author, skillRef: stages['review-explore'].skillRef }, 'stage-skill-mismatch');
    call({ ...author, actionId: 'new-explore', expectedNumber: 17 }, 'run-number-conflict');
    call(author, 'action-already-complete');
  });
  const reviewer: Request = {
    operation: 'append',
    type: 'review-explore',
    role: 'reviewer',
    actor: 'fixture-reviewer',
    actionId: 'review-one',
    outcome: 'complete',
    authorRunRef: second,
    verdict: 'approved',
  };
  check('P04-required-author-input-and-independent-review', () => {
    call({ ...reviewer, authorRunRef: `${changeDir}/999-explore/run.md` }, 'required-run-missing');
    call({ ...reviewer, authorRunRef: first }, 'author-not-complete');
    call({ ...reviewer, authorRunRef: undefined }, 'author-run-required');
    call({ ...reviewer, authorRunRef: second, actor: 'fixture-author' }, 'self-review');
    const value = call({ ...reviewer, authorRunRef: second, expectedNumber: 18 });
    review = value.runRef;
    assert.equal(value.record.authorRunRef, second);
    assert.equal(value.record.verdict, 'approved');
    assert.equal(call({ operation: 'read', runRef: review }).record.authorRunRef, second);
  });
  check('P05-historical-and-unknown-refs-do-not-become-inputs', () => {
    const value = call({ operation: 'read', runRef: second });
    assert.deepEqual(value.record.extensions, {
      historicalRef: 'missing-old.md',
      unknownRef: { nestedRef: '../outside' },
    });
    assert.ok(!fs.existsSync(path.join(root, 'missing-old.md')));
  });
  check('P06-path-boundary-and-run-identity', () => {
    call({ operation: 'read', runRef: '../outside/run.md' }, 'unsafe-reference');
    const foreign = `${changeDir}/foreign.md`;
    const content = fs.readFileSync(path.join(root, second), 'utf8');
    fs.writeFileSync(
      path.join(root, foreign),
      content.replace('changeId: proof-change', 'changeId: other-change'),
    );
    call({ operation: 'read', runRef: foreign }, 'run-identity-or-state');
  });
  check('P07-missing-selected-skill-and-interrupted-reservation', () => {
    const skillFile = path.join(root, stages.explore.skillRef);
    fs.renameSync(skillFile, `${skillFile}.held`);
    call({ ...author, actionId: 'explore-two' }, 'required-skill-missing');
    fs.renameSync(`${skillFile}.held`, skillFile);
    fs.mkdirSync(path.join(root, `${changeDir}/019-explore`));
    const value = call({ ...author, actionId: 'explore-two', expectedNumber: 20 });
    assert.equal(value.number, 20);
    assert.deepEqual(value.incompleteReservations, [
      { number: 19, ref: `${changeDir}/019-explore/run.md` },
    ]);
    assert.deepEqual(fs.readFileSync(path.join(root, first)), original);
  });
  check('P08-other-writer-lock-is-preserved', () => {
    const lock = path.join(root, `${base}/proof-write.lock`);
    const fd = fs.openSync(lock, 'wx');
    try {
      fs.writeSync(fd, 'fixture-owner');
      call({ ...author, actionId: 'explore-three' }, 'EEXIST');
      assert.equal(fs.readFileSync(lock, 'utf8'), 'fixture-owner');
      assert.ok(!fs.existsSync(path.join(root, `${changeDir}/021-explore`)));
    } finally {
      fs.closeSync(fd);
      fs.unlinkSync(lock);
    }
  });
  const passed = results.filter((r) => r.passed).length;
  fs.writeFileSync(path.join(output, 'commands.json'), JSON.stringify(commands, null, 2) + '\n');
  fs.writeFileSync(
    path.join(output, 'report.json'),
    JSON.stringify(
      {
        kind: 'explore-prototype',
        root,
        node: process.version,
        passed,
        total: results.length,
        results,
        limits: [
          'No product Action CLI implemented',
          'Fixture Reviewer verdict is not project approval',
          'Actor labels are not authentication',
          'No crash-atomic multi-file commit proven',
          'Only Explore and Review Explore sampled',
        ],
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({ passed, total: results.length, output, subprocesses: commands.length }),
  );
  if (passed !== results.length) process.exitCode = 1;
}
