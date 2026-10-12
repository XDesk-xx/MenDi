---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-test-preparation-optimization-01
actionType: test-preparation-optimization
role: author
run: "038"
status: submitted
actionStatus: completed
date: 2026-10-12
scope: engineering-maintenance
finishedAt: 2026-10-11T17:35:30.863Z
outcome: complete
result: scoped-optimization-ready-for-independent-review
repairRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/037-revise-delivery-repair/run.md
---
# 空依赖测试准备成本局部优化

Owner单独授权成本线。与037修复分开，优先减少空依赖沙箱重复安装和前置准备，保留独立状态、真实工具与关键边界；不改正式集合、业务架构或历史，不新增gate/测试平台。完成交独立定向审核，不执行根正式FullTest。

## 最小优化与范围

本轮维护修改仅五个文件：tests/test-support.ts、sequential-support.ts、lifecycle-support.ts、delivery-support.ts及新增test-preparation.test.ts；不修改src、脚本、fixtures、旧proof或历史。037的tests/test-store.test.ts属于另一个修订，当前成本线只读取并继续确认候选，没有再次修改它。

现有testTarget准备无外部依赖package、隔离workspace与固定pnpm11.22.0入口。以前每个ready目标各自install；sequential、lifecycle和verification副本也各自install。现在在test-support内加一个本进程私有的空依赖安装种子：从本次受控三份配置复制到新隔离目录，真实执行一次固定pnpm offline/ignore-scripts；后续只复制其lockfile和空node_modules产物，pnpm workspace-state的projects键改为各自真实目标根。

每个目标仍新建独立根，复制的是普通文件，协作记录、执行结果、锁、源码和安装元数据均不共享引用/链接；种子不使用任何目标的后续状态，也不读取旧临时环境、开发历史或正式PASS。种子只活在当前node测试进程，本次退出后下个进程重新构建，没有全局缓存目录、注册中心、通用准备平台或新gate。

复用严格限定现有相同配置、无依赖的受控夹具及pnpm11.22.0生成格式；不推广到Vue/Storybook或有依赖项目，不手造pnpm安装结果。`testTarget(true,false)`仍不准备。目标脚本映射、pnpm真实版本预检、error策略依赖检查、实际业务脚本与完整协议记录都继续实际执行；新增未安装依赖必须被真实pnpm拒绝。没有改业务架构、产品参数、依赖政策或root FullTest八类/18项集合。

生命周期原有completed seed继续从当前输入实际原生归档；passedTarget仍为每个独立目标真实运行其声明，closedTarget仍实际Close，不缓存验收PASS或前置批准。此次只省掉重复空依赖安装及clone后的重复安装准备，未搬移或减少CLI、跨进程恢复或重要故障边界；更深的前置组合优化不在本轮贸然实施。

## 可核对的成本收益

用同一preparation-cost.ts、两个新Node进程、各4个新空依赖目标实际比较，原始结果见 [before](artifacts/cost-before.stdout.log)、[after](artifacts/cost-after.stdout.log)，实际命令日志各保存一次，汇总见 [cost-comparison](artifacts/cost-comparison.json)：

| 项目 | 修改前 | 修改后 |
| --- | --- | --- |
| pnpm install调用 | 4 | 1 |
| 各自目标的真实pnpm run / error依赖检查 | 4 | 4 |
| 4目标合计准备时间 | 3918.069ms | 989.050ms |

两个版本所有实际命令均exit0。各自projects键正确；修改首个目标manifest/安装状态，第二个目标字节不变。该输入故意只改本次新诊断沙箱，不碰产品失败现场或历史。新回归还核对后续第三目标未被污染、未准备及新增未安装依赖仍真实拒绝。没有时间阈值断言、性能gate或机械复跑完整集合。

