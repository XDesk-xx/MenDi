## MODIFIED Requirements

### Requirement: Draft save and immutable submission

系统 SHALL 仅允许当前 product draft 的同角色 / 同操作者保存正文，使用明确根、有效本地配置、活动 binding、当前 Run、明确正文输入及安全写入；保存 MUST 不依赖上游进程、方法正文或固定 Author 正文。正式提交 SHALL 继续校验上游、非空正文、result、outcome 和必要固定 Author / verdict。已提交 Run MUST 不允许保存或重提；陈旧输入、冲突或读回失败 MUST 非零退出并保留现场。

#### Scenario: Save a draft and submit progress
- **WHEN** 当前 draft 的原操作者保存 Markdown 工作记录，再以 continuing 提交
- **THEN** Run 在跨进程读回时为 submitted / continuing，正文和结果真实保留，Action 仍未完成

#### Scenario: A submitted or stale run is edited
- **WHEN** 对已提交 Run 保存 / 重提，或操作引用已不是当前 draft 的 Run
- **THEN** 系统拒绝写入，不改旧正文、结果或交接

#### Scenario: Save a failure note while the selected tool is unavailable
- **WHEN** 上游 status 失败或固定入口不可用，但本地配置、当前活动 Change 路径及同 actor / role 的 draft 和正文有效
- **THEN** 保存并读回 draft 正文，仍为未提交；结果明确 local-only，不执行上游，不认为阶段完成，正式 submit 仍因上游失败而拒绝

#### Scenario: A local save has invalid required input
- **WHEN** 本地配置 / 当前 Change / Run / 正文缺失或损坏，actor / role 不匹配，受管路径不安全，或存在写入锁
- **THEN** 保存失败并说明实际输入，不回退旧 Run 或其他项目，不覆盖正文、不清理锁、不因上游检查放宽而绕过本地边界

#### Scenario: Reviewer saves notes without the fixed author file
- **WHEN** 当前 Reviewer draft 有效但固定 Author 正文缺失
- **THEN** 可仅保存 Reviewer draft 的故障说明；正式 Review continue / submit 仍要求固定完整 Author，不生成 verdict 或批准

#### Scenario: Draft replacement committed before readback failed
- **WHEN** 保存 draft 已 rename 替换正式文件，随后读回失败
- **THEN** 非零退出并保留实际新正文、锁和错误，不为维持失败前字节而回滚，不重提，不改任何旧 submitted Run

## ADDED Requirements

### Requirement: Stage-scoped artifact instructions

系统 SHALL 为当前 product Explore / Propose 及相应 Review Action 提供显式只读 artifact 指引；Explore 仅支持 proposal 背景，Propose 支持 proposal、specs、design、tasks。系统 MUST 核对当前 actionId 和阶段并读取目标真实指引；不要求全部 artifact 已 ready，不代写文件。返回的直接依赖和约束 SHALL 由 Agent 按当前工作消费，查询不自动执行依赖或生成完成结论。

#### Scenario: Read the next planning artifact
- **WHEN** 当前 Propose Action 请求 specs 指引且 proposal 已存在
- **THEN** 返回真实 specs 指引、输出 pattern、proposal 依赖及对应 context / rules，当前 Run 和 next 不变，由 Author 读取依赖并编写 delta

#### Scenario: Guidance is requested for an unfinished prerequisite
- **WHEN** 当前 Propose 请求尚被前置依赖阻挡的 artifact 指引
- **THEN** 返回上游实际依赖 done 状态，不伪报 ready / done，不自动创建前置产物；Agent 按实际上游条件决定补充当前必要工作

#### Scenario: Action or phase is not supported
- **WHEN** 指定陈旧 actionId、Explore 请求非 proposal，或 Apply / Archive 阶段请求本轮指引入口
- **THEN** 非零退出且不分配 Run、不改交接、不回退为其他阶段；后续阶段接线维持独立范围

### Requirement: Explicit owner resolution of blocked work

系统 SHALL 仅接受显式声明 Owner、非空决策原因、当前 Run、接收角色 / actor 和模式的受限处置：handoff 未完成的 Explore / Propose 工作，或 revise 当前 rejected 的同阶段 Author。操作 MUST 依赖实际 Owner 授权，CLI 只记录声明，不认证身份。处置 SHALL 分配新 draft 并保存直接 Owner 决策，保留旧 Run / verdict；不生成批准、提交或跨阶段回退。

