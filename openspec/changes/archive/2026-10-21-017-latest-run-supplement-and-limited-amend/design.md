# Design

## Context

见 proposal.md、033 Author 的实际 6/6 Proof、034 独立技术 Review（含 Change 级、Delivery Repair Review 级两种当前指针）、035 旧授权 rejected 和 036 新授权独立 approved。当前产品的 `run save/submit` 只服务于 draft，对 submitted 返回 `run-already-submitted`；`currentRun()` 在没有活动 Change 时仍可能返回最后 archived Change 的旧 Run，不能代表 Delivery 进展。受管路径、真实 write.lock、Run 共享占号和正式执行/Close 均已有可信规则可复用。

## Goals / Non-Goals

**Goals：**为符合严格条件的最近 submitted Run 增加小量可追溯事后证据和非实质 Markdown 更正，既能跨进程只读展示，也不重写原审核或引入一条空 Action。出错可看到究竟写到哪一步，不能假报完成，重试不重复。

**Non-Goals：**不扩展普通 run save/submit；不创建后补审核身份、第二种 PASS 来源、全库编辑器/历史 hash 台账、后台锁清理、旧 Run 迁移；不修改已归档 Change、已 Close Delivery、正式 Full Test 验收结果或 DreMo 数据。035/036 的授权补审问题作为历史事实，**不借本 Change 添加通用 owner-decision 子系统**。

## Decisions

### D1. 两类 Current Run 明确分派，同一份严格准入

读取当前目标时先由实际 project index 定位 selected Delivery 并要求 product-v2、open、无 pending/migration/unknown lock。随后按目标 Run 类型分支：

- **Change：**必须存在活动 `activeChangeId`，当前 binding.latestRunRef 等于用户显式 `--run`，`readRun` 对应 Run path/Change/delivery/batch，`submitted`、role/actorId 与调用一致；不允许 archived binding，即使其 run number 在整个 Delivery 中最大。
- **Delivery：**必须**无活动 Change**，`manifest.deliveryRunRef` 精确等于目标，`currentDeliveryRun` 与当前轮 scope 同属，类型首版只放开 `delivery-repair`、`revise-delivery-repair`、`review-delivery-repair` 的已经完成提交；拒绝 `delivery-test-attempt`、`delivery-full-test`、`delivery-close/open/reopen/migrate`、`delivery-verification`、`delivery-change-add` 等正式生命周期和验收事实。
- **共享限制：**全 Delivery 的 Run 目录占号扫描用于识别任何**大于目标编号**的下游 draft、空占号或 submitted（不允许仅按 max 判断它“当前”）。通过 `readWorkspace` 的真实锁保护、round 绑定和当前源字节/actor/状态/原 manifest 再比对，真实 Close 或新轮拒绝。任何不确定、破损占位或不明写者均停，不能倒查旧 passed 代替。

理由：034 Reviewer 的真实 Delivery 级测试表明 `currentRun()` 可能选择 archived binding，而 `deliveryRunRef` 才是当前 Delivery 进展；写操作入口不能复用单一 `currentRun()` 判定。

### D2. Supplement 用单 Run 受管附属收据，原 Run 字节完全不改

命令 `run supplement --project --run --role --actor --input <JSON>` 包含 `requestId`、来源、理由、受管证据及 `relation`（additional/conflicting/uncertain，默认 uncertain）。系统仅赋予本次后续操作的 `recordedAt`；来源可选传入 `sourceClaimedCollectedAt`，保存时强制 `sourceTimeTrust=unverified`。旧 Change/Delivery Run 都没有可信 submittedAt/approvedAt，输入日期、文件 mtime、Run 编号及 recordedAt 均不能证明原证据采集早于/晚于原批准；没有独立可信锚点却要求 `verified` 或声称系统已证实时，必须拒绝认证（可保留明确未验证的来源自述）。追加时间表示本次保存，而非来源实际采集或原批准时间。真正唯一附件与 typed receipt 位于 `aftercare/supplements/<requestId>`；只允许安全受管路径。

对同一 requestId 提交同一输入时从已确认收据读回既有结果；对相同请求 ID 的不同内容明确冲突，对相同原件的新请求检查重复引用/身份并拒绝或说明无法确认为不同证据（不通过全库内容 hash 猜同一真实执行）。若新事实和既有 approved 冲突，允许记录 `conflicting` 并明确风险/需要 Owner 和独立 Review；不自动改前 verdict 或 next、不将其解释为批准证据。旧 `run.md` 及 Review 原文任何字节不修改。

