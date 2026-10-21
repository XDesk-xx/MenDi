import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { verificationTarget } from './delivery-support.ts';
import { addDeliveryChanges } from '../src/application/delivery-change-add.ts';
import { readWorkspace } from '../src/adapters/workspace.ts';
import { readDeliveryRun } from '../src/adapters/delivery-runs.ts';
import { recordRound } from '../src/core/round-records.ts';
import { input, write } from './change-add-support.ts';

test('七次真实追加只以路径和摘要引用历史 intent；旧链可读，篡改拒绝', () => {
  const root = verificationTarget();
  const before = readWorkspace(root)!;
  const firstScope = structuredClone(before.scope);
  const sizes: number[] = [];
  const refs: string[] = [];
  const slots = ['C', 'D', 'E', 'F', 'G', 'H', 'I'];
  for (const [i, slot] of slots.entries()) {
    write(root, {
      requestId: `revised-add-${i + 1}`,
      additions: [{ slot, title: `append ${slot}`, dependsOn: [i === 0 ? 'B' : slots[i - 1]] }],
    });
    const added = addDeliveryChanges(input(root));
    assert.equal(added.ok, true);
    const intentRef = added.run.ref.replace('run.md', 'artifacts/intent.json');
    const bytes = fs.readFileSync(path.join(root, intentRef));
    const basis = JSON.parse(bytes.toString()) as {
      direct: Array<[string, string]>;
      directDigests?: Array<[string, string]>;
    };
    assert.equal(
      basis.direct.some(([ref]) => ref.endsWith('/artifacts/intent.json')),
      false,
    );
    assert.equal(
      basis.direct.some(([ref]) => refs.includes(ref)),
      false,
    );
    assert.equal(basis.directDigests?.length ?? 0, i * 2);
    for (const [ref, digest] of basis.directDigests ?? []) {
      assert.ok(
        refs.some(
          (older) => ref === older || ref === older.replace('run.md', 'artifacts/intent.json'),
        ),
      );
      assert.match(digest, /^[0-9a-f]{64}$/);
    }
    sizes.push(bytes.length);
    refs.push(added.run.ref);
    const w = readWorkspace(root)!;
    assert.equal(w.currentRoundId, before.currentRoundId);
    assert.equal(w.scope.plannedChanges.length, firstScope.plannedChanges.length + i + 1);
    assert.equal(w.rounds?.at(-1)?.scopeAdditions?.length, i + 1);
    assert.equal(readDeliveryRun(root, added.run.ref, w.id).record.status, 'submitted');
  }
  const w = readWorkspace(root)!;
  const firstNumber = readDeliveryRun(root, refs[0], w.id).record.runNumber;
  const lastNumber = readDeliveryRun(root, refs.at(-1)!, w.id).record.runNumber;
  const old = {
    runNumber: firstNumber - 1,
    attempt: { scope: firstScope, roundId: w.currentRoundId },
  };
  assert.equal(recordRound(w, old as never)?.id, w.currentRoundId);
  for (const number of [firstNumber, firstNumber + 1, lastNumber, lastNumber + 1])
    assert.throws(() => recordRound(w, { ...old, runNumber: number } as never));
  const lastScope = {
    runNumber: lastNumber + 1,
    attempt: { scope: w.scope, roundId: w.currentRoundId },
  };
  assert.equal(recordRound(w, lastScope as never)?.id, w.currentRoundId);
  // These are observations, not a project-wide file-size gate. A compact
  // digest references old bytes instead of embedding their entire contents.
  assert.equal(refs.length, 7);
  assert.equal(sizes.length, 7);
  const previous = refs[1].replace('run.md', 'artifacts/intent.json');
  const prior = fs.readFileSync(path.join(root, previous));
  fs.writeFileSync(path.join(root, previous), Buffer.concat([prior, Buffer.from(' ')]));
  write(root, {
    requestId: 'revised-add-8',
    additions: [{ slot: 'J', title: 'append J', dependsOn: ['I'] }],
  });
  assert.throws(() => addDeliveryChanges(input(root)), /追加|依据|摘要|changed/);
  fs.writeFileSync(path.join(root, previous), prior);
  assert.equal(
    readWorkspace(root)!.scope.plannedChanges.length,
    firstScope.plannedChanges.length + 7,
  );
  console.log(JSON.stringify({ name: 'D05-B-seven-append-growth', sizes, digestsInSeventh: 12 }));
});
test('旧追加依据的必需路径必须完整：删除摘要、缺项、重复与旧完整 direct 兼容', () => {
  const root = verificationTarget();
  write(root, {
    requestId: 'integrity-1',
    additions: [{ slot: 'C', title: 'C', dependsOn: ['B'] }],
  });
  const first = addDeliveryChanges(input(root));
  write(root, {
    requestId: 'integrity-2',
    additions: [{ slot: 'D', title: 'D', dependsOn: ['C'] }],
  });
  const second = addDeliveryChanges(input(root));
  const firstIntent = path.join(root, first.run.ref.replace('run.md', 'artifacts/intent.json'));
  const secondIntent = path.join(root, second.run.ref.replace('run.md', 'artifacts/intent.json'));
  const firstBytes = fs.readFileSync(firstIntent);
  const original = fs.readFileSync(secondIntent);
  const basis = JSON.parse(original.toString()) as {
    direct: Array<[string, string]>;
    directDigests?: Array<[string, string]>;
  };
  assert.equal(basis.directDigests?.length, 2);
  assert.equal(readWorkspace(root)?.scope.plannedChanges.length, 4);
  const put = (value: typeof basis) =>
    fs.writeFileSync(secondIntent, JSON.stringify(value, null, 2) + '\n');
  const missingAll = { ...basis };
  delete missingAll.directDigests;
  try {
    put(missingAll);
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });
    fs.writeFileSync(firstIntent, Buffer.concat([firstBytes, Buffer.from(' ')]));
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });
    fs.writeFileSync(firstIntent, firstBytes);

    put({ ...basis, directDigests: basis.directDigests!.slice(0, 1) });
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });

    put({ ...basis, directDigests: [...basis.directDigests!, basis.directDigests![0]] });
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });

    put({
      ...basis,
      direct: [...basis.direct, [basis.directDigests![0][0], '']],
    });
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });

    put({
      ...basis,
      directDigests: [...basis.directDigests!, ['.mendi/other/unknown', 'a'.repeat(64)]],
    });
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });

    put({ ...basis, directDigests: [...basis.directDigests!, ['../outside', 'a'.repeat(64)]] });
    assert.throws(() => readWorkspace(root), { code: 'invalid-scope-addition' });

    // Pre-digest legacy format stored all prior Run/intent raw bytes in direct.
    // Preserve this format as readable and verify the actual old byte contents.
    const legacy: typeof basis = {
      ...basis,
      direct: [
        ...basis.direct,
        ...basis.directDigests!.map(
          ([ref]) =>
            [ref, fs.readFileSync(path.join(root, ref)).toString('base64')] as [string, string],
        ),
      ],
    };
    delete legacy.directDigests;
    put(legacy);
    assert.equal(readWorkspace(root)?.scope.plannedChanges.length, 4);
    fs.writeFileSync(firstIntent, Buffer.concat([firstBytes, Buffer.from(' ')]));
    assert.throws(() => readWorkspace(root), { code: 'delivery-input-changed' });
    fs.writeFileSync(firstIntent, firstBytes);
    assert.equal(readWorkspace(root)?.scope.plannedChanges.length, 4);

    put(missingAll);
    assert.throws(
      () =>
        addDeliveryChanges({
          ...input(root),
          inputFile: undefined,
          resumeRef: second.run.ref,
        }),
      { code: 'invalid-scope-addition' },
    );
  } finally {
    fs.writeFileSync(firstIntent, firstBytes);
    fs.writeFileSync(secondIntent, original);
  }
  assert.equal(readWorkspace(root)?.scope.plannedChanges.length, 4);
});
