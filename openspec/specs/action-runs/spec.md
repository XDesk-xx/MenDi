# action-runs Specification

## Purpose
让手动开发中的 Action、工作进展和审核对象可以被明确保存并跨进程读回，以连续编号的 Run 承接同阶段继续、完成、修订与独立角色交接。该能力提供必要的记录、方法选择和写入边界，保留历史提交，不将工具运行成功或文件齐备解释为语义完成与审核批准。

## Requirements

### Requirement: Explicit action recording

系统 SHALL 通过显式 Action 开始与继续操作组织当前 product Delivery 的已关联活动 Change，要求类型、声明角色与稳定操作者标识，返回本次 Run 和实际阶段方法。系统 MUST 拒绝人工 bootstrap 写入、不支持类型、错角色、非当前目标或不合法的当前交接；开始 / 继续只准备工作记录；显式 Archive 开始仅在当前 Review Apply 完成且 approved 时准备 Author draft，实际归档须再显式执行。

#### Scenario: Start the initial author action
- **WHEN** open product Delivery 已关联活动 Change、尚无当前 Run，Author 显式开始 explore
- **THEN** 系统保存一个 draft Run，分配 Action 身份，返回实际 Explore 方法，保留 OpenSpec 和目标已有材料

#### Scenario: Wrong role or unsupported operation
- **WHEN** 类型为 review-explore 却声明 author，或请求 review-archive / revise-archive / Delivery 操作、非当前 Change 或人工记录写入
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

系统 SHALL 在整个 Delivery 内按实际已占号 Run 目录分配递增编号，至少三位，跨 Change 连续；Changes 批次目录 MUST 不消耗额外序号；同一 open 周期的后续 Change 复用已有批次及成员，不替换批次数组。分配 MUST 使用独占写入并拒绝重复号、不安全路径与冲突。空占号目录 SHALL 保留并报告，后续不复用；编号分配 SHALL 不认证或读取全部历史提交正文。

#### Scenario: Continue across changes in a batch
- **WHEN** 同 Delivery 历史操作 / Change 已占号到 015，当前批次为 003-changes
- **THEN** 新 Run 使用 016，批次不另占号，旧 Run 位置和内容不变

#### Scenario: An interrupted reservation exists
- **WHEN** 与当前指针无关的安全 Run 目录已占号 019 但无完整 run.md
- **THEN** 新分配跳过已占号的 019，使用下一号并报告残留，不清理现场或声称 019 已完成

#### Scenario: A number is duplicated or another writer owns the lock
- **WHEN** 扫描发现同 Delivery 重复序号，或其他进程持有写入锁
- **THEN** 拒绝分配并报告冲突，原记录及他人锁保持不变

#### Scenario: Create the first run of the second change
- **WHEN** 第一项已归档、第二项明确 bind 并加入既有批次，当前关联尚无 Run，显式开始 Explore
- **THEN** 在该批次的第二 Change 目录保存新 draft，使用全 Delivery 下一占号；批次 firstRun / 旧成员、旧 Run 和归档数保持

### Requirement: Current run as direct state input

系统 SHALL 使用唯一当前 binding 的 latestRunRef（活动项优先，无活动时取追加顺序最后的 archived 项） 定位当前产品 Run，校验受管位置、Delivery / Change / Run 身份与必要头部，并由该 Run 解释 Action 进展。当前 Run 缺失、损坏或身份矛盾 MUST 报错；普通状态查询 SHALL 不解析无关历史头部、不递归读取说明引用，也不为查状态分配 Run。

#### Scenario: Read progress in a new process
- **WHEN** 新进程查询存在有效当前 Run 的 product 记录
- **THEN** 显示相同 Action、类型、角色、draft / submitted 状态和 continuing / complete 结果，引用失效的历史说明或未知 Ref 不影响该查询

#### Scenario: Required current run is unavailable
- **WHEN** latestRunRef 指向缺失、坏头部、越界位置或另一个 Change 的 Run
- **THEN** 查询失败并明确当前输入问题，不回退猜测历史最新文件或补建记录

#### Scenario: A new association has no current run
- **WHEN** 第二项为活动 binding 但没有 latestRunRef，第一项保留 archived Run
- **THEN** 返回第二项尚无当前 Run，允许按初始 Explore 显式开始；不得选择第一项、扫描最大历史编号或从工具 readiness 推断阶段

