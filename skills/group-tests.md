# 组级正式验收

新的正式 Full Test 唯一接受显式 `mode: groups-v1` 和 `mendi-group-tests/1` 完整协议；父记录为 `delivery-test-attempt` / `attempt.version:2`。旧 command、v1 attempt、verification 与已完成 Close 仅按原类型只读，不再新建旧模式或追认旧 PASS。

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

Node 文件摘要的 cancelled 可能在根摘要中折成文件容器 failed；参考接线按文件业务摘要保留计数，根摘要另核结束 / 错误，不能用根 failed 替代业务取消。真实执行与清理已确认的取消可保存已结束记录并释放本次锁，部分事实不可复用；重新执行前须确认本次安全处置和材料一致性。

增量事件仅表示进度。包装器 exit0 与必需失败矛盾为 invalid，原 command outcome 保留，全部组来源不可复用；真实执行 / 清理及持久完成时可释放本次自有锁转修复。执行 / 资源 / 保存未知为 unconfirmed，保留现场，不自动清锁、重试、resume 或挑内存成功。确认取消后的部分结果不复用；不能凭局部通过或取消原因绕过必要处置。

普通失败继续独立后项，构建失败只阻断依赖。全局取消停止启动后项；未知清理阻断共享资源，无法限定则停止相关执行。端口须本次实际 listen 等方式确认归属，陌生占用拒绝；旧 PASS / PID / 预检不能代替资源取得。

## 完整执行、修复和结论

新正式请求只允许 `purpose:initial`，selection 包含计划全部必需组及本次必要前置；continue / retest、缺协议的旧 command、verification create 在占号前拒绝。扁平 progress 的本次已选事实全部指向当前 Run，不沿用旧成功组。完整报告、真实子结果、必需业务计数、结束、清理与持久读回稳定时，本次 Run 直接 `formalOutcome:passed` / `result:passed`，next 等待 Owner 单独授权 Close。failed / blocked / not-run / interrupted / invalid 分别保存，unknown 保留现场停 Owner；query 不写结果。

实质源码、断言或执行配置语义修复使用 `delivery repair start --from <当前直接失败> --input impact.json --reason ...`。impact 含 candidate、extent、affectedGroupIds、retained、reason，用于说明实际影响，**不能豁免正式必需组重跑**。同 draft 正常继续，正式交接后的实质修订使用 revise-delivery-repair；独立 review-delivery-repair 固定当前完整 Author，真实差异和定向验证通过后 approved。新 full-test 输入 `fromRunRef` 必须等于该 Review，候选与批准一致，重新 initial 全量。旧 command failed 可通过本轮真实 Repair / Review 后首次进入 v2，不要求旧 testAttemptRunRef，不改原失败。

已知普通环境准备问题可以免空 Repair / Review，但须保留真实失败并提供可核对恢复。首次输入可声明 `materialRefs`，列出本次实际受测源码、断言、runner 和执行配置等直接文件；package.json 自动纳入必要直接输入快照。它不是全库 hash 清单或源码认证；Author 必须核对声明的完整性，未声明必要材料、无法证明语义未变时走实质修复审核。没有该直接快照不允许环境豁免。

重跑输入含 `environmentRecovery:{failedRunRef,evidenceRef,reason}`，同时 `fromRunRef` 固定同一个当前失败。证据 JSON 包含 `failedRunRef`、实际 `projectRoot`、`phase:"preparation"`、`cleanup:"confirmed"`、`contractUnchanged:true` 和非空 `resources`。每项资源给出 `id/projectRoot/identity/ownership:"project"/state:"recovered"/cleanup:"confirmed"/preflight`（真实恢复与再预检事实）。已运行目标的原报告须有 `environmentFailure:{phase:"preparation",groupIds:["受影响组"],resources:[{id,projectRoot,identity}]}`，身份须逐项匹配；预检未启动的情况核对当前 precheck 的已知工具/依赖错误。不凭 reason 字符串认定环境；外部资源、未知清理/锁、报告无准备失败、材料/完整计划/候选/入口变化均拒绝旁路。恢复合法后仍实际运行全部必需组，处置与指针保存于新 attempt，原 failed/blocked 保持不变。

`delivery full-test status --run <ref>` 和普通 status/next 使用同一 v2 正式观察。已存 v1 attempt / verification 可显式查询，但查询成功不提供新写权限。任意源码的语义适用性仍由阶段工作及独立审核判断。

新 Close JSON 唯一选择 `testAttemptRunRef` 并给出 `applicability:{conclusion:"applicable",materials,changes,reason}`。输入须等于当前轮 manifest.testAttemptRunRef 和 manifest.deliveryRunRef，实际为完整 v2 passed。Close 自身保存 typed 指针与 v2 acceptance，不挪用旧 fullTestRunRef；新 Close 拒绝旧 fullTestRunRef / verificationRunRef 选择器（单独或混用）、v1 verified、陈旧选择、未知或不完整结果。Reopen 新轮清除选择，旧轮已完成 Close 按当时类型继续只读。

## 时间与复用

eventsRef 是本次 execution 内 JSONL，追加 attempt / group / clock / UTC / elapsedMs / event。按本次增量位置消费，不扫全历史。timing 为 `{id,parent?,clock,utc,startMs,durationMs,phase}`，父在子前且同基准包含。MenDi 包络、目标墙钟、并行工作量分开；不同基准不相减，未测阶段 / 关键路径显示未知，不生成百分比 / ETA。

仅同次执行内输入 / 配置一致、归属明确的只读产物可复用。输入变更重建，数据 / 账号 / 浏览器上下文和清理隔离，同 dist 不并发写。可证独立消费者才有限并发，保留真实断言、矩阵和预算；不靠放宽超时 / 盲重试宣称提速，不自动优化 DreMo。
