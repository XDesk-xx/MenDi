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

### Requirement: Authoritative delivery rounds

version 2 product SHALL 保存有序且身份稳定的历轮范围与明确当前轮。首轮及每次 Reopen 的目标、计划、来源、日期、批次与收口 MUST 可直接定位；旧轮承诺不得被后轮覆盖。Delivery 身份和首次日期保持，轮次不依赖日期或 Git 分支，不增加轮次目录。顶层保留的当前字段 SHALL 由同一逻辑投影并核对，不允许与权威轮次独立写入。

#### Scenario: Reopen adds work to an existing delivery
- **WHEN** 已关闭首轮承诺 P09 / P10-L，Reopen 新增 P10 / P13
- **THEN** 两轮范围同时保留，当前轮只含 P10 / P13，旧归档与收口仍归原轮，不成为本轮待完成项

#### Scenario: Several rounds share one date
- **WHEN** 同一 Delivery 在同一天多次合法 Close / Reopen
- **THEN** 每轮标识稳定且互不冲突，重读及同次恢复不追加重复轮次

#### Scenario: A projection contradicts authoritative scope
- **WHEN** 顶层当前范围 / 状态 / 指针与已保存当前轮不一致，或同一槽位归属多轮
- **THEN** 报告具体记录矛盾，不选任一来源继续写入或自动修复

#### Scenario: Same round appends immutable historical scope
- **WHEN** 当前 open 轮合法追加 plannedChanges
- **THEN** roundId、openedOn、origin、前轮、已有绑定不变；当前轮 scope 与顶层投影同步，有限追加前后快照可用于原 Run 的历史归属

## ADDED Requirements

### Requirement: Explicit append of planned slots to an open delivery
系统 SHALL 提供 Author 显式调用的 delivery change add，在当前可写 version 2 product、未 Close 的当前轮追加一个或多个 plannedChanges。请求须包含非空槽位、标题、依赖、理由和 Owner 明确的范围授权来源；actor 字符串不能代替真人授权。追加不自动 bind/激活 Change、Reopen、Archive、Full Test 或 Close。

#### Scenario: Add one or several planned slots
- **WHEN** Owner 已明确授权，Author 给出当前 open 轮多个有效新槽位、依赖、原因与来源
- **THEN** 一次性按声明顺序追加到当前轮，并由该轮投影当前顶层 scope；旧 goal、绑定、归档编号和 Run 不变

#### Scenario: Existing active Change continues
- **WHEN** 当前有合法 active Change，Owner 只授权扩展后续计划
- **THEN** 追加后当前 Change 的阶段、Run 与角色保持，新增槽位只排队，不自动 bind 或切换活动项

#### Scenario: OpenSpec readiness is not owner authorization
- **WHEN** 仅有 CLI 的 author/actor、OpenSpec 就绪或历史归档事实，没有实际 Owner 范围许可
- **THEN** 不将其视为激活或追加授权；后续 bind 仍须 Owner 单独授权

### Requirement: Plan-append admission and duplicate-safe submission
系统 SHALL 在写前与锁内分别复核当前 open 状态、身份、输入及轮次。新槽位不得重复、跨历史轮复用或形成悬空/循环依赖；baselineDependencies 只接受已登记且可核对的真实已交付 Close。相同请求不得重复追加，冲突请求不可覆盖已有计划。

#### Scenario: Invalid or historical slot dependencies
- **WHEN** 新槽位重复或历史轮已用，依赖悬空/成环、基线 Delivery/Close 不符或受管路径越界
- **THEN** 拒绝整次添加、指出输入错误，原目标字节与已有 binding 保留

#### Scenario: Closed or unwritable target
- **WHEN** Delivery closed、人工 bootstrap、旧格式未授权迁移或当前项目/轮次身份不成立
- **THEN** 拒绝 change add，closed 只能另行 Reopen；不自动迁移或覆盖旧历史

#### Scenario: Retry a completed append
- **WHEN** 同一唯一请求被重复提交，或同一请求 ID 的有效输入不同
- **THEN** 已提交的相同请求返回原收据，不重复加槽位/占 Run；不同输入拒绝，且未确认的半提交不能伪装成幂等成功

### Requirement: Historical scopes survive same-round plan extension
当前轮追加 SHALL 保留前后范围和可核对的追加收据，使过去已记录的同轮旧范围能够唯一归属原 roundId。历史 Open、正式 passed/failed、Repair、Review 的原始 scope、result、verdict 与日志不得修改，历史读取不能追认旧 PASS 为当前验收。

#### Scenario: Historical Open and attempts are readable
- **WHEN** 同轮已记录 Open、完成正式测试或 Repair/Review 后追加范围
- **THEN** 旧 Run 按提交时的明确范围、轮次及实际身份只读解释，不因当前 scope 变大而报 invalid-round-record

#### Scenario: Unknown scope lineage remains invalid
- **WHEN** 某 Run 的 scope/roundId 不属于唯一可核对的历史快照
- **THEN** 继续拒绝错误归属，不按当前更大范围猜测曾经已获批准或补造 Run

### Requirement: Atomic append receipt and bounded recovery
新增计划 SHALL 同一次受管操作持久化独立 Author 收据、当前轮 scope、前后范围依据与必要的当前进展调整；所有必要提交及新进程读回确认才报告成功。未知/锁/并发/写入中断保持现场，禁止自动清锁、覆盖或重新占号。

#### Scenario: Scope commit is interrupted
- **WHEN** 新收据、当前轮范围或顶层投影尚未一致写入
- **THEN** 不报告已成功，保留冲突与必要的实际写入现场；显式恢复必须先比对同一请求及实际效果

#### Scenario: Concurrent writer changes current work
- **WHEN** 本次锁竞争失败，或锁内当前 Change、scope、直接输入或正式执行状态变化
- **THEN** fail-closed，不影响另一写者/已提交记录，不用新增空 Run 作为成功
