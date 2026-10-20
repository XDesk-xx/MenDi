# test-execution Specification

## Purpose
让调用者显式选择目标项目已有的 focused、fast 或 full 测试入口，以真实执行和持久记录区分通过、失败、未运行、中断和未知结果。该能力提供后续验收需要的命令事实与必要日志，不自动推进阶段、生成审核批准或替代正式 Delivery Full Test。

## Requirements

### Requirement: Existing project test entries

系统 SHALL 从明确目标根的 `package.json` 读取已有 scripts，默认 focused / fast / full 分别映射 `test:focused` / `test:fast` / `test:full`；可选 `mendi.tests` 仅以对应集合到 script 名的映射覆盖默认。直接名称 MUST 以字母数字开头、仅含字母数字 / 冒号 / 下划线 / 连字符，不接受参数、正则或命令文本。系统 MUST 不猜测命令或创建脚本；未知扩展不成为引用依赖。

#### Scenario: List default entries without running them
- **WHEN** 有效本地目标已有三类默认 script，调用者执行 `test list`
- **THEN** 返回集合、script 名、实际 script 文本和可用性，不运行命令、调用 OpenSpec、安装依赖或写记录

#### Scenario: Reuse a differently named existing script
- **WHEN** 目标 `mendi.tests.full` 为 `test` 且 scripts 中存在该项
- **THEN** full 使用已有 `test`；未覆盖的集合继续使用默认，不改 package.json

#### Scenario: Entry is missing or invalid
- **WHEN** 当前选定集合缺少有效非空 script，或其映射不是有效 script 名，或必要 package.json 缺失 / 损坏 / 位于目标外
- **THEN** 执行前非零退出，明确该入口未运行及实际问题，不退回另一集合、不建立已运行结果；list 对缺失 script 如实显示不可用

### Requirement: Explicit local test execution

系统 SHALL 通过 `test run --project <根> --kind <focused|fast|full> --actor <标识> --pnpm-bin <绝对 JS 入口>` 显式执行目标既有 script。首版 MUST 核对 Windows、Node 22、现有 pnpm 11.22.0 及兼容 packageManager 声明，以目标根为 cwd，关闭工具自动下载并强制禁止运行前自动安装，不受目标或调用者安装策略覆盖。系统 MUST 在选定脚本启动前独立检查依赖；失败为 not-run，不启动脚本。实际预检 / 执行命令与策略 MUST 展示。

#### Scenario: Execute a selected entry from another directory
- **WHEN** 调用者在其他目录对 open product Delivery 选择 focused，并提供受支持既有工具入口
- **THEN** 只启动该目标的选定 script，记录真实工具入口、参数和 cwd，不依赖调用目录选择目标

#### Scenario: Environment cannot execute the selected script
- **WHEN** 平台 / Node / pnpm 版本不支持、入口缺失、packageManager 声明冲突或工具预检失败
- **THEN** 在测试子程序启动前返回未运行错误，保留实际原因及必要工具输出，不自动更换或下载工具

#### Scenario: Workspace is not eligible for execution
- **WHEN** 目标无 product Delivery、不是 open、存在归档过渡态、必要本地记录不一致或另一个写者持锁
- **THEN** 测试执行拒绝，不修改阶段 / 关联、解除锁或通过人工格式绕过限制；manual-bootstrap 仍只支持只读解释

#### Scenario: Missing dependencies prohibit the selected script
- **WHEN** 实际工具版本已核对成功，但目标依赖缺失，独立的无 script 依赖预检非零
- **THEN** 返回 not-run、executionId=null、实际预检退出与必要输出，不启动选定脚本、不分配执行目录、不安装依赖或创建 / 改写锁文件；正常释放自身锁，不把该非零记录为测试 failed 或 passed

#### Scenario: Unsynchronized dependencies cannot trigger an automatic install
- **WHEN** 目标依赖已安装但与当前声明不同步，且目标显式设置 verifyDepsBeforeRun: install，或调用者环境要求自动安装
- **THEN** 强制的无安装预检仍拒绝并返回 not-run；选定脚本未启动，已有依赖、锁文件和目标配置保持，不沿用 install / prompt 策略或自动修复

#### Scenario: The execution call also prohibits automatic installation
- **WHEN** 依赖预检通过后开始执行调用，而目标配置仍要求自动安装，或外部在两次调用间改变依赖
- **THEN** 执行调用仍强制禁止 pnpm 运行前自动安装；实际脚本成功 / 非零按其执行事实解释，不宣称依赖一直同步，不因变化偷偷安装或重试

