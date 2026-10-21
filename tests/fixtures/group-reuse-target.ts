import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Worker, isMainThread, workerData, parentPort } from 'node:worker_threads';

if (!isMainThread) {
  const data = workerData as { artifact: string; directory: string; expected: string };
  parentPort!.postMessage('ready');
  parentPort!.once('message', () => {
    const input = fs.readFileSync(data.artifact, 'utf8');
    assert.equal(input, data.expected);
    fs.writeFileSync(
      path.join(data.directory, 'account.json'),
      JSON.stringify({ input, context: data.directory }),
      { flag: 'wx' },
    );
    parentPort!.postMessage({ directory: data.directory, input });
    parentPort!.close();
  });
} else {
  const started = performance.now();
  let basis = '';
  let artifact = '';
  let builds = 0;
  const prepare = () => {
    const actual = fs.readFileSync('reuse-input.txt', 'utf8');
    if (actual !== basis) {
      basis = actual;
      const dir = `build-${++builds}`;
      fs.mkdirSync(dir);
      artifact = path.resolve(dir, 'result.txt');
      fs.writeFileSync(artifact, actual, { flag: 'wx' });
    }
    return artifact;
  };
  fs.writeFileSync('reuse-input.txt', 'candidate-one');
  const first = prepare();
  assert.equal(prepare(), first);
  assert.equal(builds, 1);
  fs.mkdirSync('consumer-data');
  const workers = [1, 2].map(() => {
    const directory = fs.mkdtempSync(path.resolve('consumer-data/context-'));
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { artifact: first, directory, expected: 'candidate-one' },
    });
    // 在取得业务结果前登记退出，避免 worker 已结束后才附加监听而永久等待。
    const exited = new Promise<number>((resolve) => worker.once('exit', resolve));
    return { worker, directory, exited };
  });
  await Promise.all(
    workers.map(
      ({ worker }) =>
        new Promise<void>((resolve, reject) => {
          worker.once('error', reject);
          worker.once('message', (message) => {
            assert.equal(message, 'ready');
            resolve();
          });
        }),
    ),
  );
  const results = await Promise.all(
    workers.map(
      ({ worker }) =>
        new Promise<unknown>((resolve, reject) => {
          worker.once('error', reject);
          worker.once('message', resolve);
          worker.postMessage('consume');
        }),
    ),
  );
  await Promise.all(
    workers.map(async ({ exited }) => assert.equal(await exited, 0, '实际 worker 须正常退出')),
  );
  assert.notEqual(workers[0].directory, workers[1].directory);
  assert.equal(fs.readFileSync(first, 'utf8'), 'candidate-one');
  fs.writeFileSync('reuse-input.txt', 'candidate-two');
  const second = prepare();
  assert.notEqual(second, first);
  assert.equal(builds, 2);
  assert.equal(fs.readFileSync(first, 'utf8'), 'candidate-one');
  assert.equal(fs.readFileSync(second, 'utf8'), 'candidate-two');
  fs.writeFileSync(
    'reuse-result.json',
    JSON.stringify(
      {
        builds,
        results,
        wallMs: performance.now() - started,
        readOnlyPublishedArtifacts: [first, second],
        sameDistConcurrentWriters: false,
        unmeasured: '没有未优化对照，不宣称提速比例',
      },
      null,
      2,
    ),
  );
}
