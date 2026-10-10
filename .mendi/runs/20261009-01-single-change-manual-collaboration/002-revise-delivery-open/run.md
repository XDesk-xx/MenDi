---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: null
actionId: revise-delivery-open-002
actionType: revise-delivery-open
role: author
run: "002"
status: completed
actionStatus: completed
result: corrected
recordingMode: manual-bootstrap
date: 2026-10-09
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/001-delivery-open/run.md
---

# Delivery Open 目录纠正

## Owner 指令与范围

Owner 指出 Run 目录应带操作名称，`delivery-groups` 应作为目录按 Delivery 保存；确认方案后给出：

> 好的，按这里纠正

本次 Author 只纠正目录、manifest 与引用，仍停在 delivery checkpoint。保留同一个 Delivery 身份及 Open 状态，不再次 Open、不激活 Change、不执行 Git checkpoint / push 或正式 Full Test / Close。

## 输入与原记录

- [路线图](../../../../mendi-foundation-and-delivery-roadmap.md) §4.1 与 §7。
- [协作规则](../../../../AGENTS.md)。
- [原 Open Run 001](../001-delivery-open/run.md)：完成交接后的内容逐字节保留，迁移前后 SHA-256 一致；本记录承接修订，不改写其历史检查、提交候选或结论。
- 原记录中的旧路径与 3 组 / 10 槽位汇总描述属于修订前布局。下表说明材料去向，当前状态与提交候选以本记录及新 manifest 为准。

| 修订前 | 当前 |
|---|---|
| `.mendi/deliveries/<delivery-id>/delivery.json` | `.mendi/delivery-groups/<delivery-id>/manifest.json`；唯一 Delivery manifest |
| `.mendi/delivery-groups.json` | 取消全项目汇总；D01 的 4 个槽位、标题及依赖归入本 Delivery manifest 的 `plannedChanges`，D02 / D03 继续引用路线图 §7 |
| `.mendi/runs/<delivery-id>/001/run.md` | `.mendi/runs/<delivery-id>/001-delivery-open/run.md`；内容不变 |

## 产出与方法

- [项目入口](../../../project.json) 指向 group 目录和唯一 manifest。
- [Delivery group manifest](../../../delivery-groups/20261009-01-single-change-manual-collaboration/manifest.json) 保持 D01 `open`、空 `changeBindings` 和空 `activeChangeId`；`openRunRef` 指向原 Open Run，`latestRunRef` 指向本次修订。
- 仅建立 D01 group，D02 / D03 尚未 Open，不提前创建目录或身份。
- README、OpenSpec context 和路线图 §4.1 同步新路径与命名规则。此处为 Owner 确认的布局纠正，产品字段的实现仍在后续 Change 中确定。
- 本次沿用已读取的任务拆解指导核对 D01 依赖；没有执行实施或 Reviewer Skill，也没有生成空检查 Action。

## 验证

2026-10-09 实际核对结果：

| 检查 | 方法 / 命令 | 结果 |
|---|---|---|
| 原 Run 保留 | 迁移前后 `Get-FileHash -Algorithm SHA256` 对比 | PASS；`001-delivery-open/run.md` 与原 `001/run.md` 字节一致 |
| D01 规划内容保留 | 删除旧汇总前，使用 `node --input-type=module` / `node:assert/strict` 比较 `plannedChanges` 与原汇总的 D01 `changes` | PASS；4 个槽位、标题、依赖和章节引用逐项一致；Delivery 身份、Open 状态与停止边界保持一致 |
| 当前布局与引用 | Node 断言检查目录、JSON、D01 路线图依赖、README 和本 Run 文件链接，以及路线图目录示例 | PASS；只有 D01 group / manifest，Run 为 `001-delivery-open`、`002-revise-delivery-open`；当前入口引用存在；旧汇总、旧 `deliveries` 目录和旧 `001` 目录已移除。原 Run 中的旧引用按上表解释为历史路径 |
| OpenSpec 状态 | `node D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js list --json` | PASS；`changes=[]`，root 为 `D:\Projects\MenDi` |
| Git 边界 | `git diff --check`、`git diff --stat`、`git status --short`、`git diff --cached --name-only`、`git rev-parse HEAD` | PASS；仅本次 7 个候选文件有变更，暂存区为空，HEAD 仍为 `1b3f2180b7d650def7be438caa6ec03944d4b415` |

这些结果只核对目录纠正与交接材料，不是产品功能验收或独立 Reviewer 批准；没有实现代码变更，未执行正式 Full Test。

## Checkpoint 交接

候选标题：`delivery: checkpoint MVP-D01 单 Change 手动协作范围与分组`。

纠正后的候选范围为以下 7 个文件（相对仓库根）：

```text
.mendi/project.json
.mendi/delivery-groups/20261009-01-single-change-manual-collaboration/manifest.json
.mendi/runs/20261009-01-single-change-manual-collaboration/001-delivery-open/run.md
.mendi/runs/20261009-01-single-change-manual-collaboration/002-revise-delivery-open/run.md
README.md
openspec/config.yaml
mendi-foundation-and-delivery-roadmap.md
```

目录纠正及核对已完成，停在待授权的 `delivery-checkpoint`。Git 提交、push、MVP-D01-A 激活及独立 Reviewer verdict 均未执行；修订完成不能替代这些后续边界。

## 正常修复补充：Changes 批次规则

Owner 确认以首个 Run 序号命名 Changes 批次，并明确本次属于正常修复，无需增加 Run：

> 好，就用这个规则，这里不需要增加 runs md 了？ 就属于正常修复

按该指令更新现有材料，不新增 Run、Action 或 `run.md`，也不重新编号或删除现有 Run。此前未采用的 `delivery/`、固定 `changes/` 或轮次目录方案只作为讨论，不写入当前结构。

当前采用的规则是：Delivery 操作直接位于 `runs/<delivery-id>/` 下；同级的 `NNN-changes/` 批次按 Change 分目录，包含各 Change 的多个 Run。批次前缀取其首个实际 Run 的序号，不额外占号；Reopen 后新增工作进入新批次，旧批次保留。产品编号分配和写入能力仍在后续 Change 实现。

路线图 §4.1 是规则正文，README 与 OpenSpec context 提供短入口。manifest 中 `changeBatches=[]`、`changeBindings=[]`、`activeChangeId=null` 如实表达尚无 Change，因此不提前创建 `003-changes` 或预分配其序号。

本次 focused 核对已通过：Node 断言确认批次规则已写入、manifest 的批次及 Change 关联为空、实际仍只有两个 Run，未提前创建 Changes 批次；Run 001 的 SHA-256 与修复前一致，当前材料链接存在。固定 OpenSpec `list --json` 仍返回 `changes=[]`；`git diff --check` 通过，暂存区为空，HEAD 仍为上述初始基线。Checkpoint 候选范围仍为上列 7 个文件；没有新增 Run 或执行后续操作。
