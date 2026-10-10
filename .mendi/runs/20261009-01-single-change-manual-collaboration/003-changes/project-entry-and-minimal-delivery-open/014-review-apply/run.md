---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
actionId: review-apply-project-entry-014
actionType: review-apply
role: reviewer
run: "014"
status: completed
result: approved
date: 2026-10-09
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/013-revise-apply/run.md
---

# MVP-D01-A Review Apply

**verdict：approved。** 独立补审 [013-revise-apply](../013-revise-apply/run.md) 的引用边界、人工归档查询兼容、工程检查及对应方案 / 规格 / 任务修订。没有必须先修订的发现；保留一项非阻断 P3 人读提示问题。当前实现可以进入另行触发的 Archive，012 的原批准与旧 Run 保持历史语义。

## 审核判断

- `checkReferences` 的递归后缀扫描已移除。查询只实际读取项目入口、当前 manifest 与当前活动 Change；历史说明缺失、非路径值、未知嵌套 Ref 和旧 Delivery manifest 不存在不再增加存在性依赖。必要身份及 binding 路径安全校验仍在，没有新增引用注册表、证据图或 hash gate。
- 人工 archived binding 明确校验归档日期布局、Change 身份与非活动状态。清空 activeChangeId 后不执行该 Change 的上游 status；缺少旧活动目录仍能读取本地记录。该查询不验证归档目录内容，也不证明实际 Archive 已完成。产品写入范围仍不支持修改人工记录。
- 阅读全部 9 个 src 文件及测试助手，重点完整复核新增查询测试、记录解析与写入路径。格式展开后未发现新的职责层或错误处理机制；既有锁、独占创建、替换失败及配置循环值拒绝行为继续由回归覆盖。
- Biome 精确版本为 2.5.15，package / lock / 实际安装一致。检查只包含维护中 TypeScript，受控 fixtures 被排除，typecheck 仍覆盖 src / scripts / tests；没有文件行数限制。check 是开发命令，没有进入产品查询前置。
- 新 proof 报告构造已去掉 scriptSha256，013 的新报告也未含该字段。保留测试 / 实验内的文件未变比较；原 proof 重放 8/8 沿用 013，不把它当作产品归档验收。
- 已核对更新后的 proposal、design、两份 specs 与 20 项 tasks；修订符合 Owner 指定范围，不要求重新完整 Explore / Propose。

## 独立验证

| 检查 | 结果 |
|---|---|
| `pnpm check` | 退出 0；format / lint 各检查 20 文件，三份 TypeScript 配置通过；[输出](artifacts/check.txt) |
| `pnpm test` | 包含重新 build，34/34 通过，无失败或跳过；[输出](artifacts/tests.txt) |
| 固定 OpenSpec 1.14.1 `validate project-entry-and-minimal-delivery-open --strict` | 通过 |
| 向 `biome lint --stdin-file-path=src/review-probe.ts` 输入 `debugger;` | 退出 1，未写入源码 |
| `biome format tests/fixtures/store-writer.ts --no-errors-on-unmatched` | 检查 0 文件、未修复，确认该夹具被排除 |
| `git diff --check` | 通过 |

新查询回归同时覆盖活动输入缺失、历史说明失效、越界 junction、矛盾归档记录和真实 CLI 只读行为；上游调用 spy 确认归档场景仅调用 version / list。上述是本 Change 的开发回归，不是正式 Delivery Full Test。

## 非阻断发现

**RA-A-002 / P3：人读输出把无活动 Change 显示成“尚未关联”。** 位置：`src/drivers/cli.ts:33`。在本轮 fresh 回归生成的 archive-handoff 夹具上执行实际构建 CLI 的 `status`，manifest 已是 archived binding 且 activeChangeId=null，输出仍为 `Change：尚未关联`，见 [实际输出](artifacts/archive-human.txt)。JSON 正确保留 archived binding，查询和下一步不受影响，因此不阻断本次批准。以后调整该展示时，区分“尚未关联”与“当前无活动 Change / 已归档”，并补人读断言；不要求为此单独建立修订 Run。

## OCR delegate 覆盖

沿用 [Open Code Review delegate Skill](C:/Users/xuser/.codex/plugins/cache/open-code-review/open-code-review-codex/1.0.0/skills/open-code-review-delegate/SKILL.md)，执行 preview 与逐文件 rule 查询，不调用 OCR 外部模型。preview 使用排除项 `.mendi/**,openspec/**,scripts/proofs/**`，捕获工作区 130 文件、候选 15 文件；Git 基线仍为最初骨架，候选不等同于 013 的独立差异。tracked 文件读取 diff，untracked 候选读取当前内容，对照本会话先前审核及 013 的范围判断。

| path | status | 处理 |
|---|---|---|
| package.json | modified | reviewed |
| src/drivers/cli.ts | modified | reviewed |
| tsconfig.json | modified | reviewed |
| biome.json | added | reviewed |
| src/adapters/openspec.ts | added | reviewed |
| src/adapters/paths.ts | added | reviewed |
| src/adapters/project.ts | added | reviewed |
| src/adapters/workspace.ts | added | reviewed |
| src/application/project.ts | added | reviewed |
| src/core/errors.ts | added | reviewed |
| src/core/records.ts | added | reviewed |
| src/drivers/arguments.ts | added | reviewed |
| tests/helpers.ts | added | reviewed |
| tsconfig.scripts.json | added | reviewed |
| tsconfig.tests.json | added | reviewed |

候选 total_files=15、reviewed_files=15、skipped_files=0、coverage_rate=100%。另外显式复核默认排除的 tests/query.test.ts，以及 proof 报告调整、锁文件、规划材料、README 和当前交接；不声称重新全文审核所有历史或全部被排除文件。React / DOM 等不适用规则不转成任务。

## 交接

当前交接指向 014 批准与 Author 输入 013，下一步由 Author 根据 Owner 指令执行 Archive。归档时应如实记录实际归档位置、archived binding 并清空该活动 Change，再读回；本轮夹具验证不能替代真实归档结果。

Reviewer 未修改实现、历史 Run 或编号，没有新增 hash 清单。未执行当前 Change Archive、Git checkpoint / push、正式 Delivery Full Test、Close 或下一 Change。
