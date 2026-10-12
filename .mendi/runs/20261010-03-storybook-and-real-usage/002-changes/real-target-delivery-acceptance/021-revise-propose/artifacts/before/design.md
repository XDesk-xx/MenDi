## Context

动机与范围见 `proposal.md`。017 独立批准 016 的空工程、静态 Vue / Naive UI / Storybook 和真正 SFC 类型检查 proof；尚未认证浏览器、交互、真实角色操作或正式交付。根 MenDi 为 manual-bootstrap，目标必须是新建的 product 项目，不能用产品写命令迁移根历史。

本 Change 不改变 MenDi 的现有能力合同，`skip_specs: true`；目标计数器自己的规格须在后续实际 Propose 形成。保留当前 016 / 017 和 A / B / D02 结论，旧已撤回 C 的任务、批准和完成数不恢复。

## Goals / Non-Goals

**Goals:** 一份从空目录建立的工程，证明稳定 MenDi、目标 OpenSpec 方法、实际 Agent 工作与 Storybook 能组成可交接的最小流程；根任务按六个分组组织，组内按可分别确认完成的工作拆分，完成须来自真实工作。

**Non-Goals:** 双目标完整交付、第二轮 Reopen 演示、MCP 认证、工具升级、后台 / Router / Pinia、新的方法加载器 / 通用测试执行器 / hash 或引用台账。不为演示制造审核 finding，不自动派 Agent 或执行根收口。

## Decisions

### 1. 唯一目标和执行环境

目标固定为 `D:/Projects/MenDi/tests/fixtures/d03-c-vue-project`。该目录尚未创建，Apply 从不存在的目录运行官方 `create-vue@3.24.0 --ts --bare --eslint --prettier`；后两个已存在的官方选项仅生成目标基础工程检查配置，不生成计数器。不复制探针、旧夹具或先写计数器。选择受控示例目录是为了长期保留唯一工程；`.tmp` 仅用于可重建缓存 / 现场。目标 OpenSpec、MenDi 记录直接留在目标，不把整棵记录树复制进根 Run。

| 位置 | 实际入口 / 职责 |
| --- | --- |
| MenDi 稳定安装 | `D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/drivers/cli.js`，随包自有方法来自同一安装 |
| 外部 OpenSpec | `D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js` |
| pnpm | `C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js`，实际 11.22.0 |
| 目标工具 | 目标自己的 node_modules、`.storybook/`、scripts、锁文件和 `.agents/skills/openspec-*` |
| 宿主 | 实际 Author / Reviewer 会话调用 CLI、读取正文、完成业务和交接；actor 字段不认证独立性 |

支持环境仅 Windows、Node 22.23.2、pnpm 11.22.0、OpenSpec 1.14.1。目标沿用已证明的 Vue 3.5.43、Naive UI 2.45.3、Storybook / vue3-vite 10.6.1、Vite 8.3.0、plugin-vue 6.0.7、vue-tsc 3.3.13、TypeScript 5.9.3；有限测试选择 addon-vitest 10.6.1、Vitest / browser-playwright 4.1.11、Playwright 1.60.0，后者在 Vue 下仍须实际验证，不借 HTML PASS 认证。目标锁定实际依赖，不悄悄升级版本。

准备与运行均使用一致 `CI=1`、明确 pnpm 入口及依赖检查策略。目标先声明自身 `pnpm-workspace.yaml` 的单项目 packages，再显式安装；必要 esbuild 构建允许项和已确认的 release-age 例外只写目标配置。仅保留 Vue 的必要 Vite 插件，清理脚手架未使用 devtools 引用。依赖与 Chromium 显式准备，运行阶段缺项报告未执行，不能由运行命令隐式补装。使用已有 store 不认证冷安装。

### 2. 先方案、后业务的真实顺序

准备空工程、目标 AGENTS / context / rules、目标 OpenSpec 方法后，按授权开启目标 `d03-c-vue-counter`，唯一槽位 `VUE-COUNTER`；原生只创建一次 `implement-naive-counter` 并绑定。Delivery Open 不自行创建 Change。所有产品操作显式 `--project <目标绝对根>`，OpenSpec 命令 cwd 为目标，至少一次从安装目录 cwd 读取目标，确认不误选根 MenDi。

目标真实 Explore 只核对项目事实，沿用根 C 的适用环境结论；独立 Review Explore 后进入首次 Propose。MenDi `action start / continue` 返回的目标方法正文须由 Agent 真正阅读；使用 `action instructions --artifact ...` 按依赖生成 proposal / 业务规格 / design / tasks，已有绑定不再 new。规则明确使用 TypeScript / script setup、目标内组件和测试入口，实际产物遵循规则；不要把 rules 仅记录成字符串。

