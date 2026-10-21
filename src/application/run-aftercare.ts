import fs from 'node:fs';
import { inspectProject } from '../adapters/project.ts';
import { managedPath } from '../adapters/paths.ts';
import { readRunSource } from '../adapters/runs.ts';
import { sourceFile } from '../adapters/aftercare-target.ts';
import {
  storeAftercare,
  type AftercareContent,
  type AftercareOptions,
} from '../adapters/aftercare-store.ts';
import { readAftercare } from '../adapters/aftercare-reader.ts';
import { identifier, MendiError, text } from '../core/errors.ts';
import { presentation, supplementInput } from '../core/run-aftercare.ts';
import { readWorkspace } from '../adapters/workspace.ts';
import { state } from './project.ts';

export interface AftercareInput {
  project: string;
  runRef: string;
  role: string;
  actor: string;
  inputFile?: string;
  requestId?: string;
  kind?: string;
  bodyFile?: string;
  commentFile?: string;
  reason?: string;
  resume?: string;
}
export function runAftercare(
  operation: 'supplement' | 'amend',
  input: AftercareInput,
  options: AftercareOptions = {},
) {
  if (input.resume !== undefined && input.resume !== 'finish')
    throw new MendiError('invalid-aftercare', '--resume 只接受 finish，并保留原请求的全部输入。');
  const { root } = inspectProject(input.project);
  let content: AftercareContent;
  if (operation === 'supplement') {
    const file = sourceFile(root, text(input.inputFile, '补证 JSON'));
    const supplement = supplementInput(JSON.parse(file.bytes.toString('utf8')));
    const evidence = supplement.evidence.map((ref) => sourceFile(root, ref));
    if (new Set(evidence.map((f) => f.identity)).size !== evidence.length)
      throw new MendiError('duplicate-evidence', '别名指向相同原件，拒绝重复补证。');
    content = {
      request: {
        operation,
        requestId: supplement.requestId,
        reason: supplement.reason,
        supplement,
      },
      files: [
        { name: 'input.md', bytes: file.bytes, sourceRef: file.ref, identity: file.identity },
        ...evidence.map((f, i) => ({
          name: `evidence-${i}.bin`,
          bytes: f.bytes,
          sourceRef: f.ref,
          identity: f.identity,
        })),
      ],
    };
  } else {
    const requestId = identifier(input.requestId, 'requestId'),
      reason = text(input.reason, '原因');
    if (
      !['presentation-only', 'unreviewed-comment'].includes(String(input.kind)) ||
      (input.kind === 'presentation-only'
        ? !input.bodyFile || Boolean(input.commentFile)
        : !input.commentFile || Boolean(input.bodyFile))
    )
      throw new MendiError(
        'invalid-aftercare-mode',
        '必须显式指定 kind 和唯一匹配的 body/comment。',
      );
    const file = sourceFile(root, (input.bodyFile ?? input.commentFile)!);
    const candidate = file.bytes.toString('utf8');
    if (!Buffer.from(candidate).equals(file.bytes))
      throw new MendiError('invalid-aftercare', '输入不是有效 UTF-8。');
    const original = readRunSource(root, input.runRef).body;
    if (input.kind === 'presentation-only') presentation(original, candidate);
    content = {
      request: {
        operation,
        requestId,
        reason,
        kind: input.kind as 'presentation-only' | 'unreviewed-comment',
      },
      files: [
        { name: 'input.md', bytes: file.bytes, sourceRef: file.ref, identity: file.identity },
        {
          name: 'diff.json',
          bytes: Buffer.from(
            JSON.stringify(
              {
                kind: input.kind,
                authoritative: false,
                before: { ref: 'baseline.md', part: 'body' },
                after: { ref: 'input.md', part: 'whole-file' },
                changes:
                  input.kind === 'unreviewed-comment'
                    ? []
                    : Array.from(
                        {
                          length: Math.max(
                            original.split('\n').length,
                            candidate.split('\n').length,
                          ),
                        },
                        (_, i) => i,
                      ).flatMap((i) =>
                        original.split('\n')[i] === candidate.split('\n')[i]
                          ? []
                          : [
                              {
                                line: i + 1,
                                before: original.split('\n')[i] ?? null,
                                after: candidate.split('\n')[i] ?? null,
                              },
                            ],
                      ),
                notice:
                  input.kind === 'unreviewed-comment'
                    ? '事后未审核评论，不修改原正文。'
                    : '完整原文与候选字节保存在直接引用文件中。',
              },
              null,
              2,
            ) + '\n',
          ),
        },
      ],
    };
  }
  const result = storeAftercare(root, input, content, input.resume === 'finish', options);
  const workspace = readWorkspace(root)!;
  return {
    ok: true as const,
    operation: `run-${operation}`,
    projectRoot: root,
    openspec: null,
    local: state(workspace),
    alreadyConfirmed: result.alreadyConfirmed,
    receiptRef: result.ref,
    aftercare: readAftercare(root, input.runRef),
    originalRunRef: input.runRef,
    originalRunUnchanged: fs
      .readFileSync(managedPath(root, input.runRef))
      .equals(
        fs.readFileSync(managedPath(root, result.ref.replace('confirmed.json', 'baseline.md'))),
      ),
  };
}
