---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: storybook-lightweight-integration
planningSlot: MVP-D03-A
batchId: 002-changes
actionId: storybook-lightweight-integration-apply-01
actionType: apply
role: author
run: "006"
status: completed
actionStatus: completed
result: implemented-and-verified
date: 2026-10-10
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/005-review-propose/run.md
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
nextAction: review-apply
nextRole: reviewer
---

# MVP-D03-A Author Apply

Owner 指令 apply；承接 [005 独立 Review Propose](../005-review-propose/run.md) 已批准的 004，保持 Author，完成 13 项任务后停在独立 Review Apply。本轮 Author 结果 implemented-and-verified，没有 Reviewer verdict，不代签批准。

本轮修改前实测物理行数：src 前三为 delivery-full-test.ts 401、openspec.ts 346、lifecycle-store.ts 336；tests 前三为 action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts 前三为 mvp-d01-c-explore.ts 678、mvp-d01-d-explore.ts 487、mvp-d01-a-explore.ts 463。本轮拟修改 files 的基准：methods.ts 42、actions.ts 322、arguments.ts 246、methods-and-numbers.test.ts 52、actions.test.ts 221、action-cli.test.ts 282。依据为修改前现场读取，不补造旧阶段增长；旧长 proof 不扩写。

## 实施与边界

- [Storybook 指导](../../../../../../skills/tools/storybook/SKILL.md) 与 Apply / Review Apply 方法明确目标拥有配置 / scripts / stories，宿主承担连接。小范围扩展 methods、Run 校验与 CLI 帮助，支持现有单个 `--tool storybook`；空 / openspec 旧记录、无 UI 查询保持可用，所选缺方法 / 错身份在占号前失败。选择指导不运行工具、不新增 UI Run 必填字段。
- 根 TypeScript 仅排除独立 `tests/fixtures/storybook-project`，其自身严格 typecheck 检查组件、Storybook / Vitest 配置和浏览器脚本；根仍真正检查维护源码 / 脚本 / 测试。Biome 直接选择根维护测试、`tests/ui/` 和 UI fixture TypeScript，旧敏感夹具、历史 Run、lock 和生成物不批量格式化；根包只新增准备 / 测试 scripts，没有 Storybook 依赖。
- [prepare-ui-tests.ts](../../../../../../scripts/prepare-ui-tests.ts) 是操作者明确执行的冻结锁文件离线准备，只写指定的新 `.tmp` 子目录。[test-ui.ts](../../../../../../scripts/test-ui.ts) 核对已准备的 fixture / 严格类型 / 真正 Chromium，再构建与运行分组 UI 场景；缺准备时报错、不安装。测试沙箱依据受控 fixture 重建，不继承旧临时输入。
- [UI 场景](../../../../../../tests/ui/preview.test.ts) 分开官方 CLI / 环境、预览、有限测试与更新后结果。项目自身预览通过已知活跃 child 复用和停止；未知端口、空索引、同 ID 的异来源不取得身份；外部真实 Storybook 在客户端浏览器关闭后仍存活，最终由启动它的测试 Owner 收尾。没有新增产品服务管理器、MCP adapter、证据图或 hash gate。
- README、fixture 说明和 design 补充实际 cwd / 配置、管理页 preview iframe、逐项 error 的含义与显式准备入口。属于受审方案的实现具体化，没有收缩验证范围、修改 004 / 005 verdict 或重做完整 Explore / Propose。

## 实际验证

[verification-summary.json](artifacts/verification-summary.json) 汇总本轮命令 / 结果；原始输出各保留一次，旧 Run 直接引用。