#### Scenario: A selected script explicitly installs a local dependency
- **WHEN** 用户已有且显式选定的脚本自身包含安装命令
- **THEN** 按该脚本真实行为执行并记录结果，不把脚本明确请求的写入冒充为 MenDi 的自动安装，也不修改脚本去禁止其既定行为

### Requirement: Minimal durable test execution identity

每次实际执行 SHALL 在 `.mendi/delivery-groups/<delivery-id>/tests/<序号>-<集合>/` 独占建立结果及 stdout / stderr 日志，执行序号独立于 Run 和 archiveOrdinal，保留旧占号与结果。结果 MUST 保存格式、项目 / Delivery / 执行身份、可空 Change 快照、actor、集合、实际命令 / cwd、执行状态、结果、退出 / 信号和日志定位；actor 不认证真人身份。

#### Scenario: Run a second test without replacing the first
- **WHEN** 前次执行完成且调用者再次显式执行同一集合
- **THEN** 新目录保存本次结果，原结果和日志保持；不新增阶段 Run、不重置或占用 Run / 归档编号

#### Scenario: No active change exists after archive
- **WHEN** open product Delivery 当前无活动 Change，且不存在归档过渡或写入冲突，显式执行测试
- **THEN** 记录该 Delivery 与空 Change 快照，不伪装活动 Change，不重开旧 Change 或改 archived binding

#### Scenario: Execution location is inconsistent or unsafe
- **WHEN** 执行引用、日志位置或写入目录越界、经链接指向外部、与当前 Delivery / 集合 / 执行身份矛盾或存在重复占号
- **THEN** 拒绝相关读写并报告实际位置，不覆盖旧结果、回退其他 Delivery 或读取说明 Ref 目标

### Requirement: Honest test outcomes

结果 SHALL 区分 `not-run`、`passed`、`failed`、`interrupted`、`unknown`。只有选定命令实际正常退出 0、必要日志和终态完整保存并读回时 MUST 报告 passed；选定命令正常非零为 failed，确认本次支持的前台进程树停止的中断为 interrupted。工具或依赖预检拒绝、选定命令未启动为 not-run；执行 / 停止 / 保存无法确认为 unknown，不以日志文字、信号空值或预检出口推导测试结果。

#### Scenario: Normal exit is zero or nonzero
- **WHEN** 选定测试命令实际正常结束且结果 / 日志保存读回完整
- **THEN** exit 0 为 passed，非零为 failed；run 分别退出 0 / 1，记录实际值，不把其他集合的成功作为本次结果

#### Scenario: Log writes make only partial progress
- **WHEN** stdout 或 stderr 的日志写入合法返回部分字节
- **THEN** 按实际字节数继续保存余下内容，完整日志与其他成功条件均满足才报告 passed；零进展或抛错报告 unknown / 非零并保留现场，不无限等待或补造日志

#### Scenario: Launch fails before a test child exists
- **WHEN** 已保留执行目录但进程启动明确失败，尚无测试子进程
- **THEN** 保存 not-run 与启动原因，run 非零退出，保留已占号目录，不填写伪造退出 0

#### Scenario: Script output is not a dependency precheck result
- **WHEN** 依赖预检已通过，选定命令实际运行并非零结束，脚本输出中包含类似依赖预检错误的文字
- **THEN** 在日志 / 结果完整时报告 failed，保留真实执行退出码；不依据脚本文字反推 not-run，也不把另一调用的预检成功作为 passed

#### Scenario: Process or persistence cannot be confirmed
- **WHEN** 退出未知、收到非正常信号、停止未确认、日志写入失败或终态替换 / 读回 / 锁释放失败
- **THEN** 操作非零退出并报告 unknown / 未确认及实际已写路径；保留现场，不发布完整 passed、不补造日志或自动重新执行

### Requirement: Intent before launch and read-only incomplete results

系统 MUST 在启动测试前持久保存意图。test status SHALL 读取明确 execution ID；未指定 --delivery 时使用当前已选 Delivery，指定时仅读取该已登记 product Delivery，不改项目选择。只读检查身份和必要日志，不要求对象 open、无活动项或符合新执行范围，不调用上游 / 测试。未完成、锁或读中变化如实为 unknown / 不稳定，不由旧 PID 消失推导终态。

