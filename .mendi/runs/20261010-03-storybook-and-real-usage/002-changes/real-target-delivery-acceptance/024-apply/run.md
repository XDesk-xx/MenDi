---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-apply-01
actionType: apply
role: author
run: "024"
status: submitted
actionStatus: in-progress
outcome: continuing
result: preparation-complete
nextAction: continue
nextRole: author
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/023-apply/run.md
---

# MVP-D03-C Author Apply · 准备预算补验

Owner 确认继续下一部分并要求到合适位置停下。承接 [023 continuing](../023-apply/run.md)，保持同一 Action / Author；实施依据仍为 022 批准的当前方案。本次实际读取 Apply 方法、产品 Apply 方法、当前 proposal / design / tasks 和 Apply instructions，state=ready；context / guidance 的按影响检查、独立审核及授权约定继续适用。根 manual-bootstrap，以人工新 Run 承接，不伪称调用产品 action continue。

**本段完成 1.2，进度 3/23，剩余 20 项。** 1.1 / 1.3 与安装、目标空壳 / 方法 / 工程检查沿用 023 的有效结果。本次只补准备执行路径的真实短时预算 / 取消 / 收尾，不重装、不重建工程、不提前实现业务。后续目标脚本接线、角色操作、完整 stories / browser 与收口仍待做；没有把 3.3 等项提前完成。

## 当前必要补验

[preparation-budget.ts](artifacts/preparation-budget.ts) 只记录本 Run 的固定宿主短时调用，没有任意命令 / 项目配置接口，不加入 MenDi 或目标长期执行入口，不复制旧调用源。normal / deadline / cancel 在各自同一进程内用 performance.now() 建立一次整组 deadline，每步取剩余时间与缩短单步上限的较小值，锁定终止原因；取消为实际前台终端 SIGINT。负例停止仅处理本次仍持有的活跃 ChildProcess 树，taskkill 5 秒、close / 管道 5 秒、监听 2 秒，分别确认事实。

| 实际调用 | 结果 |
| --- | --- |
| normal：两项固定短进程，5 秒组预算 | exit 0，耗时约 1613ms；两项被接纳，正常后项标记成立 |
| deadline：1800ms 组预算 | 第一项实际耗时约 825ms，第二项 allowance / remaining 约 974ms；到期 reason=timeout，后项未启动、第二项不接纳；调用 exit 124 |
| deadline 收尾 | 仅停止本次第二项树，close / 两条管道确认结束，本次临时监听 ECONNREFUSED；收尾约 465ms |
| cancel：实际 tty 前台调用并发送 U+0003 | 宿主 sigintCount=1、reason=cancelled，后项未启动、当前项不接纳；实际 close / 管道 / 本次监听确认结束，收尾约 413ms |
| cancel 退出 | 脚本设置非零 130，工具的 PowerShell terminal 实际退出 1；如实记录非零，不把工具退出码写成 130 |
| 当前 TS 源真正 typecheck | strict / noEmit / NodeNext / node types / erasableSyntaxOnly 通过；格式整理后再检查 exit 0 |
| 目标当前 README 格式；OpenSpec strict validate | 各 exit 0；skip_specs INFO 保持，不代表业务或审核通过 |
| 当前 Apply instructions；稳定 root next / target status | exit 0，进度 3/23；根 next=continue / Author / manual-bootstrap / executable=false，目标 local=null / next=delivery-open |

原始子进程输出、剩余预算、PID、退出和收尾事实各保存在 [normal](artifacts/budget-normal.json)、[deadline](artifacts/budget-deadline.json)、[cancel](artifacts/budget-cancel.json)；宿主命令退出保存在 host-normal / host-deadline，取消终端发送方式与真实退出差异见 [cancel-terminal](artifacts/cancel-terminal.json)。没有拼成正式 Full Test PASS。taskkill 本地化文本按 UTF-8 接收存在显示乱码；停止判断用实际 error=null、child close、管道和自己监听探测，不依赖该文本。

