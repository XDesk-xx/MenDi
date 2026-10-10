---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: propose-project-entry-006
actionType: propose
role: author
run: "006"
status: completed
actionStatus: completed
result: planning-ready
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-propose/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/005-revise-explore/run.md
reviewInputRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/004-review-explore/run.md
---

# MVP-D01-A Author Propose

## 指令与阶段输入

Owner 本次原始消息：

> 先修改为 ts，不要用 mjs，写进 agents.md，然后 propose

前序 [Review Explore Run 004](../004-review-explore/run.md) 已独立重放并 `approved`，允许 Author Propose。先在 [修订 Run 005](../005-revise-explore/run.md) 采纳 RE-A-001：迁移 `.ts`、加入脚本类型检查、生成新 proof，未改旧证据或批准。此修订尚未独立审核，作为本次方案审核的并列输入，不将旧批准转记到新源码。

使用 [openspec-propose Skill](../../../../../../.agents/skills/openspec-propose/SKILL.md) 为已经激活的同一 Change 生成产物，不新建 Change。固定 `list` / `context` / `status` 读回实际目标 `D:\Projects\MenDi`，`nearest`、repo-local、`spec-driven`；`list --specs --json` 为无主规格。按 proposal → specs / design → tasks 读取公开 instructions 与依赖文件，遵守当前项目 context。产品源码仅为骨架的事实已经核对。

## 产物与决策

- [proposal.md](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/proposal.md)：MVP-D01-A 的目的、可运行入口、持久关联与影响。
- [project-entry spec](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/specs/project-entry/spec.md)：目标根、配置检查、固定工具、真实结果与拒绝行为。
- [delivery-workspace spec](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/specs/delivery-workspace/spec.md)：首次 Open、首个 Change、冲突 / 部分状态、只读查询及人工 bootstrap 兼容。
- [design.md](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/design.md)：命令参数、version 1 字段、YAML 直接依赖、项目入口最后提交、独占锁与单文件替换、next 来源及验证接线。
- [tasks.md](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/tasks.md)：16 项未勾选实施 / 验证任务，分组内包含对应检查与文档；后续生命周期以非跟踪条目列明。

按首项 Change 的最小范围，产品首次 Open 拒绝任何已有 `.mendi/`；支持 Open 同时或之后关联首个既有 Change，尚不支持第二个 Delivery / Change。当前人工历史可只读查询，产品写命令不迁移或覆盖它。多 Delivery、阶段推进、Run 编号、Close / Reopen 仍由后续 Change 按路线图实现。

Reviewer 要求明确的三个问题已落入设计与任务：已有状态冲突；两文件部分提交及锁残留诊断；正式 `yaml@2.9.1` 公开依赖。当前未安装该依赖。类型检查、原生 Node 执行及公开 YAML API 的官方依据链接保存在 design / Run 005 中。

## 实际检查与限制

- `pnpm typecheck`：退出 0，产品源码与 `scripts/**/*.ts` 均检查；迁移重放 8/8、31 次子进程和 12 次预期拒绝见 Run 005 原始输出。
- 固定 OpenSpec `validate project-entry-and-minimal-delivery-open --strict`：退出 0，见 [实际校验输出](artifacts/validation.txt)。两份规格 capability 与 proposal 一致，全部新增 requirements 有规范场景。
- 固定 `status --change ... --json`：所有四类产物 done，`isPlanningComplete=true`，见 [实际规划状态](artifacts/planning-status.json)。上游 `isComplete=true` 是该规划图的完成状态，不是产品已实现、任务完成或 Reviewer 批准。
- 新材料引用、Run 连续编号与原 Run 001–004 字节保留经定向核对；`git diff --check` 通过。产品 `src/`、主 `tsconfig.json` 和锁文件保持原状；只按 Owner 明确指令迁移 proof、更新 AGENTS 和脚本检查入口。

本次不运行正式产品集成验收或 Delivery Full Test，没有 Apply、Archive、Git 提交 / push 或新 Change 激活。方案里的并发与部分写入处理是待实现设计，不把实验两文件可读回作为其验收。

## 审核交接

停在独立 `review-propose`，保持 Author。Reviewer 同时检查 Run 005 的新 TypeScript proof、工程检查入口及本次五个规划文件。重点核对最小范围、人工记录只读兼容、锁与提交点的错误路径，以及上游 readiness 与本地阶段分离。独立批准和后续 Apply 指令到位后才实施。
