# delivery-lifecycle Specification

## Purpose
使明确授权的 Delivery 收口基于本轮适用的正式验收与直接批准事实，并能显式重开原交付开展新工作。保留旧收口和真实执行结果，区分当前选择、历史可读性与新操作准入，在写入未完成时提供有界且明确的继续方式。

## Requirements

### Requirement: Explicit applicable delivery close

系统 SHALL 只在明确 Owner 授权下收口当前 open v2 product 的当前轮，要求本轮槽位完成、无活动 / 待处理工作及材料适用。新 Close 必须固定本轮**最新完整 groups-v1 正式 Full Test Run** 的稳定 passed 和对应直接指针/快照，核对范围、批准、必需覆盖、执行与清理。已完成的历史 Close / 旧单次/verification 继续只读，不以旧候选 verified 作为新版 Close 输入。普通、跨轮、陈旧或未确认结果不能 Close。

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

### Requirement: Bounded explicit lifecycle resume

可写新格式的生命周期和迁移写入 SHALL 使用项目独占锁与明确 pending，完整读回后才成功。写前拒绝不占号；写后失败保留占号、路径、锁 / 临时现场。显式 resume 仅补同一已占号操作的当前 intent / pending，核对原输入 / 直接基准，不新占号、重测或改终态。旧 product 的旧操作 resume 不在新版继续，须先按独立授权用旧版恢复，再迁移。

#### Scenario: Terminal run exists before manifest or index commit
- **WHEN** Close / Reopen / 后续 Open 终态 Run 已写，manifest / index 或读回未完，Owner 已另外核对停止写者并按既有边界处置残留锁
- **THEN** 显式同操作 resume 核对当前待提交入口与原输入，仅补未提交部分并完整读回；旧终态原样保留，不二次增长编号或归档数

#### Scenario: Pending input changes or another writer exists
- **WHEN** 锁仍存在、原输入 / 基准变化、目标被其他内容占用、未完成入口陈旧、必要文件缺失或路径 / 身份矛盾
- **THEN** 拒绝继续并保留现场，不自动清锁、回滚、重试、补证或选择其他历史操作

#### Scenario: A completed operation is queried again
- **WHEN** 显式 resume 指向仍为当前完成交接的同一生命周期 Run，完整目标记录一致
- **THEN** 返回 already-completed、只读原结果；若之后已 Reopen / 新 Open / 新工作，则按陈旧对象拒绝，不回退选择

#### Scenario: Resume an interrupted migration
- **WHEN** 同一迁移的 intent、pending 或部分目标已写，Owner 已单独核对原写者停止及锁处置，原直接输入仍一致
- **THEN** 仅补原项目入口 / 选定 manifest 的缺失提交，保留原 Run 和轮次标识；完成后恢复原活动交接，重复当前完整恢复只读返回，不重复迁移

#### Scenario: A legacy lifecycle was interrupted before migration
- **WHEN** version 1 product 存在旧生命周期 pending 或未完成写入，调用新版迁移或旧操作 resume
- **THEN** 停止并提示先使用兼容旧版处理原现场；不迁移半提交输入、不通过新版例外写旧格式

#### Scenario: Migration intent exists before pending publication
- **WHEN** 明确指定本次已占号迁移 intent，pending 尚未发布，原入口 / 目标 / 直接输入仍匹配且无其他 pending，原写者及锁已按独立授权核对
- **THEN** 原 actor 可显式继续发布该 intent 的原 pending 并补剩余提交，不选历史最大号、不新占号；无原 intent 或存在变化时仅报告现场并拒绝猜测

### Requirement: Lifecycle authority and manual history preservation

Open、Reopen、Close 与迁移写入 SHALL 保持各自实际 Owner 授权；CLI 只校验声明与直接记录，不认证真人身份。manual-bootstrap 继续只读，不通过产品迁移。预览、结构验证、工程检查和 next MUST 不授予写入 / 恢复或后续阶段权限；普通 Run 操作不生成生命周期或迁移成功。未迁移旧 product 的普通写入由新版拒绝。

#### Scenario: Author follows a scoped owner instruction
- **WHEN** Owner 只授权 Close 或 Reopen，操作完成
- **THEN** 停在该操作交接，不自动启动新 Change、正式 Full Test、Git 或另一生命周期操作

#### Scenario: Manual or generic write attempts to create lifecycle success
- **WHEN** 目标为 manual-bootstrap，或普通 submit / continue 试图填写 closed / reopened / opened 结果
- **THEN** 产品拒绝，不修改人工历史或用文本代替实际提交；生命周期 draft 的故障笔记仍按本地同角色 / actor 边界处理

### Requirement: Read-only migration preview

