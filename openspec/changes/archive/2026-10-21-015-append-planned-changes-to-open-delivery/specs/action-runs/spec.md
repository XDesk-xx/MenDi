# Spec Delta

## MODIFIED Requirements

### Requirement: Delivery operation runs beside change batches

Delivery 操作 SHALL 在 runs/<delivery-id>/<序号>-<操作名称>/run.md 与 Changes 批次同级，共享连续编号，明确 delivery scope、类型 / 方法、Author / actor 和 draft / submitted。新增记录化 Open 保存 001-delivery-open，Close / Reopen 继续原号；旧首次 Open 未记录 Run 的格式保持可读，不补历史。当前进展与最近正式结果指针 MUST 各按实际用途选择，生命周期提交只更新本次直接对象。

#### Scenario: Full test follows multiple archived changes
- **WHEN** 同 Delivery 两项已归档、已有 Run 最大占号为 014，Author 显式执行新的完整 `groups-v1` 正式 Full Test
- **THEN** 本次 Run 为 `015-delivery-test-attempt`（015 仅为该占号示例，实际编号取当前 Delivery 的下一可用序号），与 Changes 批次同级；Change、批次、Archive 编号和旧文件保持；`delivery-full-test` 仅作为已提交旧 command Run 类型只读兼容，不再由新正式执行创建

#### Scenario: Continue a targeted delivery review
- **WHEN** 定向 Review 已 submitted / continuing，原 Reviewer 显式继续
- **THEN** 新 draft 使用下一号、相同 actionId 与固定 Author；旧 Run 不变，不为每项验证单独分配 Run

#### Scenario: Reservation or identity is inconsistent
- **WHEN** 发现重复 / 非规范序号、错 Delivery / 角色 / 方法、越界路径或另一写者
- **THEN** 拒绝并保留已有占号 / 锁，不复用空占号或覆盖旧记录

#### Scenario: Close and reopen preserve separate operation runs
- **WHEN** 正式结果为 015，随后显式 Close、Reopen 和新 Change 开始
- **THEN** 在无其他占号时保存 016-delivery-close、017-delivery-reopen 和 018-changes 中的新 Run；旧正式 / Close 不改，新 Open 在独立 Delivery 使用 001

#### Scenario: Append plan uses an independent typed delivery operation
- **WHEN** Owner 已授权当前轮范围追加，Author 真实提交计划新增
- **THEN** 分配一个实际的 Delivery 编号并保存独立 typed receipt，不占用批次编号、不改变既有 Change 的 Run 编号或提交结果

## ADDED Requirements

### Requirement: Standalone delivery plan-append receipt
每次合法新增范围 SHALL 保留有类型的独立 Author Delivery 收据，位于整个 Delivery 共享编号空间、与 Changes 批次同级，保存本轮、追加理由、Owner 范围来源、唯一请求、追加前后 scope、有效终态与实际时间。提交本身不得创建或激活 OpenSpec Change，也不构造虚假的 Reviewer 结论。

#### Scenario: Append receipts do not change current Change
- **WHEN** 当前有真实活动 Change 而 Author 完成范围追加
- **THEN** 收据占用 Delivery 下一个真实编号，但当前 active Change/latestRunRef、阶段/角色不被替换，旧绑定/批次/归档不改

#### Scenario: Append after earlier Full Test
- **WHEN** 当前 open Delivery 上一次 groups-v1 完整执行已稳定 passed 或 failed 且不存在不明写者或未决审核
- **THEN** 保存本次追加收据及前后范围，原 Full Test Run/outcome/logs 保持只读，新范围不继承原正式通过或失败为当前验收

#### Scenario: Invalid receipt or number
- **WHEN** 受管 Run 类型、编号、Author 身份、轮次、前后 scope 或原当前指针不符
- **THEN** 读取/提交拒绝，不把损坏的追加收据推断为授权或完成的范围变更

### Requirement: Scope append and current progress remain distinct
范围追加 SHALL 区分当前活动 Change、当前完整范围及旧 Delivery 正式结果的历史位置。操作完成后新增未关联项需明确显示待 bind，旧归档或旧 PASS 不能覆盖它；若已有合法活动 Change，则正常阶段进展仍是权威 next。

#### Scenario: New plan item follows an old Archive
- **WHEN** 当前没有活动 Change，追加后至少一个计划槽位尚未绑定
- **THEN** status/next 指向显式 change-bind 且要求 Owner 单独授权，不因旧最后 Archive 或旧 Full Test 得出 delivery-next / Close

#### Scenario: Existing active Change retains stage
- **WHEN** 当前活动 Change 的 latest Run 是 Explore、Propose 或 Apply 交接，另有新的待 bind 槽位
- **THEN** next 仍来自该活动 Change 的直接状态，新增范围单独可见；收据不能抢占最新 Action

#### Scenario: Pending append does not appear complete
- **WHEN** 追加收据或其所要求的 manifest 更新尚未完成 / 写入结果 unknown
- **THEN** 查询指出本次未确认及必要现场，不回退旧 PASS、不扫描历史最大号冒充最新交接
