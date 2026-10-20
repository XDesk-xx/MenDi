# Spec Delta

## MODIFIED Requirements

### Requirement: Current delivery progress and minimal handoff

Delivery 进展 SHALL 由显式当前指针读取，不倒查失败 / 修订链。实质修复与独立 Review 沿用原交接；新 groups-v1 完整正式 Run 自身 passed 即待 Owner 另行授权收口，不增加例行 verification 或 owner-decision。已知普通环境问题按核实事实进行新完整执行，不生成空 Repair/Review Runs。closed 当前选择 Close；Reopen / Open 完成后提示范围内显式 bind，退出旧 PASS 的当前适用选择但保留最近正式入口。待提交生命周期写入与 unknown MUST 停 Owner 核对 / 显式有限继续。next 只包含当前必要入口，不自动执行或累积旧 Close / 审核链。

#### Scenario: Repair completes and reviewer continues
- **WHEN** Author 修复 complete，随后独立 Review 开始并提交 continuing
- **THEN** next 只携带当前 Author 或当前 Review 的实际必要入口，角色正确；Review continue 保留原固定 Author，查询不追读其正文

#### Scenario: Revision replaces the current approval entry
- **WHEN** 当前完成 Author 或当前 Review 固定的 Author 被显式范围内修订
- **THEN** 新修订记录替换当前交接入口，旧 approved 不允许直接进入新正式执行；旧 verdict 和正文保持

#### Scenario: A source link is unavailable during query
- **WHEN** 当前修复 / Reviewer 头部有效，旧 sourceFullTestRunRef、revisesRunRef 或说明链接不可用
- **THEN** 普通查询不递归读取；开始 / 继续 / 提交只另核对该操作实际需要的直接输入，不能自动由查询成功生成批准

#### Scenario: Full test observation cannot confirm the saved result
- **WHEN** 当前正式记录保存 passed，但本次必要结果的观察未确认
- **THEN** next 使用本次 unknown 观察停 Owner，与 verification 一致，不只按持久头部提示通过；不改写旧 Run

#### Scenario: Reopen or new open is current without a formal result
- **WHEN** 当前 Run 为完成的 Reopen 或记录化新 Open，尚无本轮正式结果
- **THEN** 不要求这些 Run 携带 fullTest 或 repair；Reopen 保留 fullTestRunRef 作历史，新 Open 没有它，均不展示本轮验收通过

#### Scenario: Current close is retained without execution revalidation
- **WHEN** 当前 Delivery 为完整 closed，Close 头部 / 摘要与 manifest 一致
- **THEN** query 展示持久收口事实与等待 Owner 提示，只引用其正式入口供显式查询；不递归检查旧测试 / 审核正文，也不重新认证受测材料

#### Scenario: New complete formal pass needs no aggregation
- **WHEN** 当前新正式 Full Test Run 自身稳定 passed 且当前范围有效
- **THEN** next 提示 Owner 决定是否单独授权 Close，不要求创建 verification Run、也不要求对 PASS 作额外 owner-decision

#### Scenario: Failure repair versus confirmed environment retry
- **WHEN** 当前必需组明确业务失败或测试合同需实变，或仅有已确认环境准备阻断且现场已安全恢复
- **THEN** 前者 next 指向 delivery-repair 并等待独立 review-delivery-repair，后者可直接提示新完整正式执行，保留旧失败记录

#### Scenario: Unknown runtime must not appear passed
- **WHEN** 实际执行、清理或持久提交未确认，或新读回与本次保存不一致
- **THEN** next 停 Owner 核查本次现场，不回退历史 verified 或自动解锁、重试
