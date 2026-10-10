# Spec Delta

## MODIFIED Requirements

### Requirement: Read-only status and next

`status` 与 `next` SHALL 使用同一只读状态解释，展示目标、Delivery 范围、本地关联、当前产品 Run 和相关 OpenSpec 事实。系统 MUST 区分本地协作进展与上游产物 readiness；查询 SHALL 不创建文件、推进阶段、分配 Run 或执行推荐操作。归档处理中 / 完成态按当前 Archive Run 与 binding 解释，不调用已移走 Change 的活动 status；无当前产品 Run 时保留初始 Explore 提示；人工 next 仍明确标注来源而不转为产品执行事实。

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

### Requirement: Operation-specific input checks

系统 SHALL 按当前操作要求实际必要输入。普通 status / next MUST 读取入口、manifest、当前活动 Change 的路径 / 上游 status 和当前 product Run；合法 Archive 过渡 / 完成态只读取必要本地绑定及当前 Archive Run，不要求旧活动路径。Action 开始 / 继续 / Owner 处置和正式 submit SHALL 保留上游与相应方法 / 固定 Author 校验；draft save 依赖本地配置、普通活动路径或合法 Archive 过渡态、当前 draft、身份、正文和安全写入；Archive execute 与 finish 分别检查实际前置和当前归档直接输入。只读诊断 SHALL 不启动上游、不扩大为历史读取；人工历史与未知 Ref 不自动成为依赖。

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

## ADDED Requirements

### Requirement: Product archive transition and terminal handoff

系统 SHALL 只在当前合法 Archive Run 与 product binding 一致时解释归档过渡态；普通 Action 写入 MUST 被阻止。只有累计计数、submitted / complete Archive Run 和 numbered archived binding 完整一致时 SHALL 报告完成，清空 activeChangeId 并显示已归档 / 无活动 Change。过渡态 MUST 不因源目录消失而猜成功，manual-bootstrap 兼容和只读边界保持。

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

### Requirement: Cumulative archive ordinal and idempotent local commit

成功归档 SHALL 使用项目累计正整数 archiveOrdinal 和真实原生日期，目录为 YYYY-MM-DD-NNN-change-id，跨日期 / Delivery 连续且不复用。准备与失败 MUST 不增加完成数。实际效果确认后的本地提交 SHALL 只接受本次计数基准或预定新值，完整读回才报告成功；中断后的显式 finish MUST 识别已写部分，不重复增长或改完成 Run。

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
