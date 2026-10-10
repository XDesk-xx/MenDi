# Tasks

以受审方案和两份 delta 为范围；checkbox 只记录实施任务进度，不代表独立批准或实际归档。

## 1. 可选指导与既有记录兼容

- [x] 1.1 新增 `skills/tools/storybook/SKILL.md`，按 design 明确目标定位、锁定版本、官方 tools / skills、持续预览与有限测试、归属证据、执行环境及条件 MCP；在 Apply / Review Apply 方法中加入范围适用的 UI 指引。通过真实 `loadMethods` 返回文件 / 内容、人工核对三方归属与四项边界验证，不能让选择指导自动运行工具。
- [x] 1.2 在 `src/adapters/methods.ts`、`src/core/actions.ts` 和 CLI 帮助中支持现有单个 `--tool storybook`，保留空 / openspec 和 Delivery 空指导协议；补 `tests/methods-and-numbers.test.ts`、`tests/actions.test.ts` 的真实方法选择 / Run 解析用例，验证身份错误、缺文件、未知 / 重复选择拒绝，未选择不读缺失可选文件，不改旧 Run。
- [x] 1.3 在 `tests/action-cli.test.ts` / Action 写入回归中验证显式选择后 start、submit / continue 及跨进程读回一致，缺必要指导时分配前失败 / 记录不变；同时验证无 UI / MCP 的目标、空及 openspec 旧记录查询照常。更新 README 的按需选择示例并实际核对帮助和路径；不增加 UI 必填字段或查询探测。

## 2. 独立 UI 目标准备与检查职责

- [x] 2.1 根 `tsconfig.tests.json` 只排除 `tests/fixtures/storybook-project` 独立目标，保留 maintained 测试 / 脚本真正 typecheck；增加显式 `pnpm test:ui` 有限入口，先核对目标依赖 / 浏览器且运行 fixture 自身严格 typecheck，再 build / 执行 `tests/ui/` 场景。用隔离、未准备 UI node_modules 的根检查与缺准备的 UI 入口验证：根 `pnpm check` 不依赖 UI 包，UI 入口明确失败且不下载安装、不产生 PASS。
- [x] 2.2 添加受控 UI 测试准备 / 场景辅助（TypeScript，纳入真实类型检查），复用 fixture 而不扩写旧 Explore proof；仅按场景需要创建沙箱、启动已知目标并保存一次原始输出，失败亦收尾本次拥有的服务。README 写明目标 `pnpm install --frozen-lockfile`、浏览器显式准备、fixture typecheck 与 `test:ui` 的职责；实际成功运行目标 typecheck，并通过故意类型错误的隔离副本确认该入口确实拒绝编译失败。

## 3. 官方 CLI 与预览服务场景

- [x] 3.1 在 `tests/ui/` 的 CLI 场景读取目标 Storybook 10.6.1 `tools --help` / `skills --help`，执行适用的实际本地工具调用及读取目标 Skill，验证 cwd / 配置正确、无须启动服务的路径和缺工具 / 配置时明确失败；不触发远程 CLI 回退。将实际命令与限制回填产品指导 / README，帮助里列出的业务能力不能直接认证。
- [x] 3.2 在预览 / 浏览器场景使用真实 Basic / Disabled，保存目标入口、活跃 child、日志和访问位置；用官方 `stories preview` 返回 URL 后实际打开，核对渲染、状态、交互与错误，并验证同一已知 child 复用不重复启动、收尾仅停止自身且读回服务结束。缺浏览器 / story 和实际调用失败须为未验证 / 失败，不把 URL 当 PASS。
- [x] 3.3 加入占用端口 / 空索引及另一目标相同 story ID 的负例：未知服务不能被自动复用或停止；外部服务可在操作者核对来源后使用但不被本次收尾结束，丢失活跃身份不凭历史 PID 停止。用受控进程验证它们在拒绝 / 收尾后仍存活，并在指导中说明人工归属核对的边界，不构建服务注册 / 恢复器。

## 4. 有限测试、新结果与 MCP 条件

- [x] 4.1 在 `tests/ui/` 有限测试场景通过目标 `verify:stories` / focused 映射实际执行两份交互 story；隔离副本注入错误得到失败，修复并改文字后获取新的测试和浏览器观察。核对执行范围、真实退出、日志、新旧记录查询及旧文件字节未改；验证不需要 dev server 的测试路径，预览停止退出不被当作断言结论。
- [x] 4.2 用无 MCP 的真实 UI 目标验证脚本 / CLI / 浏览器主路径，同时核对 addon / toolsets / manifest / 宿主发现的条件说明，明确 fixture 的 Vitest plugin 不等于 MCP test addon 已启用。若本次项目 / 宿主已明确启用 MCP，则只对发现的所需工具做真实调用并保存具体成功 / 失败；否则明确“未启用 / 未认证”，不安装可选工具、不用模拟响应认证 MCP。独立 Reviewer 核对这一条件与未启用路径，Storybook review 链接不生成 MenDi verdict。
- [x] 4.3 更新 README 和产品方法的结果交接示例，列出目标 / 版本 / 范围、实际预览 / 测试 / 服务处置事实与必要直接输出，明确 HTML 已验证、Vue / MCP / 其他平台尚未认证及 B / C 后续职责。按本轮实际记录核对声明，无全量 hash、递归 Ref 前置、证据图或历史补证。

## 5. 综合验证与 Author 交接

- [x] 5.1 执行根 `pnpm check`、受影响方法 / Action / 查询 / 测试入口回归、`pnpm test:ui` 与必要现有回归；固定 OpenSpec strict validate，记录实际命令 / 结果 / 限制。确认非 UI 使用无 Storybook / MCP 前置、根包无 UI 运行依赖，历史 002 / 003 Run 与 verdict 保持原样；工程失败只修正具体问题。
- [x] 5.2 在当次 Apply 摘要列出 `src/`、`tests/`、`scripts/` 维护代码物理行数最多的前三名、可靠增长依据 / 职责与处理时机，无可靠基准不补造；记录实际产物、未验证范围及直接证据，交独立 Review Apply，不自签 verdict，不执行 Git、Archive 或正式 Full Test。

## Workflow follow-up

- 本轮 Propose 完成后先独立 Review Propose；后续 Apply 与独立 Review Apply 依合法交接推进。
- 当前 Change 实际 Archive、checkpoint、MVP-D03-B / C 激活、正式 Full Test / Close 和 Git 各按后续明确授权执行，不计入上面的实施任务进度。
