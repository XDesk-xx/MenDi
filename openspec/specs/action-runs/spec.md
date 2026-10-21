# action-runs Specification

## Purpose
让手动开发中的 Action、工作进展和审核对象可以被明确保存并跨进程读回，以连续编号的 Run 承接同阶段继续、完成、修订与独立角色交接。该能力提供必要的记录、方法选择和写入边界，保留历史提交，不将工具运行成功或文件齐备解释为语义完成与审核批准。

## Requirements

### Requirement: Explicit action recording

系统 SHALL 通过显式 Change Action 开始与继续操作组织当前 product Delivery 的已关联活动 Change，要求类型、声明角色与稳定操作者标识，返回本次 Run 和实际阶段方法。系统 MUST 拒绝人工 bootstrap 写入、不支持类型、错角色、非当前目标或不合法交接；开始 / 继续只准备工作记录；Archive 开始仅在当前 Review Apply 完成且 approved 时准备 Author draft，实际归档须再显式执行。Delivery 范围操作 SHALL 使用其独立显式命令和相应记录，不借 Change start 绕过前置。

#### Scenario: Start the initial author action
- **WHEN** open product Delivery 已关联活动 Change、尚无当前 Run，Author 显式开始 explore
- **THEN** 系统保存一个 draft Run，分配 Action 身份，返回实际 Explore 方法，保留 OpenSpec 和目标已有材料

#### Scenario: Wrong role or unsupported operation
- **WHEN** 类型为 review-explore 却声明 author，或在 Change start 请求 review-archive / revise-archive / Delivery 操作、非当前 Change 或人工记录写入
- **THEN** 操作在业务写入前拒绝，指出类型、角色、目标或格式问题，不代签批准或迁移历史

### Requirement: Stage skill and requested guidance

系统 SHALL 按 Action 类型和角色从安装包选择固定产品阶段 Skill，修订使用相应 Author 方法；可选工具指导 SHALL 仅按明确请求读取。Change 新交接还 MUST 读取该阶段实际必需的当前目标 OpenSpec 方法，不受可选指导选择影响。开始 / 继续时 MUST 返回实际文件位置与内容，必要方法缺失、不可读或身份不符时写入前失败。Storybook 选择 SHALL 持久读回，未选择时不读取。方法交接不表示执行、完成或批准，不自动安装 / 启动工具或认证能力。

#### Scenario: Author and reviewer use different methods
- **WHEN** 用户分别开始 explore 与 review-explore，并明确请求 openspec 工具指导
- **THEN** 返回各自角色对应的产品阶段 Skill 及实际 OpenSpec 指导，Run 保存所选自有方法标识；Author 另取得目标 Explore 方法，Reviewer 不使用 Author 方法代替独立检查

#### Scenario: Required method is missing
- **WHEN** 当前操作选择的阶段 Skill、明确请求的工具指导或阶段必需的目标方法不存在、不可读或身份不符
- **THEN** 操作失败且未分配新 Run；普通 status / next 不因不读取的方法文件失效而失败

#### Scenario: Explicitly select Storybook guidance
- **WHEN** Change Action 明确选择 Storybook 工具指导，所需方法有效
- **THEN** 返回固定角色阶段方法、Storybook 指导及该阶段实际需要的目标方法的文件 / 内容，Apply 仍取得目标 Apply 方法；Run 持久保存指导选择，继续与读回保持一致，不因此执行 CLI、启动服务或给出审核批准

#### Scenario: Existing runs and unselected guidance remain usable
- **WHEN** 旧 Run 的指导为空或 openspec，或当前操作未选择 Storybook 且其指导文件不存在
- **THEN** 读取对应必要方法及旧 Run，不强制补字段 / 文件；未使用的 Storybook 或 MCP 不成为查询依赖

#### Scenario: Reject invalid guidance before writing
- **WHEN** 请求未知 / 重复的指导或所选 Storybook 指导的身份与正文无效
- **THEN** 在分配 Run / 更新交接前拒绝，并保留旧记录及 verdict，不放宽受管路径和角色检查

### Requirement: Delivery-wide run allocation

