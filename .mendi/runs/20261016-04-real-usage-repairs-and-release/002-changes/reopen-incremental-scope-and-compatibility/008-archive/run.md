---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-archive-01
actionType: archive
role: author
actor: codex-author
run: "008"
status: completed
actionStatus: completed
recordingMode: manual-bootstrap
archivePhase: confirmed
archiveOrdinal: 11
archiveRef: openspec/changes/archive/2026-10-17-011-reopen-incremental-scope-and-compatibility
date: 2026-10-17
stageSkillRef: skills/actions/archive/SKILL.md
upstreamSkillRef: .agents/skills/openspec-archive-change/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/006-apply/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/007-review-apply/run.md
outcome: complete
result: archived
nextAction: change-checkpoint
nextRole: author
---

# MVP-D04-A Author Archive

Owner 明确指令 archive；保持 Author。直接独立 [007 Review Apply](../007-review-apply/run.md) approved 固定 [006 Author Apply](../006-apply/run.md)，实际任务 27/27。读取当前上游归档方法、项目 Archive 方法、context / guidance；准备与指引见 artifacts/preflight.json。根继续 manual-bootstrap，采用既有人工交接，不调用产品写命令转换根记录。

## 实际效果

固定 OpenSpec 1.14.1 的 archive reopen-incremental-scope-and-compatibility --json --yes 仅调用一次，exit 0、specsUpdated=true。原生同步三份主规格，共 12 项修改 / 8 项新增；没有独立 sync 或重复原生调用。原始输出见 artifacts/native-archive-invocation.json。按实际返回身份 / 日期 / 受管路径确认唯一目标，再安全编号为 [011 归档](../../../../../../openspec/changes/archive/2026-10-17-011-reopen-incremental-scope-and-compatibility)。当前源目录和临时原生名均消失，项目累计 archivedChangeCount 10→11；008 为本 Delivery Run 号，与归档号分别计数。

保存三份当前主规格的必要前态在 artifacts/before。逐需求核对 delta 变化完整落地、未涉及需求及原标题 / Purpose 保留，没有 delta 分组头混入主规格；三份主规格各自 strict 校验通过，见 artifacts/spec-validation.json。七份当前 Change 输入（元数据、proposal、design、tasks、三份 delta）迁移前后 Buffer 相同，不建立全量 hash 清单或复制历史证据树。实际效果和最终 status / next 见 artifacts/archive-readback.json。

## 沿用与限制

沿用 006 的 pnpm check / 根工程 250/250，以及 007 独立 check 和 49 项定向回归，不机械重跑有效行为测试。归档只同步规格与登记效果，不改变 src / tests / scripts 或候选产品行为；既有失败、修正、最终整轮及限制保持。工程回归不是本 Delivery 正式 Full Test。

写入仅新 008 Run / artifacts、当前 Change 到 011 的实际移动、三份主规格、项目累计数、D04 manifest、README / context。006 / 007 与此前 Run / verdict、路线图、三份反馈原件、AGENTS、包版本、稳定安装和 DreMo 保持；无真实目标迁移、根正式 Full Test / Close、Git 写入 / push 或下一 Change 激活。独占锁内复核直接批准、前态和实际归档效果，读回完成后仅释放本次自有锁；未清理其他锁、tmp 或历史。

## 交接

A binding 为 archived，archiveOrdinal=11、changeRef 指向实际 011、latestRunRef 指向本 008；activeChangeId=null，Delivery 仍 open/manual-bootstrap，B / C 仍未激活。停 change-checkpoint / author / awaiting-owner，Git checkpoint 另等指令。本 Author 不自签新的审核 verdict。