#### Scenario: Read a completed result in a new process
- **WHEN** 完成执行后新进程读取指定结果，必要终态和日志完整
- **THEN** 返回同一集合、命令、cwd、实际结果与退出信息；成功只表示记录可读，读取已知 failed / interrupted 记录不重新运行命令

#### Scenario: A finished unknown record remains unconfirmed without a lock
- **WHEN** 新进程读取已保存的 finished / unknown，原执行已停止且锁已由明确的人工处置移除，必要记录 / 日志前后稳定
- **THEN** 保留原记录与 stable 观察，但 ok 为 false、outcome 仍为 unknown，非零退出；不写入、重跑、推导新终态或将锁不存在解释为执行已确认；已知 failed / interrupted / not-run 的完整稳定记录仍可读成功

#### Scenario: Writer disappeared after launch intent
- **WHEN** 新进程读到 running 意图，但无完整终态，即使记录 pid 不存在
- **THEN** 显示 unknown 与必要现场，旧 pid 仅为说明；不重试、补写 failed / passed、杀进程或解除锁

#### Scenario: A lock or changed record prevents a stable result
- **WHEN** 读取指定执行时仍有写入锁、必要记录 / 日志损坏或前后观察改变
- **THEN** 只读报告当前持久观察及未确认原因，非零退出，不将已观察的 passed 字段表述为稳定的完整成功；普通 status / next 的锁边界保持

#### Scenario: The same execution id exists in two deliveries
- **WHEN** 新旧 Delivery 均有 001-full，调用者指定 --delivery 为旧已登记 ID
- **THEN** 只读取旧 Delivery 的指定结果并展示所属身份，默认省略时只读当前对象；不按历史目录搜索或把另一结果套给当前 ID

#### Scenario: Historical execution is read after close or reopen
- **WHEN** 指定旧执行的 Delivery closed，或当前范围 / 活动 Change 已变化，必要结果 / 日志有效
- **THEN** 保留实际命令 outcome 并可稳定读回，不宣传新工作通过，不复用执行准入要求拒绝读取

#### Scenario: An explicit delivery is unregistered or unsafe
- **WHEN** --delivery 未登记、索引 / manifest 身份矛盾、位置越界，或结果 / 日志与指定身份不符
- **THEN** 明确失败，不回退当前 Delivery、不读项目外目标；未知 Ref 和无关旧日志不成为读取前置

### Requirement: Bounded foreground interruption

首版 SHALL 仅支持当前前台执行进程及其 Windows 进程树的中断处理：收到调用者取消时，只能停止本进程实际启动且仍持有的子进程树，并按实际停止结果和退出事件判断。系统 MUST 不提供从历史 pid 杀进程、通用取消平台或自动清理；无法确认停止 SHALL 保留 unknown。

#### Scenario: Caller interrupts a controlled foreground tree
- **WHEN** 受控测试已实际启动，调用者取消，当前执行者确认本次子进程树停止并收到退出事件
- **THEN** 保存 interrupted、实际停止依据和退出信息，非零退出；不因为退出非零误写普通失败，也不宣布 full 通过

#### Scenario: Stop could not be confirmed
- **WHEN** 停止工具失败或退出事件不足以确认本次支持范围的进程停止
- **THEN** 保留 unknown、原日志与锁 / 实际现场，停止后续成功提交；历史 pid、其他项目及已脱离前台树的进程不被自动处理

### Requirement: Test execution preserves collaboration boundaries

测试工具 SHALL 只记录选定命令事实，不修改当前阶段、next、binding、提交结果、Reviewer verdict 或 Delivery 状态。full 的结果 MUST 明示普通 command 执行，不生成正式 Delivery Full Test 记录 / 授权 / 通过；正式验收和收口由独立操作消费明确输入，不因测试集合名称自动执行。

#### Scenario: A focused or fast command succeeds
- **WHEN** focused 或 fast 实际 passed
- **THEN** 仅该集合结果为 passed，原 Run、next、verdict、计数和 Delivery 状态不变，不宣传完整验收通过

#### Scenario: A full command succeeds outside formal acceptance
- **WHEN** 普通 test run 选择 full 且实际 passed
- **THEN** 结果标明 command scope 与非正式验收，不创建正式 Full Test Action、不批准阶段或 Close

#### Scenario: Status queries ignore unrelated execution history
- **WHEN** 普通 status / next 的必要当前输入有效，但旧测试日志或未知 Ref 不可用
- **THEN** 普通查询仍按当前协作记录解释，不扫描测试结果或附加工程 / hash gate；test status 只检查其明确指定的结果输入

