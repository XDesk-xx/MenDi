# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Explicit same round continuation
**Reason**: D05 后新的正式执行必须完整运行，不再续测单独选择部分必需组。
**Migration**: 已存在的 continue attempt 按历史原记录可读；以后增量正式验收须另获产品决定。

### Requirement: Candidate verification from bounded direct sources
**Reason**: 新正式 PASS 由本次完整组执行直接提供，不再生成跨尝试 verification Run。
**Migration**: 原 candidate-verification 及已完成 Close 保持只读，不能追改 verdict、组结果或历史来源。

### Requirement: Reviewed impact and source applicability
**Reason**: 修复影响分析不能为新的正式全量执行豁免部分必需组。
**Migration**: 历史 retained/source 说明仍可查，局部复测只作为普通 Focused/Fast 证据。
