# delivery-verification Specification

## Purpose
让明确授权的 Delivery 验收基于本轮交付范围、必要审核、完整测试集合与实际受测材料形成真实结果，并在失败后以范围内修复、独立定向审核和新的完整执行继续。保留历史失败与查询边界，避免将普通命令成功、旧批准或拼接结果当成当前交付通过。

## Requirements

### Requirement: Explicit formal delivery test admission

系统 SHALL 对当前 open v2 product 的当前轮显式接受正式验收，要求无活动 / 归档中 Change、pending，全部槽位完成且直接审核 / 基线有效。新正式执行 MUST 采用 groups-v1 且本次执行完整必需组；旧 command、continue/retest 和 verification-create 只保留历史读取，不接受新的正式写入。普通、跨轮或未经协议确认的 PASS 不能替代任何必需事实。

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

#### Scenario: Disallow legacy formal writes
- **WHEN** 新正式输入缺 groups-v1、仅选部分必需组或请求旧 command/continue/retest/verification-create
- **THEN** 在写入前拒绝，不建立新的正式 PASS，原历史保持只读

### Requirement: Declared collection and tested material basis

正式结果 SHALL 保存完整范围说明、实际入口及提交 / 必要差异或明确材料，区分声明、实际执行与当前候选适用性。组模式必须另有可核对计划 / 完成条件和逐组来源；同候选、collection 文字及计数均不能自动认证真实业务覆盖。材料与影响由 Author 说明及必要独立审核核对，不建全库 hash 或自动影响推断。

#### Scenario: Candidate has a git basis or explicit material description
- **WHEN** 本次声明给出实际提交与必要差异，或无 Git 基准时明确实际代码、测试、配置和影响范围
- **THEN** 结果保留该基准供定向审核和收口判断；命令记录据实际读取生成，不把声明冒充为自动观测的源码快照

#### Scenario: Only documentation or handoff text changed
- **WHEN** 后续仅整理说明、日志或交接，实际受测代码 / 测试 / 执行配置未受影响
- **THEN** 阶段工作按影响判断沿用仍适用的结果，不使全部旧批准失效，不要求新 hash gate 或历史补证

#### Scenario: Source tests or execution configuration changed
- **WHEN** 受测代码、测试、依赖或执行配置变化
- **THEN** 明确影响与必要补验；旧模式正式修复后重新运行整个声明集合；组模式按批准影响复验并构造完整候选结论，不能以旧 PASS 宣称新材料适用

#### Scenario: External material changes are discovered after an execution
- **WHEN** 执行已保存结果，但阶段工作随后发现声明外的源码并发变化或不能确认当前材料仍一致
- **THEN** 保留原执行事实，明确当前材料适用性未确认 / 已变化，按实际影响决定新验证；不能把持久 passed 宣传为当前源码已认证，也不改写已完成 Run

### Requirement: Single operation execution and durable formal outcome

正式操作 MUST 在项目锁内复核必要输入、保存意图、真实执行并完整持久读回。底层子结果继续为 command / 非正式验收，旧单次结果沿历史类型只读。新 groups-v1 SHALL 依据本次完整计划、子执行、全部必需组状态、报告、清理及提交读回给出本次正式 Run 的 passed / failed / blocked / not-run / interrupted / unknown；不得由 wrapper exit0 或多轮 PASS 拼接。未确认执行、资源或保存保留 unknown / 现场。

#### Scenario: Full command actually passes or fails
- **WHEN** 已存在的历史 `delivery-full-test` Run 按旧单次 command 模式完成，显式只读查询其原记录及必要子命令/日志
- **THEN** 按当时合同解释已经保存的 exit 0 为 passed、正常非零为 failed，保留原正式/子结果身份与历史 outcome；**不启动 command、不创建或改写 Run**，旧 passed 不成为新版正式 Close 的验收输入

#### Scenario: Dependencies or tools prevent a launch
- **WHEN** 正式声明已固定，但实际工具 / 依赖预检拒绝，测试子程序未启动
- **THEN** 正式记录为 not-run，执行 ID 可为空，非零退出并保留必要原因；不自动安装或生成测试 passed，普通执行的未分配规则保持

#### Scenario: Interruption or persistence prevents confirmation
- **WHEN** 确认本次前台树已停止，或执行 / 停止 / 保存 / 最终读回无法确认
- **THEN** 分别保留 interrupted 或 unknown / 未完成并非零退出，不发布正式通过；写入不完整时保留锁 / 占号 / 现场，不重跑或自动 finish

#### Scenario: Another writer or changed direct input appears
- **WHEN** 第二写者进入，或本次实际消费的声明 / 记录 / full 入口在锁内复核或终态确认时变化
- **THEN** 冲突 / 变化拒绝或保留 unknown；不发生锁嵌套、第二次执行或拼接不一致输入，外部任意源码并发写入不能被宣传为已完全隔离

