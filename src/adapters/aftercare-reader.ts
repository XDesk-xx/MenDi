import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { identifier, MendiError, object } from '../core/errors.ts';
import type { AftercareIntent } from '../core/run-aftercare.ts';
import { managedPath, present } from './paths.ts';

export const aftercareDirectory = (ref: string) => `${path.posix.dirname(ref)}/aftercare`;
/** Sidecars must physically stay below their own Run, including internal aliases. */
export function aftercarePath(root: string, ref: string) {
  const file = managedPath(root, ref);
  let current = root;
  for (const part of ref.split('/')) {
    current = path.join(current, part);
    if (present(current) && fs.lstatSync(current).isSymbolicLink())
      throw new MendiError(
        'unsafe-aftercare-path',
        '附属记录不能经 symlink/junction 改写其他位置。',
      );
  }
  return file;
}
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
export function receipt(root: string, directory: string, targetRef: string) {
  const load = (name: string) => fs.readFileSync(aftercarePath(root, `${directory}/${name}`));
  const intentBytes = load('intent.json');
  const intent = object(
    JSON.parse(intentBytes.toString('utf8')),
    '提交后意图',
  ) as unknown as AftercareIntent;
  const confirmed = object(JSON.parse(load('confirmed.json').toString('utf8')), '确认收据');
  if (
    intent.formatVersion !== 1 ||
    intent.authoritative !== false ||
    intent.targetRef !== targetRef ||
    confirmed.formatVersion !== 1 ||
    confirmed.intentDigest !== hash(intentBytes) ||
    typeof intent.recordedAt !== 'string' ||
    !Number.isFinite(Date.parse(intent.recordedAt)) ||
    !['author', 'reviewer'].includes(intent.role) ||
    typeof intent.actorId !== 'string' ||
    !intent.request ||
    !['supplement', 'amend'].includes(intent.request.operation) ||
    !Array.isArray(intent.files) ||
    !intent.files.length
  )
    throw new MendiError('invalid-aftercare-receipt', '收据身份、意图或时间无效。');
  identifier(intent.request.requestId, 'requestId');
  const expected = `${aftercareDirectory(targetRef)}/${intent.request.operation === 'amend' ? 'amend' : `supplements/${intent.request.requestId}`}`;
  if (
    directory !== expected ||
    intent.files[0].name !== 'baseline.md' ||
    intent.files[0].digest !== intent.basis.run ||
    hash(fs.readFileSync(managedPath(root, targetRef))) !== intent.basis.run ||
    new Set(intent.files.map((f) => f.name)).size !== intent.files.length
  )
    throw new MendiError('invalid-aftercare-receipt', '附属记录不属于原提交基线。');
  for (const file of intent.files) {
    if (
      !/^(baseline\.md|input\.md|evidence-\d+\.bin|diff\.json)$/.test(file.name) ||
      !/^[a-f0-9]{64}$/.test(file.digest) ||
      hash(load(file.name)) !== file.digest
    )
      throw new MendiError('invalid-aftercare-receipt', '必要原件缺失或字节失效。');
  }
  if (
    intent.request.operation === 'amend' &&
    (!['presentation-only', 'unreviewed-comment'].includes(String(intent.request.kind)) ||
      !intent.files.some((f) => f.name === 'input.md') ||
      !intent.files.some((f) => f.name === 'diff.json'))
  )
    throw new MendiError('invalid-aftercare-receipt', '修订模式或直接输入缺失。');
  if (
    intent.request.operation === 'supplement' &&
    (intent.request.supplement?.sourceTimeTrust !== 'unverified' ||
      !intent.files.some((f) => f.name.startsWith('evidence-')))
  )
    throw new MendiError('invalid-aftercare-receipt', '补证来源无效。');
  return { intent, ref: `${directory}/confirmed.json` };
}
export function aftercareSlots(root: string, targetRef: string) {
  const base = aftercareDirectory(targetRef),
    slots: string[] = [];
  if (present(managedPath(root, `${base}/amend`))) slots.push(`${base}/amend`);
  const supplements = `${base}/supplements`;
  if (present(managedPath(root, supplements)))
    for (const name of fs.readdirSync(managedPath(root, supplements))) {
      identifier(name, '补证槽位');
      slots.push(`${supplements}/${name}`);
    }
  return slots;
}
export function assertAftercareSettled(root: string, targetRef: string) {
  for (const slot of aftercareSlots(root, targetRef)) receipt(root, slot, targetRef);
}
export function readAftercare(root: string, targetRef: string) {
  const supplements = [],
    presentations = [],
    unreviewedComments = [];
  for (const slot of aftercareSlots(root, targetRef)) {
    const { intent: i, ref } = receipt(root, slot, targetRef);
    const common = {
      ref,
      recordedAt: i.recordedAt,
      role: i.role,
      actorId: i.actorId,
      reason: i.request.reason,
      requestId: i.request.requestId,
    };
    if (i.request.operation === 'supplement')
      supplements.push({
        ...common,
        ...i.request.supplement,
        authoritative: false as const,
        evidence: i.files
          .filter((f) => f.name.startsWith('evidence-'))
          .map((f) => ({ ref: `${slot}/${f.name}`, sourceRef: f.sourceRef })),
        notice:
          i.request.supplement?.relation === 'additional'
            ? '事后补证，不自动批准。来源采集时间未经验证。'
            : '补证与原结论冲突或关系不确定；请 Owner 判断并正式独立 Review。',
      });
    else if (i.request.kind === 'presentation-only')
      presentations.push({
        ...common,
        kind: i.request.kind,
        baselineRef: `${slot}/baseline.md`,
        bodyRef: `${slot}/input.md`,
        diffRef: `${slot}/diff.json`,
        notice: '展示更正版；审核基线仍为原 run.md。',
      });
    else
      unreviewedComments.push({
        ...common,
        kind: 'unreviewed-comment' as const,
        authoritative: false as const,
        label: '事后未审核评论',
        commentRef: `${slot}/input.md`,
        content: fs.readFileSync(managedPath(root, `${slot}/input.md`), 'utf8'),
      });
  }
  return { supplements, presentations, unreviewedComments };
}
