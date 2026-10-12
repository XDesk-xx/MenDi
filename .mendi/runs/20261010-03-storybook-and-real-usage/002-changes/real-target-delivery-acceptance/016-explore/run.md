---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-explore-01
actionType: explore
role: author
run: "016"
status: completed
actionStatus: completed
result: proof-supported
nextAction: review-explore
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/015-archive/run.md
---

# MVP-D03-C Author Explore

Owner 原始指令：按这个最简方案同步路线图，owner 授权重新激活 MVP-D03-C，开始 explore；保持 Author，只针对必要疑点做 proof，不提前实现计数器，不启动子智能体，完成后停在独立 review-explore。

本次从 Owner 明确 Git 回退后的 B checkpoint 36a4c11 重新开始。当前目录只有 001–015 既有 Run；本次按当前 Delivery 实际占号分配 016，不将已撤回的 C 工作或批准带回当前状态。A / B 及旧 Delivery 保持原样，累计归档 9。根仍为 manual-bootstrap，不使用产品写命令迁移历史。

稳定 OpenSpec 1.14.1 的真实 new change 创建 real-target-delivery-acceptance scaffold；只有 metadata，未创建 proposal / design / specs / tasks 或 explore.md。本次同步路线图 C 最简范围及当前 manifest / README / context；完整探索写本 Run。

## 必要疑点与工作边界

1. 从空目录使用官方 Vue 脚手架和选定 OpenSpec 生成目标准备，核对方法基线、真实正文与根定位；不复制旧实现。
2. Vue / Naive UI / Storybook 10.6 最小静态接入是否可用；仅环境探针，不写计数器、业务交互或正式目标方案。
3. 根据实际命令判断 .vue 类型检查与执行预算，沿用 A / B / D02-C 有效结论，不重跑旧完整回归。

未授权的目标 Delivery Open / 新 Change 激活 / Archive / 正式 Full Test / Close、Git 及新 Author / Reviewer 会话不执行。本会话保持 Author，没有子智能体。

核心探索已完成，Author 结论为 proof-supported；不是 Reviewer 批准或产品验收。

## 目的、方法、实际结果与限制

| 疑点 / 目的 | 实际方法与结果 | 直接材料 / 限制 |
| --- | --- | --- |
| 空目录官方准备是否可重建 | create-vue@3.24.0 --ts --bare 在新目录生成无示例空壳；固定 OpenSpec 1.14.1 init core 生成目标 Skills，list root 为该目标、changes 为空。已实际读取生成的 Explore 正文，name / generatedBy 与选定方法对应。 | [准备与输出](artifacts/proof-03/summary.json)、[目标 Explore 正文](artifacts/proof-03/target-explore-method.md)。没有计数器、目标 Change、产品 Action 或 Delivery；方法生成不证明实际阶段已完成。 |
| Vue / Naive UI / Storybook 接入组合 | Vue 3.5.43、Naive UI 2.45.3、Vue-Vite / Storybook 10.6.1、Vite 8.3.0；仅 DependencyProbe 静态禁用 NButton。修正探针 Vite 配置后 Storybook 静态构建 exit 0，约 5.6 秒；实际版本与 tools help 均 exit 0。 | [受控输入](artifacts/proof-03/inputs/package.json)、[构建原始输出](artifacts/proof-03/storybook-build-corrected.json)、[CLI 帮助](artifacts/proof-03/storybook-tools-help.json)。没有启动预览服务或浏览器，没有交互 / MCP / 官方 preview 工具调用的认证。 |
| .vue 是否真正受类型检查 | vue-tsc 3.3.13 正常 exit 0；仅在静态探针加入 string = 1 后 exit 2 / TS2322，指向 DependencyProbe.vue；finally 恢复原文件后新检查 exit 0。 | [负例](artifacts/proof-03/vue-typecheck-negative.json)、[恢复后结果](artifacts/proof-03/vue-typecheck-restored.json)。这是工程定向负例，不是正式 Full Test 业务失败，不能代替后续验收。 |
| 稳定入口与准备边界 | 使用 D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi，开发仓库外的新 cwd 下真实 --help exit 0；自有方法、正文交接、隔离和失败边界沿用 B 014 有效独立结论。 | [稳定入口输出](artifacts/proof-03/stable-mendi-help.json)。本次 help 仅证明入口可用，不证明 MenDi 已在 Vue 中完成阶段；真实阶段留 Apply。 |

## 真实失败与范围内修正

同一 016 Run 内保留所有尝试，没有为命令另建 Run：

- [第一轮 install](artifacts/proof/install.json) exit 0，但 [typecheck](artifacts/proof/vue-typecheck.json) exit 1 / 找不到 vue-tsc。原因是位于开发仓库下的新目标没有自己的 pnpm-workspace.yaml，pnpm 采用父 workspace。目标须独立声明 packages: ['.']，不能把安装成功直接当作目标已准备。
- [第二轮 install](artifacts/proof-02/install.json) 已将实际依赖装入目标，但因 esbuild@0.28.2 的构建脚本未被允许而 exit 1。后续目标配置仅允许所需 esbuild；选定 vue-tsc / language-core 3.3.13 的 release-age 例外在目标明确，不改宿主或根配置。
- [第三轮首次 Storybook build](artifacts/proof-03/storybook-build.json) exit 1，因为本 Author 的探针收窄依赖时遗漏了脚手架 Vite 配置对 vite-plugin-vue-devtools 的引用。改为仅 Vue 插件的最小 Vite 配置后构建成功。这是本次探针准备错误，不声称 MenDi 产品存在缺陷或业务缺陷被修复。
- 原始输出每项仅保存一份。最终探针源码、配置、锁文件及 OpenSpec 配置已在 proof-03/inputs；三个 .tmp 现场不是唯一材料。未启动服务，各有限命令已退出；收口时没有匹配本次目标的 Node 进程。

