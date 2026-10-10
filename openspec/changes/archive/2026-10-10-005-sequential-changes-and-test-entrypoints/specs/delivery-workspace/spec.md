# Spec Delta

## MODIFIED Requirements

### Requirement: First change association

系统 SHALL 允许首次 Open 的可选 `--change` 或之后的 `change bind`，把上游已存在的 Change 关联到一个计划槽位并设为当前 Change，初始协作阶段为 Explore。关联 MUST 验证目标、Change schema、槽位与唯一性；不得替换已有活动 Change；前项归档后的显式追加遵循顺序关联规则，不自动激活或生成审核批准。

#### Scenario: Open with an existing change
- **WHEN** Open 输入包含该目标已存在的 repo-local `spec-driven` Change 和有效计划槽位
- **THEN** manifest 保存真实 Change ID、目标内引用与槽位，查询显示本地初始 Explore 和上游真实产物事实

#### Scenario: Bind after delivery open
- **WHEN** 产品创建的 open Delivery 尚无当前 Change，用户明确指定已有 Change 和计划槽位执行 bind
- **THEN** 系统更新该 manifest，保留项目入口与范围，并在另一进程读回关联

#### Scenario: Association would replace existing work
- **WHEN** 同一或另一 Change 已经作为当前关联，或槽位不存在、已占用
- **THEN** 系统拒绝本次 bind 并保留原记录，不重置阶段或审核状态

### Requirement: Read-only status and next

`status` 与 `next` SHALL 使用同一只读状态解释，展示目标、Delivery 范围、本地关联、当前产品 Run 和相关 OpenSpec 事实。系统 MUST 区分本地协作进展与上游产物 readiness；查询 SHALL 不创建文件、推进阶段、分配 Run 或执行推荐操作。唯一当前 binding 为活动项或无活动时追加顺序最后的归档项，归档处理中 / 完成态按它的当前 Archive Run 解释，不调用已移走 Change 的活动 status；新关联无当前产品 Run 时保留该项初始 Explore 提示，不回退旧 Run；人工 next 仍明确标注来源而不转为产品执行事实。

#### Scenario: Prepared project without a delivery
- **WHEN** 查询有效 OpenSpec 目标且 `.mendi/` 不存在
- **THEN** 状态显示 MenDi 尚未 Open，下一步提示 `delivery-open`，文件保持不变

#### Scenario: Delivery without a change
- **WHEN** 查询一个合法的产品 Delivery 且尚无 Change 关联
- **THEN** 状态显示已有范围，下一步提示明确选择已有 Change 后执行 `change-bind`，不创建 Change

#### Scenario: Upstream proposal is ready
- **WHEN** 本地关联阶段为 Explore，而上游 proposal 为 ready 或所有规划文件已齐备
- **THEN** next 仍按本地当前 Run 或初始 Explore 交接解释，不自动改为 Propose 或 Apply，不把上游事实解释为批准；记录操作与 Agent 的阶段语义工作分别说明

#### Scenario: Bound change disappears
- **WHEN** manifest 当前普通活动 Change（非合法归档过渡态）无法从上游读回
- **THEN** 查询报告引用失效并展示关联位置，不忽略关联或将 Delivery 判为可继续

#### Scenario: Product run is read after process exit
- **WHEN** product binding 的 latestRunRef 指向有效当前 Run，新进程读取 status / next
- **THEN** 显示同一 Action、Run 状态、进展结果及最小 next，只解析该当前记录，不读取全部历史 Run 正文或递归说明链

#### Scenario: Manual progress remains manual
- **WHEN** manual-bootstrap manifest 中存在最新 Run 与 Reviewer 交接引用
- **THEN** 查询保留人工 next 和说明来源，不读取这些 Run 作为新增产品运行前提、不认证其语义或调用产品写入

#### Scenario: Query the next change before and after its first run
- **WHEN** 前项归档后显式关联第二 Change，先在无新 Run 时查询，再完成首次阶段记录并在新进程查询
- **THEN** 两次都选择第二项；先显示它的 Explore / 上游事实，后显示其新 Run，不显示第一项 Archive 为当前进展

#### Scenario: Query after the second archive
- **WHEN** 第二项完整归档、无活动项且其必要终态有效
- **THEN** 选择追加顺序最后的第二项，upstream 为 null，next=delivery-next / awaiting-owner-instruction，不自动 bind 第三项

### Requirement: Operation-specific input checks

系统 SHALL 按当前操作要求实际必要输入。普通 status / next MUST 读取入口、manifest、当前活动 Change 的路径 / 上游 status 和当前 product Run；合法 Archive 过渡 / 完成态只读取唯一当前绑定及其必要 Archive Run，不要求旧活动路径。Action 开始 / 继续 / Owner 处置和正式 submit SHALL 保留上游与相应方法 / 固定 Author 校验；draft save 依赖本地配置、普通活动路径或合法 Archive 过渡态、当前 draft、身份、正文和安全写入；Archive execute 与 finish 分别检查实际前置和当前归档直接输入。只读诊断 SHALL 不启动上游、不扩大为历史读取；人工历史与未知 Ref 不自动成为依赖。