#### Scenario: Hand off an unfinished author action
- **WHEN** Owner 明确把当前 Author draft 或 submitted / continuing 的 Explore / Propose 工作交给不同 actor，接收角色和阶段相同
- **THEN** 新 draft 保持 actionId、阶段和已有修订对象，承接当前工作正文，保存直接来源和 Owner 原因；旧记录不变，旧 actor 对旧 draft 的保存 / 提交因陈旧而拒绝

#### Scenario: Hand off an unfinished reviewer action
- **WHEN** Owner 明确把未完成的 Review Explore / Review Propose 交给另一 Reviewer，固定完整 Author 有效且接收 actor 不同于 Author
- **THEN** 新 draft 保持 review actionId 与 authorRunRef，仅交接审核进展，不让 Author 重做；原 Review Run 和 Author 提交不变，新 Reviewer 继续独立核对后显式提交

#### Scenario: Resolve a rejected stage with a new revision
- **WHEN** 当前完整 Review verdict 为 rejected，Owner 明确要求同阶段 Author 修订，且直接 Author 输入有效
- **THEN** 新建该阶段 revise Action / draft，revisesRunRef 指向被拒绝的 Author，记录 Owner 决策；旧 rejected 原样保留，新 Author 完成后 next 指向新的独立 Review

#### Scenario: Resolution is invalid or tries to bypass review
- **WHEN** 非 Owner 声明、缺原因、当前 Run 陈旧、接收角色 / 阶段矛盾、同 actor 无需交接、Reviewer 与 Author 同 actor、输入缺失，或试图交接 complete / 用 revise 处理非 rejected / 回退其他阶段
- **THEN** 写前拒绝，原当前指针、Run 和 verdict 保持不变；普通 start / continue 不因此获得 rejected 恢复权限

#### Scenario: A resolution fails during persistence
- **WHEN** Owner 处置分配新 Run 后 manifest 提交或读回失败
- **THEN** 按既有独占写入失败边界保留现场、占号及旧记录并非零退出，不伪报接管成功、不自动关联或重试

### Requirement: Direct owner decision recorded in the receiving run

由 Owner 处置生成的 Run SHALL 保存模式、Owner 声明 actor / 原因、直接 sourceRunRef、接收角色 / actor 与阶段；这些字段 MUST 与新 Run 身份一致。普通状态查询 SHALL 校验声明结构和当前身份，但不读取来源历史正文；后续同 Action 继续保留最近决策说明，不积累决策链。正常旧 Run 无此字段 SHALL 保持可读，未知扩展不自动变成必要输入。

#### Scenario: Read the receiving draft in a new process
- **WHEN** 新进程读取 Owner handoff / revise 后的当前 Run
- **THEN** 展示接收角色、actor 和最近 Owner 决策说明，next 为当前 draft 的保存 / 提交提示，不声称 Owner 已完成 Author 工作或 Reviewer 已 approved

#### Scenario: Historical source is no longer readable
- **WHEN** 当前 Run 的 Owner 决策结构与身份有效，但 sourceRunRef 的旧正文已不可用
- **THEN** status / next 仍可读取当前 Run，不扫描历史；新的处置只验证其当前直接输入和必要固定 Author，不倒查整条决策链

### Requirement: Explore and proposal methods with independent review

阶段方法 SHALL 明确 Author Explore 的问题 / 核心 proof / 限制、Review Explore 的独立检查、Propose 的按实际 instructions / 依赖 / 项目约束形成连贯产物，以及 Review Propose 的范围与可实施性核对。Explore 分析与 proof 摘要 SHALL 保存于 Run，原始材料存 artifacts 或受控位置；不要求新建 explore.md。已有受审探索文件 MUST 保留，方法选择或工具成功不得生成批准。

#### Scenario: Complete exploration and start planning
- **WHEN** Author 已保存关键实验依据，独立 Reviewer 明确批准当前 Explore 提交
- **THEN** 后续显式 Propose 沿用当前有效结论，读取实际依赖并形成 proposal、design、delta specs、tasks，新的方案完成后停在独立 Review Propose

#### Scenario: Existing exploration files were already reviewed
- **WHEN** 已提交 Author / Reviewer 历史直接引用旧 explore.md
- **THEN** 该文件保持历史原样，不为统一规则删除 / 改写或补建其他旧文件；新分析进入新 Run，有效决策在正式方案产物收敛

#### Scenario: Tools succeed without semantic acceptance
- **WHEN** instructions 可读、proof 命令或结构验证通过，但实际产物与约束 / 关键结果不一致
- **THEN** Reviewer 按实际内容给出修改要求或拒绝，不从工具成功生成批准；实质修订另建记录，不修改旧 verdict
