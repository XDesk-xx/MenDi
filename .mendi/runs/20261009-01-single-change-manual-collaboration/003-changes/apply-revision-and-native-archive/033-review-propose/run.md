---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
actionId: apply-revision-and-native-archive-review-propose-01
actionType: review-propose
role: reviewer
run: "033"
status: completed
result: changes-requested
date: 2026-10-10
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/032-propose/run.md
---

# MVP-D01-D Review Propose

**verdict：changes-requested。** 独立审核 [032 Propose](../032-propose/run.md) 的 proposal、design、三份 delta 与 21 项任务。发现一项进入 Apply 前应修正的状态转换缺口；其余范围和维护安排可沿用，不要求重做 Explore。

## RP-D-001 / P2：明确调用标记中断后的无效果重新判定入口

位置：`openspec/changes/apply-revision-and-native-archive/design.md` §2 的 Archive 回退限制（第 38 行）、§4（第 60–62 行）、§5 finish 表，以及对应 action-runs delta 的 Observed archive effects and bounded finish、tasks 4.2–4.4 / 5.1–5.3。

方案要求先落盘 invoking 再调用原生，这是正确的效果不确定边界。但以下合法中断尚没有明确的后续状态转换：

1. execute 已保存完整 attempt 输入和 invoking 标记，在启动原生进程前中断；或原生已无效果结束，进程在记录 none 前中断。
2. Owner 核对全部写者已停止并按既有授权边界解除残留锁。活动源、受影响主规格和元数据均未变，没有归档目录，现场可以证明确无效果；持久记录仍是 invoking。
3. §4 明文规定 invoking 只能 finish / 停止，execute 只接受 prepared / none；§2 又禁止 invoking rollback。finish 被限定为确认原生效果及本地收口，§5 对“无原生效果或现场未知 / 冲突”统一写为报告阻断，没有规定哪个入口在无效果证据充分时将 invoking 重新判定并保存为 none。

任务 4.3 的“区分状态”和 4.4 的“重新确认无效果”表达了意图，但没有消除上述入口限制。按字面实现可能使已知无效果的现场永久卡住；若实施者自行让 execute 接受 invoking，又会与禁止重复原生调用的受审边界冲突。这是方案契约缺口，不是已实现产品 bug，也不是要求自动恢复未知现场。

**所需局部修订：**选定一个已有显式入口承担“观察并重新分类”，写清 invoking → none 的条件、锁内复核、记录更新和 next。可让 local-only finish 在原写者已确认停止、相关锁已按授权处置后，依当前 attempt 的有限输入证明确无效果，只更新当前 draft 的观察状态并返回未完成；后续另一次显式 execute 才能重试，或 Owner 显式 rollback。也可选择等价的受限入口，但必须同步设计、delta 和任务，避免不同章节给出相反限制。

无效果重新分类不得调用原生、增加计数、生成归档完成或自动推进；未知 / 变化 / 仍有写者时继续停止。保留原 attempt 与错误，不添加通用恢复器、额外决策记录、历史链或 hash gate。

**验收场景：**在调用标记落盘后、原生进程启动前注入中断，并覆盖原生无效果返回后、none 保存前中断；按既有测试锁处置约定，以新进程从实际 invoking 记录执行所选入口，证明只重新分类、不调用原生、不增长计数。再分别验证显式 execute 和 Owner rollback 可达；已有效果及证据不足的对照场景不能被重新判为 none。无需在本次方案修订中提前实现，只需补齐明确任务与场景。

## 其余核对

- 操作级 Apply / Archive 分别解析真实协议，artifact 入口保持独立；Apply tasks 实际为 done / sourcePath / line，Archive 不强求不存在的 schemaName / template。路径、身份和进度检查按当前必要输入，不引入全历史 Ref 依赖。
- Owner Apply handoff、rejected 同阶段 revise 和明确较早阶段 rollback 各自有直接对象；新的目标 Author 必须重新审核并顺序继续，旧产物与 verdict 保留，不复活旧批准。
- Archive start 只准备；execute 重新检查当前批准 / Author / 完成任务，原生同步只由固定 CLI 承担。有限 attempt 输入只用于本次效果判断，不要求全库 hash。无效果入口问题之外，已确认效果的 finish、本地计数 → 终态 Run → manifest 顺序、部分提交幂等与 completed 重复读回有明确任务。
- 实际原生日期和安全编号路径、源与目标并存 / 多候选 / 未知响应停止、归档后 query 不调用旧活动 status、人工记录只读均落实。specs / tasks 明确产品故障与真实竞争验证，没有把 031 的实验单次调用当作恢复实现已获证明。
- tasks 1.1–1.3 在扩展前分离正在变化的职责，并将三目录前三名、明显增长与维护判断落入 AGENTS / Review Apply 方法；C / D proof 限定保留，新验收进入分组 tests，不再往旧实验堆叠。没有硬行数、容量或证据数量门槛。
- MODIFIED 需求沿用原场景，新增 Archive 专门规则说明通用提交 / 继续的例外。21 项任务均未实施；未改变产品代码或旧审核结论。

## 独立验证

| 命令 | 实际结果 |
|---|---|
| 固定 OpenSpec `validate apply-revision-and-native-archive --strict --json` | exit 0，valid=true、issues=[]；[结果](artifacts/strict-validate.json) |
| 固定 OpenSpec `instructions apply --change apply-revision-and-native-archive --json` | exit 0，state=ready、progress=0/21；只代表规划输入可用；[结果](artifacts/apply-inputs.json) |
| 固定 OpenSpec `instructions tasks --change apply-revision-and-native-archive --json` | exit 0，直接 specs / design 依赖 done；[结果](artifacts/tasks-instructions.json) |

独立复核现有写入锁 / 临时替换及 Run 创建边界以评估方案可实施性。沿用 031 的独立 proof 8/8、build / check 和仍适用的基线回归，不机械重跑 Explore。结构校验不能发现 RP-D-001 这样的恢复入口矛盾，不能代替语义批准。

## 交接

下一步为 Author revise-propose，仅修订 RP-D-001 涉及的设计 / delta / 任务并形成新的 Author 交接，保留 032 和本 verdict；之后独立补审变化及受影响边界。无需重做 030 / 031，也不提前进入 Apply。当前 Delivery 保持 open、累计归档数仍为 3；本轮未改方案正文或实现，未执行 Git、Archive、解锁或正式 Delivery 收口。