## 分析与 Propose 收敛建议

1. 维持一份从空目录新建的实际 Vue 目标；本 Run 静态环境探针只证明准备可行，Apply 不复制此探针或旧已实现夹具冒充从零实施。最终受控目标路径在 Propose 明确，可用 tests/fixtures/d03-c-vue-project 保存唯一真实示例；目录名不表示预先完成实现，存在时不覆盖。目标源码、OpenSpec / MenDi 记录和必要结果明确归属，安装根不写业务。
2. 官方脚手架 --bare 仅准备空工程。随后由稳定 MenDi 读取目标阶段方法、context / rules 和动态 instructions，围绕一个计数器 Change 先形成受审方案，再实现加一 / 重置 / 禁用、真实 stories 与浏览器交互。首次 Propose 已绑定 Change 不重复 new；原生 Archive 只同步一次。
3. Vue 检查由目标 vue-tsc 承担；根 tsc 不能替代 .vue 类型检查。沿用项目脚本 / 10.6 官方 CLI / 浏览器路径，MCP 不启用。现有 HTML test-ui 的纯 tsc 和单命令 180 秒不直接推广为 Vue 完整验收。本次最慢命令约 10.6 秒、正负类型检查各约 5–6 秒，仅能说明环境探针的耗时，不能据此承诺完整生命周期预算。Propose 对准备、有限验证与正式集合分别给命令及整组预算，沿用简单入口，不建通用预算 / 调度 / 选择器。
4. 按路线图六块组织任务：空工程、真实方案、组件 / Storybook、真实留待任务及新 Author 恢复、必要独立审核与获授权目标收口、根 C 交接。无 UI 仅工程验证；Reopen / 新 Open / 旧 PASS / unknown 沿用 D02-C 实现和 tests，只补实际接入影响。取消子范围注明取消 / 合并，不勾成执行通过。
5. 本轮没有实际审核发现，不能制造 changes-requested。目标实际阶段批准仍由独立 Reviewer 承担，不让 Owner 逐阶段审核演示项目；具体 Reviewer 交接及新 Author 启动在 Propose 明确。本轮无子智能体，后续启动必须按宿主和实际 Owner 授权。
6. Vue 一次 Archive、正式业务失败 / 修复 / 独立定向补审 / 原完整集合新整次执行 / 首次 Close 仍是后续保留范围，进入时核对目标、操作与授权；本次根 C Explore 授权不执行这些操作。根 C Archive、根 D03 Full Test / Close 与 Git 保持独立边界。
7. 当前没有证据要求修改产品源码或现有规格；接入真实阶段发现具体缺陷时再按影响修复与补验。Propose 若只有工程验收与文档，可明确 skip_specs，不能为了验证工具编造新产品要求。

## 沿用旧结论的边界

- [B 014 Review Apply](../../independent-installation-and-target-openspec-skills/014-review-apply/run.md)：稳定安装、自有 / 上游方法交接、路径隔离、必要失败与 pnpm 入口；旧 204/204 回归未受本次文档 / 新探针脚本影响，不机械再跑。B 的 HTML 结果不证明 Vue 渲染或 C 生命周期。
- A 已归档 Storybook 接入规范及 openspec/specs/storybook-integration：工具 / 资产归目标、预览与有限测试分工、服务归属与可选 MCP 边界；本轮不修改 A Run 或旧 HTML fixture。
- D02-C 的 Close / Reopen / 新 Open / 结果选择结论及现有 delivery-close / reopen 测试，产品逻辑未变时直接沿用；不凭这些旧结论宣称 Vue 已实际 Archive / Close。本轮未运行正式 Full Test。

## 验证与最终交接

- pnpm check：exit 0，137 个维护文件格式 / lint 通过，src / scripts / tests 真正 TypeScript 检查通过。新增 proof .ts 在 scripts tsc 中；没有新增产品实现或行为变化，因此不重跑 23 分钟旧根回归。
- 固定 OpenSpec 当前 C status：只有 scaffold，proposal ready，design / specs / tasks blocked；[实际指引](artifacts/proposal-instructions.json)仅作为后续规划输入，本轮未写正式产物。
- 本次修改范围：路线图 C、当前 D03 manifest、README 短状态、OpenSpec context、新 C metadata / 016 Run / artifacts、新的 mvp-d03-c-explore.ts。src、现有 tests / fixtures / scripts 和历史 Run 未修改。
- Author 结论：proof-supported，已足够交接独立 Review Explore；仅证明最简准备路径与静态接入可行，C 尚未完成产品验收。

下一步仅独立 review-explore，固定审核对象为本 016 Author Run。Reviewer 查看更新后的路线图、当前 scaffold / 指引、必要 proof 与明确限制，可按疑点重放；未执行 Reviewer 工作，没有 verdict。不自动 Propose、Apply、目标或根收口、Git 或子智能体。
