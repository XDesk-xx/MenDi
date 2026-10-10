---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
batchId: 003-changes
actionId: apply-revision-and-native-archive-propose-01
actionType: propose
role: author
run: "032"
status: completed
result: planning-ready-for-review
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/031-review-explore/run.md
nextAction: review-propose
nextRole: reviewer
---

# MVP-D01-D Author Propose

Owner 指令 `propose`；[031 独立 Review Explore](../031-review-explore/run.md) 已批准 [030 Author Explore](../030-explore/run.md)。本轮保持 Author，沿用可靠且仍适用的受审 proof 与维护判断，完成当前方案后停在独立 Review Propose；没有本阶段 Reviewer verdict。

## 已完成产物与决策

- [proposal](../../../../../../openspec/changes/apply-revision-and-native-archive/proposal.md)：Apply 操作指引、Owner 处置、原生 Archive 与本地收口及维护范围。
- [design](../../../../../../openspec/changes/apply-revision-and-native-archive/design.md)：操作协议、显式较早阶段回退、归档调用状态、真实效果 / 日期、有序本地提交、查询和职责分离。
- 三份 delta：[action-runs](../../../../../../openspec/changes/apply-revision-and-native-archive/specs/action-runs/spec.md)、[delivery-workspace](../../../../../../openspec/changes/apply-revision-and-native-archive/specs/delivery-workspace/spec.md)、[project-entry](../../../../../../openspec/changes/apply-revision-and-native-archive/specs/project-entry/spec.md)。共 15 requirements、56 scenarios，5 MODIFIED 完整保留原场景标题，10 ADDED；主规格尚未同步。
- [tasks](../../../../../../openspec/changes/apply-revision-and-native-archive/tasks.md)：21 项，全部未勾；按依赖分组，每组带自身必要测试和方法文档，最后只做综合验证与 Author 交接。当前 Change 实际归档属于未计入任务进度的后续授权边界。

操作指引采用 Apply / Archive 各自真实协议，不把 operation 当 artifact。Owner handoff / rejected revise 扩展到 Apply；主动回退创建目标阶段新 Author 修订，重新独立审核并顺序继续，旧 verdict 和实现不撤销。

Archive 准备不执行原生或增加计数；显式 execute 记录调用标记后走固定原生同步归档。真实效果确认后 finish 仅本地收口；未知现场停止，无效果才允许重新核对输入后的显式 execute。无效果 Archive 需要改方案时可以显式 Owner rollback，不能复活过去批准。编号使用真实原生日期与项目累计 ordinal，部分提交后不重复增长、不改已提交 Run。查询区分过渡与完成，不调用移走 Change 的旧 status；完成需计数 / 终态 Run / binding 一致。

扩展前按真实职责分离指引 / Owner 处置，新增产品测试按场景分组；维护观察不设硬行数或 hash gate。旧 C / D proof 保留限定范围，新验收不能继续堆入旧实验。

## 实际依据与验证

- 固定 OpenSpec 1.14.1 的 list / status / 各 artifact instructions 与直接依赖已读回，按依赖顺序形成材料；design 适用于本次跨模块与写入边界。实际命令、退出和 stdout / stderr 见 [commands.json](artifacts/commands.json)。
- [validation.json](artifacts/validation.json)：当前 Change `validate --strict --json` 退出 0，valid=true、issues=[]。结构校验不替代方案语义批准或产品验收。
- [artifact-assessment.json](artifacts/artifact-assessment.json)：六个具体产物存在、三项能力对应、所有 MODIFIED 原场景标题保留，21 项待实施，没有新增 Change explore.md。
- [apply-inputs.json](artifacts/apply-inputs.json)：只读核对真实字段 done / sourcePath / line 和任务跟踪，progress=0/21、state=ready。读取指引不启动 Apply。
- 沿用 030 最终 proof、031 独立 proof 8/8（52 次调用）及 check / build、030 相关回归 32/32：当前未修改 src、tests、scripts 或产品方法。这些只证明未变化基线；D04 的实验候选 EISDIR、单次原生调用不是本次产品 finish / 并发验收，任务 4 / 5 明确补真实产品路径。

本轮后段修正了任务字段名称及“终态 Run 已写、manifest 尚未收口”的表述，未改变既定方案边界。最终指引 / 校验和真实 status / next 读回见 [handoff-readback.json](artifacts/handoff-readback.json)，它核对规划齐备与任务未实施，保留人工 next 来源，不把上游 readiness 当批准。

## 独立 Review Propose 交接

Author 结果为 planning-ready-for-review；当前 next=review-propose、role=reviewer，交接只携带本 Run 的直接 Author 输入。

Reviewer 重点核对：真实 operation 字段与路径约束；Owner 回退的直接目标和重新审核；Archive 调用前标记、无效果 / 未知判定和 local-only finish；真实日期 / ordinal 及计数、终态 Run、manifest 部分提交的幂等边界；原生效果 / 同步内容读回是否足够而未发展为通用恢复；职责分离和每组测试 / 文档能否覆盖 031 的限制。

历史 001–031 的 Run、编号与 verdict 保留；累计归档数仍为 3，当前仍是 D。未执行 Apply、当前 Change Archive、Owner 控制操作、解锁、Git、`.tmp` 清理、正式 Delivery Full Test / Close / Reopen 或下一 Change 激活。
