# 定向验证与证据入口

以下是隔离 product 目标的实施场景。阶段 Author / Reviewer 是记录准入夹具，不批准根 Change，也不代表实际真人独立审核。

| 范围 | 维护输入 / 场景 | 直接观察 |
| --- | --- | --- |
| 计划 / 版本 / 前向依赖 / 影响范围 | tests/group-contract.test.ts | 必需范围、重复 / 悬空 / 越界选择、同基准阶段包含、公共 / 未知影响不可缩小 |
| 真实请求 / typed attempt / 同轮续测 | tests/group-attempt.test.ts | 真实 pnpm 与 Node；完整通过只提示构造候选；中段失败后独立尾项续测保留原失败，候选漂移 / 已执行选择 / initial 绕行拒绝 |
| E1 / E2 / E3 / E4 / E5 | 同上及 tests/fixtures/group-node-runner.ts | 真实 skip / TODO、空业务、同文件 pass / fail、pass 后晚退出、包装器 exit0 与失败报告；记录原 command 与协议分别判断 |
| E6 / 输入漂移 / 资源 / 取消 | tests/group-boundaries.test.ts | 真实 child close 后终态替换 / 读回 / 释放故障、陈旧报告、陌生端口及清理未知、实际前台树取消、Node 文件 cancelled 与根 failed 分层解释 |
| 修复 / 当前独立审核 / 来源选择 | tests/group-verification.test.ts | 尾项通过后固定原中段修复；实际局部契约变化、公共输入变化、必要扩大；当前失败不能任选旧成功、缺来源 incomplete 可显式补齐、重复来源拒绝 |
| 直接快照 / Close | 同上及 tests/group-cli.test.ts | 移走旧失败 / Review 正文后仍可读当前结论并 Close；当前必要事实坏则拒绝，不递归历史 |
| 真实 CLI / 中断收尾 / 新轮 | tests/group-cli.test.ts | run / status / verification create / status / human；新 attempt 替代旧 verified 后拒绝陈旧 Close；原生本地 Close 提交故障、停止原夹具进程后原 token 处置、显式 resume；Reopen 清除新轮指针 |
| 完成条件 / 非测试 / 增量 / 计时 | tests/group-completion.test.ts | 执行前合法排除单列、真实构建产物、构建失败只阻断依赖、独立后项发现新问题、增量不重读、单调时间与缺测说明 |
| 受控同次复用 | tests/fixtures/group-reuse-target.ts | 实际同次输入相同的只读产物供两个已就绪 Worker 独立上下文消费，输入改变另建产物；没有对照组，不声称提速 |
| 旧 command 与工程公共面 | 原 delivery / lifecycle / round / migration / records 测试、根 pnpm test | 旧完整执行、修复 / 独立审核 / 原整次重跑、Close / Reopen、本地提交恢复和旧记录不补新字段 |

首次 group-attempt-first.log 保留空文件被 Node 根容器计作一次通过的真实失败；group-attempt-retest.log 为修正后4/4。group-aborted.log 保留文件 cancelled 被根容器折成 failed 的首次未满足结果；abort-first-report.json / abort-first-events.jsonl 是该次直接原始输出，group-aborted-retest.log 是分层修正后的补验。

工程检查保留 check-first / check-second / check-final-with-help 等原失败；check-final-candidate.log 为最终候选完整 check 通过。旧 Explore 程序只改命令结果 union 的真实类型收窄接线，不扩展或重放其完整流程，也不修改其历史原输出。

root-test-first.log 仅为第一次中止收集，原因见 root-test-first-interruption.md。root-test-final.log 观察到74 / 75两项真实兼容失败，关键新增路径收集后停止，原因见 root-test-final-interruption.md。repair-focused.log 23/23、launch-focused.log 1/1及 check-final-repaired.log 通过后，重新完整执行 root-test-repaired.log；不能用旧片段拼接。

regression-repaired 中命令输出与本次 group 的 request / 最终报告 / 原事件 / child / 必要日志各保留直接原件，旧收集的 regression / regression-final 及定向原件保持，不复制历史证据树。隔离目标可由受控输入重建。额外定向核对了真实未启动 child、预检原始诊断、损坏当前快照不回退旧 verified，以及新 candidate Close 可成为后续轮次的直接 product 基线。

根 root-test-repaired.log 已完整273/273通过（exit0），与两个保留的中止 / 失败集合分开。

收尾直接一致性 proof：tests/group-consistency.test.ts 对真实完成目标的同一报告做受控读中变化，及向真实 typed Author 记录加入不适用审核字段；consistency-before.log 两项真实失败，consistency-after.log 两项修正通过。首次快照现不能被后读覆盖，新 typed 提交状态 / 结果必须一致。

最终新模式受影响集合为 final-focused.log / final-focused 直接原件，包含全部 group 测试及旧 delivery-admission；额外覆盖实际取消 + wrapper exit0 的 invalid 安全终态。check-final.log 为补修后的完整工程检查。新 typed / group 分支收尾修改没有再次改变旧 command 路径，未受影响旧结果沿用完整273项集合；这不是新一次全根集合或根正式 Delivery Full Test。
