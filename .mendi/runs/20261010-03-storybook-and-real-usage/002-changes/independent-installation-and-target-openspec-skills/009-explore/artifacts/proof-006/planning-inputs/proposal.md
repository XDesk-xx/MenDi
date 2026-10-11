# Proposal

## Why

离线笔记需要明确、可在无网络环境运行的本地读取约定。本实验在已绑定的 local-note-work 中生成产物，验证方法衔接，不另建 Change。

## What Changes

- 定义只读取当前目标内 notes/ 的笔记摘要行为。
- 保留本地存储，不添加联网依赖或 UI 服务。

## Capabilities

### New Capabilities
- local-notes: 当前目标的离线笔记摘要。

### Modified Capabilities
无。

## Impact

仅当前目标的本地笔记与命令输出；不向 MenDi 安装根或开发仓库写产物。
