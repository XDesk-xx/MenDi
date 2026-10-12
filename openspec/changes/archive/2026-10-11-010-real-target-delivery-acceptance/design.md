## Context

动机见 `proposal.md`。Owner 在 024 Apply continuing 后将 D03-C 收窄为一次最小真实使用：确认稳定 MenDi 能组织目标 OpenSpec 的合法工作与交接，并实际使用 Storybook 展示、测试同一 Vue 组件。目标流程进行到 Apply 独立批准及下一步交接；本轮不认证目标 Archive 或 Delivery Close。

023 已从此前不存在的目录直接调用官方 create-vue@3.24.0 创建空壳并准备依赖、方法和基础检查；024 补准备宿主短时预算 / Ctrl+C / 停止确认。当前实际是空工程，没有计数器、stories、目标 Delivery 或 Change。旧准备项 1.1–1.3 的结果仍适用，当前任务重组为四组 10 项，3/10；023 / 024 中当时的 3/23 等事实不改写。旧 verdict 继续保留，本次方案实质修订等待独立 Review Propose。

根 C 不修改 MenDi 能力合同，`skip_specs: true` 保持；目标自己的计数器规格在目标 Propose 形成。

## Goals / Non-Goals

**Goals:** 取得三个实际结果：稳定 MenDi 定位并读取目标方法 / 任务 / 交接；目标经合法方案与独立审核实施最小组件；Storybook 的三个状态、交互和必要工程检查实际可用。根 tasks 按完成结果合并，不为每个阶段或命令追加根验收项。

**Non-Goals:** 新 Author 恢复演示、故障注入、目标 Archive、正式 Full Test / repair / Close、第二轮生命周期、MCP 认证、工具升级、通用执行器或额外预算负例。取消范围见 tasks 的处置表；取消不等于通过，也不代表现有 MenDi 功能被移除。

## Decisions

### 1. 单一目标与既有准备

目标固定为 `D:/Projects/MenDi/tests/fixtures/d03-c-vue-project`，沿用 023 创建的唯一官方空壳，不重新生成、不复制探针或旧实现。目标源码、UI 工具、OpenSpec、Run 和必要结果在本目标长期保留；依赖与生成物按目标已有忽略规则处理，`.tmp` 不承担唯一输入或证据。

| 工具 | 固定入口 / 环境 |
| --- | --- |
| MenDi | D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/drivers/cli.js |
| OpenSpec | D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js |
| pnpm | C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js |
| 实际环境 | Windows / Node 22.23.2 / pnpm 11.22.0 / OpenSpec 1.14.1 |

入口均由 node 调用，MenDi 显式 `--project <目标绝对根>`，OpenSpec cwd 为目标。Vue 3.5.43、Naive UI 2.45.3、Storybook / vue3-vite / addon-vitest 10.6.1、Vite 8.3.0、vue-tsc 3.3.13、TypeScript 5.9.3、Vitest / browser-playwright 4.1.11 和 Playwright 1.60.0 沿用目标现有锁文件。安装 / 运行保持目标既定 CI=1 与依赖检查策略；不为新任务重装、升级或认证冷安装。

现有目标 AGENTS、OpenSpec rules / guidance 和 README 尚有旧的“新 Author 留待完整验收 / 五项 full 脚本”约定。下一 Apply 在目标操作前局部同步这些当前说明，只移除已取消要求并保留身份、角色、目标路径与历史保护；本次 revise-propose 不写目标文件。

### 2. 一次正常流程与角色分工

目标 Delivery 为 `d03-c-vue-counter`，唯一槽位 `VUE-COUNTER`，唯一 Change 为 `implement-naive-counter`。取得覆盖该目标的明确 Owner 授权后 Open、原生 new change 一次并绑定，不重复创建。新 Change 激活的 Owner 原始消息须包含连续 `owner 授权`；根方案批准、旧撤回授权和子 Agent 自述不能替代。

目标按 MenDi 现有合法顺序自然推进：Explore → 独立 Review Explore → Propose → 独立 Review Propose → Apply → 独立 Review Apply。Explore 仅核对已有空工程、方法、组件接入必要事实，不重新研究框架或实现计数器；Propose 形成目标自身 proposal / specs / design / tasks，经独立批准后实施。真正读取 `action start / continue` 返回的方法与当前 instructions / context / rules；保存真实产物，不以 actor、ready 或文件齐备代替实际工作。