系统 SHALL 在整个 Delivery 的实际占号 Run 目录中递增分配，至少三位，跨 Change / Close / Reopen 连续；新 Delivery 独立从 001 开始。Changes 批次不额外占号，同一工作批次复用成员；Reopen 后首次实际 Change Run 才追加新批次并设置当前选择，不能替换旧批次数组。分配 MUST 独占、拒绝重复号 / 不安全路径 / 冲突，保留空占号，不读取全部历史正文认证编号。

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

#### Scenario: First change run after a reopen
- **WHEN** 原 Delivery Run 已占号到 017-delivery-reopen，当前批次为空且新范围 Change 已明确 bind
- **THEN** 首次 Run 为 018，建立 018-changes/<change-id>/018-explore，不产生批次 run.md，不改旧批次或再为批次占号

### Requirement: Current run as direct state input

Change scope 进展 SHALL 使用唯一当前 binding 的 latestRunRef（活动项优先，无活动时取追加顺序最后的 archived 项） 定位当前产品 Run，校验受管位置、Delivery / Change / Run 身份与必要头部，并由该 Run 解释 Action 进展。当前 Run 缺失、损坏或身份矛盾 MUST 报错；Delivery scope 进展按其显式当前指针读取，不以 archived binding 替代；普通状态查询 SHALL 不解析无关历史头部、不递归读取说明引用，也不为查状态分配 Run。

#### Scenario: Read progress in a new process
- **WHEN** 新进程查询存在有效当前 Run 的 product 记录
- **THEN** 显示相同 Action、类型、角色、draft / submitted 状态和 continuing / complete 结果，引用失效的历史说明或未知 Ref 不影响该查询

#### Scenario: Required current run is unavailable
- **WHEN** 无当前 Delivery 操作，latestRunRef 指向缺失、坏头部、越界位置或另一个 Change 的 Run
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

#### Scenario: Current delivery run is not the archived change run
- **WHEN** 当前 open Delivery 无活动 Change、其当前修复/Reviewer Run 由 deliveryRunRef 指向，同时最近归档 Change 仍保留 latestRunRef
- **THEN** 本次 supplement/amend 资格以本轮实际 deliveryRunRef 与共享 Run 占号为准，不得误用 archived binding 或下一个 Run 的 draft 前驱

### Requirement: Draft save and immutable submission

系统 SHALL 只允许当前 product draft 的同角色 / actor 保存正文，使用明确根、本地配置、当前必要对象及安全写入；保存不读上游、方法或固定 Author 正文。正式阶段提交校验非空结果 / outcome 与必要 Author / verdict，Change submit 保留上游。Full Test 与生命周期完成 MUST 由专用执行 / 提交产生，普通 submit / continue 禁止伪造。旧 submitted Run 不可保存 / 重提，失败保留现场。

#### Scenario: Save a draft and submit progress
- **WHEN** 当前 draft 的原操作者保存 Markdown 工作记录，再以 continuing 提交
- **THEN** Run 在跨进程读回时为 submitted / continuing，正文和结果真实保留，Action 仍未完成

#### Scenario: A submitted or stale run is edited
- **WHEN** 对已提交 Run 保存 / 重提，或操作引用已不是当前 draft 的 Run
- **THEN** 系统拒绝写入，不改旧正文、结果或交接

#### Scenario: Save a failure note while the selected tool is unavailable
- **WHEN** 上游 status 失败或固定入口不可用，但本地配置、当前活动 Change 路径及同 actor / role 的 draft 和正文有效
- **THEN** 保存并读回 draft 正文，仍为未提交；结果明确 local-only，不执行上游，不认为阶段完成，正式 Change submit 仍因上游失败而拒绝

#### Scenario: A local save has invalid required input
- **WHEN** 本地配置、所需当前 Change / Delivery 记录、Run 或正文缺失 / 损坏，actor / role 不匹配，受管路径不安全或存在写入锁
- **THEN** 保存失败并说明实际输入，不回退旧 Run 或其他项目，不覆盖正文、不清理锁、不因上游检查放宽而绕过本地边界

