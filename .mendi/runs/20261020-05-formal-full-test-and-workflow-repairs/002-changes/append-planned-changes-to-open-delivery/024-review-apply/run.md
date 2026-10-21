---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-review-apply-03
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "024"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: revised-apply-approved-for-archive
nextAction: archive
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/023-revise-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/023-revise-apply/run.md
---

# D05-B 独立 Review Apply：023 修订 F3

**审核结论：approved（仅批准 D05-B 当前 Apply 实现可进入 Archive），无未解决阻断 Finding。** 固定 Author 是 [023-revise-apply](../023-revise-apply/run.md)，修订自 021，并响应 [022-review-apply](../022-review-apply/run.md) 的 `changes-requested` F3。019、020、021、022 的历史 Run、失败/通过原始证据和原 verdict 保持不变；023 方案与产品实现均未由 Reviewer 修改。产品整体 D05 正式 Full Test、Close、Git、安装另守 Owner 授权边界。

## 对 022 F3 的实际修复核对

023 在 `src/core/scope-addition.ts:117–151` 增加 `additionEvidenceRefs/requireAdditionEvidence`：从追加前 product-v2 Workspace 的有限 `scopeAdditions` 推导必须出现的已提交历史 `run.md` 及其 `artifacts/intent.json`。全量历史引用身份需**恰好覆盖一次**（可由旧 Base64 `direct` 或新紧凑 `directDigests` 承担，禁止两种途径为同一历史身份重复提交），未纳入既存历史的摘要引用拒绝。对原本需要保存的**其它普通直接输入**仍保留旧校验职责，不误将其当成历史 Run/intent 证据。依实际身份受管路径解析，不改 D01～D05-A 已提交历史。

- `src/adapters/scope-additions.ts:41–113` 每次历史读回，从该 intent 保存的原 project/manifest 解析 before Workspace，在解释历史收据前执行上述集合完整性验证。对旧 `direct` 路径直接比对原始受管字节，对新 `directDigests` 比对真实文件 SHA-256；原 `scope/roundId/priorPointers` 与已提交 typed 收据一致性仍严格。
- `src/adapters/change-add-store.ts:65–88` 在提交、显式恢复、持久读回多个阶段通过 `confirmBasis` 使用同一完整性约束，不能只因 digest list 已删除就默认无历史材料。保存新 intent 时仍只为历史受管文件保存精确引用加摘要，不复活 F1 的 Base64 递归复制；F2 的 Run 编号与原 scope 生效区间仍由现行 `recordRound` 实现。
- 保留实际 Owner 范围授权与独立 bind 边界、合法活动 Change 最新 Run、旧正式 passed/failed 历史只读和新范围验收失效、锁/unknown/修复审核未决的 fail-closed；本次没有重新制定历史范围版本系统或自动 Complete/Close。

## Reviewer 自建隔离 proof 与原始结果

Reviewer [reviewer-proof.ts](artifacts/reviewer-proof.ts) 在**另外一个自有 product-v2 夹具**真实创建两次 `delivery-change-add`，保存 [proof-results.json](artifacts/proof-results.json)。直接按照 022 的 F3 原始负例验证，并扩展遗漏、冲突、旧格式：

| 独立案例 | 当前实际结果 |
| --- | --- |
| 正常两次追加与真实提交的有限 digest 历史 | 通过 |
| 删除第二次 intent 的**整个** `directDigests` 列表 | `invalid-scope-addition`，正确拒绝 |
| 删除列表后又篡改首次 intent 原字节 | `invalid-scope-addition`，正确拒绝 |
| 缺失列表时显式对第二次 Run `--resume` | `invalid-scope-addition`，正确拒绝 |
| 单项遗漏、digest 重复、历史身份在 `direct` 与 digest 冲突 | 全部拒绝 |
| 追加非历史 digest 或越界 ref | 全部拒绝 |
| 合法旧完整 Base64 `direct` 包含全部旧 Run/intent | 保持正常可读 |
| 旧完整字节方式下，首次 intent 原文件发生修改 | `delivery-input-changed`，正确拒绝 |

共 **11 项受审独立断言全部通过**；两份受控 intent 修改后均还原，读回旧二次提交的 `submitted` 收据及新 scope 正常。夹具只在准确的 `.tmp/mendi-apply-*/project`、Reviewer nonce marker、realpath 和无写锁条件都满足时定向清理**自己**的临时对象，绝无前缀枚举删除。不能把这项局部证明延伸为攻击者能够一致改写全部历史文件时的数字签名式防篡改能力，这不是 MenDi 的目标合同。

