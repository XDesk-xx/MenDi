---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: full-test-orchestration-continuation-and-revalidation
planningSlot: MVP-D04-B
batchId: 002-changes
actionId: full-test-orchestration-continuation-and-revalidation-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "013"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: proposal-approved
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/012-propose/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/012-propose/run.md
---

# MVP-D04-B Review Propose

**结论：approved，无阻断发现。** 固定 [012 Author Propose](../012-propose/run.md)及当前六份正式产物。重点逐项核对 [011 补充审核](../011-review-explore/run.md)的 E1–E6 是否成为可实施的完成规则、拒绝条件和真实负例，而非只在方案中出现名称。批准限于规划，不认证尚未实施的组协议、汇总、Close 或性能行为。

## 方法与直接输入

Owner 指令 review-propose，并要求保持 Reviewer、完成停下。使用稳定安装 MenDi review-propose 方法；读取 proposal、design、tasks、test-execution / delivery-verification / delivery-lifecycle 三份 delta，核对 012、011 实验结论、相关主规格及实际任务 instructions。读取 012 的 owner-coverage-decision.json：必需 skip / TODO / 取消 / 零执行不满足覆盖、排除须执行前明确、构建核对真实产物；与既有两项 Owner 决定一起作为本阶段正式交接输入。没有代写或改动 Author 规划。

## E1–E6 逐项追踪

下表规格路径均位于当前 Change 的 specs，任务编号来自 tasks.md。

| 011 反例 | 设计与规格的实际处理 | 验收负例 / 正例任务 |
| --- | --- | --- |
| E1：skip / TODO 发 pass，summary.success 仍可为真 | design §2 要求未排除业务范围实际非空，必需 failed / cancelled / skipped / todo / pending 为零；计数与结束摘要一致。test-execution 的 Nonvacuous required group coverage 明确全 skip / TODO 场景；事后排除不能改原计划。 | 3.1 全 skip / TODO、零执行、执行前合法排除；10.1 不能收口。既有 E1 的真实刺激保留为实施要求，不接受仅字段测试。 |
| E2：同一文件既 pass 又 fail | design §2 分层解释子测试 / 文件 / suite / 根；最终失败优先，禁止文件成功集合算法。对应 A group has mixed passes and failures 场景。 | 3.2 同文件真实成功和失败，核对早期或末尾成功均不能覆盖失败。 |
| E3：pass 后 exit 7；aborted 是 fail 事件却非业务失败 | design §2 / §4 要求实际容器及根结束，取消单独解释；Group completion after final lifecycle confirmation 及 Bounded collection 明确晚退出、取消与清理未知。 | 3.2 真实 exit 7 和 cancelled / failed 差异；4.2 实际前台树停止 / 未确认；4.3 共享资源阻断。不能仅凭 PID 消失或停止命令成功认定安全。 |
| E4：回执失败而包装器 exit 0 | design §3 保留原 command outcome，独立判定协议矛盾，invalid 的所有组均不可用于结论；Agreement of receipts and raw execution 明确双通道及缺失 / 陈旧回执。 | 3.3 真实包装器 exit0 / 回执失败；2.2 外部 / 陈旧 / 部分报告；7.1 invalid 来源不 verified；10.1 不能 Close。安全完成的 invalid 可释放自有锁，未确认执行 / 清理仍保留现场，未混淆这两类。 |
| E5：collection 完整但业务覆盖为零 | design §2 / §6 将实际选择、必需覆盖与候选适用性分开；Nonvacuous required group coverage、Declared collection and tested material basis、Candidate verification 三处一致，command 组另核真实完成条件且不能改标规避。 | 3.1 零执行 / 合法排除 / 构建产物；7.1 来源缺口；8.1 及10.1 覆盖缺口不可收口。没有把相同 candidate 或文本完整当实测证明。 |
| E6：子命令已完、终态保存失败，内存 passed 与磁盘 unknown 不同 | design §3 明确 durable readback 及锁边界，不能消费内存 observed；Group completion 的 Terminal persistence fails after child close 与 Single operation durable outcome 保持一致。 | 3.4 终态替换 / 读回 / 释放故障注入、不占后号、保留现场；7.2 结论提交故障、不回退旧 verified。未增加自动清锁或未知 attempt resume。 |

这六项均已同时有合同和实施任务，非仅由 012 摘要表自证。构建等非测试组与 tests 组的覆盖义务分开；Owner 的排除决定没有变成失败后减矩阵的入口。对目标错误声明的业务真实性仍由真实阶段工作 / 独立审核负责，方案没有夸大机器计数的能力。

