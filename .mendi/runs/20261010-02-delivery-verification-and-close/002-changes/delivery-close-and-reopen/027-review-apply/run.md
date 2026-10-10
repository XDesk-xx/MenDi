---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-review-apply-01
actionType: review-apply
role: reviewer
run: "027"
status: completed
actionStatus: completed
result: changes-requested
verdict: changes-requested
nextAction: revise-apply
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/026-apply/run.md
---

# MVP-D02-C Review Apply

Owner 指令：review-apply。固定独立审核 [026 Apply](../026-apply/run.md) 与 025 批准方案，使用项目 [Review Apply 方法](D:/Projects/MenDi/skills/actions/review-apply/SKILL.md) 及 [Open Code Review delegate](C:/Users/xuser/.codex/plugins/cache/open-code-review/open-code-review-codex/1.0.0/skills/open-code-review-delegate/SKILL.md) 辅助。不修改实现后自行批准。

**verdict：changes-requested。** 两项 P2 已独立复现，均属于记录化首次 Open。交回 Author 定向修订，当前不能 Archive；未改实现、026 Author 或旧 verdict。

## 发现

### RA-C-001 · P2 · 记录化首次 Open 绕过首次关联的依赖检查

位置：`src/application/delivery-lifecycle.ts:281–286`。

首次 Open 同时关联已有 Change 时，新 role / actor 入口直接构造 initialBinding；后续只检查槽位存在，没有复用既有 `assertAssociationAvailable` 的依赖准入。隔离真实 OpenSpec 目标中，范围为 A、B dependsOn A，A 尚未归档：不带 role / actor 的旧入口返回 `change-dependency-not-archived` 且不创建状态；同样输入带 Author / actor 后却成功绑定 B，activeChangeId 已写入。这违反现有首次关联和顺序 Change 约束，也与 README 的首次关联承诺不一致。

要求：在首次写入前复用槽位与依赖的既有语义检查，并保持必要的锁内复核；覆盖两种入口在依赖未完成时均拒绝，以及合法首次关联。不要增加新的 gate 或单独的引用体系。

### RA-C-002 · P2 · 错误首次槽位留下空状态目录，正确重试被阻断

位置：`src/adapters/lifecycle-store.ts:157–158`，后续 `parseDeliveryRun` / `lifecycleTargets` 在第 198–200 行才校验首次关联。

显式记录化首次 Open 填入不存在的槽位，先创建 `.mendi`，随后才返回 `planning-slot-not-found`。独立复现的目录为空，无 Run、pending 或 project；改正为合法槽位 A 再执行，得到 `incomplete-mendi-state`，也没有可 resume 的操作。旧入口同类错误则在写前拒绝，不留下状态。普通输入错误因此变成需要额外人工处理的不完整工作区。

要求：在创建首次状态目录前完成可预检的输入语义校验，增加“错误输入 → 修正后直接成功”的回归。仍保留真实提交中断现场；不要通过自动清理既有 `.mendi` 或新建恢复框架掩盖问题。

两项共用独立 TypeScript 复现脚本 [boundary-probe.ts](artifacts/boundary-probe.ts)，结果见 [boundary-probe.json](artifacts/boundary-probe.json)，机器 findings 见 [findings.json](artifacts/findings.json)。复现调用公开 application 入口、实际固定 OpenSpec 工具与隔离目标，未改实现或根项目状态。

## 其余审核结论与边界

| 重点 | 本轮核对 |
| --- | --- |
| Close 输入 | 固定当前正式父 / 子结果、必要日志、当前双指针、本轮范围、命令及直接批准快照；普通 PASS、陈旧结果、unknown、当前修复或必要输入损坏均拒绝。applicability 仍是阶段对真实材料的判断，文字和 actor 不认证源码或 Owner 身份。 |
| closed 与历史读取 | 默认 closed 查询使用持久 Close 摘要；指定正式结果按其所属登记 Delivery 读取，普通结果按显式 Delivery 选择。旧归档计数可小于当前累计值，正在提交的 Archive 仍核对 countBasis，不随历史读取放宽。 |
| Reopen / 新 Open | 新范围自包含，旧 binding / Run / PASS 保留；当前选择不回退旧工作，首次实际新 Change Run 才分配新批次。closed 后新 Open 追加独立索引与 001，不继承旧正式入口，不迁移 manual-bootstrap。首次可选关联存在上述两项缺陷。 |
| 有限 resume | intent、pending、terminal、manifest、最终入口及读回分别核对；terminal 不等于整体提交成功。resume 检查原 actor / 类型 / 输入 / 当前现场，保留占号，不重测、不改 terminal、不自动解锁。独立 pending 诊断复现确认 current 正确指向 pending Run，不列为缺陷。 |
| 引用与复杂度 | 直接必要对象才读取；旧正文、说明和未知 Ref 不递归成为查询前提。没有全量 hash、独立容量门槛或工程检查接入产品 next。新增存储、生命周期转换与应用准入分工有实际职责，不是压行数的转发层。 |

025 的方案批准保持有效。两项为实现遗漏，先定向 revise-apply，再独立补审修复及受影响路径；其余仍适用结论可沿用，不要求重做 Explore / Propose。

## 验证与证据限制

