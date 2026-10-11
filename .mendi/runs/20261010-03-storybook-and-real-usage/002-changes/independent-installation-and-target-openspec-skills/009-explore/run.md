---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-explore-01
actionType: explore
role: author
run: "009"
status: completed
actionStatus: completed
result: proof-supported
nextAction: review-explore
nextRole: reviewer
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/008-archive/run.md
---

# MVP-D03-B Author Explore

Owner 原始指令：owner 授权激活 MVP-D03-B，开始 explore，核心功能 proof 认证。

范围读取根路线图 §6.1 与 MVP-D03-B：稳定独立安装、自有方法随包、目标 OpenSpec 方法按阶段交接、写入前失败与兼容、简短项目指导及 pnpm 入口一致性。保持 Author，本次核心 proof 已完成，交接独立 Review Explore。`proof-supported` 是 Author 探索结论，不是 Reviewer verdict 或产品功能验收。

## 激活与实际背景

固定 OpenSpec 1.14.1 原生 new change 创建 `independent-installation-and-target-openspec-skills` scaffold；根 list 已确认 nearest 为本仓库，当前 Change 只有 `.openspec.yaml`，没有正式 proposal / design / specs / tasks / explore.md。读取了实际 [proposal instructions](artifacts/proposal-instructions.json)，按其中中文、角色 / 授权、repo-local 目标、按影响验证与稳定工具要求限定本轮；没有把 context 原文复制成产品方案。阶段方法使用项目 Explore 与 openspec-explore，环境异常使用 debugging-and-error-recovery。

项目保持 manual-bootstrap，沿用人工记录，不用 product bind / Action 写命令迁移根历史。Owner 激活 B 后复用 `002-changes`，Delivery 全局占号到 009；A 的 archived binding、008 及以前 Run / verdict、项目累计数 8 均保留。D03 goal / exitCriteria 明确目标方法接入与稳定安装的组合范围，规划名称和 A → B → C 依赖未变。原始激活命令见 [activation-command](artifacts/activation-command.json)，直接调用前入口见 [activation-before](artifacts/activation-before.json)。

## 核心疑点与 proof

受控输入：[d03-b-project](../../../../../../tests/fixtures/d03-b-project/README.md)；重建入口：[mvp-d03-b-explore.ts](../../../../../../scripts/proofs/mvp-d03-b-explore.ts) 与其小型 [method-reading](../../../../../../scripts/proofs/d03-b/method-reading.ts) 实验。后者仅为 Explore 读取候选，不接入产品；没有改 src 或自有阶段 Skills。维护代码使用 TypeScript，并由真正 scripts / tests tsc 检查；Biome 为新夹具的维护 TS 添加包含范围，没有格式化历史输出。

完整 proof 为 [proof-006](artifacts/proof-006/summary.json)，实际安装根 `D:/tools/mendi/proofs/d03-b-009/proof-006` 位于开发仓库外；目标为 `.tmp/mendi-d03-b-009-mO64Dt/alpha` / `beta`。安装与目标目录只是环境，正文、必要产物、实际调用和错误保存在本 Run，不成为 status / next 的运行前置。

| 疑点 | 实际方法与结果 | 限制与直接材料 |
| --- | --- | --- |
| 独立安装与三个位置 | 真正 tsc 构建、pnpm pack、离线 add；新安装的 CLI 在安装 cwd 对两个目标 Open / bind。自有 Apply / Storybook 方法来自安装包，目标产物进入各自目标，未写入开发或安装根。 | 当前包仍是 D03-A 已有实现，使用已有 store；不认证冷安装。见 proof-006 的 prepare-1 至 prepare-11 命令与 session。 |
| 官方目标来源 / 基线 / 正文 | 两个目标分别由固定 1.14.1 init core 生成六份方法；实际 `.agents/skills/openspec-*/SKILL.md` 头部为 version 1.0 / generatedBy 1.14.1。候选按目标绝对根读取真正正文，两个来源位置不同。 | [actual-generated-methods](artifacts/proof-006/actual-generated-methods.json) 含实际正文与目录；本宿主实际取得内容，不推广为 WebCodex 可读性或多布局支持。 |
| 阶段必需方法与可选指导 | 从安装包真实加载自有 Apply + Storybook 指导，再从目标取得 openspec-apply-change 正文；删去无关 sync 方法不影响所选 Explore 候选及正常 next。 | [组合读回](artifacts/proof-006/apply-storybook-combination.json)；仅方法组合实验，没有执行产品 Apply、UI 或 MCP，不声称该组合已接入 Action。 |
| 候选必需输入失败 | 缺文件、不可读位置、错 generatedBy、错方法身份均拒绝，原项目 / manifest 字节未变，不调用后续产品写入。 | [四项负例](artifacts/proof-006/candidate-negative-cases.json)。不可读用 EISDIR，不认证 ACL。候选没有全量 hash、Ref 注册或依赖图；路径使用当前真实根，不支持其他来源回退。 |
| 已绑定 Change 的首次 Propose | Agent 实际读取目标 propose 正文与 proposal / specs / design / tasks instructions，按依赖在同一个 local-note-work 生成四类产物；离线、本地 notes/ 和无网络场景进入 proposal / design / delta。strict validate passed，list 只有一个 Change，Apply ready / 0 of 1 task completed。 | [planning-inputs](artifacts/proof-006/planning-inputs/)、author-*-instructions、verify-8 规划校验 / verify-9 list / verify-10 Apply instructions。仅隔离入口 proof，不是根 B 的正式 Propose / Apply；未勾选实施任务，不创建 Reviewer 或实际 Archive。 |
| 已有失败边界可否复用 | 新安装真实 start / save / submit continuing 后，临时移走自有 Explore Skill；真实 continue 非零失败，submitted Run 与 manifest 字节不变，next 仍可读，最后恢复文件。 | proof-006 的 verify-2 至 verify-6；证明已有自有方法边界，尚不能代替目标方法接线验收。 |
| 当前产品缺口是否真实 | 移走第二目标的官方 Explore Skill后，当前产品 start 仍成功并分配 Run，输出只有自有方法；结束后恢复原 Skill。 | [confirmed-product-gap](artifacts/proof-006/confirmed-product-gap.json)。此成功是缺口证据，不能当作目标方法已接入或方法准备有效。 |

