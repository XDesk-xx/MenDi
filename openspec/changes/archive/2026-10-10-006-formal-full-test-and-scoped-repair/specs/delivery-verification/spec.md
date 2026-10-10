# Spec Delta

## Purpose

让明确授权的 Delivery 验收基于本轮交付范围、必要审核、完整测试集合与实际受测材料形成真实结果，并在失败后以范围内修复、独立定向审核和新的完整执行继续。保留历史失败与查询边界，避免将普通命令成功、旧批准或拼接结果当成当前交付通过。

## ADDED Requirements

### Requirement: Explicit formal delivery test admission

系统 SHALL 通过显式 `delivery full-test` 接受项目内的验收声明，要求 open product Delivery、无活动 / 归档中 Change、本轮全部计划槽位具有一致的已归档关联及必要直接审核。声明 MUST 包含非空完整集合说明和受测材料基准；缺失、矛盾、陈旧审核、不安全路径、未结束修复或写入冲突 SHALL 拒绝，不能以最后一个 Archive、任务勾选或普通 PASS 替代。

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

### Requirement: Declared collection and tested material basis

正式结果 SHALL 保存完整集合说明、实际 full script / 命令 / cwd、受测提交与必要未提交差异说明；无 Git 基准时 MUST 保存实际受测材料说明。系统 SHALL 区分声明与已验证执行事实，不将文本、actor 或固定少数文件比较宣传为任意源码认证；材料真实与覆盖充分由阶段工作 / 独立审核负责，不增加全库 hash、文件清单或自动覆盖推断。

#### Scenario: Candidate has a git basis or explicit material description
- **WHEN** 本次声明给出实际提交与必要差异，或无 Git 基准时明确实际代码、测试、配置和影响范围
- **THEN** 结果保留该基准供定向审核和收口判断；命令记录据实际读取生成，不把声明冒充为自动观测的源码快照

#### Scenario: Only documentation or handoff text changed
- **WHEN** 后续仅整理说明、日志或交接，实际受测代码 / 测试 / 执行配置未受影响
- **THEN** 阶段工作按影响判断沿用仍适用的结果，不使全部旧批准失效，不要求新 hash gate 或历史补证

#### Scenario: Source tests or execution configuration changed
- **WHEN** 受测代码、测试、依赖或执行配置变化
- **THEN** 明确影响与必要补验；正式修复后重新运行整个声明集合，不能用旧候选的 PASS 宣称新材料适用

#### Scenario: External material changes are discovered after an execution
- **WHEN** 执行已保存结果，但阶段工作随后发现声明外的源码并发变化或不能确认当前材料仍一致
- **THEN** 保留原执行事实，明确当前材料适用性未确认 / 已变化，按实际影响决定新验证；不能把持久 passed 宣传为当前源码已认证，也不改写已完成 Run

### Requirement: Single operation execution and durable formal outcome

正式操作 MUST 在一个项目写锁内复核当前范围 / 审核 / 声明 / 命令，保存运行意图，调用既有 full 执行能力并保存 / 读回本次正式结果。普通子结果 SHALL 继续标明 command / 非正式验收。只有实际正常退出 0、必要日志与两层结果完整保存读回、本次已知直接输入无冲突时 SHALL 报正式 passed；该结果只认证声明下的完整执行，不自动认证当前源码适用性，也不认领旧普通结果。

#### Scenario: Full command actually passes or fails
- **WHEN** 本次声明对应的 full 命令正常结束，记录与日志完整
- **THEN** exit 0 为 passed、正常非零为 failed，保存本次执行身份与结果；正式 Run 和普通子结果身份可核对，命令成功不自动 Close

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

### Requirement: Delivery scoped author repair

系统 SHALL 为当前明确 failed 的正式 Full Test 准备 `delivery-repair` Author draft，固定该直接失败、本轮范围和集合，允许范围内真实修复或问题分析并保存材料 / 差异与定向验证。当前 Author 完成后 MUST 交独立 Review；submitted 修订另建记录，旧失败 / Run / verdict 不改。范围 / 方案实质变化或 rejected SHALL 停 Owner 决策，不能复活归档 Change。

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

`review-delivery-repair` SHALL 固定当前 submitted / complete 的同 Delivery Author，读取其完整正文及直接范围 / 材料，要求不同 actor，并由实际独立 Reviewer 检查局部变动、适用性和定向验证后提交 verdict。继续 MUST 保留固定对象。保存草稿只需本地输入，开始 / 继续 / 正式提交需要固定 Author；actor 不认证真人，工具成功不生成批准。

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

修复后的正式 Full Test MUST 消费当前完整 approved 的定向 Review（必要头部与非空正文）及固定新 Author，重新执行原失败声明的整个集合，保存新 Run 和新结果；首次修复后执行与后续重跑保持相同的当前直接审核完整性检查，不递归核对历史正文。不得缩减集合、沿失败父链补证或拼接旧 full / 新 focused。新失败可继续范围内处理；not-run / interrupted 可显式重新执行，unknown / 不完整现场须先停在 Owner 核对边界。

#### Scenario: Focused passes and a new full is requested
- **WHEN** 修复后的 focused 已通过，当前独立定向 Review approved，Author 显式再次正式执行
- **THEN** 新一次 full 完整运行原声明集合，当前结果指向新 Run；旧失败及日志字节不变，focused 不替代任何未重新执行的组

#### Scenario: An old review or reduced collection is supplied
- **WHEN** 修订后引用旧 approved、缺少当前审核，或请求以缩减集合 / 其他 script 规避失败
- **THEN** 正式执行前拒绝并报告当前输入冲突，范围 / 配置实质调整转 Owner，不覆盖旧失败

#### Scenario: Current approved review has an empty body
- **WHEN** 首次修复后请求正式执行，当前定向 Review 虽有 approved 头部但正文为空
- **THEN** admission 拒绝且不占新号或写新结果；普通查询与 draft save 仍按自身本地输入解释，不倒查审核正文

### Requirement: Direct result readback and bounded applicability

当前 Full Test 的查询 SHALL 读其正式 Run 与直接执行结果 / 必要日志，分开显示 outcome、声明基准和已知范围 / 命令匹配情况；稳定可读的 failed 不等于 passed。查询 MUST 不自动认证源码适用性、读历史失败父链 / 审核正文或执行推荐操作。后续 Close SHALL 使用本轮当前适用正式结果的直接入口，本 Change 不实现 Close。

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

### Requirement: Formal acceptance preserves lifecycle authority

正式执行与范围内修复 SHALL 依赖实际 Owner 范围授权；CLI 只校验操作声明与记录，不认证授权身份。passed MUST 不自动执行 Close / Archive / Git / 下一 Change；工程 check、结构验证或文件齐备不成为普通查询 gate，也不代替阶段独立结论。

#### Scenario: A formal test completes successfully
- **WHEN** 当前完整正式结果 passed
- **THEN** 返回待 Owner 收口 / 后续指令，保留 Delivery open，不自动 Close、push 或激活下一工作
