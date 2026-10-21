---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-archive-01
actionType: archive
role: author
actor: codex-author
run: "012"
status: completed
actionStatus: completed
recordingMode: manual-bootstrap
archivePhase: confirmed
archiveOrdinal: 14
archiveRef: openspec/changes/archive/2026-10-20-014-unified-groups-full-test-and-repair-flow
date: 2026-10-20
stageSkillRef: skills/actions/archive/SKILL.md
upstreamSkillRef: .agents/skills/openspec-archive-change/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/010-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/011-review-apply/run.md
outcome: complete
result: archived
nextAction: change-checkpoint
nextRole: author
---

# D05-A Author Archive

Owner 本次指令 archive，固定 010 Apply 和 011 独立 Review Apply approved（定向 45/45）；13/13 OpenSpec tasks 全部完成。根项目是 manual-bootstrap，本次真实阶段记为人工 Run，不冒称产品 CLI 写入。

## 真实原生效果

只执行一次固定 OpenSpec 1.14.1 原生 archive --json --yes，exit 0、specsUpdated=true，新增 3、修改 10、移除 3 份需求。没有先 sync 或第二次 Archive。原始命令结果见 artifacts/native-archive-invocation.json。原生实际产物重命名为项目累计编号 014 的归档：openspec/changes/archive/2026-10-20-014-unified-groups-full-test-and-repair-flow。源 Change 与原生无序号临时目标均已消失，归档目录内必要文件均存在。

已保存四份主规格的必要前态在 artifacts/before；四份同步后主规格逐一 strict validation exit0/valid，见 artifacts/spec-validation.json；真实移动/当前效果见 artifacts/archive-effect-readback.json。归档只同步规格并登记效果，不修改本次已审核产品代码、测试及旧历史 verdict。

## 本地收口与授权边界

project archivedChangeCount 13→14；D05-A binding archived，archiveOrdinal=14，activeChangeId=null。D05 保持 open，当前 Run 为 012，下一步 change-checkpoint，Owner 决定继续。010/011 和此前全部 Run 保留，不改写 D01～D04、DreMo 或外部资料。

沿用 Author 010 的 pnpm check/build 和 Reviewer 011 独立 45/45 有限验证，不假称根 Full Test 已通过。没有 Git commit/push、正式 Full Test、Close、稳定安装或激活 D05-B。
