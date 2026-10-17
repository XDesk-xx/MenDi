---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: business-contract-ui-design-and-proactive-clarification
planningSlot: MVP-D04-C
batchId: 002-changes
actionId: business-contract-ui-design-and-proactive-clarification-propose-01
actionType: propose
role: author
actor: codex-author
run: "019"
status: completed
actionStatus: completed
outcome: complete
result: proposal-ready-for-review
nextAction: review-propose
nextRole: reviewer
completedOn: 2026-10-17
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-propose/SKILL.md
exploreRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/017-explore/run.md
reviewExploreRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/018-review-explore/run.md
---

# MVP-D04-C Author Propose

已核实018独立Review Explore批准固定017，Owner明确Propose指令；保持Author，只编写规划，完成停独立review-propose。

## 受审输入与规划产物

当前018是独立Reviewer完成 / approved，authorRunRef明确固定017；其批准限进入Propose，不冒充实施验收。使用当前目标1.14.1 openspec-propose和自有propose方法；Change已绑定，不重复new change。实际context确认repo-local / spec-driven，按proposal → specs / design → tasks读取instructions及已完成依赖，返回的context / rules约束实际范围。

正式产物为proposal.md、design.md、specs/action-runs/spec.md、specs/storybook-integration/spec.md、tasks.md；共11项任务，0完成。design适用跨六阶段方法的共同尺度和验收分工，未按可选条件跳过；无新增能力，复用action-runs / storybook-integration。

## 核心决定与一致性核对

- 普通UI调整不新建Change，也不增加Action / Run手续。旧名称或路径词面不能机械冻结UI；真实业务 / Owner明确验收承诺不因设计标签、handler相同或测试绿而豁免。
- specs承载稳定业务，design承载当前UI组织；旧归档 / Run / verdict保留。不补设统一规格豁免或强制新Change规则。
- Explore / Propose先查事实和已确认回答，关键未知提具体问题及影响 / 建议；未答只暂停依赖定稿，低影响可逆细节自行处理。Review独立核对同一尺度和假设来源，主动澄清不限UI。
- 方法落点是四阶段自有正文及Apply / Review Apply的短定位修复指导。现有loader / instructions可沿用，不动src、官方上游、持久字段；不把通用语义长文复制到Storybook或目标context。
- 验收复用现有方法分组测试，必要真实CLI取得实际正文和动态约束，只有实际覆盖缺口才补场景；不新增纯关键词 / 镜像测试。代表情形由Author说明事实 / 未知 / 处理 / 理由、Reviewer独立核对，不称UI运行PASS或任意宿主认证。

018的新增语义反例（草稿改发布的理解影响、键盘不可达、非UI保留期限未答、重要假设冒充确认）均已进入delta / design / tasks。旧定位失效须保留原场景、技术必要断言、失败和清理；正常入口与直达 / 刷新 / 授权分别覆盖，不另造完整UI生命周期。

本次重新核对关键未知后，没有会改变C范围 / 合同 / 任务的阻断决定；不重复询问已确认的普通UI规则。版本 / 发布准备不属于C，0.2.0未被Owner确认，本方案未隐含接受或预定。

## 验证与限制

OpenSpec strict --json通过、issues=[]，见artifacts/validation.json；实际status四类产物done，Apply instructions只读确认tasks为0/11。各阶段instructions与状态原件在本Run，未同步主规格。git diff --check通过。规划仅证明材料结构与当前人工一致性核对，不表示独立方案批准、方法已修改或任务已实施。

沿用017真实交接proof和018独立动态context / Reviewer来源复验的限定结论，不机械重跑工程 / 行为全集；本次没有产品代码 / 方法 / 测试修改。Apply的pnpm check、受影响方法测试、实际更新后交接与语义核对留在tasks，不能以本次strict代替。

## 交接与授权边界

固定本019为Author Propose，next为review-propose / awaiting-review / reviewer。本会话保持Author，无verdict，不启动Reviewer，不Apply / Archive / 正式Full Test / Close、Git写入或push。DreMo和稳定安装未改，主规格、旧归档和017 / 018保持；根manual-bootstrap、累计归档12、HEAD1cb4080保持。