#### Scenario: Reviewer saves notes without the fixed author file
- **WHEN** 当前 Reviewer draft 有效但固定 Author 正文缺失
- **THEN** 可仅保存 Reviewer draft 的故障说明；正式 Review continue / submit 仍要求固定完整 Author，不生成 verdict 或批准

#### Scenario: Draft replacement committed before readback failed
- **WHEN** 保存 draft 已 rename 替换正式文件，随后读回失败
- **THEN** 非零退出并保留实际新正文、锁和错误，不为维持失败前字节而回滚，不重提，不改任何旧 submitted Run

#### Scenario: Save a delivery repair or review draft
- **WHEN** 无活动 Change，当前 Delivery 修复 / 定向 Review draft 与角色、actor、本地必要输入一致
- **THEN** 正常保存正文；对应正式提交按 Delivery 范围与固定 Author 核对，不调用已归档 Change 的上游 status

#### Scenario: Generic submit tries to certify a full test
- **WHEN** 对 delivery-full-test 使用普通 run submit 或 action continue 生成通过 / 重试
- **THEN** 操作拒绝，正式结果只能由明确执行和完整读回生成；其当前 draft 的同 Author 可保存故障说明，但不能改执行事实

#### Scenario: Generic operations target a lifecycle run
- **WHEN** 对 Open / Close / Reopen draft 或 terminal 使用普通 run submit / action continue 生成收口或重开
- **THEN** 拒绝；当前同角色 / actor 的 draft 可本地保存故障笔记，不改生命周期输入、提交相位或宣称状态成功

#### Scenario: Special post-submission commands do not weaken draft-only save
- **WHEN** 当前有被单独授权的最新 submitted Run 需要 supplement 或有限 amend
- **THEN** 只能走专用提交后受控入口、读取其已确认附属事实；普通 run save/submit/continue 仍拒绝重写已提交 Run，不能修改原 verdict、关联或编号

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

#### Scenario: Current review cites one canonical proof source
- **WHEN** 独立 Reviewer 核对某实际受控 Proof，其原日志或唯一必要输入已保存在可定位的当前 Run，且同一结果被多份摘要使用
- **THEN** 审核摘要保留真实来源与可验证结果而不强制为同一事实再复制整套成功日志或 fixture；仍必须说明代码增长和本次失败事实

### Requirement: Delivery operation runs beside change batches

Delivery 操作 SHALL 在 runs/<delivery-id>/<序号>-<操作名称>/run.md 与 Changes 批次同级，共享连续编号，明确 delivery scope、类型 / 方法、Author / actor 和 draft / submitted。新增记录化 Open 保存 001-delivery-open，Close / Reopen 继续原号；旧首次 Open 未记录 Run 的格式保持可读，不补历史。当前进展与最近正式结果指针 MUST 各按实际用途选择，生命周期提交只更新本次直接对象。

#### Scenario: Full test follows multiple archived changes
- **WHEN** 同 Delivery 两项已归档、已有 Run 最大占号为 014，Author 显式执行新的完整 `groups-v1` 正式 Full Test
- **THEN** 本次 Run 为 `015-delivery-test-attempt`（015 仅为该占号示例，实际编号取当前 Delivery 的下一可用序号），与 Changes 批次同级；Change、批次、Archive 编号和旧文件保持；`delivery-full-test` 仅作为已提交旧 command Run 类型只读兼容，不再由新正式执行创建

#### Scenario: Continue a targeted delivery review
- **WHEN** 定向 Review 已 submitted / continuing，原 Reviewer 显式继续
- **THEN** 新 draft 使用下一号、相同 actionId 与固定 Author；旧 Run 不变，不为每项验证单独分配 Run

#### Scenario: Reservation or identity is inconsistent
- **WHEN** 发现重复 / 非规范序号、错 Delivery / 角色 / 方法、越界路径或另一写者
- **THEN** 拒绝并保留已有占号 / 锁，不复用空占号或覆盖旧记录

#### Scenario: Close and reopen preserve separate operation runs
- **WHEN** 正式结果为 015，随后显式 Close、Reopen 和新 Change 开始
- **THEN** 在无其他占号时保存 016-delivery-close、017-delivery-reopen 和 018-changes 中的新 Run；旧正式 / Close 不改，新 Open 在独立 Delivery 使用 001

