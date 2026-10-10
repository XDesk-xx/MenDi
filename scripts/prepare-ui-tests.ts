import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uiFixture, uiCommand, pnpmEntry, verifyUITarget } from './test-ui.ts';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.argv[2];
if (!destination || !path.isAbsolute(destination))
  throw new Error('请指定新的绝对 .tmp 子目录；这是显式离线依赖准备入口。');
const root = path.resolve(destination);
if (!root.startsWith(path.join(repository, '.tmp') + path.sep) || fs.existsSync(root))
  throw new Error('准备只写仓库 .tmp 下明确指定的新目录，不替换旧环境。');
verifyUITarget(uiFixture, process.env.MENDI_UI_EVIDENCE_DIR);
fs.mkdirSync(root, { recursive: true });
for (const name of [
  'official-cli',
  'environment',
  'preview',
  'unknown-service',
  'finite-results',
]) {
  const target = path.join(root, name);
  fs.cpSync(uiFixture, target, {
    recursive: true,
    filter: (source) =>
      !path
        .relative(uiFixture, source)
        .split(path.sep)
        .some((part) => ['node_modules', '.mendi', '.cache', 'storybook-static'].includes(part)),
  });
  const installed = uiCommand(
    target,
    [pnpmEntry, 'install', '--frozen-lockfile', '--offline', '--ignore-scripts'],
    process.env.MENDI_UI_EVIDENCE_DIR,
  );
  if (installed.status !== 0) throw new Error(installed.stdout + installed.stderr);
  console.log(`已显式准备 ${target}`);
}
console.log('设置 MENDI_UI_TARGETS_DIR 为该目录，再运行 test:ui；未认证冷安装或其他平台。');
