# Proposal

## Why

现有 `src/note.ts` 只输出固定标题与 local 标记，尚不能保存或读取笔记。需要让中文笔记在断网时通过目标内文件保存，先提供有限的单条笔记能力。

## What Changes

- 增加命令行保存与读取单条中文笔记，拒绝空标题或缺失正文参数。
- 使用当前目标内 `data/note.json`，首次保存时明确创建 data 目录；不添加联网依赖或 UI。
- 对缺文件、损坏 JSON 和目标外路径给出错误，不写安装根或其他目标。

## Capabilities

### New Capabilities

- `local-notes`: 单条笔记的目标内存储与离线读取。

### Modified Capabilities

无。已核对当前目标没有已有主规格。

## Impact

拟修改当前目标 `src/note.ts`、新增本地行为测试并保留 `verify:notes` 入口。仅使用 Node 内置文件 API，不改变 AGENTS、OpenSpec 配置或现有包管理约定。当前阶段仅规划，不实施代码。