[当前进程核对](artifacts/processes-readback.json) 没有本次准备 Node 进程；未启动 Chromium 或 Storybook 持续服务。取消能力只认证本次宿主前台短进程路径，不认证未来 MenDi 正式取消持久化、Chromium 子树或 Storybook 服务。迟到 exit 0 / 不确定停止定向替身仍属于目标 3.3 的接线验证，本段未执行。

本次各短例有各自一次单调 deadline，并非把多个模式拼作一个预算。023 安装 / 检查正常结果继续有效，其跨进程续程不能证明继承原单调时钟的限制保持；本次没有重写旧结果或倒填整个安装组的预算认证。

## 当前段修正与检查范围

初次 TS 检查发现闭包中 port 为 number | undefined，当前 draft 捕获收窄的 ownedPort 后修正；后续真正类型检查通过。整理当前源时错误从根导入未声明的 Prettier，报 ERR_MODULE_NOT_FOUND；改为显式使用目标已安装 Prettier，只整理当前 draft 源并检查目标 README，没有安装工具或修改根工程配置。事实见本次 correction 材料，旧结果不变。

本段写入范围仅为：

- 新 024 Run / artifacts：固定短时调用源码、当次结果、必要操作说明与读回。
- 当前 Change tasks：仅 1.2 从待做变为完成；六组 23 项、其余方案和取消范围保持。
- 当前 Delivery manifest、根 README / OpenSpec context：当前继续入口与 3/23 进度。
- 当前新 Vue 目标 README：当前根交接与准备补验说明。

没有修改目标源码、依赖 / 锁 / 测试配置、产品 src / scripts / 旧 fixtures，未修改 roadmap。本次具体写入按工具调用整理见 [scope-summary](artifacts/scope-summary.json)；Git 工作区另有 016–023 的既有改动，不能将全部未提交差异归为本 Run。没有写入任何历史 Run / artifacts / verdict、其他 Change、旧 proof，没有移动 / 删除 / 重编号 / 批量格式化历史，没有复制旧证据树或建立 hash 清单。

当前不重跑未变化的根全套 check / 行为测试；沿用 023 的普通根 check、目标 check / build / SFC 类型负例结果及其明确限制。本次只新增宿主短验，真实 TS 检查及当前输入 / 查询结构检查覆盖变化。

## 维护代码规模与职责

[当前行数](artifacts/maintenance-size.json) 排除依赖、生成物和历史 Run，前三与 023 的直接 HEAD 基准相同：

| 类别 | 维护代码物理行数前三 |
| --- | --- |
| src | application/delivery-full-test.ts 401；adapters/openspec.ts 346；adapters/lifecycle-store.ts 336 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 |
| scripts | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 |

本段没有继续扩展这些维护文件，故无新增增长；本次宿主源是当前 Run 的调用记录，不作为通用执行平台或混入 UI 资产。沿用 023 对当前职责与后续扩展时机的判断；不为行数无关拆分或增加转发层。当前目标有限脚本仍未创建，后续按批准方案只处理该 Vue 固定集合。

## continuing 与准确停止边界

[下一段操作说明](artifacts/next-operations.md) 固定唯一目标路径、Delivery d03-c-vue-counter、VUE-COUNTER、Change implement-naive-counter、稳定工具及具体范围。目标目前尚无 Delivery / Change；当前“继续”授权根 Apply 工程段，不替代该具体目标 Open / 新 Change 激活要求，不沿用已撤回目标授权。

本 Run 提交 continuing，根 Action 保持 in-progress；按 Owner 请求停止，等待确认与具体目标授权后同 Action 新 Run 承接。下一段拟进行目标 Open / 激活绑定 / Explore，完成后停目标独立 Review Explore；Author 不自签、不自动派 Reviewer 或发送跨会话消息。独立目标方案批准后才实施计数器，留给新 Author 的真实完整验收保持未执行。

根 C 最终独立 Review Apply 仍在完成全部保留范围后的边界；本段不是根 complete。没有目标或根 Archive、正式 Full Test / Close、Git 写操作、目录清理、子智能体启动或角色切换。023 及以前所有材料保持原样。
