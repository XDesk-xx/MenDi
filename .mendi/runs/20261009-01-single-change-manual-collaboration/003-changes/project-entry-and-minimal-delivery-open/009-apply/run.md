---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: apply-project-entry-009
actionType: apply
role: author
run: "009"
status: completed
actionStatus: completed
result: implementation-verified
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/008-review-propose/run.md
---

# MVP-D01-A Author Apply

Owner 本次指令：`apply`。007 已补审批准 TS 修订，008 已独立批准 006 方案；据此实施同一 Change 的 16 项任务，停在独立 Review Apply。

使用固定 OpenSpec 1.14.1 的 apply instructions 和原任务位置；当前 root 为 MenDi，repo-local、spec-driven，初始 0/16。阶段 Skill 为 openspec-apply-change，增量实施与 security-and-hardening 指引用于定向验证、边界输入检查及 shell-free 工具接线。Git 提交、正式 Full Test、Archive、更多 Change 与 Reviewer verdict 不在本次执行范围。

## 实现

- [CLI](../../../../../../src/drivers/cli.ts) 与参数解析提供 `delivery open`、`change bind`、`status`、`next`、帮助及 `--json`。项目和 scope 的相对路径基准明确，未知 / 重复参数拒绝。
- [项目适配器](../../../../../../src/adapters/project.ts) 在上游操作前核对显式规范根、本地 YAML、store / schema；只在主配置不存在时选择 `.yml`。原 AGENTS、README、配置与 Change 文件保留。
- [OpenSpec 适配器](../../../../../../src/adapters/openspec.ts) 经公开 CLI 使用固定 1.14.1，核对实际入口、root / source、Change 身份、schema / mode 和必要 JSON 结构；异常保留实际进程信息，不借用上游内部解析依赖。
- [领域记录](../../../../../../src/core/records.ts) 保存 version 1 项目、范围与首个 Change 关联；检查唯一槽位、依赖、记录身份和协议。ID 拒绝越界路径及 Windows 保留名称。
- [存储适配器](../../../../../../src/adapters/workspace.ts) 独占首次目录和写锁，manifest 先写、project 最后提交；更新同目录临时文件再 rename，不先删原文件。失败保留已提交路径和残留，查询识别不完整状态 / 锁，不自动清理或抢占。
- [Application](../../../../../../src/application/project.ts) 在写前验证业务和上游事实，bind 在取锁前拒绝已知冲突，取锁后再次核对；status / next 共用只读投影，区分本地阶段与上游 readiness。当前人工 bootstrap 保留全部交接字段，只读兼容。
- 直接安装并锁定 `yaml@2.9.1`。源码、脚本、测试均纳入 `pnpm typecheck`；TypeScript `rewriteRelativeImportExtensions` 使原生 `.ts` 测试和 src → dist 的 `.js` 输出同时成立，build 不把脚本 / 测试编入 dist。工程与命令说明见 [README](../../../../../../README.md)。

实现只覆盖批准的首次 Delivery / 首个 Change；产品不生成 Action、Run、审核结论或额外批次，不执行初始化、Git 或后续生命周期。

## 验证与必要输入

必要脚本和夹具在 `scripts/`、`tests/`，输出在本 Run 的 [verification-001](artifacts/verification-001/summary.json)。测试每次创建 fresh sandbox，从受控输入重建目标；必要范围保存到 manifest 后删除测试目标的原 scope 文件，查询仍成立。新目标夹具没有 `.tmp`，未依赖旧临时输入，也未清理整个宿主 `.tmp`。

| 实际检查 | 结果与证据 |
|---|---|
| `pnpm install --frozen-lockfile` | PASS；精确 YAML 依赖已锁定，不安装额外 OpenSpec / runner |
| `pnpm typecheck` | PASS；源码、脚本、测试三份配置，见 [typecheck.txt](artifacts/verification-001/typecheck.txt) |
| `pnpm test`（先执行 `pnpm build`） | PASS；27/27、fail 0、skip 0，见 [tests.txt](artifacts/verification-001/tests.txt)，仅 src 输出到 dist |
| 真实外部工具与跨进程命令链 | PASS；新项目 / 已有规则、含空格路径、Open 同时关联 / 后续 bind、status / next、重复 Open / bind 拒绝；原始命令 stdout / stderr 在 verification-001 的 `commands-<pid>.jsonl` |
| 真实两个写进程竞争 | PASS；第二个 Open / bind 拒绝，原锁保留，释放后第一个结果可读回 |
| 运行时错误边界 | PASS；坏 JSON / 缺字段、版本 / root / schema 不符、启动 / 超时 / 信号 / 非零退出通过受控 runner；写入 / 读回 / 锁释放 / rename 失败通过定向注入或 mock，与真实接入测试区分 |
| 原文档、范围和只读状态 | PASS；查询与拒绝操作前后文件快照一致；scope 删除后范围可读；人工交接字段保留，人工 bind 在写前拒绝；越界与外部 junction 拒绝 |
| 历史与 Git 边界 | Run 001–008 的 33 个文件字节与 Apply 前一致；`git diff --check` 通过；HEAD 仍为 8cea0c9，暂存区为空 |
| 最终交接读回 | 固定 OpenSpec [apply-status](artifacts/verification-001/apply-status.json) 为 16/16、all_done，strict validate 通过；产品 [status](artifacts/verification-001/workspace-status.json) / [next](artifacts/verification-001/workspace-next.json) 一致指向独立 review-apply，查询前后 `.mendi` 文件快照相同；原始命令见 [handoff-commands](artifacts/verification-001/handoff-commands.json) |

必要夹具见 [Delivery scope](../../../../../../tests/fixtures/delivery-scope.json)、[人工记录输入](../../../../../../tests/fixtures/manual-bootstrap-records.json) 与 [并发子进程](../../../../../../tests/fixtures/store-writer.ts)。人工 fixture 明确是测试输入，不作为实际 Reviewer 批准。超时 / 进程错误的替身不冒充真实超时验收。

实现接线核对了 [Node 文件 API](https://nodejs.org/docs/latest-v22.x/api/fs.html) 与 [YAML 公开 API](https://eemeli.org/yaml/)；实际 Windows rename 故障语义由定向测试验证。没有将两文件提交宣称为单一事务或断电耐久保障。

## 限制与交接

16 项任务按固定 OpenSpec 返回的位置逐项核对并完成；最终 `instructions apply` 读回 all_done。这是 Author 实施与验证结论，不是 Reviewer approved。停在独立 `review-apply`，Reviewer 输入为本 Run、产品 diff、规格 / 设计、测试和新结果。

本次按现有人工协作方式更新 manifest、README 与 OpenSpec context：绑定为 `awaiting-review-apply`，latest Run 为 009，next 由独立 Reviewer 接手。产品查询保留 `source:manual-bootstrap`、`executable:false`；这些人工交接更新不作为产品阶段写入能力的证据，007 / 008 的批准仍仅覆盖原 Explore / Propose。

重点审核受管路径 / 配置来源、未知数据运行时检查、首次创建权与锁的失败处理、已提交但未完整成功的错误报告，以及人工状态只读 / readiness 分离。首版不提供多 Delivery / Change、阶段引擎、Run 编号、自动恢复或 Close / Reopen。未执行 Archive、正式 Delivery Full Test、发行安装、Git checkpoint / push；没有激活下一 Change。
