---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: reduce-redundant-proof-inputs-and-artifacts
planningSlot: MVP-D05-C
batchId: 002-changes
actionId: reduce-redundant-proof-inputs-and-artifacts-apply-01
actionType: apply
role: author
actor: codex-author
run: "030"
status: completed
actionStatus: completed
outcome: complete
result: implemented-for-independent-review
nextAction: review-apply
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/apply/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/029-review-propose/run.md
---

# D05-C Author Apply

**14 项实施及受影响验证已完成，交独立 Review Apply。** 固定 029 approved 的 028 方案与 Owner 当前 `apply`；本会话保持 Author，不给 Reviewer verdict。029、028、026/027 和其它已提交历史不改。根仍 manual-bootstrap，本阶段采用人工 Run/manifest 记录，不通过产品写命令迁移历史。

## 本次实现

- 新增 `tests/evidence-support.ts`，仅用于当前选定的 opt-in 测试/Proof。明确 temporary / durable / reconstructible / current-run 来源；持久来源直接读取引用，可复建输入记录真实入口/参数，临时唯一源在结束前只保存必要字节一次到当前证据目录。同一直接文件以真实路径和文件身份识别；命令每次真实调用有独立 ID，绝不按输出相同合并不同执行。
- 本次明确来源身份的散列只用于生成有界文件名，**不散列文件内容、不扫描历史、不建全量 hash 清单或数据库**。同源可由两真实进程独占发布到同一原件；进程内重复摘要复用引用。用源读前后、写后及发布读回的实际字节/身份核对，拒绝越界和读中变化。短写继续写完；零进展、异常/权限拒绝、未知发布保留现场并抛 EvidenceIncomplete，不假报完整。仅删除本调用已核对成功发布的自有暂存名，不清理其它任务锁/tmp。
- 新增 `tests/evidence-scenes.ts` 处理实际执行与组场景的直接来源选择和摘要引用；原件处理与场景选择分开。缺失必要文件记录 `state:incomplete / missing`，保留实际原 outcome 和现有字节；`captured` 只表示额外采集完整，绝非产品 PASS。不能访问/写回原件时停止；不能把即将清理的源路径当成唯一长期引用。
- `tests/helpers.ts` 的 command 保留实际 executable/entry/args/cwd/exit/signal，各次 stdout/stderr/error 只在本次输出原件保存一次，摘要引用输出。未启用环境入口不额外落证，返回实际子进程结果的行为保持。
- `tests/test-support.ts` 的 execute 复用真实 result.json、stdout.log、stderr.log 和必要锁快照，不再次完整嵌入双日志；三种 outcome 和跨进程 status 均核对。`tests/group-support.ts` 的 groupRun / recordApplyScene 共用同一采集；两环境入口同时启用时以 TEST 目录存原件，APPLY 目录仅放引用。实际 run、child result、request、report、events、双日志、明确中断 tmp 和必要锁仍保留；缺 report 的 Apply 摘要不再错误读取不存在文件或冒充 PASS。已知 Run/child 对象在额外摘要中复用直接源，不递归解释任意 Ref。
- `MENDI_TEST_EVIDENCE_DIR / MENDI_APPLY_EVIDENCE` 仍是原来的可选入口。只接入上述三处指定 recorder，其他专项 recorder 不在此 Change 全面改写。四份 Explore/Apply/Review Skills 是未来阶段来源约定，软件并非所有阶段的强制引擎，也不认证 Reviewer 独立性或批准。
- **src/ 无修改。** TestExecution formatVersion=1、两个物理日志（包括 0B）、执行/取消/unknown、正式 groups-v1 请求/报告/清理及读回的生产代码保持原样，没有虚拟 empty 分支、缺文件补造或正式结果旁路。技能、README、OpenSpec context 与唯一根路线图同步到首版明确保留物理空日志的已批准选型。

## 真实场景与单源观察

