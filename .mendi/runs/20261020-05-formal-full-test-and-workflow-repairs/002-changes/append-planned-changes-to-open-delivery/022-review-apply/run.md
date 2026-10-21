---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-review-apply-02
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "022"
status: completed
actionStatus: completed
outcome: complete
verdict: changes-requested
result: f1-f2-resolved-new-digest-list-integrity-gap
nextAction: revise-apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/021-revise-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/021-revise-apply/run.md
---

# D05-B 独立 Review Apply — 021 Author 修订

**结论：changes-requested。** 固定审核对象为 [021 Author revise-apply](../021-revise-apply/run.md)，相对于原 [019 Author Apply](../019-apply/run.md) 与 [020 独立 Review changes-requested](../020-review-apply/run.md)。本轮复核 020 的 F1/F2，两项在真实修订源码与独立隔离运行中都已解决；但针对新的摘要引用机制追加了一个真实复现的阻断项 **F3**。不推翻已批准的 017/018 Propose，不改历史 019/020 verdict 或 Author 产品实现。本 Reviewer 仅增加 022 Run/artifacts 和 manual-bootstrap manifest 交接。

## 已修复 F1/F2：直接 Reviewer proof

[reviewer-proof.ts](artifacts/reviewer-proof.ts) 使用单份独立 product-v2 测试目标连续调用真实 `addDeliveryChanges` 7 次，保存 [proof-results.json](artifacts/proof-results.json)：
- **F1 fixed：** 每份新 intent 的 `direct` 不嵌入先前 intent 原始字节；历史收据/intent 以明确受管路径和 SHA-256 摘要引用。实测第 1～7 次 intent 字节为 **4115、6361、8766、11547、14704、18237、22146**（末次/首次数值比 **5.38**，020 旧实现对应为 301.18）。每轮核对已有历史 digest 与源文件实际 SHA-256，保存的真实 submitted 收据、轮次与新增 scope 都可以读取；保留了旧 intent 篡改时按摘要拒绝读回的正常负例。不将七次有限测量夸大为任意次数的性能保证或字节门槛。
- **F2 fixed：** `src/core/round-records.ts:31–51` 使用同轮 `scopeAdditions[].runRef` 的真实 Run 编号作为互斥生效区间。Reviewer 用真实七次提交得到的边界（首追加 #15、最后追加 #21）测试：旧范围在首追加之前的 Run 可归属原轮，而编号 #15、#16、#21、#22 的错误旧范围 Run 被拒绝；在末次追加后，当前范围对应的下一 Run 可以归属。非法历史对象是**纯内存模拟 Run**，没有新建伪造的产品 Run；测试没有改旧源/历史。
- 独立 proof 的临时目录由 `verificationTarget` 返回，匹配仓库 canonical `.tmp` 的准确父目录、唯一 nonce marker、无写锁才清理自己的目标；从未扫描/删除其他 `.tmp/mendi-apply-*` 目录。F1/F2 先前真实 020 Finding 和负例材料仍留在 020。

## 新阻断 Finding F3

**F3 · MEDIUM（当前 Apply 正确性，Archive 前必须修复）· 新摘要链允许通过删除摘要列表绕过旧受管 intent 变更检测。**

- `src/adapters/change-add-store.ts:154–181` 按本轮先前 milestone 建立 `basis.directDigests`，新 intent 不再复制旧原文。提交/恢复时 `change-add-store.ts:65–82` 的 `confirmBasis` **仅遍历 present 的 digest 记录**。读取时 `src/adapters/scope-additions.ts:37–63` 对 `basis.directDigests` 只在**字段存在**时逐项验 hash，没有依据此轮已保存的 prior `scopeAdditions` 校验这些必需受管 Run/intent 路径是否全部出现在 `direct`（旧完整字节方式）或 `directDigests`（新摘要方式）中，也未拒绝遗漏/删除列表。
- [reviewer-integrity.ts](artifacts/reviewer-integrity.ts) 在另外一份**独立** product-v2 fixture 真实提交两次 `delivery-change-add`。第二份 intent 原有两个 `directDigests` 条目。Reviewer 首先**仅删除**第二份 intent 的整个 `directDigests` 字段，再调用真实 `readWorkspace`：**accepted=true**。接着保持列表缺失，在同一隔离 fixture 对第一次 intent 原字节追加空格，再次实际 `readWorkspace`：**accepted=true**。恢复被改过的两个真实文件后，正常读回无误。完整实际观测、操作范围、两文件精确 ref 与限制见 [integrity-results.json](artifacts/integrity-results.json)。
- **影响边界：** 证明当前“校验摘要值”不等于“已核验全部必需历史依据”；篡改只发生在受控隔离文件中，**没有证明实际正式 Full Test/Close 能因此越权、也没有外部攻击者案例**。但 D05-B 新合同保证有限链可按实际提交范围与旧受管收据一致读回；提交后的必要 digest 引用若缺失不应被认为历史完整。新 Field 的缺席可能在旧版 intent 中合法，不应直接禁止所有旧格式。
- **要求 Author：** 在当前 `revise-apply` 局部补充 **历史必需引用集合完整性**校验：针对当次 intent 保存的 before manifest/current round scopeAdditions，计算应引用的旧 `run.md` 与 `artifacts/intent.json` 身份。新 digest 形式要求对应项完整且摘要正确；旧完整字节 `direct` 形式继续合法。缺项、重复/冲突/越界路径或两种形式都没有提供应有的历史直接对象时 fail-closed，拒绝提交、读回及恢复；保留旧格式无 digest 字段的真实有效记录，避免不必要的迁移/证据账本。可由具体 parser/证明机制落实，不限定字段名。
- **要求验证：** 在 `tests/change-add-review-repair.test.ts` 或相关受控场景加入“新两次以上追加后删整个 directDigests/删一个 digest/修改旧 intent”真实负例；原样的旧 `direct` 完整字节方式正例、七次追加体积与读回、真实中断恢复及 `pnpm check/build` 按影响复验。修复后的存储不应重新复制旧意图全文，也不应引入通用证据存储平台。保留 021 已通过的 F1/F2 proof 和 020 的原 findings。

