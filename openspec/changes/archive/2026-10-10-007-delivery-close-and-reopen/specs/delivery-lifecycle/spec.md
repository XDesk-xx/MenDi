# Spec Delta

## Purpose

使明确授权的 Delivery 收口基于本轮适用的正式验收与直接批准事实，并能显式重开原交付开展新工作。保留旧收口和真实执行结果，区分当前选择、历史可读性与新操作准入，在写入未完成时提供有界且明确的继续方式。

## ADDED Requirements

### Requirement: Explicit applicable delivery close

系统 SHALL 仅通过明确 Close 操作收口当前 open product Delivery，要求 Author、actor、本轮全部槽位完成、无活动项 / 待处理工作，以及当前稳定 known passed 的正式 Full Test。指定正式入口 MUST 同时为当前进展与最近正式结果，范围 / 命令一致、直接批准快照完整；普通 PASS、陈旧入口、未批准、unknown 或未完成现场 MUST 拒绝。

#### Scenario: Close a completed delivery
- **WHEN** 实际 Owner 已授权 Close，Author 提供本轮当前正式结果及成立的材料适用性判断，必要输入完整且稳定
- **THEN** 保存独立 Close Run 与 closed manifest，保留正式父 / 子结果和历史，跨进程查询同一收口；不自动 Git、Open 或 Reopen

#### Scenario: Required acceptance or approval is unavailable
- **WHEN** 缺当前正式结果、直接子记录 / 必要日志、必要批准快照，或存在未完成槽位、修复 / Review、failed / interrupted / not-run / unknown
- **THEN** 写前拒绝实际输入问题，不占新号、不回退旧 PASS，不从入口 PID 消失或后续清场推导完成

#### Scenario: A stale or ordinary pass is supplied
- **WHEN** 指定旧正式 Run、普通 full 结果、当前范围 / 命令不匹配，或与当前选择矛盾
- **THEN** Close 拒绝，保留当前状态与旧结果，不根据查询 ok 或 next 自动收口

### Requirement: Material applicability and direct approval facts

Close SHALL 保存针对指定正式结果的明确材料适用性结论、实际候选 / 差异及判断理由。结构校验、actor 和文本 MUST 不宣传为源码或 Owner 身份认证；真实阶段工作负责判断。Close SHALL 消费正式结果中已核对的直接批准事实，不递归读取旧 Archive / Review / Author 正文、失败父链或旧 Close。

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

Reopen SHALL 要求实际 Owner 明确新范围、Author / actor 和原因，仅重开当前完整 closed product Delivery。新范围 MUST 非空、依赖自洽，槽位不复用旧 binding；保留旧 Close、正式结果、binding、批次及累计归档数，退出旧验收当前选择。Reopen MUST 不创建 / 复活 Change、不建立批次、不继承旧 PASS。

#### Scenario: Reopen and later start new work
- **WHEN** Owner 明确新范围，先完成 Reopen，再显式关联新 Change 并开始首次 Run
- **THEN** Reopen 独立记录沿原 Delivery 编号；首次实际 Change Run 才建新 NNN-changes，本轮范围与历史 bindings 共存，旧 Run / Close / verdict 不改

#### Scenario: Reopen input contradicts existing work
- **WHEN** Delivery 非当前 closed、收口记录不完整、存在写锁 / 未完成操作，或新范围为空、复用旧槽位 / Change、依赖悬空 / 循环
- **THEN** 写前拒绝，不把 Reopen 作为失败恢复或复活已归档 Change 的入口

#### Scenario: Query immediately after reopen
- **WHEN** 新进程读取刚完成 Reopen，尚未关联新工作
- **THEN** 当前进展是 Reopen 和新范围，提示 Owner 范围内显式 bind；旧最近正式结果仅为历史定位，不显示新一轮 verification passed

### Requirement: Durable lifecycle progress and closed queries

系统 SHALL 将 Open / Close / Reopen Run 放在 Changes 批次同级，独占分配编号并校验 Delivery / Action / 方法 / 角色身份。closed 默认 query SHALL 解释当前 Close 与其收口摘要，不读取旧活动 Change 或遍历历史；新 Open / Reopen 后按新当前指针解释，当前必要记录缺失 MUST 报错，不猜历史最大号。

#### Scenario: Closed progress is read without historical logs
- **WHEN** 当前 Close Run 与 manifest 完整一致，旧说明、旧 Change 正文或旧测试日志不可用
- **THEN** 默认查询只展示持久收口事实且不重验历史；显式结果查询若缺它实际需要的日志则拒绝，不把默认查询当作重新验收

#### Scenario: Current lifecycle identity is invalid
- **WHEN** 当前 Close / Reopen / Open Run 缺失、类型 / Delivery / 角色不符或受管路径越界
- **THEN** 查询 / 相应操作失败，不回退 Archive、旧 Full Test 或其他 Delivery，不补目录或伪装活动 Change

### Requirement: Bounded explicit lifecycle resume

生命周期写入 SHALL 使用项目独占锁与明确的当前待提交入口，完成读回后才报成功。写前拒绝不占号；写入后失败 MUST 保留占号、已写路径、锁 / 临时现场及未完成状态。仅显式 resume 当前同一操作可补剩余本地提交；必须核对原输入 / 直接基准与实际现场，无新号、无重测、不改终态 Run。

#### Scenario: Terminal run exists before manifest or index commit
- **WHEN** Close / Reopen / 后续 Open 终态 Run 已写，manifest / index 或读回未完，Owner 已另外核对停止写者并按既有边界处置残留锁
- **THEN** 显式同操作 resume 核对当前待提交入口与原输入，仅补未提交部分并完整读回；旧终态原样保留，不二次增长编号或归档数

#### Scenario: Pending input changes or another writer exists
- **WHEN** 锁仍存在、原输入 / 基准变化、目标被其他内容占用、未完成入口陈旧、必要文件缺失或路径 / 身份矛盾
- **THEN** 拒绝继续并保留现场，不自动清锁、回滚、重试、补证或选择其他历史操作

#### Scenario: A completed operation is queried again
- **WHEN** 显式 resume 指向仍为当前完成交接的同一生命周期 Run，完整目标记录一致
- **THEN** 返回 already-completed、只读原结果；若之后已 Reopen / 新 Open / 新工作，则按陈旧对象拒绝，不回退选择

### Requirement: Lifecycle authority and manual history preservation

Open 新 Delivery、Reopen、Close SHALL 保持各自实际 Owner 授权边界；CLI 只校验声明与直接记录，不认证真人授权。人工 bootstrap MUST 只读，不通过产品生命周期命令迁移。普通 Run save / submit / continue MUST 不生成生命周期完成，工程检查、工具成功和 next 不授予后续权限。

#### Scenario: Author follows a scoped owner instruction
- **WHEN** Owner 只授权 Close 或 Reopen，操作完成
- **THEN** 停在该操作交接，不自动启动新 Change、正式 Full Test、Git 或另一生命周期操作

#### Scenario: Manual or generic write attempts to create lifecycle success
- **WHEN** 目标为 manual-bootstrap，或普通 submit / continue 试图填写 closed / reopened / opened 结果
- **THEN** 产品拒绝，不修改人工历史或用文本代替实际提交；生命周期 draft 的故障笔记仍按本地同角色 / actor 边界处理