本 Reviewer 未修改 root MenDi 的 manual-bootstrap Delivery；脚本只在明确产品隔离 target 上执行，原始结论保存在当次 artifacts。

## 独立回归和工程验证

Reviewer [reviewer-tests.ts](artifacts/reviewer-tests.ts) 实际分两批运行**7 个受影响测试文件**，成功在独立进程得到完整 TAP 终态，且没有复用 Author 023 已保存的 summary 冒称独立运行：
- 第一批 F3、七次连续真实追加、七个中断恢复断点、竞争、round 时序与历史链：**10/10 passed, 0 failed, 0 skipped, exit 0**。原始 [tests-f3-and-recovery.tap.log](artifacts/tests-f3-and-recovery.tap.log)。
- 第二批正式 passed/failed 后追加、活动 Change 与 query、旧 Repair/Review、legacy command 只读、typed Close 及旧格式历史：**17/17 passed, 0 failed, 0 skipped, exit 0**。原始 [tests-append-and-compat.tap.log](artifacts/tests-append-and-compat.tap.log)。
- [tests-results.json](artifacts/tests-results.json) 保存真实命令/范围/完整计数：合计 **27/27 passed**。之前 022 Reviewer 的迁移/Close/Reopen 等未被当前 F3 改动的有效证据保留引用，不机械全量重跑以前通过的全部历史任务。没声称此次正式运行 D05 Delivery Full Test。

Reviewer [reviewer-engineering.ts](artifacts/reviewer-engineering.ts) 实际再次执行 `pnpm check`、`pnpm build`、OpenSpec 1.14.1 `validate append-planned-changes-to-open-delivery --strict --json`、`git diff --check`，**四项均 exit 0**。原始输出依次存于 [engineering-check.log](artifacts/engineering-check.log)、[engineering-build.log](artifacts/engineering-build.log)、[engineering-openspec.log](artifacts/engineering-openspec.log)、[engineering-diff-check.log](artifacts/engineering-diff-check.log)，执行命令及结果见 [engineering-results.json](artifacts/engineering-results.json)。

全部 Reviewer 三份独立 TypeScript 入口经严格 `tsc -p` 类型检查 **exit 0、stdout/stderr 均空**，可复现 [tsconfig.json](artifacts/tsconfig.json) 与原始 [typecheck-results.json](artifacts/typecheck-results.json)。类型/结构/测试通过并非自动签署，本 verdict 还基于上述直接代码检查和 F3 正负例。

## 维护责任与代码增长

本 Reviewer [maintenance-results.json](artifacts/maintenance-results.json) 实际统计当前维护中的 .ts 物理行数（包含空行；普通末尾换行不当额外一行）并以可读取 Git HEAD `571c0b1` 作存在同名文件时的对照；不用任意行数 gate。

| 目录 | 维护代码最长文件（第三名并列全部列出） |
| --- | --- |
| `src/` | `application/delivery-lifecycle.ts` **368**；`application/group-attempt.ts` **361**；`adapters/openspec.ts`、`adapters/workspace.ts` 各 **346** |
| `tests/` | `action-write.test.ts` **467**；`planning-cli.test.ts` **444**；`delivery-repair.test.ts` **395** |
| `scripts/` | `proofs/mvp-d01-c-explore.ts` **678**；`proofs/mvp-d01-d-explore.ts` **487**；`proofs/mvp-d01-a-explore.ts` **463** |

当前 `core/round-records.ts` 70→89、`application/project.ts` 374→233；新增 `core/scope-addition.ts` 173、`adapters/scope-additions.ts` 115、`adapters/change-add-store.ts` 320，因新文件无 HEAD 同名基准，不造增长率。F3 的三层变更各有纯合同/历史读取/受管恢复职责；当前没有必须重拆的混杂职责，也不应为压行数加纯转发层。后续如继续扩展收据身份或恢复分支，应按真实变化复核责任边界。

## 停止边界

**本次独立 verdict：approved；下一步 `archive / author / awaiting-instruction`。** 只允许按独立 Owner/Author 授权继续本 Change 原生 OpenSpec Archive，并留正常回执；不得基于此审核自动执行 Archive、根 D05 正式 Full Test、Close、Git checkpoint/push、稳定安装或 DreMo 操作。D05-B 的 Apply 审核通过不意味着整体 D05 已验收或版本已发布。