### Requirement: Optional structured group execution contract

系统 SHALL 对普通工具调用支持显式接入的组协议；**新的正式 Delivery Full Test MUST 要求 `groups-v1` 协议**，固定项目、Delivery、轮次、候选、完整计划及本次全部必需组选择。目标负责真实执行、业务依赖与资源；普通命令不得自动转成组事实。未知版本或协议不支持 MUST 在启动前拒绝，不静默降级到旧 command。

#### Scenario: Opt into a declared group plan
- **WHEN** 目标已有 full 入口，Owner 授权的正式执行使用有效 `groups-v1`、项目内完整计划以及全部必需组选择
- **THEN** 锁内固定请求及新执行身份，将受管请求和回执位置交给目标，沿既有真实工具、不自动安装及意图先于启动的规则执行

#### Scenario: Reject an ambiguous or unsafe plan
- **WHEN** 组 ID 重复、依赖悬空 / 非前向、自环、选择越界或少必需组、计划或回执路径越界，或请求期间直接输入变化
- **THEN** 拒绝、不产生正式通过；写后不确定保留现场，不能回退到旧 command

#### Scenario: Keep an opaque command opaque
- **WHEN** 普通命令未显式接入分组协议，stdout 含 pass / fail 字样或生成看似组报告的文件
- **THEN** 只按实际普通命令解释，不自动形成组覆盖或正式 PASS

### Requirement: Nonvacuous required group coverage

tests 组 SHALL 核对实际选择、完整结束、必需执行计数及执行前明确的非必需排除。未排除业务范围必须实际非空执行，必需 skip / TODO、取消、失败或未完成均不能满足覆盖。构建等 command 组 SHALL 核对其真实命令与声明产物条件，不能用改组种类或事后排除规避失败。覆盖声明 MUST 不宣传为自动业务认证。

#### Scenario: A runner reports success with only skipped and todo tests
- **WHEN** 必需测试组只有 skip / TODO，pass 事件或根 summary.success 为真，包装器退出 0
- **THEN** 保留原事件及命令事实，但组覆盖不成立，不将零业务执行或无 fail 解释为通过

#### Scenario: A group has mixed passes and failures
- **WHEN** 同一文件 / 逻辑组先后出现成功和失败
- **THEN** 最终组不能通过，不能按成功文件集合、第一个或最后一个成功覆盖失败

#### Scenario: Exclusions were declared before execution
- **WHEN** 完整计划已明确非必需项身份及理由，报告能对应其观察与必需计数
- **THEN** 单独展示排除及必需覆盖；失败后新增排除、改变选择或删减必需范围不能沿用原计划结论

#### Scenario: A non-test command group completes
- **WHEN** 构建等组真实结束、必要产物条件已核对，且没有未确认错误
- **THEN** 按该组完成条件解释，不伪造业务断言数；测试组不能改标 command 来跳过未满足的覆盖

### Requirement: Group completion after final lifecycle confirmation

组级事实 SHALL 区分事件、业务测试、容器及整次执行的终态。早期 pass 不能代替实际结束；晚退出 / 错误、取消、未确认进程关闭 / 清理及持久化不确定 MUST 保持相应非通过状态。只有必要回执、日志和终态完整保存读回、当前执行及资源边界确认后，组事实才可供正式消费。

#### Scenario: A process fails after an assertion passed
- **WHEN** 断言已 pass，随后容器退出非零或结束阶段产生错误
- **THEN** 保留早期事件但该组不通过，等待容器与根结束，不把临时成功当最终成功

#### Scenario: Cancellation emits failure events
- **WHEN** 已有部分 pass 后发生明确取消，后续事件标记 aborted / cancelled
- **THEN** 取消与普通断言失败分别解释，停止本轮；未完成尾项没有通过事实，资源停止未确认则保持 unknown

#### Scenario: Terminal persistence fails after child close
- **WHEN** 内存观察曾为 passed，但终态替换 / 读回 / 释放未确认，磁盘仍是不完整状态
- **THEN** 顶层保持 unknown / 不完整与现场，不挑内层 observed 成功用于结论；后续写入仍受原锁 / 未完成状态约束

### Requirement: Agreement of receipts and raw execution

新结构化正式执行 SHALL 保留真实子命令原 outcome，并独立核对本次全部必需组的最终回执、根结束、退出事实和清理的一致性。包装器 exit0 与组失败 / 必需缺口矛盾、非零却声称无原因的全部成功等 MUST 阻止本次正式 PASS；安全已结束的 known invalid 与 unknown 执行/清理分别处理。