#### Scenario: Cancellation starts before the foreground tree settles
- **WHEN** 启动即取消，停止命令返回成功但当前 child / 继承日志管道未在有界等待内关闭
- **THEN** 停止仍为未确认，操作有界返回 unknown / 非零并保留锁与现场；不由命令 exit 0 或入口 pid 消失宣称整树已停止，不自动恢复或清理后代

#### Scenario: Independent failures and dependency gaps
- **WHEN** 普通失败后存在其他独立可执行项或依赖、共享资源被阻断
- **THEN** 继续安全独立项并汇总全部失败；阻断项明确标注，完整结果不得 passed

### Requirement: Delivery scoped author repair

系统 SHALL 为当前 known failed 的正式单次或组级失败（含安全持久完成的协议 invalid）建立 Author repair，固定直接失败、本轮完整范围及必要材料；组模式另固定计划、当前候选和影响 / 沿用组及理由。实质修复完成须交独立 Review；仅经证实纯环境准备问题可免无必要的 Repair/Review Runs，修订另建记录，旧失败不改；范围 / 方案实质变化或 rejected 停 Owner，不复活归档 Change。

#### Scenario: Repair after all changes are archived
- **WHEN** 本轮正式失败已确认，Author 显式开始范围内修复并说明问题
- **THEN** 新 Delivery draft 与 Changes 批次同级，activeChangeId 保持 null，归档关联、项目完成数与原失败保持

#### Scenario: A repair needs normal continuation or revision
- **WHEN** 同阶段尚未完成，或已提交修复收到 changes-requested / 当前 Author 主动进行范围内实质修订
- **THEN** 分别沿同 Action 继续或创建固定直接 Author 的新修订记录；新完成提交须重新独立审核，不沿用旧 approved

#### Scenario: Scope expands or repair is rejected
- **WHEN** 修复需要改变已批准目标 / 方案，或定向审核给出 rejected
- **THEN** 停 Owner 明确决策；普通修复命令不绕过边界，不自动新建完整 Change 或重走 Explore / Propose

### Requirement: Independent targeted repair review

review-delivery-repair SHALL 固定当前完整 Author，由实际独立 Reviewer 核对变化、业务断言、适用性及定向验证。组模式须核对当前候选、受影响 / 沿用组及公共变化造成的扩大；不只批准 metadata。继续保留固定对象，必要写入读直接 Author，不同 actor 仅为记录检查、不认证真人；旧 verdict 保留。

#### Scenario: Approve the completed local repair
- **WHEN** 实际独立 Reviewer 核对新 Author 的变动仍在范围内、验证可靠并提交 approved
- **THEN** 新交接允许显式新的正式 Full Test，固定本次审核对象；不把定向验证或 approved 本身写成正式测试通过

#### Scenario: Author input is stale missing or self-signed
- **WHEN** 审核指向非当前 / 未完成 / 错 Delivery Author、正式继续 / 提交时对象缺失，或 Reviewer 与 Author actor 相同
- **THEN** 对应操作拒绝，不生成批准；普通只读查询仍只解释当前必要头部，不自动追读缺失 Author

#### Scenario: Reviewer requests changes or rejects the repair
- **WHEN** Reviewer 明确完成并提交 changes-requested 或 rejected
- **THEN** 分别转交新的 Author 修订或 Owner 决策；原 verdict 保留，不允许用过去批准重新运行并宣称已审核

### Requirement: New whole collection after approved repair

新 groups-v1 正式修复后验收 MUST 消费当前 approved Review 和固定 Author，并由新 Run 重新执行完整必需组。旧 command 已存记录及局部 retest 只能历史读取，不形成新的正式通过。两者都不得缩减必需范围、借普通 focused 自动补覆盖或递归失败链；未知现场先停处置，不能忽略必要当前审核。

#### Scenario: Focused passes and a new full is requested
- **WHEN** Author 修复后的 focused 已通过，当前独立定向 Review approved，Author 显式再次正式执行
- **THEN** 新一次 groups-v1 完整运行当前计划全部必需组，当前结果指向新 Run；旧失败及日志字节不变，focused 不替代任何未重新执行的组

#### Scenario: An old review or reduced collection is supplied
- **WHEN** 修订后引用旧 approved、缺少当前审核，或请求缩减必需范围 / 用不适用 script 规避失败
- **THEN** 正式执行前拒绝并报告当前输入冲突，范围 / 配置实质调整转 Owner，不覆盖旧失败

#### Scenario: Current approved review has an empty body
- **WHEN** 首次修复后请求正式执行，当前定向 Review 虽有 approved 头部但正文为空
- **THEN** admission 拒绝且不占新号或写新结果；普通查询与 draft save 仍按自身本地输入解释，不倒查审核正文

