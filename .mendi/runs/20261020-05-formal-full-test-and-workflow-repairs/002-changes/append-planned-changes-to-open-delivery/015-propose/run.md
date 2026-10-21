---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-propose-01
actionType: propose
role: author
actor: codex-author
run: "015"
status: completed
actionStatus: completed
outcome: complete
result: proposal-ready-for-independent-review
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/014-review-explore/run.md
---

# D05-B Author Propose — 当前 open Delivery 追加计划槽位

依据 013 Author P01–P07 实际隔离 proof 和 014 独立 review-explore approved；本次未重做 Explore、也不冒称夹具中的角色与 Owner 代表真实审批。根项目仍为 manual-bootstrap，产品 CLI 对根记录只读。

## 正式方案

- OpenSpec proposal、design、tasks 和四份 delta 均位于 openspec/changes/append-planned-changes-to-open-delivery，未进入 src/tests 代码实现。Design 确认独立 delivery-change-add typed 收据、当前轮单向范围追加快照、原始 Run 可按历史 scope/roundId 归属、当前验收权威指针失效及下一步 bind 的不同消费规则。
- 当前 open v2 product 支持显式 Owner 范围许可下 Author 多槽位追加，保持原 round、旧 binding、Archive 与 active Change；不自动 bind / 激活/ Reopen/ Full Test/Close。已 finished、资源确认的旧正式 passed 或 failed 后可追加，旧 Run 仍可显式读取但不对新增范围验收适用。
- 现实风险是 013 P04–P07 证明只修改 scope 或只撤销 deliveryRunRef 均不完整；014 Reviewer R03 又补充旧 delivery-open 本身必须能历史解释。新完整计划的 status/next、Review/Repair 未决、运行中/unknown、锁、基线、并发和中断必须 fail-closed。
- 将代码执行与 CLI/help/方法/测试分别落在四个任务组，共 15 个待办；没有新的通用 scope versioning、测试通过拼接或其他 Change 激活。

## 实际方法、检查与交接

固定 OpenSpec 1.14.1 的 status / instructions proposal、specs、design、tasks 已检查；proposal/specs/design/tasks 全部 done。strict validate exit 0、1/1 valid、0 issues，实证见 artifacts/openspec-validation.json。该校验只证明规划结构符合 OpenSpec，不认证新 CLI 已可运行。

Author Propose 已完成，下一步交由独立 Reviewer review-propose；本次不产生 Reviewer verdict、不执行 Apply、Archive、Git、MenDi 正式 Full Test/Close 或部署。
