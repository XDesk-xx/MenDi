---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-apply-02
actionType: revise-apply
role: author
run: "028"
status: completed
actionStatus: completed
result: apply-ready
nextAction: review-apply
nextRole: reviewer
date: 2026-10-10
revisesRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/026-apply/run.md
reviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/027-review-apply/run.md
---

# MVP-D02-C Revise Apply

Owner 指令 revise-apply，保持 Author。依据 027 的 RA-C-001 / RA-C-002 定向修复首次记录化 Open 的关联准入和写前检查；025 方案保持，完成后停独立 Review Apply。026 / 027 的编号、正文和 verdict 保持原样。本轮实施、失败与验证统一记录在本 028，不逐检查建 Run。

使用 [OpenSpec Apply Skill](D:/Projects/MenDi/.agents/skills/openspec-apply-change/SKILL.md)、[项目 Apply 方法](D:/Projects/MenDi/skills/actions/apply/SKILL.md) 与 debugging-and-error-recovery。读取固定 OpenSpec 1.14.1 的 root / instructions、全部八份 contextFiles、项目 context 与 rules；21 项既有任务保持，追加一项定向修订跟踪，按原生返回位置核对后完成。本轮不重做 Explore / Propose。

## 定向修订

| 直接发现 | 变化与验证 |
| --- | --- |
| RA-C-001 | `confirmLifecycle` 的首次关联复用既有 `bindingFor` / `assertAssociationAvailable`；空 binding 集合不能满足 B dependsOn A。旧入口与显式 Author / actor 入口均写前拒绝，合法 A 关联仍成功；记录化保存 001 / openRunRef、退出 deliveryRunRef，旧入口不补 Run。 |
| RA-C-002 | `commitLifecycle` 在创建首次 `.mendi` 前先核对空基准并调用语义确认；应用前置检查同时覆盖错误槽位。两种入口错误请求均不留下状态目录，改正后直接成功，不需清理或 resume。锁内确认、intent 后复核和有限恢复顺序保留。 |

新增 `tests/lifecycle-open-admission.test.ts` 使用实际固定 OpenSpec 创建隔离 Change，无 upstream stub。覆盖两种入口的未归档依赖、合法关联、错误槽位后修正；在 lock-acquired / intent-written 时移动必要 Change，分别确认写前锁内复核拒绝、已提交意图后保留占号与锁。实际提交开始后的现场继续拒绝普通 Open 覆盖，不自动删除状态或生成恢复框架。既有首次 pending 缺 manifest 的诊断 / resume、CLI 关联和并发回归重跑。

同步 design §5、delivery-workspace 的首次关联场景、tasks §8.1、delivery-open 方法与 README / context。上述修改澄清并落实既有首次关联语义，不新增 gate、hash 清单或引用体系，不扩大 Close / Reopen 实施范围。

## 实际验证及限制

- 修复前 `node --test --test-concurrency=1 --test-name-pattern '两种入口' tests/lifecycle-open-admission.test.ts`：0/2、退出 1，两项新回归实际捕获未拒绝依赖与空 `.mendi` 残留，原输出 [admission-before.log](artifacts/admission-before.log)。
- 首次修复后新增三项测试为 2/3、退出 1，原输出 [admission-after.log](artifacts/admission-after.log)。唯一失败为测试把 intent 后保留锁的重试误断言成 incomplete-mendi-state；依据实际锁检查修正为 write-in-progress-or-interrupted，未放宽实现或删锁。另一个 lock-acquired 场景尚无 Run 效果，释放自身锁但保留实际目录，仍报 incomplete-mendi-state。
- `pnpm check`：退出 0，112 个维护文件格式 / 基础 lint 与 src、scripts、tests 三个真正 TypeScript 检查通过，见 [check.log](artifacts/check.log)。`pnpm build`：退出 0，见 [build.log](artifacts/build.log)。现有 workspace metadata 提示保留，未自动安装依赖。
- `node --test --test-concurrency=2 --test-name-pattern '首次|关联与范围|真实 Open 时|两个真实子进程' tests/lifecycle-open-admission.test.ts tests/lifecycle-open.test.ts tests/lifecycle-writes.test.ts tests/cli.test.ts tests/concurrency.test.ts`：8/8、退出 0，见 [regression.log](artifacts/regression.log)。覆盖新增三项及受影响首次 Open / 真实 CLI / 并发 / 原有限恢复，无跳过测试。模式只选择本轮必要场景，不声称全仓重跑。
- 固定 OpenSpec 1.14.1 strict validate 与最终 apply instructions、CLI status / next 读回见本 artifacts。工程检查和 all_done 不代替 Reviewer 批准；当前直接交接为本 Author 028。
- 027 的其余有效审核、29/29 生命周期 / 项目回归及三项历史修复的 3/3 结果可沿用。026 首轮聚合仍是 186/189、退出 1，原证据不改；本轮没有机械重跑全仓或将历史结果改称全量通过。旧 C / D Explore proof 未扩展或提升用途。
- 隔离目标中的真实 Open 与受控故障不表示根仓库生命周期批准。根 D02 保持 open / manual-bootstrap，活动 Change C 与累计归档数 6；未执行根 Archive、正式 Full Test / Close / Reopen / 新 Open、Git 操作、下一 Change 或 `.tmp` 清理。

## 维护代码行数与职责

物理行数排除 fixtures、生成物与历史 Run。实际源代码修订前 / 后数据在 [before](artifacts/maintained-lines-before.json) / [after](artifacts/maintained-lines-after.json)，仅供本 Run 对照，不形成独立台账或容量 gate；本轮新测试单独按新增文件说明，不补造旧基准。

| 范围 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | `application/delivery-full-test.ts` 401 | `adapters/openspec.ts` 346 | `adapters/lifecycle-store.ts` 336 |
| tests | `action-write.test.ts` 467 | `planning-cli.test.ts` 444 | `delivery-repair.test.ts` 394 |
| scripts | `proofs/mvp-d01-c-explore.ts` 678 | `proofs/mvp-d01-d-explore.ts` 487 | `proofs/mvp-d01-a-explore.ts` 463 |

可靠增长依据为本轮修订前实测：生命周期应用 302 → 308（+6），增加首次关联的现有语义检查；存储 333 → 336（+3），将首次预检置于 mkdir 前，持锁后的原复核不变。新独立准入测试 95 行，没有扩展旧长测试 / proof。Full Test、上游适配及表中其余旧文件本轮未增长。准入仍在应用、提交仍在存储，未混入新职责或增加纯转发层；后续若继续扩展混杂职责应先整理，当前无须为行数拆层。

## 交接

停独立 `review-apply / awaiting-review / reviewer`，必要输入仅本 028 Author Run；直接上一审核与修订对象在头部可定位。独立 Reviewer 补审 RA-C-001 / RA-C-002 的修复、首次 Open / 提交受影响路径及本次规格澄清，可沿用 027 其余仍适用结论。Author 不写 verdict，不撤销或改写旧审核，不直接 Archive。

仅对本次直接旧对象 026 / 027 做运行前后字节比较，正文与头部均未变；没有全量 hash 清单或 gate。实际结果、最终结构检查与交接读回汇总见 [verification-summary.json](artifacts/verification-summary.json)。
