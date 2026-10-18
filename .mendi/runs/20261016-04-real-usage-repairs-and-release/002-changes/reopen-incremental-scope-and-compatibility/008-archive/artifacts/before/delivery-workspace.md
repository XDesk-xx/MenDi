# delivery-workspace Specification

## Purpose
为明确选定的项目保存首个 Delivery 的身份、范围与已有 Change 关联，并提供跨进程可读的协作状态和下一步提示。能力要求保留历史、诊断冲突及不完整记录，让人工 bootstrap 与后续产品阶段之间有清楚的边界。

## Requirements

### Requirement: First delivery open

系统 SHALL 在已准备 OpenSpec 且没有 `.mendi/` 状态的目标执行首次 `delivery open`，要求 Delivery ID、标题及含目标和计划槽位的范围输入。成功 MUST 持久保存项目入口及该 Delivery 独立 manifest，并能在另一进程读回同一范围。Open 本身 SHALL 不创建 OpenSpec Change 或宣称槽位完成。

#### Scenario: Open and read in a separate process
- **WHEN** 用户为受控项目提供合法 ID、标题和范围文件，执行 Open 后退出进程并重新查询
- **THEN** 查询显示同一 Delivery、open 状态、目标、计划槽位及关联，不依赖进程内缓存或旧临时输入

#### Scenario: Invalid scope is supplied
- **WHEN** ID 含路径分隔符或范围缺少目标、含重复槽位、悬空依赖或循环依赖
- **THEN** 系统在写前拒绝并指出输入问题，目标保持原样

### Requirement: Existing state is preserved

首次 Open MUST 拒绝不完整既有 .mendi 状态。已有 open、人工记录、重复 ID 或未完成写入 SHALL 不覆盖；只有当前 product Delivery 完整 closed 时，显式新 ID Open 才能追加独立 manifest / 索引并选择新 Delivery，保留旧 Delivery 与项目累计归档数。新 Delivery 从 001 编号，不通过 Open 重开旧 Delivery。

#### Scenario: Duplicate open
- **WHEN** 用户对仍为 open 的目标执行同一或不同 ID 的 Open，或在 closed 后复用已登记 ID
- **THEN** 系统报告现有状态及相关位置，原项目入口、manifest 和历史材料字节不变

#### Scenario: Partial directory already exists
- **WHEN** 目标 `.mendi/` 已存在但缺少入口或有效 manifest
- **THEN** 系统报告不完整状态，保留残留，不把目标当作空项目自动重试或清理

#### Scenario: Open a new delivery after close
- **WHEN** 当前 product Delivery 完整 closed，Owner 明确授权新 ID、标题与独立范围，Author 提供记录身份
- **THEN** 追加新 manifest / 索引并选择新 Delivery，保存 001-delivery-open；旧 manifest / Close / Run 不改，归档数不重置，不预建 Changes 批次

#### Scenario: An unindexed target is already occupied
- **WHEN** 新 ID 的受管 group / Run 位置存在其他内容或未完成写入
- **THEN** 普通新 Open 拒绝覆盖并报告现场；只有对应当前待提交操作的显式 resume 可按原输入补剩余提交

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

### Requirement: Partial write and concurrent conflict diagnosis

写操作 MUST 对同一目标的并发写者明确冲突，且只有最终记录可完整读回时才报告成功。发生写入失败或残留锁时 SHALL 非零退出并说明相关路径；查询 SHALL 识别缺失、损坏或引用不一致的记录，不自动恢复、回滚或宣称 Delivery 完整成功。

#### Scenario: First open fails before project entry is committed
- **WHEN** manifest 已创建，但项目入口写入失败或进程中断
- **THEN** 失败报告或后续查询指出不完整 `.mendi/` 状态，保留现场；重复 Open 不覆盖该状态

#### Scenario: Another writer owns the target
- **WHEN** 第二个写者在同一目标的 Open 或 bind 尚未完成时进入
- **THEN** 第二个写者收到冲突结果，不覆盖第一个写者的文件或删除其锁

