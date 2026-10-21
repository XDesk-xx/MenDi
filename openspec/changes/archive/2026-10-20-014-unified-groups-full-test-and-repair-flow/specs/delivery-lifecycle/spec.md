# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit applicable delivery close

系统 SHALL 只在明确 Owner 授权下收口当前 open v2 product 的当前轮，要求本轮槽位完成、无活动 / 待处理工作及材料适用。新 Close 必须固定本轮**最新完整 groups-v1 正式 Full Test Run** 的稳定 passed 和对应直接指针/快照，核对范围、批准、必需覆盖、执行与清理。已完成的历史 Close / 旧单次/verification 继续只读，不以旧候选 verified 作为新版 Close 输入。普通、跨轮、陈旧或未确认结果不能 Close。

#### Scenario: Close a completed delivery
- **WHEN** 实际 Owner 已授权 Close，Author 提供本轮当前正式结果及成立的材料适用性判断，必要输入完整且稳定
- **THEN** 保存独立 Close Run 与 closed manifest，保留正式父 / 子结果和历史，跨进程查询同一收口；不自动 Git、Open 或 Reopen

#### Scenario: Required acceptance or approval is unavailable
- **WHEN** 缺当前所选验收对象 / 必要直接快照（旧单次另须子结果 / 必要日志）或批准，存在未完成槽位 / 修复 / Review，或当前入口及必需覆盖仍有失败 / 未确认
- **THEN** 写前拒绝实际输入问题，不占新号、不回退旧 PASS，不从入口 PID 消失或后续清场推导完成

#### Scenario: A stale or ordinary pass is supplied
- **WHEN** 指定旧正式 Run、普通 full 结果、当前范围 / 命令不匹配，或与当前选择矛盾
- **THEN** Close 拒绝，保留当前状态与旧结果，不根据查询 ok 或 next 自动收口

### Requirement: Discriminated current candidate close

新版 Close MUST 使用输入 `testAttemptRunRef`，其值为当前轮 `attempt.version = 2` 的完整正式 `delivery-test-attempt` Run。持久化仅使用现有 typed `manifest.testAttemptRunRef` 与该 Close 自身的 `testAttemptRunRef` / v2 acceptance 快照；当前 `manifest.deliveryRunRef` MUST 同时指向同一 Run，且轮次、全部必需覆盖、真实结束/清理、批准、基线、材料适用与直接读回成立。旧 `fullTestRunRef` / `verificationRunRef` 只用于历史单次/多来源结果及已完成 Close 的只读解析，不能作为新版 Close 的新写入入口或别名；不得把 v2 attempt 写入 `manifest.fullTestRunRef`。

#### Scenario: Close from a truthful multi-attempt conclusion
- **WHEN** 新版本试图使用此前同轮局部复验拼接 verified 结论作为 Close 的当前验收来源
- **THEN** 拒绝新 Close；原历史 verified/Close、所有来源、失败及日志仍可读取且不改写

#### Scenario: Verification has a required coverage gap
- **WHEN** 结论 incomplete、必需组缺有效通过 / 审核、仅有 skip / TODO / 取消、未知资源或来源矛盾
- **THEN** Close 在写入前拒绝实际缺口，不因包装器退出 0、命令同名或旧轮 PASS 收口

#### Scenario: A newer attempt supersedes the current conclusion
- **WHEN** 先前 command/verification 通过之后已有新的正式 attempt、修复或业务范围变化，而输入指定陈旧验收，或当前 `deliveryRunRef` 不等于所选 `testAttemptRunRef`
- **THEN** 拒绝该次新 Close，不回退旧 PASSED/verified 或历史指针；既有历史结论保持只读

#### Scenario: Old and new acceptance selectors are mixed
- **WHEN** 新 Close 输入带有 `fullTestRunRef` 或 `verificationRunRef`（单独、混合或与 `testAttemptRunRef` 并存），或指定未知类型 / 错版本
- **THEN** **新写入一律拒绝**，不把旧 command passed、v1 candidate verified 当作新验收，也不将 v2 `delivery-test-attempt` 填进旧 fullTestRunRef；**只有对已经完成的历史 Close / 旧正式结果的指定只读查询**继续按保存时的旧类型合同解释

#### Scenario: Close from a fresh complete group full pass
- **WHEN** Owner 另行授权 Close，唯一输入 `testAttemptRunRef` 指向本轮当前 `attempt.version=2` 的完整 groups-v1 正式 Run；该 ref 同时等于当前 `manifest.deliveryRunRef` 和 `manifest.testAttemptRunRef`，完整必需组、最终报告、清理、批准/基线及材料适用性均稳定 passed
- **THEN** 在新 Close Run 内保存 typed `testAttemptRunRef` 与对应 v2 acceptance 快照并完成独立收口，当前轮 closed/readback 合同识别该指针；不更新旧 `fullTestRunRef`/`verificationRunRef`、不创建 verification Run、不自动 Git 或 Reopen
