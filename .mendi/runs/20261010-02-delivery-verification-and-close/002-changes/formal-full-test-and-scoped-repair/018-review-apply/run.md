---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-review-apply-01
actionType: review-apply
role: reviewer
run: "018"
status: completed
actionStatus: completed
result: changes-requested
verdict: changes-requested
nextAction: revise-apply
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/017-apply/run.md
---

# MVP-D02-B Review Apply

固定审核 017 Apply，按 Owner 指令使用 Open Code Review delegate 辅助选文件与规则，重点检查同锁正式执行、修复审核与完整重跑、适用性与引用边界，以及两项回归失败及证据限制。语义结论由独立 Reviewer 给出，不调用 OCR 外部 LLM。

**verdict：changes-requested。** 三项 P2 需要范围内修订。保留 017、016 及历史 verdict；本次未修改实现，也未执行本项目 Archive、根正式 Full Test、Close 或 Git 写操作。

## 阻断发现

### RA-B-001：首次修复后执行漏检当前 Review 正文

位置：`src/application/delivery-full-test.ts:74-80`。当前是修复 Review 的 admission 分支只核对 approved 头部，再调用只检查 Author 正文的 `reviewRepairInputs`；没有核对当前 Review 正文。下一次沿用 repairApproval 的分支却已有 `!review.body.trim()` 检查。

独立隔离反例先真实 full failed，建立 Author / Review 记录，再保持 approved 头部而清空 Review 正文。首次重跑仍 `ok:true / passed`，保存了这个不完整的直接批准。这与首次、后续运行应使用同一必要批准边界不一致。证据：[boundary-probe.ts](artifacts/boundary-probe.ts)、[实际输出](artifacts/boundary-probe.log)；仅改隔离夹具。

修订要求：首次修复后正式 admission 也核对当前直接 Review 的完整性，并覆盖空正文反例；保持 query / draft save 不倒查正文，不新增历史链或 hash 检查。

### RA-B-002：已观察为 unknown，next 仍宣称通过

位置：`src/application/project.ts:96`；同类调用在 `src/application/delivery-full-test.ts:384`。查询用 inspectFullTest 的稳定观察计算 ok / verification，却把原持久头部直接交给 deliveryNext。

独立反例在初次 workspace 读取后、直接子结果读取时插入真实竞争锁。返回 `ok:false / stable:false / outcome:unknown`，但 next 是 `delivery-next / awaiting-owner-instruction`，reason 为“完整执行已通过”。反例保留了失败观察，同时证明下一动作没有使用它；不是要求把原历史 passed 改写。证据同 boundary-probe，竞争锁仅在该隔离目标建立并由其持有者释放。

修订要求：当前 query 和指定 full-test status 的 next 按本次未确认观察停止，保持 Owner 处置说明与 outcome 一致；补覆盖竞争锁 / 不稳定观察，不增加查询依赖。

### RA-B-003：正式执行的启动即取消场景悬挂并留下存活后代

位置：新增 `tests/delivery-full-test.test.ts:120-124`；正式调用在 `src/application/test-execution.ts:95` 等待共享 executeForeground 返回。

独立分组重跑中，after-launch 立即 abort 的场景停滞数分钟。现场子记录 startedAt 为 06:48:12Z，仍为 running / unknown、入口 pid=44956 已不在进程列表；前台脚本 pid=44812 和后代 pid=49108 仍存活，锁属于测试进程 pid=36236。父 Run 仍 running。保存现场后，Reviewer 明确停止本次测试文件进程及经路径 / 父子身份核对的隔离前台树；未清锁、改终态或停止其他任务。

证据：[现场快照](artifacts/cancel-hang-observation.json)、[停止输出](artifacts/cancel-test-stop.log)、[分组日志](artifacts/delivery-tests.log)。该文件运行约 351 秒后被人工终止；最终分组 exit 1，25 pass / 1 文件级失败，取消用例和其后用例未正常完成。不能将人工终止后的汇总解释为取消已成功。

修订要求：定位新增正式调用下启动即取消的时序，处理存活后代 / 等待 close 无法结束的情况，提供有界且能如实报告未确认的取消验证。共享停止函数已有历史实现，本次没有足够证据将根因精确归到某个 Windows / pnpm 行为；不能仅删除场景、延后取消以隐藏问题，或用入口退出推断整树停止。无需引入通用恢复、自动清锁或新的产品 gate。

## 已核对且仍有效的结论