#### Scenario: Historical runs do not replace the selected input
- **WHEN** 当前必要 Run 有效，但其他 archived 项的旧 Run 或说明不可用
- **THEN** 普通查询和当前阶段操作只消费当前必要输入；旧绑定身份 / 安全定位保留，但不读取无关历史头部

#### Scenario: Current write is directed at an older change
- **WHEN** 当前已为第二项，却请求对第一项的 Action / Run 保存、提交、继续或归档
- **THEN** 按非当前 / 陈旧对象拒绝，不改旧 submitted Run、verdict 或当前指针

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

系统 SHALL 仅接受显式声明 Owner、非空决策原因、当前 Run、接收角色 / actor 和模式的受限处置：handoff 未完成的 Explore / Propose / Apply 工作，或 revise 当前 rejected 的同阶段 Author。操作 MUST 依赖实际 Owner 授权，CLI 只记录声明，不认证身份。处置 SHALL 分配新 draft 并保存直接 Owner 决策，保留旧 Run / verdict；不生成批准或提交；跨阶段回退仅按独立的显式 rollback 边界处理。

#### Scenario: Hand off an unfinished author action
- **WHEN** Owner 明确把当前 Author draft 或 submitted / continuing 的 Explore / Propose / Apply 工作交给不同 actor，接收角色和阶段相同
- **THEN** 新 draft 保持 actionId、阶段和已有修订对象，承接当前工作正文，保存直接来源和 Owner 原因；旧记录不变，旧 actor 对旧 draft 的保存 / 提交因陈旧而拒绝

#### Scenario: Hand off an unfinished reviewer action
- **WHEN** Owner 明确把未完成的 Review Explore / Review Propose / Review Apply 交给另一 Reviewer，固定完整 Author 有效且接收 actor 不同于 Author
- **THEN** 新 draft 保持 review actionId 与 authorRunRef，仅交接审核进展，不让 Author 重做；原 Review Run 和 Author 提交不变，新 Reviewer 继续独立核对后显式提交

#### Scenario: Resolve a rejected stage with a new revision
- **WHEN** 当前完整 Review verdict 为 rejected，Owner 明确要求同阶段 Author 修订，且直接 Author 输入有效
- **THEN** 新建该阶段 revise Action / draft，revisesRunRef 指向被拒绝的 Author，记录 Owner 决策；旧 rejected 原样保留，新 Author 完成后 next 指向新的独立 Review

#### Scenario: Resolution is invalid or tries to bypass review
- **WHEN** 非 Owner 声明、缺原因、当前 Run 陈旧、接收角色 / 阶段矛盾、同 actor 无需交接、Reviewer 与 Author 同 actor、输入缺失，或试图交接 complete / 用 revise 处理非 rejected / 用普通 revise 回退其他阶段
- **THEN** 写前拒绝，原当前指针、Run 和 verdict 保持不变；普通 start / continue 不因此获得 rejected 恢复权限

#### Scenario: A resolution fails during persistence
- **WHEN** Owner 处置分配新 Run 后 manifest 提交或读回失败
- **THEN** 按既有独占写入失败边界保留现场、占号及旧记录并非零退出，不伪报接管成功、不自动关联或重试

### Requirement: Direct owner decision recorded in the receiving run

由 Owner 处置生成的 Run SHALL 保存handoff / revise / rollback 模式、Owner 声明 actor / 原因、直接 sourceRunRef、接收角色 / actor 与目标阶段；这些字段 MUST 与新 Run 身份一致。普通状态查询 SHALL 校验声明结构和当前身份，但不读取来源历史正文；后续同 Action 继续保留最近决策说明，不积累决策链。正常旧 Run 无此字段 SHALL 保持可读，未知扩展不自动变成必要输入。

#### Scenario: Read the receiving draft in a new process
- **WHEN** 新进程读取 Owner handoff / revise / rollback 后的当前 Run
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

### Requirement: Stage-scoped operation instructions

系统 SHALL 为当前 Apply / Review Apply / Revise Apply 和 Archive 提供显式只读 operation 指引，分别采用真实 Apply / Archive 协议。请求 MUST 对应当前 actionId 与操作阶段，且不能同时指定 artifact。系统 SHALL 保留工具返回的状态与 context / operationGuidance，不代写任务、执行归档或生成批准；受限 artifact 入口保持既有行为。