获明确会话启动与目标阶段交接授权后，可由一个目标 Author 和一个独立目标 Reviewer 完成这些阶段。Reviewer 审核当时固定的 Author / 产物，真实发现问题才修订补审；Owner 无需亲自逐阶段审核演示工程。当前根 Author不自签、不自动派 Agent。取消额外新 Author 恢复和必须留下未做业务测试的安排，获授权目标 Author 可一次完成必要实现与验收。

根只确认最终目标方案确经批准、实施与验收有实际结果、目标 Review Apply approved，并读取其合法下一步；不为各阶段另设 proof、重复验收、Owner 确认或根 Run。目标独立审核仍是流程要求，合并根任务不跳过这些阶段。根 Review Apply 是最后另一个独立边界，不由根 Author 自动切换角色完成。

### 3. 记录与修改归属

| 位置 | 保存内容 / 写入责任 |
| --- | --- |
| 目标 openspec/ | 目标当前方案、规格、任务；由获授权目标 Author 维护 |
| 目标 .mendi/ | 目标 Delivery / Change / Action / Run / 测试结果与实际 verdict；由目标工具和对应角色维护 |
| 目标其他工程文件 | 组件、stories、检查配置、必要结果和使用说明 |
| 根 D03-C 当前 Run | 本段验收进展、结果 / 限制、少量必要目标入口引用，由根 Author 汇总 |

目标目录位于 MenDi Git 仓库内，因此工程文件会出现在根 Git 差异中；独立 workspace / 角色不提供文件权限隔离。目标参与者的写入范围仅该目标目录，禁止扩散到根源码、安装位置、其他 fixtures、根 / 其他 Change 的 Run。发现 MenDi 产品问题先报告当前事实，由根 Author 判断必要范围，不在目标工作中顺手修复根工程。

目标阶段记录只留在目标目录，不转成根 Action / Run，不复制目标项目、日志或证据树到根 artifacts。根仅直接引用实际必要目标材料，详细来历由目标记录承接，不累积所有旧引用。根继续 manual-bootstrap，不用产品写命令迁移根历史。023 / 024 和全部已提交记录保持原样，本次 025 只记录根方案修订。

### 4. 最小组件和 Storybook 实际使用

`App.vue` 只挂载唯一 `CounterPanel.vue`。组件使用 Composition API、`<script setup lang="ts">` 和 Naive UI 按钮；应用与 stories 共用该组件，不引入后台、Router、Pinia、持久化或无关任务。

| 场景 | 实际预期 |
| --- | --- |
| 默认 | 显示 0 |
| initialCount=5 | 初次显示 5 |
| 加一 | 当前值 +1 |
| 重置 | 不论初值，回到 0 |
| disabled=true | 两个按钮禁用，值不因操作改变 |

目标编写默认、已有数值、禁用三个真实 stories，用 Storybook Vitest plugin / Chromium 做有限交互断言。至少一次通过稳定 MenDi 的普通 `test run` focused 入口运行目标 `verify:stories`，确认选择的是该目标脚本且实际结果保存在目标；不要求同时重复直接 pnpm 整套运行，不冒充正式 Full Test。

使用 Storybook 10.6.1 官方 CLI 的当前 stories / preview 入口取得真实目标 URL，由宿主浏览器查看组件、核对交互与页面错误。只记录实际使用能力，不要求遍历 CLI 的所有命令，不启用 MCP。截图、CLI URL 或静态 build 不能独自证明交互成立。修改影响业务时只补相关新结果，不人为制造修订或另造修改任务。

### 5. 必要检查、执行时限和服务归属

保留目标已有 `check`（只读格式、基础 ESLint、真实 vue-tsc）与应用 `build`；增加必要 `build-storybook` 和 `verify:stories`（`vitest run --project storybook`）。`mendi.tests.focused` 映射到 `verify:stories`；其他 suite 不为这次验收补建。浏览器由宿主实际工具连接，不强制新建独立 browser-check、verify:fast / full 或多模式执行脚本。所有目标维护 TS / .vue 由目标真正检查，根现有排除归属保持。

