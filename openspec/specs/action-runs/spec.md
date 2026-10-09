# action-runs Specification

## Purpose
让手动开发中的 Action、工作进展和审核对象可以被明确保存并跨进程读回，以连续编号的 Run 承接同阶段继续、完成、修订与独立角色交接。该能力提供必要的记录、方法选择和写入边界，保留历史提交，不将工具运行成功或文件齐备解释为语义完成与审核批准。

## Requirements

### Requirement: Explicit action recording

系统 SHALL 通过显式 Action 开始与继续操作组织当前 product Delivery 的已关联活动 Change，要求类型、声明角色与稳定操作者标识，返回本次 Run 和实际阶段方法。系统 MUST 拒绝人工 bootstrap 写入、不支持类型、错角色、非当前目标或不合法的当前交接；命令只准备工作记录，不自动执行语义任务。

#### Scenario: Start the initial author action
- **WHEN** open product Delivery 已关联活动 Change、尚无当前 Run，Author 显式开始 explore
- **THEN** 系统保存一个 draft Run，分配 Action 身份，返回实际 Explore 方法，保留 OpenSpec 和目标已有材料

#### Scenario: Wrong role or unsupported operation
- **WHEN** 类型为 review-explore 却声明 author，或请求 Archive / Delivery 操作、非当前 Change 或人工记录写入
- **THEN** 操作在业务写入前拒绝，指出类型、角色、目标或格式问题，不代签批准或迁移历史

### Requirement: Stage skill and requested guidance

系统 SHALL 按 Action 类型和角色选择固定的产品阶段 Skill，修订使用相应 Author 阶段方法；必要工具指导 SHALL 仅按明确请求读取。开始 / 继续时 MUST 返回实际文件位置与内容，缺失、不可读或阶段身份矛盾时失败。方法选择和文件读取 SHALL 不被表述为已经执行该方法或完成工作。

#### Scenario: Author and reviewer use different methods
- **WHEN** 用户分别开始 explore 与 review-explore，并明确请求 openspec 工具指导
- **THEN** 返回各自角色对应的产品阶段 Skill 及实际 OpenSpec 指导，Run 保存所选方法标识，审核不使用 Author 方法代替独立检查

#### Scenario: Required method is missing
- **WHEN** 当前操作选择的阶段 Skill 或明确请求的工具指导不存在、不可读或不匹配阶段
- **THEN** 操作失败且未分配新 Run；普通 status / next 不因不读取的方法文件失效而失败

### Requirement: Delivery-wide run allocation

系统 SHALL 在整个 Delivery 内按实际已占号 Run 目录分配递增编号，至少三位，跨 Change 连续；Changes 批次目录 MUST 不消耗额外序号。分配 MUST 使用独占写入并拒绝重复号、不安全路径与冲突。空占号目录 SHALL 保留并报告，后续不复用；编号分配 SHALL 不认证或读取全部历史提交正文。

#### Scenario: Continue across changes in a batch
- **WHEN** 同 Delivery 历史操作 / Change 已占号到 015，当前批次为 003-changes
- **THEN** 新 Run 使用 016，批次不另占号，旧 Run 位置和内容不变

#### Scenario: An interrupted reservation exists
- **WHEN** 与当前指针无关的安全 Run 目录已占号 019 但无完整 run.md
- **THEN** 新分配跳过已占号的 019，使用下一号并报告残留，不清理现场或声称 019 已完成

#### Scenario: A number is duplicated or another writer owns the lock
- **WHEN** 扫描发现同 Delivery 重复序号，或其他进程持有写入锁
- **THEN** 拒绝分配并报告冲突，原记录及他人锁保持不变

### Requirement: Current run as direct state input

系统 SHALL 使用活动 binding 的 latestRunRef 定位当前产品 Run，校验受管位置、Delivery / Change / Run 身份与必要头部，并由该 Run 解释 Action 进展。当前 Run 缺失、损坏或身份矛盾 MUST 报错；普通状态查询 SHALL 不解析无关历史头部、不递归读取说明引用，也不为查状态分配 Run。

#### Scenario: Read progress in a new process
- **WHEN** 新进程查询存在有效当前 Run 的 product 记录
- **THEN** 显示相同 Action、类型、角色、draft / submitted 状态和 continuing / complete 结果，引用失效的历史说明或未知 Ref 不影响该查询

#### Scenario: Required current run is unavailable
- **WHEN** latestRunRef 指向缺失、坏头部、越界位置或另一个 Change 的 Run
- **THEN** 查询失败并明确当前输入问题，不回退猜测历史最新文件或补建记录