#### Scenario: Read apply guidance for the current implementation action
- **WHEN** 当前 Apply 阶段请求 operation=apply，上游提供具体 contextFiles、tasks、progress、state 和操作指导
- **THEN** 返回实际输入与完成 / 缺失状态，当前 Run 与交接不变；blocked 或 all_done 不被转换成实施或审核结论

#### Scenario: Read archive guidance without inventing artifact fields
- **WHEN** 当前 Archive 请求 operation=archive，活动 Change 尚可读取
- **THEN** 返回当前目标的实际 context / operationGuidance，schema 从必要状态核对，不要求上游没有返回的 template 或 schemaName

#### Scenario: Operation selection is stale or inconsistent
- **WHEN** Action ID 陈旧、operation 与阶段不同、artifact / operation 同时提供或必要上游输入不可用
- **THEN** 写前拒绝，不能退回其他阶段或把保存的旧指引表述为本次真实上游读取

### Requirement: Explicit earlier phase rollback

系统 SHALL 仅在实际 Owner 明确请求 rollback 时，接受 Propose / Apply 及其 Review / revise 工作退回较早 Explore / Propose，或未执行 / 已证实无原生效果的 Archive 准备工作退回 Apply / Propose / Explore。输入 MUST 指定当前 Run、目标阶段、同 Change 已完成目标 Author、接收 Author 与原因。系统 SHALL 新建目标阶段 revise draft，不改旧 Run、verdict、产物或实现；新提交 MUST 重新审核并按顺序继续。

#### Scenario: Return from apply to a completed proposal author
- **WHEN** Owner 对当前 Apply 或 Review Apply 显式指定较早 Propose Author 请求 rollback
- **THEN** 新建 revise-propose draft，直接修订对象为指定 Author，决策来源为原当前 Run；完成后推荐新 Review Propose，过去 approved 不允许直接进入 Apply

#### Scenario: Return to exploration without erasing implementation
- **WHEN** Owner 对当前 Propose / Apply 工作指定较早 Explore Author 请求 rollback
- **THEN** 新建 revise-explore，重新经过 Review Explore / Propose / Review Propose 后才可 Apply；旧产物与已写实现保留，必要调整由新工作说明

#### Scenario: Rollback input is unsafe or does not point backwards
- **WHEN** 非 Owner、缺原因、当前对象陈旧、目标未完成 / 非 Author / 错 Change / 越界、目标不是更早阶段，或归档效果已发生 / 未知 / 当前调用仍在进行
- **THEN** 写前拒绝且原记录不变，不猜目标历史或重开已归档 Change

#### Scenario: Rollback persistence is interrupted
- **WHEN** 新修订 Run 已创建，但当前指针替换或读回失败
- **THEN** 非零退出并保留占号、锁与真实现场，不覆盖旧审核或把新工作伪报为已提交

#### Scenario: Abandon an archive that has no native effect
- **WHEN** Owner 对 prepared 或已保存 none 且现场再次证实无效果的当前 Archive draft，显式指定较早完整 Author 请求 rollback
- **THEN** 保留 Archive 尝试与错误，恢复普通活动 binding 并新建目标 revise draft；仍是 invoking 时须先显式 finish 观察保存 none，rollback 不代做重新分类；旧 approved 不再作为当前交接，后续必须重新审核，不直接复活旧 Review

### Requirement: Approved native archive execution

系统 SHALL 将 Archive 作为 Author Action，要求当前完成且 approved 的 Review Apply、它固定的完整 Author、真实 Apply all_done 及有效操作输入。准备 MUST 不执行归档；实际执行 SHALL 再复核直接对象和安全位置，只调用固定 OpenSpec 的原生同步归档路径一次，不由 Skill 重复同步。任务全勾、工具成功或历史批准 MUST 不代替当前独立批准。

#### Scenario: Prepare and explicitly execute an approved archive
- **WHEN** 当前 Review Apply approved，直接 Author 有效、任务完成，Author 先准备 Archive 再显式执行
- **THEN** 准备返回实际 Archive 方法和 draft；执行记录当前必要输入与尝试，实际调用原生 Archive 并读回结果，不自动执行 Git 或 Delivery 收口