### Requirement: Direct result readback and bounded applicability

指定正式单次、结构化尝试及候选结论 SHALL 按自身 Delivery / 轮次与必要直接记录读取，分开原命令 outcome、协议 / 覆盖、当前候选结论与材料适用性。旧结果不补新字段，当前查询不回退历史通过；候选结论及 Close 消费其本地直接快照，不递归来源尝试 / 失败链 / 旧审核正文。必要当前输入坏或观察不稳定不能报告可收口。

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

### Requirement: Formal acceptance preserves lifecycle authority

正式执行与范围内修复 SHALL 依赖实际 Owner 范围授权；CLI 只校验操作声明与记录，不认证授权身份。passed MUST 不自动执行 Close / Archive / Git / 下一 Change；工程 check、结构验证或文件齐备不成为普通查询 gate，也不代替阶段独立结论。

#### Scenario: A formal test completes successfully
- **WHEN** 当前完整正式结果 passed
- **THEN** 返回待 Owner 收口 / 后续指令，保留 Delivery open，不自动 Close、push 或激活下一工作

### Requirement: First fresh acceptance after lifecycle work

Reopen / 新 Open 后首次正式验收 SHALL 以当前轮 scope、必要批准 / 基线和当前完整范围开始。旧模式真实执行新完整命令；组模式 initial 选择全部必需组并固定计划 / 候选。旧轮 PASS、repairApproval 或候选结论不满足新轮；后续失败分别按旧整次或新同轮结构化复验合同处理，不以相同组名借用旧覆盖。

#### Scenario: Reopen changes the declared scope and collection
- **WHEN** Reopen 的新槽位全部实际归档，Author 明确新的完整验收集合，Owner 授权新正式执行
- **THEN** 核对本轮直接审核，旧模式执行新的整次 full，组模式 initial 执行全部必需组，形成新 Run / 子结果；不因旧范围 / 集合不同而沿旧失败重试规则拒绝，不继承旧修复批准

#### Scenario: Old pass is supplied before new work is complete
- **WHEN** Reopen 后新范围尚未完成或没有新正式结果，调用者试图以旧 PASS 收口
- **THEN** 拒绝新验收 / Close 的实际缺失前置，保留旧结果可读，不通过修改旧结果或复活旧 Change 继续

#### Scenario: The fresh acceptance fails and is repaired
- **WHEN** 新范围的正式执行失败，随后完成范围内 Author 修复及独立定向审核
- **THEN** 旧模式重新执行该新失败声明的整个集合；组模式核对当前直接审核按影响复验并构造完整候选结论；旧范围的集合和失败链不是本次输入

### Requirement: Round bound verification and repair

新正式单次、组级尝试、候选结论、repair / review 及 Close SHALL 明确当前轮，并核对 scope、完成项及直接来源归属。新指针随轮次投影 / Reopen 更新，旧轮保留历史；缺归属或来源轮次矛盾拒绝当前消费，旧数据仅按明确兼容边界解释，不批量补字段或改历史。

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

正式验收 SHALL 直接核对 A 定义的已声明 product 基线及保存的完成事实，保持同 Delivery 旧轮 / 跨 Delivery v1 或 v2 来源可读，不递归来源历史或将人工说明当硬依赖。组级候选结论继承本轮正式准入快照供 Close 消费；基线不能替代当前组覆盖或修复审核，同轮复验分别服从明确旧 / 新模式。

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
- **THEN** 旧模式仍执行声明整个集合；新组模式仅按显式协议与本轮候选合同消费多来源，不因基线而跳过覆盖、缩减必需范围或绕过审核

### Requirement: Typed structured formal attempts

显式组模式 SHALL 新建可识别的正式尝试记录，新正式执行保存完整 initial、全部必需组计划、候选、轮次、批准 / 基线、真实子命令、协议观察和正式直接结论；旧 continue/retest 记录保持按原类型可读。已选范围成功不代表整个当前候选通过；原尝试不可变，未知新类型 / 协议不能按旧 fullTest passed 消费。

#### Scenario: Start a fresh structured acceptance
- **WHEN** 本轮全部 Change 已归档且正式准入有效，调用者显式请求新协议 initial
- **THEN** 固定全部必需组并实际执行，逐组结果与原命令事实分开保存，不从旧 command PASS 生成组事实

#### Scenario: A typed attempt has protocol contradictions
- **WHEN** 原命令退出、回执覆盖、结束或持久化存在矛盾 / 未确认
- **THEN** 保留原始事实但不确认可消费通过，不因内部 observed / pass 事件发布候选完整结论

#### Scenario: A protocol error is known while the writer has safely finished
- **WHEN** 完整报告的语义矛盾已确认，但实际执行 / 清理、日志与持久读回均已安全完成
- **THEN** 保存 invalid 协议失败，禁止复用其组事实，可正常释放本次自有锁并转范围内修复；进程 / 清理 / 保存未确认仍走 unknown 现场边界

