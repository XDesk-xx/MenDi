# Run Post-submission Specification

## Purpose

本能力允许符合当前轮严格资格的已提交 Run 增补真实事后证据及极有限的文字修整，同时保留原审批事实、原正文基线、下游不可逆边界与完整失败现场。适用于 Change 和 Delivery 两类真实权威当前 Run，不给历史 Run 重新授予写权限。

## ADDED Requirements

### Requirement: Strict eligibility of a post-submission target
系统 SHALL 只允许当前选定 product-v2/open Delivery 的当前轮**实际最新**且 submitted 的合法 Run 接受 supplement 或有限 amend。Change Run 由活动 binding 的当前 Run 定位；无活动 Change 时，合法 Delivery 进展由当前 deliveryRunRef 定位；完整生命周期终态、旧轮、历史归档项、下游任何 draft/占号/已提交及 Close SHALL 被拒绝。

#### Scenario: Change Author or Reviewer submitted without downstream
- **WHEN** 当前活动 Change 的 Author 或 Reviewer Run 已 submitted 且仍是同轮当前 binding.latestRunRef，角色、actor、路径与内容均有效，下一条实际 Run 未产生
- **THEN** 可以申请独立的补证/有限更正，不生成下一 Run 号，不修改现有 next、verdict 或正式提交身份

#### Scenario: Delivery reviewer is current without active Change
- **WHEN** 无活动 Change，同轮合法 delivery-review-repair 等可补充的非生命周期 Delivery Run 已 submitted 且 manifest.deliveryRunRef 仍指向它，尚无下游
- **THEN** 使用当前 Delivery 进展指针判定资格，不把最近 archived Change 的 currentRun 当成当前目标

#### Scenario: Later draft reserves a new run number
- **WHEN** 原对象之后的下一项已经开始并留下合法下游 draft、未完成占号或已提交 Run，即使原 next 仍显示待 Reviewer
- **THEN** 原对象的 supplement 和 amend 均拒绝，不覆盖下游，也不依目录最大编号或 old approved 推定仍能编辑

#### Scenario: Closed and historical targets are rejected
- **WHEN** 请求旧轮、非当前 binding、已经 archived 的 Change、Delivery Close/Open/Reopen 终态、旧 legacy/manual 记录或含未确认提交/锁的目标
- **THEN** 明确拒绝且不修改任何原始 Run、关联、编号或资源状态；旧目标仍可只读

### Requirement: Append-only factual Run supplements
提交者 SHALL 保存真实必要证据、来源、角色/actor、理由/关系和系统赋予的本次保存时间 `recordedAt`；可空的来源自述 `sourceClaimedCollectedAt` MUST 标为 `unverified`。没有独立可信的来源或旧 approvedAt 锚点时，系统 MUST 拒绝声称来源时序已认证，不能由用户自述或文件 mtime 推断原批准时间。补证与旧 verdict/结果相互独立，冲突不自动变更旧结论。

#### Scenario: Additional proof arrives after approved review
- **WHEN** 当前最新 Review 已 approved，现在补入来源自述在过去采集的真实文件，但旧 Run 无可信批准时间锚点
- **THEN** 系统记录 `recordedAt` 与来源自述并标为 `unverified`，不可宣称采集早于/晚于原批准；原 Review 全文、verdict、关联及 next 均不变

#### Scenario: Subsequent proof conflicts with old verdict
- **WHEN** 补充证据明确表示与原 passed 或 approved 不一致，或必要关系无法确定
- **THEN** 显式标注冲突或不确定，停止当成正常补证完成的审批含义，提示 Owner/正式复审，不改原 verdict、不自动生成 PASS

#### Scenario: Duplicate and invalid supplement input
- **WHEN** 同一 requestId 幂等重试，或重复附件、源文件缺失/越界，或用户虚构旧采集日并声称系统已验证其早于原 Review
- **THEN** 同请求同输入只返回已有确认效果；非法源与无可信锚点的时间认证请求拒绝。仅提供过去日期的来源声明可标为 `unverified`，绝不作为获认证的原 Review 依据

### Requirement: Deterministic non-material amendment boundary
有限 amend SHALL 由调用者显式给出 `requestId` 和 `kind=presentation-only|unreviewed-comment`，且只接受该模式唯一对应输入：前者为完整候选正文 `body`，后者为自由评论 `comment`。缺/未知 kind、输入缺失或 body/comment 混用 MUST 拒绝；不得根据相同文本内容、diff 或 AI 猜意图。首版每 Run 至多一次已确认 amend；presentation-only 仅允许机械校验的非实质排版差异，unreviewed-comment 永远 `authoritative=false`。保存原正文、前后差异、actor、recordedAt、原因；frontmatter、结果、verdict、授权和审核语义不可改，模糊更改走正式独立 Review。