#### Scenario: Existing manifest update cannot complete
- **WHEN** bind 更新 manifest 发生临时写入或替换失败
- **THEN** 命令报告失败，不把未提交关联作为已持久状态；已存在的正式记录不得被截断写入

### Requirement: Read-only status and next

status / next SHALL 只读解释当前选择，或显式指定的已登记 Delivery，不改变 activeDeliveryId。系统 MUST 区分本地进展、历史执行与上游 readiness；生命周期 / 正式操作优先使用其当前指针，无此指针时仅选择本轮活动 binding 或本轮最后归档项。closed 读取当前 Close，不访问旧 Change status；待提交写入显示未完成，不回退旧 PASS、历史最大号或旧范围。

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
- **WHEN** 无当前 Delivery 操作，product binding 的 latestRunRef 指向有效当前 Run，新进程读取 status / next
- **THEN** 显示同一 Action、Run 状态、进展结果及最小 next，只解析该当前记录，不读取全部历史 Run 正文或递归说明链

#### Scenario: Manual progress remains manual
- **WHEN** manual-bootstrap manifest 中存在最新 Run 与 Reviewer 交接引用
- **THEN** 查询保留人工 next 和说明来源，不读取这些 Run 作为新增产品运行前提、不认证其语义或调用产品写入

#### Scenario: Query the next change before and after its first run
- **WHEN** 前项归档后显式关联第二 Change，先在无新 Run 时查询，再完成首次阶段记录并在新进程查询
- **THEN** 两次都选择第二项；先显示它的 Explore / 上游事实，后显示其新 Run，不显示第一项 Archive 为当前进展

#### Scenario: Query after the second archive
- **WHEN** 第二项完整归档、无活动项、无当前 Delivery 操作且其必要终态有效
- **THEN** 选择追加顺序最后的第二项，upstream 为 null，next=delivery-next / awaiting-owner-instruction，不自动 bind 第三项

#### Scenario: Query current delivery acceptance or repair
- **WHEN** 全部 Change 已归档，当前 Delivery Run 为正式 Full Test、局部修复或定向 Review
- **THEN** status / next 在新进程选择该 Run、展示相应结果 / 角色 / 当前必要输入，upstream 为 null，不重新读取旧 Change 活动 status 或把旧 Archive 当当前进展

#### Scenario: Current delivery record conflicts or is missing
- **WHEN** Delivery 指针指向缺失 / 损坏 / 错身份 / 越界 Run，或同时存在活动 Change 与未退出的 Delivery 操作
- **THEN** 明确输入错误或冲突，不静默回退到 Archive、历史最大号或旧 PASS，不自动修复指针

#### Scenario: A writer appears during the direct result read
- **WHEN** 当前正式 Run 已读到 passed 头部，但直接子结果 / 日志观察出现竞争或变化
- **THEN** status / next 的本次 outcome 与 next 一致为未确认并停 Owner，持久 passed 保留作原事实，不读取额外历史来绕开本次不稳定

#### Scenario: Query a closed delivery and an explicitly selected historical delivery
- **WHEN** 当前 Delivery closed，或新 Open 后用 --delivery 指定已登记旧 Delivery
- **THEN** 读取对应 manifest 和当前 Close 摘要，upstream:null，保留实际 closed / open 与人工来源；不改变项目选择、不重验旧正式结果或调用旧活动 Change

#### Scenario: Reopened scope has no associated change
- **WHEN** Reopen 已完成但本轮尚无 binding
- **THEN** 解释 Reopen 的新范围及显式关联提示，不把历史最后 archived 项或旧正式 passed 当作本轮进展

#### Scenario: A lifecycle operation is pending
- **WHEN** 项目入口保存当前待提交生命周期 Run，终态 Run 或目标 manifest / 索引尚未完整收口
- **THEN** 查询报告 pending / unknown 与当前直接入口，阻止其他写入，不以已写 complete 头部、旧 closed 或旧 PASS 宣称本次完整成功

### Requirement: Manual bootstrap read compatibility

系统 SHALL 只读识别当前 `recordingMode=manual-bootstrap` 的项目入口和 manifest，保留其阶段、Run 与审核引用并标明来源。未版本化且不符合该格式的记录 MUST 报错；产品写命令 SHALL 拒绝修改人工记录，不将人工历史强制改写为产品格式。

