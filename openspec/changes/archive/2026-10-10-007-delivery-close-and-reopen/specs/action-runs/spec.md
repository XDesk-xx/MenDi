# Spec Delta

## MODIFIED Requirements

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

### Requirement: Delivery operation runs beside change batches

Delivery 操作 SHALL 在 runs/<delivery-id>/<序号>-<操作名称>/run.md 与 Changes 批次同级，共享连续编号，明确 delivery scope、类型 / 方法、Author / actor 和 draft / submitted。新增记录化 Open 保存 001-delivery-open，Close / Reopen 继续原号；旧首次 Open 未记录 Run 的格式保持可读，不补历史。当前进展与最近正式结果指针 MUST 各按实际用途选择，生命周期提交只更新本次直接对象。

#### Scenario: Full test follows multiple archived changes
- **WHEN** 同 Delivery 两项已归档、已有 Run 最大占号为 014，Author 显式正式执行
- **THEN** 本次 Run 为 015-delivery-full-test，与既有 Changes 批次同级；Change、批次、Archive 编号和旧文件保持

#### Scenario: Continue a targeted delivery review
- **WHEN** 定向 Review 已 submitted / continuing，原 Reviewer 显式继续
- **THEN** 新 draft 使用下一号、相同 actionId 与固定 Author；旧 Run 不变，不为每项验证单独分配 Run

#### Scenario: Reservation or identity is inconsistent
- **WHEN** 发现重复 / 非规范序号、错 Delivery / 角色 / 方法、越界路径或另一写者
- **THEN** 拒绝并保留已有占号 / 锁，不复用空占号或覆盖旧记录

#### Scenario: Close and reopen preserve separate operation runs
- **WHEN** 正式结果为 015，随后显式 Close、Reopen 和新 Change 开始
- **THEN** 在无其他占号时保存 016-delivery-close、017-delivery-reopen 和 018-changes 中的新 Run；旧正式 / Close 不改，新 Open 在独立 Delivery 使用 001

### Requirement: Current delivery progress and minimal handoff

Delivery 进展 SHALL 由显式当前指针读取，不倒查失败 / 修订链。修复与 Review 保持既有交接；passed 仅待 Owner。closed 当前选择 Close；Reopen / Open 完成后提示范围内显式 bind，退出旧 PASS 的当前适用选择但保留最近正式入口。待提交生命周期写入与 unknown MUST 停 Owner 核对 / 显式有限继续。next 只包含当前必要入口，不自动执行或累积旧 Close / 审核链。

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
