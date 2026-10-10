import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { archiveTarget, prepare, worker, disposeStoppedFixtureLock, archiveRun, archiveCli } from '../../../../../../../tests/archive-support.ts';

// Run from the repository root. All mutations stay in helper-created .tmp fixtures.
const retirement = archiveTarget('approved');
fs.appendFileSync(path.join(retirement.change, '.openspec.yaml'), 'retire_capabilities: true\n');
const main = path.join(retirement.root, 'openspec/specs/example/spec.md');
fs.mkdirSync(path.dirname(main), { recursive: true });
fs.writeFileSync(main, '# Example\n\n## Purpose\n受控退役验证。\n\n## Requirements\n\n### Requirement: Last\n系统 SHALL 保存唯一需求。\n\n#### Scenario: Explicit\n- **WHEN** 明确输入\n- **THEN** 保存结果\n');
fs.writeFileSync(path.join(retirement.change, 'specs/example/spec.md'), '## REMOVED Requirements\n\n### Requirement: Last\n**Reason**: 需求已退役。\n**Migration**: 无。\n');
const draft = prepare(retirement);
const execute = worker(retirement.root, draft.run.ref, 'execute');
const current = archiveRun(retirement.root, true);
const raw = JSON.parse(fs.readFileSync(path.join(retirement.root, current.record.archive!.attemptRef!, 'native-result.json'), 'utf8'));
disposeStoppedFixtureLock(retirement.root);
const finish = archiveCli(retirement.root, draft.run.ref, 'finish', 1);
assert.equal(raw.status, 0);
assert.equal(fs.existsSync(retirement.change), false);
assert.equal(fs.existsSync(main), false);
assert.equal(execute.status, 1);
assert.match(JSON.stringify(finish), /ENOENT/);
console.log(JSON.stringify({ scenario: 'retired-last-requirement', root: retirement.root, nativeStatus: raw.status, nativeResponse: JSON.parse(raw.stdout), execute, finish, runPhase: current.record.archive!.phase }, null, 2));

const interrupted = archiveTarget('approved');
const prepared = prepare(interrupted);
const first = worker(interrupted.root, prepared.run.ref, 'execute', 'before-run-commit');
assert.equal(first.status, 88);
disposeStoppedFixtureLock(interrupted.root);
const retry = archiveCli(interrupted.root, prepared.run.ref, 'execute', 1);
const after = archiveRun(interrupted.root);
assert.equal(after.record.archive!.phase, 'prepared');
assert.match(JSON.stringify(retry), /EEXIST/);
console.log(JSON.stringify({ scenario: 'attempt-before-invoking-commit', root: interrupted.root, first, retry, archive: after.record.archive }, null, 2));