#### Scenario: Historical links and unknown extensions are unavailable
- **WHEN** 人工记录的历史 Run、旧方案、说明链接或未知 Ref 扩展缺失、非路径或指向不可用位置，但必要输入有效
- **THEN** 查询保留这些说明字段并成功返回，不读取说明目标、不补证、不重写记录

#### Scenario: Required current input is unavailable
- **WHEN** project.json、当前 manifest、普通活动 Change 或实际需要的当前 product Run 缺失或损坏
- **THEN** 查询返回失败并指出实际输入问题，不因历史说明被放宽而静默忽略必要输入

#### Scenario: A review-only input is missing
- **WHEN** 当前 Reviewer Run 有效，但固定 authorRunRef 指向缺失文件或阶段 Skill 已不可用
- **THEN** 普通 status / next 展示当前记录而不读取这些目标；开始 / 继续需要的方法缺失、Review continue / submit 需要的 Author 缺失分别只阻止对应操作，本地保存不读取其正文

#### Scenario: Managed input escapes the project
- **WHEN** 操作实际读取的 latestRunRef、authorRunRef 或写入位置越界、经 junction 指向外部或与身份不一致
- **THEN** 该操作拒绝使用此输入并指出问题，不因为说明 Ref 放宽而放宽实际读写安全

#### Scenario: The upstream process is unavailable for local work
- **WHEN** 上游不可用，但只读诊断或保存 draft 的本地必要输入有效
- **THEN** 本地操作不调用上游且明确未验证上游；status / next、正式 submit 和需要上游的 Action 操作仍按实际工具错误拒绝

#### Scenario: Older archived runs are no longer runtime inputs
- **WHEN** 第二项为当前对象、必要记录有效，第一项 archived binding 身份 / 编号 / 受管定位仍一致，但它的旧 Run、归档内容或说明不可用
- **THEN** 普通查询、第二项阶段操作及归档不读取第一项旧文件；仍检查绑定结构和安全身份，不递归补证或放宽当前必要输入

#### Scenario: The selected archive run is missing
- **WHEN** 当前对象处于 archiving 或无活动时最近 archived，但它的必要 Archive Run 缺失
- **THEN** 拒绝当前查询或归档操作，不用前项 Archive Run、历史批准或目录存在替代

### Requirement: Product archive transition and terminal handoff

系统 SHALL 只在唯一当前合法 Archive Run 与该 product binding 一致时解释归档过渡态；普通 Action 写入 MUST 被阻止。只有累计计数、submitted / complete Archive Run 和 numbered archived binding 完整一致时 SHALL 报告完成，清空 activeChangeId 并显示已归档 / 无活动 Change。过渡态 MUST 不因源目录消失而猜成功，manual-bootstrap 兼容和只读边界保持。

#### Scenario: Archive is pending while its source has moved
- **WHEN** 当前合法 Archive draft 或已写终态 Run 与 archiving binding 对应，源目录已移走，本地收口尚未完整
- **THEN** status / next 显示 pending 与当前归档对象，upstream 为 null，不报普通活动路径缺失、不自动执行 finish 或允许其他 Action 写入

#### Scenario: All archive records are complete
- **WHEN** archived binding、archiveOrdinal、项目计数和最终 Archive Run 一致，activeChangeId 为 null
- **THEN** query 显示该 Archive 结果及“已归档、当前无活动 Change”，next 为 delivery-next / awaiting-owner-instruction；不激活第二 Change、Close 或 Full Test

#### Scenario: An archive record is inconsistent
- **WHEN** archiving 状态没有匹配 Archive Run、错误角色 / 身份 / 路径，或 archived binding 没有完整终态与一致计数
- **THEN** 查询拒绝矛盾完成记录或如实表示待收口，不借人工模式、历史批准或目录存在伪报完成

#### Scenario: The archived directory or history is no longer available
- **WHEN** 本地完整终态有效，但归档目录、旧 Author / Reviewer 正文、历史说明或未知 Ref 不可用
- **THEN** 只读查询保留定位和当前完成记录，不读取这些目标、不补建目录，也不调用旧 Change status；当前最终 Archive Run 缺失仍是必要输入错误

#### Scenario: Second archive is pending after count commit
- **WHEN** 第一项已归档，第二项 Archive 的新累计计数或终态 Run 已写而第二项 manifest 尚未收口
- **THEN** 按第二项当前 Archive 表示 pending，不能把第一项计数不同解释成全局损坏；仍核对第二项基准 / 新值与直接身份，显式 finish 才能收口

### Requirement: Cumulative archive ordinal and idempotent local commit

成功归档 SHALL 使用项目累计正整数 archiveOrdinal 和真实原生日期，目录为 YYYY-MM-DD-NNN-change-id，跨日期 / Delivery 连续且不复用。准备与失败 MUST 不增加完成数。实际效果确认后的本地提交 SHALL 只接受本次计数基准或预定新值，完整读回才报告成功，只更新本次当前 binding，旧 binding / archiveOrdinal 保持；中断后的显式 finish MUST 识别已写部分，不重复增长或改完成 Run。

