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
