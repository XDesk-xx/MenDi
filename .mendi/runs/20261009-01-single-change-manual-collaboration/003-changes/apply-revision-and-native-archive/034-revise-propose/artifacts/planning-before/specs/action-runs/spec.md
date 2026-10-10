# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit action recording

系统 SHALL 通过显式 Action 开始与继续操作组织当前 product Delivery 的已关联活动 Change，要求类型、声明角色与稳定操作者标识，返回本次 Run 和实际阶段方法。系统 MUST 拒绝人工 bootstrap 写入、不支持类型、错角色、非当前目标或不合法的当前交接；开始 / 继续只准备工作记录；显式 Archive 开始仅在当前 Review Apply 完成且 approved 时准备 Author draft，实际归档须再显式执行。

#### Scenario: Start the initial author action
- **WHEN** open product Delivery 已关联活动 Change、尚无当前 Run，Author 显式开始 explore
- **THEN** 系统保存一个 draft Run，分配 Action 身份，返回实际 Explore 方法，保留 OpenSpec 和目标已有材料

#### Scenario: Wrong role or unsupported operation
- **WHEN** 类型为 review-explore 却声明 author，或请求 review-archive / revise-archive / Delivery 操作、非当前 Change 或人工记录写入
- **THEN** 操作在业务写入前拒绝，指出类型、角色、目标或格式问题，不代签批准或迁移历史

### Requirement: Explicit owner resolution of blocked work

系统 SHALL 仅接受显式声明 Owner、非空决策原因、当前 Run、接收角色 / actor 和模式的受限处置：handoff 未完成的 Explore / Propose / Apply 工作，或 revise 当前 rejected 的同阶段 Author。操作 MUST 依赖实际 Owner 授权，CLI 只记录声明，不认证身份。处置 SHALL 分配新 draft 并保存直接 Owner 决策，保留旧 Run / verdict；不生成批准或提交；跨阶段回退仅按独立的显式 rollback 边界处理。

#### Scenario: Hand off an unfinished author action
- **WHEN** Owner 明确把当前 Author draft 或 submitted / continuing 的 Explore / Propose / Apply 工作交给不同 actor，接收角色和阶段相同
- **THEN** 新 draft 保持 actionId、阶段和已有修订对象，承接当前工作正文，保存直接来源和 Owner 原因；旧记录不变，旧 actor 对旧 draft 的保存 / 提交因陈旧而拒绝

#### Scenario: Hand off an unfinished reviewer action
- **WHEN** Owner 明确把未完成的 Review Explore / Review Propose / Review Apply 交给另一 Reviewer，固定完整 Author 有效且接收 actor 不同于 Author
- **THEN** 新 draft 保持 review actionId 与 authorRunRef，仅交接审核进展，不让 Author 重做；原 Review Run 和 Author 提交不变，新 Reviewer 继续独立核对后显式提交

#### Scenario: Resolve a rejected stage with a new revision
- **WHEN** 当前完整 Review verdict 为 rejected，Owner 明确要求同阶段 Author 修订，且直接 Author 输入有效
- **THEN** 新建该阶段 revise Action / draft，revisesRunRef 指向被拒绝的 Author，记录 Owner 决策；旧 rejected 原样保留，新 Author 完成后 next 指向新的独立 Review

#### Scenario: Resolution is invalid or tries to bypass review
- **WHEN** 非 Owner 声明、缺原因、当前 Run 陈旧、接收角色 / 阶段矛盾、同 actor 无需交接、Reviewer 与 Author 同 actor、输入缺失，或试图交接 complete / 用 revise 处理非 rejected / 用普通 revise 回退其他阶段
- **THEN** 写前拒绝，原当前指针、Run 和 verdict 保持不变；普通 start / continue 不因此获得 rejected 恢复权限

#### Scenario: A resolution fails during persistence
- **WHEN** Owner 处置分配新 Run 后 manifest 提交或读回失败
- **THEN** 按既有独占写入失败边界保留现场、占号及旧记录并非零退出，不伪报接管成功、不自动关联或重试

### Requirement: Direct owner decision recorded in the receiving run

由 Owner 处置生成的 Run SHALL 保存handoff / revise / rollback 模式、Owner 声明 actor / 原因、直接 sourceRunRef、接收角色 / actor 与目标阶段；这些字段 MUST 与新 Run 身份一致。普通状态查询 SHALL 校验声明结构和当前身份，但不读取来源历史正文；后续同 Action 继续保留最近决策说明，不积累决策链。正常旧 Run 无此字段 SHALL 保持可读，未知扩展不自动变成必要输入。

#### Scenario: Read the receiving draft in a new process
- **WHEN** 新进程读取 Owner handoff / revise / rollback 后的当前 Run
- **THEN** 展示接收角色、actor 和最近 Owner 决策说明，next 为当前 draft 的保存 / 提交提示，不声称 Owner 已完成 Author 工作或 Reviewer 已 approved

