---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-review-propose-01
actionType: review-propose
role: reviewer
run: "020"
status: completed
actionStatus: completed
result: changes-requested
verdict: changes-requested
nextAction: revise-propose
nextRole: author
date: 2026-10-11
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/019-revise-propose/run.md
---

# MVP-D03-C Review Propose

**verdict：changes-requested，一项 P2 方案缺口。** 独立审核固定 [019 Author Revise Propose](../019-revise-propose/run.md) 及当前 proposal / design / tasks / skip_specs，按项目 Review Propose 方法、Vue best practices 与 Vue testing 指引核对。唯一目标、先方案后实施、新 Author 留待任务、独立审核和授权安排可保留；预算与取消的实际执行责任须先说明。未修改 Author 方案或实现，未执行 Apply。

## D03C-RP-001 · P2 · 预算缺少触发与收尾的实际执行路径

位置：当前 `design.md:80–97`，相关任务 1.2、3.2、4.2、5.5。

方案列出准备整组 10 分钟、准备单命令 5 分钟、stories / browser 3 分钟及正式五项整组 10 分钟，并说达到上限通过既有 MenDi 前台取消、browser-check 在 finally 收尾。但尚未说明由哪个本次执行者计时、把整组剩余时间传到当前步骤，以及通过什么实际可用入口触发取消。

独立读取选定稳定安装的 CLI help、`dist/drivers/dispatch.js` 和 `dist/adapters/test-process.js`，并对照当前源码：CLI 无 timeout / deadline 参数，Full Test 调用不创建预算计时器；`executeForeground` 响应 SIGINT / 调用者 AbortSignal，唯一 closeDeadline 是停止后等待 close 的 5 秒，不能充当执行上限。`verify:stories` 表中只是直接 Vitest 命令；30 秒测试单步超时也不能覆盖依赖准备、启动、挂起的 hook / teardown 或五项总时长。直接记录见 [入口核对](artifacts/entry-readback.json)、[真实 CLI help](artifacts/stable-cli-help.txt)。

此外，现有 Windows 停止路径使用本次 child 的 `taskkill /T /F`，不能假定被强制终止的 browser-check 一定运行 finally。若直接在外层杀 MenDi 进程，还可能丢失正式结果收口机会。当前任务只要求取得正常结果和收尾事实，没有明确如何验证预算到期、取消以及无法确认停止时的路径。

这不是已经复现的产品挂起，也不要求现在改变产品协议；是本方案依赖的能力尚未指定执行责任。若照现有文案实施，预算可能仅为说明，或把强制停止误当作已取得 finally / 浏览器收尾证据，影响当前明确保留的有界执行要求。

**最小修订要求：**

1. 在现有 design §5 指定预算由目标有限脚本还是本次宿主调用者承担，给出实际入口与计时范围；正式五项共享一个总截止时间，不能每步重新取得 10 分钟。准备 / 正常有限检查同样说明其上限如何执行。不新增 MenDi CLI 参数、通用执行器或预算平台。
2. 说明到期 / 主动取消的停止顺序、有限收尾等待，以及如何保留本次 child、日志和监听状态；区分正常 finally 与强制停止。无法确认时如实保存实际正式结果及限制、停在当前边界，不以脚本打印 unknown 代替产品持久结果或宣称已收尾，不自动清锁 / 重跑。
3. 并入现有相关任务：用缩短预算的有限场景验证总预算耗尽、取消与收尾，核对正常通过不接纳超时结果、后续步骤不继续。只验证本次新增执行接线，不重放旧 D02 全部进程测试，不增加任务数量、独立 gate 或验收平台。

## 其余核对结论

