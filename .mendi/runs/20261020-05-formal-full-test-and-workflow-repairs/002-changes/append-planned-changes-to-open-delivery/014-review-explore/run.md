---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-review-explore-01
actionType: review-explore
role: reviewer
actor: codex-independent-reviewer
run: "014"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: d05-b-explore-approved-for-propose
nextAction: propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-explore/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/013-explore/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/013-explore/run.md
---

# MVP-D05-B 独立 Review Explore

**审核结论：approved（限 Explore / 可进入 Propose），无此阶段的阻断 Finding。** 固定审核对象是 [013 Author Explore](../013-explore/run.md)。D05-A 已完成独立 Archive，本审核只针对 D05-B 的“尚未 Close 的当前轮追加计划 Change”，不继承 D05-A 的 reviewer verdict，也没有实施新的 change-add CLI。

## 事实与 Author P01～P07 判断

| 关键事实 | 作者实际证据 | 独立审核判断 |
| --- | --- | --- |
| P01：bind 不能新增规划外 slot | 013 在隔离 product-v2 目标执行 `bindChange`，得到 `planning-slot-not-found`，manifest 保持原字节 | 符合 `src/application/project.ts:291–343`，是独立 add 能力的有效需求 |
| P02/P03：当前轮追加模型、依赖验证 | `projectRound` 在 r001 扩大 A/B→A/B/C、binding/轮次不变；重复、悬空、环依赖被 `readScope` 拒绝 | Reviewer 014 直接复核了相同核心 API，结果成立；但这只证明数据模型可解析，**不是合法持久化操作** |
| P04：旧正式 `passed` 不能随范围扩大变成当前 PASS | Author 真实完成 `groups-v1` Full Test；仅修改 scope 且保留当前 `deliveryRunRef` 后，readWorkspace 得到 `invalid-round-record` | 直接符合当前 `src/core/round-records.ts:22–63` 的归属校验，旧 Run 不应改写 |
| P05/P06：撤销当前指针不足以恢复正确历史/next | Author 仅清除当前 `deliveryRunRef`，新 scope 可读，但 `next` 仍为 `delivery-next`；指定旧 passed Attempt 无法按当前 scope 读取，旧 Close 被拒绝 | 必须把**当前验收失效、历史显式读取、后续待 bind 提示**作为同一合同解决，不能只清指针 |
| P07：已有稳定 `failed` 后追加也有相同缺陷 | Author 在隔离 product-v2 目标真实执行 `passed/failed/passed`，扩大 scope 后旧 failed Attempt 的轮次归属失效，原失败文件不变 | 证据支持 D05-B 必须允许安全 finished failed 后追加；仍须拒绝未确认执行、未决 Repair/Review、锁等情形 |

两份原 Author 013 脚本只在其自有 `.tmp` 夹具中实际执行/模拟 scope 追加。Reviewer 审阅了 [proof.ts](../013-explore/artifacts/proof.ts)、[proof-failed.ts](../013-explore/artifacts/proof-failed.ts)、其直接结果及清理规则；删除限定为自有且带 nonce 标记的目录，不按前缀清理其他任务。013 本身明确区分初次失败复验、真实 child 与虚拟“追加”：没有将模拟写入声称为已实现的产品 CLI，也没有把夹具 actor/verdict 当真实 Owner 授权或 Reviewer 审核。

## 独立 Reviewer proof

本 Reviewer 新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts)，直接调用现有 `readScope`、`projectRound`、`readRounds`、`recordRound` 的**纯内存**核心模型，且读取固定 Author 013 的 P01–P07 实际证据；未执行两份会删除自有夹具的原 Author 脚本。真实结果与命令记录在 [proof-results.json](artifacts/proof-results.json)、[typecheck-results.json](artifacts/typecheck-results.json)：

