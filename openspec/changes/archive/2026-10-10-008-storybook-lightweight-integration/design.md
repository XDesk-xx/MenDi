# Design

## Context

动机和范围见 [proposal](proposal.md)。[002 Explore](../../../.mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/002-explore/run.md) 的受控 HTML-Vite 实验已由 [003 Review Explore](../../../.mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/003-review-explore/run.md) 独立批准；真实两份 story、错误失败、修复后新结果、已知 child 复用 / 停止和无 UI 入口可以沿用，不能推导任意既有服务、Vue 或 MCP 已认证。

现有 `loadMethods` 与 Run 校验只接受 `openspec`；CLI 已有单个 `--tool`，Run 已有 `toolGuidance`。`test-execution` 已支持目标异名 scripts、focused / fast / full 映射、持久结果和 Windows 活跃 child 取消；不需要新增 Storybook 进程 adapter。根包 `files` 已包含 `skills/`，实际独立安装正确性由 D03-B 验证。

## Goals / Non-Goals

**Goals:** 将按需 UI 方法加入现有 Change Action，给 Author / Reviewer 可执行的目标定位、官方工具使用和结果检查办法；根工程与独立 UI 目标分别承担真正类型检查；新增验收按场景分组，保持旧 proof 的限定用途。

**Non-Goals:** 不新增 MenDi 前端、服务管理命令、MCP 协议层或通用进程恢复；不修改测试脚本执行协议，不给每个 Run / next 添加 UI 必填字段；不实现 B 的独立安装或 C 的真实 Vue / 无 UI 全流程验收，不执行本次归档与正式 Full Test。

## Decisions

### 1. 按需指导使用既有选择与记录路径

增加 `skills/tools/storybook/SKILL.md`，头部为 `name: mendi-storybook`、`tool: storybook`。在 `src/adapters/methods.ts` / `src/core/actions.ts` 的有限允许值中加入 `storybook`，仍拒绝未知 / 重复值，先读有效方法再分配 Run。更新 CLI 帮助，在 Apply / Review Apply 方法中加入仅对 UI 范围适用的指导与直接结果检查。

保持单个 `--tool openspec|storybook` 的现有参数模型，不扩展多选协议；选 Storybook 不妨碍 Author 按阶段独立使用 OpenSpec。空指导与旧 openspec Run 不变；Delivery 操作保持其现有空指导范围。工具内容从 MenDi 实际包位置读取，目标配置 / 依赖从目标位置读取。未选择指导不访问其文件，普通 status / next 不探测 UI 环境。

选择扩展既有方法而不提供专用 `mendi storybook`：产品只组织工作与结果，Agent / 操作者执行工具，避免引入目标资产所有权或服务状态机。

### 2. 官方 CLI 使用目标锁定入口，服务与有限测试分开

执行前记录目标绝对路径、cwd、`.storybook` 位置、实际 package / lock、Node / pnpm / 平台、浏览器准备，以及本次所选范围。基线为 Windows x64、Node 22.23.2（MenDi 支持约束 `>=22.20 <23`）、pnpm 11.22.0、Storybook / HTML-Vite / addon-vitest 10.6.1、Vitest 4.1.11、Vite 8.3.0、Playwright 1.60.0 与本机 Chromium 1223；其他组合按目标真实验证，不写成普遍支持。

| 路径 | 目标 cwd 中的明确入口 | 输入 / 运行条件 | 结果含义 |
| --- | --- | --- | --- |
| 持续预览 | `pnpm run preview:components`，本 fixture 为 `storybook dev --host 127.0.0.1 --port 6113 --ci --no-open --exact-port --disable-telemetry` | 目标已有依赖 / 配置，端口和归属核对；脚本名可不同 | 活跃服务、日志与实际浏览器观察，不能算有限测试通过 |
| 有限交互测试 | `pnpm run verify:stories`，本 fixture 为 `vitest run --project storybook` | 目标 Vitest plugin、所选 stories 和浏览器已准备；复用 `mendi.tests.focused` 映射 | 一次有限执行的选择范围、退出、断言和持久输出；不要求先启动 dev server |
| 官方 tools | `pnpm exec storybook tools --help`；按帮助选 `stories changed --no-attach --json`、`stories find-by-component` 等本地能力 | 目标已安装 Storybook 10.6.1，`--cwd` / `--config-dir` 可显式定位；帮助标注本地 / 服务要求 | 发现 / 元数据不是 UI 测试 PASS；实际调用失败按实记录 |
| 官方预览工具 | `pnpm exec storybook tools stories preview --attach --port 6113 --input '{"stories":[{"storyId":"proof-counter--basic"}]}' --json` | 先确认该端口属于目标，再使用真实发现的 story ID；服务调用不允许悄悄退回其他项目 | 返回实际预览 URL 后再用浏览器验证；示例 ID 须以目标索引读回为准 |
| 官方 Skills | `pnpm exec storybook skills --help`、`pnpm exec storybook skills stories` | 目标版本与配置；按实际帮助取得目标提供的 Skill | 阅读工作方法，不自动安装至宿主、不等于执行完成 |

