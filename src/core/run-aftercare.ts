import { identifier, MendiError, object, text } from './errors.ts';

export type AmendKind = 'presentation-only' | 'unreviewed-comment';
export interface Supplement {
  requestId: string;
  source: string;
  reason: string;
  evidence: string[];
  relation: 'additional' | 'conflicting' | 'uncertain';
  sourceClaimedCollectedAt: string | null;
  sourceTimeTrust: 'unverified';
}
export function supplementInput(value: unknown): Supplement {
  const v = object(value, '补证输入');
  const allowed = [
    'requestId',
    'source',
    'reason',
    'evidence',
    'relation',
    'sourceClaimedCollectedAt',
    'sourceTimeTrust',
  ];
  if (
    Object.keys(v).some((k) => !allowed.includes(k)) ||
    (v.sourceTimeTrust !== undefined && v.sourceTimeTrust !== 'unverified')
  )
    throw new MendiError(
      'unverified-source-time',
      '不能认证来源采集时间或原批准时序；只接受 unverified 来源自述。',
    );
  if (!Array.isArray(v.evidence) || !v.evidence.length)
    throw new MendiError('invalid-aftercare', '补证需要明确的必要证据引用。');
  const evidence = v.evidence.map((r) => text(r, '证据引用'));
  if (new Set(evidence).size !== evidence.length)
    throw new MendiError('duplicate-evidence', '同一补证不能重复引用原件。');
  const relation = v.relation ?? 'uncertain';
  if (!['additional', 'conflicting', 'uncertain'].includes(String(relation)))
    throw new MendiError('invalid-aftercare', '补证关系无效。');
  return {
    requestId: identifier(v.requestId, 'requestId'),
    source: text(v.source, '来源'),
    reason: text(v.reason, '原因'),
    evidence,
    relation: relation as Supplement['relation'],
    sourceClaimedCollectedAt:
      v.sourceClaimedCollectedAt == null ? null : text(v.sourceClaimedCollectedAt, '来源自述时间'),
    sourceTimeTrust: 'unverified',
  };
}

/** Only ordinary prose lines can lose ONE trailing space. All sensitive lines stay exact. */
export function presentation(original: string, candidate: string) {
  const normalize = (body: string) => {
    const lines = body.match(/[^\n]*(?:\n|$)/g)?.filter((line) => line !== '') ?? [];
    let fence = false;
    return lines
      .map((raw, index) => {
        const line = raw.replace(/\r?\n$/, '');
        const sensitive =
          fence ||
          !line.trim() ||
          /^\s*(?:[`~]{3}|>|#|[-+*]|\d+[.)]|---|===)/.test(line) ||
          /[\[\]<>|`~\\*_{}]/.test(line) ||
          /(?:https?:|mailto:|www\.)/.test(line) ||
          /^\s*(?:=+|-+)\s*(?:\r?\n)?$/.test(lines[index + 1] ?? '') ||
          /^\s/.test(line) ||
          / {2,}$/.test(line) ||
          /\r/.test(line);
        if (/^\s*(?:`{3}|~{3})/.test(line)) fence = !fence;
        return sensitive ? raw : line.replace(/ $/, '') + (index === lines.length - 1 ? '' : '\n');
      })
      .join('');
  };
  if (normalize(original) !== normalize(candidate))
    throw new MendiError(
      'material-amendment-rejected',
      '无法机械证明仅为普通段落安全排版差异；请正式 revise 并独立 Review。',
    );
}

export interface AftercareRequest {
  operation: 'supplement' | 'amend';
  requestId: string;
  kind?: AmendKind;
  reason: string;
  supplement?: Supplement;
}
export interface AftercareFile {
  name: string;
  digest: string;
  sourceRef?: string;
  identity?: string;
}
export interface AftercareIntent {
  formatVersion: 1;
  authoritative: false;
  targetRef: string;
  deliveryId: string;
  roundId: string;
  role: string;
  actorId: string;
  recordedAt: string;
  request: AftercareRequest;
  basis: { project: string; manifestRef: string; manifest: string; run: string };
  files: AftercareFile[];
  lockOwner: string;
}