- 正式 run 只取得一次项目 lease，内部执行服务接受同一 lease；父子 running 意图在真正 spawn 前保存。正常成功 / 非零、工具与依赖 not-run、保存故障、必要输入变化等场景已检查；普通 full 不认领为正式结果。
- 修复固定当前完整失败 / scope / 原集合；实质修订产生新 Author，旧批准不能用于新 Author；changes-requested、rejected、continuing 分流清楚。真实接线用例完成两次原生归档、full 真实断言失败、focused、记录夹具 Review、新整次 full，以及新进程查询；unit 执行两次、integration 三次。夹具 actor / verdict 仅验证记录协议，不能认证真实独立审核。
- 当前正式查询读取当前父 Run、直接子结果及必要日志；修复查询不追读 Author 正文，未知 Ref、说明、旧失败及旧 Archive 链不自动变成前置。首次 admission 的直接批准和操作内必要字节冲突检查适度，无全库 hash / 引用注册表。RA-B-001 只补当前必要对象的一致检查。
- outcome 与 scopeMatch / commandMatch / materialApplicability 分开，材料仍要求阶段语义判断；脚本文字匹配不证明任意源码覆盖，既有 passed 不自动 Close。NODE_TEST_CONTEXT 的隔离有实际失败断言与分组计数佐证，不只依赖 exit 0。

## 两项原回归失败与证据限制

017 的 `regression-final.log` 仍是 169 项、167 pass / 2 fail、exit 1，本次不改写它，也不宣称修复后已有 169/169 全绿。

1. `tests/test-execution.test.ts` 的原失败是读取尚未写完的 JSON。当前补丁等待 started / descendant 两份 JSON 可解析且 PID 有效，仍断言真实进程退出。本次独立复跑通过。它与 RA-B-003 的“刚启动就取消”是不同时间窗口，不能互相替代。
2. Archive RP-D-001 原失败为预期 88 实得 1，worker 只留下通用 OpenSpec 失败文本。本次读取保留现场仍为 prepared / attempt=0，未见 native-calls；将必要观察保存到 [archive-regression-observation.json](artifacts/archive-regression-observation.json)，无需长期依赖原 .tmp。原场景独立复跑通过，但原具体上游失败原因未确认，不称已修好，不添加自动重试。

上述两项本次联合定向重跑 2/2 pass，日志：[regression-replay.log](artifacts/regression-replay.log)。017 全回归其余通过结果在未受影响范围内沿用；旧 dist 的 integration-replay.log 不作为当前证据。当前 D02-B 分组真实接线用例通过，但整个分组因 RA-B-003 未通过。后续修订重跑受影响的取消、共享执行、admission 与 query 场景，再由独立 Reviewer 补审，不要求机械重做 Explore / Propose 或全部历史 proof。

## 工程检查与 OCR 覆盖

- 本次 `pnpm check` 成功：format / lint 检查 94 个文件，三份 tsconfig 真正类型检查；随后 `pnpm build` 成功，再运行上述测试。固定 OpenSpec strict validate 为 1/1 valid、issues=[]，见 [validate.json](artifacts/validate.json)。
- Reviewer 的 boundary-probe.ts 经独立 tsc --noEmit 检查后执行成功，两个断言反例都复现；初次探针类型检查发现调用缺参，修正探针后才执行，未改产品代码。
- Open Code Review delegate 仅提供确定性文件选择和规则。preview 共 246 项，其中 selected 24 项全部 reviewed、skipped 0，selected coverage 100%；222 项排除见原 preview，不宣称全仓库 100%。额外人工覆盖 README、6 个新场景测试、维护取消测试、3 份产品方法，及对应夹具 / 已批准合同。见 [ocr-coverage.json](artifacts/ocr-coverage.json)、preview 和两份 rules。未调用外部 LLM，语义 verdict 由当前独立 Reviewer 给出。

## 维护规模与职责

本次重新统计维护 TypeScript 物理行数，排除 tests/fixtures、生成物、历史 Run。原始摘要数据见 [line-counts.json](artifacts/line-counts.json)，仅服务本次审核，不形成独立 gate 或长期台账。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | application/delivery-full-test.ts 386（新增） | adapters/openspec.ts 346 | application/archive.ts 333 |
| tests | action-write.test.ts 467 | planning-cli.test.ts 444 | delivery-repair.test.ts 394（新增） |
| scripts | proofs/mvp-d01-c-explore.ts 678 | proofs/mvp-d01-d-explore.ts 487 | proofs/mvp-d01-a-explore.ts 463 |

对照 017 开始保存的 before-counts：其余表内旧文件未增长，tests.ts 234→141、project.ts 232→255、dispatch.ts 85→103、test-execution.test.ts 300→312。新增文件无旧增长基准。正式验收 admission / 同锁编排职责紧密，普通执行已抽出真实生命周期职责；修复测试按协议分组，真实接线是最长场景。若 C 继续加入收口职责或新独立集成场景，应先按实际职责分开，不能继续全部堆入这两文件，也不拆纯转发层压行数。旧 C / D 长 proof 未扩展，保持原限定用途。

## 交接

下一步 Author 创建范围内 `revise-apply`，固定 017，处理 RA-B-001 / 002 / 003，并保留本次证据限制；其后独立补审。方案无需因当前发现重做。当前 B 保持 applied / 活动，D02 open，A 已归档、累计数 5，C 未激活。不得将本次检查成功或原两项定向重跑通过解释为本 Change 已批准或可以归档。