#### Scenario: Append plan uses an independent typed delivery operation
- **WHEN** Owner 已授权当前轮范围追加，Author 真实提交计划新增
- **THEN** 分配一个实际的 Delivery 编号并保存独立 typed receipt，不占用批次编号、不改变既有 Change 的 Run 编号或提交结果

### Requirement: Current delivery progress and minimal handoff

Delivery 进展 SHALL 由显式当前指针读取，不倒查失败 / 修订链。实质修复与独立 Review 沿用原交接；新 groups-v1 完整正式 Run 自身 passed 即待 Owner 另行授权收口，不增加例行 verification 或 owner-decision。已知普通环境问题按核实事实进行新完整执行，不生成空 Repair/Review Runs。closed 当前选择 Close；Reopen / Open 完成后提示范围内显式 bind，退出旧 PASS 的当前适用选择但保留最近正式入口。待提交生命周期写入与 unknown MUST 停 Owner 核对 / 显式有限继续。next 只包含当前必要入口，不自动执行或累积旧 Close / 审核链。

#### Scenario: Repair completes and reviewer continues
- **WHEN** Author 修复 complete，随后独立 Review 开始并提交 continuing
- **THEN** next 只携带当前 Author 或当前 Review 的实际必要入口，角色正确；Review continue 保留原固定 Author，查询不追读其正文

#### Scenario: Revision replaces the current approval entry
- **WHEN** 当前完成 Author 或当前 Review 固定的 Author 被显式范围内修订
- **THEN** 新修订记录替换当前交接入口，旧 approved 不允许直接进入新正式执行；旧 verdict 和正文保持

#### Scenario: A source link is unavailable during query
- **WHEN** 当前修复 / Reviewer 头部有效，旧 sourceFullTestRunRef、revisesRunRef 或说明链接不可用
- **THEN** 普通查询不递归读取；开始 / 继续 / 提交只另核对该操作实际需要的直接输入，不能自动由查询成功生成批准

#### Scenario: Full test observation cannot confirm the saved result
- **WHEN** 当前正式记录保存 passed，但本次必要结果的观察未确认
- **THEN** next 使用本次 unknown 观察停 Owner，与 verification 一致，不只按持久头部提示通过；不改写旧 Run

#### Scenario: Reopen or new open is current without a formal result
- **WHEN** 当前 Run 为完成的 Reopen 或记录化新 Open，尚无本轮正式结果
- **THEN** 不要求这些 Run 携带 fullTest 或 repair；Reopen 保留 fullTestRunRef 作历史，新 Open 没有它，均不展示本轮验收通过

#### Scenario: Current close is retained without execution revalidation
- **WHEN** 当前 Delivery 为完整 closed，Close 头部 / 摘要与 manifest 一致
- **THEN** query 展示持久收口事实与等待 Owner 提示，只引用其正式入口供显式查询；不递归检查旧测试 / 审核正文，也不重新认证受测材料

#### Scenario: New complete formal pass needs no aggregation
- **WHEN** 当前新正式 Full Test Run 自身稳定 passed 且当前范围有效
- **THEN** next 提示 Owner 决定是否单独授权 Close，不要求创建 verification Run、也不要求对 PASS 作额外 owner-decision

#### Scenario: Failure repair versus confirmed environment retry
- **WHEN** 当前必需组明确业务失败或测试合同需实变，或仅有已确认环境准备阻断且现场已安全恢复
- **THEN** 前者 next 指向 delivery-repair 并等待独立 review-delivery-repair，后者可直接提示新完整正式执行，保留旧失败记录

#### Scenario: Unknown runtime must not appear passed
- **WHEN** 实际执行、清理或持久提交未确认，或新读回与本次保存不一致
- **THEN** next 停 Owner 核查本次现场，不回退历史 verified 或自动解锁、重试

### Requirement: Delivery methods and direct review input

