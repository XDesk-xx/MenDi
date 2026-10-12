---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-archive-01
actionType: archive
role: author
run: "015"
status: completed
actionStatus: completed
result: archived
archiveOrdinal: 9
archiveRef: openspec/changes/archive/2026-10-11-009-independent-installation-and-target-openspec-skills
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-archive-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/014-review-apply/run.md
---

# MVP-D03-B Author Archive

Owner 指令 archive；当前直接独立批准为 014 对 013 的 approved。保持 manual-bootstrap / Author；只调用固定原生 Archive 一次，成功后停 Change checkpoint。

## 实际效果

当前 Review Apply 014 approved，直接 Author 为 013；真实 Apply all_done、15/15，四类规划产物完成。已读取 archive context / operationGuidance 及 specs instructions，规格没有附加 rules。同步评估为 action-runs 修改 1 项、新增 3 项，没有删除或重命名。项目约定由原生负责一次同步与归档，因此不采用上游通用的先手工同步再移动路径。

固定 OpenSpec 1.14.1 archive independent-installation-and-target-openspec-skills --json --yes 仅调用一次，exit 0、specsUpdated=true，实际新增 3 / 修改 1。确认源目录消失、唯一原生目标和受管绝对路径后，安全编号为 openspec/changes/archive/2026-10-11-009-independent-installation-and-target-openspec-skills；累计归档 ID 009 与本 Delivery Run 015 分别计数。

5 份当前 Change 文件的归档字节与调用前一致。全部 4 项 delta 的正文和场景匹配；其余 21 项需求、既有标题及 Purpose 保留，主规格没有 delta 操作标题。7 份主规格 strict validate 通过。必要修改前副本只保存 action-runs-before.md，没有复制历史证据树、hash 清单或旧 Run 链。实际调用与读回见 [native invocation](artifacts/native-archive-invocation.json)、[archive readback](artifacts/archive-readback.json)、[主规格校验](artifacts/specs-validation-invocation.json)。

## 沿用与限制

归档未修改 src / tests / scripts。沿用 [014 独立审核](../014-review-apply/run.md) 的普通 check、完整工程回归 204/204、新安装 1/1、受影响 UI 1/1 与必要锁内补验。013 的一次夹具提交失败及原现场保持原样，014 已将原因未确认列为非阻断波动，不据归档宣称根因修复。支持仍限已验证 Windows / Node 22.23.2 / pnpm 11.22.0 / OpenSpec 1.14.1 和已有 store 的显式离线准备；不认证冷安装、其他平台 / 宿主、Vue、MCP 或 C 的完整真实交付。

## 当前交接

archivedChangeCount 8 → 9；B binding archived / archiveOrdinal=9，changeRef 指向实际编号归档，activeChangeId=null，当前 Run 为 015。D03 保持 open / manual-bootstrap，C 未激活；README / context 收敛当前背景，归档后的 status / next 从本地记录解释，不补建旧活动目录。

保留 014 及以前 Run、编号与 verdict。完整读回后只释放本次自有锁。停在 Change checkpoint；未执行 Git、下一 Change、正式 Delivery Full Test / Close 或清理 .tmp / 锁及失败写入现场。
