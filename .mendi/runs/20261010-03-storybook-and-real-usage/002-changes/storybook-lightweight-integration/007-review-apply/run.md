---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: storybook-lightweight-integration
planningSlot: MVP-D03-A
batchId: 002-changes
actionId: storybook-lightweight-integration-review-apply-01
actionType: review-apply
role: reviewer
run: "007"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: archive
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/storybook-lightweight-integration/006-apply/run.md
---

# MVP-D03-A Review Apply

**verdict：approved，无阻断发现。** 固定审核 [006 Apply](../006-apply/run.md) 的实现、当前受审合同与直接证据。使用项目 Review Apply 方法及 Open Code Review delegate；OCR 负责选文件和规则，独立 Reviewer 判断结论。未修改实现后自行批准。下一步交 Author archive，本轮未归档、未执行根 Delivery 正式 Full Test / Close 或 Git 写操作。

## 重点结论

| 重点 | 独立核对结果 |
| --- | --- |
| 服务归属 | 方法明确本次拥有、已确认外部归属、未知服务三种情形。新沙箱实跑同 child 复用、本次树停止与管道关闭、未知 HTTP / 同 ID 不取得处置权；外部 Storybook 在客户端浏览器关闭后仍可访问，随后由测试 owner 收尾自身 child。三个预览均有停止读回，最终 6113 无监听。用例是本次活跃对象验证，不认证跨会话 PID 恢复或通用服务管理。 |
| 根与 UI 依赖隔离 | 根 package 没有 Storybook / Playwright 依赖；根三个 tsc 继续检查实现、脚本和场景，独立 fixture 自身 strict tsc 检查 UI 源码、配置与浏览器脚本。隔离根目录没有 fixture node_modules 时，三个 tsc、format、lint 通过；向受控 UI 代码加入 debugger 后 lint 确实失败。目标注入类型错误和缺浏览器均失败，不自动准备依赖。005 提醒的 UI 格式 / lint 遗漏已落实。 |
| 真实 CLI / 浏览器 | 独立执行目标 tools / skills help、find-by-component --no-attach 和 skills stories；实际 preview 返回管理页 URL 后进入 iframe，Basic 从 2 增至 3，Disabled 为 0 且禁用，pageErrors 为空，并查看本轮截图。缺配置、缺 binary 与缺 story 有实际负例；缺 story 的逐项 error 没被 exit 0 掩盖。find-by-component 的证据限于 story 文件定位，不推广为任意组件反向依赖分析。 |
| 有限测试与新结果 | 无 dev server 时通过已有 focused 映射运行两份真实 story；001 passed，改为每次增加 2 得到 002 failed，修复并改文字后 003 passed。新浏览器观察显示“确认次数：2 → 3”；旧 001 仍可指定查询且文件字节保持不变。预览主动停止的退出码不充当断言结果。 |
| MCP 可选边界 | fixture addons 为空且没有 addon-mcp；无 MCP 的真实 CLI / 浏览器 / Vitest 主路径通过。指导分别说明目标启用、manifest / test addon 条件与宿主实际发现 / 调用，未从安装 Vitest plugin 推导 MCP 支持。沿用 005 对官方条件的有效核对，本轮未安装或认证 MCP，也没有由 Storybook review URL 生成 verdict。 |
| 方法与引用 | 仅扩展现有指导允许值及 CLI 帮助；真实 start / save / submit / continue 读回一致。缺失、身份错误或重复指导在写入前拒绝；未选择和普通查询无 UI 文件 / 环境前置。没有新增 Run UI 必填字段、hash 清单、递归 Ref 检查或产品 gate。 |

## 独立验证与证据

