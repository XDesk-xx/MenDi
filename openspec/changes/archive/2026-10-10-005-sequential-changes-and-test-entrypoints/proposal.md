# Proposal

## Why

首个 Change 完成归档后，现有产品仍拒绝关联下一已有 Change；只放宽数组又会误选旧 Run、破坏旧关联及累计归档读回。MVP-D02-A 需要把顺序衔接和真实测试命令执行补齐，为后续正式 Delivery 验收提供可靠基础。

## What Changes

- 同一 open product Delivery 在前项完整归档后，显式 `change bind` 追加下一已有 Change；校验槽位依赖和唯一身份，保留原关联，不自动激活。
- 按追加顺序和 activeChangeId 选择唯一当前 binding；第二项加入已有 Changes 批次，尚无新 Run 时不回退历史，Run 与项目累计归档编号分别连续增长。
- 查询、阶段操作和 Archive 统一使用当前对象；第二次归档只更新本次关联，旧记录保留身份 / 路径校验，其旧 Run 不成为普通查询前置。保留当前直接输入、锁与有限 finish 的约束。
- 增加本地 `test list / run / status`：读取目标 `package.json` 中已有三类脚本及可选最小映射，显式选择执行；首版支持 Windows、Node 22 和现有 pnpm 11.22.0 的明确 JavaScript 入口。强制禁止工具自动下载和 pnpm 运行前自动安装，不依赖目标默认配置；依赖缺失或不同步的独立预检失败为 not-run，不启动选定脚本、不修改依赖或锁文件。
- 将执行身份、命令 / cwd、必要日志和极简结果保存于当前 Delivery 的独立执行目录；再次显式执行保留前次结果，不逐项建立 Action / Run，不改阶段 next 或已提交 Run。
- 区分 passed、failed、not-run、interrupted、unknown；full 命令执行不生成正式 Full Test、审核 verdict 或 Close 授权。恢复只读解释已有结果，不自动重跑或杀进程。

## Capabilities

### New Capabilities

- `test-execution`：显式选择目标已有 focused / fast / full 命令，执行并跨进程解释简洁结果、日志与未完成状态。

### Modified Capabilities

- `delivery-workspace`：顺序追加关联、唯一当前对象、共享批次、当前必要输入及多次归档的计数 / 交接。
- `action-runs`：当前 Run 选择和跨 Change 批次复用；现有阶段类型、独立审核和 submitted 不可变边界保留。
- `project-entry`：本地测试操作的明确目标及实际执行模式，不把无消费者的 OpenSpec 工具检查作为测试前置。

## Impact

涉及 `src/core/records.ts`、当前对象选择、workspace / Run 写入、project / Archive 应用及 CLI 接线；新增目标脚本解析、有限测试执行与结果存储，使用现有 Node APIs 和 pnpm，无新增生产依赖。测试按关联 / 选择、归档 / 恢复、执行 / 读回场景组织，按变化回归已有用例；继续扩展的混杂职责先整理，不扩大旧 Explore proof。

承接 [003 Review Explore](../../../.mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/003-review-explore/run.md) 的 approved。保持现有 version 1 单 Change 产品记录可读，不迁移 manual-bootstrap、重写旧 Run 或修改主规格；正式 Full Test / 小修复、Close / Reopen / 新 Delivery Open 属于 D02-B / C。本次规划完成后停在独立 Review Propose，不实施产品、不执行 Git 或 Archive。