迁移预览 SHALL 只读检查当前选定旧 product Delivery 及必要项目入口，展示真实来源、各轮范围 / 归属、当前选择、差异和直接缺口，不占号或写文件。支持完整 open / closed 记录及活动 Change / draft；有锁、pending、未确认执行 / 原生效果或提交不完整时 MUST 停止。其他 Delivery 不批量转换，人工历史不纳入迁移。

#### Scenario: Preview a closed legacy delivery
- **WHEN** 当前旧 product 已完整 closed，直接范围、收口及历史轮次来源可核对
- **THEN** 展示转换后轮次和原收口归属，保留首次日期、身份、编号与真实 outcome，不要求重新验收既有收口

#### Scenario: Preview an active change or draft
- **WHEN** 当前旧 product open，存在完整的活动 Change / draft 或已完成交接，且无正在写入或未确认执行
- **THEN** 预览保留其身份、角色、actor、Action、正文、状态与原下一步；不要求先完成 Change 或先 Close

#### Scenario: Source is incomplete or contradictory
- **WHEN** 无法核对实际必要的历史范围、绑定 / 批次归属或直接收口，或同一身份材料互相矛盾
- **THEN** 预览报告对应缺口并禁止 apply，不猜造范围、不重建审批、不遍历无关历史补证；普通旧格式查询不因此新增前置

#### Scenario: Unknown explanatory extensions exist
- **WHEN** 存在未知扩展、旧说明或仅因字段名以 Ref 结尾的内容
- **THEN** 保留其必要原信息而不递归解析为迁移前置；只核对本次重建实际消费的身份和受管输入

### Requirement: Truthful legacy baseline reconstruction

旧 product 的缺失首次 Open Run SHALL 不单独阻止来源充分的迁移。当前范围、必要前态和直接 Close 能核对已知范围与归属时，系统 MUST 明确标为旧格式基线并保留真实来源，不补造 Open Run 或未知旧轮。当前尚未收口的合法首轮按真实 open 状态保存；缺实际必需范围 / 收口或历史成果无法归属时仍拒绝。

#### Scenario: Sufficient old scope and close exist without an open run
- **WHEN** 合法旧 product 无记录化首次 Open，但直接范围 / 前态及真实 Close 一致，所有已有成果可唯一归属
- **THEN** 允许明确的 legacy-baseline 预览，保存真实来源和收口，不新增虚构的 Open Run

#### Scenario: A legacy first round is still open
- **WHEN** 原格式合法首轮尚无 Close，当前范围、活动交接与已有成果完整，且不存在需解释的更早已关闭轮次
- **THEN** 可预览该真实 open 基线，不把尚未发生的 Close 当材料缺失，也不宣称它已验收

#### Scenario: Earlier commitments cannot be reconstructed
- **WHEN** 历史 archived binding 或必要范围显然属于未能恢复的旧轮，或缺少真实必需的收口来源
- **THEN** 明确拒绝迁移，不能把全部成果塞入最新轮或将部分已知历史伪称完整

### Requirement: Authorized migration preserves work and history

迁移 apply SHALL 在实际 Owner 授权下，由 Author / actor 消费可核对预览，锁内重新生成并复核本次直接输入与差异，只写必要项目入口、当前选定 manifest 和本次迁移收据 / 现场。旧 Run、verdict、日志、归档、Change、其他 Delivery 文件 MUST 保持；已有活动 draft 和协作进展不被迁移提交替换。迁移不执行测试、原生归档、阶段批准或后续操作。

#### Scenario: Apply a preview while preserving active work
- **WHEN** 获授权且预览后输入一致，当前存在活动 Change / draft
- **THEN** 保存一次迁移收据和新格式，原 draft 字节、Action / actor / 状态、绑定、批次、next 和累计归档数保持，可按原阶段显式继续

#### Scenario: Inputs change after preview
- **WHEN** 预览目标、直接 scope / 记录、基线材料或文件内容在预览后或锁内复核时改变
- **THEN** 新写入前拒绝陈旧预览；若已开始提交则保留原占号与现场，不重算并悄悄采用不同结果

#### Scenario: A migrated target is supplied again
- **WHEN** 普通迁移 apply 指向已经完成迁移的新格式，或请求重复同一当前完整迁移的 resume
- **THEN** 不再次新增轮次 / 收据或改历史；普通 apply 返回已迁移事实，同次 resume 在目标仍匹配时只读返回完整结果，后续状态已变化则拒绝陈旧恢复

### Requirement: Discriminated current candidate close