#### Scenario: Current MenDi bootstrap is queried
- **WHEN** 查询当前受控人工 manifest，包含已记录的 reviewer verdict 引用及本地 next
- **THEN** 输出将其作为人工协作状态与相关引用展示，有当前活动 Change 时另外读取其上游事实；不声称产品已执行或再次批准这些阶段

#### Scenario: Attempt to bind into manual history
- **WHEN** 用户对人工 bootstrap Delivery 执行产品 bind
- **THEN** 系统报告人工记录仅支持查询，原 Run、批准引用及所有记录保持不变

#### Scenario: Record reference leaves the project
- **WHEN** 操作实际使用的 manifestRef 或 binding changeRef 为绝对路径、包含越界路径、身份不一致或解析到项目外
- **THEN** 查询与写入拒绝读取该引用指向的内容，报告不安全或不一致记录

### Requirement: Operation-specific input checks

系统 SHALL 按操作读取实际必要输入：普通 query 读取入口、所选 manifest、当前产品 Run，活动 Change 才读取其路径 / 上游 status；closed 与历史结果不要求旧活动目录。正式写入、阶段 / Review / Archive 保留各自当前直接输入检查；指定结果读取只检查其所属 Delivery、父 / 子结果和必要日志，不借执行准入拒绝历史读取。人工说明与未知 Ref 不成为依赖，身份、受管路径与安全写入 MUST 保留。

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
- **THEN** 本地操作不调用上游且明确未验证上游；实际依赖上游的 status / next、正式 Change submit 和 Action 操作仍按工具错误拒绝，不扩大为本地指定结果的上游前置

#### Scenario: Older archived runs are no longer runtime inputs
- **WHEN** 第二项为当前对象、必要记录有效，第一项 archived binding 身份 / 编号 / 受管定位仍一致，但它的旧 Run、归档内容或说明不可用
- **THEN** 普通查询、第二项阶段操作及归档不读取第一项旧文件；仍检查绑定结构和安全身份，不递归补证或放宽当前必要输入

#### Scenario: The selected archive run is missing
- **WHEN** 当前对象处于 archiving 或无活动时最近 archived，但它的必要 Archive Run 缺失
- **THEN** 拒绝当前查询或归档操作，不用前项 Archive Run、历史批准或目录存在替代

#### Scenario: Historical result reading does not reuse execution admission
- **WHEN** 显式读取已登记旧 Delivery 的正式 / 普通结果，其直接输入有效，但它为 closed、本轮已变化或项目累计计数已继续增长
- **THEN** 结果仍按自身身份读回，当前适用性单独说明；不要求 open、无新活动项、旧计数等于项目最新最大值或旧审核正文

### Requirement: Manual archived change handoff

系统 SHALL 只读解释 manual-bootstrap 中 `state:archived` 的 binding，其 changeRef MUST 为 `openspec/changes/archive/YYYY-MM-DD-<changeId>`；显式提供正整数 archiveOrdinal 时 MUST 使用 `openspec/changes/archive/YYYY-MM-DD-NNN-<changeId>`，NNN 为该编号补足至少三位，且该 Change MUST 不再是 activeChangeId。系统 SHALL 不因目录消失自动推断归档、不补建活动目录、不调用已归档 Change 的活动 status。此兼容 SHALL 不实现 Archive Action 或代签归档效果。

#### Scenario: Query after manual archive handoff
- **WHEN** 人工 binding 已记录正确归档路径并清空当前 Change，旧活动目录不存在
- **THEN** status / next 显示本地 archived binding 和原人工 next，upstream 为 null，查询不改文件且不执行活动 Change status；归档路径仅作为定位信息，不读取其内容或要求存在

#### Scenario: Inconsistent archive record
- **WHEN** archived binding 仍为活动 Change，归档路径缺失 / 身份不一致，或非 archived binding 伪用归档路径
- **THEN** 系统拒绝矛盾记录，不伪装活动 Change 或从上游 ready 推断归档

### Requirement: Distinguishable inactive change display

