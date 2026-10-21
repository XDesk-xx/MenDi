# Spec Delta

## MODIFIED Requirements

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