正式执行、修复、定向 Review、记录化 Open、Close / Reopen SHALL 使用各自实际方法。缺失 / 不匹配方法阻止消费它的开始 / 继续，不阻止只读查询。修复 Review 仍固定完整同 Delivery Author，拒绝陈旧 / 明显自签；生命周期方法要求实际 Owner 边界与 Close 材料判断，不用工具成功或 actor 代签批准。

#### Scenario: Read the relevant method without upstream change activity
- **WHEN** Author 开始 delivery-repair，或 Reviewer 开始 review-delivery-repair
- **THEN** 返回相应方法与直接输入；不伪装活动 Change 或请求旧 Change 的 Apply / Archive 指引

#### Scenario: A method or required author is unavailable
- **WHEN** 相应开始 / 继续所需方法不可用，或 Review 正式操作所需固定 Author 不可读
- **THEN** 对应操作拒绝且不产生有效批准 / 新交接；本地故障说明和普通查询按自己的必要输入解释

#### Scenario: Lifecycle guidance keeps operation authority separate
- **WHEN** Author 读取 Open / Close / Reopen 方法并显式执行该操作
- **THEN** 方法说明直接输入、材料 / 范围判断、实际结果及停止边界；不自动安装、创建 Reviewer verdict 或推进另一授权操作

### Requirement: Target-local upstream method source

系统 SHALL 从显式当前目标根下的 `.agents/skills/openspec-*/SKILL.md` 读取所需官方方法，核对方法名称、非空正文与 `metadata.generatedBy: "1.14.1"`。`metadata.version` MUST 不被当成 CLI 版本，生成标记不证明正文未修改。系统 MUST 拒绝经 symlink / junction 越出目标的来源，不回退开发仓库、其他目标、共享目录、PATH 或最新版本。安装根只提供 MenDi 自有方法，外部 OpenSpec 入口仍按既有约定选定。

#### Scenario: Installed package operates on two targets from another cwd
- **WHEN** 从开发仓库外的真实安装在另一 cwd 显式选择 alpha 或 beta，两个目标各自具有适配方法
- **THEN** 自有方法来自该安装，官方方法来自被选目标；返回正文与实际来源，目标 Run / 产物只写入被选目标，未选目标与安装根不接收目标产物

#### Scenario: Metadata identifies the supported generation baseline
- **WHEN** 方法名称正确、正文非空，metadata.version 为 1.0 且 generatedBy 为 1.14.1
- **THEN** 接受当前生成基线；generatedBy 缺失 / 不符、错名称、空正文或不可读则明确失败，报告具体方法和实际问题，不自动准备或切换来源

#### Scenario: A method resolves outside the target
- **WHEN** 必需方法或其父目录通过 symlink / junction 指向目标根外
- **THEN** 按不安全来源拒绝，不读取外部正文或创建新交接，不把同名前缀目录误判为目标内部

### Requirement: Current method handoff without historical migration

Change start / continue、Owner resolve 实际创建的接收交接及 Archive 准备 SHALL 在分配 Run / 写入交接前检查其阶段必需方法，返回标识、目标根、目标内引用、实际文件、生成基线及真实内容，供宿主按当前 Change 使用。缺项 MUST 保留既有有效 Run、状态及 verdict。普通查询、历史读取、本地保存、提交、诊断与 Archive 本地 finish MUST 不新增方法前置。旧 Run 不增加必填字段或批量补写，继续时按当前目标重新读取方法。

#### Scenario: Continue fails while the existing submission remains usable
- **WHEN** 当前 submitted / continuing Author Run 有效，但本阶段目标方法后来缺失、不可读、错身份或错基线
- **THEN** continue 在新占号前失败，原 Run / manifest 保持，普通查询与合法本地说明操作仍按各自必要输入处理；恢复方法后新进程可显式继续并取得当前正文

#### Scenario: Owner handoff cannot bypass required methods
- **WHEN** 合法 Owner resolve 将工作交给需要目标方法的 Author，但该方法不可用
- **THEN** 在接收 Run / 当前指针写入前拒绝，原直接对象与 Owner 边界保持；Reviewer 接收交接不因此新增 Author 方法前置