系统 SHALL 在人读查询中区分未关联任何 Change 与已有 archived binding、当前无活动 Change；后者 MUST 明示已归档与无活动状态。显示说明 SHALL 不以读取归档内容认证完成、不补建活动目录、不调用旧活动 status，且 SHALL 不改变原 JSON 身份或人工交接。

#### Scenario: There has never been a change association
- **WHEN** Delivery 没有关联记录且 activeChangeId 为 null
- **THEN** 人读输出表示尚未关联，保留原下一步提示

#### Scenario: Archived work has no active change
- **WHEN** manual-bootstrap 有合法 archived binding 且 activeChangeId 为 null
- **THEN** 人读输出说明“已归档、当前无活动 Change”，JSON 保持 archived binding 与 upstream:null；不显示成从未关联

### Requirement: Read-only interrupted workspace diagnosis

系统 SHALL 提供不依赖上游的显式本地诊断，在锁存在时只读检查入口、manifest、当前直接 product Run、锁元数据和调用者明确指定的同 Delivery / 当前 Change 残留 Run。诊断 MUST 保留受管路径 / 身份检查，不改文件或扫描历史正文。锁缺失 / 损坏、文件缺失、写者存活或观察中变化 SHALL 如实报告，不能从诊断成功推断操作已提交或可解除锁。

#### Scenario: A writer is still running
- **WHEN** 诊断观察到锁的 pid 对应进程仍存在或存活状态无法确认
- **THEN** 报告存活 / unknown 与锁 token、operation 和当前观察，普通操作仍被锁阻断；不把存活当作真实身份认证，不删除锁、不停止进程

#### Scenario: The pointer did not commit
- **WHEN** manifest 仍指向旧 Run 或无当前 Run，显式指定的新 Run 已落盘但未被关联
- **THEN** 区分当前记录与未关联占号，展示各自实际头部 / 路径及必要错误，不将残留判为成功、自动关联或删除

#### Scenario: Submission committed before the reported failure
- **WHEN** 当前指针可读且当前 Run 实际为 submitted，锁仍存在
- **THEN** 报告观察到的 submitted / outcome 和锁现场，不因原命令非零而称其 draft，不自动重提或回滚，普通 query 保持锁错误

#### Scenario: The scene changes or required local input is damaged
- **WHEN** 前后读回的锁 / 当前 manifest / Run 不同，或必要记录损坏、身份矛盾、实际输入越界
- **THEN** 报告 changed-during-read 或当前输入错误，不能判断的字段标明 unknown / unavailable，退出失败并保留全部现场；不拼接稳定状态或使用无关历史推断

#### Scenario: The diagnostic runs on manual bootstrap records
- **WHEN** 目标为合法 manual-bootstrap 入口和 manifest
- **THEN** 只报告人工格式与锁观察，不把人工 Run 当 product submitted 验证；显式指定残留 product Run 的诊断请求拒绝，不迁移或改写人工历史

#### Scenario: Explicit reservation is also the current run
- **WHEN** 显式 reservation 与 current 指向同一文件，且两次读取之间内容改变
- **THEN** 保留首次快照并报告 changed-during-read，不因后一次读取覆盖首次观察而漏报，不生成稳定成功

### Requirement: Explicit manual lock disposition boundary

本轮系统 SHALL 仅提供只读锁诊断，不提供解除锁或自动恢复命令。方法 MUST 要求人工处置另有 Owner 明确授权、停止该目标所有写者并确认无占用、核对同一 token 与当前实际文件；无法确认或观察改变 SHALL 保留锁并停止处置。人工解除 SHALL 仅针对确认的残留锁，不改 Run / 指针 / 临时文件、不重提或关联占号，处置结果留在当前工作进展或授权记录。

#### Scenario: A stopped writer left an interpretable scene
- **WHEN** Owner 已单独明确授权人工处置，写者与任务占用均已核对停止，目标绝对路径和同一锁 token / 实际文件再次确认一致
- **THEN** 人工仅解除确认的残留锁并读回；已提交 Run 与未关联占号保留，随后重新查询并按当前真实状态决定显式后续工作，不把诊断输出当解除授权

