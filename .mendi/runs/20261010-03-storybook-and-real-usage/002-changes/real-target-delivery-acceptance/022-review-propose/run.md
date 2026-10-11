---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-review-propose-02
actionType: review-propose
role: reviewer
run: "022"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: apply
nextRole: author
date: 2026-10-11
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/021-revise-propose/run.md
---

# MVP-D03-C Review Propose · D03C-RP-001 补审

**verdict：approved，D03C-RP-001 在方案层面关闭，无新增阻断项。** 固定 [021 Author Revise Propose](../021-revise-propose/run.md)，依据项目 `skills/actions/review-propose/SKILL.md` 独立补审预算触发、取消与收尾路径；其余沿用 [020](../020-review-propose/run.md) 仍适用的核对结论。当前方案可交 Author Apply，六组任务仍 **0/23**；实际有限脚本、终端取消和业务验收均未执行，不把方案批准写成运行 PASS。

## D03C-RP-001 关闭依据

| 原缺口 | 本次独立判断 |
| --- | --- |
| 谁触发预算 | design §5.1 指定准备由宿主固定内联 Node / spawn 调用承担；目标 stories / browser / full 由 `scripts/verify-vue.ts` 承担，固定命令和 cwd。明确计时器与当前 child，不再假定稳定 MenDi 有 deadline 参数。 |
| 总剩余时间 | 五项 full 在第一步前建立一个单调时钟 deadline，每步只取单命令上限与 remaining 的较小值；含正常关闭时间，步骤前及接纳结果前复核。超时 / 取消先锁定原因，迟到 exit 0 不变为 PASS，不启动后项。 |
| 主动取消 | 真正交互终端 Ctrl+C 向本次前台调用发送 SIGINT；正式调用交给 MenDi 当前适配器处理其持有 child。读取稳定安装当前 test-process.js，确有 SIGINT / AbortSignal 响应及停止后 close 确认路径。方案明确 Windows child.kill('SIGINT') 与杀 MenDi PID 不是替代；真实终端发送方式留 Apply 短时验证，能力不成立时停对应操作。 |
| 进程收尾 | 到期或取消仅处理本次仍持有的活跃树，taskkill 5 秒、close / 管道 5 秒、监听 2 秒，收尾最多 12 秒另记，不能重新取得执行预算。正常 finally 与强制终止分开，以本次实际进程 / 管道 / 监听事实确认，不把执行 taskkill 当作停止证明。 |
| 正式结果与不确定性 | 五项预算不冒充整个 CLI 准入 / 预检 / 持久化预算；正式父 / 子结果取实际读回。即使产品结果为 failed，停止未确认仍保留限制并停 Owner，不伪造 unknown、不清锁、不自动重跑或 Close；保留 MenDi 自身收口机会。 |
| 最小验证 | tasks 1.2、3.2、3.3、4.2、5.5 明确对应责任。秒级短进程覆盖正常、剩余预算耗尽、迟到 0、后项未启动、真实 Ctrl+C 与收尾；未确认分支用定向替身验证有限返回，不故意遗留失控进程。并入现有任务，不提前跑留给新 Author 的完整业务集合。 |

上述路径已达到可实施的设计清晰度。特别是前台 Ctrl+C 是否在实际宿主生效、浏览器子树是否可确认停止，仍须按 3.3 / 4.2 在真实环境取得结果；本补审没有声称它们已通过，也不要求在 Propose 提前完成 Apply。

## 范围与检查

- 独立对照 021 保存的短名 before：设计差异集中在 §5，任务只变 1.2、3.2、3.3、4.2、5.5；数量与未完成状态均保持 23，见 [范围核对](artifacts/scope-readback.json)。proposal 与 skip_specs 声明仍一致，未恢复已取消流程或撤回的旧 C 材料。
- 目标目录仍不存在，产品 src / skills / tests / package / lock 相对 B checkpoint 无新增修改。沿用 020 对唯一空工程、真实阶段、新 Author 留待任务、独立审核和授权、五项完整集合的有效结论，以及 017 的有限 proof / 工程检查。不重放旧输出，不扩大历史引用链。
- 固定 OpenSpec 1.14.1 `validate real-target-delivery-acceptance --strict --json`：exit 0、valid=true，仅 skip_specs INFO，见 [validate](artifacts/validate.json)。真实 design / tasks instructions 退出 0，dependencies 为当前 proposal / design 与 skipped specs，context 与 021 交接相符。
- 同一入口 `instructions apply --change real-target-delivery-acceptance --json`：ready、0/23、remaining 23，见 [Apply instructions](artifacts/apply-instructions.json)。这是结构核对，未执行 Apply。原始输出仅保存在本 Run；纯方案补审不重新执行 pnpm check、安装、浏览器或 B 长回归。
- 有限脚本只承担当前 Vue 固定集合，不接受任意项目 / 命令，不增加 MenDi 产品字段或协议。预算 / 收尾与定向验证不是新 gate、台账或通用调度器；未来只对实际变化补验。

## Author 下一步指令

进入根 D03-C Apply，以本 022 批准的当前方案为准，按实际顺序新建 Author Apply Run；同阶段准备、检查和修复在该 Run 中继续，不按 task 或命令逐条新建记录。

1. 先完成 1.1–1.3：从不存在的 `D:/Projects/MenDi/tests/fixtures/d03-c-vue-project` 创建官方空壳，目标独立 workspace / 固定依赖 / 检查配置 / OpenSpec 方法与规则，落实一致安装运行环境和准备预算。准备真实目标、范围和操作说明后，集中核对具体 Open / 新 Change、角色会话、后续收口授权；缺少的只在依赖操作前请求，已有明确覆盖的授权不重复申请。
2. 获对应授权后只开启该唯一目标流程。目标真实 Explore / Propose 及必要独立审核完成后才实现 CounterPanel 和 stories。Author 不自行填写 Reviewer approved，也不凭本根审核自动派其他会话。
3. 在现有任务 3.2 / 3.3 落地固定有限脚本和本次短时预算 / 取消 / 收尾验证。初始 Author 只做必要开发子集；focused / fast 的现有映射包含完整 stories，不能先执行它们再声称完整业务验收尚未执行。
4. 保留首次完整 verify:stories / verify:browser 给真实新 Author，合法 continuing 后经明确 Owner handoff / 会话授权从当前记录接手，完成留待任务并交实际独立 Review Apply。短时工程验证不消耗该业务留待任务。
5. 目标审核批准且具体授权成立后，完成一次 Archive、正式业务失败 / 局部修复 / 独立定向补审 / 原五项新整次执行 / 首次 Close；不确定停止则如实保留结果与现场。最终汇总按影响验证和 AGENTS 行数说明，停根 C 独立 Review Apply，不自动根 C Archive、根 D03 正式收口或 Git。

## 当前交接

同步当前 manifest / README / OpenSpec context：`apply / awaiting-author / author`，只保留本 022 直接入口。D03 仍 open / manual-bootstrap，A / B archived、累计 9、C active；任务保持 0/23，021 和旧 Run / verdict 保持原样。

稳定安装的只读 [status 回读](artifacts/handoff-readback.json) 核对 next 和 executable=false。本次仅完成方案补审，未执行后续 Apply、实际生命周期、Git 写入、清理或子智能体启动。