#### Scenario: Tasks or the current review are not sufficient
- **WHEN** 任务仍未勾、Apply blocked、固定 Author 不可用、当前审核不是 approved，或修订之后仍试图引用过去批准
- **THEN** 在原生调用前拒绝，计数与规格不变，不用 --yes 绕过产品前置

#### Scenario: A native call reports failure
- **WHEN** 原生归档非零退出、超时或返回不可用的机器结果
- **THEN** 保存实际响应与失败，不据退出码推断没有效果；观察活动 / 归档目录及受影响规格后分别报告无效果、已确认效果或未知

#### Scenario: An attempt directory was reserved before its run marker committed
- **WHEN** prepared 首次执行或 none 重试已创建当前 Run 的 attempt 目录，invoking 标记提交前中断，原写者停止且锁按既有授权处置，另一次显式 execute 的必要前置仍成立
- **THEN** 仅根据当前 Run 的持久尝试号和规范占号安全分配新 attempt，保留旧目录 / 输入字节；不把占号当成原生调用或完成，不覆盖、自动重试或要求无关回退

#### Scenario: A second executor races with the first
- **WHEN** 两个进程对同一准备记录执行 Archive，或必要输入在写前变化
- **THEN** 独占锁与当前对象复核拒绝第二写者或变化输入，不发生两次原生效果、不删除原锁

### Requirement: Observed archive effects and bounded finish

系统 SHALL 保存本次 Archive 的直接意图、调用状态和必要原始结果。显式 local-only finish MUST 只观察当前 attempt 并有限更新 / 收口，不调用原生。中断后 invoking SHALL 仅在原写者停止、锁按授权处置且完整现场证明确无效果时，锁内保存 none 并返回未完成；不增加计数、生成完成或自动重试 / 回退。已发生效果 MUST 不重复同步或降为 none；未知、冲突或证据不足 MUST 停止。重试仅在另一次显式 execute 再核对无效果、批准及输入后进行。

#### Scenario: Native success is followed by local failure
- **WHEN** 原生已经同步并移走 Change，编号改名、计数 / Run / manifest 提交或最终读回失败
- **THEN** 非零退出并保留实际材料和当前尝试；新的显式 finish 只补本地收口，不重复原生调用或同步

#### Scenario: Native archive retires the last requirement of a capability
- **WHEN** 本次元数据明确 retire_capabilities: true，完整 REMOVED 输入删除调用前全部需求且不产生其他需求，原生移走 Change 并删除对应主规格
- **THEN** 在源 / 归档元数据与直接输入一致后，将该缺失主规格解释为预期退役效果，execute 或新进程 local-only finish 可完成并支持 repeated finish；未声明、仍有需求、输入或元数据冲突的缺失仍拒绝

#### Scenario: The native result was lost but the effect is observable
- **WHEN** 调用标记已保存但响应未完整保存，当前同一 Change 的唯一原生或编号目录、元数据与受影响规格符合本次输入
- **THEN** finish 可基于读回确认原生效果，保存确认依据并继续本地收口，不从旧预定日期猜目录或重新执行原生 Archive

#### Scenario: A failure is proved to have no effect
- **WHEN** 当前 draft 已保存 none，并再次确认活动输入与受影响主规格保持调用前内容、未出现本次归档目录，当前批准和任务重新有效，用户另一次显式 execute
- **THEN** 保存旧错误并建立新尝试后才可原生调用，未完成的 finish 不会发起该调用；计数在实际成功前不增加

#### Scenario: Invoking was saved before the native process started
- **WHEN** 完整 attempt 输入与 invoking 标记已落盘、原生启动前中断，Owner 已核对原写者及可能启动的原生进程停止并按既有授权处置锁，新进程显式 finish 在锁内确认活动源元数据 / delta 与受影响主规格未变、无本次归档候选且计数仍为基准
- **THEN** 保留原调用标记、输入和错误，只新增本次观察并将当前 draft 观察阶段保存为 none，完整读回后返回 observed-none / pending；原生调用次数、计数、正文、binding 与 Run 编号不变；next 提示另一次显式 execute，或由 Owner 单独 rollback，不自动执行二者

