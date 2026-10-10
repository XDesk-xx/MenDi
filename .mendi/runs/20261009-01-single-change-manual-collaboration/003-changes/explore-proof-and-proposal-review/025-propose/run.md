---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: explore-proof-and-proposal-review
planningSlot: MVP-D01-C
actionId: explore-proof-and-proposal-review-propose-01
actionType: propose
role: author
status: completed
result: planning-ready-for-review
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
nextAction: review-propose
nextRole: reviewer
---

# MVP-D01-C Propose

Owner 当前指令：`propose，这里留了 explore.md 以后都留？还是都不留，确定好统一规范？`。

当前直接输入为 023 Author Explore 和 024 独立 Review Explore（approved，独立 proof 8/8）。本轮保持 Author，形成方案后停在独立 review-propose。

统一材料规则：今后不新建 Change 级 explore.md，探索分析及 proof 摘要进对应 Run，原始输出放 artifacts / 受控材料。当前已被 023 / 024 引用的 explore.md 与历史 Run 原样保留；不补建 A / B 的旧探索文件，不重新审核未变化的 proof。

## 已完成产物与关键取舍

已按固定 OpenSpec 1.14.1 的实际 instructions / 模板和依赖顺序完成：

- [proposal](../../../../../../openspec/changes/explore-proof-and-proposal-review/proposal.md)：当前问题、范围与三份既有能力的变更。
- [design](../../../../../../openspec/changes/explore-proof-and-proposal-review/design.md)：明确三个入口、输入 / 写入 / 角色边界、Owner 模式与人工锁处置步骤。
- delta [project-entry](../../../../../../openspec/changes/explore-proof-and-proposal-review/specs/project-entry/spec.md)、[action-runs](../../../../../../openspec/changes/explore-proof-and-proposal-review/specs/action-runs/spec.md)、[delivery-workspace](../../../../../../openspec/changes/explore-proof-and-proposal-review/specs/delivery-workspace/spec.md)：完整保留修改 requirement 的原场景，增加可验证行为；未同步主规格。
- [tasks](../../../../../../openspec/changes/explore-proof-and-proposal-review/tasks.md)：16 项，全部未勾选；每组同时包含必要验证和使用说明，最后进行跨边界集成，未把 Archive 等后续动作塞进已完成任务。

方案选择：

1. `action instructions` 为显式只读入口，按当前 Action / phase / artifact 获取完整真实指引，保留 context / rules、输出 pattern 和直接依赖状态。Agent 完成语义消费，不自动生成文件或批准；Explore 只读 proposal 背景，Propose 及对应 Review 支持四 artifact，Apply / Archive 接线归 D01-D。
2. `run save` 改为只依赖本地有效配置、当前 product draft、身份、路径、正文和安全写入 / 读回，明确 local-only；正式 submit / continue / Review / Owner 处置仍保留各自上游和固定输入校验。
3. `action resolve` 只处理 Explore / Propose：handoff 未完成 Author / Reviewer 工作，或 rejected 后同阶段 Author revise。决策内嵌新接收工作 Run；handoff 保持原 Action / 固定对象，Review 换人不制造 Author 重做；rejected 修订用新 Action、旧 verdict 不变，新完成结果重新独立审核。CLI 只记录 Owner 声明，不认证真人身份。
4. `workspace diagnose` 仅提供本地只读现场，区分实际当前 submitted、未关联占号、活跃 / unknown 写者和观察中变化。当前没有安全解锁 proof，因此本轮不提供解除锁命令；设计明确新的 Owner 人工处置授权、停止所有写者与无占用、同 token / 正式文件复核、不确定时停止。未执行任何解锁或删除。
5. 四份 Explore / Propose / Review 方法补充真实输入和语义审核分工。材料规则已落在 [AGENTS](../../../../../../AGENTS.md) 和 [路线图](../../../../../../mendi-foundation-and-delivery-roadmap.md) §3：以后不新增 Change 级 explore.md；当前已受审文件保持历史，Propose 收敛有效决策。README 的正文输入示例改为 work-notes.md，避免暗示第二份规范探索产物。

## 实际依据与验证

- 已读回 [023 Author](../023-explore/run.md)、[024 独立 Review](../024-review-explore/run.md)、当前受审 explore.md、主规格全文 / 场景，以及当前 application / adapter / CLI 参数 / 测试 / 产品方法。024 的非阻断 `.tmp` 父目录提示已加入后续任务，不在 Propose 中修改脚本。
- 固定 `context --json` 与 `list --json` 确认本项目 nearest root；复用当前已有 Change，没有重复 scaffold 或激活新 Change。
- 按 proposal → specs / design → tasks 获取实际 instructions，编写前读回其已完成直接依赖。design 因跨模块、数据与写入边界复杂而满足上游条件；没有可以跳过的必要产物或实质未决问题。原始指引与规划状态在 artifacts，不将项目 context / rules 原文复制进方案正文。
- [strict-validate.json](artifacts/strict-validate.json)：`node D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js validate explore-proof-and-proposal-review --strict --json`，退出 0，当前 Change valid，issues=[]。
- [check.txt](artifacts/check.txt)：`pnpm check` 退出 0；32 个维护中 TypeScript 文件格式 / lint，以及源码 / 脚本 / 测试类型检查通过。当前未修改源码、测试、产品 Skills 或 proof 脚本，未声称新增接口可用。
- 沿用 023 相关回归 27/27、024 独立 proof 8/8 与仍适用的 B 结果；不重复证明未变化事实。新 Owner 入口、真实产品本地保存、诊断及四 artifact 接线仍待 Apply 实施 / 验证，不能把本轮结构检查当功能验收。

## 独立 Review Propose 交接

Author 方案已完成，结果 `planning-ready-for-review`，没有本阶段 verdict。独立 Reviewer 应检查：指引协议与实际 OpenSpec 字段是否吻合；本地保存 / 正式提交依赖是否分清；Owner 两种模式及历史 / Review 对象是否正确；诊断和人工处置是否守住写者停止、同 token 与不确定停机边界；三份 delta / design / 任务和 D01-C / D01-D 分工是否一致。

当前 `next=review-propose`、`role=reviewer`，必要直接输入仅为本 Author Run；23 / 24 的详细来历留在本记录，不在 next 累积整条链。001–024 的 Run / 编号 / verdict 与已有 explore.md 保持原样；累计归档数仍为 2。

本轮仅修改规划产物、稳定材料规范与简短当前背景；未执行 Apply、Owner 控制操作、解锁、`.tmp` 删除、Git 写入、Archive、正式 Delivery Full Test / Close 或下一 Change 激活。

最终 [handoff-readback.json](artifacts/handoff-readback.json) 确认真实 status / next 仍为人工来源的 `review-propose / reviewer / executable:false`，只携带本 Run 的直接 Author 输入；上游四类规划产物均 done、isPlanningComplete=true，但任务为 0/16，不代表实施或方案批准。实际编号 001–025 无重复 / 空占号，下一号 026；三份 delta 均存在，4 个 MODIFIED requirement 原场景标题全部保留；读回时上述 12 个直接链接可定位，累计归档数仍为 2。`git -c core.whitespace=cr-at-eol diff --check` 通过，仅为只读差异检查，未写 Git 状态。