#### Scenario: Writer ownership or state is uncertain
- **WHEN** 缺 Owner 授权、原写者可能仍活跃、pid 被复用 / 存活未知、存在其他写者，或 token / 文件变化
- **THEN** 不执行人工解除、抢锁、重提或回滚，报告需 Owner 核对的具体原因，保留现场

### Requirement: Product archive transition and terminal handoff

系统 SHALL 以当前合法 Archive Run 解释 product 归档过渡态，普通写入不能绕过。完整终态须与当前 binding 的编号 / 身份一致；只读历史完成事实允许 ordinal 小于项目累计数，不要求旧项等于当前最大值。正在提交 Archive 仍 MUST 按本次 countBasis / ordinal 校验，不能由目录消失猜成功。人工只读和历史说明边界保持。

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

### Requirement: Sequential explicit change association

open product Delivery SHALL 在本轮无活动项且当前交接完整时显式追加已有 Change，校验真实目标 / schema、当前范围、全 Delivery Change / 槽位唯一性及本轮依赖完成。同一工作批次追加成员；Reopen 后当前批次尚不存在时仅关联，不加入旧批次或预建新批次，新批次在首次实际 Run 建立。不替换历史项，不自动推进阶段。

首次 Open 的可选关联 MUST 对旧入口及显式记录化入口复用相同槽位 / 依赖准入；普通错误输入在创建首次状态目录前拒绝，锁内保留必要直接输入复核。

#### Scenario: Initial association depends on unfinished work
- **WHEN** 首次 Open 请求关联 B 且 B dependsOn A，但无已归档 A，无论是否提供 Author / actor
- **THEN** 写前拒绝 `change-dependency-not-archived`，不创建 `.mendi` 或占号；合法无依赖槽位仍可首次关联

#### Scenario: Correct a rejected initial slot
- **WHEN** 首次 Open 的槽位不存在，调用者改正为范围内合法无依赖槽位
- **THEN** 错误请求不留下 `.mendi`，正确请求可直接成功；记录化入口保存 001 与 openRunRef，旧入口不补 Run；已存在的真实中断现场仍拒绝普通 Open 覆盖

#### Scenario: Append an existing dependent change
- **WHEN** A 已完整归档，B dependsOn A，Owner 范围内显式指定上游已有 B 对应 Change 和未占用槽位
- **THEN** 追加 B 为唯一活动项、初始 Explore，旧项、范围与计数不变；B 加入当前批次但不新增 Run，另一进程读回同一关联

#### Scenario: Current work or dependencies prohibit binding
- **WHEN** 前项仍活动 / archiving / 交接不完整，依赖未归档，槽位或 Change 已占用、缺失、范围不符，或 Delivery 不是 open
- **THEN** bind 在提交前拒绝并说明实际原因，不抢锁、不替换已有项、不创建 Change 或批次占号

#### Scenario: Native facts are not activation authority
- **WHEN** 某项归档或上游 planning ready，而没有明确 bind 下一已有 Change 的请求
- **THEN** 保留当前交接，不自动追加、分配 Run、创建审核或激活下一项

#### Scenario: Bind the first new change after reopen
- **WHEN** Reopen 已完成，新范围的有效未占用槽位显式关联新 Change，currentBatchId 为 null
- **THEN** 新 binding 暂无 batchId / Run，旧批次与成员保持；首次实际开始才建立新批次并写 currentBatchId，不把旧 Close 或 PASS 当激活授权

### Requirement: Ordered product associations and shared batch identity

product bindings MUST 按追加顺序保留，只有最后项可非归档；活动项、唯一递增且不大于总数的 archiveOrdinal、各 binding / Run / batch 身份须一致。本轮范围可以不含旧 archived binding；非当前范围项只能为历史 archived。多个批次 SHALL 按真实首次 Run 保存互斥成员，currentBatchId 只选择本轮工作批次，Reopen 后可为 null；不读取历史正文猜当前对象。