**拒绝：**把新附件追加进旧 `run.md` 的末尾再解释为审批前正文；把新证据作为旧 Full Test 的缺组通过补丁；额外新建审核 Run 仅为放置附件。

### D3. Amend 第一版选择不可变原文 + 可核验展示修订，不在已审批正文上原地覆盖

`run amend` 必须由调用者指定 `--request-id <id>`、`--kind presentation-only|unreviewed-comment`、`--reason <text>` 及项目/Run/角色/actor。**输入模式由 CLI 字段确定，不通过文本、差异或 AI 猜测**：`presentation-only` **只接受** `--body <file>`（完整原正文候选），禁止 `--comment`；`unreviewed-comment` **只接受** `--comment <file>`（自由文本），禁止 `--body`。缺 kind、未知 kind、缺匹配输入、同时提供 body/comment 都在修改文件前拒绝。requestId 显式必填，不从时间、模式或正文推导。**首版每个 Run 至多一次 confirmed amend**：唯一 `aftercare/amend` 槽位保存请求 ID、不可变 kind、相应文件输入与其精确内容身份、原正文基线、候选展示正文或隔离评论、差异、recordedAt/actor/原因。同 ID、同 kind、同输入才可幂等读回；同 ID 换 kind/内容、第二不同 ID 均拒绝；pending 时只准同请求显式处置。无覆盖或多收据排序。目标 `run.md` **永远保留原始提交字节**，查询仅对唯一 confirmed 记录明确显示对应模式，审核读回保持原文。

为保证行为**可机械判定**，首版只准：
1. **`presentation-only`：非结构化普通段落的行尾单空格、LF/CRLF 或文件末尾换行标准化。** 先排除 fenced code、引用、表格、标题、列表、链接、具有两个行尾空格 Markdown hard-break、frontmatter 及其他语义敏感行；对比归一化后的原文与候选正文必须严格相同，不能改变任何非空白字符或 Markdown 结构。无法判定则拒绝。
2. **`unreviewed-comment`：自由事后评论只作非权威隔离展示**。自由文本无法机械证明语义安全，也不能保证真实；只以 typed `kind=unreviewed-comment`、`authoritative=false` 保存原始内容、recordedAt/actor/原因，**不并入展示更正版的被审核正文、正式摘要、证据来源、verdict、PASS 或 next**。所有显示入口持续标注“事后未审核评论”；即使文本出现“重新 approved”“旧失败已通过”，也只能显示在该非权威隔离区。若要求这种文字具有正式事实效力，应拒绝此种使用并指向正式独立 Review，不以 AI/关键词黑名单推断文字非实质。

原路线图提到的错字、普通链接和非实质引用作为**允许类别上限**而非必须接受所有此类修改：如果不能确定它们对审核语义无影响（尤其 URL 指向不同证明），首版明确拒绝任意字符替换/链接目的地/引用改写，走正式 revise + 独立 Review。可由后续新授权收窄和扩展具体可机械校验的映射，但不在 Apply 中用 AI 判语义或简单关键词允许表解决。

**拒绝：**只要 frontmatter/verdict 不变就允许任意 Markdown 编辑；以 “我确认不重要” 越过字节与结构校验；用展示修订改变旧 Review 取证时使用的原文。

### D4. 事务以受管 `intent`、唯一附件和最后的 confirmed receipt 为权威

使用现有 `managedPath`、write.lock、输入直接再核对和原子 rename。每次操作仅在所属 Run 的 `aftercare` 目录内建立限定空间，不创建下一 Action Run。操作前在锁外预检，写锁内重新读当前 workspace、Run、源原件与索引状态。

1. 为 supplement/amend 均校验明确 requestId；amend 额外核对明确 kind 与互斥的 `--body`/`--comment`，锁内比较唯一槽位中的 requestId、kind 和直接输入身份（同 ID 换模式/内容拒绝），然后以独占方式写 `intent.json`（记录唯一对象、用户输入与初态、可解释的前置版本）；此时**不能**返回成功。
2. 对应唯一附件或展示修订（仅在需要时）以独占路径保存并核原字节/读回。证据从临时目标转存前后校验身份和内容，源不稳定则停止。
3. **最后**原子发布 `confirmed.json`（记录实际结果和来源）；status/query 仅接受完整且直接读回有效的 confirmed，不假设目录存在即成功。已生成的同 requestId intent/候选但未 confirmed 是未知提交状态，普通写入停止，留现场与锁而不自动清理。
4. 新增一个限定当前请求的**显式 resume/finish** 入口，校验仍为同一目标、锁真实来源、输入未漂移及子文件状态；无法确认效果时返回 unknown/Owner 处置，不重写旧正文、不盲目执行第二次。
5. 可持久的已确认请求再次调用只返回原 confirmed；即使用户换 actor 或目标已非 current，也不得借幂等读回授权**新写**。原本已归档/下游存在的历史只读补证可以查询已确认记录，但不能继续追加。