#### Scenario: Old failed command enters first new group execution
- **WHEN** 本轮旧 command failed 经 Author 实质修复与独立 Review approved，却不存在旧 testAttemptRunRef
- **THEN** 新全量 groups-v1 正式运行准入可执行，不补造旧组 attempt、旧 PASS 或修改旧 failed

### Requirement: Confirmed environment-only complete retest
系统 SHALL 将可确认的纯环境准备问题与业务代码或测试合同实质修复区分。只有本项目资源身份、执行及清理状态确认，且受测代码、断言和执行语义未变时，才能留存实际处置来源并重新完整执行 groups-v1；不机械创建无实变的 Repair/Review Runs。

#### Scenario: Owned resource recovered
- **WHEN** 本项目已知服务或端口冲突安全恢复，原失败真实保留且没有业务或测试语义变更
- **THEN** Author 可在既有正式测试授权内重新完整运行全部必需组，免无实变 Repair/Review Runs

#### Scenario: Unknown or semantic fix
- **WHEN** 进程归属、锁、执行/清理未知，或修复必须改源码、测试断言或执行配置行为
- **THEN** unknown 停 Owner 核对；实质变化必须经过 Author delivery-repair 和独立 review-delivery-repair

### Requirement: One complete formal Run is the source of new PASS
新 groups-v1 正式验收 MUST 仅由本次全部必需组真实通过、完整报告、清理与稳定读回产生 passed；新模式不创建跨尝试 verification 汇总来获得 PASS。旧 command、旧 attempt / verification 及其 Close、Repair、review、verdict、日志 MUST 保持可读且不篡改。

#### Scenario: Fresh complete run passes
- **WHEN** 本次计划全部必需组真实通过、业务计数非空、无必需失败/skip/TODO/取消，报告和真实退出相符，清理及持久读回 confirmed
- **THEN** 本次正式 Run 直接保存 passed，供未来独立授权的 Close 消费，不要求额外 verification create 或例行 owner-decision

#### Scenario: Partial or historical attempts cannot become new PASS
- **WHEN** 请求把历史 PASS、局部 retest 或 Focused/Fast 与本次组合成正式通过
- **THEN** 新正式结果与当前 Close 明确拒绝拼接，历史记录本身保持原貌

### Requirement: Safe scope expansion after settled formal acceptance
系统 SHALL 支持已稳定结束的 groups-v1 正式 passed 或 failed 后，在同一 open 轮经明确 Owner 授权新增范围。追加不得复用旧 PASS，旧失败的实质修复及 Reviewer 交接未决时不得借追加绕过审查；运行中、清理未知及写入 unknown 均须阻断。

#### Scenario: Settled passed gains new pending work
- **WHEN** 旧完整正式 Run 稳定 passed、清理 confirmed，Delivery 尚未 Close，Owner 授权追加槽位
- **THEN** 原 Run 与通过事实、日志保持可查，新范围标为未完成，当前正式准入必须在新槽位归档后重新完整测试

#### Scenario: Settled failed gains new pending work
- **WHEN** 旧完整正式 Run 稳定 failed、实际执行/清理已确认且没有当前未决 Repair/Review
- **THEN** 可按真实授权追加，旧 failed 保留为历史事实，不隐含修复已批准，也不使用它为新范围直接 Close

#### Scenario: Active or unknown formal execution cannot be extended
- **WHEN** 当前正式尝试仍运行/未完成、资源清理不明、存在锁或提交终态 unknown、Repair/Review 未解决
- **THEN** 明确拒绝计划追加并保留现场，不改变旧正式指针或让当前问题通过新计划被遮蔽

### Requirement: Historical run inspection is independent from current eligibility
历史正式测试、Repair 和 Review SHALL 按原轮次与保存时范围可读，而本轮现在是否可重跑、再次修复或 Close MUST 另核最新权威范围、完成绑定和最新正式执行。历史结果有效不代表新范围已完成，旧 Run 不会被重标 passed/failed。

#### Scenario: Query past attempt after scope add
- **WHEN** 本轮先前有真实 passed/failed Attempt，后来合法追加新槽位
- **THEN** 显式历史查询仍保存原时间、集合、失败、结果与范围，不因扩大 plannedChanges 返回错误的轮次归属

#### Scenario: Old pass cannot satisfy a newly enlarged scope
- **WHEN** 当前追加范围尚未完成，调用者引用旧 passed/verified、旧 repairApproval 或其它先前测试来源申请正式验收/Close
- **THEN** 拒绝当前消费，不从旧来源拼接当前集合、不修改旧 Run；新完整验收必须覆盖追加后的整个当前范围
