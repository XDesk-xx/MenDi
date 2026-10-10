---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-review-apply-02
actionType: review-apply
role: reviewer
run: "029"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: archive
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/028-revise-apply/run.md
---

# MVP-D02-C Review Apply 补审

Owner 指令：review-apply。固定独立审核 [028 revise-apply](../028-revise-apply/run.md)，重点核对 [027](../027-review-apply/run.md) 的 RA-C-001 / RA-C-002 修复与受影响路径；其余仍适用结论沿用。使用项目 [Review Apply 方法](D:/Projects/MenDi/skills/actions/review-apply/SKILL.md) 和 [Open Code Review delegate](C:/Users/xuser/.codex/plugins/cache/open-code-review/open-code-review-codex/1.0.0/skills/open-code-review-delegate/SKILL.md)。

**verdict：approved。** RA-C-001 / RA-C-002 均关闭，本次范围没有新增阻断发现。025 方案批准、027 其余适用结论保持；可以交 Author 进入 Archive，尚未实际归档。未修改实现、Author Run 或旧 verdict 后自行批准。

## 定向复核

| 发现 / 路径 | 实现与独立验证 | 结论 |
| --- | --- | --- |
| RA-C-001 | `confirmLifecycle` 首次关联用既有 `bindingFor` / `assertAssociationAvailable` 检查槽位与依赖。首次空 binding 集合不能满足 B dependsOn A；旧入口和记录化入口均在写前拒绝，合法 A 仍成功。记录化保存 001 / openRunRef，旧入口不补 Run；关联后均退出 deliveryRunRef。 | 关闭 |
| RA-C-002 | `commitLifecycle` 在首次 mkdir 前通过 `basisWorkspace` 核对空基准并调用语义确认；应用入口也先确认。两种入口填错槽位均无 `.mendi`、无占号，改正后直接成功，不需清理或 resume。 | 关闭 |
| 锁内及故障边界 | 首次预检没有替代锁内、intent 后与 finish 的直接材料复核。独立重跑在 lock-acquired / intent-written 移动实际 Change 的场景：请求拒绝，提交后现场和相应锁保留；旧首次 pending 缺 manifest 的诊断 / resume 与真实子进程竞争回归通过。真实写入开始后的目录保留不属于普通错误输入残留。 | 未见回归 |
| 规格与方法 | design §5、delivery-workspace 新增首次关联场景、tasks §8.1、delivery-open 方法及 README 对应表述一致，落实已有首次关联语义，没有扩展 Close / Reopen 范围或新增 gate。 | 无需 revise-propose |

读完整个两份受影响实现与新增 95 行测试，并核对原首次 Open、共同关联准入、空基准转换和必要提交上下文。新增测试使用真实固定 OpenSpec 目标；同时核对 028 的修复前 0/2 原始失败，以及后续测试断言纠正说明。本 Reviewer 独立执行当前测试，没有把 Author 自报通过作为批准依据。

## 独立验证及限制

- `pnpm check`：退出 0，112 个维护文件的格式 / 基础 lint，以及 src、scripts、tests 三个真正 TypeScript 检查通过，见 [check.log](artifacts/check.log)。现有 pnpm metadata 提示保留，不自动安装或另开修订。
- `pnpm build`：退出 0，见 [build.log](artifacts/build.log)。
- `node --test --test-concurrency=2 --test-name-pattern '首次|关联与范围|真实 Open 时|两个真实子进程' tests/lifecycle-open-admission.test.ts tests/lifecycle-open.test.ts tests/lifecycle-writes.test.ts tests/cli.test.ts tests/concurrency.test.ts`：选中 8 项，8/8 通过、失败 / skipped 均 0，退出 0，见 [regression.log](artifacts/regression.log)。这是定向选择，不代表未选中的所有测试被重新执行。
- 固定 OpenSpec 1.14.1 `validate delivery-close-and-reopen --strict --json` 通过；`instructions apply --change delivery-close-and-reopen --json` 为 22/22、all_done。见 [validate.json](artifacts/validate.json)、[apply-instructions.json](artifacts/apply-instructions.json)。
- 本次新增确认局限于首次关联与提交前检查；027 的 29/29 生命周期 / 项目回归、三项历史修复 3/3 及其语义结论仍适用。026 原全仓结果保持 186/189、退出 1，本轮未宣称全仓重新 189/189，也未复制或改写原日志。
- 隔离目标验证不等于根项目正式 Full Test / Close 或生产验收。根 D02 保持 open / manual-bootstrap、累计归档数 6；未执行 Archive、根正式 Full Test、Close / Reopen / 新 Open、Git 写入或清理临时现场。

OCR 只用于确定性文件选择和规则解析，未调用外部模型。preview 前排除历史 artifacts、生成物和沿用结论的范围；选中两份受影响实现：total_files=2、reviewed_files=2、skipped_files=0、coverage_rate=100%，只指选中范围。测试及直接规格、方法和交接由 Reviewer 补审。文件级处理见 [ocr-coverage.json](artifacts/ocr-coverage.json)，规则及原 preview 各保留一份；React 等无关规则不用于制造问题。Git 尚未提交，OCR 视两份实现为 added，因此读取全文，不以 Git HEAD diff 伪称仅包含 028 的修订差异。

## 行数与职责

当前维护 TypeScript 的物理行数，排除夹具、历史 Run 与生成物：

| 范围 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | `application/delivery-full-test.ts` 401 | `adapters/openspec.ts` 346 | `adapters/lifecycle-store.ts` 336 |
| tests | `action-write.test.ts` 467 | `planning-cli.test.ts` 444 | `delivery-repair.test.ts` 394 |
| scripts | `proofs/mvp-d01-c-explore.ts` 678 | `proofs/mvp-d01-d-explore.ts` 487 | `proofs/mvp-d01-a-explore.ts` 463 |

依据 027 已核对行数与 028 本轮 before，应用生命周期 302 → 308（+6）、存储 333 → 336（+3）；准入留在应用、提交顺序留在存储，新增测试单独分组 95 行，旧长测试 / proof 未继续扩展。未见需要立即拆分的新增混杂职责；后续扩展混杂职责时先整理，不加硬行数门槛、纯转发层或台账。

必要当前输入与有限 resume 基准保持直接引用；无新增递归 Ref、全量 hash 或工程检查 gate。next 只保留本 029 的直接审核入口，固定 Author 及前次结论从本 Run 定位。

## 交接

停在 `archive / awaiting-author / author`。Author 按后续指令实际归档，保留原验证限制；当前批准不代表 Archive 已执行或 D02 已 Close。未创建后续 Author Run。

人工 manifest、README 和 OpenSpec context 已同步本次交接。CLI [status](artifacts/status-final.json) / [next](artifacts/next-final.json) 读回成功，next 仅引用本 029；D02 仍 open、累计归档数 6，所改交接文件的 `git diff --check` 通过。