- [check.log](artifacts/check.log)：`pnpm check` exit 0，格式 / lint 128 个维护文件，三个真正 TypeScript 配置通过。相关 [regression.log](artifacts/regression.log) 为 67/67 passed、0 skipped，覆盖方法 / Action / 写入与查询、测试入口 / 执行 / 依赖 / 取消及工程准备；这是范围内回归，不是正式 Delivery Full Test。
- [ui-final/suite.log](artifacts/ui-final/suite.log)：显式准备后 `pnpm test:ui` exit 0，5/5 passed。目标独立严格 typecheck 与真实 Chromium 先运行；故意类型错误、缺浏览器、缺配置 / 工具、缺 story 均没有被解释为 PASS。根检查在无 UI node_modules 的隔离副本通过，UI debugger 负例实际由 lint 拒绝；缺 UI 依赖时不创建安装或交付结果。
- 官方 10.6.1 的 tools / skills help、`skills stories` 与本地 `stories find-by-component --no-attach` 实际执行，发现 Basic / Disabled；[CLI 原始调用](artifacts/ui-final/official-cli) 保存唯一命令输出。本地 story 文件自匹配已验证，未推导所有组件反向图、框架或 docs 能力。
- 官方 `stories preview` 返回管理页 URL，浏览器进入实际 iframe 看到次数 2、点击后 3；禁用态为 0、无 pageErrors，见 [预览截图](artifacts/ui-final/preview/browser/counter.png)。缺 story 的 CLI exit 0 但返回逐项 error，场景准确拒绝将它作为预览成功。
- 有限 Vitest 测试在无 dev server 时实际执行；注入增量 2 后得到 failed，修复并更新文字后得到新的 passed / 浏览器观察，旧 001-focused record 字节比较不变。见 [results.json](artifacts/ui-final/finite-results/results.json)、[更新截图](artifacts/ui-final/finite-results/browser/counter.png) 和各场景 command 输出；已查看两份截图，只确认本次渲染与文字 / 交互事实，不替代 Owner 视觉批准。
- [外部服务复用](artifacts/ui-final/unknown-service/confirmed-external-reuse.json) 保存真实目标 / 配置 / 启动 script / 活跃 child / 客户端来源。三个 preview-stop 读回自身 taskkill、child / pipes 关闭与访问结束；本轮结束后 6113 无监听。没有凭历史 PID 清理其他服务。
- [validation.json](artifacts/validation.json)：固定 OpenSpec 1.14.1 strict validate exit 0，valid=true、issues=[]。最终 Apply 只读进度和 status / next 见 [handoff-readback.json](artifacts/handoff-readback.json)；任务完成与工具成功均不等于独立审核批准。

## 失败与修正

首轮 UI 的 node_modules junction 被 pnpm workspace 结构预检拒绝，真实结果为 not-run，没有改安装元数据或放宽预检；改为单独显式离线准备沙箱。第二轮官方 URL 已返回，但浏览器在管理页顶层找组件而失败；核对实际 iframe 后修正浏览器访问，后续 5/5 通过。早期输出保留在 ui-attempt-01 / 02 / 03，未覆盖；最终证明只指向 ui-final。

从仓库根仅传 CLI `--cwd` 的初次发现未找到目标配置，失败见 [cli-discovery-initial.log](artifacts/cli-discovery-initial.log)；实际测试固定目标 cwd / 配置。Biome 的排除 / 再包含尝试未把 fixture 纳入，debugger 负例揭示此问题；改为直接选择维护子树后该负例及根检查通过。正常本阶段修复未逐项新增 Run。

## 支持范围与维护观察

本轮实际环境为 Windows x64、Node 22.23.2、pnpm 11.22.0、HTML-Vite / Storybook / addon-vitest 10.6.1、Vitest 4.1.11、Playwright 1.60.0、Chromium 1223；已准备的 package store 用于显式离线沙箱安装，不认证冷安装。fixture 没有启用 MCP，Vitest plugin 与 `addons: []` 不认证 MCP test-run。MCP 保持未启用 / 未调用 / 未认证；Vue、稳定独立安装和真实完整交付留给 D03-B / C。

当前维护代码物理行数前三如下（不含 node_modules / 生成物）：

| 目录 | 文件 | 行数 |
| --- | --- | --- |
| src | application/delivery-full-test.ts | 401 |
| src | adapters/openspec.ts | 346 |
| src | adapters/lifecycle-store.ts | 336 |
| tests | action-write.test.ts | 467 |
| tests | planning-cli.test.ts | 444 |
| tests | delivery-repair.test.ts | 394 |
| scripts | proofs/mvp-d01-c-explore.ts | 678 |
| scripts | proofs/mvp-d01-d-explore.ts | 487 |
| scripts | proofs/mvp-d01-a-explore.ts | 463 |

前三均与本轮修改前实测一致。实际扩展为 methods.ts 42→45、方法测试 52→85、actions.test.ts 221→227、CLI 测试 282→322；core/actions.ts 322 和 arguments.ts 246 未增长。新增 UI helper 148、preview 场景 131、有限入口 test-ui.ts 113、显式准备 39 行，职责围绕受控 UI 场景的准备、命令和活跃服务事实，生产方法选择未混入服务调度。当前不需为压行数拆转发层；若继续扩展多目标 / 平台或通用服务职责，应先按实际准备 / 服务 / 结果边界整理。旧 C / D 长 proof 未扩展，继续保留限定用途；需要扩展时先分离 Apply 记录与 Archive 效果组，不改旧输出、不设行数硬门槛。

## 交接

下一步独立 `review-apply / awaiting-review / reviewer`，直接 Author 输入为本 006。重点核对方法选择 / 查询兼容、根与独立目标类型检查无漏项、显式准备不绕过依赖预检、真实服务归属 / 外部仍存活、新旧结果和条件 MCP 的声明范围。

005 及以前 Run、编号和 verdict 保留；D03 仍 open / manual-bootstrap，累计归档数 7，B / C 未激活。没有执行 Archive、Git 写入、正式 Full Test / Close 或 `.tmp` 清理。