- **R01**：r001 中 A/B→A/B/C，`readRounds` 接受一个仍 open 的轮次；
- **R02**：旧正式 Attempt 在旧 scope 下可归属 r001，追加 C 后同一历史对象被 `recordRound` 拒绝 `invalid-round-record`；
- **R03（补充影响面）**：**原 `delivery-open` Run 若被当前 `recordRound` 解释，也会因其旧 scope 与追加后的当前 round scope 不同而拒绝。** 因此不只是过去的 passed/failed Attempt，Propose 的历史兼容合同须覆盖已有带 scope 的 Run（含 Open/Repair/Review 等实际相关类型），但无需把所有普通历史查询都改成递归重证；
- **R04**：重复 slot、悬空依赖、依赖环均被当前 `readScope` 如实拒绝；
- **R05**：固定 Author 013 的六个主 proof 与 P07 补充结果均存在且终态、旧 Run 不变的声明相符。
- Reviewer 与 013 的两份 TypeScript proof 共三项独立严格 `tsc` 检查，均 **exit 0**、stdout/stderr 为空。完整真实命令及零诊断见 `typecheck-results.json`。

这些是 **5 项 Reviewer 有针对性的纯内存/直接证据检查**，并非重新运行 Author 原有的 passed/failed group runner；这一限制不影响保留可靠的原 013 实验事实，但绝不能据此宣布新追加功能已实现。

## Propose 必须明确的合同（非新增 Owner 问卷）

1. **历史 Run 不可变与同轮范围演进。** 固化追加前的范围归属事实、加入后的当前完整范围及各历史 Run 的只读投影；既有 passed/failed、旧 Open 和其他带 scope 的直接 Run 不因本轮范围增长失去身份。不能改旧 `Run.scope`、把旧 PASS 宣传为新范围 PASS、回写旧轮，更不能为了逃避 `recordRound` 删除校验。
2. **原子失效与正确交接。** 设计保存明确追加来源/原因、同轮新的 scope 与受管当前状态；旧 Full Test 指针若保留则只能历史定位，不允许被新 Close 消费；`status/next` 要明确新增 slot 尚未 bind/归档，不能从旧归档/旧 PASS 跳出 `delivery-next`。需要解释有活动 Change 时的当前进展与下一步如何共存。
3. **正式准入与不变约束。** 由明确 Owner 范围许可触发、Author 执行；新增多项槽位但不自动 bind/激活/OpenSpec 工作或增加轮次，老 binding/Archive 序号不变；完整依赖、前序及历史轮 slot 唯一、实际有效基线 Close、材料与写锁一致；重复提交、pending、closed、执行中、unknown/资源不明和未解决 Repair/Review 必须 fail-closed，且有界保留中断现场。
4. **测试范围与限制。** Apply 要在真实隔离 product-v2 场景验证普通 open/有活动 Change/已稳定 finished passed 与 failed、旧历史读取、新范围不得用旧 Close、后续授权 bind、重复/并发/中断、跨进程读回和先前已关闭轮次。不扩张为通用作用域版本管理器，不触碰 D05-A Archive、DreMo 或真实 MenDi 根正式验收。

根路线图 `mendi-foundation-and-delivery-roadmap.md:642–653` 已明确 Owner 关于“未 Close 且 finished passed/failed 可追加、原轮和历史保留、重新完成新范围验收、bind 另获授权”的决定。上述属于 Propose 要固定的内部协议选择，暂未发现必须在 Explore 重新问 Owner 的未定产品方向。

## 限制和交接

当前没有 `mendi delivery change add` 产品入口，013 中的追加是**夹具中模拟修改 scope**，未测试真实未来 writer、锁内恢复或中断提交；Reviewer pure proof 也不认证未知并发竞争。执行中/unknown、closed、旧基线、真实多槽位追加等负例需在后续阶段实现并独立验证。现阶段 proof 足以明确实现障碍、不可逆风险和后续验收要求，无理由以需要完整 Apply 行为为由反复要求 Explore 重做。

**下一步：`propose / author / awaiting-instruction`。本 Reviewer 到此停止，不实施 Proposal/Apply、Archive、正式 Full Test、Close、Git/稳定安装或 DreMo 写入。**
