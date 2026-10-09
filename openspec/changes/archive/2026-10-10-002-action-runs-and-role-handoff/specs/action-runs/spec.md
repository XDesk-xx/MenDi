# Spec Delta

## Purpose

让手动开发中的 Action、工作进展和审核对象可以被明确保存并跨进程读回，以连续编号的 Run 承接同阶段继续、完成、修订与独立角色交接。该能力提供必要的记录、方法选择和写入边界，保留历史提交，不将工具运行成功或文件齐备解释为语义完成与审核批准。

## ADDED Requirements

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

系统 SHALL 仅允许当前 draft 的同角色 / 同操作者保存正文，并在提交时要求非空工作摘要、结果与 continuing / complete 选择。成功提交后 Run MUST 不再允许保存或重新提交；当前输入陈旧、未完成写入或读回失败 MUST 非零退出并保留现场，不自动覆盖旧记录。

#### Scenario: Save a draft and submit progress
- **WHEN** 当前 draft 的原操作者保存 Markdown 工作记录，再以 continuing 提交
- **THEN** Run 在跨进程读回时为 submitted / continuing，正文和结果真实保留，Action 仍未完成

#### Scenario: A submitted or stale run is edited
- **WHEN** 对已提交 Run 保存 / 重提，或操作引用已不是当前 draft 的 Run
- **THEN** 系统拒绝写入，不改旧正文、结果或交接

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