目标 Review Propose 批准后才进入 Apply：使用 `--tool storybook` 同时读取阶段 OpenSpec 方法与 Storybook 指导，`action instructions --operation apply` 取得实际任务。Run 编号由目标工具分配，不预造下一阶段记录，不把 ready / all_done 当作实施或批准。

实际 Reviewer 可由同一独立会话承接相关阶段，但每次审核实际当时的固定 Author / 产物，形成产品需要的真实 Review Run，不能预先批准未来工作。Owner 负责授权与指定交接，不需要亲自逐阶段审核演示项目。根 Author 不切换角色填写 approved；没有独立 Reviewer 时停当前合法边界，不脚本生成 verdict。

具体入口沿用已核对的 CLI，以下 `mendi` 表示表中稳定 JS 入口的 `node` 调用；输入 JSON / 正文在实际阶段写入目标，Run / Action ID 采用工具实际返回，不能把占位符直接执行：

```text
mendi delivery open --project <目标> --id d03-c-vue-counter --title "Vue 计数器真实交付" --scope delivery-scope.json --role author --actor <Author>
node <固定 OpenSpec JS> new change implement-naive-counter   # cwd=目标，仅一次且先有 owner 授权
mendi change bind --project <目标> --change implement-naive-counter --slot VUE-COUNTER
mendi action start --project <目标> --change implement-naive-counter --type <实际阶段> --role <实际角色> --actor <责任标识>
mendi action instructions --project <目标> --action <返回 Action ID> --artifact <当前产物>
mendi action instructions --project <目标> --action <返回 Action ID> --operation apply
```

delivery-scope.json 只声明本次 goal 和一个 VUE-COUNTER 槽位，dependsOn 为空。Reviewer start 使用对应 review 阶段、role reviewer 与实际 `--author-run`；Apply start 选择 `--tool storybook`。实际完成内容通过 `run save --body <目标正文>` / `run submit --outcome continuing|complete` 保存；审核 verdict 仅由真正 Reviewer 提交。

### 3. 一个组件及其业务验收

`App.vue` 只挂载 `CounterPanel.vue`。后者使用 Composition API / `<script setup lang="ts">` 与 Naive UI 按钮，保存最少本地计数；不用服务端、持久化或额外 composable。目标方案应细化以下约定，新增业务含义须先修订方案。

| 输入 / 操作 | 预期 |
| --- | --- |
| 默认初值 | 显示 0 |
| `initialCount=5` | 初次显示 5，用于验证真实已有数值状态 |
| 加一 | 当前值增加 1 |
| 重置 | 无论初值如何，当前值回到 0 |
| `disabled=true` | 加一与重置按钮均禁用，数值不发生操作变化 |

真实 stories 展示默认、已有数值、禁用三个状态，play / browser 断言覆盖加一与重置；应用和 stories 都引用该组件。只用受控非负整数初值，不增加输入表单或无关校验功能。

有限交互使用目标已配置的 Storybook Vitest plugin / Chromium。官方 CLI 使用实际 10.6.1 help，发现当前 stories 并调用 `tools stories preview --attach` 取得真实 URL，随后浏览器查看 iframe 中的渲染、交互和 page errors。官方 URL、静态 build、服务存活都不代替业务结果；不启用 MCP，不要求所有 CLI 能力可用。

### 4. 新 Author 留待任务与合法恢复

初始 Author 实施组件、stories 和验证入口，完成必要开发 focused、类型及构建检查；把 `verify:stories` 的完整业务集合和 `verify:browser` 的首次完整状态 / 交互验收留给新 Author，不能提前执行完整验收后重复演示。目标 tasks 对这部分保持未完成，提交当前 Apply 为 continuing。

交接仅提供稳定入口、目标绝对根、当前 Action / submitted Run、目标方法和必要任务入口，不传旧对话。Owner 明确指定新的 Author 与 handoff 后，按现有 `action resolve --resolution handoff --to-role author --to-actor <接收者>` 建立合法接收，实际新会话从当前记录读取 methods / Apply instructions，完成留待验证与目标 Apply 交接。不是新 Node 进程、换 actor 或脚本输出就算新会话。

初始 Author 不预先完成留待任务，也不因后续需要 Review 自动启动 Reviewer。新会话若没有启动授权，原记录保持 continuing；根对应任务仍待做。源码修改后的新测试 / 浏览器结果合并由后续实际业务修复和完整重跑覆盖，不另造改文案任务。

### 5. 命令集合、预算与服务收尾