所有新输入由维护的 `tests/fixtures/evidence-command.ts`、`evidence-original.txt`、`evidence-worker.ts` 及现有 test/group fixtures 构建，测试本身纳入严格 TS 检查；不复制整棵临时工程。源是临时目标时，直接原件已保存到本 Run 的 [final-collection](artifacts/final-collection) 或 [boundary-collection](artifacts/boundary-collection)，场景中的 EvidenceReference.root/ref 指向实际持久副本；source.root 仅说明原始临时来源身份，不冒充长期原件。

- 相同真实文件被两个并发子进程采集，最终一个原件；同一次执行两次摘要复用同一引用。三次真实命令（含两次完全相同命令和一次 exit7）即使输出一致仍分别保存，真实 args/cwd/exit 可定位。关闭 opt-in 无额外目录。
- 普通执行真实 passed / failed / unknown，重复采集直接 result 和双日志不增加原件；受管产品文件前后未变，跨进程 test status 一致。真实 quiet stdout=0B、stderr非空：缺失 stdout 后 unknown/ENOENT，collector 标记 incomplete 且不补文件；恢复原字节后 status passed。
- 实际 groups-v1 中段失败，进展为 passed/failed/passed；groupRun 加两份 Apply 摘要共用 7 个直接源（run、result、request、report、events、双日志）及 1 份结果快照。原件数量没有随摘要重复增加，产品 `.mendi` 原字节不变，临时 stdout 暂离后副本仍可读。
- 实际缺报告：包装器 child passed，但正式为 invalid，摘要 incomplete 并明确 missing；APPLY 单独启用也保留唯一原件。实际 cleanup unknown：保留 draft Run、request/report/events、实际 child/log 与锁，原 outcome unknown，没追认为 finished PASS。
- 原回归覆盖真实失败、准备 blocked/failed/not-run、取消/interrupted、清理 unknown、陌生端口不抢占、短写/零进展/异常、prepared/running/finished、读回/终态/释放故障；开启新 collector 的组回归同样通过，不为体积忽略真实现场。
- D01–D04 四个登记入口、其选定已提交 Run、D05-A/B archive/verdict 直接读取且前后字节不变；实际 D04 的一个已保存 formatVersion=1 执行通过现行 parser，0B stdout 与 stderr 仍可读。**114 request /107 report 只引用 027 的历史观察**，未重新全树统计、未据此省略未来报告。该旧样本原临时项目已不作为当前运行前提，验证范围是实际保存原件的加载和双日志可读，不冒充重新执行旧业务验收。

### 减量数值仅是观察

最新 [collector-final.log](artifacts/collector-final.log) 中，同一真实失败执行的两份 Apply 摘要：旧布局序列化对照 26,816B，新两份引用摘要 10,392B；7 个直接原件与 1 个快照由三份摘要共同引用。旧布局是用本次真实结果按原结构序列化的对照，**不是重跑旧 writer，也不是全目录净文件数/压缩率承诺**；原件自身仍完整保存。不同真实执行分别保留、必要临时源落盘可能增加小文件，不能用总数量或字节门槛推导 PASS。

命令场景同一输出原件为 4,020B，两份旧式输出布局对照 8,012B；三个真实调用保存三份不同身份原件，第四处引用第一份不生成另一份。真实过程和路径在场景 JSON/JSONL；这不是按文本内容去重。

## 实际验证