#### Scenario: Safe presentation-only correction
- **WHEN** 请求明确 kind=presentation-only，且只提交 body（完整候选正文），仅规范纯展示性段落的行尾单空格、CRLF 或不影响 Markdown 解析结果的空白，原提交的结构性标记、代码、链接、表格、标题、审批事实均不变
- **THEN** 可以执行有界更正，并保存原文及精确差异，原审核/结果不变

#### Scenario: Explicit post-submission addendum
- **WHEN** 请求明确 kind=unreviewed-comment，且只提交 comment 自由文本，包括文字自称“重新 approved”或“旧失败已通过”
- **THEN** 评论只保存在 typed `unreviewed-comment`、`authoritative=false` 的隔离显示区，附 recordedAt/actor/原因，所有查询始终标明未审核；绝不写入原正文、正式摘要、证明依据、verdict、PASS 或 next，不以关键词/AI 判断文字真实性

#### Scenario: Same text has different explicit amendment modes
- **WHEN** 原审核正文是“审核未批准”，提交的文本是“审核已批准”；一份请求 kind=presentation-only、body 为该文本，另一份独立初始目标请求 kind=unreviewed-comment、comment 为相同文本
- **THEN** presentation-only 因实质正文替换被拒且不创建 confirmed；unreviewed-comment 可保存为未审核的非权威隔离评论，但原 Run 字节、verdict、机器正式摘要与 next 均不改变

#### Scenario: Missing or conflicting mode input
- **WHEN** amend 缺 kind、kind 未知、presentation-only 没有 body/却提供 comment，或 unreviewed-comment 没有 comment/却提供 body，或同时提供 body 与 comment
- **THEN** 在写入前拒绝，不从文本或差异推导模式，不创建或修改 aftercare、原 Run 和结果

#### Scenario: Unsafe typo or hyperlink rewrite
- **WHEN** 请求对任意自由正文进行错字替换、URL 目的地修改、引用重定向、passed/failed 状态变化、验证范围或责任文字变化，无法机械证明审核语义不变
- **THEN** 本版有限 amend 拒绝并指出应走正式修订/独立审核，即使请求者声明仅是错字、表面 Markdown 结构没有改变

#### Scenario: One amend per Run with explicit request identity
- **WHEN** 第一次 amend 使用明确 requestId 和 kind 成功 confirmed 后，调用者以原 ID/同 kind/同输入重试、原 ID 换 kind/内容，或第二个新 ID 申请更改
- **THEN** 完全相同请求只读回原 confirmed；同 ID 改模式/输入及第二不同 ID 都拒绝，不覆盖唯一的 aftercare/amend，也不更换展示修订。原 ID pending 时任何新 ID 均被阻断，待显式恢复

### Requirement: Reliable post-submission persistence and recovery
系统 SHALL 在现有项目写锁和真实当前对象再核对下保存必要原件、意图及附属记录；不能让 partial receipt、失效索引或断点后的未知状态伪装为已完成。有限修订 MUST 可定位旧正文及差异，允许有限显式恢复和同请求幂等读回，不自动删除写锁、旧提交或不明临时目录，也不分配新 Action Run。

#### Scenario: Interrupted between evidence and receipt
- **WHEN** 写入证据原件、意图、索引或终态读回的任一阶段中断，存在可能已经写入但未确认的材料
- **THEN** 操作返回未确认并保留锁/实际受管现场；后续其他写入被阻断，须根据同一请求和完整实际结果明确恢复或处置，不能随意重试造成重复补证

#### Scenario: Repeated confirmed operation
- **WHEN** 相同请求和输入在受管收据已确认后再次提交
- **THEN** 读回并返回同一已确认附属记录；不创建新的 Run、目录和重复证明，旧正文、verdict 与原 next 保持

### Requirement: Readable aftercare without rewriting submitted history
status/query SHALL 只读展示已确认补证、可核验差异，并区分系统 recordedAt 与未验证的来源采集日期。自由 `unreviewed-comment` 只能独立展示为非权威/未审核内容，不得混入正式摘要、原 Reviewer 批准或 Full Test PASS。旧 Run 无 aftercare 时 SHALL 继续可读。

#### Scenario: Current submitted run has a supplement
- **WHEN** 新进程查询已确认的当前 submitted Run 及后续补充材料
- **THEN** 返回原 Run 的原状态、result/verdict 与不变 next，额外只读显示补证来源、操作者、实际时间及当前附属效果，不静默替换原审核事实

#### Scenario: Unreviewed comment asserts a new approval
- **WHEN** 已确认评论内容宣称原 Run 重新批准或原失败已修复，但没有新的独立 Reviewer verdict
- **THEN** status/query 仍只展示原 verdict/outcome 和 next，评论在非权威区域保持未审核标签，机器结果不能因为评论改变

#### Scenario: Legacy run without aftercare
- **WHEN** 读取历史没有 supplement/amend 附属文件的 Run
- **THEN** 原状态查询和直接历史读取保持可用，不要求迁移旧文件或创建空目录
