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

`status` 与 `next` SHALL 使用同一只读状态解释，展示目标、Delivery 范围、本地关联和相关 OpenSpec 事实。系统 MUST 区分本地协作阶段与上游产物 readiness；查询 SHALL 不创建文件、推进阶段、分配 Run 或执行推荐操作。

#### Scenario: Prepared project without a delivery
- **WHEN** 查询有效 OpenSpec 目标且 `.mendi/` 不存在
- **THEN** 状态显示 MenDi 尚未 Open，下一步提示 `delivery-open`，文件保持不变

#### Scenario: Delivery without a change
- **WHEN** 查询一个合法的产品 Delivery 且尚无 Change 关联
- **THEN** 状态显示已有范围，下一步提示明确选择已有 Change 后执行 `change-bind`，不创建 Change

#### Scenario: Upstream proposal is ready
- **WHEN** 本地关联阶段为 Explore，而上游 proposal 为 ready 或所有规划文件已齐备
- **THEN** next 仍展示本地 Explore，并说明阶段执行能力待后续实现，不自动改为 Propose 或 Apply，不把上游事实解释为批准

#### Scenario: Bound change disappears
- **WHEN** manifest 当前活动 Change 无法从上游读回
- **THEN** 查询报告引用失效并展示关联位置，不忽略关联或将 Delivery 判为可继续

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

系统 SHALL 只要求当前操作实际读取的必要输入存在。status / next MUST 读取项目入口及当前 Delivery manifest；存在当前活动 Change 时 MUST 校验其活动路径及上游 status。系统 SHALL 保留身份校验、受管路径越界检查和既有写入安全规则，但 SHALL 不递归按字段名 `Ref` 推导存在性依赖。

#### Scenario: Historical links and unknown extensions are unavailable
- **WHEN** 人工记录的历史 Run、旧方案、说明链接或未知 Ref 扩展缺失、非路径或指向不可用位置，但必要输入有效
- **THEN** 查询保留这些说明字段并成功返回，不读取说明目标、不补证、不重写记录

#### Scenario: Required current input is unavailable
- **WHEN** project.json、当前 manifest 或当前活动 Change 缺失或损坏
- **THEN** 查询返回失败并指出实际输入问题，不因历史说明被放宽而静默忽略必要输入

### Requirement: Manual archived change handoff

系统 SHALL 只读解释 manual-bootstrap 中 `state:archived` 的 binding，其 changeRef MUST 为 `openspec/changes/archive/YYYY-MM-DD-<changeId>`；显式提供正整数 archiveOrdinal 时 MUST 使用 `openspec/changes/archive/YYYY-MM-DD-NNN-<changeId>`，NNN 为该编号补足至少三位，且该 Change MUST 不再是 activeChangeId。系统 SHALL 不因目录消失自动推断归档、不补建活动目录、不调用已归档 Change 的活动 status。此兼容 SHALL 不实现 Archive Action 或代签归档效果。

#### Scenario: Query after manual archive handoff
- **WHEN** 人工 binding 已记录正确归档路径并清空当前 Change，旧活动目录不存在
- **THEN** status / next 显示本地 archived binding 和原人工 next，upstream 为 null，查询不改文件且不执行活动 Change status；归档路径仅作为定位信息，不读取其内容或要求存在

#### Scenario: Inconsistent archive record
- **WHEN** archived binding 仍为活动 Change，归档路径缺失 / 身份不一致，或非 archived binding 伪用归档路径
- **THEN** 系统拒绝矛盾记录，不伪装活动 Change 或从上游 ready 推断归档