#### Scenario: An appended change has no run yet
- **WHEN** 前项已有批次，第二项刚 bind，继承相同 batchId / 成员身份但尚无 latestRunRef
- **THEN** 记录合法，首次新 Run 复用该批次；旧批次成员不丢失，不因无新 Run 删除已有批次

#### Scenario: Binding order or batch membership contradicts identity
- **WHEN** 有多个非归档项、活动项不是最后追加项、旧编号倒序 / 重复 / 大于总数，或成员重复 / 未关联 / 与 Run 身份位置不符
- **THEN** 拒绝矛盾记录，不排序修复、不回退第一项或把占号目录当正式交接

#### Scenario: Version one and manual records remain bounded
- **WHEN** 读取原有单 Change version 1 product 或合法 manual-bootstrap 记录
- **THEN** 旧单批次 product 按既有范围解释，缺 currentBatchId 时只兼容原单批次；人工记录仍只读，不套用产品新规则或迁移历史；多个批次必须有明确当前选择，不能猜最后一项

#### Scenario: Reopen preserves old bindings outside the new scope
- **WHEN** 旧范围已 closed，Reopen 指定互不复用槽位的新范围，随后新批次保存真实新 Run
- **THEN** 历史 archived binding 与原 batchId / latestRunRef 保留，新范围只解释本轮 binding；每个批次成员与对应绑定一致，不把所有 binding 强塞进新批次

#### Scenario: Current batch membership is contradictory
- **WHEN** 当前批次含范围外成员、同一 Change 分属多个批次、Run 与原批次身份不一致，或非归档 binding 不在本轮范围
- **THEN** 拒绝矛盾记录，不迁移旧成员、不排序修复或扫描历史推断范围

### Requirement: Operation specific delivery verification inputs

系统 SHALL 按当前操作区分 Delivery 验收输入。普通查询读取入口、manifest、当前 Delivery Run 及该正式执行实际需要的直接结果 / 日志；不读旧 Archive / 审核正文或失败父链。正式执行另读本轮必要完成 / 审核及当前修复直接对象；Review 另读固定 Author。历史说明与未知 Ref 不成为前置，受管路径和身份检查 MUST 保留。

#### Scenario: Old change records are no longer query inputs
- **WHEN** 当前 Delivery Run 与必要直接结果有效，但此前 Archive、旧审核 / Author 正文或其他说明失效
- **THEN** 普通查询不要求补证；正式开始仍核对其本轮明确消费的完成 / 审核输入，不能借查询放宽来绕过操作必要审核

#### Scenario: Current reviewer has an unavailable fixed author
- **WHEN** 当前定向 Reviewer 头部有效，但固定 Author 缺失
- **THEN** 普通查询只解释当前头部，本地 draft save 可保存故障说明；开始 / 继续 / 正式提交所需 Author 的缺失只阻止相应操作

#### Scenario: Unrelated test result or extension is missing
- **WHEN** 当前必要输入有效，但普通旧测试结果、历史日志或未知 Ref 缺失
- **THEN** 查询不扫描这些结果，也不新增工程检查或 hash gate

### Requirement: Delivery verification and association conflicts

显式关联 SHALL 拒绝未完成 / unknown 的正式验收、修复 / Review 或生命周期写入，以及未解决失败。只有完成的 Open / Reopen 或合法既有交接允许本轮新关联；关联退出 deliveryRunRef 当前选择，保留 fullTestRunRef 作历史，不继承其适用性。Reopen 与新 Open MUST 使用各自显式授权及独立操作，不能由 bind 代做。

#### Scenario: Attempt to bind during a local repair
- **WHEN** 当前正式失败、repair draft / continuing、Review 待完成 / changes-requested / rejected 或 unknown 尚未处理，调用者请求新关联
- **THEN** 在写前拒绝交接冲突，保留失败、当前指针、归档绑定与完成数，不把新关联当作失败恢复

#### Scenario: A completed verification has later explicitly authorized work
- **WHEN** 当前正式操作已完整结束并且后续关联在已有规则和实际 Owner 授权下合法
- **THEN** 新活动 Change 按正常规则选择，旧正式 Run 保留作历史，不能自动宣称它覆盖新工作；Close / Reopen 不由 bind 代做
