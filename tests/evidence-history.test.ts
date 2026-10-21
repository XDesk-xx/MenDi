import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from './helpers.ts';
import { readRunSource } from '../src/adapters/runs.ts';
import { parseExecution } from '../src/core/test-execution.ts';
import { query } from '../src/application/project.ts';
import { evidenceSession } from './evidence-support.ts';
import { output } from './evidence-test-support.ts';

test('真实 D01–D04 当前入口与已提交 Run、D05-A/B archive/verdict 定向只读，不扫描历史树', () => {
  const indexRef = path.join(repository, '.mendi/project.json'),
    indexBytes = fs.readFileSync(indexRef);
  const index = JSON.parse(indexBytes.toString()) as {
    deliveries: { id: string; manifestRef: string }[];
  };
  const refs: string[] = [],
    bytes = new Map<string, Buffer>();
  for (const item of index.deliveries.slice(0, 4)) {
    const file = path.join(repository, item.manifestRef),
      raw = fs.readFileSync(file);
    const manifest = JSON.parse(raw.toString()) as {
      latestRunRef: string;
      closeRunRef: string;
      close?: { fullTestRunRef: string };
    };
    const status = query({ project: repository, deliveryId: item.id });
    assert.equal(status.local!.state, 'closed');
    assert.ok(fs.readFileSync(file).equals(raw));
    refs.push(manifest.latestRunRef, manifest.closeRunRef);
    if (manifest.close?.fullTestRunRef) refs.push(manifest.close.fullTestRunRef);
  }
  const base = '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/';
  for (const [change, archive, review] of [
    ['unified-groups-full-test-and-repair-flow', '012-archive', '011-review-apply'],
    ['append-planned-changes-to-open-delivery', '025-archive', '024-review-apply'],
  ]) {
    const ref = `${base}${change}/${review}/run.md`;
    assert.equal(readRunSource(repository, ref).header.verdict, 'approved');
    refs.push(ref, `${base}${change}/${archive}/run.md`);
  }
  for (const ref of new Set(refs)) {
    bytes.set(ref, fs.readFileSync(path.join(repository, ref)));
    const run = readRunSource(repository, ref);
    assert.equal(run.header.status, 'completed');
    assert.ok(run.body.trim());
  }
  const directory = output('historical-refs'),
    session = evidenceSession(directory);
  for (const ref of bytes.keys()) session.file({ root: repository, ref, lifetime: 'durable' });
  assert.equal(fs.existsSync(path.join(directory, 'originals')), false);
  for (const [ref, before] of bytes)
    assert.ok(fs.readFileSync(path.join(repository, ref)).equals(before));
  assert.ok(fs.readFileSync(indexRef).equals(indexBytes));
  session.record('read-only.jsonl', {
    kind: 'direct historical references',
    refs: [...bytes.keys()],
    unchanged: true,
  });
});

test('D04 已保存的 formatVersion=1 原执行与 0B 双日志仍可读取；114/107 仅引用旧观察', () => {
  const base =
    '.mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/014-apply/artifacts/repair-focused/groups/54816-mendi-apply-ILq6td/001-full';
  const refs = [
    'result.json',
    'stdout.log',
    'stderr.log',
    'group-request.json',
    'group-report.json',
  ];
  const before = new Map(
    refs.map((name) => [name, fs.readFileSync(path.join(repository, base, name))]),
  );
  const raw = JSON.parse(before.get('result.json')!.toString());
  const record = parseExecution(raw, raw.projectRoot, raw.deliveryId, raw.executionId);
  assert.equal(record.formatVersion, 1);
  assert.equal(before.get('stdout.log')!.length, 0);
  assert.ok(before.get('stderr.log')!.length);
  const observed = JSON.parse(
    fs.readFileSync(
      path.join(
        repository,
        '.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/027-review-explore/artifacts/historical-audit.json',
      ),
      'utf8',
    ),
  );
  assert.equal(observed.counts.requests, 114);
  assert.equal(observed.counts.reports, 107);
  for (const [name, bytes] of before)
    assert.ok(fs.readFileSync(path.join(repository, base, name)).equals(bytes));
  console.log(
    JSON.stringify({
      scope: '一个明确旧原件及其双日志，只读 format parser；未重建已清理临时项目',
      path: base,
      outcome: record.outcome,
      stdoutBytes: 0,
      historicalCountsSource: '027/artifacts/historical-audit.json',
    }),
  );
});
