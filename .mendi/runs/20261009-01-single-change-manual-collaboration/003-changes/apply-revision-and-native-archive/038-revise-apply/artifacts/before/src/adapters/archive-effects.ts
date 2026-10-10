import fs from 'node:fs';
import { parse } from 'yaml';
import { managedPath, present } from './paths.ts';
import { readRun, type RunDocument } from './runs.ts';
import { archiveName, type ArchiveRecord } from '../core/archive.ts';
import { identifier, MendiError, object, text } from '../core/errors.ts';
import type { Workspace } from '../core/records.ts';

export interface ArchiveInputs {
  formatVersion: 1;
  changeId: string;
  runRef: string;
  review: { ref: string; content: string };
  author: { ref: string; content: string };
  source: Record<string, string>;
  main: Record<string, string | null>;
}
const read = (root: string, ref: string) => fs.readFileSync(managedPath(root, ref), 'utf8');
const conflict = (message: string): never => {
  throw new MendiError('archive-effects-unconfirmed', message);
};
export function captureArchiveInputs(
  root: string,
  workspace: Workspace,
  run: RunDocument,
  approval: { review: RunDocument; author: RunDocument },
): ArchiveInputs {
  const change = workspace.activeChangeId!;
  const base = `openspec/changes/${change}`;
  const source: Record<string, string> = {};
  for (const name of ['.openspec.yaml', 'proposal.md', 'design.md', 'tasks.md'])
    source[name] = read(root, `${base}/${name}`);
  const metadata = object(parse(source['.openspec.yaml']), 'Change 元数据');
  if (metadata.schema !== 'spec-driven') conflict('Change 元数据 schema 无效。');
  const main: Record<string, string | null> = {};
  for (const capability of fs.readdirSync(managedPath(root, `${base}/specs`))) {
    identifier(capability, '能力 ID');
    const delta = `specs/${capability}/spec.md`;
    source[delta] = read(root, `${base}/${delta}`);
    deltaEffects(source[delta]);
    const ref = `openspec/specs/${capability}/spec.md`;
    const file = managedPath(root, ref);
    main[ref] = present(file) ? read(root, ref) : null;
  }
  if (!Object.keys(main).length) conflict('Archive 缺 delta specs。');
  return {
    formatVersion: 1,
    changeId: change,
    runRef: run.ref,
    review: { ref: approval.review.ref, content: read(root, approval.review.ref) },
    author: { ref: approval.author.ref, content: read(root, approval.author.ref) },
    source,
    main,
  };
}
export function loadArchiveInputs(
  root: string,
  workspace: Workspace,
  run: RunDocument,
): ArchiveInputs {
  const archive = run.record.archive!;
  const data = object(
    JSON.parse(read(root, `${archive.attemptRef}/inputs.json`)),
    'Archive 本次输入',
  );
  if (data.formatVersion !== 1 || data.changeId !== run.record.changeId || data.runRef !== run.ref)
    conflict('Archive 本次输入身份无效。');
  const direct = (value: unknown, ref: string) => {
    const record = object(value, '直接批准输入');
    if (record.ref !== ref || text(record.content, '直接输入副本') !== read(root, ref))
      conflict('直接批准输入缺失或变化。');
    return { ref, content: record.content as string };
  };
  const review = direct(data.review, archive.reviewRunRef);
  const author = direct(data.author, archive.authorRunRef);
  const r = readRun(root, review.ref, workspace.id, run.record.changeId);
  const a = readRun(root, author.ref, workspace.id, run.record.changeId);
  if (
    r.record.actionType !== 'review-apply' ||
    r.record.status !== 'submitted' ||
    r.record.verdict !== 'approved' ||
    r.record.outcome !== 'complete' ||
    !r.body.trim() ||
    r.record.authorRunRef !== a.ref ||
    r.record.actorId === a.record.actorId ||
    !['apply', 'revise-apply'].includes(a.record.actionType) ||
    a.record.status !== 'submitted' ||
    a.record.outcome !== 'complete' ||
    !a.body.trim() ||
    a.record.runNumber >= r.record.runNumber
  )
    conflict('直接批准无效。');
  const source = object(data.source, '源输入副本');
  const main = object(data.main, '主规格调用前副本');
  for (const name of ['.openspec.yaml', 'proposal.md', 'design.md', 'tasks.md'])
    text(source[name], name);
  if (object(parse(source['.openspec.yaml'] as string), '元数据').schema !== 'spec-driven')
    conflict('schema 无效。');
  const deltas = Object.keys(source).filter((ref) => /^specs\/[a-z0-9-]+\/spec\.md$/.test(ref));
  if (
    !deltas.length ||
    Object.keys(source).length !== deltas.length + 4 ||
    Object.keys(main).length !== deltas.length
  )
    conflict('调用前必要输入集合不完整。');
  for (const delta of deltas) {
    deltaEffects(text(source[delta], 'delta 副本'));
    const ref = `openspec/${delta}`;
    managedPath(root, ref);
    if (!Object.hasOwn(main, ref) || (main[ref] !== null && typeof main[ref] !== 'string'))
      conflict('主规格调用前输入不完整。');
  }
  return {
    formatVersion: 1,
    changeId: run.record.changeId,
    runRef: run.ref,
    review,
    author,
    source: source as Record<string, string>,
    main: main as Record<string, string | null>,
  };
}
type Delta = {
  added: Map<string, string>;
  modified: Map<string, string>;
  removed: Set<string>;
  renamed: Map<string, string>;
};
function requirements(value: string) {
  const matches = [...value.matchAll(/^### Requirement: (.+)\r?$/gm)];
  const result = new Map<string, string>();
  matches.forEach((match, index) => {
    const name = match[1].trim();
    const end = matches[index + 1]?.index ?? value.length;
    // Requirement blocks are bounded by the next level-two section as well.
    const block = value
      .slice(match.index, end)
      .split(/\r?\n## /, 1)[0]
      .replaceAll('\r\n', '\n')
      .trim();
    if (result.has(name)) conflict('重复 Requirement，效果无法唯一解释。');
    result.set(name, block);
  });
  return result;
}
function deltaEffects(value: string): Delta {
  const sections = [...value.matchAll(/^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements\r?$/gm)];
  if (!sections.length) conflict('delta 无可解释的需求操作。');
  const result: Delta = {
    added: new Map(),
    modified: new Map(),
    removed: new Set(),
    renamed: new Map(),
  };
  const seen = new Set<string>();
  sections.forEach((section, index) => {
    const name = section[1];
    if (seen.has(name)) conflict('delta 操作重复。');
    seen.add(name);
    const body = value.slice(
      section.index! + section[0].length,
      sections[index + 1]?.index ?? value.length,
    );
    if (name === 'RENAMED') {
      const pairs = [
        ...body.matchAll(/- FROM: `### Requirement: (.+)`\r?\n- TO: `### Requirement: (.+)`/g),
      ];
      if (!pairs.length) conflict('重命名输入无法解释。');
      for (const pair of pairs) result.renamed.set(pair[1].trim(), pair[2].trim());
    } else {
      const reqs = requirements(body);
      if (!reqs.size) conflict('delta 操作缺需求。');
      if (name === 'REMOVED') result.removed = new Set(reqs.keys());
      else if (name === 'ADDED') result.added = reqs;
      else result.modified = reqs;
    }
  });
  return result;
}
export function archiveCandidates(root: string, change: string, archive: ArchiveRecord) {
  const parent = managedPath(root, 'openspec/changes/archive');
  if (!present(parent)) return [];
  const candidates: string[] = [];
  for (const name of fs.readdirSync(parent)) {
    const ref = `openspec/changes/archive/${name}`;
    if (!new RegExp(`^\\d{4}-\\d{2}-\\d{2}-(?:\\d{3,}-)?${change}$`).test(name)) continue;
    // Inspect all matching dates and numbered names, never only a planned day.
    const validNative = name === `${name.slice(0, 10)}-${change}`;
    const validNumbered =
      name === `${name.slice(0, 10)}-${String(archive.ordinal).padStart(3, '0')}-${change}`;
    if (!validNative && !validNumbered) conflict('存在其他编号的同 Change 候选。');
    archiveName(ref, change, validNumbered ? archive.ordinal : undefined);
    if (!fs.statSync(managedPath(root, ref)).isDirectory()) conflict('归档候选不是目录。');
    candidates.push(ref);
  }
  return candidates;
}
function checkSource(root: string, base: string, inputs: ArchiveInputs) {
  const expected = Object.keys(inputs.source).sort();
  const actual = ['.openspec.yaml', 'proposal.md', 'design.md', 'tasks.md'];
  for (const cap of fs.readdirSync(managedPath(root, `${base}/specs`))) {
    identifier(cap, '能力 ID');
    actual.push(`specs/${cap}/spec.md`);
  }
  if (JSON.stringify(actual.sort()) !== JSON.stringify(expected)) conflict('源材料集合已改变。');
  for (const [ref, content] of Object.entries(inputs.source))
    if (read(root, `${base}/${ref}`) !== content) conflict('Change 必要输入已变化。');
}
export function observeArchiveEffects(root: string, archive: ArchiveRecord, inputs: ArchiveInputs) {
  const source = `openspec/changes/${inputs.changeId}`;
  const exists = present(managedPath(root, source));
  const candidates = archiveCandidates(root, inputs.changeId, archive);
  if ((exists && candidates.length) || candidates.length > 1)
    conflict('源与目标并存或候选不唯一。');
  if (exists && !candidates.length) {
    checkSource(root, source, inputs);
    for (const [ref, content] of Object.entries(inputs.main)) {
      const file = managedPath(root, ref);
      if ((present(file) ? read(root, ref) : null) !== content)
        conflict('主规格已变化，不能证明无效果。');
    }
    return { phase: 'none' as const };
  }
  if (!exists && candidates.length === 1) {
    checkSource(root, candidates[0], inputs);
    for (const [ref, before] of Object.entries(inputs.main)) {
      const actualMain = read(root, ref);
      const after = requirements(actualMain);
      const previous = requirements(before ?? '');
      const prefix = (v: string) =>
        v
          .split(/^### Requirement: /m, 1)[0]
          .replaceAll('\r\n', '\n')
          .trim();
      if (before !== null && prefix(actualMain) !== prefix(before))
        conflict('主规格未涉及的前置内容发生变化。');
      const delta = deltaEffects(inputs.source[ref.slice('openspec/'.length)]);
      const touched = new Set([
        ...delta.added.keys(),
        ...delta.modified.keys(),
        ...delta.removed,
        ...delta.renamed.keys(),
        ...delta.renamed.values(),
      ]);
      for (const [name, block] of [...delta.added, ...delta.modified])
        if (after.get(name) !== block) conflict(`主规格 ${ref} 的新增 / 修改效果不一致。`);
      for (const name of delta.removed) if (after.has(name)) conflict('删除需求仍存在。');
      for (const [from, to] of delta.renamed) {
        const original = previous.get(from);
        if (
          after.has(from) ||
          !original ||
          !after.has(to) ||
          (!delta.modified.has(to) &&
            after.get(to) !==
              original.replace(`### Requirement: ${from}`, `### Requirement: ${to}`))
        )
          conflict('重命名效果不一致。');
      }
      for (const [name, block] of previous)
        if (!touched.has(name) && after.get(name) !== block) conflict('未涉及需求发生变化。');
      for (const name of after.keys())
        if (!previous.has(name) && !touched.has(name)) conflict('主规格有未知新增需求。');
    }
    return { phase: 'confirmed' as const, archiveRef: candidates[0] };
  }
  return conflict('活动源与可靠归档目标均不存在。');
}
