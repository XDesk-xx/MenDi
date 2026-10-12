# Design

## Context

动机见 proposal.md。实际源码只有固定对象输出，package 的 `verify:notes` 直接运行 TypeScript，现无外部依赖或已有主规格。新增持久化数据和链接越界处理需在编码前确定，因此保留本设计。

## Goals / Non-Goals

**Goals:** 用 Node 内置文件 API 提供有限保存、读取及明确失败；固定目标内数据位置，验证实际解析路径。

**Non-Goals:** 多用户、多条笔记、UI、网络同步、数据库和并发写协调。

## Decisions

1. 在现有 `src/note.ts` 提供 `save <title> <body>` 与 `read`，固定 `data/note.json`，格式为 UTF-8 JSON `{title, body}`。继续利用现有运行入口，无需数据库或新的包安装；固定单条存储满足本次范围。
2. 先验证参数再写；读取校验 JSON 与字段类型。首次保存明确创建目标内 data，写临时文件后 rename；错误保留已有文件。直接覆盖更短，但会增加写入中断损坏的风险。
3. 由入口文件定位当前目标根，在创建目录或写入前逐层确认 realpath 仍在根内。不能只按字符串前缀判断，因为 data 可能是 junction。拒绝越界，避免与安装根混淆。
4. 行为测试使用新的本地临时目标，覆盖断网、中文往返、空输入、缺文件、坏 JSON 和链接越界。保留 `verify:notes`，不改变项目 AGENTS 或 OpenSpec 配置。

## Risks / Trade-offs

- [只支持单条且不协调并发] → 范围和限制明确；新增并发需求另行规划。
- [已有损坏文件] → 读取失败，保留原文件供人工处理，不补造有效记录。

## Migration Plan

本轮不实施；后续 Apply 在受审任务内修改源码并运行行为检查。现无既有数据格式迁移；回退前保留目标内数据，不删除用户笔记。