在目标自己的 package scripts 声明以下直接入口；`mendi.tests` 映射 focused=`verify:stories`、fast=`verify:fast`、full=`verify:full`，不用第二套 MenDi 执行器。

| 入口 | 命令 / 内容 |
| --- | --- |
| `typecheck` | `vue-tsc --noEmit`，覆盖组件、stories、配置、目标维护 TS 脚本 |
| `check` | 目标 Prettier 的只读格式检查、ESLint 无 --fix 的基础 lint，再执行 typecheck；只选维护文件，排除目标 Runs、依赖与生成物 |
| `build` | `vite build`，真实应用构建 |
| `build-storybook` | `storybook build --disable-telemetry` |
| `verify:stories` | `vitest run --project storybook`，有限业务交互集合 |
| `verify:browser` | `node scripts/browser-check.ts`，真实预览 URL、三个状态、交互和页面错误，保存本次必要结果 |
| `verify:fast` | 顺序执行 typecheck 与 verify:stories |
| `verify:full` | 顺序执行 typecheck、build、build-storybook、verify:stories、verify:browser；任何非零使本次整组失败，未执行的后项如实标记 |

正式 Full Test `collection` 固定为这五项，使用目标 full 映射的一次入口；不能删掉 browser 或把不同次 focused 拼成完整 PASS。`basis.materials` 说明目标源码、tests、依赖锁和执行配置，`basis.changes` 说明实际候选差异；目标无独立 Git 基准时省略 commit，不冒用根 B commit 认证尚未提交的目标代码。

准备整组预算 10 分钟（含依赖 / Chromium，单次命令上限 5 分钟）；有限 stories / browser 单命令上限 3 分钟，浏览器 / 测试内部单步 30 秒；正式五项整组预算 10 分钟。预算是本次执行选择，不是探针已经证明的性能保证。实际达到上限保存执行事实，通过既有 MenDi 前台取消 / 本次 child 收尾；不能确认退出时记 unknown 并停 Owner。没有改变代码 / 配置 / 具体疑点时不机械重复其他检查。

browser-check 只处理本项目预览与浏览器，不承担阶段、审核或归档。启动前核对目标 cwd / `.storybook` / 端口，候选默认 6115；冲突时报告或显式选空闲端口，不自动杀占用者。本次启动保留活跃 child 与日志，命令完成 / 失败 / 取消均在 finally 关闭 Chromium，并仅停止本次有活跃身份的服务及进程树，核对 child / 管道关闭和监听结束。不跨会话凭历史 PID 继承停止权；持续开发预览与有限验证分别记录。

普通根 `pnpm check` 继续维护原有 src / scripts / tests；独立 Vue 目标使用自己的格式 / 基础 lint / vue-tsc 入口，不以根 tsc 替代。只为新增目标维护文件落实必要检查与类型归属，可在根 `tsconfig.tests.json` 排除该独立应用，在目标配置中检查它；不批量格式化目标历史、旧 Run、生成物或字节敏感输入。默认不修改旧 test-ui 或 HTML fixture，不新增通用准备 / 多目标调度脚本。

### 6. 一次目标收口与明确的业务失败

独立 Review Apply 通过后，按授权执行目标原生 Archive 一次，核对规格同步、活动目录移除、真实归档位置、累计数和 status / next；不直接执行 sync Skill 再重复 native archive。没有实际归档效果时不勾完成。

正式失败采用明确获授权的验收故障：仅在该目标组件把重置错误地改成回到 initialCount，已有数值 story 的断言仍要求 0。保留正确基线与实际差异，明确这是受控业务故障，不冒称自然发现、Reviewer 漏检或已批准坏候选。首次正式五项入口真实执行并保存 failed，不能用环境错误 / 类型负例或普通 test run 替代。

失败后使用目标 `delivery repair start --from <实际 failed 正式 Run>`，修复 reset=0，执行需要的 focused；独立 `delivery repair review` 固定实际修复 Author 做定向批准，再通过 `delivery full-test run` 新执行原五项完整集合。归档 Change 不复活，不修改其旧 Run / verdict，不重走完整 Explore / Propose。修复后组件重新编译和浏览器观察，旧失败 / PASS 保持各自用途。若碰到实际自然业务失败，可用它覆盖该场景，避免重复注入。

新整次正式 PASS 与材料适用性确认后，按授权执行首轮 Close，核对 closed 查询和旧结果保留。根 C 最后只汇总目标事实交独立 Review Apply，不自动根 Archive / D03 Full Test / Close 或 Git。

