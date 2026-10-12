# Spec Delta

## Purpose

让中文笔记在无网络环境中保存于当前目标项目并可再次读取。该能力明确单条笔记的位置、错误反馈和路径边界，使使用者无需网络服务即可保留内容，同时避免将业务文件写到安装根或其他目标项目。

## ADDED Requirements

### Requirement: Offline save and read

工具 SHALL 在当前目标的 `data/note.json` 保存并读取一条笔记，保留中文标题和正文，不请求网络或自动安装依赖。

#### Scenario: Save and read without network
- **WHEN** 用户在断网环境保存标题“今日记录”和正文“阅读完成”，随后读取
- **THEN** 返回同一标题和正文，文件只位于当前目标 `data/note.json`

### Requirement: Explicit input and storage errors

工具 SHALL 拒绝空标题、缺失正文参数、缺失读取文件和损坏 JSON，返回非零退出状态及可读错误，不覆盖已有有效笔记。

#### Scenario: Invalid save preserves existing note
- **WHEN** 用户在已有有效笔记时提供空标题
- **THEN** 操作失败且原文件字节保持不变

#### Scenario: Missing or corrupt input
- **WHEN** 用户读取不存在或 JSON 损坏的笔记文件
- **THEN** 返回非零状态及对应错误，不生成替代内容

### Requirement: Target storage boundary

工具 SHALL 拒绝将存储位置解析到当前目标外，不写 MenDi 安装根或其他目标。

#### Scenario: Data directory points outside target
- **WHEN** 当前目标 data 路径通过链接指向目标外目录
- **THEN** 保存失败且外部文件保持不变
