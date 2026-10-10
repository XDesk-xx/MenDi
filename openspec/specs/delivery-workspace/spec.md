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

首次 Open MUST 拒绝任何已有 `.mendi/` 状态，包括完整项目、同名 Delivery 与未完成写入残留；重复调用 SHALL 不覆盖、不自动重新 Open，也不追加另一个 Delivery。首版更多 Delivery 与 Close / Reopen 操作属于后续能力。

#### Scenario: Duplicate open
- **WHEN** 用户再次对已经 Open 的目标执行同一或不同 ID 的 Open
- **THEN** 系统报告现有状态及相关位置，原项目入口、manifest 和历史材料字节不变

#### Scenario: Partial directory already exists
- **WHEN** 目标 `.mendi/` 已存在但缺少入口或有效 manifest
- **THEN** 系统报告不完整状态，保留残留，不把目标当作空项目自动重试或清理

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
