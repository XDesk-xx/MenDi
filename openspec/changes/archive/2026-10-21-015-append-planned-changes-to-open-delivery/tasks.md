# Tasks

## 1. 当前轮追加收据与历史范围归属

- [x] 1.1 在现有 Delivery Run 类型/路径解析中增加明确 `delivery-change-add` typed 收据，包含同轮、Author/requestId、Owner 来源、reason、添加槽位、前后 scope 与状态；以真实 parser/拒绝错误类型与编号、旧 Run 只读单元测试验证，不引入新的 OpenSpec Change。
- [x] 1.2 为 product-v2 当前轮增加有界 `scopeAdditions` 前后快照和 `scopeAddRunRef`，要求单向纯追加、逐条与真实 receipt 一致、已存所有轮原始范围不变；扩展 `readRounds/projectRound`、顶层投影检查并用初轮/多追加/历史轮/坏链测试验证，无该字段的旧轮仍可读。
- [x] 1.3 更新 `recordRound` / 必要 scope 归属解析，只在真实同轮历史快照中解释旧 Open、finished `passed/failed`、Repair/Review 与提交时完成项，不更改旧 Run；用 013 P04/P05/P07、014 R03 的真实初始证据编写旧范围只读、伪造 roundId/缺失快照/跨轮来源拒绝的测试。
- [x] 1.4 核对历史显式 query 与当前写入资格严格分离：旧范围可定位但不能再次满足新范围审批；在 `tests/rounds.test.ts` / `tests/group-history.test.ts` 验证旧 Open/Attempt/Repair 的读取与当前范围约束，不能靠删除校验掩盖失败。

## 2. 追加 CLI、授权输入与提交/恢复

- [x] 2.1 增加 `delivery change add --input` 的 CLI 解析与 Author/actor 合同，读取 Owner 实际范围决定来源、requestId、reason 与一项/多项 additions；加入 help、专属 Skill/README 真实命令示例，测试未授权/非法 role、缺项、越界输入与误用 bind 不产生新计划或 Run。
- [x] 2.2 在 product-v2 open current round 的写前与独占锁内校验完整新 `readScope`、历史轮/本轮 slot 唯一、依赖和真实 baseline Close、当前 Change/轮次/受管路径身份；测试追加 C 依赖 B、一次多项、重复、悬空、成环、closed、manual/legacy 和无效基线均给出可核对结果。
- [x] 2.3 按明确有界意图执行收据/manifest scope/当前指针事务，确认所有直接输入、写回和新进程读回一致才返回成功；测试持锁第二写者、输入突变、收据/manifest/锁中断及失败后的 no-fake-success、保留现场，不清理其他任务的真实锁或 tmp。
- [x] 2.4 对已提交请求 ID 做相同输入幂等返回 / 不同输入冲突，未知半提交只能按本次确定的 Run/请求作显式有限恢复，保持 Run 序号与旧记录；测试不同阶段断点、重放、重复槽位、单号唯一和没有副作用的查询。

## 3. 正式结果失效、活动 Change 与当前交接

- [x] 3.1 扩展追加前的当前工作准入，允许普通 open、合法活动 Change、已真实 finished/cleanup confirmed 的正式 `passed` 和 `failed`；拒绝执行中/unknown、未决 Repair/Review、pending、被占用的锁与范围不明；在实际 product-v2 夹具中复现，严格保留旧失败报告。
- [x] 3.2 在合法范围扩展的同一提交中让旧 `deliveryRunRef` 不再担任新范围当前正式验收，旧 `testAttemptRunRef/fullTestRunRef` 只作为原历史定位，新增收据不占用活动 Change 的最新 Run；按 013 P04～P07 执行真实 passed/failed → append，并测试恢复后当前 manifest/round/Archive/binding 原值不变。
- [x] 3.3 更新 `status/next` 对新增未 bind 槽位优先选择 `change-bind`，合法活动 Change 保持自己的 Author/Reviewer 阶段；不因最后 Archive 或旧 PASS 误提示 `delivery-next`/Close，测试新进程 query/指定历史轮、无授权不会自动 bind 或新建 Change。
- [x] 3.4 确保 `delivery-close` 仅核当前追加后所有槽位已归档和新完整 groups-v1 `passed`，禁止用旧 PASS、旧失败/Repair、追加收据或其它选择器直接 Close；同时兼容已完成旧轮 Close/Reopen 的显式只读查询，在 Close 与 Full Test / Repair 对应测试中覆盖。

## 4. 端到端与阶段交接验证

- [x] 4.1 使用真实隔离 product-v2 目标贯通“Open → Archive A/B → append C/D → 显式 bind/归档 → 新完整 Full Test → 另行授权 Close”的合法路径及并发/中断负例；存真实执行/收据必要证据，不能使用 013/014 的模拟 append 当作本次 Writer PASS。
- [x] 4.2 对旧 Open、已 submitted passed/failed、Repair/Review、旧 closed/Reopen、旧格式只读以及跨进程重放建立兼容回归；执行涉及范围内的测试、`pnpm check` / `pnpm build`，保存真实结果与不可验证限制，修复后按影响复验。
- [x] 4.3 检查 Proposal/四份 delta specs/Design 与已实施字段、CLI/help/Skills 一致，实际列出 src/tests/scripts 各前三个维护代码文件及真实职责增长/拆分依据，Author Apply Run 留证后交独立 `review-apply`，不自签。

## Workflow follow-up

- Proposal 完成后先交独立 `review-propose`；只有按 Reviewer 审核通过的现行方案才继续 Apply。
- Apply 与独立 Review Apply 后另按 Owner 指令原生 Archive；D05 正式 Full Test、Delivery Close、Git checkpoint/Push 与稳定安装均另行授权。
