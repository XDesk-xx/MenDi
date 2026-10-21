---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
planningSlot: MVP-D05
run: "046"
actionType: delivery-full-test
role: author
actor: codex-author
recordingMode: manual-bootstrap
scope: delivery
formalDeliveryTest: true
testMode: owner-authorized-manual-full-test
executionId: d05-full-test-046
testedCommit: 7445a9f765e91c5574dd649667bee5349dd6a413
status: completed
actionStatus: completed
phase: finished
outcome: failed
result: failed
date: 2026-10-21
finishedAt: 2026-10-21T07:43:55.508Z
stageSkillRef: skills/actions/delivery-full-test/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/045-archive/run.md
nextAction: delivery-full-test
nextRole: author
---
# D05 046 正式 Full Test — failed（环境准备阻断）

Owner 原文：owner 授权 进行full test。根仍 manual-bootstrap，按已确认的人工正式 F01–F05 一次完整范围执行，不能冒充产品 groups-v1 原生父记录。受测 Git 7445a9f；D05-A/B/C/D 的 Apply Review approved，Archive 014–017。

F01 工程 check：通过。F02 根行为全集真实 336/336，0 fail/skip/todo，exit0。F05 当前八份主规格 strict 及 status/next：全部通过。

F03 UI 准备 exit1，离线元数据 @blazediff/core 缺失且 pnpm 原供应链检查未完成；未启动 UI 业务测试。F04 安装准备 exit1，离线镜像缺 yaml@2.9.1 元数据；未启动安装业务测试。原 F03/F04 失败及日志永不覆盖，不能声明完整 passed。

后续环境诊断：相同包版本、镜像、锁文件、不关安全策略、禁执行安装脚本的普通依赖准备通过，pnpm 明确报告 supply-chain policy 237 entries PASS。新的离线 UI 五沙箱准备与独立安装 session 准备通过，仅用于确认缓存可恢复，**不计入原 046 F03/F04**。完整原始信息在 artifacts/diag-*.json，所有正式组步骤/退出与原始日志见 artifacts/F01..F05 对应 json/log。

本轮结果 **failed，不是产品测试失败的证明，而是两项必需业务集合因环境准备未执行**。在本次 Owner “继续”范围内，若实际环境安全且工作树源码未变，后续另启一轮新的完整 F01–F05 作为正式验收，不拼接本 046 已通过的 F01/F02/F05。无 Close/Push/安装 stable/DreMo。
