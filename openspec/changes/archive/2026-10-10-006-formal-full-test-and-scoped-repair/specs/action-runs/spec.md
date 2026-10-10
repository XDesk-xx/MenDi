# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit action recording

系统 SHALL 通过显式 Change Action 开始与继续操作组织当前 product Delivery 的已关联活动 Change，要求类型、声明角色与稳定操作者标识，返回本次 Run 和实际阶段方法。系统 MUST 拒绝人工 bootstrap 写入、不支持类型、错角色、非当前目标或不合法交接；开始 / 继续只准备工作记录；Archive 开始仅在当前 Review Apply 完成且 approved 时准备 Author draft，实际归档须再显式执行。Delivery 范围操作 SHALL 使用其独立显式命令和相应记录，不借 Change start 绕过前置。

#### Scenario: Start the initial author action
- **WHEN** open product Delivery 已关联活动 Change、尚无当前 Run，Author 显式开始 explore
- **THEN** 系统保存一个 draft Run，分配 Action 身份，返回实际 Explore 方法，保留 OpenSpec 和目标已有材料

#### Scenario: Wrong role or unsupported operation
- **WHEN** 类型为 review-explore 却声明 author，或在 Change start 请求 review-archive / revise-archive / Delivery 操作、非当前 Change 或人工记录写入
- **THEN** 操作在业务写入前拒绝，指出类型、角色、目标或格式问题，不代签批准或迁移历史

### Requirement: Draft save and immutable submission

系统 SHALL 仅允许当前 product draft 的同角色 / 同操作者保存正文，使用明确根、本地配置、当前 Run、明确正文及安全写入；Change draft 要求活动 binding，Delivery draft 按其当前 Delivery 记录核对。保存 MUST 不依赖上游、方法或固定 Author 正文。正式提交 SHALL 校验非空正文 / result / outcome 及必要 Author / verdict，Change 提交保留上游校验；正式 Full Test 禁止普通提交生成执行终态。已提交 Run MUST 不允许保存 / 重提；陈旧、冲突或读回失败 SHALL 非零退出并保留现场。

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

## ADDED Requirements

### Requirement: Delivery operation runs beside change batches

Delivery 操作 SHALL 保存于 `.mendi/runs/<delivery-id>/<序号>-<操作名称>/run.md`，与 Changes 批次同级并共享既有连续编号。头部 MUST 明确 delivery scope、可空 Change、类型 / 方法、角色 / actor 与 draft / submitted；独占占号、路径 / 身份、未提交继续及历史不可改规则保持。当前 Delivery 指针与最新正式结果指针 SHALL 各表达其实际用途，不扫描最大号推断完成。

#### Scenario: Full test follows multiple archived changes
- **WHEN** 同 Delivery 两项已归档、已有 Run 最大占号为 014，Author 显式正式执行
- **THEN** 本次 Run 为 015-delivery-full-test，与既有 Changes 批次同级；Change、批次、Archive 编号和旧文件保持

#### Scenario: Continue a targeted delivery review
- **WHEN** 定向 Review 已 submitted / continuing，原 Reviewer 显式继续
- **THEN** 新 draft 使用下一号、相同 actionId 与固定 Author；旧 Run 不变，不为每项验证单独分配 Run

#### Scenario: Reservation or identity is inconsistent
- **WHEN** 发现重复 / 非规范序号、错 Delivery / 角色 / 方法、越界路径或另一写者
- **THEN** 拒绝并保留已有占号 / 锁，不复用空占号或覆盖旧记录

### Requirement: Current delivery progress and minimal handoff

合法 Delivery 操作 SHALL 由其显式当前指针选择 Run，普通查询只读该头部及正式测试实际需要的直接结果，不倒查修订或失败链。未完成修复 / Review 推荐保存提交或同 Action 继续，修复完成推荐独立 Review；approved 推荐新正式 Full Test，changes-requested 推荐新 Author 修订，rejected / unknown 停 Owner；passed 仅提示等待收口指令。

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

### Requirement: Delivery methods and direct review input

Delivery 正式执行、Author 修复和 Reviewer 定向审核 SHALL 使用各自真实阶段方法；缺失 / 不匹配方法阻止相应开始或继续，不阻止不读取方法的查询。修复 Review MUST 固定同 Delivery、完整且完成的新 Author，拒绝明显自签 / 陈旧对象。声明角色与 actor 不能替代实际独立性；工具成功、材料文本和方法读取不代签 verdict。

#### Scenario: Read the relevant method without upstream change activity
- **WHEN** Author 开始 delivery-repair，或 Reviewer 开始 review-delivery-repair
- **THEN** 返回相应方法与直接输入；不伪装活动 Change 或请求旧 Change 的 Apply / Archive 指引

#### Scenario: A method or required author is unavailable
- **WHEN** 相应开始 / 继续所需方法不可用，或 Review 正式操作所需固定 Author 不可读
- **THEN** 对应操作拒绝且不产生有效批准 / 新交接；本地故障说明和普通查询按自己的必要输入解释
