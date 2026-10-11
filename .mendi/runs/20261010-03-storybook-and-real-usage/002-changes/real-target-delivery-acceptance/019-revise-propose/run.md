---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-revise-propose-01
actionType: revise-propose
role: author
run: "019"
status: completed
actionStatus: completed
result: planning-complete
nextAction: review-propose
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-update-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/018-propose/run.md
---

# MVP-D03-C Author Revise Propose

Owner 在指出“每一个分组就一个 task”后指令：**重新 propose**。保持 Author，针对 018 的任务粒度修订当前方案，不新建 Change、不重做 Explore、不提前实施计数器或启动子智能体，停独立 review-propose。

当前实际编号止于 018，最近交接仍是待独立 Review Propose，尚无该阶段批准。017 的 role=reviewer、completed / approved、authorRunRef 指向 016，有限 Explore 批准继续适用；不把它当作本方案批准。正式交接后的本次修订另建 019，016–018 的正文、编号、原 verdict 和原 artifacts 保留，不补写历史。

## 修订与产物

原 018 把六个工作分组各压为一个 checkbox，单项跨多个角色、授权与完成结果，无法如实记录中间进度。本次保留相同最简范围，按可分别确认完成的工作拆为 **六组、23 项，0/23**：

| 分组 | 新任务 | 完成依据 |
| --- | --- | --- |
| 空工程与稳定入口 | 1.1–1.3，3 项 | 官方空壳、目标依赖 / 检查、方法与跨 cwd 定位 |
| 目标方案与必要审核 | 2.1–2.5，5 项 | Open / 唯一绑定、Explore、独立 Review Explore、Propose、独立 Review Propose |
| 计数器与 Storybook | 3.1–3.3，3 项 | 真实组件、stories / 入口、开发检查 |
| 新 Author 恢复与审核 | 4.1–4.3，3 项 | 合法 continuing、真实新会话首次验收 / 交接、独立 Review Apply |
| 目标一次收口 | 5.1–5.6，6 项 | Archive、正式业务失败、修复、独立补审、整组新 PASS、首次 Close |
| 根 C 汇总与交接 | 6.1–6.3，3 项 | 按影响复用 / 补验、真实结果与行数说明、根 Author 交接 |

- [tasks](../../../../../../openspec/changes/real-target-delivery-acceptance/tasks.md) 重写完成单元、结果依据和角色 / 授权等待方式。已完成项可以先记录，待审项保持待做，不用整个分组全成才更新；不按单条命令或 task 拆 Run。
- [design](../../../../../../openspec/changes/real-target-delivery-acceptance/design.md) 同步粒度与 23 项分布，明确目标收口是根 C 归档前的验收，根 C 自身 Archive 属后续 Workflow follow-up。
- [proposal](../../../../../../openspec/changes/real-target-delivery-acceptance/proposal.md) 同步工作分组 / 完成单元的表述。唯一目标、组件行为、工具版本、正式五项集合、预算、服务收尾、合法新 Author 恢复和权限安排沿用 018。
- [路线图](../../../../../../mendi-foundation-and-delivery-roadmap.md) 仅在 D03-C Propose 安排补充“组内按完成单元拆分”的原则，不维护重复任务清单或数量门槛。

无 UI 完整生命周期、强制审核拒绝和第二轮交付仍取消，不勾成执行通过。A / B / D02-C 的适用工程和选择边界仍直接引用，不能认证本 Vue 的真实业务 / 角色 / 收口。

本次只对当前三个方案文件保存短名对照：[before](artifacts/before/)。不复制历史证据树；018 原 Run 与其输出原样保留，旧方案粒度可通过本次对照文件查看。

## 方法与实际检查

使用当前产品 propose 方法及 openspec-update-change 的已有产物修订规则。Owner 的“重新 propose”承接已讨论的拆分方向，授权修订；不另要求重复确认。

稳定 OpenSpec 1.14.1 `list --json` 确认根为 D:/Projects/MenDi nearest，已有当前 Change；status 的 existingOutputPaths 为现有 proposal / design / tasks，specs skipped。读取当前产物与直接 017 / 018，取得实际 [proposal](artifacts/proposal-instructions.json)、[design](artifacts/design-instructions.json)、[tasks](artifacts/tasks-instructions.json) 指引及依赖；未 new change、未创建 skipped delta。

- `node <稳定 OpenSpec JS> validate real-target-delivery-acceptance --strict --json`：[结果](artifacts/validate.json) exit 0，1 passed / 0 failed；只有 skip_specs 的 INFO，符合无产品合同变化的范围。
- `status --change real-target-delivery-acceptance --json`：[结果](artifacts/status.json) proposal / design / tasks done、specs skipped，isPlanningComplete=true，只代表规划产物齐备。
- `instructions apply --change real-target-delivery-acceptance --json`：[结果](artifacts/apply-instructions.json) ready，total=23 / complete=0 / remaining=23，不代表实施批准。
- 真实目标 `tests/fixtures/d03-c-vue-project` 仍不存在；未修改 src、tests、维护脚本或自有方法。纯规划变化沿用 017 的工程检查和有限 proof，不重跑未受影响的工程回归。

## 当前交接与限制

仅修改当前 Change 的 proposal / design / tasks、当前路线图对应段落、019 Run / artifacts，以及 manifest / README / OpenSpec context 的当前入口。没有改写旧 Run / verdict、创建目标、执行目标阶段或收口、启动任何子智能体或进行 Git 写入。

同步当前入口后通过稳定 MenDi [status](artifacts/status-readback.json) / [next](artifacts/next-readback.json) 读回，固定本 019 Author，保留根 manual-bootstrap / executable=false。

Author 结果为 planning-complete，**尚未获独立 Review Propose 批准**。Reviewer 直接审阅本 Run、当前 proposal / design / tasks 与路线图，重点确认任务粒度能真实记录部分完成且没有扩大范围、恢复取消项或混淆根 / 目标归档；无需重放旧 proof。完成后停独立 review-propose，不自动派 Reviewer 或进入 Apply。