不通过修改根 manifest 的 latest/next 表示补证，它们在 supplement/amend 成功前后必须一致；Query 在显示 confirmed 之前需检查本次文件的实际完整性。只需要本次**直接**证据一致性核验，不按全部旧 Runs 构建 hash 链。

**替代方案拒绝：**删除旧 Run 后重写、多处写入后不记录 intent、自动移除未知锁、零证据却生成新 lifecycle Run、根据数量/字节设置硬门槛。

### D5. 严格角色归属与 Owner 授权分界

默认只允许与目标原提交**角色和 actorId** 完全一致的发起者（包括 Reviewer 对其当前已批准 Review 的真实补证）；程序 actor 文本本身不能替代现实 Owner 授权或独立身份验证。D05-D 允许开发本能力，并不授权对 DreMo 035 作真实修改；应用于某目标必须当时满足 Current 及其单独授权与平台操作许可。已确认补证如与结论冲突，应保留关系、提示 Owner/正式 Review，不能凭 Owner 研发授权篡改结论。

## Risks / Trade-offs

- **[Delivery 指针与 archived Change 混淆]** → 依据实际 Run kind 进入分支并做完整 current round + 目录占号校验；正负例来自 034 实际 proof。
- **[Markdown 语义误判]** → 白名单极窄，仅机械可证明的空白表现及独立标注事后附注；自由 typo/URL 一律拒绝，不承诺 AI 可以保障非实质。
- **[amend 未原地改旧文件]** → 选择保留原审批基线与展示修订两层；Query 明示而非伪装旧正文已改变，避免技术上自相矛盾的历史不可变性。
- **[证据时间无可信锚点]** → 系统只记录 aftercare recordedAt，来源采集日期一律 unverified，拒绝宣称系统已证实原批准前的时间关系；不以 mtime/用户输入构造旧批准时刻。
- **[新证据与旧 Review 冲突]** → `relation` 真实标注、补证 recordedAt 与 Owner/独立复审提示，绝不自动改变 result/verdict。
- **[同一正文的 amend 意图歧义]** → 显式 `--kind` 和互斥 `--body`/`--comment`；同文本走 presentation-only 且变更事实就拒绝，走 unreviewed-comment 则仅旁路显示。缺/错组合拒绝，不猜语义。
- **[评论假冒结论/重复 amend]** → 非权威评论隔离展示，唯一 confirmed amend；requestId、kind、输入共同决定幂等，同 ID 改模式和第二 ID 都拒绝。
- **[多文件断点与未知锁]** → 意图/证明/confirmed 的有界受管顺序，真实写入失败保留，显式 resume 按实际效果处理；不自动删除或重算历史。
- **[重复材料/无效来源]** → requestId 幂等与同目标直接原件身份约束，不做全库 dedupe。
- **[旧兼容]** → 不改变既有 run.md schema、历史无 aftercare 正常读取；新功能仅 product-v2 当前合法对象，manual-bootstrap 和 legacy 仍只读。

## Migration Plan

1. 开发新独立 CLI 子命令与后处理读取逻辑，先以 unit/隔离 product-v2 fixture 分别验证 Change 与 Delivery 正例，首轮不碰 MenDi 根的 manual-bootstrap 历史。
2. 在同一结构内加入受管附属收据、requestId 幂等、锁/写入失败分段诊断与显式有限恢复；后续 query 只读确认，不改变旧 Run 的存储格式与权威字段。
3. 用现有 CLI 跨进程证据、断点注入、scope/role/actor/closed/archived/下游 draft、错误授权、正文实质改写等负例验证，跑真实 `pnpm check`、`pnpm build`、必要隔离集；保留原始证据一份。
4. 交独立 review-apply 后，由 Owner 独立命令 Archive、Git checkpoint、D05 正式 Full Test、Close 和安装。若失败仅回退本新能力，旧 Run/历史格式无迁移需求。

## Open Questions

无阻断性 Owner 产品问题：Owner 已授权 D05-D 研发并确认不可改 DreMo；当前对有限 amend 的具体**首版保守机械边界**已经定稿，Apply 不可私自放宽至自由错字/链接修改。