表中参数是目标命令示例；PowerShell JSON 使用单引号，其他环境按实际 shell 正确引用，不沿用错误转义。只调用目标已安装 binary，缺失时报未执行，不用 `npx` / `pnpm dlx` 自动获取最新版，也不通过无子命令的 `storybook --help` 触发 dispatcher 的远程 CLI 回退。本轮直接读取 10.6.1 dispatcher（`dev/build/index/ai/tools/skills` 走本地 core）并实际运行 `tools --help` / `skills --help`：帮助和入口已核对，具体 tools 业务调用仍需 Apply 验证，列在帮助中不代表条件已满足。

沿用真实 `@storybook/addon-vitest` plugin 路径，旧 test-runner 尝试保持历史，不推广为首选。fixture 的 `define.global` 只修正本锁定 Vite / Vitest 组合的问题，不写成所有目标的要求。官方 [10.6 发布说明](https://storybook.js.org/releases/10.6) 说明 tools / skills CLI 与实验性 Vue 支持；具体语法以本轮目标帮助为依据，见 004 artifacts。

### 3. 归属由操作者保留直接事实，不用健康检查代替身份

启动前核对端口与目标。本次启动保存目标 cwd / script / 配置、启动日志、活跃 child 和地址；正常继续复用同一 child，并检查实际 story / 浏览器。既有服务只有在操作者能核对目标与配置、实际启动来源 / 活跃进程和访问位置时才复用，记录外部归属；复用不取得停止权。仅 HTTP 200、相同索引 / ID、记录过的 PID 或 `--port` 能连通都不够。

对未知占用报告冲突，不自动停止、不猜测归属；目标允许时显式选择另一端口。本次收尾只停止仍持有活跃身份的自身进程树，读回 child / 日志关闭及对应访问 / 监听结果；Windows 沿用已验证的活跃进程树方法，不凭保存的历史 PID 重启会话后清理。失去身份时报告无法安全停止，不构建恢复器。外部服务留给其所有者管理。

这是工作方法和场景测试约束，不新增持久服务注册表 / PID 认证 gate。有限 Vitest 测试独立运行和退出，其失败 / 新结果按已有产品协议保存；主动停止预览的非零退出单独说明，不伪装成断言失败。

### 4. MCP 仅由目标与宿主按实际能力启用

目标按需安装 / 注册官方 `@storybook/addon-mcp` 并配置 `toolsets`；安装是显式项目准备，MenDi 不自动添加。Agent 宿主负责连接目标官方服务地址和工具发现；连接前仍按上述规则确认目标，不能从端口获得身份。无 MCP 的 HTML fixture 继续脚本 / CLI / 浏览器路径。

| 能力 | 必要条件与认证范围 |
| --- | --- |
| dev | target addon 已启用，所需 feature 满足；按宿主真实工具列表逐项调用，不从默认 `dev: true` 推导全部可用 |
| docs | 框架实际生成 components manifest，目标配置与工具可用；HTML 实验未认证此能力，Vue 10.6 支持处于实验阶段，D03-C 按真实 Vue 项目验证 |
| test | `@storybook/addon-vitest` 安装且在 Storybook 中启用，test toolset 满足并实际调用；fixture 只在 Vitest plugin 使用该包且 `addons: []`，不能推导 MCP test-run 存在 |

官方 [MCP API](https://storybook.js.org/docs/ai/mcp/api) 将 toolsets 开关和 docs / test 条件分开。宿主发现与真实调用的工具名以返回为准，不能把 CLI `stories preview` 的名称直接当 MCP 名称。未启用 / 未连接 / 未调用分别注明，失败保留具体限制，降回适用的脚本与浏览器。Storybook `review create` / MCP review 链接仅组织 UI 展示，不改变 MenDi Reviewer 身份、verdict 或 Owner 授权。

A 必须验证没有 MCP 时的主路径与方法的条件说明；若当前目标和宿主已明确启用 MCP，再验证所需工具，否则记录“未认证”，不为得到 PASS 安装可选工具或假造 MCP 结果。MCP 的失败不影响确实独立且成功的有限脚本结果，也不被后者掩盖。

### 5. 根工程与独立 UI 目标分开准备、严格检查

独立 fixture `tests/fixtures/storybook-project` 是有自身 package / lock / tsconfig 的目标。根 `tsconfig.tests.json` 目前无意包含它，导致普通根 `pnpm check` 依赖 Storybook 安装；A 实施时只从根 TypeScript include 排除这一独立目标，由其严格 `pnpm run typecheck` 检查 src、`.storybook`、Vitest 配置和浏览器脚本。根 maintained src / tests / scripts 继续三个真实 tsc 检查，UI fixture 仍参与维护格式 / lint（保持现有敏感夹具排除）。不增加 `@ts-nocheck` 或用运行成功代替类型检查。

增加显式有限 `pnpm test:ui` 入口与 `tests/ui/` 场景组；该入口先检查已准备环境并运行目标自身 typecheck，再 build / 执行 UI 场景。操作者按 fixture 的锁文件在该目录显式 `pnpm install --frozen-lockfile`；浏览器缺失时明确提示显式准备，不自动下载，不宣称空环境免准备。根 `pnpm test` 保持无 UI 依赖的产品回归；新 UI 场景 TypeScript 由根测试配置检查，使用 Node 标准 API 调用目标 binary，不把 UI 包导入根依赖。

新增测试分别覆盖方法选择 / 旧 Run / 非 UI（现有根 tests）、预览归属与浏览器、有限失败 / 更新后新结果、CLI 帮助 / 实际适用本地调用、可选 MCP 条件。使用临时沙箱但输入来自受控 fixture，输出写到当次明确指定 artifacts；每份原始输出保存一次，测试中旧结果字节比较继续保留。扩展新场景不继续堆入 `scripts/proofs/mvp-d03-a-explore.ts`，不复制整套历史 `.mendi/runs`。根检查与 UI 检查各自失败都须具体修正，后续 Apply / Review Apply 必须实际运行两者，不以根排除宣称 UI 编译已通过。

选择独立检查而非给根包装 Storybook：保持目标依赖所有权、非 UI 使用与有限准备范围。B 仍需验证稳定安装 / Skills / 所有目标路径及平台支持；C 承担真实 Vue 状态、交互、修改后的新结果和非 UI 全流程。

Apply 具体化：新增显式 `prepare:ui-tests <新的绝对 .tmp 子目录>`，从维护 fixture 为每个场景准备隔离目标，使用冻结锁文件 / 已有 store 离线安装。操作者设置 `MENDI_UI_TARGETS_DIR` 后才运行 `test:ui`；后者检查和执行，不自动安装。直接共享 fixture node_modules 的 junction 被 pnpm 的真实 workspace 结构预检拒绝，故不采用、不改写安装元数据绕过检查。首次冷安装支持仍留给 B / C。

格式 / lint 配置直接选择根维护测试、`tests/ui/` 与 Storybook fixture 的 TypeScript；受控 UI 代码的 debugger 负例确实失败，历史 / 敏感 fixtures 与 lock / 生成物不被纳入。官方 `stories preview` 返回管理页 URL，浏览器须进入 preview iframe；缺 story 返回逐项 error，不能仅看 CLI exit 0 宣称成功。

## Risks / Trade-offs

- [10.6 AI 能力处于演进中] → 固定目标版本、实际帮助和真实调用，方法写清可用 / 未认证；不承诺跨框架一致。
- [帮助可能列出配置不满足的工具] → 分清入口认证和业务结果，CLI / MCP 均用实际调用判断能力。
- [未知服务可能属于他人或另一项目] → 端口 / 索引不够，未核对不复用不结束；服务归属留直接事实。
- [根排除 UI fixture 后漏掉其编译] → `test:ui` 先执行 fixture 真正 typecheck，Apply / Review Apply 必跑并记录；冷安装支持由 B / C 另验。
- [受控 HTML 结果范围有限] → 002 / 003 proof 仅作明确基线；Vue / MCP / 稳定安装及真实交付不借此宣布完成。

## Migration Plan

独立 Review Propose 后按 tasks 添加指导、小范围允许值与场景测试，无数据迁移。旧 Run 与 verdict 不改写，旧空 / openspec 指导继续读回，主规格在后续真实 Archive 同步。回退新指导选择只影响选择它的新 Run，已有记录保留并准确报告不支持；不为兼容性删除历史或伪装完成。D03-B / C 与正式 Delivery 验收保持原授权边界。
