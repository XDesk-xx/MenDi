## MODIFIED Requirements

### Requirement: Explicit applicable delivery close

系统 SHALL 只在明确 Owner 授权下收口当前 open v2 product 的当前轮，要求本轮槽位完成、无活动 / 待处理工作及材料适用。输入须恰选旧 fullTestRunRef 稳定 passed，或新 verificationRunRef 稳定 verified；所选对象必须为本轮当前实际进展和对应指针，范围 / 批准 / 必需覆盖及直接快照一致。普通、跨轮、陈旧或未确认结果不能 Close。

#### Scenario: Close a completed delivery
- **WHEN** 实际 Owner 已授权 Close，Author 提供本轮当前正式结果及成立的材料适用性判断，必要输入完整且稳定
- **THEN** 保存独立 Close Run 与 closed manifest，保留正式父 / 子结果和历史，跨进程查询同一收口；不自动 Git、Open 或 Reopen

#### Scenario: Required acceptance or approval is unavailable
- **WHEN** 缺当前所选验收对象 / 必要直接快照（旧单次另须子结果 / 必要日志）或批准，存在未完成槽位 / 修复 / Review，或当前入口及必需覆盖仍有失败 / 未确认
- **THEN** 写前拒绝实际输入问题，不占新号、不回退旧 PASS，不从入口 PID 消失或后续清场推导完成

#### Scenario: A stale or ordinary pass is supplied
- **WHEN** 指定旧正式 Run、普通 full 结果、当前范围 / 命令不匹配，或与当前选择矛盾
- **THEN** Close 拒绝，保留当前状态与旧结果，不根据查询 ok 或 next 自动收口

### Requirement: Material applicability and direct approval facts

Close SHALL 保存指定验收入口的明确材料适用性、实际候选 / 差异及理由。旧分支消费正式结果直接批准，新分支消费候选结论的本地组覆盖、来源适用性和必要批准快照；不递归展开旧 attempt / 失败链 / 审核正文。结构、actor 和文本不认证源码或真人，真实阶段工作负责覆盖与材料判断。

#### Scenario: Documentation changes leave tested material applicable
- **WHEN** 阶段工作确认变化仅为说明或交接，受测代码、测试、依赖及执行配置仍适用
- **THEN** 可记录具体依据沿用当前结果，不新增全库 hash、历史补证或自动源码认证

#### Scenario: Tested material has changed or cannot be confirmed
- **WHEN** 真实代码 / 测试 / 依赖变化尚无必要验证，或不能确认候选适用，调用者未给出 applicable 结论与理由
- **THEN** 不收口，保持原执行事实并按影响处理；不能填写空说明、拼接 focused 或仅凭持久 passed 认证新材料

#### Scenario: Historical approval bodies disappear
- **WHEN** 当前正式结果中的批准身份快照、直接结果 / 必要日志及 Close 实际输入有效，而旧审核正文、说明或未知 Ref 不可用
- **THEN** Close 不倒查这些目标；直接事实缺失或当前交接已被新修订取代仍拒绝

### Requirement: Explicit reopen with a fresh work scope

Reopen SHALL 由 Owner 明确新范围、Author / actor 和原因，只重开完整 closed v2 product。新范围非空、依赖自洽、基线可核对、槽位不复用旧 binding；追加新轮并保留旧 scope、正式单次 / attempt / verification / Close 及归档事实。新轮不得继承旧 PASS / verified / 修复批准，不预建批次、不复活 Change；全部当前指针统一投影。

#### Scenario: Reopen and later start new work
- **WHEN** Owner 明确新范围，先完成 Reopen，再显式关联新 Change 并开始首次 Run
- **THEN** Reopen 独立记录沿原 Delivery 编号；首次实际 Change Run 才建新 NNN-changes，本轮范围与历史 bindings 共存，旧 Run / Close / verdict 不改

#### Scenario: Reopen input contradicts existing work
- **WHEN** Delivery 非当前 closed、收口记录不完整、存在写锁 / 未完成操作，或新范围为空、复用旧槽位 / Change、依赖悬空 / 循环
- **THEN** 写前拒绝，不把 Reopen 作为失败恢复或复活已归档 Change 的入口

#### Scenario: Query immediately after reopen
- **WHEN** 新进程读取刚完成 Reopen，尚未关联新工作
- **THEN** 当前进展是 Reopen 和新范围，提示 Owner 范围内显式 bind；旧最近正式结果仅为历史定位，不显示新一轮 verification passed

#### Scenario: Reopen several times on the same day
- **WHEN** 同日连续完成当前轮后再次合法 Reopen
- **THEN** 每次只新增一个不同稳定标识的轮次，Delivery ID 和首次日期不变，旧轮可查询，恢复不会再次追加

### Requirement: Durable lifecycle progress and closed queries

Open / Close / Reopen 及迁移 Run SHALL 沿 Delivery 既有编号并核对身份 / 角色。Close 明确旧单次或新候选结论的验收快照类型，closed 默认查询只读本次收口摘要，不展开来源历史；迁移不替换业务进展。必要当前快照 / 记录坏或存在 pending 时明确拒绝，不从历史最大号或旧 verified 猜当前状态。

#### Scenario: Closed progress is read without historical logs
- **WHEN** 当前 Close Run 与 manifest 完整一致，旧说明、旧 Change 正文或旧测试日志不可用
- **THEN** 默认查询只展示持久收口事实且不重验历史；显式结果查询若缺它实际需要的日志则拒绝，不把默认查询当作重新验收

#### Scenario: Current lifecycle identity is invalid
- **WHEN** 当前 Close / Reopen / Open Run 缺失、类型 / Delivery / 角色不符或受管路径越界
- **THEN** 查询 / 相应操作失败，不回退 Archive、旧 Full Test 或其他 Delivery，不补目录或伪装活动 Change

## ADDED Requirements

### Requirement: Discriminated current candidate close

Close SHALL 明确区分旧单次与新 candidate-verification 验收入口，两个 selector 不得同时提供。新分支只消费当前轮稳定 verified 的当前候选及其自身完整快照，核对完整必需覆盖、候选适用性、基线 / 批准与无未确认缺口；不把来源尝试的原始 failed 改为 passed，也不把选中范围成功当整轮完整。

#### Scenario: Close from a truthful multi-attempt conclusion
- **WHEN** 授权的同轮续测、独立修复审核和必要复验已形成当前完整 verified 结论，材料适用性成立
- **THEN** 保存明确候选类型的 Close 快照和收口，列明多来源事实，原失败 / 退出 / 日志仍保持，不另重跑全部长前缀或自动执行 Git

#### Scenario: Verification has a required coverage gap
- **WHEN** 结论 incomplete、必需组缺有效通过 / 审核、仅有 skip / TODO / 取消、未知资源或来源矛盾
- **THEN** Close 在写入前拒绝实际缺口，不因包装器退出 0、命令同名或旧轮 PASS 收口

#### Scenario: A newer attempt supersedes the current conclusion
- **WHEN** verified 后当前候选、材料或实际进展已被新尝试 / 修复替代，输入仍指定旧结论
- **THEN** 不回退旧 verified 或旧 fullTestRunRef，明确当前入口不适用，保持历史结论可读

#### Scenario: Old and new acceptance selectors are mixed
- **WHEN** 同时指定 fullTestRunRef 和 verificationRunRef，或旧消费者不能识别新的验收类型
- **THEN** 明确拒绝混合 / 未知类型，不忽略新字段后套用旧 passed 合同；合法旧单次输入仍按原合同处理
