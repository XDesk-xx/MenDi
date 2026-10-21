---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: reduce-redundant-proof-inputs-and-artifacts
planningSlot: MVP-D05-C
batchId: 002-changes
actionId: reduce-redundant-proof-inputs-and-artifacts-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "029"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: d05-c-proposal-approved-for-apply
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/028-propose/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/reduce-redundant-proof-inputs-and-artifacts/028-propose/run.md
---

# MVP-D05-C 独立 Review Propose（固定 028 Author）

**verdict：approved，限本 Change 现行 Propose 进入 Apply；没有本阶段阻断 Finding。** 固定 [028 Author Propose](../028-propose/run.md)，对照 [027 独立 Review Explore approved](../027-review-explore/run.md)、026 真实 Proof、根路线图 §7 D05-C 与当前源码。Author 的 Proposal、Design、两份 delta specs 和 14 项未开始 Tasks 已核对；不把 OpenSpec strict 通过、任务文件齐备或 Actor 文字当成独立批准。

## 决策已明确且合同一致

1. **真实空日志选择：保留双物理文件。** `proposal.md:9`、`design.md:15–19`、`specs/test-execution/spec.md:21–23,43–56`、`tasks.md:18–19` 一致要求现行 formatVersion=1 的 `stdout.log/stderr.log` 真实保存，即使内容为 0B；不能将丢失/ENOENT 推断为合法 empty，更不允许因历史 passed 而恢复假 PASS。当前 `src/application/test-execution.ts:85–93` 确实预创建两份日志、`src/adapters/test-store.ts:110–150` 真实双文件读回。027 Reviewer 受控实测 0B stdout `passed → unknown/ENOENT → restored passed`，足以支持**保留当前协议、暂不改动生产生成/读回**这一安全最小设计。不强行要求为节省少量 0B 文件新增版本和全链路 empty 状态机。
2. **有限 opt-in single-source collector。** `proposal.md:10–12`、`design.md:21–37`、`specs/action-runs/spec.md:23–47` 规定一次受控采集会话中每个**真实直接原件**只留一个必要副本，后续摘要使用可以核查的受管路径/来源身份及真实命令/结果。不同执行即使 stdout 文本相同也不能按内容去重；脚本/fixture 可复建的输入保存真实入口和参数，不能把即将删除的 `.tmp/runtime` 当长期唯一输入。
3. **现有调用点真实可操作。** Reviewer 核对 `tests/helpers.ts:20–47` 现有命令 JSONL 原 stdout/stderr、`tests/test-support.ts:101–120` 当前场景对 result + 双日志的重复嵌入、`tests/group-support.ts:60–135` 对 Group Run/report/log 的原文复写和受控复制。该三处分别由 `tasks.md:11–14` 的真实正负例覆盖，且针对 `MENDI_TEST_EVIDENCE_DIR` / `MENDI_APPLY_EVIDENCE` 开启/关闭 opt-in 设计；无需引入产品全局数据库或全面换写所有旧 collector。
4. **真正的临时源生存期和失败完整性。** `design.md:25–31,43–49` 和 `tasks.md:5–7,11–13,18–21,25` 要求在临时原件清理**之前**仅保存必要真实字节一次，或明确 incomplete 并保留现场；路径越界、权限失败、源文件读取中变更/中断必须 fail-closed。真实 failed、blocked、not-run、interrupted、unknown、清理未确认、锁及原始日志仍须可定位，不能因目录变小/缺 report 而伪造成功。
5. **正式 groups-v1 和历史绝对边界。** `specs/test-execution/spec.md:25–39,58–72`、`specs/action-runs/spec.md:49–58` 及 `tasks.md:16–21` 均禁止更动正式子执行/回执、组 request/report/events/cleanup 所需原件与已提交 D01–D05-B 的历史、verdict、日志；仅减少**未来 opt-in 额外场景证据副本**。D04-B 014 历史实际 114 request / 107 report，缺失 7 项实际 not-run/interrupted/unknown，绝不能依据样本省略新正式报告。与根路线图不设体积/文件数量 gate、一份可信原件和唯一必要输入保护的 Owner 已定方向一致。