- `pnpm check` 通过：111 个维护文件的格式 / lint 与三个真正的 TypeScript 检查入口；`pnpm build` 通过。日志为 [check.log](artifacts/check.log)、[build.log](artifacts/build.log)。pnpm 的现有 workspace metadata 提示保留，未自动安装依赖。
- 固定 OpenSpec 1.14.1 `validate delivery-close-and-reopen --strict --json` 通过；Apply instructions 为 21/21、all_done。见 [validate.json](artifacts/validate.json)、[apply-instructions.json](artifacts/apply-instructions.json)。任务完成与结构检查不代替语义批准。
- `node --test --test-concurrency=2 tests/lifecycle-close.test.ts tests/lifecycle-open.test.ts tests/lifecycle-records.test.ts tests/lifecycle-reopen.test.ts tests/lifecycle-writes.test.ts tests/delivery-full-test.test.ts tests/project.test.ts`：29/29 通过，退出 0，见 [review-tests.log](artifacts/review-tests.log)。包括两条真实生命周期接线、旧 PASS / unknown、新首次失败、必要输入与历史说明边界，以及 close / reopen / open 共 27 个提交中断场景和有限 resume。现有测试通过仍未覆盖上述两个反例，须补回归。
- 026 首轮 `pnpm test` 为 186/189，三项失败原始日志保持。Reviewer 对三个已修复场景独立重跑：`node --test --test-concurrency=1 --test-name-pattern "两个真实子进程|明确合法后续|日志、子终态" tests/concurrency.test.ts tests/delivery-query.test.ts tests/delivery-write.test.ts`，3/3 通过，见 [prior-fixes-tests.log](artifacts/prior-fixes-tests.log)。本轮未宣称重新获得全仓 189/189。
- `boundary-probe.ts` 用独立 `tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --strict --skipLibCheck` 检查通过，执行退出 0，确认上述两个反例。首次探针对 pending 诊断的猜测被实际结果否定，已纠正探针断言，原始失败输出保留在 `boundary-probe-first.stderr.log`；没有以此提出产品缺陷。
- 生命周期目标使用真实 unit / integration 映射与原生 Archive；其阶段批准是受控记录夹具，不认证根仓库的独立审核或生产覆盖。026 的真实场景输出可沿用为对应事实；旧 Explore proof 不提升为产品验收。本项目 D02 保持 open / manual-bootstrap，累计归档数 6，未执行根正式 Full Test、Close、Reopen、新 Open 或 Archive。

OCR 仅做确定性的选文件与规则解析，没有调用外部模型：workspace 选中 24 文件，reviewed 24、skipped 0，选中范围覆盖率 100%；手工补审默认排除的五份生命周期测试、README 和三份生命周期方法。当前合同 / tasks / 交接另行核对，旧历史和 proof 不进入本次代码覆盖分母。见 [ocr-preview.json](artifacts/ocr-preview.json)、[ocr-rules.json](artifacts/ocr-rules.json)、[ocr-coverage.json](artifacts/ocr-coverage.json)。OCR 长路径历史文件的 deleted 输出经 `git -c core.longpaths=true status` 核实为工具枚举问题，不当作实际删除；24 文件的覆盖率不代表全仓文件全部重审。

## 维护代码行数与职责

物理行数按当前维护 TypeScript 统计，排除夹具、历史材料和生成物。增长依据为 026 的本轮 before 记录及 Git 基线，不补造历史增长。

| 范围 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | `application/delivery-full-test.ts` 401 | `adapters/openspec.ts` 346 | `adapters/lifecycle-store.ts` 333（`application/archive.ts` 同为 333） |
| tests | `action-write.test.ts` 467 | `planning-cli.test.ts` 444 | `delivery-repair.test.ts` 394 |
| scripts | `proofs/mvp-d01-c-explore.ts` 678 | `proofs/mvp-d01-d-explore.ts` 487 | `proofs/mvp-d01-a-explore.ts` 463 |

`delivery-full-test.ts` 从 390 增至 401，增加的是历史读取 / 锁相关接入；生命周期应用 302 行、存储 333 行、新转换 128 行、批次 73 行与正式记录 80 行分别承担具体职责。前三名旧测试、上游适配、Archive 和旧 proof 未增长；没有继续向旧长 proof 混入新产品验收。当前不因行数另开修订；本次修复归准入与首次提交顺序，后续若继续扩展混杂职责，先整理再扩展，不建立硬行数 gate 或独立台账。

## 交接

当前 next 为 Author `revise-apply`，直接输入仅本 027 Review；详细固定对象与证据留在本 Run。修复 RA-C-001 / RA-C-002，重跑新增反例及受影响首次 Open / 提交失败回归、普通 `pnpm check`，再交独立补审。原方案无需调整，其余有效结论沿用；未自动创建 Author Run 或执行 Archive、正式 Full Test / Close、Git 操作。

已用 CLI 读回 [status](artifacts/status-final.json) / [next](artifacts/next-final.json)：`revise-apply / awaiting-author / author`，当前直接入口为本 027；D02 仍 open / manual-bootstrap、累计归档数 6。README、OpenSpec context 与人工 manifest 的交接已同步，涉及文件的 `git diff --check` 通过。