## 组合路径与兼容审核

除逐项追踪，还按下列输入序列进行文档层面的状态推演；这些是方案一致性分析，不是未来产品已执行的测试结果。

1. **中段失败 → 尾项 continue 成功 → 修复原中段。** design §3 保存完整计划的扁平 progress，§5 明确当前未解决直接失败不等于最新 attempt 的 outcome；Explicit same round continuation 的 Repair an unresolved failure after a successful tail 明确允许直接固定原失败。任务5.1 / 5.2 / 6.1 / 10.1覆盖整条路径，避免最新尾项成功后无处修复，也不扫描全历史。
2. **跨候选沿用前缀 → 公共输入改变。** design §3 / §5 要求清除受影响 / 未确认组的适用性，逐组沿用须有当前必要 Review 的影响依据；Reviewed impact 的公共变化场景和6.2要求扩大，不靠组名、脚本名或固定比例。当前候选相同与当前覆盖充分各自独立。
3. **同候选某组曾通过，但后续复验又失败，试图再选旧通过汇总。** design §3 的最近观察 / 未解决失败、§5 的当前失败及§6“其余失败须由新来源解决”，与 Candidate verification 的仍失败不得 verified 合起来要求拒绝；“不隐式挑最后通过项”不能反向解释成可由调用者任挑旧成功。Apply 实现7.1的矛盾来源与10.1失败保留场景时应使用此具体序列，核对当前 progress 和直接来源，而非仅检查每份来源自身 passed；无需递归历史或新增审核阶段。
4. **新的 attempt / repair 已替代旧 verified，却用旧结论 Close。** design §7 的当前 deliveryRunRef / verificationRunRef 一致要求和生命周期 A newer attempt supersedes the current conclusion 明确拒绝；7.3 / 8.1 / 8.2验证当前指针、历史查询及 Reopen，不借旧结果回退。
5. **非法报告已经安全结束，与真实未知写现场。** invalid 的不可复用事实可以转 repair；unconfirmed 不能以挑部分成功绕过。两者有独立协议 / 持久状态与3.3 / 3.4负例，未把每个协议错误永久变成未知进程，也未用 exit0消除实际不确定。

方案还明确了完整相同计划 / 候选的 continue、经当前批准的 retest、initial 不绕过失败审核、旧 command 不追认组来源，以及 Close 双 selector 互斥。14个 MODIFIED requirement 的旧场景均保留并在必要处区分新旧模式。必要快照读取与来源历史递归分开，没有要求来源旧正文永远存在；新类型 / 版本拒绝误入旧 passed 分支。

时间与受控优化任务保留单调时钟、UTC、父子包含关系和实际热点；复用限同次、输入一致、资源有归属，既有真实预算 / 断言保持。没有借011的短样本承诺提速或提前授权DreMo优化。

## 独立检查与限制

- 固定 OpenSpec 1.14.1 `validate full-test-orchestration-continuation-and-revalidation --strict --json`：exit0，见 [validation](artifacts/validation.json)。
- 同版 `instructions tasks --change full-test-orchestration-continuation-and-revalidation --json`：exit0，核对当前实际依赖 / 指令，见 [tasks instructions](artifacts/tasks-instructions.json)。
- 当前候选 CLI status：固定 Author012、review-propose / reviewer / manual-bootstrap，见 [status-before](artifacts/status-before.json)。
- 独立逐块检查14个 MODIFIED requirement均能对应主规格，旧场景无缺失；28项任务全未勾，见 [planning-check](artifacts/planning-check.json)。结构检查只辅助定位，批准基于上述语义核对。
- `git diff --check`通过。规划审核没有产品实现变化，未重跑011对抗实验、根工程回归或正式Full Test；011原观察只按其已明示范围沿用。没有用生成一个未来状态模型并跑绿来代替审核真实方案。

当前无需退回修订。低层schema精确字段与函数组织可在方案既定语义内实施；上述禁止旧成功掩盖新失败、覆盖 / 结束 / 取消 / 持久状态区分是已批准合同的实现义务，不能留成不测试的文字。独立Review Apply仍须读取真实负例结果，不能因本次approved或任务全勾自动认可。

## 停止边界

本次仅新增013审核及直接artifacts，按manual-bootstrap更新当前manifest、README、context。012与六份规划产物、009–011原记录、产品实现和旧历史未改；累计归档11，C未激活。未执行Apply、根Archive / Full Test / Close、真实迁移、稳定安装切换、DreMo操作或Git写入。

下一步：`apply / author / awaiting-instruction`。保持Reviewer，完成后停下。
