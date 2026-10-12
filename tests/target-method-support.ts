import fs from 'node:fs';
import path from 'node:path';

export const targetNames = [
  'openspec-explore',
  'openspec-propose',
  'openspec-update-change',
  'openspec-apply-change',
  'openspec-archive-change',
];

// 文件规则夹具，不冒称真实官方正文；真实生成 / 宿主使用由安装场景验证。
export function prepareTargetMethods(root: string) {
  for (const name of targetNames) {
    const file = path.join(root, '.agents/skills', name, 'SKILL.md');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      `---\nname: ${name}\nmetadata:\n  version: "1.0"\n  generatedBy: "1.14.1"\n---\n\n# 受控方法夹具 ${name}\n文件解析测试，不作为真实方法工作证明。\n`,
    );
  }
}
