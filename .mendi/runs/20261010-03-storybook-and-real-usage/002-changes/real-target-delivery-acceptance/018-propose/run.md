---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-propose-01
actionType: propose
role: author
run: "018"
status: completed
actionStatus: completed
result: planning-complete
nextAction: review-propose
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/017-review-explore/run.md
---

# MVP-D03-C Author Propose

Owner 指令：propose，保持 Author，先核对 016 Explore 的独立审核已批准，再按最简路线图形成方案和任务；不提前实现计数器、不启动子智能体，完成后停在独立 review-propose。

已读取 017 独立 Reviewer 正文和头部：role=reviewer、status/actionStatus=completed、verdict/result=approved，authorRunRef 精确指向当前 016 Explore，下一步 propose / author。稳定 MenDi next 读回一致。批准仅支持有限环境探索，不代表真实业务、会话恢复或收口已完成。

当前 C 已由原生 OpenSpec 创建并绑定，首次 Propose 复用 openspec-propose 的 context / status / instructions 和依赖写作片段，跳过 new change。根仍为 manual-bootstrap，不用产品写命令迁移历史。实际编号在当前 Delivery 的 001–017 后分配 018。

本次为现有能力的真实组合验收与工程示例，没有提出 MenDi 新产品合同，选择 skip_specs: true；不为结构校验编造 delta。目标计数器自己的真实规格在后续目标 Propose 中形成，本轮不代写实现或制造目标历史。

已按实际 instructions / 依赖形成 proposal、design 和六块任务；全部实施任务保持未完成。

## 方案与实际产物

- [proposal](../../../../../../openspec/changes/real-target-delivery-acceptance/proposal.md)：唯一 Vue 目标、稳定 MenDi / OpenSpec / Storybook 组合验收、六块范围与取消项；默认无产品源码改动。
- [design](../../../../../../openspec/changes/real-target-delivery-acceptance/design.md)：唯一受控目标、官方空壳顺序、真实目标阶段与独立角色、CounterPanel 行为、真正新 Author 留待任务、固定五项集合 / 入口 / 预算 / 收尾、业务失败修复及后续授权。
- [tasks](../../../../../../openspec/changes/real-target-delivery-acceptance/tasks.md)：六块实际工作，0/6；合并 / 取消范围为明文，不记执行通过。
- [specs instructions](artifacts/specs-instructions.json) 实际 skipped=true；根 C 没有行为合同变更，.openspec.yaml 显式 skip_specs，不创建根 delta。目标计数器规格仍须在未来真实目标 Propose 中形成。

目标固定 D:/Projects/MenDi/tests/fixtures/d03-c-vue-project，尚未创建；官方 --bare 空壳只增加工程检查配置，不复制探针 / 旧实现。应用与 stories 共用一份 CounterPanel，加一、重置到 0、禁用；没有提前写组件。

新 Author 留待的是完整 stories 与真实浏览器首次验收；初始 Author 仅做开发所需 focused / 类型 / 构建，在目标合法 continuing 后经明确 Owner handoff / 会话授权恢复。实际独立 Reviewer 按目标阶段固定真实 Author 记录，不能用 actor 字段、Node 进程或脚本 verdict 替代。

正式 full 集合为 typecheck / build / build-storybook / stories / browser，一次 full 入口执行。保留明确授权的 reset 故障或实际自然业务失败、实际修复、独立 delivery-repair 定向补审、原集合新整次执行和首轮 Close；受控故障不冒称自然发现或旧 Reviewer 漏检。无 UI 完整流程、第二轮交付和强制制造审核问题均取消；Reopen / 新 Open / 旧 PASS / unknown 直接沿用 D02-C 适用结论，只补实际接入疑点。

## 依赖与方法核对

[entry-check](artifacts/entry-check.json) 仅保存当前直接 017 / 016 身份与批准，不复制旧正文或递归历史。root context / list 为 D:/Projects/MenDi nearest，C 已存在，跳过 new；直接读取阶段 openspec-propose 与产品 propose 方法。

先取得 [proposal instructions](artifacts/proposal-instructions.json) 后写 proposal，再重新读 proposal 取得 design / specs instructions；specs 跳过，design 依据必要跨工具、角色与预算设计条件创建。重新读 proposal / design 后取得 [tasks instructions](artifacts/tasks-instructions.json)，按真实依赖写六组 tasks。未执行 Apply，不把上游 ready / isComplete 解释为业务实施。

## 验证与范围

- 原生 OpenSpec 1.14.1 [strict validate](artifacts/validate.json)：exit 0，1 passed / 0 failed，issues 空。
- [status](artifacts/status.json)：proposal / design / tasks done，specs skipped，规划产物齐备。上游 isComplete 仅为该状态接口的产物标记。
- [Apply instructions](artifacts/apply-instructions.json)：ready，total=6 / complete=0 / remaining=6；计数器、浏览器、会话和收口均未执行。
- 真实目标路径不存在；本轮只写 C 当前 planning metadata / proposal / design / tasks、018 Run / artifacts、manifest 和 README / context 的当前交接。未改 src、tests、维护脚本、自有 Skills 或历史 Run。
- 017 已有 pnpm check 137 文件与真正三类 tsc 通过；本轮未改变这些受检实现 / 配置，直接沿用，不为纯规划重跑旧长回归或环境 proof。不新增 hash、引用链、容量 / 行数或证据数量 gate。
- 本次未写 Git、未启动任何 Agent、未执行目标 Open / 新 Change / Archive / 正式 Full Test / Close、根 C Archive 或根 D03 收口。

## 独立 Review Propose 交接

固定 Author 为本 018；Reviewer 核对当前 proposal / design / tasks 与最简路线图、017 的有限批准范围及实际指引，重点看唯一空目标的真实顺序、会话留待任务、阶段审核不自签、正式集合 / 业务失败及权限。当前必要材料就是本 Run 和方案，不要求重放所有旧 proof 或历史正文。

Author 结果 planning-complete，只代表方案交接完成，尚未获独立 Review Propose 批准。停 review-propose / reviewer；不自动 Apply 或派 Reviewer。
