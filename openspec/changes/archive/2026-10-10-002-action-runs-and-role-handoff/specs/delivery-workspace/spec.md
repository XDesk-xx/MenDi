# Spec Delta

## MODIFIED Requirements

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

### Requirement: Operation-specific input checks

系统 SHALL 只要求当前操作实际读取的必要输入存在。status / next MUST 读取项目入口及当前 Delivery manifest；有当前活动 Change 时 MUST 校验活动路径及上游 status；product binding 指定 latestRunRef 时 MUST 读取其当前 Run。人工历史 Run 和未知 Ref SHALL 不自动成为依赖。Action / Run 操作 SHALL 按需要读取当前 Run、选中方法、正文输入或固定 Author 提交，并保留身份、受管路径及写入安全检查。

#### Scenario: Historical links and unknown extensions are unavailable
- **WHEN** 人工记录的历史 Run、旧方案、说明链接或未知 Ref 扩展缺失、非路径或指向不可用位置，但必要输入有效
- **THEN** 查询保留这些说明字段并成功返回，不读取说明目标、不补证、不重写记录

#### Scenario: Required current input is unavailable
- **WHEN** project.json、当前 manifest、当前活动 Change 或实际需要的当前 product Run 缺失或损坏
- **THEN** 查询返回失败并指出实际输入问题，不因历史说明被放宽而静默忽略必要输入

#### Scenario: A review-only input is missing
- **WHEN** 当前 Reviewer Run 有效，但固定 authorRunRef 指向缺失文件或阶段 Skill 已不可用
- **THEN** 普通 status / next 展示当前记录而不读取这些目标；开始 / 继续需要的方法缺失、Review continue / submit 需要的 Author 缺失分别只阻止对应操作

#### Scenario: Managed input escapes the project
- **WHEN** 操作实际读取的 latestRunRef、authorRunRef 或写入位置越界、经 junction 指向外部或与身份不一致
- **THEN** 该操作拒绝使用此输入并指出问题，不因为说明 Ref 放宽而放宽实际读写安全

## ADDED Requirements

### Requirement: Distinguishable inactive change display

系统 SHALL 在人读查询中区分未关联任何 Change 与已有 archived binding、当前无活动 Change；后者 MUST 明示已归档与无活动状态。显示说明 SHALL 不以读取归档内容认证完成、不补建活动目录、不调用旧活动 status，且 SHALL 不改变原 JSON 身份或人工交接。

#### Scenario: There has never been a change association
- **WHEN** Delivery 没有关联记录且 activeChangeId 为 null
- **THEN** 人读输出表示尚未关联，保留原下一步提示

#### Scenario: Archived work has no active change
- **WHEN** manual-bootstrap 有合法 archived binding 且 activeChangeId 为 null
- **THEN** 人读输出说明“已归档、当前无活动 Change”，JSON 保持 archived binding 与 upstream:null；不显示成从未关联
