# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit formal delivery test admission

系统 SHALL 通过显式 delivery full-test 接受当前 open version 2 product 的当前轮验收，要求无活动 / 归档中 Change、无 pending、本轮槽位全部一致归档且有直接审核，已声明结构化基线可核对。历史 binding 与来源成果不成为本轮新增完成项。声明 MUST 含完整集合与受测材料；固定轮次、直接批准及必要基线完成事实，缺失 / 矛盾 / 未确认时拒绝，不以普通或跨轮 PASS 替代。

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

指定正式结果 SHALL 按其明确 Delivery、所属轮次及直接父 / 子结果和必要日志读取，不借当前执行准入拒绝旧格式、closed 或历史结果。查询 MUST 分开原 outcome、轮次 / 范围 / 命令匹配与材料适用性；未迁移旧记录可如实显示轮次未结构化，不猜归属、不改 outcome。默认查询只消费当前对象；Close 只消费当前轮适用入口，不递归读失败父链 / 旧审核或基线来源正文。

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

#### Scenario: Legacy results lack new round metadata
- **WHEN** 旧 product 的正式结果按旧合同可读，或已迁移记录中的历史结果可由迁移时保存的范围 / 归属和原编号唯一解释
- **THEN** 保留 outcome 与来源，未迁移时不虚构轮次，迁移后明确映射到旧轮；不改写旧 Run，也不把缺少新字段泛化成查询失败


### Requirement: First fresh acceptance after lifecycle work

Reopen / 新 Open 后首次正式 Full Test SHALL 以当前轮范围、本轮归档 / 批准和当前明确集合 / 材料开始。旧轮正式入口、PASS 或 repairApproval 不能进入本轮重试准入或满足本轮 Close；同一轮失败、修复审核与新的完整执行继续既有规则。结构化已交付基线只证明前置成果，不替代当前轮真实执行；不新增轮次目录或递归历史链。

#### Scenario: Reopen changes the declared scope and collection
- **WHEN** Reopen 的新槽位全部实际归档，Author 明确新的完整验收集合，Owner 授权新正式执行
- **THEN** 核对本轮直接审核并真实执行新的整次 full，形成新 Run / 子结果；不因旧范围 / 集合不同而沿旧失败重试规则拒绝，不继承旧修复批准

#### Scenario: Old pass is supplied before new work is complete
- **WHEN** Reopen 后新范围尚未完成或没有新正式结果，调用者试图以旧 PASS 收口
- **THEN** 拒绝新验收 / Close 的实际缺失前置，保留旧结果可读，不通过修改旧结果或复活旧 Change 继续

#### Scenario: The fresh acceptance fails and is repaired
- **WHEN** 新范围的正式执行失败，随后完成范围内 Author 修复及独立定向审核
- **THEN** 重新真实执行该新失败声明的整个集合，核对当前直接审核；旧范围的集合和失败链不是本次输入

## ADDED Requirements

### Requirement: Round bound verification and repair

新建正式 Full Test、repair / review 及 Close SHALL 明确所属当前轮，并核对其范围、完成项及直接对象归属一致。历史归属不能只由当前指针或相同文本猜测；迁移前旧记录按保存的唯一映射解释，不改原字段。轮次不符、同名但来源错误或新记录缺必要归属时 MUST 拒绝当前写入 / 收口，保留旧结果可读性。

#### Scenario: Reopen leaves a previous pass intact
- **WHEN** 旧轮已 passed / closed，新轮没有自身完整正式结果
- **THEN** 旧 outcome 仍为 passed，当前验收仍未满足，旧结果不能直接 Close 新轮

#### Scenario: Repair or review points to another round
- **WHEN** 当前修复、定向审核或复验引用另一轮失败 / 批准，即使集合或入口名称相同
- **THEN** 写前拒绝错误直接对象，不借旧批准继续，不覆盖旧失败

#### Scenario: A new result contradicts its declared round
- **WHEN** 新记录的所属轮、完成范围、基线声明或 manifest 当前选择互相矛盾
- **THEN** 拒绝相应当前操作或如实报告结果不适用，不自动重写轮次

### Requirement: Direct delivered baseline facts in acceptance

正式验收 SHALL 直接核对已声明 product 基线的来源身份、归档绑定和指定 Close 完成快照，保存本次必要完成事实供 Close 核对。来源可为同 Delivery 旧轮或另一登记 Delivery 的旧 / 新 product；来源后续 Reopen、计数增长不使其旧完成事实自动失效。不得递归读取来源旧测试日志、审核正文或其依赖图，manual-bootstrap 不满足硬依赖。

#### Scenario: Accept a historical product source without migrating it
- **WHEN** 旧 product 来源的归档绑定和指定 Close 快照一致，当前目标本轮自身前置已满足
- **THEN** 只读取得该已交付基线事实并执行本轮正式集合，不改来源或要求来源重新运行 Full Test

#### Scenario: Source facts change during admission
- **WHEN** 直接来源、Close 或归档身份在准入 / 锁内复核中变化，或其实际内容不支持声明
- **THEN** 拒绝或保留当前未确认现场，不把旧保存事实拼接为本轮通过，不扩大成全库材料扫描

#### Scenario: Close consumes the tested baseline declaration
- **WHEN** 当前轮正式结果稳定 passed，基线声明 / 完成事实与本轮范围一致，且材料适用性明确成立
- **THEN** Close 消费本次直接保存的完成事实，不重新展开来源历史或把基线成果计作本轮新增完成项

#### Scenario: Baselines do not change same round test policy
- **WHEN** 当前轮正式执行失败，随后范围内修复与独立定向审核完成
- **THEN** 仍按现行规则执行该声明整个集合；本 Change 不以轮次 / 依赖能力允许拼接多次结果或缩减集合
