# Proposal

## Why

目前正式提交后的 Run 无法在不新增无意义 Action/Run 编号的情况下附加后续实证或修正少量不涉及结论的 Markdown；普通 `run save/submit` 正确地拒绝已提交内容。D05-D 的 033 真实 Proof、034 技术 approved 和 036 新 Owner 授权 approved 已确认 Change 与 Delivery 的当前指针不同、下游 draft 立即阻断旧对象，必须提供**独立且可审计的提交后小操作**，同时不能改写既有审批。

## What Changes

- 新增 `mendi run supplement --project ... --run ... --role ... --actor ... --input ...`：对**当前轮、实际最新、已提交、尚未被下游 draft/提交或 Close 消费**的 Change / 合法 Delivery Run 追加本次真实证据。受管收据区分系统当次生成的 `recordedAt` 与来源自述的可空 `sourceClaimedCollectedAt`（始终标记 `unverified`）。旧 Run 没有可信 submittedAt/approvedAt 锚点，不能根据声明或 mtime 推定证据采集与原批准的时序；无可信锚点时请求系统认证旧日期必须拒绝。相反/可疑证据不得获得自动认可；原 Run 正文、verdict、结果和 next 不变。
- 新增 `mendi run amend --project ... --run ... --role ... --actor ... --request-id ... --kind presentation-only --body <file> --reason ...` 或 `--kind unreviewed-comment --comment <file>`（其它身份与 reason 参数相同）：仅在可验证的**极窄非实质修改**范围内更正文稿。保留原始提交全文、前后正文、精确差异、原因、操作者和时间；修改不得触及 frontmatter、正式结果、审核论证、测试覆盖、授权、失败及来源事实。**首版每个 Run 最多一次已确认 amend（显式 requestId 与 kind 一并参与幂等身份）。必须明确选择互斥模式：`presentation-only` 只能用 `--body` 提交完整候选正文，安全的机械可验证排版差异才可更正；`unreviewed-comment` 只能用 `--comment` 提交自由文字并存入 `authoritative=false` 独立区块。缺 kind、缺对应输入或两种输入混用一律拒绝；同 requestId 改 kind/内容不得作为原请求重试。哪怕评论自称“重新 approved / 旧失败已通过”，也不影响原审核结论、正式摘要或 PASS。无法机械认证的错字、链接、引用等更改一律拒绝并指向正式 revise + 独立 Review。** 不以 AI/关键词猜测语义不变。
- 两种操作共享当前对象验证：可写 product-v2/open/currentRoundId、准确的 Change binding.latestRunRef 或无活动 Change 的 Delivery deliveryRunRef、目标身份/role/actor/submitted、全 Delivery 占号、后续 draft/提交/Close/旧轮、实际锁与必要直连源；不以文件号最大、旧 approved 或 next 文案代替权限证明。
- 同一操作在唯一受管目的 Run 的附属记录下保存小规模 typed receipt / 必要原件与安全索引；采用精确输入与写锁、幂等请求标识、可靠的写入读回及有限显式 resume。失败/未知保留现场，不能给出成功、自动扫除锁或修改无关历史；**不创建新的生命周期 Run/Action**。
- status / query 只读提供已确认的 supplement/amend 来历和可定位链接，标记来源采集时间未经验证，并把任何事后自由评论严格标注为未审核、非权威；旧无附属资料的 Run 继续原样读取。普通 `run save/submit` 的 draft-only 约束完全保留。
- 不恢复或修改 D05-D 授权争议历史：033 Explore、034 技术 approved、035 授权 rejected、036 新授权 approved 分别保留。D05-D 研发授权**不授权触及 DreMo 035 或其他目标项目**，也不代表 D05 正式 Full Test/Close、Git 或发布授权。

## Capabilities

### New Capabilities

- `run-post-submission`：当前最新已提交 Run 的有界补证与非实质正文修订、角色/时间/来源和冲突可追溯、拒绝下游消费、受管事务/恢复/只读兼容。

### Modified Capabilities

- `action-runs`：继续禁止普通 save/submit 覆盖 submitted；独立提交后操作必须与原受审事实区分，不产生新 Action Run。
- `delivery-workspace`：当前 Change 与当前 Delivery 采用各自真实权威指针，status/next 只读展示事后证据而不改变阶段、授权或正式 PASS。

## Impact

- 产品：`src/drivers/cli.ts` / `src/drivers/arguments.ts`、`src/application/` 的新受控操作、`src/core/` 的 typed receipt / 白名单检查、`src/adapters/` 的安全侧车、持久写入/恢复、`src/application/project-query.ts` 的只读引用显示；复用现有 `managedPath`、write lock、`scanRunNumbers` 和 Current Run 区分。
- 实测：测试包括 Change Author/Reviewer 及 Delivery Repair/Review submitted 最新正例，后续 draft/已消费/Close、旧 v1/manual、反例正文、来源失效、重复、越界、锁和中断；遵循 D05-C 的受控输入与单源证据原则。
- 不新增独立全局历史数据库、不自动重审、不变更 archive 编号或旧正式执行模式；本 Propose 只产生规划产物，未执行产品 Apply、其他项目补证或新发布。