| 命令与实际结果 | 一份原始输出 / 限制 |
| --- | --- |
| `node --test --test-concurrency=2 tests/evidence-support.test.ts tests/evidence-recorder.test.ts tests/evidence-groups.test.ts tests/evidence-history.test.ts`，exit 0，16/16 | [collector-final.log](artifacts/collector-final.log)；开启 TEST，覆盖开/关、TEST+APPLY/APPLY-only、临时唯一源与当前阶段副本、路径/权限/变化/中断、两真实进程、旧历史；目录 final-collection 为这次实际原件 |
| `node --test --test-concurrency=2 tests/test-execution.test.ts tests/test-log-integrity.test.ts`，exit 0，10/10 | [execution-regression.log](artifacts/execution-regression.log)，关闭 opt-in，不改原运行行为；取消和执行树仅处理测试自己启动的进程 |
| `node --test --test-concurrency=2 tests/group-boundaries.test.ts tests/group-environment.test.ts`，exit 0，16/16 | [group-regression.log](artifacts/group-regression.log)，同时开启 TEST/APPLY，必要原件只在 boundary-collection 保存一次；包含失败/blocked/not-run/interrupted/unknown 和恢复/新全量 |
| `pnpm check`，exit 0 | [check-first.log](artifacts/check-first.log)：format、lint、src/scripts/tests 真实 TS 检查。通过后没有再改维护代码，不为放心重跑同一检查 |
| `pnpm build`，exit 0 | [build.log](artifacts/build.log) |
| OpenSpec 1.14.1 strict validate | 最终 1/1 valid、0 issues；见 [openspec-validation.json](artifacts/openspec-validation.json) |
| 四份 Skills 的真实 `loadMethods` 与 `git diff --check`，exit 0 | 实际加载了 explore/apply/review-explore/review-apply 正确阶段方法；只读工程核对，不是 Reviewer verdict |

合计 **42 项受影响场景通过**，不是根 Delivery 正式 Full Test。原先的 [collector-first.log](artifacts/collector-first.log) 7/7 与 [group-collector-first.log](artifacts/group-collector-first.log) 3/3 是更早实现迭代的真实执行，不合并为另一套最终场景或拷贝其原始输出。首个快速测试曾因 Node 22 strip-only 不支持 TS 参数属性失败，改为普通字段；一次类型检查指出 Error.code 不存在，改为按字段存在性记录真实错误。真实诊断在本会话工具输出，未编造失败日志；后续严格检查及受影响测试全部通过。

权限拒绝用受控 EACCES 注入，不改变 Windows ACL；本机实际验证了 hardlink 独占发布，不能据此宣称所有外部文件系统兼容。unknown 与部分写入现场不清理。未重跑不受影响 UI/安装或旧 Explore 全量 proof，未动源码执行协议、旧 Run/verdict 或其它项目；未执行 Archive、根 D05 Full Test/Close、Git checkpoint/Push、稳定安装或 D05-D 激活。

## 维护代码物理行数与职责

含空行的 `.ts` 当前值及真实 HEAD 对照见 [line-counts.json](artifacts/line-counts.json)。新文件没有同名历史基准，不虚构增长率，不建立台账或硬行数门槛。

| 目录 | 当前前三名 | 可靠增长与职责结论 |
| --- | --- | --- |
| src | `src/application/delivery-lifecycle.ts` 368；`src/application/group-attempt.ts` 361；`src/adapters/workspace.ts` 346 | 与 HEAD 全部相同；本 Change 没有 src 改动，未向这些已有执行职责扩展采集逻辑。 |
| tests | `tests/action-write.test.ts` 467；`tests/planning-cli.test.ts` 444；`tests/delivery-repair.test.ts` 395 | 与 HEAD 全部相同。新增 evidence-support 199 行负责来源/发布、evidence-scenes 109 行负责选定场景；原 helpers 86→93 只留真实命令 hook，test-support 137→128、group-support 143→104 先移出复制/嵌入职责再接入。不是纯转发层压行数；新测试按来源/普通执行/组/旧历史分组（155/136/134/103 行）。 |
| scripts | `scripts/proofs/mvp-d01-c-explore.ts` 678；`scripts/proofs/mvp-d01-d-explore.ts` 487；`scripts/proofs/mvp-d01-a-explore.ts` 463 | 与 HEAD 全部相同，保留旧 Explore 限定用途，没有继续扩展或当作新产品验收。未来确需扩展时先分离 Apply 记录流与 Archive 效果组，保留简单 TS 入口和旧输出。 |

## 交接边界

实现、文档与 028 两份 delta / Design 一致。下一步固定本 030 Author Run 交独立 `review-apply`；工具成功、任务勾选和采集状态不认证批准。根 manual-bootstrap 仅人工更新当前交接，历史与累计归档数 15 保持。Reviewer 按影响独立判断，不要求机械重跑全部历史或再复制同一原件。
