---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: review-propose-project-entry-008
actionType: review-propose
role: reviewer
run: "008"
status: completed
actionStatus: completed
result: approved
date: 2026-10-09
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/007-review-explore/run.md
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/006-propose/run.md
exploreReviewRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/007-review-explore/run.md
---

# MVP-D01-A 独立 Review Propose

**verdict：approved。** 现有 [006-propose](../006-propose/run.md) 的方案、两份规格、设计和任务可作为本 Change 后续实施基准。未发现阻断实施的方案问题，无需新增 Author 方案修订 Run。本次停在方案审核边界，等待 Author 的后续 Apply 指令；批准本身不执行 Apply。

本次独立 Reviewer 沿用 Owner 指定角色，主会话保持 Author。仅在 008 保存本次审核，未修改既有 Run、规划正文或实现，也没有 Git 写操作。

## 输入、授权与发生顺序

Owner 本次修复指令第 3 项允许在 005 补审批准且方案无需调整时继续审核现有 006。[007-review-explore](../007-review-explore/run.md) 已批准 005 并确认补审不要求调整方案，因此本次直接审核原有材料，不重建方案或新增 Author Run。

真实顺序保留为 006 先行编写方案 → 007 补审 005 → 008 审核 006。006 及规划中的旧交接叙述保留当时事实；本轮以 007、008 和当前交接入口为准，不追认此前流程已完整。复用 007 的 TypeScript 审核，不再重复类型检查或全部 Explore。

## 审核范围与结论依据

逐份阅读 [proposal](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/proposal.md)、[design](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/design.md)、[project-entry spec](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/specs/project-entry/spec.md)、[delivery-workspace spec](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/specs/delivery-workspace/spec.md) 和 [tasks](../../../../../../openspec/changes/project-entry-and-minimal-delivery-open/tasks.md)，对照根路线图 MVP-D01-A、实际 CLI 骨架、人工 project / manifest 结构及 AGENTS。

| 核对项 | 判断与实施接线 |
|---|---|
| 范围与产物一致性 | proposal 的两个 capability 与两份 delta specs 一致。实现可运行入口、首次 Delivery、首个已有 Change 关联和查询，符合 MVP-D01-A；Action / Run 写入、阶段引擎、多 Delivery / Change、Close / Reopen 继续留给后续范围。16 项任务均未勾选，没有把 proof 完成作为产品完成。 |
| 固定工具与目标定位 | 显式 `--project`、本地配置优先检查、固定 1.14.1、root realpath/source、repo-local/schema 校验形成一致拒绝路径。保留原 AGENTS、README、配置和 Change 文件；不从 PATH 自动切换或安装工具。任务 1.2–1.4 覆盖正常接入及上游异常。 |
| 协议与错误行为 | design 要求外部 JSON 先作为 `unknown` 再校验；超时、信号、非零、坏 JSON、缺字段和进程错误不转为正常业务状态。该设计已覆盖 007 指出的 proof 类型断言限制。YAML 采用独立直接依赖，未将 proof 借用上游模块的方式作为产品合同。 |
| 持久记录与关联 | version 1 字段、范围依赖、ID 和受管引用、项目 / manifest 身份一致性均有设计；Open 仅限 `.mendi` 不存在，bind 仅限产品 open 且未有关联。manual-bootstrap 明确只读，未版本化未知格式拒绝。任务 2.1–3.3、4.2–4.3 有对应检查。 |
| 并发和部分提交 | 首次 Open 的独占 mkdir、后续独占锁、bind 取得锁后重读前置、同目录临时文件 / rename、project 最后提交与读回形成可实施方案。读回或锁释放失败保持非零并标明已提交路径；不承诺两文件原子事务，不自动删除残留或抢锁。任务 2.3、3.2 覆盖竞争、替换失败、残留锁及提交前后故障。 |
| 查询、历史与阶段 | status / next 共享只读解释，上游 readiness 与本地阶段分离；人工记录只展示来源及引用，不代签批准。当前真实人工字段可由该只读分支表示；产品 bind 不改历史，查询不分配 Run 或推进阶段。绑定 Change 消失、受管引用越界与坏记录均拒绝。 |
| 验证与交付边界 | 使用真实固定 OpenSpec 与受控夹具；故障替身仅用于难稳定触发的异常。增加 tests 的真实 noEmit 类型检查，产品 build 保持 src → dist。新增产品集成验证不是 Delivery Full Test，也不以任务勾选或上游 planning complete 替代 Reviewer。 |

设计已经处理 004 所要求的状态冲突、部分写入和正式 YAML 依赖，没有把 Explore 未证明的能力写成既成事实。实施中的具体解析器和失败清理仍需依任务验证；这些是已明确的实现验收事项，不构成此次方案修订要求。

## 独立验证

- 固定入口 `D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js` 执行 `validate project-entry-and-minimal-delivery-open --strict`，退出 0，见 [validation.txt](artifacts/validation.txt)。
- 同入口 `status --change project-entry-and-minimal-delivery-open --json` 退出 0，当前根为 MenDi、`actionContext.mode=repo-local`、`schemaName=spec-driven`，proposal/specs/design/tasks 均 done，见 [planning-status.json](artifacts/planning-status.json)。`isPlanningComplete` 仅证明产物齐备，语义判断由本 Reviewer 完成。
- 对照当前固定安装的 `dist/core/project-config.js` 中 `resolveConfigFilePath`（约 485–494 行），确认 `config.yaml` 优先、仅不存在时考虑 `config.yml`；规划新增 `.yml` 行为与实际选定工具的配置选择一致。
- 实际 `src/drivers/cli.ts` 仍只输出骨架说明；16 项实现任务均未勾选。复用 007 已核验的 TS 迁移和 proof，不重复运行原型，也不把旧 proof 当作产品实现验收。

## 覆盖、发现与交接

使用 `open-code-review-delegate`，OCR 仅负责选择和规则解析，规划语义由本 Reviewer 独立审查。五份 Markdown 被 OCR 默认按扩展名排除，本次明确全部人工审阅，范围覆盖率 100%。工作区 preview 中其他机器文件逐项记为 skipped 并说明复用或范围原因；没有把本次方案审核宣称为全工作区审核。准确计数、逐项清单及五份实际输入的绑定见 [coverage.json](artifacts/coverage.json)，原始选择与规则见 [ocr-preview.json](artifacts/ocr-preview.json)、[ocr-rules.json](artifacts/ocr-rules.json)。

阻断 findings：无。需要方案修订：否。

由主会话同步当前入口：方案已获独立批准，下一候选阶段为 Author Apply，等待后续明确指令。008 不执行 Apply、Archive、Git checkpoint / push、Delivery Full Test / Close，也不改变 006 编号或重写其历史记录。