新版 Close MUST 使用输入 `testAttemptRunRef`，其值为当前轮 `attempt.version = 2` 的完整正式 `delivery-test-attempt` Run。持久化仅使用现有 typed `manifest.testAttemptRunRef` 与该 Close 自身的 `testAttemptRunRef` / v2 acceptance 快照；当前 `manifest.deliveryRunRef` MUST 同时指向同一 Run，且轮次、全部必需覆盖、真实结束/清理、批准、基线、材料适用与直接读回成立。旧 `fullTestRunRef` / `verificationRunRef` 只用于历史单次/多来源结果及已完成 Close 的只读解析，不能作为新版 Close 的新写入入口或别名；不得把 v2 attempt 写入 `manifest.fullTestRunRef`。

#### Scenario: Close from a truthful multi-attempt conclusion
- **WHEN** 新版本试图使用此前同轮局部复验拼接 verified 结论作为 Close 的当前验收来源
- **THEN** 拒绝新 Close；原历史 verified/Close、所有来源、失败及日志仍可读取且不改写

#### Scenario: Verification has a required coverage gap
- **WHEN** 结论 incomplete、必需组缺有效通过 / 审核、仅有 skip / TODO / 取消、未知资源或来源矛盾
- **THEN** Close 在写入前拒绝实际缺口，不因包装器退出 0、命令同名或旧轮 PASS 收口

#### Scenario: A newer attempt supersedes the current conclusion
- **WHEN** 先前 command/verification 通过之后已有新的正式 attempt、修复或业务范围变化，而输入指定陈旧验收，或当前 `deliveryRunRef` 不等于所选 `testAttemptRunRef`
- **THEN** 拒绝该次新 Close，不回退旧 PASSED/verified 或历史指针；既有历史结论保持只读

#### Scenario: Old and new acceptance selectors are mixed
- **WHEN** 新 Close 输入带有 `fullTestRunRef` 或 `verificationRunRef`（单独、混合或与 `testAttemptRunRef` 并存），或指定未知类型 / 错版本
- **THEN** **新写入一律拒绝**，不把旧 command passed、v1 candidate verified 当作新验收，也不将 v2 `delivery-test-attempt` 填进旧 fullTestRunRef；**只有对已经完成的历史 Close / 旧正式结果的指定只读查询**继续按保存时的旧类型合同解释

#### Scenario: Close from a fresh complete group full pass
- **WHEN** Owner 另行授权 Close，唯一输入 `testAttemptRunRef` 指向本轮当前 `attempt.version=2` 的完整 groups-v1 正式 Run；该 ref 同时等于当前 `manifest.deliveryRunRef` 和 `manifest.testAttemptRunRef`，完整必需组、最终报告、清理、批准/基线及材料适用性均稳定 passed
- **THEN** 在新 Close Run 内保存 typed `testAttemptRunRef` 与对应 v2 acceptance 快照并完成独立收口，当前轮 closed/readback 合同识别该指针；不更新旧 `fullTestRunRef`/`verificationRunRef`、不创建 verification Run、不自动 Git 或 Reopen

### Requirement: Closing after an appended scope requires a new full result
Delivery Close SHALL 检查当前轮最新有效的所有计划槽位已独立归档且新 groups-v1 Full Test 本次完整通过。先前保存的历史 passed、旧 Close、旧 verification 或旧范围的完成快照仅可按原历史读取，不能在当前轮 scope 扩大后提供新 Close 资格。

#### Scenario: Old passed result is supplied after appending scope
- **WHEN** Delivery 尚 open、曾完整通过，但之后追加了尚未归档或尚未重新正式测试的槽位，Author 请求 Close
- **THEN** 写前拒绝，不生成 Close Run、不开新轮、不改旧 passed/verdict；报告当前缺少的新范围完成与验收事实

#### Scenario: New complete acceptance permits separately authorized Close
- **WHEN** 新槽位均已按独立授权绑定、实施、审核及归档，Owner 另行授权新的当前完整 groups-v1 pass 的 Close
- **THEN** 按最新实际范围及其当前正式 Run 执行原有 typed Close 准入；追加收据不是正式验收，也不自动授权 Close

### Requirement: Append is not a reopen operation
同一 open Delivery 的计划追加 SHALL 保留原 currentRoundId、openedOn、原历史轮及 Close；不能借追加调用 Reopen、生成新的轮次或复用历史轮槽位。已 closed 的 Delivery 需要 Owner 单独授权 Reopen 才能建立新的轮次范围。

#### Scenario: Add before close
- **WHEN** Owner 授权对 open 当前轮新增计划
- **THEN** 当前轮保持 open 和原身份，历史 Close（若存在于其他轮）不变，本轮只扩充计划

#### Scenario: Add after close
- **WHEN** 同轮已经稳定 closed 或正在执行 Close，用户调用 change add
- **THEN** 追加拒绝，不能删除/修改 Close、不能偷偷把 closed 改回 open；需要真实独立 Reopen