#### Scenario: Historical source is no longer readable
- **WHEN** 当前 Run 的 Owner 决策结构与身份有效，但 sourceRunRef 的旧正文已不可用
- **THEN** status / next 仍可读取当前 Run，不扫描历史；新的处置只验证其当前直接输入和必要固定 Author，不倒查整条决策链

## ADDED Requirements

### Requirement: Stage-scoped operation instructions

系统 SHALL 为当前 Apply / Review Apply / Revise Apply 和 Archive 提供显式只读 operation 指引，分别采用真实 Apply / Archive 协议。请求 MUST 对应当前 actionId 与操作阶段，且不能同时指定 artifact。系统 SHALL 保留工具返回的状态与 context / operationGuidance，不代写任务、执行归档或生成批准；受限 artifact 入口保持既有行为。

#### Scenario: Read apply guidance for the current implementation action
- **WHEN** 当前 Apply 阶段请求 operation=apply，上游提供具体 contextFiles、tasks、progress、state 和操作指导
- **THEN** 返回实际输入与完成 / 缺失状态，当前 Run 与交接不变；blocked 或 all_done 不被转换成实施或审核结论

#### Scenario: Read archive guidance without inventing artifact fields
- **WHEN** 当前 Archive 请求 operation=archive，活动 Change 尚可读取
- **THEN** 返回当前目标的实际 context / operationGuidance，schema 从必要状态核对，不要求上游没有返回的 template 或 schemaName

#### Scenario: Operation selection is stale or inconsistent
- **WHEN** Action ID 陈旧、operation 与阶段不同、artifact / operation 同时提供或必要上游输入不可用
- **THEN** 写前拒绝，不能退回其他阶段或把保存的旧指引表述为本次真实上游读取

### Requirement: Explicit earlier phase rollback

系统 SHALL 仅在实际 Owner 明确请求 rollback 时，接受 Propose / Apply 及其 Review / revise 工作退回较早 Explore / Propose，或未执行 / 已证实无原生效果的 Archive 准备工作退回 Apply / Propose / Explore。输入 MUST 指定当前 Run、目标阶段、同 Change 已完成目标 Author、接收 Author 与原因。系统 SHALL 新建目标阶段 revise draft，不改旧 Run、verdict、产物或实现；新提交 MUST 重新审核并按顺序继续。

#### Scenario: Return from apply to a completed proposal author
- **WHEN** Owner 对当前 Apply 或 Review Apply 显式指定较早 Propose Author 请求 rollback
- **THEN** 新建 revise-propose draft，直接修订对象为指定 Author，决策来源为原当前 Run；完成后推荐新 Review Propose，过去 approved 不允许直接进入 Apply

#### Scenario: Return to exploration without erasing implementation
- **WHEN** Owner 对当前 Propose / Apply 工作指定较早 Explore Author 请求 rollback
- **THEN** 新建 revise-explore，重新经过 Review Explore / Propose / Review Propose 后才可 Apply；旧产物与已写实现保留，必要调整由新工作说明

#### Scenario: Rollback input is unsafe or does not point backwards
- **WHEN** 非 Owner、缺原因、当前对象陈旧、目标未完成 / 非 Author / 错 Change / 越界、目标不是更早阶段，或归档效果已发生 / 未知 / 当前调用仍在进行
- **THEN** 写前拒绝且原记录不变，不猜目标历史或重开已归档 Change

#### Scenario: Rollback persistence is interrupted
- **WHEN** 新修订 Run 已创建，但当前指针替换或读回失败
- **THEN** 非零退出并保留占号、锁与真实现场，不覆盖旧审核或把新工作伪报为已提交

#### Scenario: Abandon an archive that has no native effect
- **WHEN** Owner 对未调用原生或已重新确认证实无效果的当前 Archive draft，显式指定较早完整 Author 请求 rollback
- **THEN** 保留 Archive 尝试与错误，恢复普通活动 binding 并新建目标 revise draft；旧 approved 不再作为当前交接，后续必须重新审核，不直接复活旧 Review

### Requirement: Approved native archive execution

系统 SHALL 将 Archive 作为 Author Action，要求当前完成且 approved 的 Review Apply、它固定的完整 Author、真实 Apply all_done 及有效操作输入。准备 MUST 不执行归档；实际执行 SHALL 再复核直接对象和安全位置，只调用固定 OpenSpec 的原生同步归档路径一次，不由 Skill 重复同步。任务全勾、工具成功或历史批准 MUST 不代替当前独立批准。

#### Scenario: Prepare and explicitly execute an approved archive
- **WHEN** 当前 Review Apply approved，直接 Author 有效、任务完成，Author 先准备 Archive 再显式执行
- **THEN** 准备返回实际 Archive 方法和 draft；执行记录当前必要输入与尝试，实际调用原生 Archive 并读回结果，不自动执行 Git 或 Delivery 收口

#### Scenario: Tasks or the current review are not sufficient
- **WHEN** 任务仍未勾、Apply blocked、固定 Author 不可用、当前审核不是 approved，或修订之后仍试图引用过去批准
- **THEN** 在原生调用前拒绝，计数与规格不变，不用 --yes 绕过产品前置

