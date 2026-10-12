# D03-C Vue 目标

本目标由官方 create-vue@3.24.0 --ts --bare --eslint --prettier 从此前不存在的目录直接生成。
唯一 CounterPanel 和三个 stories 已在目标 Apply 接入；当前方案已独立批准，
实际验证及交接结果由本目录 MenDi 最近 Run 承接，Author 不自行填 Reviewer verdict。

## 稳定入口

- MenDi：D:/tools/mendi/acceptance/d03-b-014-review/node_modules/mendi/dist/drivers/cli.js
- OpenSpec：D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js
- pnpm：C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js
- 目标：D:/Projects/MenDi/tests/fixtures/d03-c-vue-project

均以 node 调用。MenDi 显式 --project 上述目标，OpenSpec cwd 为目标，不依赖父工程定位。
实际环境为 Windows / Node 22.23.2 / pnpm 11.22.0 / OpenSpec 1.14.1。
安装和运行保持 CI=1、pnpm_config_verify_deps_before_run=error；依赖与 Chromium 已显式准备，
缺项时报告，不在测试中自动下载或重装。已有缓存 / 安装结果不认证冷安装。

## 最小范围与记录位置

稳定 MenDi 读取目标方法 / instructions / 任务并组织合法交接；
目标经真实方案与独立审核实现同一 CounterPanel；Storybook 展示默认、已有数值和禁用三个状态，
核对加一、重置到 0、页面错误和本次服务收尾。App / stories 共用 Vue / TS / Naive UI 组件，不增加其他需求。

目标当前方案 / 规格 / 任务在 openspec/，目标生命周期与审核 / 测试记录在 .mendi/；
工程命令的必要原始结果也只保存在本目标，例如 artifacts/。
根 MenDi 仅汇总当前 D03-C 的实际结果、限制与直接引用，不复制目标证据树或按目标阶段再建根 Run。
目标位于 MenDi Git 仓库内，文件会出现在根差异；独立 workspace / 子 Agent 不提供写入权限隔离。
目标参与者只能写本目标，产品问题先报告，禁止改根实现、其他目标、安装或任何历史 Run。

## 工程和有限验收入口

当前已有 check（只读格式 / 基础 ESLint / 真正 vue-tsc）、typecheck、build、dev / preview。
目标自己的类型检查覆盖维护 TS / Vue、配置以及后续 stories；根 tsc 不替代 Vue 检查。
历史 Run、生成方法、依赖和生成物不参加批量格式化。

已接入 build-storybook、verify:stories（vitest run --project storybook），
mendi.tests.focused 映射 verify:stories；用稳定 MenDi 普通 focused 运行并保存实际结果。
官方 Storybook 10.6.1 CLI 取得本目标预览 URL，宿主浏览器核对交互；不用 MCP，不要求遍历所有 CLI 能力。
没有必要新增 browser-check、verify:fast / full 或多模式 runner；普通测试不冒充正式 Full Test。

CounterPanel 的 `initialCount?: number` 默认 0，仅用于首次挂载；`disabled?: boolean` 默认 false。
加一将当前值增加 1，重置总是回到 0（包括初值 5），禁用时两按钮和处理函数均不改变值。
App 只挂载同一组件；Default / ExistingValue / Disabled stories 分别验证 0→1→0、5→6→0 和禁用保持 5。
Storybook 10.6.1 Vitest plugin 自动应用 preview annotations，当前不需要重复手写 setProjectAnnotations setup。

在目标 cwd 用上述固定 pnpm 入口执行 `node <pnpm入口> run storybook`，
确认本次 dev 服务后用目标已安装的官方 `node node_modules/storybook/dist/bin/dispatcher.js tools stories preview --attach --port 6115 --input <实际stories JSON> --json` 取得 URL。
已有 story 文件上下文时按真实 absoluteStoryPath / exportName 输入；浏览器进入 preview iframe 验证。
只使用官方本地 dev / build / tools 分支，禁止顶层 `storybook --help` / npx / dlx。
当前额外设置 `COREPACK_ENABLE_NETWORK=0`、`pnpm_config_offline=true`；不称全面网络 gate。
004 Propose 曾误执行顶层帮助、实际意外 downloaded 2 / Packages +211，该历史已保留并纠正入口，不计准备 PASS 或冷安装认证。

