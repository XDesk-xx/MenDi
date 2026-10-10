---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: storybook-lightweight-integration
planningSlot: MVP-D03-A
batchId: 002-changes
actionId: storybook-lightweight-integration-explore-01
actionType: explore
role: author
run: "002"
status: completed
actionStatus: completed
result: proof-supported
nextAction: review-explore
nextRole: reviewer
date: 2026-10-10
---
# MVP-D03-A Explore

Owner 原始指令：owner 授权激活 MVP-D03-A，开始 explore，核心功能 proof 认证。保持 Author。

本轮完成 Storybook 轻量接入的关键疑点探索与真实受控 proof，交接独立 review-explore。`proof-supported` 是 Author 探索结论，不是 Reviewer verdict、Owner 视觉批准或产品验收。

## 激活、背景与范围

固定 OpenSpec 1.14.1 原生 `new change storybook-lightweight-integration` 创建 scaffold；`status --change ... --json` 与 `instructions proposal --change ... --json` 的实际输出保存于 [activation-commands](artifacts/activation-commands)。只创建 `.openspec.yaml`，未创建 proposal / design / delta specs / tasks / explore.md。MVP-D03 保持 open / manual-bootstrap，首次实际 Change 建立 `002-changes`，本阶段仅占 Run 002；D01 / D02、旧 Run / verdict 和累计归档数 7 不变。

使用项目 Explore 方法、已安装 openspec-explore、调试方法与 Playwright。人工 bootstrap 记录不调用 product Action 写入迁移历史；读取原生 proposal guidance 取得实际 context。该次背景仍描述激活前的 D03 checkpoint，当前事实由本轮 Owner 原始授权及 manifest binding 明确；随后同步 README / context，不改原输出。guidance 未返回独立 `rules` 字段，不补造规则。项目约束来自 AGENTS、路线图 §6.2 / MVP-D03-A：UI 配置、组件、stories 和依赖属于目标项目；使用声明脚本；官方 MCP 按实际启用能力核对；服务启动、真实渲染、测试与反馈分开说明。

本轮疑点：异名脚本能否复用现有测试入口；预览能否展示真实组件并实际交互；缺陷与源码更新会不会被旧 PASS 掩盖；怎样复用 / 停止明确属于本次的服务；无 UI / MCP 的目标能否正常进入工作。本轮只写受控实验、输入与交接记录，未改 `src/`、根 package / lock 或产品 Skills；没有正式 Full Test、Archive、Git 写入或下一 Change。

## 会影响方案的事实与候选