### Requirement: Draft save and immutable submission

系统 SHALL 仅允许当前 product draft 的同角色 / 同操作者保存正文，使用明确根、有效本地配置、活动 binding、当前 Run、明确正文输入及安全写入；保存 MUST 不依赖上游进程、方法正文或固定 Author 正文。正式提交 SHALL 继续校验上游、非空正文、result、outcome 和必要固定 Author / verdict。已提交 Run MUST 不允许保存或重提；陈旧输入、冲突或读回失败 MUST 非零退出并保留现场。

#### Scenario: Save a draft and submit progress
- **WHEN** 当前 draft 的原操作者保存 Markdown 工作记录，再以 continuing 提交
- **THEN** Run 在跨进程读回时为 submitted / continuing，正文和结果真实保留，Action 仍未完成

#### Scenario: A submitted or stale run is edited
- **WHEN** 对已提交 Run 保存 / 重提，或操作引用已不是当前 draft 的 Run
- **THEN** 系统拒绝写入，不改旧正文、结果或交接

#### Scenario: Save a failure note while the selected tool is unavailable
- **WHEN** 上游 status 失败或固定入口不可用，但本地配置、当前活动 Change 路径及同 actor / role 的 draft 和正文有效
- **THEN** 保存并读回 draft 正文，仍为未提交；结果明确 local-only，不执行上游，不认为阶段完成，正式 submit 仍因上游失败而拒绝

#### Scenario: A local save has invalid required input
- **WHEN** 本地配置 / 当前 Change / Run / 正文缺失或损坏，actor / role 不匹配，受管路径不安全，或存在写入锁
- **THEN** 保存失败并说明实际输入，不回退旧 Run 或其他项目，不覆盖正文、不清理锁、不因上游检查放宽而绕过本地边界

#### Scenario: Reviewer saves notes without the fixed author file
- **WHEN** 当前 Reviewer draft 有效但固定 Author 正文缺失
- **THEN** 可仅保存 Reviewer draft 的故障说明；正式 Review continue / submit 仍要求固定完整 Author，不生成 verdict 或批准

#### Scenario: Draft replacement committed before readback failed
- **WHEN** 保存 draft 已 rename 替换正式文件，随后读回失败
- **THEN** 非零退出并保留实际新正文、锁和错误，不为维持失败前字节而回滚，不重提，不改任何旧 submitted Run

### Requirement: Same action continuation and explicit revision

系统 SHALL 只在当前 Run 已 submitted / continuing 时允许同角色 / 同操作者继续，并创建同 actionId 的新 draft；draft 尚未提交或 Action 已 complete 时 MUST 拒绝 continue。正式提交后的实质修订 SHALL 建立新的修订 Action 与 Run，明确关联当前被修订的 Author 提交，保留旧 Action、Run 与 verdict。

#### Scenario: Two runs belong to one unfinished action
- **WHEN** 一个 Author 或 Reviewer Action 的当前 Run 已提交 continuing，原操作者继续
- **THEN** 分配新编号与 draft，actionId 保持一致，旧 Run 字节不变；Reviewer 的 authorRunRef 也保持一致

#### Scenario: Continue would overwrite or reopen completed work
- **WHEN** 当前 Run 为 draft 或 submitted / complete，却请求同 Action continue
- **THEN** 操作拒绝，提示先提交当前进展或显式建立符合范围的修订 Action

#### Scenario: Author revises a submitted stage
- **WHEN** 当前交接指向该阶段最新完成的 Author 提交，Owner 范围内显式开始相应 revise 类型并指定该 Author Run
- **THEN** 新 Action 身份和 Run 记录直接修订对象，当前进展不沿用旧批准，旧记录保持不变

### Requirement: Fixed author input for reviewer continuation

系统 SHALL 在 Review 开始时要求当前完成 Author Run，校验同 Delivery / Change、匹配阶段、submitted / complete 及不同操作者标识，将 authorRunRef 固定到 Review Action。Reviewer 继续与提交 MUST 沿用该对象，不要求它等于当前 Reviewer Run；陈旧 / 未完成 / 错阶段输入和明显自签 MUST 拒绝。操作者标识 SHALL 不声称认证真实身份，独立性由实际会话角色保证。

#### Scenario: Reviewer continues in a second run
- **WHEN** Review 首次指向完成 Author A，Reviewer R1 提交 continuing，然后继续 R2
- **THEN** R2 使用同 review actionId 与 authorRunRef=A，能在新进程完成审核，不把最新 R1 当成 Author 或改查无关历史

