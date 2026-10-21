---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "038"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: chronology-amend-identity-and-addendum-contract-revision
nextAction: revise-propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/037-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/037-propose/run.md
---

# D05-D 独立 Review Propose（固定 Author 037）

**结论：changes-requested；当前 037 Propose 还不能进入 Apply。** 本次是设计、Specs 与 Tasks 的独立审核，不是执行 supplement/amend 新产品操作。Owner 已在 036 用正确连续小写授权令牌授权 D05-D 研发并明确不授权 DreMo；035 的旧 rejected 与 034 的技术 approved 保留不变，不要求重新 Explore 或再次申请 Owner 授权。现行 037 Propose 含 3 份 delta、Design、Proposal、16 项 Tasks，已核对 Change/Delivery 双权威指针、原提交 Run 不变及故障恢复；规划尚有三项实质缺口，需在当前授权范围内局部 revise-propose。

## 受理依据及成立部分

- [036 Owner 授权复核](../036-review-explore/run.md) 已从原始 Owner 消息确认连续小写 owner 授权 D05-D，保留 [035 rejected](../035-review-explore/run.md) 历史；037 前置引用 036 已完成。仅认证 MenDi 本 Change 的授权，不扩展到 DreMo。
- 固定 [037 Author Propose](../037-propose/run.md)、023–034 阶段既有直接材料，并独立对照本次 proposal.md、design.md、specs/run-post-submission/spec.md、specs/action-runs/spec.md、specs/delivery-workspace/spec.md 与 16 项 tasks；来源/行号见 [reviewer-results.json](artifacts/reviewer-results.json) 中 6 组 crosswalk。
- D1 基于真实 currentRun 与 currentDeliveryRun/deliveryRunRef 区分 Change/Delivery current，排除 archived Change/下游 draft/旧轮/正式 Full Test/Close；D3 采取原 run.md 字节不可变+附属展示更正文；D4 保存 intent、必要受管原件与最后 confirmed，显式有限恢复，不声称半成品 PASS；原 save/submit 与 owner 边界未松动。方向合理，未要求新通用历史数据库。
- Reviewer 用 [reviewer-proof.ts](artifacts/reviewer-proof.ts) 独立重新读取当前 037、036 授权来源及现行 RunRecord 类型并进行规划 crosswalk，真实运行固定 OpenSpec 1.14.1 strict validate：**1/1 valid、0 issues、exit0**，完整命令/stdout/stderr 在 [openspec-validation.json](artifacts/openspec-validation.json)。独立 TS proof 严格编译 **exit0、零诊断**，见 [tsconfig.json](artifacts/tsconfig.json) 与 [typecheck-results.json](artifacts/typecheck-results.json)。它们只证明对应结构及事实，不取代语义审核；未自称新 CLI 已实现。

## Findings（需修订，未指控已实现产品存在漏洞）

**F1 · HIGH · 证据采集时间真实性与承诺的拒绝倒填缺可信参照。**

- 位置：openspec/changes/latest-run-supplement-and-limited-amend/design.md:27，specs/run-post-submission/spec.md:28–41，proposal.md:9；与实际 src/core/actions.ts:30–50、src/core/delivery-runs.ts:71–98、src/application/actions.ts:249–268 的现有协议对比。
- 方案要求记录“证据真实采集时间”并拒绝把来源时间倒填成旧批准前，但被审产品 Change 与 Delivery Run 的原生 submitted 头部均没有可信的 submittedAt/approvedAt 锚点；外部 JSON 自述的 collectedAt 也不能自己证明采集时间。不能凭新 Run 持久写入时间推断历史采集时间，或凭文件 mtime 猜 Reviewer 当时的真实批准点。
- **要求** 在 Propose 区分本次操作系统生成的 aftercare recordedAt 与来源宣称的 collectedAt；对没有独立可信采集来源/原提交时间锚点的历史材料标记未验证的时间来源，不做虚假的“已证明早于/晚于原批准”结论。涉及无法认证的时间先后断言时 fail-closed；新增伪造过去采集时间与缺少可信锚点的场景测试。无需回填旧 Run 时间、不建全局时间/证据账本。

**F2 · MEDIUM · amend 请求标识/多次操作的协议边界尚未统一。**

- 位置：design.md:35（对外 run amend 命令没有 requestId）；design.md:45–55（每次操作验证 requestId、aftercare/amend 单一路径）；tasks.md:5（缺请求 ID 必须拒绝）；specs/run-post-submission/spec.md:58–67（同一请求幂等）。
- 如果命令没有显式 requestId，如何识别相同与不同请求无法确定；当同一 Run 后来第二次申请不同候选更正时，单一路径如何阻止覆盖已确认的前一次 amend 或确定展示顺序也未明确。
- **要求** 固定 amend CLI 的请求标识来源，并明确第一版只允许一次有界 amend（第二个不同请求必须拒绝）或采用多个不可变逐请求收据和确定性的当前展示选择；与任务和 Specs 保持一致。覆盖相同请求重试、同 ID 不同输入、第二不同请求和历史只读。

**F3 · MEDIUM · 自由文字事后附注如何不冒充正式审核事实尚无可执行边界。**

- 位置：design.md:37–43、specs/run-post-submission/spec.md:43–56、tasks.md:17–19。
- 原方案机械判定普通段落空白可以成立，但另允许独立追加文字且要求“只能阐明非审核事实/不得伪造复审通过”，没有指定用于这类自由文字的机械限制；不能将空白差异检验套用到自由新文字，也不能仅由操作者自称“只是附注”证明内容非实质。
- **要求** 首版选择可机械校验的限定附注形式，或将任意附注统一作为非权威、未审核的事后评论严格隔离展示；它在系统里不得改变被审核正文、事实结论、原 verdict、next，亦不得被摘要或 Query 误显示为已认证补证。增加一项附注文本错误声称“重新 approved”或“旧失败已通过”的负例。不得以 AI/关键词黑名单推断全部语义安全。

## 非阻断界限及交接

- 不要求扩大本 Change、重做 033/034 的 6/7/Delivery 技术 proof 或 036 授权复核；Change 与 Delivery 当前指针分派、双向角色、共享编号、只读历史与已设计 intent/confirmed 安全路径可以保留。
- 时间真实性、amend API 幂等和附注权威性须在 Author 进入 Apply 前作明确的结构选择，否则 Apply 将不得不自行解释 user-visible 操作与审核语义。以上缺口可在 037 Propose 的三份 Spec/Design/Tasks 内直接修订，不增加不必要 Owner 问卷或审批层。
- Review 038 仅写自身 Run/TypeScript proof/真实检查回执与 manual-bootstrap manifest 交接。**不修改** 037 Author 方案、033–036 旧 Run/verdict、产品源码、历史归档与 DreMo；不执行 Apply、Archive、根 D05 正式 Full Test、Close、Git、稳定安装。

**下一步：revise-propose / author / changes-requested，修订后再由独立 Reviewer 重新 review-propose。**
