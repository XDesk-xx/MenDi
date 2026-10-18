import { run } from 'node:test';
import path from 'node:path';
// Deliberately do NOT turn stream failures into process.exitCode: test the two channels independently.
const mode = process.argv[2];
const files = process.argv.slice(3).map((file) => path.resolve(file));
const controller = new AbortController();
let abortRequested = false;
try {
  for await (const event of run({ files, concurrency: 1, signal: controller.signal })) {
    process.stdout.write(JSON.stringify(event, (_key, value: unknown) =>
      value instanceof Error
        ? { ...value, name: value.name, message: value.message }
        : value,
    ) + '\n');
    if (mode === 'abort' && event.type === 'test:pass' && !abortRequested) {
      abortRequested = true;
      controller.abort();
    }
  }
} catch (error) {
  process.stdout.write(JSON.stringify({ type: 'reviewer:stream-error', message: String(error) }) + '\n');
}
process.stdout.write(JSON.stringify({ type: 'reviewer:stream-ended', abortRequested }) + '\n');
