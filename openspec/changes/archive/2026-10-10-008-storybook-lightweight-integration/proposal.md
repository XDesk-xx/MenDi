# Proposal

## Why

MenDi 已有目标项目测试脚本执行和交付记录，但 UI 工作尚缺明确的工具指导与预览、交互测试交接。按更新后的路线图 §6.2 / MVP-D03-A，将已受审的 HTML-Vite 实验收敛为轻量接入：MenDi 管流程与结果，目标项目拥有 Storybook，Agent 宿主连接实际工具。

## What Changes

- 增加按需的产品 Storybook 工具指导，Change Action 可明确选择 `--tool storybook`，保留未选择与既有 `openspec` 的行为；选择方法不自动安装、启动服务或认证工具能力。
- 明确目标锁定的 Storybook 10.6 CLI：项目脚本、`storybook tools` 与 `storybook skills`；按实际 `--help` 区分本地工具和需要已运行预览的工具。预览是持续服务，目标 Vitest script 是有限测试，分别保存事实与结果。
- 规定预览服务启动、复用与停止的归属证据；未知既有服务不能凭 HTTP 200、相同 story ID 或端口认定为本次目标，也不能被自动停止。
- MCP 由目标项目按需启用官方 addon，宿主连接；框架、manifest、addon 和实际工具调用共同决定可声明能力。未启用 MCP 仍使用脚本 / CLI / 浏览器，不成为所有项目的前置。
- 补按场景分组的轻量 UI 回归及非 UI 回归，明确根工程检查与独立 UI fixture 自身严格 typecheck、依赖和浏览器准备的职责；沿用可靠的 Explore 结果并覆盖尚未认证的边界。

## Capabilities

### New Capabilities

- `storybook-integration`：目标项目 UI 工具的执行环境、CLI / 浏览器 / 条件 MCP 使用、预览服务归属与有限测试结果交接。

### Modified Capabilities

- `action-runs`：明确 Change Action 的可选 Storybook 指导选择、读取和持久读回，保持必要输入、角色边界及无 UI 查询的兼容性。

## Impact

小范围扩展 `src/adapters/methods.ts`、`src/core/actions.ts` 的指导选择 / Run 校验与 `src/drivers/arguments.ts` 帮助，新增 `skills/tools/storybook/SKILL.md`，在 Apply / Review Apply 方法中引用按需 UI 路径。复用已有 `test-execution` 脚本映射与结果协议，不增加服务调度器、MenDi 前端、MCP adapter 或 Run 必填 UI 字段。

根包不新增 Storybook 运行依赖；UI 依赖、配置、stories 与 CLI 版本均属于目标项目。实际认证基线仅为 Windows、Node 22.23.2、pnpm 11.22.0、HTML-Vite / Storybook 10.6.1、Vitest 4.1.11 与 Chromium；MCP 未认证，Vue、独立安装及真实交付留给 D03-B / C。所有实施任务待独立 Review Propose 后执行，本轮不变更主规格或历史 Run。