#### Scenario: Review targets the wrong submission
- **WHEN** 初次 Review 指定非当前 Author、未完成 Run、其他阶段 / Change，或声明与 Author 相同操作者
- **THEN** 写前拒绝并指出具体输入问题，不生成有效审核结论

#### Scenario: The fixed author input disappears
- **WHEN** 当前 Reviewer Run 尚可读，但固定 Author Run 缺失
- **THEN** 普通 status / next 仍展示当前 Reviewer 状态；Review continue / submit 因实际消费缺失 Author 输入而失败，不扩大成历史引用检查

### Requirement: Verdict and minimal next handoff

系统 SHALL 仅在 Reviewer 完成提交时要求 approved、changes-requested 或 rejected；Author 与 Reviewer continuing MUST 不提供 verdict。当前 next SHALL 由当前 Run 表达下一动作、状态、角色、原因及必要当前输入，不累积历史链。阶段工具成功 / OpenSpec ready MUST 不生成批准，next MUST 不自动执行后续工作。

#### Scenario: Complete a review with each verdict
- **WHEN** Reviewer 完成匹配阶段的审核并明确给出 verdict
- **THEN** approved 推荐对应下一阶段，changes-requested 推荐当前 Author 修订，rejected 停在 Owner 决策；均保存直接 Author 关联且不执行下一 Action

#### Scenario: Author completes or reviewer is still working
- **WHEN** Author 提交 complete，或 Reviewer 提交 continuing
- **THEN** 分别推荐对应独立 Review 或同 Review 继续，不生成 approved；Author 提供 verdict 或完成 Review 没有 verdict 时拒绝

### Requirement: Multi-file write interruption diagnosis

系统 SHALL 对 Run 与 manifest 更新执行独占写入和最终读回，仅在完整成功后返回成功。存在锁、当前 draft 的未完成替换或 Run 写入后当前指针未提交时 MUST 报告不完整操作并保留现场；查询与新写入 SHALL 不自动修复、重提、抢锁或回滚，不宣称跨文件崩溃原子性。

#### Scenario: Run is created but the pointer cannot be committed
- **WHEN** 新 Run 已落盘而 manifest 更新失败或进程中断
- **THEN** 操作非零退出或后续查询报告残留锁 / 不完整写入，原 manifest 保持完整，已写 Run 不被删除或作为当前完整提交伪报成功

#### Scenario: Submission is committed but readback is uncertain
- **WHEN** Run 替换已发生而最终读回或锁释放失败
- **THEN** 返回实际已写路径与失败原因，保留可判断现场，不自动重复提交或宣称失败前的 draft 仍可编辑

### Requirement: Stage-scoped artifact instructions

系统 SHALL 为当前 product Explore / Propose 及相应 Review Action 提供显式只读 artifact 指引；Explore 仅支持 proposal 背景，Propose 支持 proposal、specs、design、tasks。系统 MUST 核对当前 actionId 和阶段并读取目标真实指引；不要求全部 artifact 已 ready，不代写文件。返回的直接依赖和约束 SHALL 由 Agent 按当前工作消费，查询不自动执行依赖或生成完成结论。

#### Scenario: Read the next planning artifact
- **WHEN** 当前 Propose Action 请求 specs 指引且 proposal 已存在
- **THEN** 返回真实 specs 指引、输出 pattern、proposal 依赖及对应 context / rules，当前 Run 和 next 不变，由 Author 读取依赖并编写 delta

#### Scenario: Guidance is requested for an unfinished prerequisite
- **WHEN** 当前 Propose 请求尚被前置依赖阻挡的 artifact 指引
- **THEN** 返回上游实际依赖 done 状态，不伪报 ready / done，不自动创建前置产物；Agent 按实际上游条件决定补充当前必要工作

#### Scenario: Action or phase is not supported
- **WHEN** 指定陈旧 actionId、Explore 请求非 proposal，或 Apply / Archive 阶段请求本轮指引入口
- **THEN** 非零退出且不分配 Run、不改交接、不回退为其他阶段；后续阶段接线维持独立范围

### Requirement: Explicit owner resolution of blocked work

系统 SHALL 仅接受显式声明 Owner、非空决策原因、当前 Run、接收角色 / actor 和模式的受限处置：handoff 未完成的 Explore / Propose 工作，或 revise 当前 rejected 的同阶段 Author。操作 MUST 依赖实际 Owner 授权，CLI 只记录声明，不认证身份。处置 SHALL 分配新 draft 并保存直接 Owner 决策，保留旧 Run / verdict；不生成批准、提交或跨阶段回退。