普通工程命令仍每次最多 5 分钟，stories / 浏览器有限验收每次最多 3 分钟，测试 / 浏览器内部单步 30 秒。实际调用者是目标 Author 的宿主：每次直接工程调用用同一上下文的单调 deadline 与当前子进程控制到期，取消用已确认的前台 Ctrl+C；不虚构 MenDi timeout 参数。普通 MenDi test 调用保留 CLI 取消与结果持久化机会，不直接强杀 MenDi PID 伪装完成。到期、取消或非零即停止后项并如实报告，不接纳迟到成功；本次不认证整个 CLI 准入 / 同步预检 / 持久化的总时限。

只管理本次明确启动、仍持有的活跃服务 / 进程与浏览器。预览默认候选 6115，先核对目标 cwd / 配置 / 端口，冲突报告或显式选空闲端口，不杀未知占用。正常关闭浏览器与预览，核对实际退出和监听结束；必要强制停止沿用本次持有 child 树、taskkill 最多 5 秒、close / 管道最多 5 秒、监听最多 2 秒的有限确认。未确认则保留现场、限制与实际记录，停在当前操作，不自动清锁或重跑；finally / taskkill 文本不能代替实际收尾。

023 / 024 准备与短时取消结果直接沿用，保留跨进程原组预算未被认证、冷安装未认证、Chromium / Storybook 实际收尾尚未认证等限制。原正式五项 full 的共享 10 分钟 deadline 随正式 Full Test 验收一并取消；不另造统一执行器、停止未确认替身、迟到 0 等额外接线验收矩阵。实际遇到相关问题按影响处理，不追加历史补证。

### 6. 根汇总、取消范围与结论边界

目标 Review Apply 批准后，根汇总三项保留结果、必要命令 / 限制与直接目标引用，并核对目标下一步。不执行目标 Archive / 正式 Full Test / repair / Close，不为根 C 完成假装整个目标生命周期已经收口；目标可合法停在待 Archive。

取消新 Author 恢复、目标收口及失败修复演示、正式五项 runner、额外预算负例；保留项与旧 23 项对应及取消原因在 tasks 统一列明，不勾成“已执行通过”。取消无 UI 完整生命周期、第二轮交付、强制 finding 等旧决定继续有效。无 UI 只沿用 B 的适用工程结果；A 的工具归属、B 的稳定安装 / 方法、D02-C 的结果选择与既有自动化按未变范围复用，不覆盖本 Vue 的业务或角色工作。

根工程检查按实际变更影响执行；目标 UI 源码由自己的检查承担，未变化的根测试不机械重跑。Apply / Review Apply 摘要仍列 AGENTS 要求的 src / tests / scripts 维护行数前三与可靠增长 / 职责判断，不新增台账、hash、引用链或 gate。根 Author 最终 complete 后停根独立 Review Apply。

## Risks / Trade-offs

- 目标流程误写根路径 → 明确目标写入范围、显式 --project / cwd、目标记录单份保存；实际越界先停操作并报告。
- 已有目标说明仍含旧留待 / full 要求 → 根修订批准后，下次 Apply 在目标操作前只同步当前说明，不改目标历史。
- 浏览器或 Vue 接线存在实际问题 → 在目标按影响修正、取得新结果，不用空工程或旧 HTML PASS 代替。
- 最小验收不覆盖目标归档、正式失败修复、关闭或新会话恢复 → 明确取消且不声明已验证，沿用旧能力结论的限定用途。
- 目标授权 / 独立角色尚未成立 → 保持合法待交接，不预造 Owner 消息、角色或 verdict。

## Migration Plan

本次只修根 C 的已有规划产物、路线图对应范围和当前交接入口，不写实现或目标规则。025 为正式交接后的新 revise-propose；022、023、024 及更早 Run / verdict 原样保留，旧批准不自动覆盖本次改变的范围。

独立 Review Propose 批准后，Owner 再决定继续 Apply及具体目标 / 会话授权。直接沿用已有空壳与准备结果；根当前 tasks 的 3/10 是对既有三个完成项的保留，不代表七项新范围已执行。根 C Archive、根 D03 正式 Full Test / Close、Git 与清理保持后续独立边界。