## 对方案的影响与候选收敛

- **来源保持单一。** 当前真实生成与正文交接支持目标 `.agents/skills` / generatedBy 1.14.1 方向；自有方法仍随 MenDi 包提供。读取方法与 CLI cwd 分别绑定目标，不用开发仓库或 PATH 兜底，不要求当前不使用的六份方法全部齐备。
- **接线必须发生在 start / continue 写入前。** 当前产品未读取目标方法的缺口已实际复现；新读取器需要与已有自有方法加载组合，并维持角色、身份、路径、冲突和原提交保留。候选负例是设计可行性，不宣称产品现已满足合同。正式 Propose 确定返回字段与旧 Run 兼容，不以 loaded 布尔值认证语义工作。
- **首次 Propose 采用已有 Change 的产物入口。** 实验表明可复用官方方法的产物构建片段和公开 instructions，跳过另建 Change；update-change 只处理已有产物，不能承担空产物创建。正式映射仍需在 Propose 明确 Explore / 修订 / Review / Archive 的不同责任，不机械拼接同名 Skill。
- **Review 与 Archive 沿用原边界。** Reviewer 以自有方法独立核对，不能用 Author 写入流程代替；上游 archive / sync 方法只作适用参考，保留既有原生一次同步路径。本轮沿用 A 与既有归档的有效结论，不为方法接线重跑完整生命周期或自签批准。
- **保留 B 原有安装和维护工作。** 真正离线包安装与路径隔离可行，但 README / context 的短入口、支持范围与统一 pnpm 使用仍需正式方案落实；`tests/ui/results.test.ts` 的固定 pnpm 与可配置入口差异未在 Explore 修复。C 的真实 Vue / 无 UI、完整闭环、新会话继续和冷准备仍单独验证。

## 真实失败、工程检查与限制

同阶段所有尝试留在 009，没有按命令新建 Run，也未覆盖错误输出：

- proof-001 / 002 / 003 的根 pnpm build 在复用 UI 命令环境时均被 verifyDepsBeforeRun=error 拒绝工作区结构；没有把拒绝计作构建成功。夹具包定义改为 package-input.json，在沙箱才显式生成 package.json。冻结锁离线刷新返回 Already up to date，锁文件字节未变，见 [root-dependency-refresh](artifacts/root-dependency-refresh.json)；普通根构建可运行，而 UI 环境仍拒绝，不能声称刷新已经解决该环境差异。完整 proof 改为直接调用实际 TypeScript 编译器后打包，没有关闭产品依赖检查。此差异留给 B 的执行入口分工，未在产品中绕过。
- proof-004 真正安装后，init --language 因目标已有 config 被拒绝；之后遵守现有中文 context，去掉覆盖参数。proof-005 的实验脚本误给 change bind 加 role / actor，被参数解析器拒绝；按实际契约修正。这些调用错误不是产品功能失败，均保留原始输出和现场；没有删除失败安装或沙箱。
- `pnpm check` exit 0，format / lint 各检查 131 份维护文件，三个真实 TypeScript 配置通过，见 [check-command](artifacts/check-command.json)。真实 product 调用与候选分支已在本轮有限 proof 验证；没有改产品源码，不机械重跑 A 的整套 UI 或所有旧回归。安装 / 方法读取成功不代替未来正式实现及独立审核。
- 环境为 Windows / Node 22.23.2 / pnpm 11.22.0 / OpenSpec 1.14.1。未认证其他版本 / 平台、多宿主目录、WebCodex、冷安装、Vue、MCP 或完整真实交付；本地修改的上游文件不能只凭 generatedBy 宣称未经修改。无实际消费者的 scriptSha256 没有输出，不新增 hash 清单。

## 交接

Author 的核心探索结论为 proof-supported，下一步独立 Reviewer Review Explore，直接对象仅本 009。根 Change 保持原生 scaffold，正式方案由后续经审核的 Propose 收敛；不新建 explore.md。D03 open、A archived、B active、C 未激活、累计归档 8；未执行 Git、根正式 Full Test / Close / Archive，也未迁移 LP 或清理 `.tmp` / 安装现场。
