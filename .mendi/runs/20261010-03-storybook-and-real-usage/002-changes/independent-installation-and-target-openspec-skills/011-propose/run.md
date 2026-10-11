---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-propose-01
actionType: propose
role: author
run: "011"
status: completed
actionStatus: completed
result: planning-ready-for-review
nextAction: review-propose
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/010-review-explore/run.md
---

# MVP-D03-B Author Propose

Owner 指令：“这两个文件可以删掉？然后 propose”。承接 [010 独立 Review Explore](../010-review-explore/run.md) 批准的探索与当前路线图，使用项目自有 Propose 方法和目标 OpenSpec Propose 的适用片段，在已绑定 Change 中生成正式产物，未执行 new change。保持 Author，结果为 planning-ready-for-review，无 Reviewer verdict。

## 产物与收敛

- [proposal](../../../../../../openspec/changes/independent-installation-and-target-openspec-skills/proposal.md)：目标方法接线、独立安装与项目指导、pnpm 入口及原有范围；升级暂不开展。
- [design](../../../../../../openspec/changes/independent-installation-and-target-openspec-skills/design.md)：当前目标单一来源、generatedBy 1.14.1、即时 methods.upstream 数组、各阶段映射与旧 Run 兼容。自有 stage / guidance 保留，Review 无强制 Author 方法，Delivery 不强制 Change 方法。
- [action-runs delta](../../../../../../openspec/changes/independent-installation-and-target-openspec-skills/specs/action-runs/spec.md)：完整保留并更新 Stage skill and requested guidance 的五个场景，新增目标来源、当前交接及阶段组合三个要求；主规格尚未同步。
- [tasks](../../../../../../openspec/changes/independent-installation-and-target-openspec-skills/tasks.md)：15 项均未勾选，按解析 / 接线 / 真实安装 / pnpm 与文档 / 综合验证组织，每组包含相关测试和指导，不把实际 Archive 列为实施完成前置。

关键决定：

1. 上游方法只从当前目标 `.agents/skills/openspec-*/SKILL.md` 读取，输出实际目标、相对引用、文件、生成基线与正文；不回退开发仓库或其他版本。metadata.version 不是 CLI 版本，generatedBy 不认证正文未修改。随包自有方法与显式工具指导继续来自安装根，Storybook 选择不取消 Apply 的目标方法。
2. start / continue、Owner resolve 的实际接收阶段及 Archive 准备在占号前接线，并锁内复核。旧 Run 无新必填字段，continue 重新读取当前目标；查询、save / submit、diagnose、Archive execute / finish 不增加方法前置。Owner 交接不能绕过 Author 接收所需方法，Reviewer 仍独立。
3. 已绑定 Change 首次 Propose 取 openspec-propose 的产物工作片段及动态 instructions，跳过 new；revise-propose 取 update-change 的适用已有产物修订规则，不承担通用缺失创建。Archive 只复用指引，保持既有 native 一次同步，finish 继续本地。
4. 真实安装验收进入 tests/installation，显式准备与执行，长期输入和 TypeScript 脚本受控，缺准备明确拒绝；根正常构建环境与目标严格依赖预检分开。UI results 复用现有 pnpmEntry，必要场景以另一个真实稳定入口核对，不放宽产品预检来取得 PASS。
5. 两份临时补充的有效决定已在路线图：核对当前正式 Run / 配置 / 文档无直接依赖后，按 Owner 指令删除两文件并移除来源链接。保留“先稳定并应用 MenDi、升级仅后续预留”的决定，不新增升级 Change、槽位、时间或依赖；B / C 原范围、A → B → C 依赖不变。

## 实际依据与验证

读取固定 OpenSpec 1.14.1 的 context / list / status，root 为本仓库 nearest；能力库存和完整 action-runs 规格、实际方法 loader / start / continue / Owner resolve / Archive 准备、UI results / pnpm 环境和包清单支撑方案。现有 package 已包含 dist / skills / README，未为打包另造新协议或依赖。

实际四项 artifact instructions 各保存一次，见 [proposal](artifacts/proposal-instructions.json)、[specs](artifacts/specs-instructions.json)、[design](artifacts/design-instructions.json)、[tasks](artifacts/tasks-instructions.json)。按依赖写入并从磁盘重读 proposal / specs / design，没有复制 context 原文或旧证据树。

- 固定 CLI `validate independent-installation-and-target-openspec-skills --strict --json`：exit 0、valid=true、issues=[]，见 [validate](artifacts/validate.json)。
- [status](artifacts/status.json)：proposal / specs / design / tasks 均 done；[只读 Apply instructions](artifacts/apply.json)：ready、0/15，说明规划齐备，不表示实施或独立批准。
- 文档检查核对两文件已移除、无残留直接链接、规划 15 项未实施和原 Stage skill 场景名称均保留；当前本地链接与交接读回见 [assessment](artifacts/assessment.json)、[handoff](artifacts/handoff-readback.json)。

009 的有限 proof 与 010 的独立重放仍用于单一基线、真实安装 / 方法来源与候选可行性。目标接线、锁内检查、pnpm 和当前包装验收仍待 Apply；本轮未改 src / tests / scripts / 产品 Skills / package / lock，沿用 010 的工程检查，不因规划文档重跑实现回归。未认证冷安装、多布局 / 多版本、WebCodex、Vue、MCP 或 C 完整组合使用。

## 独立 Review Propose 交接

下一步 `review-propose / awaiting-review / reviewer`，当前必要输入只指向本 011。Reviewer 核对：三处来源和阶段映射是否可实施，所有新交接入口是否无旁路，旧 Run 与无关查询是否不扩大前置，真实安装 / Agent 产物验收是否与候选 proof 区分，pnpm 修复与根 / 目标环境分工是否合理，以及各产物是否保持升级延期和 B / C 边界。

D03 保持 open / manual-bootstrap，A archived、B active、C 未激活、累计归档 8。保留 010 及以前 Run、编号和 verdict；未实施、归档、Git 写入、正式 Full Test / Close、激活下一 Change 或清理 `.tmp` / 安装现场。
