import fs from 'node:fs';
import path from 'node:path';
import { MendiError, errorInfo } from '../core/errors.ts';

export function present(file: string): boolean {
  try {
    fs.lstatSync(file);
    return true;
  } catch (error) {
    if (errorInfo(error).code === 'ENOENT') return false;
    throw error;
  }
}

function within(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep))
  );
}

export function managedPath(root: string, ref: string): string {
  const parts = ref.split(/[\\/]/);
  if (
    path.win32.isAbsolute(ref) ||
    path.posix.isAbsolute(ref) ||
    parts.some((p) => !p || p === '.' || p === '..' || /[:\0]/.test(p))
  ) {
    throw new MendiError('unsafe-reference', '受管引用必须是目标内的相对路径。', { ref });
  }
  const target = path.resolve(root, ...parts);
  if (!within(root, target))
    throw new MendiError('unsafe-reference', '受管引用越过目标根。', { ref });
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    if (present(current)) {
      let canonical: string;
      try {
        canonical = fs.realpathSync(current);
      } catch (error) {
        throw new MendiError('unsafe-reference', '引用无法解析到有效目标。', {
          ref,
          ...errorInfo(error),
        });
      }
      if (!within(root, canonical))
        throw new MendiError('unsafe-reference', '引用经 symlink / junction 指向项目外。', {
          ref,
          canonical,
        });
    }
  }
  return target;
}
