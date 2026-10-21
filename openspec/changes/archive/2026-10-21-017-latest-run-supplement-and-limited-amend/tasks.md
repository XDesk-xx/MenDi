# Tasks

## 1. 当前对象识别与 CLI

- [x] 1.1 实现两个专用 run 子命令（supplement/amend 均需 requestId），amend 还必须有 `--kind presentation-only|unreviewed-comment` 和互斥的 `--body` / `--comment`；CLI 测试缺/未知 kind、输入缺失或混用拒绝，旧 save/submit 不变。
- [x] 1.2 对当前 selected product-v2/open Delivery 建立统一资格检查；分别以 Change 的活动 binding.latestRunRef 和 Delivery 的 deliveryRunRef 做真实正例，并核 shared Run number、当前轮、actor/role 与 submitted。
- [x] 1.3 对下游 draft 或编号保留、历史轮、closed、archived Change、正式 Full Test/Close、旧 manual/legacy 及错误对象执行隔离拒绝测试；确认当前 Delivery Review 不误用 archived Change 的 Run。

## 2. Supplement 事实与来源

- [x] 2.1 实现补证 typed receipt，分别保存系统 recordedAt 和可空来源自述 sourceClaimedCollectedAt（始终 unverified）、actor/role/来源/原因/冲突关系；测试无可信旧审批时间锚点时不判断采集先后，不能倒造已认证时序，且原 Run/verdict/next 不变。
- [x] 2.2 受管保存唯一附件，测试越界/symlink/缺失/读中变化/重复及同 requestId 不同输入拒绝；额外验证虚假过去日期的 verified 声明被拒、普通无锚点旧日期只能标记 unverified，不能宣称批准前取得。
- [x] 2.3 针对追加材料与旧 approved 结论相反或关系不确定的场景，测试显式冲突提示和 Owner/独立复审引导，绝不产生新 PASS 或暗改旧结果。

## 3. Limited amend

- [x] 3.1 对明确 kind=presentation-only 且仅有完整 body 的请求机械验证安全空白差异；对明确 kind=unreviewed-comment 且仅有 comment 的请求保留 typed `authoritative=false` 的非权威评论。使用同一“审核已批准”文本验证前者对原“审核未批准”的实质替换拒绝、后者隔离保存，另测安全排版正例和原正文/verdict/next 不变。
- [x] 3.2 拒绝 presentation-only 的错字/URL 目标/证据引用/测试范围/权限/审核论证/结构修改，以及缺 kind、kind 与输入不符、body/comment 同时提供；即使 comment 自称重新 approved 或旧失败通过，也只能作为未审核评论显示，不进机器 summary/PASS/next。
- [x] 3.3 amend 必须显式 requestId，单 Run 只有一个 confirmed amend；受管保存原正文基线、候选展示/非权威评论、精确差异、recordedAt、actor/原因；测试同 ID 同 kind 同输入幂等、同 ID 换 kind/内容与第二不同 ID 拒绝；跨进程读回原 run.md 字节和 next/verdict 不变。

## 4. 事务、恢复与查询

- [x] 4.1 在真实写锁下二次核当前指针、轮次、Run 占号及直接输入，按 intent、必要原件、最后 confirmed 顺序保存；写锁内核 amend 唯一槽位为空或完全匹配 requestId/kind/原始输入，测试并发、同 ID 改 kind、改内容、第二 ID、来源漂移及未知状态。
- [x] 4.2 对 intent、复制、提交、读回、锁释放各断点进行故障注入，确认 partial 不宣称完成、实际现场可诊断、幂等重试不重复；显式 resume 只处理同一请求，不能自动清理未知锁。
- [x] 4.3 status/query 仅展示 confirmed，保留旧结果/verdict/next；将 recordedAt 与 unverified 来源时间分开，unreviewed-comment 永远不进入正式摘要；旧 Run 无 aftercare 照旧可读，缺/坏收据不伪造成功。

## 5. 真实场景与独立交接

- [x] 5.1 在隔离 product-v2 Change Author/Reviewer 与 Delivery Repair/Review 上完成真实命令的补证和展示修订正例，对照 033/034 的权威指针和下游 draft 负例；不得触碰真实 DreMo。
- [x] 5.2 更新需要的 Skills、CLI 帮助和 README，验证命令示例在当前构建实际可运行；保留 Owner 授权范围、历史只读和正式 Full Test/Close 独立授权。
- [x] 5.3 运行受影响测试、pnpm check、pnpm build、OpenSpec strict，保留有限原始证据；Author Apply 摘要列 src/tests/scripts 物理行数前三名及可靠增长依据。
- [x] 5.4 核对 033/034/035/036 原始历史和 D05-A/B/C Archive 014/015/016 均未更改，并将真实 Apply 结果交独立 review-apply，不自签批准。

## Workflow follow-up

- 独立 Reviewer 审核本 Propose，批准后才能进入 Apply。
- 其后 Archive、Git checkpoint、D05 正式 Full Test、Close 和稳定安装仍分别取得 Owner 指令。