- `pnpm check`：exit 0，128 个维护文件 format / lint 与三个真实 TypeScript 检查通过，见 [check.log](artifacts/check.log)。
- 受影响方法、Action、写入、测试入口与 UI 准备回归：38/38；单独 `node --test tests/query.test.ts`：6/6；均无失败 / 跳过。见 [regression.log](artifacts/regression.log)、[query-regression.log](artifacts/query-regression.log)。首条命令误列了不存在的 `tests/queries.test.ts`，未将它算入覆盖，随后用实际 query 文件单独补验；实际命令见 [验证摘要](artifacts/verification-summary.json)。其余未改执行 / 取消路径沿用 006 的有效定向回归，不重跑全部历史。
- 使用 `node scripts/prepare-ui-tests.ts D:/Projects/MenDi/.tmp/d03-a-review007-ui` 显式从维护 fixture 冻结锁文件离线准备全新目标，随后 `pnpm test:ui`：5/5，exit 0，无失败 / 跳过，约 113 秒。见 [prepare-ui.log](artifacts/prepare-ui.log)、[ui-suite.log](artifacts/ui-suite.log)；目标严格 typecheck 与真实 Chromium 准备也通过。该准备使用现有 store / 浏览器，不认证冷安装。
- 原始命令输出在 [ui](artifacts/ui/)；关键直接结果为 [预览观察](artifacts/ui/preview/browser/browser.json)、[外部服务存活](artifacts/ui/unknown-service/confirmed-external-reuse.json)、[新旧结果](artifacts/ui/finite-results/results.json) 和 [修复后浏览器观察](artifacts/ui/finite-results/browser/browser.json)。必要输出存入本 Run，临时沙箱不是唯一证据。
- 固定 OpenSpec 1.14.1 `validate storybook-lightweight-integration --strict --json`：1 passed、0 failed、issues 空。结构有效不代替本次语义审核。

实际认证限于 Windows / Node 22.23.2 / pnpm 11.22.0、HTML-Vite / Storybook 10.6.1 / Vitest 4.1.11 / Playwright 1.60.0 的受控目标。Vue、稳定独立安装、冷安装和完整真实交付仍由 D03-B / C 按原范围验证；未取得 Owner 视觉批准，不声明 MCP 能力。

## OCR delegate 范围

[preview](artifacts/ocr-preview.json) 在选择前排除历史 `.mendi/**`、OpenSpec 材料、旧 proofs 与路线图；相关合同和证据另外定向读取。[rules](artifacts/ocr-rules.json) 按实际 9 个路径分别解析；最初 PowerShell 数组参数被合并，已用 Node CLI 正确展开并重取，未使用错误规则映射。

[coverage](artifacts/ocr-coverage.json)：total_files 9，reviewed_files 9，skipped_files 0，coverage_rate 100%。默认排除的变更测试、UI fixture 维护代码 / 配置、产品 Skills、README 及本次合同均补充人工审核；锁文件核对 importer / 版本与真实冻结安装，不宣称逐行审计上游依赖。此覆盖率仅表示本次 OCR 所选文件，不是全库质量 gate；OCR 没有调用外部 LLM。

## 代码规模与后续边界

按维护 TypeScript 物理行数独立统计，排除 node_modules / 生成物；不足三个时全列，本轮各组均足三个：

| 范围 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | application/delivery-full-test.ts：401 | adapters/openspec.ts：346 | adapters/lifecycle-store.ts：336 |
| tests | action-write.test.ts：467 | planning-cli.test.ts：444 | delivery-repair.test.ts：394 |
| scripts | proofs/mvp-d01-c-explore.ts：678 | proofs/mvp-d01-d-explore.ts：487 | proofs/mvp-d01-a-explore.ts：463 |

Git HEAD 可比基准：methods.ts 42 → 45，action-cli.test.ts 282 → 322，actions.test.ts 221 → 227，methods-and-numbers.test.ts 52 → 85；上述前三名未改。新增 UI 共用辅助 148 行、预览场景 131 行、执行入口 113 行、准备入口 39 行，准备 / 场景 / 产品实现职责可辨，没有为压行数添加转发层。

较长旧 C / D proof 本轮未扩展，沿用限定用途；今后需要扩展时才按 AGENTS 分开 Apply 记录流与 Archive 效果组。后续小改动继续只补验变化及受影响部分，沿用其余有效结论；本轮完整 UI 场景不是每次修改的新强制 gate，不追补旧材料。

交接仅保留本次 Reviewer Run 入口；Delivery 保持 open / manual-bootstrap，累计归档仍为 7，A 尚未实际 archive，B / C 未激活。