#### Scenario: Hand off an unfinished author action
- **WHEN** Owner 明确把当前 Author draft 或 submitted / continuing 的 Explore / Propose 工作交给不同 actor，接收角色和阶段相同
- **THEN** 新 draft 保持 actionId、阶段和已有修订对象，承接当前工作正文，保存直接来源和 Owner 原因；旧记录不变，旧 actor 对旧 draft 的保存 / 提交因陈旧而拒绝

#### Scenario: Hand off an unfinished reviewer action
- **WHEN** Owner 明确把未完成的 Review Explore / Review Propose 交给另一 Reviewer，固定完整 Author 有效且接收 actor 不同于 Author
- **THEN** 新 draft 保持 review actionId 与 authorRunRef，仅交接审核进展，不让 Author 重做；原 Review Run 和 Author 提交不变，新 Reviewer 继续独立核对后显式提交

#### Scenario: Resolve a rejected stage with a new revision
- **WHEN** 当前完整 Review verdict 为 rejected，Owner 明确要求同阶段 Author 修订，且直接 Author 输入有效
- **THEN** 新建该阶段 revise Action / draft，revisesRunRef 指向被拒绝的 Author，记录 Owner 决策；旧 rejected 原样保留，新 Author 完成后 next 指向新的独立 Review

#### Scenario: Resolution is invalid or tries to bypass review
- **WHEN** 非 Owner 声明、缺原因、当前 Run 陈旧、接收角色 / 阶段矛盾、同 actor 无需交接、Reviewer 与 Author 同 actor、输入缺失，或试图交接 complete / 用 revise 处理非 rejected / 回退其他阶段
- **THEN** 写前拒绝，原当前指针、Run 和 verdict 保持不变；普通 start / continue 不因此获得 rejected 恢复权限

#### Scenario: A resolution fails during persistence
- **WHEN** Owner 处置分配新 Run 后 manifest 提交或读回失败
- **THEN** 按既有独占写入失败边界保留现场、占号及旧记录并非零退出，不伪报接管成功、不自动关联或重试

### Requirement: Direct owner decision recorded in the receiving run

由 Owner 处置生成的 Run SHALL 保存模式、Owner 声明 actor / 原因、直接 sourceRunRef、接收角色 / actor 与阶段；这些字段 MUST 与新 Run 身份一致。普通状态查询 SHALL 校验声明结构和当前身份，但不读取来源历史正文；后续同 Action 继续保留最近决策说明，不积累决策链。正常旧 Run 无此字段 SHALL 保持可读，未知扩展不自动变成必要输入。

#### Scenario: Read the receiving draft in a new process
- **WHEN** 新进程读取 Owner handoff / revise 后的当前 Run
- **THEN** 展示接收角色、actor 和最近 Owner 决策说明，next 为当前 draft 的保存 / 提交提示，不声称 Owner 已完成 Author 工作或 Reviewer 已 approved

#### Scenario: Historical source is no longer readable
- **WHEN** 当前 Run 的 Owner 决策结构与身份有效，但 sourceRunRef 的旧正文已不可用
- **THEN** status / next 仍可读取当前 Run，不扫描历史；新的处置只验证其当前直接输入和必要固定 Author，不倒查整条决策链

### Requirement: Explore and proposal methods with independent review

阶段方法 SHALL 明确 Author Explore 的问题 / 核心 proof / 限制、Review Explore 的独立检查、Propose 的按实际 instructions / 依赖 / 项目约束形成连贯产物，以及 Review Propose 的范围与可实施性核对。Explore 分析与 proof 摘要 SHALL 保存于 Run，原始材料存 artifacts 或受控位置；不要求新建 explore.md。已有受审探索文件 MUST 保留，方法选择或工具成功不得生成批准。

#### Scenario: Complete exploration and start planning
- **WHEN** Author 已保存关键实验依据，独立 Reviewer 明确批准当前 Explore 提交
- **THEN** 后续显式 Propose 沿用当前有效结论，读取实际依赖并形成 proposal、design、delta specs、tasks，新的方案完成后停在独立 Review Propose

#### Scenario: Existing exploration files were already reviewed
- **WHEN** 已提交 Author / Reviewer 历史直接引用旧 explore.md
- **THEN** 该文件保持历史原样，不为统一规则删除 / 改写或补建其他旧文件；新分析进入新 Run，有效决策在正式方案产物收敛

#### Scenario: Tools succeed without semantic acceptance
- **WHEN** instructions 可读、proof 命令或结构验证通过，但实际产物与约束 / 关键结果不一致
- **THEN** Reviewer 按实际内容给出修改要求或拒绝，不从工具成功生成批准；实质修订另建记录，不修改旧 verdict