正式执行使用 `mendi delivery full-test run --project <目标> --input full-test.json --role author --actor <Author> --pnpm-bin <固定 pnpm JS>`；声明 collection 为 `typecheck / build / build-storybook / stories / browser`，与 verify:full 五项一一对应。修复 review 使用实际 `--author-run`，独立批准后再调用同一 full-test 入口。Close 使用 `delivery close --input close.json`，fullTestRunRef 取实际新 PASS，applicability 说明当前材料、差异和适用理由；不能预填未来 PASS / Run。

### 7. 授权、复用与任务处置

六个分组组织工作范围，不把一组压成一个 checkbox。当前 tasks 拆为 23 项：准备 3 项、目标方案与审核 5 项、实施与检查 3 项、真实恢复与审核 3 项、目标收口 6 项、根汇总与交接 3 项。工程准备、Author 产物、独立 Reviewer 结论及真实收口分别有完成依据；前项完成可以先记录，缺授权或审核的后项继续待做，不用整组全成才更新。不按单条命令、检查或 task 新建 Run，也不把 23 设为 gate。

第 5 组保留目标 Archive、正式业务失败、范围内修复、独立补审、原集合新整次执行和首轮 Close 六个完成单元。这些都是根 C 自身 Archive 前的验收工作，因此属于根 C tracked tasks；根 C 自身 Archive 及根 D03 收口仅列为 Workflow follow-up，不进入当前完成数。

本次只有根 C Propose 授权。后续进入真实流程前，集中列出此唯一目标的 Open、`owner 授权` 激活 `implement-naive-counter` / VUE-COUNTER、必要阶段交接、新 Author 真实会话及 Owner handoff、Archive、正式受控业务失败 / 修复 / 独立补审后的完整重跑和首轮 Close。实际独立 Reviewer 指定 / 会话启动仍由 Owner 另行安排；不把方案批准当作派 Agent 授权，Author 不自签。已明确覆盖本目标的有效授权不重复申请；已撤回的旧目录 / 旧方案授权不自动套用到新目标。

| 原验收范围 | 本次处置与适用边界 |
| --- | --- |
| 两目标真实 Open / 绑定 / 阶段 | 仅 Vue 保留；无 UI 合并为已有稳定安装 / 路径 / 工程命令证据 |
| 协议、工程、真实角色操作 | 分开解释结果；只读方法、脚本 PASS 或 actor 不冒充角色工作 |
| 必须出现审核拒绝 / 修订 | 取消演示要求；实际发现问题才修订补审 |
| 新 Author 恢复 | 保留，合并进唯一 Vue Apply 的真实留待任务 |
| 两目标 Archive / Full Test / Close | 仅 Vue 一次保留；无 UI 取消完整生命周期 |
| Full Test 失败与修复 | 保留实际正式失败、定向补审与原集合新整次执行 |
| Reopen / 新 Open / 旧 PASS / unknown、第二轮交付 | 沿用 D02-C 与现有自动化；取消重复完整流程，仅补接入疑点 |
| 根工程 / 安装 / UI 汇总 | 按本次影响，旧有效结果直接引用；取消范围不记执行通过 |

B 014 的稳定安装 / 方法 / 写入前失败 / 无 UI 工程验证，A 的工具归属 / 服务边界以及 D02-C 结果选择在实现未变化时沿用；它们不证明本 Vue 的浏览器、业务、角色或收口已完成。实际产品缺陷在当前范围局部修复并补受影响验证；行为合同变化须回方案，不预设产品改造任务。

## Risks / Trade-offs

- pnpm 采用父 workspace 或安装 / 运行环境不同 → 目标独立 workspace、一致 CI / pnpm / 依赖检查，保留具体错误，不放宽全局策略。
- Vue 的有限测试组合尚未实际验证 → 在目标显式配置与执行，失败按具体接线修复；不能静默删掉保留集合或借旧 HTML PASS。
- 独立 Reviewer / 新 Author 尚未安排 → 保持合法待审核 / continuing，任务待做，不用脚本生成语义结论。
- 固定预算不能保证所有机器耗时 → 记录本次时间及收尾；有实际原因才调整当前执行安排，不建设通用预算平台。
- 目标位于仓库内且拥有自己的依赖与历史 → 单份受控保存、明确检查归属；不复制整个项目或证据树，不清理未知占用和根锁。

## Migration Plan

没有产品迁移、外接升级或 Git 操作。根独立 Review Propose 批准、Owner 进入 Apply 后才创建新目标；准备不覆盖已有目录。当前 proposal / design / tasks 是计划，23 项尚未执行；018 及此前 Run 和结论保留，本次重新 Propose 另建 019 修订记录。最终交接包含命令、实际结果、限制、必要日志和 AGENTS 要求的 src / tests / scripts 行数前三；无可靠增长基准不补造。