#### Scenario: The wrapper exits zero while events contain a failure
- **WHEN** 实际命令退出 0，但最终报告含必需失败、未执行或不一致
- **THEN** 保留命令真实退出，组协议记录 invalid / failed，正式结果不得 passed；不根据 stdout 重写旧 command

#### Scenario: A final receipt is missing or stale
- **WHEN** 仅有增量事件，或最终回执缺失、组重复、身份/候选/范围错配
- **THEN** 不确认正式完整通过，不从最后事件、旧报告或另一个执行结果推断成功

### Requirement: Bounded collection under dependencies and resources

显式计划的普通独立失败 SHALL 保留并继续可执行独立后项，前置失败只阻断相关组；通过、失败、blocked、not-run、interrupted、unknown 分别展示。全局取消 MUST 停止本轮；清理或归属未知阻断共享资源后项，无法界定影响时停止相关执行并说明。任一必需项未满足，整体不能通过，不抢陌生资源或自动清锁。

#### Scenario: An independent middle group fails
- **WHEN** 计划中一个普通组失败，后续组不依赖该失败且资源安全
- **THEN** 保留失败，继续后项并收集后续真实问题，结束仍为非通过，最后通过不能覆盖前面的失败

#### Scenario: A build prerequisite fails
- **WHEN** 构建失败而只有部分组声明依赖该构建
- **THEN** 相关组明确 blocked，独立逻辑 / API 等组仍可执行，不把被阻断项伪造为已测失败或通过

#### Scenario: Cleanup is unknown for a shared resource
- **WHEN** 前组的资源清理 / 停止未确认，后组可能复用该资源
- **THEN** 保存现场并阻断共享后项，不凭旧 PID、端口预检或旧 PASS 认领资源；不能限定影响时停止相关执行

#### Scenario: A caller cancels the whole attempt
- **WHEN** 调用者明确取消当前尝试
- **THEN** 不再启动后组，沿原真实前台树停止合同记录 interrupted 或 unknown，不将取消当成可忽略的普通失败

### Requirement: Scoped timing and incremental execution progress

结构化执行 SHALL 报告必要逻辑组 / 昂贵阶段的单调持续时间、UTC 追溯、父子包含与时钟基准，区分整轮墙钟、工作量及可证明的关键路径。未测阶段明确未知；进度采用本次增量事件，不以反复扫全历史或重复搬日志替代。性能优化 MUST 保留真实范围、时间契约、隔离和清理，不设任意性能门槛或承诺无依据收益。

#### Scenario: Nested stages are reported
- **WHEN** 子阶段包含在父包络内，或有不同进程的单调时钟
- **THEN** 显示包含 / 基准关系，不直接叠加为墙钟，不相减不兼容基准、不编百分比或 ETA

#### Scenario: A read-only preparation is reused within an attempt
- **WHEN** 同次执行的输入 / 配置一致、只读产物及服务归属明确，使用者数据 / 上下文独立
- **THEN** 可按目标计划复用并记录实际准备成本；输入变化或适用性未知重新准备，不并发写同一 dist、不使用无来源旧临时产物

#### Scenario: An optimization would weaken a timing assertion
- **WHEN** 提速需要删场景、放宽原业务超时、盲重试或牺牲隔离
- **THEN** 不据此宣称优化成立，先处理真实热点 / 资源规划，保留必要真实到期、取消与预算链路

### Requirement: Whole-run required coverage controls formal PASS

新 groups-v1 正式结果 MUST 核对真实完成与非空业务计数、全部必需组状态、计划排除、最终报告及资源清理；不接受旧组 PASS、必需 skip/TODO、取消、未知状态或瞬时包装器成功补齐。一次新完整执行最终汇总全部失败与阻断。

#### Scenario: Full set passes
- **WHEN** 本次全部必需组真实通过、无必需 skip/TODO/取消、最终报告有效且清理已确认
- **THEN** 组执行材料具备直接形成本次正式 passed 的必要覆盖事实，仍须通过正式 Run 提交与读回

#### Scenario: Independent errors are collected
- **WHEN** 中段失败而尾部组独立且执行安全
- **THEN** 尾部继续，统一记录所有错误，不隐藏未执行或阻断

#### Scenario: Unknown cleanup or result
- **WHEN** 子执行、资源清理、最终回执或持久提交存在 unknown
- **THEN** 保留真实现场，阻止正式 PASS，不能简单重试或自动清锁