#### Scenario: Existing version one records have no archive count
- **WHEN** 旧 product 入口没有 archivedChangeCount，首次准备 Archive
- **THEN** 只对本次操作按 0 作为基准，预定 ordinal 为 1；普通查询不补字段或迁移历史，实际完成后才保存计数

#### Scenario: The real native archive date differs from the prepared date
- **WHEN** 归档实际完成在不同日期，或 finish 发生在以后一天
- **THEN** 使用经根 / 身份 / 实际效果核对的原生日期确定编号目录，保持本次 ordinal，不按旧计划猜目录或用 finish 当天重命名日期

#### Scenario: Local commit fails after the count or terminal run was written
- **WHEN** 项目计数已为本次新值或终态 Run 已写，但 manifest / 最终读回仍未完成
- **THEN** 保留真实写入与锁；Owner 另行核对必要锁处置后，显式 finish 只补缺失部分，最终仅增长一次，已完成 Run 字节保持

#### Scenario: Ordinal state conflicts or the target already exists
- **WHEN** 当前计数既非本次基准也非新值，编号目标被其他材料占用，或原生 / 编号路径越界、身份不符
- **THEN** 停止本地收口，不覆盖、重新分配编号、增加计数或从其他归档猜完成；原始现场保留

#### Scenario: Complete two archives in one delivery
- **WHEN** 同 Delivery 两个 Change 依次通过当前审核、实际归档并完整收口
- **THEN** 项目计数增长两次，第二项使用下一累计编号；第一项 binding / ordinal / 旧 Run 不变，旧 ordinal 小于项目总数仍有效，不要求所有旧项等于当前计数

#### Scenario: Repeat finish on the current second archive
- **WHEN** 第二项已完整收口，再显式 finish 该当前 Archive
- **THEN** 返回 already-completed，只解释第二项当前终态；不再次增长计数、不修改任一历史项或生成新 Run

#### Scenario: An old archive is requested after another change became current
- **WHEN** 下一 Change 已关联或后续 Archive 已成为当前对象，却请求前项 execute / finish
- **THEN** 按陈旧当前输入拒绝，不回退当前对象、不改旧终态或重复计数

## ADDED Requirements

### Requirement: Sequential explicit change association

open product Delivery SHALL 在无活动项且已有前项完整归档时允许显式追加下一已有 Change；首次关联同样保留。关联 MUST 校验真实目标 / schema、槽位和 Change 唯一性、槽位的范围内依赖均已归档，以及唯一当前归档交接完整。操作 SHALL 追加而不替换旧项；第二项加入已有 Changes 批次，无批次的首次关联等首个 Run 时建立，不自动推进阶段。

#### Scenario: Append an existing dependent change
- **WHEN** A 已完整归档，B dependsOn A，Owner 范围内显式指定上游已有 B 对应 Change 和未占用槽位
- **THEN** 追加 B 为唯一活动项、初始 Explore，旧项、范围与计数不变；B 加入当前批次但不新增 Run，另一进程读回同一关联

#### Scenario: Current work or dependencies prohibit binding
- **WHEN** 前项仍活动 / archiving / 交接不完整，依赖未归档，槽位或 Change 已占用、缺失、范围不符，或 Delivery 不是 open
- **THEN** bind 在提交前拒绝并说明实际原因，不抢锁、不替换已有项、不创建 Change 或批次占号

#### Scenario: Native facts are not activation authority
- **WHEN** 某项归档或上游 planning ready，而没有明确 bind 下一已有 Change 的请求
- **THEN** 保留当前交接，不自动追加、分配 Run、创建审核或激活下一项

### Requirement: Ordered product associations and shared batch identity

product bindings MUST 按显式追加顺序保存：除最后项外均为 archived；存在非归档最后项时 activeChangeId 必须指向它，否则为 null。旧 archiveOrdinal MUST 唯一递增且不大于项目总数；最近终态和过渡计数按当前 Archive 核对。当前 open 周期最多一个 Changes 批次，成员及 binding.batchId / Run 位置 MUST 一致；不得从历史正文或最大 Run 推断当前对象。

#### Scenario: An appended change has no run yet
- **WHEN** 前项已有批次，第二项刚 bind，继承相同 batchId / 成员身份但尚无 latestRunRef
- **THEN** 记录合法，首次新 Run 复用该批次；旧批次成员不丢失，不因无新 Run 删除已有批次

#### Scenario: Binding order or batch membership contradicts identity
- **WHEN** 有多个非归档项、活动项不是最后追加项、旧编号倒序 / 重复 / 大于总数，或成员重复 / 未关联 / 与 Run 身份位置不符
- **THEN** 拒绝矛盾记录，不排序修复、不回退第一项或把占号目录当正式交接

#### Scenario: Version one and manual records remain bounded
- **WHEN** 读取原有单 Change version 1 product 或合法 manual-bootstrap 记录
- **THEN** 单 Change 保持可读；人工记录保留既有只读解释，不套用新产品顺序规则或迁移历史；本轮不支持 product 多 Delivery 或 Close / Reopen
