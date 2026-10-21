---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "020"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: append-history-intent-growth-and-scope-timeline-repair
nextAction: revise-apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/019-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/019-apply/run.md
---

# MVP-D05-B 独立 Review Apply（固定 Author 019）

**verdict：changes-requested。** 固定 [019 Author Apply](../019-apply/run.md)（15/15 tasks complete），受审合同为 017-revise-propose、018-review-propose approved 以及现行四份 delta；对照 013/014 关于历史轮次与旧正式结果的 Explore 真实约束。Reviewer 读取产品源码与真实场景并额外执行七次独立追加压力验证。**新 CLI 的主要用户流程可执行、当前工程检查与定向回归全部通过，但存在一个已实际复现的跨追加持久化体积缺陷，以及一个纯模型时序归属缺口。Apply 不得直接 Archive。**

## 成立的实现与独立回归

- `delivery change add` 的 Author/actor、Owner 范围来源、同轮追加、多项依赖/历史轮唯一性和 baseline Close；新增 `delivery-change-add` typed 独立收据及 `scopeAdditions/scopeAddRunRef`；保留活动 Change 最新 Run；当前正式资格失效、后续 `change-bind`；旧 passed/failed、Open/Repair/Review、跨轮 Reopen/Close 只读和失败现场，在现有覆盖场景下均具备实现与真实回归依据。
- Reviewer 新建 [reviewer-tests.ts](artifacts/reviewer-tests.ts)，在**隔离 product-v2 测试目标**重跑 10 个受影响测试文件（change-add、recovery、lifecycle、rounds、group-history、delivery-query、migration-rounds、baseline-integration、lifecycle-close、lifecycle-reopen）：**34 tests、34 pass、0 fail、0 skip，exit 0**；原始 TAP [independent-tests.tap.log](artifacts/independent-tests.tap.log) 和实际命令/汇总 [independent-tests-result.json](artifacts/independent-tests-result.json) 已保存。Author 019 曾在首轮回归出现断言/夹具失败并分别重测；Reviewer 只声明本次 34/34 独立通过，不抹掉或声称重演其每一轮旧过程。
- Reviewer [reviewer-engineering.ts](artifacts/reviewer-engineering.ts) 独立执行 `pnpm check`、`pnpm build`、固定 OpenSpec 1.14.1 `validate append-planned-changes-to-open-delivery --strict --json` 与 `git diff --check`：**全部 exit 0**；真实命令及原始输出见 [engineering-results.json](artifacts/engineering-results.json) 和 [engineering-check.log](artifacts/engineering-check.log)、[engineering-build.log](artifacts/engineering-build.log)、[engineering-openspec.log](artifacts/engineering-openspec.log)、[engineering-diff.log](artifacts/engineering-diff.log)。三份 Reviewer 自有 TypeScript proof 入口均以独立 strict `tsc -p` 检查为 exit 0、无诊断，见 [tsconfig.json](artifacts/tsconfig.json) 和 [typecheck-results.json](artifacts/typecheck-results.json)。

## Findings（阻断 Archive）

**F1 · HIGH · 真实连续追加把旧 intent 证据递归复制到新 intent，体积快速膨胀。**

- 来源：`src/application/delivery-change-add.ts:57–61` 每次准入通过 `scopeAdditionReceipts` 将**所有先前追加收据和 intent 的完整字节**并入 `bytes`；`src/adapters/scope-additions.ts:10–60` 返回这些字节；`src/adapters/change-add-store.ts:144–150` 将它们全部 Base64 放入下一次 `basis.direct`，并于 **第 191–192 行**将 `basis` 整体保存为新 `artifacts/intent.json`。
- Reviewer 自有 [reviewer-adversarial.ts](artifacts/reviewer-adversarial.ts) 使用真实 `addDeliveryChanges`，在一份**自有隔离 product-v2 夹具**内合法连续追加 C–I 共 7 次，每次都完成收据提交与工作区读回；[adversarial-results.json](artifacts/adversarial-results.json) 保存逐轮 Run、intent 文件大小、直接输入项及旧 intent 的嵌套数。真实字节为 **4,087 → 13,936 → 37,355 → 92,568 → 221,971 → 524,488 → 1,230,931**（7 次后是初次的 **301.18 倍**），最后一次完整保存 6 份旧 intent 的 Base64，旧 intent 又包含更早历史。并非项目中新增槽位及前后范围快照的正常有限线性存储。
- **影响：** 同一 Delivery 被多次合法扩展时，持久证据及恢复读/校验成本由嵌套内容主导；影响 D05-B 承诺的“有限 scope 里程碑”、实际幂等与可靠恢复，且与项目避免无意义历史树复制的规则冲突。它不是“某个文件超过硬编码字节门槛”的主张，不要求设文件大小/追加次数 gate。
- **要求 Author：** 在当前 `revise-apply` 有界修复，仍按原有身份/锁/真实直接输入/失败现场的必要校验，**停止将旧 intent 内容嵌入后继 intent**。可使用已有受管 immutable 旧收据/intent 的有限引用与必要直接摘要/比对，但不得省略真实历史真实性、故障恢复或现场证据，也不建立新通用证据库。针对**连续多轮（至少复现当前七次）**追加做实际大小、读回、历史链、重复/不同输入及各既有恢复断点复验，证明体积不再由历史 intent 递归复制放大；无需添加硬数字性能门槛。不要把此已复现的 writer 问题直接推给尚未实施的 D05-C。

