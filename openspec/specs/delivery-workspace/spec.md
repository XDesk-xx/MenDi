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

系统 SHALL 允许首次 Open 的可选 `--change` 或之后的 `change bind`，把上游已存在的 Change 关联到一个计划槽位并设为当前 Change，初始协作阶段为 Explore。关联 MUST 验证目标、Change schema、槽位与唯一性；首版不切换已有当前 Change，不自动激活第二个 Change或生成审核批准。

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

`status` 与 `next` SHALL 使用同一只读状态解释，展示目标、Delivery 范围、本地关联、当前产品 Run 和相关 OpenSpec 事实。系统 MUST 区分本地协作进展与上游产物 readiness；查询 SHALL 不创建文件、推进阶段、分配 Run 或执行推荐操作。无当前产品 Run 时保留初始 Explore 提示；人工 next 仍明确标注来源而不转为产品执行事实。

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
- **WHEN** manifest 当前活动 Change 无法从上游读回
- **THEN** 查询报告引用失效并展示关联位置，不忽略关联或将 Delivery 判为可继续

#### Scenario: Product run is read after process exit
- **WHEN** product binding 的 latestRunRef 指向有效当前 Run，新进程读取 status / next
- **THEN** 显示同一 Action、Run 状态、进展结果及最小 next，只解析该当前记录，不读取全部历史 Run 正文或递归说明链

#### Scenario: Manual progress remains manual
- **WHEN** manual-bootstrap manifest 中存在最新 Run 与 Reviewer 交接引用
- **THEN** 查询保留人工 next 和说明来源，不读取这些 Run 作为新增产品运行前提、不认证其语义或调用产品写入

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

系统 SHALL 按当前操作要求实际必要输入。status / next MUST 读取入口、manifest、当前活动 Change 的路径 / 上游 status，以及指定的当前 product Run。Action 开始 / 继续 / Owner 处置和正式 submit SHALL 保留上游与相应方法 / 固定 Author 校验；draft save 仅依赖本地配置、活动路径、当前 draft、身份、正文和安全写入。只读诊断 SHALL 不启动上游、不扩大为历史读取；人工历史与未知 Ref 不自动成为依赖。

#### Scenario: Historical links and unknown extensions are unavailable
- **WHEN** 人工记录的历史 Run、旧方案、说明链接或未知 Ref 扩展缺失、非路径或指向不可用位置，但必要输入有效
- **THEN** 查询保留这些说明字段并成功返回，不读取说明目标、不补证、不重写记录

#### Scenario: Required current input is unavailable
- **WHEN** project.json、当前 manifest、当前活动 Change 或实际需要的当前 product Run 缺失或损坏
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
