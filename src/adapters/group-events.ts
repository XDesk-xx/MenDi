import fs from 'node:fs';
import { managedPath, present } from './paths.ts';

/** Only the current execution's append-only stream; partial last lines wait for the next read. */
export function groupEventReader(root: string, ref: string) {
  let offset = 0;
  let partial = Buffer.alloc(0);
  return () => {
    const file = managedPath(root, ref);
    if (!present(file)) return [] as unknown[];
    const fd = fs.openSync(file, 'r');
    let chunk: Buffer;
    try {
      const size = fs.fstatSync(fd).size;
      if (size < offset) throw new Error('本次增量事件被截短');
      chunk = Buffer.alloc(size - offset);
      offset += fs.readSync(fd, chunk, 0, chunk.length, offset);
    } finally {
      fs.closeSync(fd);
    }
    const data = Buffer.concat([partial, chunk]);
    const last = data.lastIndexOf(10);
    if (last < 0) {
      partial = data;
      return [] as unknown[];
    }
    partial = data.subarray(last + 1);
    return data
      .subarray(0, last)
      .toString('utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as unknown);
  };
}
