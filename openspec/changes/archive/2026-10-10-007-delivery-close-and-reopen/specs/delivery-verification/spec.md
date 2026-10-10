# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit formal delivery test admission

系统 SHALL 通过显式 delivery full-test 接受验收声明，要求当前 open product Delivery、无活动 / 归档中 Change、无待提交生命周期操作，本轮范围的槽位均具有一致归档关联及直接审核。历史范围外 archived binding SHALL 保留但不成为本轮执行输入。声明 MUST 包含完整集合和受测材料基准；缺失、矛盾、陈旧审核、不安全路径、未结束修复或写入冲突须拒绝，不以普通 PASS 替代。

#### Scenario: Start acceptance for multiple completed changes
- **WHEN** Owner 已授权正式验收，当前全部计划槽位完成且相关直接 Review Apply approved，Author 提供完整声明和受支持工具
- **THEN** 操作固定本轮范围、相关审核、集合、实际 full 入口与受测基准，准备 Delivery Run 并执行本次选定 full；不重开旧 Change

#### Scenario: Scope or necessary review is incomplete
- **WHEN** 声明为空、计划槽位未关联 / 未归档、直接 Archive / Review / 固定 Apply Author 缺失或身份不一致、审核未批准，或当前修复审核未完成
- **THEN** 写前拒绝并指出实际必要输入；不生成正式通过、不回退历史、不将当前最后一项的完成推广为整轮完成

#### Scenario: Input leaves the managed project
- **WHEN** 本次声明、实际读取的 Archive / Review / Author 或写入位置越界或经链接指向外部
- **THEN** 拒绝相关读写，保留已有记录，不放宽身份 / 写入安全，不读取无关说明 Ref

#### Scenario: Manual history is supplied to a product writer
- **WHEN** 对 manual-bootstrap 执行正式验收或修复记录命令
- **THEN** 产品拒绝写入，保留原人工历史；人工阶段与产品实施事实分别解释

### Requirement: Direct result readback and bounded applicability

指定正式结果 SHALL 按 Run 路径中明确 Delivery 与项目已登记索引读取父 / 子结果和必要日志，不借当前选择或执行准入拒绝 closed / 历史记录。查询 MUST 分开 outcome、范围 / 命令匹配及需语义判断的材料适用性，不自动认证当前源码、回退旧 PASS或读失败父链 / 审核正文。默认查询只消费当前对象；Close 使用本轮适用结果的直接入口。

#### Scenario: Read a formal failure and a later success in new processes
- **WHEN** 新进程读取明确正式 Run，或 status / next 查询最新完整正式 Run
- **THEN** 保留指定结果，当前解释最新正式操作与直接执行；旧 failed 仍可读，新 passed 不改旧记录，普通 PASS 不能替代正式 Run

#### Scenario: Current required result or log is missing
- **WHEN** 当前正式头部、其实际执行记录 / 必要日志缺失或损坏，或身份 / 路径矛盾
- **THEN** 明确未确认 / 输入错误并非零退出，不回退旧 PASS 或由历史 pid 推断完成

#### Scenario: A persisted pass becomes unconfirmed during observation
- **WHEN** 持久记录为 passed，但本次直接结果读取期间出现竞争锁或日志变化，观察为 unknown / 不稳定
- **THEN** 当前 query 与指定 full-test status 的 next 都停 Owner，不能声称已通过或允许收口；持久历史事实与正文保持，不新增查询输入

#### Scenario: Historical notes or unknown extensions are unavailable
- **WHEN** 当前必要输入有效，而旧失败、旧 Explore / 方案 / 审核说明或未知 Ref 不可用
- **THEN** 普通查询仍解释本次记录，不读取这些说明目标或递归失败链；正式开始和审核只另读各自必要直接对象

#### Scenario: Read an old result after a new delivery is selected
- **WHEN** 新 Delivery 已成为当前选择，调用者显式提供旧 Delivery 的正式 Run 路径，旧直接结果和必要日志有效
- **THEN** 按该路径与已登记旧 manifest 读取，保留旧 outcome；不静默套用当前 Delivery、要求旧 ordinal 等于项目总数或改变 activeDeliveryId

#### Scenario: Closed does not make a historical scope unreadable
- **WHEN** 指定结果所属 Delivery closed 或随后 Reopen 已改变本轮范围
- **THEN** 结果可读性按自身直接身份判断；closed 同范围可显示 match，Reopen 后旧范围可显示 changed，材料仍 requires-semantic-check，不授予新工作通过

## ADDED Requirements

### Requirement: First fresh acceptance after lifecycle work

Reopen 或新 Open 后首次正式 Full Test SHALL 从当前范围及本轮直接归档 / 批准开始，接受当前明确完整集合与受测材料；旧 fullTestRunRef 仅为历史，MUST 不进入旧修复重试分支或继承旧 repairApproval / PASS。新工作后同一范围的失败、修复审核和再完整执行 SHALL 继续使用既有当前直接规则，不建立轮次目录或递归历史链。

#### Scenario: Reopen changes the declared scope and collection
- **WHEN** Reopen 的新槽位全部实际归档，Author 明确新的完整验收集合，Owner 授权新正式执行
- **THEN** 核对本轮直接审核并真实执行新的整次 full，形成新 Run / 子结果；不因旧范围 / 集合不同而沿旧失败重试规则拒绝，不继承旧修复批准

#### Scenario: Old pass is supplied before new work is complete
- **WHEN** Reopen 后新范围尚未完成或没有新正式结果，调用者试图以旧 PASS 收口
- **THEN** 拒绝新验收 / Close 的实际缺失前置，保留旧结果可读，不通过修改旧结果或复活旧 Change 继续

#### Scenario: The fresh acceptance fails and is repaired
- **WHEN** 新范围的正式执行失败，随后完成范围内 Author 修复及独立定向审核
- **THEN** 重新真实执行该新失败声明的整个集合，核对当前直接审核；旧范围的集合和失败链不是本次输入
