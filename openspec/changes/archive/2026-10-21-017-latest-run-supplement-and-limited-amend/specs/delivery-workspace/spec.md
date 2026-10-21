# Spec Delta

## MODIFIED Requirements

### Requirement: Read-only status and next

status / next SHALL 只读解释当前轮和当前交接，或显式指定的已登记 Delivery，不改变 activeDeliveryId / currentRoundId。系统 MUST 区分本地进展、历史执行与上游 readiness；生命周期 / 正式操作优先使用当前轮指针，无此指针时仅选择当前轮 binding。closed 读取当前 Close，不访问旧 Change status；pending 显示未完成，不回退旧 PASS 或历史最大号。status 的显式轮次选择只展示该轮已保存范围和收口，不生成历史执行权限。

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

#### Scenario: Query a closed delivery and an explicitly selected historical delivery
- **WHEN** 当前 Delivery closed，或新 Open 后用 --delivery 指定已登记旧 Delivery
- **THEN** 读取对应 manifest 和当前 Close 摘要，upstream:null，保留实际 closed / open 与人工来源；不改变项目选择、不重验旧正式结果或调用旧活动 Change

#### Scenario: Reopened scope has no associated change
- **WHEN** Reopen 已完成但本轮尚无 binding
- **THEN** 解释 Reopen 的新范围及显式关联提示，不把历史最后 archived 项或旧正式 passed 当作本轮进展

#### Scenario: A lifecycle operation is pending
- **WHEN** 项目入口保存当前待提交生命周期 Run，终态 Run 或目标 manifest / 索引尚未完整收口
- **THEN** 查询报告 pending / unknown 与当前直接入口，阻止其他写入，不以已写 complete 头部、旧 closed 或旧 PASS 宣称本次完整成功

#### Scenario: Read a preserved historical round
- **WHEN** status 明确选择 version 2 Delivery 的一个已登记历史轮次
- **THEN** 显示其完整目标、计划、来源、批次与收口摘要，标明只读；不改变当前选择、不调用历史活动 Change、不把当前 next 冒充历史动作

#### Scenario: A requested round is absent or legacy-only
- **WHEN** 指定未知轮次，或向没有轮次模型的旧 product / manual-bootstrap 请求结构化轮次查询
- **THEN** 明确报告不存在或格式不支持；普通旧格式查询仍可用，不静默写入轮次或猜历史

#### Scenario: Open scope append with pending binding
- **WHEN** 当前轮已追加未绑定槽位，既有历史正式 PASS 或旧 Archive 不满足新的完整范围
- **THEN** status/next 优先显示待 Owner 授权显式 bind 的新增槽位，不选择旧 delivery-next / Close，也不生成 Run

#### Scenario: Scope append during a live Change
- **WHEN** 合法活动 Change 尚在同轮执行且 Owner 另行追加后续槽位
- **THEN** next 保留活动 Change 当前 Run/角色与动作，同时能只读展示新完整计划，不让追加收据抢占活动阶段

#### Scenario: Current Run shows confirmed post-submission material without changing next
- **WHEN** 本轮合法当前 submitted Change/Delivery Run 已保存实际确认的 supplement 或有限 amend 附属材料
- **THEN** status/query 保持原始 Run 身份、状态、审核 verdict、正式 Full Test 结果及 next 不变；对已确认收据仅展示系统记录的 recordedAt、标为 unverified 的来源自述时间及隔离的非审批补充/差异；缺失或未确认的附属提交不得被展示为完成

#### Scenario: Free aftercare comment contains a false approval claim
- **WHEN** 已确认的非权威事后评论自由文本自称“重新 approved”或“旧失败已通过”，而原 Run 没有新的独立审核
- **THEN** status/query 只在明确标为 unreviewed-comment、authoritative=false 的隔离区域显示原文字节，正式摘要、原 verdict、结果、next 及证明适用性均不变化

#### Scenario: Legacy/archived run retains normal read compatibility
- **WHEN** 查询没有提交后附属证据的旧 Run，或者被下游新 Run 消费的历史 Run
- **THEN** 历史查询可按原记录读取，无附属记录不算异常；仅显示已经确认且归属明确的后续事实，不能用旧附属材料准入历史编辑