## Reviewer 独立核对及真实工具证据

Reviewer 新建 [reviewer-proof.ts](artifacts/reviewer-proof.ts) 和 [tsconfig.json](artifacts/tsconfig.json)，独立读取**当前**固定 Author/027、Proposal/Design/两份 Specs/14 Tasks、现行三个 opt-in fixture 入口和生产双日志/组读回代码，并核对 027 已保存的实际空日志、历史 group 归类和日志异常回归：
- **8/8 组语义 crosswalk 通过**，每组保留现行文件/行号与必要原句，机器证据 [proof-results.json](artifacts/proof-results.json)。这是**方案/源码静态合同交叉核对**，没有伪称新的去重辅助已经实现。
- Reviewer **独立实际运行**固定 OpenSpec 1.14.1 `validate reduce-redundant-proof-inputs-and-artifacts --strict --json`：**exit 0、1/1 valid、0 issues**；原命令、完整 stdout/stderr 在 [openspec-validation.json](artifacts/openspec-validation.json)，不只是采信 028 Author 的结构校验摘要。
- Reviewer 自有 TypeScript proof 经 `node node_modules/typescript/bin/tsc -p <029 artifacts/tsconfig.json>` 的**严格 TS 检查 exit 0、无诊断**，原命令与 stdout/stderr 在 [typecheck-results.json](artifacts/typecheck-results.json)；`git diff --check` exit 0。未执行 Author Propose 写入指引、产品 Apply 或旧历史修改。

## Apply 的真实验收重点及非阻断边界

- **单源不得变死链。** 在每个选定 opt-in recorder 上以实际受控来源 identity 验证唯一原件只保存一次，第二处提供可读引用；真正要删除的隔离目标，先成功持久保存必要字节且读回一致，否则报 incomplete、保留相关现场。不能靠只保留 success 摘要、假链接、移动文件后忘记保存原始错误或不受管理的临时原件声称降量成功。
- **内容相同不等于同一次执行。** 两次独立执行、不同 group/child 的报告各具身份；无 opt-in 的正常路径不额外落证。实际 TestExecution 双物理日志和 groups-v1 的 request/result/report/cleanup/日志仍由现有正式 product 逻辑保存、读回，不允许 collector 复写、删除或省略。需运行 `tasks.md:1.3,2.1–2.3,3.1–3.4,4.1–4.3` 所列真实负例（失败/unknown/取消、缺 report、越界、写入中断、历史兼容、跨进程读取）。
- **阶段规范与自动采集范围不要混淆。** `action-runs` 的未来阶段证据单源约定是 Skills / Author / Reviewer 工作规范；本 Change 的**自动去重软件**只落实在经选择启用的有限测试/Proof collector，不能在 Apply 中突然扩展为所有历史 Run 强制重写或新增全局前置，也不能称“所有未来路径已由统一引擎强制保障”。这是本方案已经陈述的范围边界，不需要以此重开 Owner 决策或添加广泛架构。
- 不以 P01 的 5,623 文件、353 零字节等**测量时点历史统计**或本轮新收集文件数设置硬性通过/失败门槛；对减少多少只记录真实观测。若产生实质上无法保留失败原件/改变正式执行协议的新需求，再按实际影响处理，而非以这次 Propose 的 approved 直接扩大授权。

## 交接与停止

**下一步：`apply / author / awaiting-instruction`。** 现行 028 Proposal/Design/两份 Specs/14 Tasks 足以实施首版最小方案，不需要进一步 Owner 问卷；任务仍处于未开始而非已通过实现。Review 029 不更改 028、027、026、任何历史 verdict、产品实现或以前 D05-A/B Archive。根仍 manual-bootstrap；本 Reviewer 只新建 029 独立 Review Propose Run/artifacts，并更新现有 manifest 交接。没有执行 Apply、Archive、根 D05 正式 Full Test、Close、Git 提交/Push、稳定安装或 DreMo 写入。
