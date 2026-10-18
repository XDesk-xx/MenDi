# 组级正式验收

显式 `mode: groups-v1` 才接入 `mendi-group-tests/1`。默认旧 command 保持单命令语义和整次修复 / 审核 / 重跑；不解析 stdout 或追认旧 PASS 为组来源。

## 声明及计划

`delivery full-test run --input group-input.json --role author --actor <实际 Author> --pnpm-bin <既有入口>`。

```json
{"mode":"groups-v1","planRef":"group-plan.json","candidate":{"id":"c1","basis":{"materials":"实际代码、测试和执行配置","changes":""}},"purpose":"initial","selection":["unit"]}
```

后续 fromRunRef 固定当前实际进展。candidate basis 可有完整 commit；它是可审核材料声明，不是全库源码认证。材料实变用新 ID；同 ID 不得对应矛盾 basis。纯说明整理不机械失效。

```json
{"protocol":"mendi-group-tests/1","groups":[{"id":"unit","title":"业务单元","kind":"tests","required":true,"dependsOn":[],"resources":[],"selection":["checks/unit.test.ts"],"completion":"实际断言和容器完整结束","preparation":"隔离本次数据","exclusions":[]}]}
```

ID 唯一有序，dependsOn 只引用此前组。resources 是共享边界，不证明实际拥有端口 / 数据。非必需组另给 reason；exclusions 为执行前 `{id,reason}`，不得失败后减范围。command 用于非业务测试步骤，另给实际 command 和项目内 artifacts，不能改标规避业务覆盖。

## 实际请求和回执

目标继续拥有 full package script、业务执行和资源；MenDi 不执行计划中的 shell、不自动安装、不认领旧服务。在原锁内先持久父子意图，才启动真实 pnpm。仅新模式注入绝对路径 MENDI_GROUP_TEST_REQUEST / MENDI_GROUP_TEST_REPORT。

请求含本次项目 / Delivery / round / Run / execution、candidate、完整 plan、selection、确认过的 prerequisites、受管 reportRef / eventsRef。最终 JSON 为 `{protocol,request,complete:true,cleanup:"confirmed",groups:[...],timing:[...]}`，request 须原样回显。每个 selected group 恰一个有序终态，不伪造未选择组。

- 每组 id、state（passed / failed / blocked / not-run / interrupted / unknown）、reason 和 cleanup。
- 实际执行组另给 selection、exclusions（对应已观察稳定 ID）、enumerated:true、finished:true、真实 exitCode 和可选 lateError。
- tests 的 counts 为未排除必需业务范围的 total / passed / failed / cancelled / skipped / todo / pending；总数与完整根结束核对。实际 passed 非空且其他计数零才可能通过。排除单列，不能混成必需通过。
- command 给真实 command、`artifacts:[{path,exists:true}]`，目标实际核对产物。blocked / not-run / interrupted 须说明原因，不假造执行计数。

参考接线见仓库 tests/fixtures/group-node-runner.ts：真实 Node TestsStream，等容器和根结束，保留原事件；空文件自动容器成功不是业务测试，skip / TODO 不当通过，同文件混合失败、晚退出和 aborted 分别解释。该入口不自动适配任意 runner，断言充分性由阶段工作及独立审核核对。

Node 文件摘要的 cancelled 可能在根摘要中折成文件容器 failed；参考接线按文件业务摘要保留计数，根摘要另核结束 / 错误，不能用根 failed 替代业务取消。真实执行与清理已确认的取消可保存已结束记录并释放本次锁，部分事实仍不可复用；仅允许按实际新指令 initial 全范围重跑。

增量事件仅表示进度。包装器 exit0 与必需失败矛盾为 invalid，原 command outcome 保留，全部组来源不可复用；真实执行 / 清理及持久完成时可释放本次自有锁转修复。执行 / 资源 / 保存未知为 unconfirmed，保留现场，不自动清锁、重试、resume 或挑内存成功。确认取消后的部分结果不复用，可按新指令 initial 全量重跑。

普通失败继续独立后项，构建失败只阻断依赖。全局取消停止启动后项；未知清理阻断共享资源，无法限定则停止相关执行。端口须本次实际 listen 等方式确认归属，陌生占用拒绝；旧 PASS / PID / 预检不能代替资源取得。

## 续测、修复和结论

initial 选全部必需组；continue 只选同计划 / 同候选当前 not-run 或现可运行 blocked，保留原失败，无须先修中段才跑独立尾项。扁平 progress 只存每组最近状态 / 直接来源 / 未解决问题，不是 verified，也不嵌套历史快照。

失败不得借 initial 绕过修复。`delivery repair start --from <当前未解决直接失败> --input impact.json --reason ...` 即使最新尾项通过，也可固定原中段。impact 含 candidate、extent（local / common / unknown）、affectedGroupIds、retained（id / reason）、reason；每组恰归影响或沿用，公共 / 未知变化全部复验。真实 Author 和独立 Reviewer 核对实际差异、业务断言与影响，固定对象、正文非空；actor 仅标签，夹具审批不认证根 Change。

retest 固定当前 approved Review 的 fromRunRef，候选与批准一致，选择覆盖全部影响。普通 focused / command PASS 不补组覆盖。

`delivery verification create --input verify.json --role author --actor ...` 不执行测试；输入 planRef、candidate、当前 attempt 的 fromRunRef、sources（每个必需组唯一 `{id,runRef,applicability}`）。核对当前 progress 和直接有效来源，后来的失败不能任选旧成功掩盖；跨候选沿用须有当前独立修复批准。有效 known failed 中的独立通过可用，invalid / 取消 / 未知不能挑成功。缺口为 incomplete，完整为 verified，不把多次执行伪称一次 exit0。

创建读选定 attempt / child / 最终报告 / 必要日志和当前必要审核，保存有限快照。verification status、普通查询和 Close 只读当前结论及自身快照，不递归旧失败 / Review 正文或日志；当前快照坏不回退旧 verified。查询不写选择或认领资源。

Close 恰选旧 fullTestRunRef 或新 verificationRunRef，必须是当前轮当前实际进展与对应指针。新入口须稳定 verified，保存 candidate-verification 快照和 applicable 材料说明。新 attempt / repair 替代旧结论后不能用旧结果收口；Reopen 清除新轮指针，旧历史保持。未知版本 / 类型明确拒绝，不静默降级。

## 时间与复用

eventsRef 是本次 execution 内 JSONL，追加 attempt / group / clock / UTC / elapsedMs / event。按本次增量位置消费，不扫全历史。timing 为 `{id,parent?,clock,utc,startMs,durationMs,phase}`，父在子前且同基准包含。MenDi 包络、目标墙钟、并行工作量分开；不同基准不相减，未测阶段 / 关键路径显示未知，不生成百分比 / ETA。

仅同次执行内输入 / 配置一致、归属明确的只读产物可复用。输入变更重建，数据 / 账号 / 浏览器上下文和清理隔离，同 dist 不并发写。可证独立消费者才有限并发，保留真实断言、矩阵和预算；不靠放宽超时 / 盲重试宣称提速，不自动优化 DreMo。
