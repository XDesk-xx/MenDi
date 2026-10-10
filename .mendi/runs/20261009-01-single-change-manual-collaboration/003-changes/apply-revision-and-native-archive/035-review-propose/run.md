---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
actionId: apply-revision-and-native-archive-review-propose-02
actionType: review-propose
role: reviewer
run: "035"
status: completed
result: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/034-revise-propose/run.md
---

# MVP-D01-D Review Propose 补审

**verdict：approved。** 独立补审 [034 Revise Propose](../034-revise-propose/run.md)，关闭 [033](../033-review-propose/run.md) 的 RP-D-001。没有新增阻断项；033 的其余核对与本次补审共同支持当前方案进入 Apply。032 / 033 原记录和 changes-requested verdict 保留。

## 修订核对

- 对照 034 保存的修订前材料，实际变更集中于 design §2 / §4 / §5 / §7、action-runs delta 及任务 4.4、5.1、5.3–5.5。proposal、其他两份 delta 的操作依赖、pending / 完成解释和 local-only 约束继续适用；没有改变已批准 Explore 的事实。
- 现在明确以已有显式 finish 为重新分类入口。原写者及可能启动的原生进程须确认停止，残留锁按既有 Owner 授权边界处置；拿到新锁不等于原调用已停止。锁内校验当前 draft / actor / attempt、archiving binding、countBasis、完整调用前材料、活动源及受影响主规格未变（含原不存在文件），真实 archive 父目录没有本次候选，才可保存 invoking → none。
- none 观察保留原 attempt、调用标记、输入和错误，只新增有限观察。返回 observed-none / pending，不调用上游、不增长计数、不改正文或 binding、不新建 Run / attempt、不生成完成或批准。写入 / 读回失败继续非零退出并保留锁和实际现场。
- 状态转换已连通：invoking → 显式 finish 观察 → none → 另一次显式 execute，或单独 Owner rollback；后两个入口仍各自复核当前必要输入，不替 finish 重新分类。query 只解释当前记录和最小 next，不判定现场、不自动执行。confirmed / 已发生效果不能降为 none，未知、变化、证据不足或写者未停止仍保持阻断。
- 新增三个 delta 场景覆盖“标记已写、原生未启动”“原生无效果结束、none 未保存”及禁止误判 / 观察失败。任务 5.1 要求新进程从真实 invoking 记录验证两条显式后续路径；5.3 包含已有效果、confirmed、活跃 / unknown 写者、缺证和提交失败对照。任务 4.4 先测试合法 prepared / none 出口，后续再与 5.1 联验，实施顺序没有反向依赖。
- 扩展前职责分离、三类目录前三名与维护判断、旧 C / D proof 限定保留及新增产品测试分组均保持。修订未增加命令、通用恢复器、决策记录链、全量 hash 或行数 gate。

## 独立验证与限制

| 命令 / 检查 | 实际结果 |
|---|---|
| 固定 OpenSpec `validate apply-revision-and-native-archive --strict --json` | exit 0，valid=true、issues=[]；[结果](artifacts/strict-validate.json) |
| 固定 OpenSpec `instructions apply --change apply-revision-and-native-archive --json` | exit 0，state=ready、progress=0/21；[结果](artifacts/apply-inputs.json) |
| 三份修订前后材料的定向 diff 与受影响 delta 核对 | 与 RP-D-001 所需入口、限制和验证一致；git diff --no-index 的 exit 1 表示存在预期文档差异 |

产品实现尚未开始，21 项任务均未勾；本次批准不证明 finish / 重试 / rollback 的运行效果。两处中断及对照测试须在 Apply 实现并由 Review Apply 核对。沿用 033 的其余方案核对和 031 的独立 proof / 基线检查，不重跑无实现变化的旧实验或行为测试，不把结构校验作为语义批准的替代。

## 交接

下一步为 Author Apply，等待明确指令，按受审任务先整理正在扩展的职责。当前 Delivery 仍 open，累计归档数仍为 3。本轮只保存审核与当前交接，未修改方案、实现、历史 Run 或 verdict，未执行 Apply、Archive、Git、解锁或正式 Delivery 收口。