## 独立回归与工程核对

- [reviewer-tests.ts](artifacts/reviewer-tests.ts) 将 Author 原组合超时的关联测试拆成两次**真实完成**的批次，完整原始 TAP 分别保存为 [tests-fix-and-recovery.tap.log](artifacts/tests-fix-and-recovery.tap.log) 和 [tests-affected-compat.tap.log](artifacts/tests-affected-compat.tap.log)，命令/各计数在 [independent-tests-result.json](artifacts/independent-tests-result.json)：第一批 4 个新改/恢复/round 文件 **14/14 passed, exit 0**；第二批 4 个 lifecycle/group-history/Close/migration 文件 **11/11 passed, exit 0**。合计 **25 tests、25 passed、0 failed、0 skipped**。不是对根 D05 执行正式 Full Test，也不谎称全部 11 文件一次通过。020 上轮独立完成的其它历史测试按没变部分沿用。
- [reviewer-engineering.ts](artifacts/reviewer-engineering.ts) 独立实际运行 `pnpm check`、`pnpm build`、OpenSpec 1.14.1 `validate append-planned-changes-to-open-delivery --strict --json`、`git diff --check`：各 exit 0，原始输出分别在 `engineering-check.log`、`engineering-build.log`、`engineering-openspec.log`、`engineering-diff-check.log`，回执 [engineering-results.json](artifacts/engineering-results.json)。这些工具不检测 F3 的业务语义。独立四份 Reviewer TypeScript 入口经严格 TS 真正类型检查 **exit 0、零诊断**，见 [tsconfig.json](artifacts/tsconfig.json) 和 [typecheck-final.json](artifacts/typecheck-final.json)。
- 此前 021 Author 真实 11 文件合跑 SIGTERM/ETIMEDOUT，且记有其后局部分组已通过的证据；Reviewer 未擦除超时或自称其单次成功。

## 维护性检查（本次独立实际物理行数）

[maintenance-results.json](artifacts/maintenance-results.json) 按当次 `src/tests/scripts` 可维护 .ts 文件计数，末尾单个终止换行不算额外空行；可靠 HEAD 为 `571c0b1`，不存在的新增文件不捏造历史增长：

| 目录 | 前三（含第三名并列） |
| --- | --- |
| `src/` | `application/delivery-lifecycle.ts` **368**；`application/group-attempt.ts` **361**；`adapters/openspec.ts`、`adapters/workspace.ts` **346**（并列第三） |
| `tests/` | `action-write.test.ts` **467**；`planning-cli.test.ts` **444**；`delivery-repair.test.ts` **395** |
| `scripts/` | `proofs/mvp-d01-c-explore.ts` **678**；`proofs/mvp-d01-d-explore.ts` **487**；`proofs/mvp-d01-a-explore.ts` **463** |

实际变更有 `src/application/project.ts` 374→233，`core/round-records.ts` 70→89（+19）和 `core/rounds.ts` 253→283（+30）；新 `adapters/change-add-store.ts` 为 315 行、`adapters/scope-additions.ts` 为 86 行，无同名 HEAD 基准。职责主要分在当前写入、历史摘要验证、纯范围归属，没发现因行数要强行再拆的必要；**现有 scope-additions/commit 的 provenance 完整性正是 F3 修复落点**，应局部加真实一致性核对而非引入薄转发层。

## 审核限制与交接

本轮独立 Review 实验只作用于自有隔离 fixture，结束时恢复读回且按精确 nonce/无锁规则清理；实际现行 MenDi 根为 manual-bootstrap，不经过产品 CLI 擅自改写。未更改 021 Author 源码/方案、旧 Run/verdict，也未执行根 D05 正式 Full Test、Close、Archive、Git 提交/Push、稳定安装或 DreMo 写入。过去的 F1/F2 是**已修复并保留原历史 Finding**，新 F3 是本次实际复现的阻断，不能用工具绿或保存新版 proof 自动视为已批准。

**下一步：`revise-apply / author / changes-requested`。** 仅针对 F3 在 D05-B 当前范围内修订，然后新一轮独立 `review-apply`；停止，不进入 Archive。
