---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: storybook-lightweight-integration
planningSlot: MVP-D03-A
batchId: 002-changes
actionId: storybook-lightweight-integration-review-explore-01
actionType: review-explore
role: reviewer
run: "003"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: propose
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/002-explore/run.md
---

# MVP-D03-A Review Explore

Owner 指令：review-explore。固定独立审核 [002 Explore](../002-explore/run.md) 的正文、受控输入和直接 proof，使用项目 [Review Explore 方法](D:/Projects/MenDi/skills/actions/review-explore/SKILL.md)。读取当前范围、原生 proposal instructions / context；不修改实现、Author 材料或历史 verdict。

**verdict：approved。** 关键疑点已由真实受控实验支持，Reviewer 从受控输入创建新沙箱重放成功，没有阻断 Explore 进入 Propose 的发现。批准的是本轮探索结论与明确限制，不是产品实施、Owner 视觉批准或正式交付验收。

## 独立核对

| 关键问题 | 实际证据与判断 |
| --- | --- |
| 真实组件与异名脚本 | 核对 Counter 源码、Basic / Disabled 的 play 断言、Storybook / Vitest 配置和 `test-entries.ts` 映射。新沙箱 `001-focused` 由 `verify:stories` 实际执行 Chromium 中的两份 story，2/2 passed；浏览器另外验证点击 2→3、禁用态为 0 且无 pageErrors，已查看本次截图。已有测试入口足以复用，不需要新调度器。 |
| 缺陷与新结果 | 修改沙箱增量为 2 后 `002-focused` 真实 exit 1，Basic failed、Disabled passed；恢复增量并修改文字后 `003-focused` 重新执行 2/2 passed，浏览器看到“确认次数：”并点击 2→3。显式旧结果查询仍读取 001，record 与基线一致。旧 PASS 没有被当作修改后的确认。 |
| 服务复用与停止 | 重放前核对 6113 无监听；仅启动自己的 child，复用同一对象，不凭 HTTP 200 判断归属；空 story 索引负例被拒绝。停止本次 child PID 45352 的 taskkill exit 0，child / 日志关闭，访问失败，独立读回端口无监听。服务被主动终止的 exit 1 不冒充测试失败或自然完成。 |
| 无 UI / MCP | 新无 UI 目标无 Storybook、MCP 或 node_modules，实际 Open / next 成功；根 package 未改。只支持该入口判断，不宣称完整非 UI 交付已验收。MCP 未安装启用或调用，故本轮没有 MCP 能力认证。 |
| 输入与保存 | proof 从维护的 fixture 创建新目标 `.tmp/mendi-d03-a-9EMNc1`，使用已准备的 package store 做 frozen / offline / ignore-scripts 安装，不读取 002 的旧沙箱。源码、配置、lock、浏览器脚本与结果可定位于受控位置；旧尝试不必全部重放或复制。 |

已核对 Author 009 的实际失败 / 通过输出及旧结果读回；原先 runner 和配置尝试的失败保持原样，不通过 passWithNoTests 或跳过断言解释为成功。正式候选采用实际通过的目标配置，未要求把早期失败路径全部修成通过。

独立查阅官方 [Test runner](https://storybook.js.org/docs/writing-tests/integrations/test-runner) 与 [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon) 文档，当前 Vite 路径建议使用 addon，并以真实浏览器执行组件测试；这支持候选方向，不自动认证所有版本或框架。官方 [MCP 文档](https://storybook.js.org/docs/ai/mcp/overview) 区分一般工具与需要框架 manifest 的 docs 工具；不能把未启用、未调用的 MCP 或 HTML 目标未具备的文档能力写成已支持。

## Propose 收敛事项

以下是本阶段已识别的边界，进入正常方案收敛，不要求新增 revise-explore 或 gate：

- 明确预览服务与有限测试的各自输入、结果和停止方式。HTTP / story ID 只能辅助确认，未知既有服务先核对目标及实际归属，不自动复用或结束；本次已知 child 实验不扩写为通用服务识别 / 恢复能力。预览引用保存实际项目、story 与必要结果，不建立多层引用台账。
- 根 `tsconfig.tests.json` 当前包含 fixture TypeScript，普通开发检查因此需要准备 UI fixture 依赖；本次 `pnpm check` 通过是在依赖已准备的本机环境。A 的方案须明确根工程检查与目标自身 typecheck 的职责、准备入口，保留真正类型检查，不默认让所有目标安装 Storybook。B / C 再按原计划验证独立安装与冷环境，不将本轮结果写成零准备可用。
- 支持范围保持 Windows / HTML-Vite / 本次锁定组合；`define.global` 等实验配置不推广为所有项目的通用要求。正式 Apply 的产品验收进入按场景组织的测试；MCP 按实际启用和真实调用声明能力，未启用时脚本 / 浏览器路径仍可用。

以上直接承接路线图的轻量接入、目标依赖归属和实际能力边界。无需增加 MenDi 前端、自有 MCP adapter、服务调度器、全量 hash、行数门槛或额外交接字段。

## 本轮独立验证

- `pnpm check`：exit 0，格式 / lint 检查 114 个维护文件，三个 TypeScript 配置通过；`pnpm build`：exit 0。见 [check.log](artifacts/check.log)、[build.log](artifacts/build.log)。现有 workspace metadata 提示不另开修订。
- `node scripts/proofs/mvp-d03-a-explore.ts <本 Run artifacts/proof 的绝对路径>`：exit 0，目标自身 typecheck、三次真实测试、两次浏览器交互、服务停止与无 UI 入口全部实际执行。见 [report](artifacts/proof/report.json)、[命令记录](artifacts/proof/commands/commands.jsonl)、[旧结果与停止读回](artifacts/review-readback.json)。每项原始输出只保存一份，摘要直接引用。
- 已查看 [基线截图](artifacts/proof/baseline-browser/counter.png) 与 [更新截图](artifacts/proof/changed-browser/counter.png)，仅确认受控组件确实渲染及文字变化，不替代 Owner 视觉反馈。
- 固定 OpenSpec 1.14.1 status / proposal instructions 成功：当前 proposal ready，后续规划尚未生成。见 [status](artifacts/openspec-status.json)、[instructions](artifacts/proposal-instructions.json)。Explore 阶段不因尚无方案而补造 strict validate 通过。

未重跑无关旧 Explore / 全仓测试，未改根产品 src 或依赖、002 Run / fixture / proof，未执行根正式 Full Test、Archive、Close、Git 写入、下一 Change 或临时目录清理。审核产生独立证据和当前交接；D03 保持 open / manual-bootstrap、累计归档数 7。

## 交接

下一步 Author `propose`，当前必要输入仅本 003 审核入口；固定 Author 与直接 proof 从本 Run 定位。保持旧 Run 和编号，停在 Propose 边界，不代 Author 生成方案。

已同步人工 manifest、README / context 的短交接，CLI [status](artifacts/status-final.json) / [next](artifacts/next-final.json) 读回 `propose / awaiting-author / author`，直接审核入口为本 003；所改交接文件的 `git diff --check` 通过。