**F2 · MEDIUM · 历史 scope 归属缺少与追加提交 Run 编号的时间顺序核对。**

- 来源：`src/core/round-records.ts:30–48` 根据 `round.scope` 与此前 `scopeAdditions[].beforeScope` 匹配 `record.scope`/roundId；它不检查**目标 Run 的真实编号应处于所认历史范围里程碑生效的区间**。`src/core/rounds.ts:163–185` 校验了追加收据之间的递增顺序，但 `recordRound` 没有把被归属的 Run 编号关联进去。
- 在上述隔离真实七次追加后的工作区，Reviewer 另造一份**纯内存后发 Run 摘要**：声称 Run #16（首追加为 #15）仍属于首次追加前的 A/B scope，调用真实 `recordRound`，结果为 **`r001` accepted**，见 [adversarial-results.json](artifacts/adversarial-results.json) 的 `chronologicalNegativeControl`。这说明仅凭范围快照成员关系，无法识别“提交时间在追加之后却冒称先前范围”的不合时序历史归属。
- **证据限制：** 该负例没有通过完整产品 writer 新建此错误 Run，也未证明当前正式 Close/Full Test 可借此越权；它是历史解析层的直接归属约束缺口，不能宣传为已证明可伪造正式 PASS。设计 `design.md:44–50,80–86` 已要求原提交时范围归属及伪造历史拒绝。
- **要求 Author：** 依 Run 路径已验证的编号与 `scopeAdditions[].runRef` 顺序，约束真实历史 Run 可使用的 scope 时间区间；正常旧 Open/正式 passed/failed/Repair/Review 仍按原提交时范围可读，而**追加后伪称追加前范围**的负例须拒绝。只需针对该层增加正负例，不扩大为通用时间版本框架或重新审查所有历史。

## Reviewer 维护性检查（真实物理行数）

独立 [maintenance-results.json](artifacts/maintenance-results.json) 使用当前本地源码及 Git HEAD `571c0b1` 对照，没有另建长期台账或数字 gate：

| 目录 | 当前维护代码前三名（第 3 名同数并列） |
| --- | --- |
| `src/` | `application/delivery-lifecycle.ts` **368**；`application/group-attempt.ts` **361**；`adapters/workspace.ts` 与 `adapters/openspec.ts` **346**（并列） |
| `tests/` | `action-write.test.ts` **467**；`planning-cli.test.ts` **444**；`delivery-repair.test.ts` **395** |
| `scripts/` | `proofs/mvp-d01-c-explore.ts` **678**；`proofs/mvp-d01-d-explore.ts` **487**；`proofs/mvp-d01-a-explore.ts` **463** |

本轮 `src/application/project.ts` 374→233（-141），`workspace.ts` 344→346（+2），`rounds.ts` 253→283（+30），`delivery-runs.ts` 257→292（+35）；新增 `application/delivery-change-add.ts` **220**、`adapters/change-add-store.ts` **268**、`adapters/scope-additions.ts` **61**、`core/scope-addition.ts` **137**。功能拆分大体遵循准入/事务恢复/纯范围合同的实际职责；但 **store/receipt 的历史材料复制责任存在 F1 已证实的增长问题，应先修订再继续扩展**，不是为了行数而再加薄转发层。tests 的最长三个与 HEAD 相同；历史 scripts 未扩展。

## 审核范围、限制与交接

本次所有新测试和七次追加均在新建的隔离 product-v2 fixture，测试输入、Reviewer source、原始命令/日志与结果保存在 `020` 本轮 artifacts。Reviewer 自有七次追加验证仅定向清理带 nonce 自有标记、无 `.mendi/write.lock` 且路径匹配的自己的 fixture parent；绝不按前缀清理其他任务。**未对 MenDi 根 manual-bootstrap 运行任何正式 Delivery Full Test、Close、Archive、Git 提交、稳定安装或 DreMo 写入**；未修改 019 Author 实现、旧 Author/Reviewer Run/verdict。此次 Reviewer 新产生的 020 Run/artifacts 与人工 manifest next 是独立审核记录，不等于产品写入成功或自签 Author。

**下一步：`revise-apply / author / changes-requested`。** 修复 F1 的递归证据复制及 F2 的 Run scope 时间归属；保持当前 D05-B Propose 与此前有用的 P01–P07 / 014/018 审核及真实回归结果，不必重做 Explore/Propose。修订后由独立 Reviewer 执行新的 `review-apply`；未批准 Archive。