#### Scenario: A native call reports failure
- **WHEN** 原生归档非零退出、超时或返回不可用的机器结果
- **THEN** 保存实际响应与失败，不据退出码推断没有效果；观察活动 / 归档目录及受影响规格后分别报告无效果、已确认效果或未知

#### Scenario: A second executor races with the first
- **WHEN** 两个进程对同一准备记录执行 Archive，或必要输入在写前变化
- **THEN** 独占锁与当前对象复核拒绝第二写者或变化输入，不发生两次原生效果、不删除原锁

### Requirement: Observed archive effects and bounded finish

系统 SHALL 保存本次 Archive 的直接意图、调用状态和必要原始结果；发生错误时保留现场。显式 finish MUST 只核对并收口指定的当前操作，不调用原生 Archive。已观察完成的原生效果 SHALL 不被再次同步；未知、冲突或无法确认的现场 MUST 停止。原生重试仅能在显式 execute 且证明确无效果、重新核对批准与输入后进行，不自动重试。

#### Scenario: Native success is followed by local failure
- **WHEN** 原生已经同步并移走 Change，编号改名、计数 / Run / manifest 提交或最终读回失败
- **THEN** 非零退出并保留实际材料和当前尝试；新的显式 finish 只补本地收口，不重复原生调用或同步

#### Scenario: The native result was lost but the effect is observable
- **WHEN** 调用标记已保存但响应未完整保存，当前同一 Change 的唯一原生或编号目录、元数据与受影响规格符合本次输入
- **THEN** finish 可基于读回确认原生效果，保存确认依据并继续本地收口，不从旧预定日期猜目录或重新执行原生 Archive

#### Scenario: A failure is proved to have no effect
- **WHEN** 已确认活动输入与受影响主规格保持调用前内容，未出现本次归档目录，当前批准和任务重新有效，用户显式再次 execute
- **THEN** 保存旧错误并建立新尝试后才可原生调用，未完成的 finish 不会发起该调用；计数在实际成功前不增加

#### Scenario: The scene is uncertain or changed
- **WHEN** 活动与归档同时存在、候选目录不唯一、路径 / 身份不符、规格或批准变化、计数冲突、输入证据缺失或仍有锁
- **THEN** 保留错误并停止，不补目录、改历史、强制同步、覆盖目标、抢锁或提供通用恢复

#### Scenario: Finish is repeated after a completed archive
- **WHEN** 指定的是已经完整收口的同一 Archive，当前计数、编号 binding 与最终 Run 一致
- **THEN** 返回 already-completed 的本地读回，原生调用次数、归档数、Run 编号和正文均不变

### Requirement: Archive draft and terminal submission

Archive Run SHALL 保存直接 Review / Author 与本次归档必要信息，执行前及尚未确认原生效果时为 draft；仅 execute / finish 在确认效果后可写 submitted / complete、result=archived。系统 MUST 在计数、Run 与 binding 完整读回后才报告归档完成，终态 Run 已写而交接未完仍是待收口。普通 save SHALL 只保存当前同 actor / role 的故障笔记；普通 submit、continue 或 review / revise-archive MUST 不生成完成。完成 Run MUST 保持不可改写，有限收口不能制造新 Reviewer verdict。

#### Scenario: Save notes without certifying external effects
- **WHEN** 当前 Archive draft 的原 Author 显式保存工作或错误说明
- **THEN** 仅保存本地正文，不访问上游、不修改归档尝试信息或设置 archived；活动目录已移走时只按合法当前归档过渡态检查

#### Scenario: A generic submission attempts to skip execution
- **WHEN** 用户对 Archive 使用普通 run submit、action continue 或不支持的 review / revise 类型
- **THEN** 操作拒绝，不因调用者填写结果而标记完成或增加计数

#### Scenario: Terminal archive run was written before the binding committed
- **WHEN** Archive submitted / complete 已落盘，随后 manifest 更新失败
- **THEN** 查询仍报告过渡态；显式 finish 核对已完成 Run 并只补剩余本地交接，不改该完成正文或重复原生归档

### Requirement: Review apply maintainability observations

Review Apply 方法 SHALL 报告 src / tests / scripts 中维护代码物理行数最多的前三名、不足三个全部列出，并说明当前明显增长 / 职责混杂及维护结论。无可靠历史基准 MUST 不补造增长。观察 SHALL 只进入当次审核摘要，不建立硬行数门槛、独立台账、hash 清单或产品查询依赖；本轮继续扩展的混杂职责须先整理再扩展。

#### Scenario: A mixed responsibility file will grow in the current change
- **WHEN** 当前修改继续增加一个已经混合操作、指引和处置职责的文件
- **THEN** Author 按受审任务先整理实际职责，Reviewer 核对整理 / 覆盖和增长，不能只留给下次处理或为压行数增加转发层

#### Scenario: A bounded historical experiment is retained
- **WHEN** 已受审旧 proof 不再扩展，新产品验收进入独立测试，当前仍有较长完整流程
- **THEN** 保留旧材料与结果，并说明适用范围及下次整理触发条件，不仅因行数要求重写历史或重跑全部旧实验