#### Scenario: Unrelated files and old optional fields are absent
- **WHEN** 当前必要输入有效，未使用的 sync / Storybook 方法缺失，旧 Run 没有上游方法字段，历史说明链接失效或未知 Ref 指向不存在文件
- **THEN** 当前方法交接及只读查询不递归检查这些来源，不补写旧 Run；身份、角色、必要当前输入、路径与冲突检查仍生效

### Requirement: Stage-specific upstream method composition

Author Explore / revise-explore SHALL 使用目标 openspec-explore；首次 Propose 使用 openspec-propose 的已有 Change 产物工作片段与真实 artifact instructions；revise-propose 使用 openspec-update-change 的适用修订规则；Apply / revise-apply 使用 openspec-apply-change 与真实 Apply instructions；Archive 准备使用 openspec-archive-change，保留既有原生一次同步路径。Review SHALL 使用自有独立方法，Delivery 操作不强制加载 Change 上游方法。

#### Scenario: First proposal retains the already bound change
- **WHEN** 当前 Change 已绑定但正式规划产物缺失，Author 开始或继续首次 Propose
- **THEN** 宿主取得目标 propose 正文，按实际 instructions、依赖及 context / rules 编写该 Change 产物，跳过另建 Change，不以 update-change 替代首次创建；list 不增加另一个 Change，任务不自动勾选

#### Scenario: Revision applies only the relevant update rules
- **WHEN** 正式 Propose 提交后的实质修订使用目标 update-change 方法
- **THEN** 围绕已有产物和适用 glob 新增规则协调修订，不把该方法解释为通用缺失产物生成；新修订另留记录并停独立 Review Propose，旧 verdict 保持

#### Scenario: Review and archive keep their responsibilities
- **WHEN** Reviewer 审核固定 Author，或 Author 在当前批准之后准备并另行授权执行 Archive
- **THEN** Review 不执行 Author 写入流程；Archive 指引不先同步再调用原生重复同步，本地 finish 不重新加载方法或执行原生，保留既有批准、任务与效果读回边界

#### Scenario: Methods inform actual work without certifying it
- **WHEN** 方法内容与动态 instructions 已返回或 OpenSpec 状态显示 ready / all_done
- **THEN** 宿主仍须按实际产物、调用和证据完成阶段工作，返回内容不产生完成或批准；未使用的 MCP、未验证宿主 / 平台和未来升级机制不成为本轮前置

### Requirement: Business contracts and iterative UI decisions

自有阶段方法 SHALL 区分稳定业务承诺、当前 UI 设计与未决产品决定。Explore 识别约束和候选，Propose 将业务承诺写入 specs、当前设计写入 design，并使 tasks / 验证对应实际用户结果。普通 UI 调整 MUST 不要求新建 Change；旧名称 / 路径的词面差异不得机械判为业务变化。角色权限、正确对象、数据完整性、状态与保存 / 发布 / 确认条件、历史及失败处理，以及 Owner 明确具有验收意义的 UI 要求，MUST 不被直接降格。

#### Scenario: Ordinary UI organization changes without a new change
- **WHEN** 菜单改位 / 改名、页面合并或分页改滚动，实际业务承诺与必要可达性仍成立
- **THEN** 方法指导在正常 UI 工作中更新设计和受影响测试，不因此新建 Change / Action，不因旧规格提及原名称或页面数量机械否决

#### Scenario: A label change affects the meaning of confirmation
- **WHEN** “保存草稿”改为“发布”等变化可能改变用户理解，或存在 Owner 明确的 UI 验收要求
- **THEN** 核对真实结果、确认语义及已有决定，未决取舍先问 Owner；不因 handler 未改或属于文案就认定等价，也不自动推导必须新建 Change

#### Scenario: An existing requirement differs from the current UI
- **WHEN** 当前 UI 与既有规格有名称 / 路径差异
- **THEN** 先判断它是实现措辞还是仍有效的业务 / 明确验收承诺；普通 UI 不增加 Change，真正承诺的未决变化按已有流程澄清处理，不能仅用 design 说明自动豁免，也不倒改旧归档、Run 或 verdict