普通工程命令每次最多 5 分钟，stories / 浏览器每次最多 3 分钟，内部步骤 30 秒。
实际宿主管理该次单调 deadline、活跃 child 和前台 Ctrl+C，不给 MenDi 虚构 timeout 参数，
不强杀 MenDi PID 伪装完成；取消 / 超时 / 非零后停止后项并保留实际结果与持久化机会。
只关闭本次持有的浏览器 / 预览，候选端口 6115 先核对归属，冲突报告或显式选空闲端口，不杀未知占用。
必要强制停止本次 child 树时，taskkill 最多 5 秒、close / 管道最多 5 秒、监听最多 2 秒；
收尾未确认则保留现场与限制，不自动清锁或重跑。现有短进程取消结论不认证真实浏览器 / Storybook 收尾。

## 当前授权与下一步

根 026 独立批准了 025 最简方案。真实 Owner 随后回复：

> owner 授权上述目标最简流程及两个子智能体

该回复承接已明确的本目标范围：开启唯一 Delivery `d03-c-vue-counter`，
激活并绑定唯一 Change `implement-naive-counter` / 槽位 `VUE-COUNTER`；
启动并协调一个目标 Author 与一个独立目标 Reviewer，完成正常阶段、组件 / Storybook、
普通测试及必要独立审核。授权无需逐阶段重复确认，Reviewer 保持独立，Author 不自签。
两者只写本目标；目标 Review Apply approved 后停在待 Archive，
根 Author 汇总后停根独立 Review Apply。目标当前交接以本目录 `.mendi/` 的 status / next 和最近 Run 为准。

006 Apply 已完成组件与有限验收，交独立 Review Apply；Author 未填批准 verdict。
本次普通 focused 的 001 / 002 分别因锁定依赖的 `global` 和 Vitest 缺少 Vue plugin 失败，
在当前段按影响修正 `.storybook/main.ts` 的 `global: 'globalThis'` 及 Vitest 合并应用 Vite 配置后，
003-focused 退出 0，真实 Chromium 中 1 文件 / 3 tests 通过。该适配仅说明本锁定组合。
原始结果在 `.mendi/delivery-groups/d03-c-vue-counter/tests/003-focused/`，失败记录保留。
MenDi 的依赖预检实际 `error` / 退出 0，执行记录的 command dependencyPolicy 为 `warn`，
本次日志没有下载；不据此宣称冷安装或全面网络阻断。

`check`、`build`、`build-storybook` 均退出 0，分别约 9.987 / 1.575 / 4.838 秒，
各有 300 秒实际调用上限；原始输出在 006 的 `artifacts/engineering-checks.json`。
CUA 没有启用浏览器，使用已授权的目标既有 Playwright 启动真实 headless Chromium，未安装额外 CLI。
前两次宿主观察分别等待自动 play 超时、初值观察器未取得值，失败均保留，先确认自持服务退出再修正观察。
第三次实际打开官方 tools 返回的三个管理页，进入真实 preview iframe；
依照已读安装源码支持的 `embed=true` 关闭自动 play，核对默认 0→1→0、初值 5→6→0、禁用保持 5。
页面错误 / console error 均 0；浏览器已关闭，本次 PTY Ctrl+C 已退出（主动停止为退出 1），6115 连接被拒绝。
浏览器含预览宿主段约 19.407 秒 / 180 秒，单步 30 秒，browser.close 148 毫秒 / 5 秒，监听核对 2 毫秒 / 2 秒。
原始观察、官方输出、截图和收尾在 006 的 `artifacts/`；没有认证 MCP 或取消范围。

官方返回的 URL 如下，服务已停止；需先按上述本地入口启动本目标预览后访问：

- [Default](http://localhost:6115/?path=/story/counter-counterpanel--default)
- [Existing Value](http://localhost:6115/?path=/story/counter-counterpanel--existing-value)
- [Disabled](http://localhost:6115/?path=/story/counter-counterpanel--disabled)

本轮主动维护写入均在本目标，004 顶层帮助的 dlx 缓存 / 包准备副作用另计：
实际 downloaded 2 / Packages +211 已发生，缓存具体位置未逐列，不扫描或清理，也不概括为全过程无目标外副作用。
当前仅使用已经安装的本地分支；保留 vue-docgen 弃用和 Storybook chunk 大小等非阻断警告。

不再要求留待测试或额外新 Author 恢复，不制造审核问题、不恢复目标 Archive / 正式 Full Test 失败修复 / Close、
五项 runner 或额外预算负例。所有历史 Run / verdict 保留，取消项不计通过，授权不允许绕过正常独立审核。