#### Scenario: Native no-effect exit was not classified before interruption
- **WHEN** 原生已经无效果结束但 none 尚未保存即中断，持久记录仍 invoking；原写者停止、锁已按授权处置，新进程显式 finish 依完整调用前输入与实际现场在锁内证明确无效果
- **THEN** 保存本次观察和 none，保留已有 attempt / 错误并返回未完成，不再次启动原生或增长计数；后续另一次显式 execute 须重新校验批准 / 任务 / 输入，显式 Owner rollback 须重新校验直接目标 / 无效果，两个出口各自可达

#### Scenario: Observation cannot downgrade an effect or bypass uncertain writers
- **WHEN** finish 观察已有原生效果 / confirmed，或必要输入缺失 / 改变、候选或计数冲突、原写者活跃 / unknown，或本次观察提交 / 读回失败
- **THEN** 已有实际效果只能确认或收口，不能保存 none；证据不足或写者未停止则不重新分类并停止，观察提交失败非零退出保留锁与实际现场，不伪报 observed-none 或完成；已有 invoking 的新 execute / rollback 不能绕过 finish

#### Scenario: The scene is uncertain or changed
- **WHEN** 活动与归档同时存在、候选目录不唯一、路径 / 身份不符、规格或批准变化、计数冲突、输入证据缺失或仍有锁
- **THEN** 保留错误并停止，不补目录、改历史、强制同步、覆盖目标、抢锁或提供通用恢复

#### Scenario: Finish is repeated after a completed archive
- **WHEN** 指定的是已经完整收口的同一 Archive，当前计数、编号 binding 与最终 Run 一致
- **THEN** 返回 already-completed 的本地读回，原生调用次数、归档数、Run 编号和正文均不变

### Requirement: Archive draft and terminal submission

Archive Run SHALL 保存直接 Review / Author 与本次归档必要信息，执行前及尚未确认原生效果时为 draft；仅 execute / finish 在确认效果后可写 submitted / complete、result=archived。系统 MUST 在计数、Run 与 binding 完整读回后才报告归档完成，终态 Run 已写而交接未完仍是待收口。普通 save SHALL 只保存当前同 actor / role 的故障笔记；普通 submit、continue 或 review / revise-archive MUST 不生成完成。完成 Run MUST 保持不可改写，有限收口不能制造新 Reviewer verdict。

#### Scenario: Save notes without certifying external effects
- **WHEN** 当前 Archive draft 的原 Author 显式保存工作或错误说明
- **THEN** 仅保存本地正文，不访问上游、不修改归档尝试信息或设置 archived；活动目录已移走时只按合法当前归档过渡态检查

#### Scenario: A generic submission attempts to skip execution
- **WHEN** 用户对 Archive 使用普通 run submit、action continue 或不支持的 review / revise 类型
- **THEN** 操作拒绝，不因调用者填写结果而标记完成或增加计数

#### Scenario: Terminal archive run was written before the binding committed
- **WHEN** Archive submitted / complete 已落盘，随后 manifest 更新失败
- **THEN** 查询仍报告过渡态；显式 finish 核对已完成 Run 并只补剩余本地交接，不改该完成正文或重复原生归档

### Requirement: Review apply maintainability observations

Review Apply 方法 SHALL 报告 src / tests / scripts 中维护代码物理行数最多的前三名、不足三个全部列出，并说明当前明显增长 / 职责混杂及维护结论。无可靠历史基准 MUST 不补造增长。观察 SHALL 只进入当次审核摘要，不建立硬行数门槛、独立台账、hash 清单或产品查询依赖；本轮继续扩展的混杂职责须先整理再扩展。

#### Scenario: A mixed responsibility file will grow in the current change
- **WHEN** 当前修改继续增加一个已经混合操作、指引和处置职责的文件
- **THEN** Author 按受审任务先整理实际职责，Reviewer 核对整理 / 覆盖和增长，不能只留给下次处理或为压行数增加转发层

#### Scenario: A bounded historical experiment is retained
- **WHEN** 已受审旧 proof 不再扩展，新产品验收进入独立测试，当前仍有较长完整流程
- **THEN** 保留旧材料与结果，并说明适用范围及下次整理触发条件，不仅因行数要求重写历史或重跑全部旧实验
