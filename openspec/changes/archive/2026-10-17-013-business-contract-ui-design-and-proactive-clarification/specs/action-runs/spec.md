## ADDED Requirements

### Requirement: Business contracts and iterative UI decisions

自有阶段方法 SHALL 区分稳定业务承诺、当前 UI 设计与未决产品决定。Explore 识别约束和候选，Propose 将业务承诺写入 specs、当前设计写入 design，并使 tasks / 验证对应实际用户结果。普通 UI 调整 MUST 不要求新建 Change；旧名称 / 路径的词面差异不得机械判为业务变化。角色权限、正确对象、数据完整性、状态与保存 / 发布 / 确认条件、历史及失败处理，以及 Owner 明确具有验收意义的 UI 要求，MUST 不被直接降格。

#### Scenario: Ordinary UI organization changes without a new change
- **WHEN** 菜单改位 / 改名、页面合并或分页改滚动，实际业务承诺与必要可达性仍成立
- **THEN** 方法指导在正常 UI 工作中更新设计和受影响测试，不因此新建 Change / Action，不因旧规格提及原名称或页面数量机械否决

#### Scenario: A label change affects the meaning of confirmation
- **WHEN** “保存草稿”改为“发布”等变化可能改变用户理解，或存在 Owner 明确的 UI 验收要求
- **THEN** 核对真实结果、确认语义及已有决定，未决取舍先问 Owner；不因 handler 未改或属于文案就认定等价，也不自动推导必须新建 Change

#### Scenario: An existing requirement differs from the current UI
- **WHEN** 当前 UI 与既有规格有名称 / 路径差异
- **THEN** 先判断它是实现措辞还是仍有效的业务 / 明确验收承诺；普通 UI 不增加 Change，真正承诺的未决变化按已有流程澄清处理，不能仅用 design 说明自动豁免，也不倒改旧归档、Run 或 verdict

#### Scenario: Author and reviewer apply the same distinction
- **WHEN** Review Explore 核对固定 Author 的约束 / 候选 / proof，或 Review Propose 核对正式产物
- **THEN** 自有 Review 方法独立核对业务与设计粒度、真实用户影响和重要假设来源；不要求继承 Author 上游方法，不以旧词面、测试绿或交接成功代替语义判断

### Requirement: Proactive clarification of material product uncertainty

Explore / Propose 方法 SHALL 先查项目事实和已确认决定，再对会改变目标、角色、范围、核心流程、权限、默认行为、数据保留、兼容 / 历史处理、不可逆后果或验收的关键未知，向 Owner 提具体问题并说明影响及有依据的建议。答案未到 MUST 暂停依赖部分的定稿，允许独立调查继续；不能把假设、沉默或等待当批准。Review SHALL 核对必要提问与答案承接；低影响可逆细节自行判断并简记，不新增统一问答台账、Run 或审批层。

#### Scenario: An unconfirmed deadline changes the submitted result
- **WHEN** 默认截止及其时区 / 请求值影响实际提交结果，而已有材料无法确定预期
- **THEN** Author 提问这一产品决定，Propose 不自行选值并写成已确认要求；显示、请求及服务器条件按答案形成一致验收，Reviewer 核对答案来源

#### Scenario: Unanswered non UI retention policy
- **WHEN** 非 UI 工作的保留期限或不可逆处理仍未知，Owner 尚未回答
- **THEN** 同样先问，暂停依赖答案的方案定稿而继续独立调查；不能默认一个期限或因等待已久就实施

#### Scenario: A decision or fact is already available
- **WHEN** Owner 已明确普通 UI 不新建 Change，或技术栈 / 当前事实可直接查证，余下只是低影响可逆实现细节
- **THEN** 沿用决定、先查事实并自行处理该细节，不重复问卷、不重新要求批准已确认方向

#### Scenario: Proposal hides a material assumption
- **WHEN** Author 未确认的重要假设被写成确定规格，或问答与实际范围 / 设计 / 验收不一致
- **THEN** Reviewer 指出对应缺口，依现有独立审核给出结论，不由工具加载成功、结构检查或材料数量自动批准