#### Scenario: Author and reviewer apply the same distinction
- **WHEN** Review Explore 核对固定 Author 的约束 / 候选 / proof，或 Review Propose 核对正式产物
- **THEN** 自有 Review 方法独立核对业务与设计粒度、真实用户影响和重要假设来源；不要求继承 Author 上游方法，不以旧词面、测试绿或交接成功代替语义判断

### Requirement: Proactive clarification of material product uncertainty

Explore / Propose 方法 SHALL 先查项目事实和已确认决定，再对会改变目标、角色、范围、核心流程、权限、默认行为、数据保留、兼容 / 历史处理、不可逆后果或验收的关键未知，向 Owner 提具体问题并说明影响及有依据的建议。答案未到 MUST 暂停依赖部分的定稿，允许独立调查继续；不能把假设、沉默或等待当批准。Review SHALL 核对必要提问与答案承接；低影响可逆细节自行判断并简记，不新增统一问答台账、Run 或审批层。

#### Scenario: An unconfirmed deadline changes the submitted result
- **WHEN** 默认截止及其时区 / 请求值影响实际提交结果，而已有材料无法确定预期
- **THEN** Author 提问这一产品决定，Propose 不自行选值并写成已确认要求；显示、请求及服务器条件按答案形成一致验收，Reviewer 核对答案来源

#### Scenario: Unanswered non UI retention policy
- **WHEN** 非 UI 工作的保留期限或不可逆处理仍未知，Owner 尚未回答
- **THEN** 同样先问，暂停依赖答案的方案定稿而继续独立调查；不能默认一个期限或因等待已久就实施

#### Scenario: A decision or fact is already available
- **WHEN** Owner 已明确普通 UI 不新建 Change，或技术栈 / 当前事实可直接查证，余下只是低影响可逆实现细节
- **THEN** 沿用决定、先查事实并自行处理该细节，不重复问卷、不重新要求批准已确认方向

#### Scenario: Proposal hides a material assumption
- **WHEN** Author 未确认的重要假设被写成确定规格，或问答与实际范围 / 设计 / 验收不一致
- **THEN** Reviewer 指出对应缺口，依现有独立审核给出结论，不由工具加载成功、结构检查或材料数量自动批准

### Requirement: Standalone delivery plan-append receipt
每次合法新增范围 SHALL 保留有类型的独立 Author Delivery 收据，位于整个 Delivery 共享编号空间、与 Changes 批次同级，保存本轮、追加理由、Owner 范围来源、唯一请求、追加前后 scope、有效终态与实际时间。提交本身不得创建或激活 OpenSpec Change，也不构造虚假的 Reviewer 结论。

#### Scenario: Append receipts do not change current Change
- **WHEN** 当前有真实活动 Change 而 Author 完成范围追加
- **THEN** 收据占用 Delivery 下一个真实编号，但当前 active Change/latestRunRef、阶段/角色不被替换，旧绑定/批次/归档不改

#### Scenario: Append after earlier Full Test
- **WHEN** 当前 open Delivery 上一次 groups-v1 完整执行已稳定 passed 或 failed 且不存在不明写者或未决审核
- **THEN** 保存本次追加收据及前后范围，原 Full Test Run/outcome/logs 保持只读，新范围不继承原正式通过或失败为当前验收

#### Scenario: Invalid receipt or number
- **WHEN** 受管 Run 类型、编号、Author 身份、轮次、前后 scope 或原当前指针不符
- **THEN** 读取/提交拒绝，不把损坏的追加收据推断为授权或完成的范围变更

### Requirement: Scope append and current progress remain distinct
范围追加 SHALL 区分当前活动 Change、当前完整范围及旧 Delivery 正式结果的历史位置。操作完成后新增未关联项需明确显示待 bind，旧归档或旧 PASS 不能覆盖它；若已有合法活动 Change，则正常阶段进展仍是权威 next。

#### Scenario: New plan item follows an old Archive
- **WHEN** 当前没有活动 Change，追加后至少一个计划槽位尚未绑定
- **THEN** status/next 指向显式 change-bind 且要求 Owner 单独授权，不因旧最后 Archive 或旧 Full Test 得出 delivery-next / Close