| 重点 | 本次结论 |
| --- | --- |
| 唯一目标及真实顺序 | 目标固定 `D:/Projects/MenDi/tests/fixtures/d03-c-vue-project`，当前确实不存在；官方 bare 空壳、真实目标 Explore / 审核 / Propose / 审核后才实施。根 C 不代写目标业务规格，App / stories 共用一份 CounterPanel，不复制 proof 或撤回的旧实现。 |
| 业务与检查归属 | 初值、加一、reset=0、禁用都明确；target vue-tsc 覆盖 SFC / stories / 配置 / 维护脚本，目标基础格式与 lint 排除历史和生成物，根只按必要范围调整类型归属。静态 proof 不认证 Vue Vitest / Chromium，实际运行留 Apply，无 MCP 前置。 |
| 新 Author 留待任务 | 初始 Author 留真正尚未执行的完整 stories / browser，目标 Apply submitted / continuing 后由 Owner 明确 handoff 给不同 Author，再以不继承旧对话的新会话完成。当前 CLI / resolve 实现支持此同阶段、未完成、不同 actor 的接收；身份字段和产品 handoff 本身不能证明真实新会话。 |
| 实施注意：focused 映射 | 当前 focused 映射完整 verify:stories、fast 也包含它。初始 Author 的开发 focused 应采用明确测试子集或其他必要开发检查，不能先调用完整映射再称其为留待任务。此处遵守现有 §4 的未执行要求即可，不另增流程或审核项。 |
| 独立审核及授权 | 目标审核各固定实际当时的 Author；同一独立 Reviewer 会话可承接阶段，不能预批未来工作。Owner 负责具体授权 / 会话交接，不须亲自审演示项目。根方案批准不授予目标 Open / 新 Change / handoff / Archive / 正式 Full Test / Close 或 Git 权限；已有明确授权不重复申请。 |
| 正式集合与修复 | 五项完整集合与目标 full 入口一致；受控 reset 故障须明确授权、保留正确基线及真实差异，不冒称自然缺陷或 Reviewer 漏检。真实 failed 后局部 repair、独立补审、新整次五项执行再 Close；无目标 Git 时不冒用根 B commit。 |
| 任务粒度与引用 | 六组 23 项使工程完成、角色交接和授权等待分别可记录，不要求每项创建 Run。目标收口是根 C 归档前验收，根自身 Archive 是后续，不存在自身归档前置循环。无 UI 完整流程、第二轮交付和强制审核 finding 已取消；旧结果只沿用适用范围，不补历史或恢复撤回的 C 批准。 |

## 独立检查与限制

- 固定 OpenSpec 1.14.1 的 proposal / design / tasks / specs 实际 instructions 均 exit 0；proposal 无前置，design 依赖 proposal，tasks 依赖 design 和已 skipped 的 specs，context 与当前 019 相符。各原始输出保存于本 Run [artifacts](artifacts/)，不复制旧证据。
- `validate real-target-delivery-acceptance --strict --json`：exit 0、valid=true，仅 skip_specs INFO，见 [validate](artifacts/validate.json)。本轮工程验收不改产品合同，可保持 skip_specs；工具通过不解决上述方案缺口。
- `instructions apply --change real-target-delivery-acceptance --json`：ready、**0/23，remaining 23**，见 [Apply instructions](artifacts/apply-instructions.json)。这是只读核对，不表示已批准实施。
- 查看稳定安装实际帮助和对应执行代码，不仅根据根源码假定安装能力；新目标不存在，src / skills / tests / package / lock 相对 B checkpoint 无新增修改。沿用 017 已通过的工程检查和有限环境 proof，本次没有必要重新安装、运行浏览器、做全量回归或创建真实目标。
- 本次未做超时运行复现，结论限定为方案入口 / 实现职责不完整；没有宣称现有产品取消必然失败。后续只需验证所选择的具体接线。

## 给 Author 的下一步指令

先 `revise-propose`，仅修 D03C-RP-001：在当前 design §5 与相关任务中明确谁计时、如何执行单命令 / 总预算、如何取消和确认收尾，并安排短时定向验证。保留唯一目标、六组 23 项、真实留待任务与授权边界；不创建 Vue 工程，不提前实施计数器，不启动其他会话，不改历史或重做 Explore。按实际顺序新建本次实质修订 Run，再交独立 Review Propose 补审这一项，其余有效结论沿用。

补审批准并收到 Apply 指令后：先完成 1.1–1.3 的空工程 / 环境 / 方法准备与具体授权说明；按已获授权推进唯一目标的真实阶段。到目标 Review Propose 批准后才实施组件；初始 Author 完成必要开发检查，将完整 verify:stories / verify:browser 留给真正的新 Author，经合法 continuing / Owner handoff 接收。目标实际独立 Review Apply 批准和具体操作授权成立后，再完成一次目标收口。根 C 最终只交独立 Review Apply，不自动 Archive / D03 收口 / Git。

## 当前交接

停在 `revise-propose / awaiting-author / author`，next 只引用本 020；019 和历史 verdict / 编号不变。D03 open / manual-bootstrap，A / B archived、累计 9、C active；当前任务仍 0/23。manifest / README / OpenSpec context 同步审核结论，稳定入口的 [status 读回](artifacts/handoff-readback.json) 核对当前交接，executable=false 保持。

本次未修改方案或实现后自签，未执行 Apply、目标或根 Archive / 正式 Full Test / Close、Git 写入、清理或子智能体启动。