上述数字只说明本机四个空依赖准备的收益，不推算根FullTest总时间；034最慢Close/第二Archive/Reopen数据只作为优先级线索，其并发负载与当前定向运行不同。没有宣称已解决所有前置成本或认证其他平台、版本和冷安装。

## 验证与交接

当前verify.ts使用既有executeForeground，普通focused首组15分钟、每项取剩余预算并有限收尾；不调用根正式FullTest。两个当前TypeScript准备脚本严格noEmit已通过。实际结果见 [verification](artifacts/verification.json)、[verification-final](artifacts/verification-final.json) 及各命令原始stdout/stderr：

| 命令/场景 | 结果与覆盖 |
| --- | --- |
| test-preparation / test-entries / test-execution / test-store，concurrency=2 | 21/21、0 skip，77.437秒；独立路径/状态、真实缺准备及缺依赖拒绝、取消/停止、unknown保护、真实脚本、新释放候选 |
| lifecycle-writes仅三组提交边界 | 3/3，208.511秒；Close、Reopen、Open各9个真实故障点，27个边界及跨进程resume，不共用执行结果 |
| sequential-changes仅第二Archive边界 | 1/1，82.597秒；计数、终态、manifest三个实际中断与新进程收口，旧项保持 |
| delivery-full-test仅新子执行及工具/依赖拒绝 | 2/2，35.069秒；当前verification副本的正式适配器父子记录与真实依赖检查；属于隔离协议测试，不是根D03 FullTest |
| 最终pnpm check | exit0，10.031秒；格式、lint及src/scripts/tests三组tsc |

本轮27项行为用例通过。首组check因lifecycle-support删除安装后遗留未用command导入而失败；保留失败输出，只删该导入后执行单项check-final，不机械重跑已通过的行为。补验脚本沿用首组累计执行预算，最后一项实际取60秒；417.266秒是两段累计执行时间，不包括中间修正/脚本准备停顿，不称连续完整集合。实际从首命令启动17:23:43.270Z至最后check关闭约17:31:57.671Z，约494.4秒，亦在15分钟内。所有当前child/pipes关闭，无超时，逐项直接维护输入和037候选读回一致。

未变化的真实UI、独立安装、其他规则组合和已批准产品实现结论沿用；沒有以定向PASS拼接根FullTest，正式集合仍须独立审核后按授权新整次执行。node_modules/workspace设置同步提示仍非检查失败，不为其扩展重装。

## 维护规模

见 [line-counts](artifacts/line-counts.json)。src前三：application/delivery-full-test.ts 401、adapters/openspec.ts 346、adapters/lifecycle-store.ts 336；tests前三：action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts前三：proofs/mvp-d01-c-explore.ts 678、proofs/mvp-d01-d-explore.ts 487、proofs/mvp-d01-a-explore.ts 463。

本Run四份直接before为可靠基准：test-support 115→136（+21），sequential-support 107→103、lifecycle-support 176→172、delivery-support 122→118（各-4）；新增test-preparation37行。没有扩展维护代码前三、旧C/D proof或产品源码。新增部分只负责受控空依赖准备；单一私有种子服务四个现有调用，不引入平台、纯转发层、硬行数门槛或独立台账。

独立Reviewer分别审037的D03-DR035-001恢复及本成本线；一次针对性审核可给两个独立结论，不自动启动Reviewer。当前037候选由其短名单文件可直接核对；本Run提供五个维护文件及四份必要before，不复制历史树。原034正式failed、031/034现场和035/036 verdict保持；没有Git、Close、Archive、清理、激活或子智能体。

本次Author完成不代表批准。最终交接只需当前038、其直接037修订及这些维护文件/必要日志，由当前记录按需定位036/034，不累积历史链。下一步review-delivery-repair / reviewer / awaiting-independent-review：对037阻断修订与038工程成本线分别补审。根D03仍open/manual-bootstrap，A/B/C归档绑定、累计10和无活动Change保持；最新正式fullTest完整保留034 failed，未执行的新组不勾成通过。