#### Scenario: Existing active Change retains stage
- **WHEN** 当前活动 Change 的 latest Run 是 Explore、Propose 或 Apply 交接，另有新的待 bind 槽位
- **THEN** next 仍来自该活动 Change 的直接状态，新增范围单独可见；收据不能抢占最新 Action

#### Scenario: Pending append does not appear complete
- **WHEN** 追加收据或其所要求的 manifest 更新尚未完成 / 写入结果 unknown
- **THEN** 查询指出本次未确认及必要现场，不回退旧 PASS、不扫描历史最大号冒充最新交接

### Requirement: Single-source stage evidence in future runs
新 Explore、Apply、Review 阶段 SHALL 以当前 Run 的必要结果和明确原件来源为准，避免在同一阶段重复嵌入同一 stdout、报告、请求和派生输出。相同原件的第二次使用 SHALL 使用可定位的受管引用；不存在、越界或预计被清理的来源不得充当唯一证据。

#### Scenario: Two summaries reuse one original test result
- **WHEN** 当前阶段多份摘要引用同一次已保存真实执行的 stdout 或最终报告，且原件可从本次受管 Run 或明确持久受控来源直接读取
- **THEN** 保存必要唯一原件一份，其余使用有效的明确来源引用，不再保存第二份重复原始字节；不据摘要的 success 字样改变真实结果

#### Scenario: Only source is disposable temporary target
- **WHEN** 原始证据只在此次可能被删除的 .tmp/runtime 夹具、外部不可控目录或暂不可定位的来源
- **THEN** 不能只留下看似可用的链接后宣称证据保存完毕；在结束前保存必要唯一原件于本次受管证据目录，或报告不完整并保留现场，不凭旧摘要制造 PASS

#### Scenario: Real failure and unknown observations require source
- **WHEN** 本次执行、清理或审核发现 failed、blocked、not-run、interrupted 或 unknown，包含部分日志、未确认的报告或锁
- **THEN** 保留可直接核对的失败/未完成理由、实际必要日志与受管现场；不得用重复消除省略唯一原件、将 unknown 解释为空输出或以历史通过覆盖当前失败

### Requirement: Reconstructible proof inputs and bounded references
新阶段 Proof 输入 SHALL 优先使用当前项目中受控且可重建的脚本、测试夹具与明确参数。只在需要保存不可重建的唯一输入时将副本置于当前 Run 的受管证据；引用 SHALL 记录可判断的来源及用于复现的必要调用，不要求扫描全部历史 Run 或保存无关的临时工程树。

#### Scenario: Repeatable proof uses controlled fixture
- **WHEN** 本次调查输入可由已有维护脚本、fixture 与明确的选定命令重新建立
- **THEN** Run 保存真实方法、源位置、命令/参数与实测结果，额外临时工程不作为唯一长期输入，也不复制其全部派生目录

#### Scenario: Unique input cannot be reconstructed
- **WHEN** 源头不可稳定取得且该输入实际参与独立 Reviewer 结论
- **THEN** 在当前受管 Run 内保留必要原件与来源，不能只保存一个指向已清理路径的 Ref；实际无权取得原件时报告限制，不伪造取证完成

### Requirement: Submitted evidence remains immutable across optimization
历史 submitted Run 的原始正文、verdict、执行日志、失败与 unknown 现场及归档原件 SHALL 保持只读。新证据轻量化只能作用于尚未产生的受控采集路径，不能遍历清理旧 Run、替换既有审核证明或以文件数量自动决定删除。

#### Scenario: Old approved run contains duplicate proof copies
- **WHEN** 历史 D01–D05-B 已经提交且其 artifacts 中存在相同 stdout、空文件或可由旧脚本重建的目录
- **THEN** 旧原始材料与来源仍可读取，不修改其原文、verdict 和身份、不自动迁移/删除、不分配补证 Run

#### Scenario: Compact future collection faces unknown write
- **WHEN** 新阶段采集原件或其受管引用的写入中断、锁状态未知或最终读回不一致
- **THEN** 保留实际必要现场并报告不完整，不以文件数量减少视为提交成功，不清理属于其他写者的锁或临时文件
