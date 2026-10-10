---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-apply-01
actionType: apply
role: author
run: "017"
status: completed
actionStatus: completed
result: implementation-ready-for-review
nextAction: review-apply
nextRole: reviewer
date: 2026-10-10
reviewRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/formal-full-test-and-scoped-repair/016-review-propose/run.md
---

# MVP-D02-B Apply

按 Owner apply 指令实施 016 批准的 015 方案与 30 项任务。保持 Author，完成后停在独立 Review Apply。测试中的 Reviewer verdict 仅为记录夹具；根正式 Full Test、Archive、Git、Close / Reopen 和 C 激活不在本次范围。

## 实现与对应验证

| 范围 | 已实施行为及验证 |
| --- | --- |
| 正式 Full Test | 新增 delivery scope 的四种 Run、collection / basis、范围和已核对直接批准事实。正式 run 固定父 Run / 两个指针，内部执行服务接受同一 lease，先持久父子意图再运行真实 full，完整保存读回后才确认终态。ordinary full 仍是 command / formalDeliveryTest=false，不认领旧 PASS。工具 / 依赖拒绝保存 not-run 与原始原因，启动失败、实际非零、中断、日志 / 写入 / 读回 / 释放失败分组覆盖。 |
| 范围内修复 | 当前明确 failed 固定 scope / 原 collection / reason。Author 修复与主动修订、独立 Reviewer 固定对象、三类 verdict、same Action continuing、draft save / submit 均接通；完整修订须重新审核，旧批准不复用。approved 后显式新整次执行，允许审核过的范围内 full 配置修复，拒绝集合缩减，不追读旧失败链。重复执行仍核对其实际需要的直接修复批准与固定 Author，包括正文和对象一致性。 |
| 查询与关联 | deliveryRunRef 选择当前进展，fullTestRunRef 保存最近正式入口。status / next 优先读当前头部与必要直接子结果 / 日志，upstream:null；历史说明、未知扩展和旧 Archive / Review / Author 不自动成为查询依赖。已知 failed 可稳定读取成功，unknown 非零。scopeMatch / commandMatch 与 requires-semantic-check 分开；缺当前配置保留历史事实。诊断保持只读，未解决验收 / 修复 / 审核阻止 bind，合法后续关联退出当前 Delivery 选择并保留历史结果。 |
| 工程组织与 CLI | 从原 tests.ts 抽出实际负责持锁子生命周期的 test-execution.ts；新增明确职责的声明 / 记录、读写、验收编排与修复模块。dispatch.ts 先整理为 switch 再接四个精确命令，旧 Change 路由保留。增加三份产品方法及 README 声明、依赖准备、修复 / Review / 新整次执行说明；未建立通用注册框架、引用图、hash 清单或工程 gate。 |

测试按 admission、full-test、repair、query、write、CLI 分组；受控目标从维护中的源码 / 配置重建，使用固定 OpenSpec 与正常离线依赖准备。真实产品接口完成两个原生 Change 归档后，full 的实际接线断言失败，Author 修复 producer kind 并运行 focused，不同 actor 的 Review 记录夹具后再次运行两组完整测试，另 cwd 新进程查询。测试使用文件字节比较验证旧失败、归档 Run 与 binding / 累计数保持。Review 夹具只验证协议和明显自签拒绝，不能认证真人独立审核或替代本 Change 的 Review Apply。

## 验证结果与修正

根依赖准备执行固定 pnpm 的 install --offline --ignore-scripts，成功且未修改依赖文件；各隔离目标也正常准备，不把已有 .tmp 当唯一输入。

| 实际命令 / 范围 | 结果与证据 |
| --- | --- |
| 固定 pnpm check / build | 均 exit 0；94 文件格式、基础 lint 与 src / scripts / tests 三配置真正类型检查，见 [check-final.log](artifacts/check-final.log)、[build-final.log](artifacts/build-final.log) |
| node --test --test-concurrency=2 tests/delivery-*.test.ts | exit 0，25/25 passed，见 [delivery-tests-final.log](artifacts/delivery-tests-final.log)；后增两个 admission / bind 场景由下列全量覆盖 |
| 固定 pnpm test | 实际执行 169 项，167 pass / 2 fail / 0 skip / cancelled，exit 1，约 1163 秒；见 [regression-final.log](artifacts/regression-final.log)。不把原全量说成一次全通过，保留仍适用的通过结果 |
| 失败场景定向复跑（archive-finish / test-execution） | --test-name-pattern 选择原失败两项，exit 0，2/2 pass / 0 skip / cancelled，见 [regression-failure-replay.log](artifacts/regression-failure-replay.log) |
| 直接审核输入补充反例（delivery-admission / delivery-repair） | --test-name-pattern 选择首次 admission 与已审核配置修复，exit 0，2/2 pass / 0 skip / cancelled，见 [direct-review-input-replay.log](artifacts/direct-review-input-replay.log)；最新构建已先成功 |
| 固定 OpenSpec validate formal-full-test-and-scoped-repair --strict --json | exit 0，1/1 valid、issues=[]，见 [validate-final.json](artifacts/validate-final.json) |
| 固定 OpenSpec instructions apply / 根新进程 status 与 next | 按每项实际 sourcePath / line 完成并逐项原生读回；最终 30/30 all_done 及人工状态 / Reviewer 交接见 artifacts/apply-final.json、readback-final.json |

