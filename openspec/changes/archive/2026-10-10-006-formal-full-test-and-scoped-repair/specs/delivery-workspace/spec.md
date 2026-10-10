# Spec Delta

## MODIFIED Requirements

### Requirement: Read-only status and next

`status` 与 `next` SHALL 使用同一只读状态解释，展示目标、Delivery 范围、本地关联、当前产品 Run 和相关 OpenSpec 事实。系统 MUST 区分本地协作进展与上游产物 readiness；查询 SHALL 不创建文件、推进阶段、分配 Run 或执行推荐操作。有合法当前 Delivery 操作时 MUST 解释其当前 Run，必要时读取其直接测试结果，不以最后 Archive 替代；否则唯一当前 binding 为活动项或无活动时追加顺序最后的归档项，归档处理中 / 完成态按它的当前 Archive Run 解释，不调用已移走 Change 的活动 status。新关联无 Run 保留初始 Explore 提示，不回退旧项；人工 next 仍明确来源。

#### Scenario: Prepared project without a delivery
- **WHEN** 查询有效 OpenSpec 目标且 `.mendi/` 不存在
- **THEN** 状态显示 MenDi 尚未 Open，下一步提示 `delivery-open`，文件保持不变

#### Scenario: Delivery without a change
- **WHEN** 查询一个合法的产品 Delivery 且尚无 Change 关联
- **THEN** 状态显示已有范围，下一步提示明确选择已有 Change 后执行 `change-bind`，不创建 Change

#### Scenario: Upstream proposal is ready
- **WHEN** 本地关联阶段为 Explore，而上游 proposal 为 ready 或所有规划文件已齐备
- **THEN** next 仍按本地当前 Run 或初始 Explore 交接解释，不自动改为 Propose 或 Apply，不把上游事实解释为批准；记录操作与 Agent 的阶段语义工作分别说明

#### Scenario: Bound change disappears
- **WHEN** manifest 当前普通活动 Change（非合法归档过渡态）无法从上游读回
- **THEN** 查询报告引用失效并展示关联位置，不忽略关联或将 Delivery 判为可继续

#### Scenario: Product run is read after process exit
- **WHEN** 无当前 Delivery 操作，product binding 的 latestRunRef 指向有效当前 Run，新进程读取 status / next
- **THEN** 显示同一 Action、Run 状态、进展结果及最小 next，只解析该当前记录，不读取全部历史 Run 正文或递归说明链

#### Scenario: Manual progress remains manual
- **WHEN** manual-bootstrap manifest 中存在最新 Run 与 Reviewer 交接引用
- **THEN** 查询保留人工 next 和说明来源，不读取这些 Run 作为新增产品运行前提、不认证其语义或调用产品写入

#### Scenario: Query the next change before and after its first run
- **WHEN** 前项归档后显式关联第二 Change，先在无新 Run 时查询，再完成首次阶段记录并在新进程查询
- **THEN** 两次都选择第二项；先显示它的 Explore / 上游事实，后显示其新 Run，不显示第一项 Archive 为当前进展

#### Scenario: Query after the second archive
- **WHEN** 第二项完整归档、无活动项、无当前 Delivery 操作且其必要终态有效
- **THEN** 选择追加顺序最后的第二项，upstream 为 null，next=delivery-next / awaiting-owner-instruction，不自动 bind 第三项

#### Scenario: Query current delivery acceptance or repair
- **WHEN** 全部 Change 已归档，当前 Delivery Run 为正式 Full Test、局部修复或定向 Review
- **THEN** status / next 在新进程选择该 Run、展示相应结果 / 角色 / 当前必要输入，upstream 为 null，不重新读取旧 Change 活动 status 或把旧 Archive 当当前进展

#### Scenario: Current delivery record conflicts or is missing
- **WHEN** Delivery 指针指向缺失 / 损坏 / 错身份 / 越界 Run，或同时存在活动 Change 与未退出的 Delivery 操作
- **THEN** 明确输入错误或冲突，不静默回退到 Archive、历史最大号或旧 PASS，不自动修复指针

#### Scenario: A writer appears during the direct result read
- **WHEN** 当前正式 Run 已读到 passed 头部，但直接子结果 / 日志观察出现竞争或变化
- **THEN** status / next 的本次 outcome 与 next 一致为未确认并停 Owner，持久 passed 保留作原事实，不读取额外历史来绕开本次不稳定

## ADDED Requirements

### Requirement: Operation specific delivery verification inputs

系统 SHALL 按当前操作区分 Delivery 验收输入。普通查询读取入口、manifest、当前 Delivery Run 及该正式执行实际需要的直接结果 / 日志；不读旧 Archive / 审核正文或失败父链。正式执行另读本轮必要完成 / 审核及当前修复直接对象；Review 另读固定 Author。历史说明与未知 Ref 不成为前置，受管路径和身份检查 MUST 保留。

#### Scenario: Old change records are no longer query inputs
- **WHEN** 当前 Delivery Run 与必要直接结果有效，但此前 Archive、旧审核 / Author 正文或其他说明失效
- **THEN** 普通查询不要求补证；正式开始仍核对其本轮明确消费的完成 / 审核输入，不能借查询放宽来绕过操作必要审核

#### Scenario: Current reviewer has an unavailable fixed author
- **WHEN** 当前定向 Reviewer 头部有效，但固定 Author 缺失
- **THEN** 普通查询只解释当前头部，本地 draft save 可保存故障说明；开始 / 继续 / 正式提交所需 Author 的缺失只阻止相应操作

#### Scenario: Unrelated test result or extension is missing
- **WHEN** 当前必要输入有效，但普通旧测试结果、历史日志或未知 Ref 缺失
- **THEN** 查询不扫描这些结果，也不新增工程检查或 hash gate

### Requirement: Delivery verification and association conflicts

显式关联 Change SHALL 拒绝未完成 / 未确认的当前正式验收、局部修复及定向审核，或未解决的失败交接。已有正式结果不能作为激活授权。发生合法新的工作范围时 MUST 退出当前 Delivery 交接选择并将旧验收视为需要按影响判断，历史记录保持；本 Change 不实现 Reopen 或新范围编辑命令。

#### Scenario: Attempt to bind during a local repair
- **WHEN** 当前正式失败、repair draft / continuing、Review 待完成 / changes-requested / rejected 或 unknown 尚未处理，调用者请求新关联
- **THEN** 在写前拒绝交接冲突，保留失败、当前指针、归档绑定与完成数，不把新关联当作失败恢复

#### Scenario: A completed verification has later explicitly authorized work
- **WHEN** 当前正式操作已完整结束并且后续关联在已有规则和实际 Owner 授权下合法
- **THEN** 新活动 Change 按正常规则选择，旧正式 Run 保留作历史，不能自动宣称它覆盖新工作；Close / Reopen 不由 bind 代做
