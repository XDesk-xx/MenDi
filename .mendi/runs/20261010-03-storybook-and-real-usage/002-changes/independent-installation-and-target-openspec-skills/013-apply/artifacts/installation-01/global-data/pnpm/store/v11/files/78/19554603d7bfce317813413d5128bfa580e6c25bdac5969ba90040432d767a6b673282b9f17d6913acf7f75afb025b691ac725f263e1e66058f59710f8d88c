---
name: mendi-storybook
tool: storybook
---

# 目标项目 Storybook 指导

MenDi 管交付流程与结果，目标项目拥有 UI 工具、配置和资产，Agent 宿主负责实际工具连接。本指导只按明确选择读取；读取不执行工具、不启动服务、不批准 UI 或 Change。非 UI 目标沿用原有路径，普通 status / next 不要求 Storybook / MCP。

## 必要输入与执行环境

先明确目标绝对路径与 cwd、实际 `.storybook` 配置位置、所选组件 / stories、项目 scripts、package / lock 和真实 Node / 包管理器 / 平台版本。调用目标已安装的 binary，缺少配置、工具、依赖或浏览器时指出缺项及未执行事实，不使用 MenDi 目录的同名包替代，不自动安装或升级。

当前已验证组合为 Windows x64、Node 22.23.2、pnpm 11.22.0、HTML-Vite / Storybook / addon-vitest 10.6.1、Vitest 4.1.11、Playwright 1.60.0 与 Chromium 1223。MenDi 本地测试执行协议仍限定 Windows / Node 22 / pnpm 11.22.0；其他框架、平台与包管理器按真实验证说明，Vue 与独立安装 / 真实交付由后续范围验证。

工具使用前关闭包管理器的隐式准备，PowerShell 可设置 `$env:COREPACK_ENABLE_NETWORK = '0'`、`$env:pnpm_config_verify_deps_before_run = 'error'`；缺准备停在具体问题，安装仍是单独显式动作。实际 cwd 必须为目标，同时核对配置目录；不能仅从 MenDi 根传 `--cwd` 就假定配置定位正确。

依赖由操作者在目标显式按锁文件准备，例如 `pnpm install --frozen-lockfile`；浏览器也须显式准备。已安装 addon-vitest 的 Vitest plugin 路径不代表 MCP 已启用。当前 fixture 的 `define.global` 是本锁定组合的适配，不能推广为通用要求。

## 项目脚本与官方 CLI

在目标 cwd 按实际脚本名称执行；名称不必与示例相同。持续预览示例 `pnpm run preview:components`（目标 script 使用 `storybook dev`），有限测试示例 `pnpm run verify:stories`（`vitest run --project storybook`）。有限测试使用目标已有 focused 映射与 MenDi 的结果协议，不要求先启动 dev server；服务存活不证明交互测试通过。

Storybook 10.6 使用目标安装的官方入口：

```powershell
pnpm exec storybook tools --help
pnpm exec storybook skills --help
pnpm exec storybook skills stories
```

先核对该目标帮助中真实工具与参数。本地工具按需使用 `--no-attach`，显式 `--cwd` / `--config-dir` 定位目标；需要运行服务的工具先确认服务归属，用 `--attach` 防止静默本地回退。示例在归属确认后使用实际索引中发现的 ID：

```powershell
pnpm exec storybook tools stories preview --attach --port 6113 --input '{"stories":[{"storyId":"proof-counter--basic"}]}' --json
```

PowerShell JSON 使用单引号，其他 shell 按实际环境引用。URL 返回后用真实浏览器核对渲染、状态、交互与错误；读取 Skill 或工具帮助只确认方法 / 入口，不证明业务能力。帮助可能列出目标条件尚未满足的工具，实际失败须如实记录。不要用无子命令的 `storybook --help`、`npx` 或 `pnpm dlx` 触发远程 CLI 下载。

当前实际本地发现可用 `tools stories find-by-component --no-attach --input '{"componentPaths":["<实际 story 绝对路径>"]}' --json` 取得该文件的 story ID；组件反向依赖发现仍按目标 builder / 实际返回核对。官方预览 URL 可能为管理页 `/?path=/story/...`，组件在 preview iframe 中；打开 URL 后进入对应 frame 验证，不能在管理页顶层猜测组件已渲染。

## 服务启动、复用与停止

启动前检查端口与实际目标；本次启动保存 cwd / script / 配置、启动日志、访问地址及仍活跃的 child。继续使用同一已知 child 时确认其存活与实际 stories，不重复启动。

既有服务需操作者核对目标 / 配置、实际启动来源 / 活跃进程和访问位置，记明外部归属。HTTP 200、端口、相同 story ID 或历史 PID 均不能单独确认身份；未知占用报告冲突，不自动复用或结束。目标允许时显式换端口。确认外部服务后可复用，但不取得停止权。

收尾仅停止本次拥有且仍能确认活跃身份的服务及所属进程树，核对进程 / 日志关闭和对应监听 / 访问结束。失去活跃身份就停止处置并说明限制，不凭历史 PID 跨会话清理。主动停止预览的非零退出单独说明，不冒充有限测试断言失败。不建立服务注册表、通用恢复器或 PID gate。

## 有限测试与更新后结果

有限测试记录目标、环境、选择范围、实际退出与必要日志。发生缺陷时保留真实失败；修复组件 / story 或更新文字后实际重新执行所需测试，并取得新的浏览器观察。显式旧结果仍保留，不能充当新代码确认。所选范围外的测试不宣称通过，普通 command 成功不代替正式 Delivery Full Test。

交接保存当前 Run 中必要直接事实：目标 / 配置、版本 / 范围、实际预览 URL 与观察、有限执行结果入口、服务启动 / 复用 / 停止事实、失败及未验证能力。原始输出只保存一次，不为 UI 添加必填 Run 字段、全量 hash、递归引用前置或证据图。

## 条件 MCP

目标按需启用官方 `@storybook/addon-mcp`，宿主负责连接目标官方地址和发现工具。连接前同样核对服务归属；安装 addon、默认 toolsets 开关或可访问端口均不认证能力。

- dev：目标启用 addon，所需 feature 满足，宿主发现并真实调用所需工具。
- docs：框架实际生成 components manifest，目标配置 / 工具和调用成立；HTML 实验没有认证此能力，Vue 10.6 的相关能力仍需真实目标验证。
- test：`@storybook/addon-vitest` 已安装且在 Storybook 中启用，test toolset 与真实工具调用成立。仅 Vitest plugin 使用该包、`addons: []` 不证明 MCP test-run 可用。

实际 MCP 工具名按宿主发现返回，不从 CLI 名称猜测。未启用、未连接、未调用或调用失败分别说明；继续适用的项目脚本 / CLI / 浏览器，不让 MCP 成为普通交付前置，不用模拟响应认证。Storybook `review create` / review 链接只组织 UI 展示，不给 MenDi 独立 Reviewer verdict 或 Owner 视觉批准。

官方来源：[10.6](https://storybook.js.org/releases/10.6)、[MCP API](https://storybook.js.org/docs/ai/mcp/api)。具体命令与能力以目标版本实际帮助 / 调用为依据。