全量第二项失败是测试夹具只等文件存在便读取未写完 JSON；维护测试改为等待两份 JSON 可解析且有有效 PID，继续真实取消并核对三个进程实际退出，未改字节敏感夹具或产品停止规则。第一项在实际原生 Archive 调用前，上游读命令曾失败；现场仍 prepared / attempt=0，无 native 调用，重跑同一原场景通过。原始失败原因未复现，不能声称已确认具体上游根因，保留日志供 Reviewer 判断；未新增自动重试或一般恢复承诺。最终检查与相关复跑均通过，沿用全量其余可靠结果，未为检查另建 Run。

开发中的失败保留在 delivery-tests-first / second.log、integration-replay.log：隔离副本的 workspace 安装状态需要在新目录正常准备；写入失败须保留 unknown，不能被误记预检 not-run。另发现继承宿主 NODE_TEST_CONTEXT 会使被测 node:test 入口跳过实际断言而 exit 0，已在子执行环境中去除该内部字段，保留宿主环境；真实失败 → 修复 → passed 的整套接线已重新认证，设计就近记下此发现。一次构建失败后运行曾使用旧 dist，已修正类型与命令错误退出处理，重新成功构建后的 integration-replay-current.log 才是有效重放。

实际命令 / CLI 输出见 artifacts/commands-*.jsonl；实际子记录与 stdout / stderr 见 delivery-scenes-*、test-scenes-*，跨 Change 场景原始结果 / 两次日志 / 执行组见 integration-scenes-*。这些是本次执行输出，不复制历史证据树。

## 维护规模与职责

统计维护代码的物理行数，排除 tests/fixtures、生成物和历史；直接基准为本次开始保存的 artifacts/before-counts.json，当前为 after-counts.json，仅服务本次摘要。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | application/delivery-full-test.ts 386（新增） | adapters/openspec.ts 346（未变） | application/archive.ts 333（未变） |
| tests | action-write.test.ts 467（未变） | planning-cli.test.ts 444（未变） | delivery-repair.test.ts 394（新增） |
| scripts | proofs/mvp-d01-c-explore.ts 678（未变） | proofs/mvp-d01-d-explore.ts 487（未变） | proofs/mvp-d01-a-explore.ts 463（未变） |

可靠增长 / 整理依据：application/tests.ts 234→141，project.ts 232→255，dispatch.ts 85→103，core/actions.ts 320→322，core/records.ts 136→156。新增 386 / 394 行文件没有旧增长基准，不补造。full-test.ts 的 admission、当前输入复核和同一操作持锁执行紧密关联；repair 场景覆盖修复协议与必要接线，新验收编排未继续堆入普通执行模块，scope / 声明规则已有真实 core 职责。以后扩展 Close 或更多独立集成场景时，先按实际职责整理，不添加纯转发层压行数。旧 C / D 长 proof 本次未扩展，保持原限定用途；以后确需扩展再分开 Apply 记录流与 Archive 效果组。

维护测试 test-execution.test.ts 另有直接基准 300→312，增长来自等待夹具 JSON 完整可解析的条件；产品进程终止规则与字节敏感原夹具保持原样。两次定向复跑的完整命令如下，均使用本次 artifacts 作为 MENDI_TEST_EVIDENCE_DIR：

```powershell
node --test --test-name-pattern='真实原生验证失败后|跨 await 持有同一锁' --test-concurrency=2 tests/archive-finish.test.ts tests/test-execution.test.ts
node --test --test-name-pattern='首次 admission|已审核的范围内 full 配置修复' --test-concurrency=2 tests/delivery-admission.test.ts tests/delivery-repair.test.ts
```

## 当前边界

根保持 manual-bootstrap，当前累计归档数仍为 5，A 已归档，B 仍活动，C 未激活；没有调用产品写命令迁移人工历史。017 为完整 Author Apply，当前 manifest / next 仅以 017 为独立 Review Apply 输入；尚未创建 Reviewer Run 或签署 approved。工程 test 与隔离目标的正式接线测试不替代根正式 Delivery Full Test。