1. 现有 `adapters/test-entries.ts` 从目标 package 读取 scripts，`mendi.tests.focused` 可直接映射异名脚本；普通执行已保存命令、cwd、exit、原始日志及独立 execution ID。实际 proof 将 `verify:stories` 映射为 focused，无需新造测试调度或把 Storybook 塞入 MenDi 根依赖。预览入口与服务使用指导仍需在正式方案中承接，不能因已有测试命令可用就声称本 Change 已实施。
2. 当前 [Test Runner 文档](https://storybook.js.org/docs/writing-tests/integrations/test-runner) 对 Vite 推荐 [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon)。本机旧 runner 0.26 的实际尝试失败；最终受控 HTML-Vite 目标采用官方 addon 10.6.1 / Vitest 4.1.11 browser mode。原 `play` 断言保留，测试真实运行于 Chromium，而非字符串 sentinel 或模拟 DOM。
3. `storybook dev` 支持目标声明的 host / port / ci / no-open / exact-port 参数；本次固定 6113。仅 HTTP 200 或相同 story ID 不足以证明任意既有服务归属。当前 proof 能认证已掌握启动根、脚本和实际 child 的本次服务；不推出未知既有服务可以自动复用或结束。
4. [官方 MCP 文档](https://storybook.js.org/docs/ai/mcp/overview) 要求按版本、目标配置和实际能力核对；文档能力还受框架 manifest 支持限制。此目标未启用 MCP，未调用工具，不声明文档、预览、testing MCP 能力已认证。后续启用时另做真实调用，不根据包存在或文档描述推定成功。

倾向以目标配置 / 声明脚本、按需工具指导和 Run 的必要结果形成直接工作链：复用真实组件 → story 预览 / 反馈 → 项目交互测试 → 独立审核。已有项目按其真实测试配置接入；新 Vite 配置可选本次实际通过的 addon 路径。不增加 MenDi 前端、自有 MCP adapter、通用服务管理器、全量 hash 或引用台账。具体规格边界、预览引用与服务归属所需输入留给受审 Propose 收敛；未知既有服务应先人工确认，不能把本次实验扩写成通用归属检测能力。

## 核心 proof

维护入口为 [mvp-d03-a-explore.ts](D:/Projects/MenDi/scripts/proofs/mvp-d03-a-explore.ts) 和受控 [storybook-project](D:/Projects/MenDi/tests/fixtures/storybook-project/README.md)。输入包括真实 `Counter`、Basic / Disabled 两份 story、目标 package / lock、Storybook / Vitest TypeScript 配置、浏览器验证脚本及明确 scope。每次尝试均从这些输入创建新的隔离目标；最终为 `.tmp/mendi-d03-a-YxJec4`，不读取旧临时项目作为输入。

最终 [proof-009/report.json](artifacts/proof-009/report.json)、[execution](artifacts/proof-009.execution.json) 与 [commands](artifacts/proof-009/commands/commands.jsonl) 保存实际结果，入口 exit 0。环境为 Windows x64、Node 22.23.2、pnpm 11.22.0、Storybook / HTML-Vite / addon 10.6.1、Vite 8.3.0、Vitest 4.1.11、Playwright 1.60.0；使用本机已存在的 Chromium 1223，不自动下载浏览器。

| 场景 | 方法与实际结果 | 直接材料与限制 |
|---|---|---|
| P01 真实组件与异名入口 | product `test list` 读取 `verify:stories`；真实 `test run --kind focused` 为 `001-focused`，两份 story 2/2 passed。浏览器 Basic 的 play 执行两次后，另一次点击得到 2→3；Disabled 保持 0 且按钮禁用，pageErrors 为空。 | [entries](artifacts/proof-009/entries.json)、[001 logs](artifacts/proof-009/product-test-results/001-focused/stdout.log)、[browser](artifacts/proof-009/baseline-browser/browser.json)、[截图](artifacts/proof-009/baseline-browser/counter.png)。作者已查看截图；没有 Owner 视觉反馈。 |
| P02 缺陷与新结果 | 仅隔离目标把增量改成 2，`002-focused` exit 1，Basic failed / Disabled passed；恢复增量并将文字改为“确认次数：”，`003-focused` 重新执行 2/2 passed；浏览器再次看到新文字并点击 2→3。旧 `001-focused` 显式查询仍为原结果，record 与原读取一致。 | [002 logs](artifacts/proof-009/product-test-results/002-focused/stdout.log)、[003 logs](artifacts/proof-009/product-test-results/003-focused/stdout.log)、[新 browser](artifacts/proof-009/changed-browser/browser.json)、[新截图](artifacts/proof-009/changed-browser/counter.png)、[旧结果读回](artifacts/proof-009/old-result-readback.json)、[读回核对](artifacts/final-checks/proof-readback.json)。不把旧截图覆盖新源码确认。 |
| P03 已知服务复用与错误 HTTP | 复用同一个实际启动的 `preview:components` child 28408，没有再启动服务；独立 HTTP stub 返回 200 / 空 entries，被 story 读取拒绝。 | report P03 / story-index。只认证本次已知服务；没有验证同 ID 的异项目或未知预存服务归属。 |
| P04 本次服务停止 | 仅对当次仍存活的 child 执行 `taskkill /PID 28408 /T /F`，停止命令 exit 0；真实 child 和日志管道关闭，访问 6113 失败，随后本机核对无监听。被主动结束的服务 child exit 1 是停止结果，不是故事测试失败。 | [stop-owned](artifacts/proof-009/commands/stop-owned.json)、commands / report P04。不是通用进程树管理认证。 |
| P05 无 UI 目标 | 新的无依赖 package / OpenSpec 目标中无 Storybook、MCP、node_modules；真实 product Delivery Open 与 next 查询均 exit 0。根 package 字节未改。 | [no-ui-open](artifacts/proof-009/commands/no-ui-open.stdout.log)、[no-ui-next](artifacts/proof-009/commands/no-ui-next.stdout.log)。只认证 Open / 查询，不是完整交付验收。 |

测试结果、原始 stdout / stderr、截图和必要输出已复制到受控 artifacts。`.tmp` 不承载唯一必要证据；后续重建依赖受控输入、正常 package store / 浏览器准备，不复用旧沙箱。浏览器预览、Vitest 测试和 product execution 分别真实执行，不声称测试通过即形成视觉批准或生产接线。

## 同阶段修正与保留的失败

这些尝试属于 Run 002 的正常探索继续，不分别创建 Run，不覆盖任何原输出。

- proof-001：Open 的 `--scope` 使用绝对路径，真实拒绝 `unsafe-reference`，在 Storybook 启动前失败；已修正为目标内相对路径。
- proof-002：旧 Test Runner 将仓库根作为扫描根，遇到旧临时测试的坏 package；003 / 004 / 005 / 006 调查相对根、显式根与 index-json，均实际未发现测试，exit 1，不记 PASS，也没有采用 passWithNoTests。
- proof-007：显式 CLI 匹配后进入测试初始化，但 SWC 1.16.13 原生缓存的 DACL 检查拒绝本机默认目录。旧 runner 的支持结束提示与失败日志保留；未修改全局权限或关闭安全检查。最终不继续该失败路径。
- Vitest 5.0.3 的显式依赖准备因所配置镜像没有对应 `@vitest/runner` 版本失败；改用成套可取得的 4.1.11，正常准备成功，见 `vitest-dependencies*` 输出及 execution。
- proof-008：Vitest 浏览器导入时 `global` 未定义，实际 failed。核对当前 addon 自动 provision preview 的实际行为后，移除无额外用途的旧式 setup，并在受控 Vitest browser 项目显式 `define: { global: 'globalThis' }`；proof-009 实际通过基线、负例与更新后验证。不能推广为所有 Vite / Storybook 版本的配置。

002—008 的实际失败 product 结果及日志分别保存于各尝试的 `product-test-results`，各服务在 finally 中只结束自己的实际 child。早期 HTML story 类型按 HTML renderer 的 Args 泛型修正，TypeScript 检查真实通过；没有仅改后缀或以 Node 成功代替类型检查。

## 工程检查、重建与交接

本轮 `pnpm check` exit 0：格式与 lint 各检查 114 份维护文件，三个真实 TypeScript 配置通过；`pnpm build` exit 0。最终目标自身 `typecheck` exit 0；相关既有 `node --test tests/test-execution.test.ts` exit 0、7/7 passed，原始结果保存于 [final-checks](artifacts/final-checks)。没有运行正式 Delivery Full Test。历史 Run、原始输出、fixtures 未参与批量格式化。

从根目录按目标 README 先显式安装受控 fixture 的冻结依赖、`pnpm build`，再以新的绝对证据目录执行 proof；脚本进行新沙箱的 frozen / offline / ignore-scripts 安装。需要 Node / pnpm 和已准备的 Chromium；当前根 tests 类型检查会读取 fixture，须先准备目标依赖，不声称完全无准备即可在全新机器运行。独立安装与冷环境的完整使用验收属于 B / C。

交接当前 Author Run 002，Reviewer 重点核对实际组件与断言、失败是否如实保留、源码变化后的新执行、服务归属限制、MCP 未验证及目标依赖隔离。保持 Author，停止独立 review-explore；没有创建 Reviewer Run / verdict，也不进入 Propose 或 Apply。

最终固定 OpenSpec status / 当前 proposal guidance 与 MenDi status / next 均 exit 0，实际读回 activeChangeId 为本 Change，`next=review-explore / awaiting-review / reviewer`，人工记录 `executable=false`；直接 Author 输入为本 Run。见 [status](artifacts/final-checks/status.stdout.log) / [next](artifacts/final-checks/next.stdout.log)。原生当前仅 proposal ready，其余规划依赖尚未生成；项目归档计数仍为 7。Git 只读检查确认受版本管理的旧材料仅本次 manifest / README / context 变更，没有产品源码、根依赖或历史 Run 改动；未提交、切分支或 push。
