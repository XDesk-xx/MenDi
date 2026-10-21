import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { parse } from 'yaml';
import { managedPath, present } from '../src/adapters/paths.ts';

export interface EvidenceSource {
  root: string;
  ref: string;
  lifetime: 'temporary' | 'durable' | 'reconstructible';
  fileIdentity?: string;
  reproduce?: { entry: string; args: string[] };
}
export interface EvidenceReference {
  state: 'saved' | 'referenced';
  root: string;
  ref: string;
  source: EvidenceSource | { identity: string; lifetime: 'current-run' };
}
type Phase = 'source-read' | 'original-written' | 'before-publish';
export class EvidenceIncomplete extends Error {
  readonly state = 'incomplete';
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}
function writable(directory: string) {
  for (let current = directory; ; current = path.dirname(current)) {
    const run = path.join(current, 'run.md');
    if (present(run)) {
      const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(run, 'utf8'));
      const header = match ? (parse(match[1]) as { status?: string }) : null;
      if (!header || !['draft', 'working'].includes(String(header.status)))
        throw new EvidenceIncomplete('证据目标不是当前可写 Run；不修改已提交历史。');
      break;
    }
    if (path.dirname(current) === current) break;
  }
}
function sameFile(file: string, bytes: Buffer) {
  if (!fs.readFileSync(file).equals(bytes))
    throw new EvidenceIncomplete('原件在采集或读回期间变化。');
}
function writeBytes(file: string, bytes: Buffer, flag: 'wx' | 'a') {
  const descriptor = fs.openSync(file, flag);
  try {
    let offset = 0;
    while (offset < bytes.length) {
      const written = fs.writeSync(descriptor, bytes, offset, bytes.length - offset);
      if (!Number.isInteger(written) || written <= 0 || written > bytes.length - offset)
        throw new EvidenceIncomplete('证据写入没有有效进展，保留部分文件。');
      offset += written;
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

/** One opt-in output directory is one bounded collection session, not an execution authority. */
export class EvidenceSession {
  readonly root: string;
  private observe?: (phase: Phase, file: string) => void;
  private originals = new Map<string, { bytes: Buffer; reference: EvidenceReference }>();
  constructor(directory: string, observe?: (phase: Phase, file: string) => void) {
    const target = path.resolve(directory);
    this.observe = observe;
    let existing = target;
    const suffix: string[] = [];
    while (!present(existing)) {
      suffix.unshift(path.basename(existing));
      existing = path.dirname(existing);
    }
    const canonical = path.join(fs.realpathSync(existing), ...suffix);
    writable(canonical);
    fs.mkdirSync(canonical, { recursive: true });
    this.root = fs.realpathSync(canonical);
  }
  private save(
    identity: string,
    bytes: Buffer,
    source: EvidenceReference['source'],
    confirm: () => void,
  ) {
    const previous = this.originals.get(identity);
    if (previous) {
      if (!previous.bytes.equals(bytes))
        throw new EvidenceIncomplete('同一原件身份的字节变化；不覆盖先前证据。');
      sameFile(managedPath(previous.reference.root, previous.reference.ref), bytes);
      confirm();
      return previous.reference;
    }
    writable(this.root);
    // Hash only this explicit source identity for a bounded filename, never file contents or history.
    const key = createHash('sha256').update(identity).digest('hex').slice(0, 32);
    const ref = `originals/${key}-${'ref' in source ? path.basename(source.ref) : 'value.json'}`;
    const file = managedPath(this.root, ref),
      temporary = file + `.${randomUUID()}.tmp`;
    const reference: EvidenceReference = { state: 'saved', root: this.root, ref, source };
    if (present(file)) {
      sameFile(file, bytes);
      confirm();
      this.originals.set(identity, { bytes, reference });
      return reference;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    writeBytes(temporary, bytes, 'wx');
    this.observe?.('original-written', temporary);
    sameFile(temporary, bytes);
    confirm();
    this.observe?.('before-publish', temporary);
    confirm();
    try {
      fs.linkSync(temporary, file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    sameFile(file, bytes);
    confirm();
    fs.unlinkSync(temporary); // Only our verified, successfully published staging name.
    this.originals.set(identity, { bytes, reference });
    return reference;
  }
  file(source: EvidenceSource): EvidenceReference {
    try {
      const root = fs.realpathSync(source.root),
        file = managedPath(root, source.ref);
      const canonical = fs.realpathSync(file);
      if (!fs.statSync(file).isFile()) throw new EvidenceIncomplete('原件不是普通文件。');
      const identity = () => {
        const stat = fs.statSync(file, { bigint: true });
        return `${stat.dev}/${stat.ino}/${stat.birthtimeNs}`;
      };
      const fileIdentity = identity();
      const bytes = fs.readFileSync(file);
      this.observe?.('source-read', file);
      const confirm = () => {
        if (
          fs.realpathSync(managedPath(root, source.ref)) !== canonical ||
          identity() !== fileIdentity
        )
          throw new EvidenceIncomplete('原件路径身份变化。');
        sameFile(file, bytes);
      };
      confirm();
      if (source.lifetime !== 'temporary') {
        if (canonical.split(/[\\/]/).some((p) => ['.tmp', 'runtime'].includes(p.toLowerCase())))
          throw new EvidenceIncomplete('临时来源不能冒充持久原件。');
        if (source.lifetime === 'reconstructible' && !source.reproduce?.entry.trim())
          throw new EvidenceIncomplete('可复建输入必须说明实际入口与参数。');
        return { state: 'referenced', root, ref: source.ref, source: { ...source, fileIdentity } };
      }
      return this.save(
        `file:${canonical}:${fileIdentity}`,
        bytes,
        { ...source, root, fileIdentity },
        confirm,
      );
    } catch (error) {
      if (error instanceof EvidenceIncomplete) throw error;
      throw new EvidenceIncomplete(`必要原件不可完整采集：${source.ref}`, error);
    }
  }
  value(identity: string, value: unknown): EvidenceReference {
    if (!identity.trim()) throw new EvidenceIncomplete('原件必须有真实来源身份。');
    try {
      return this.save(
        `value:${identity}`,
        Buffer.from(JSON.stringify(value, null, 2) + '\n'),
        { identity, lifetime: 'current-run' },
        () => {},
      );
    } catch (error) {
      if (error instanceof EvidenceIncomplete) throw error;
      throw new EvidenceIncomplete('内存原件未持久保存，保留采集现场。', error);
    }
  }
  record(name: string, summary: unknown, append = true) {
    try {
      writable(this.root);
      const file = managedPath(this.root, name);
      const before = append && present(file) ? fs.readFileSync(file) : Buffer.alloc(0);
      const bytes = Buffer.from(JSON.stringify(summary) + '\n');
      writeBytes(file, bytes, append ? 'a' : 'wx');
      sameFile(file, Buffer.concat([before, bytes]));
    } catch (error) {
      throw new EvidenceIncomplete('证据摘要未完整写入；不声明采集完成。', error);
    }
  }
}
const sessions = new Map<string, EvidenceSession>();
export function evidenceSession(directory: string) {
  const key = path.resolve(directory);
  let session = sessions.get(key);
  if (!session) {
    session = new EvidenceSession(key);
    sessions.set(key, session);
  }
  return session;
}
