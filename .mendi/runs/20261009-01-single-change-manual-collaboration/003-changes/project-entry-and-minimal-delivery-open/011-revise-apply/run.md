---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: revise-apply-project-entry-011
actionType: revise-apply
role: author
run: "011"
status: completed
actionStatus: completed
result: revision-verified
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/010-review-apply/run.md
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/009-apply/run.md
---

# MVP-D01-A Author Revise Apply

Owner 指令：`revise-apply`。依据独立 Review Apply 010 的 `changes-requested`，修订 RA-A-001 / P2：YAML 的 store / schema 循环值进入错误 details，使 CLI 在输出错误时再次崩溃。

沿用已批准的 Explore / Propose 及 009 的其他验证；本轮只修订配置拒绝分支和定向回归，不修改 001–010 的历史记录，不自签 Reviewer 批准。完成后交给独立 Review Apply，不执行 Archive、正式 Delivery Full Test 或 Git checkpoint / push。

## 修订与验证

- [project.ts](../../../../../../src/adapters/project.ts) 的 store / schema 拒绝错误只保存 `configPath` 与 `storeType` / `schemaType`，不把未经规范化的 YAML 值放进 details。错误码、配置拒绝规则、中文原因与修正提示保留；无需通用循环遍历或改变 CLI 协议。
- [cli.test.ts](../../../../../../tests/cli.test.ts) 增加 store / schema 自引用 × 人读 / JSON 四项回归。每项实际执行构建 CLI 的 `status` 和 `delivery open`，检查退出 1、输出渠道、错误码、配置路径、字段类型、修正提示及目标字节不变，且未创建 `.mendi`。
- 最小 YAML 直接保存在受控测试源码中；目标每次从 `tests/fixtures/minimal-project/` 重建，不依赖旧临时输入。

| 检查 | 实际结果 |
|---|---|
| 修订前构建 CLI 的新回归 | 4/4 失败，复现循环序列化异常；保留 [失败输出](artifacts/before-fix-tests.txt) 和 `before-fix/commands-*.jsonl` |
| 修订后定向回归 | 4/4 通过，实际 8 次 status / Open；见 [focused-tests](artifacts/focused-tests.txt) 及 `after-fix/commands-*.jsonl` |
| `node node_modules/typescript/bin/tsc` | 构建通过，见 [build.txt](artifacts/build.txt) |
| `pnpm typecheck` | src / scripts / tests 三份配置通过，见 [typecheck.txt](artifacts/typecheck.txt) |
| `node --test tests/project.test.ts tests/cli.test.ts` | 13/13 通过，无失败、无跳过；含新增四项及既有项目入口 / CLI 行为，见 [related-tests](artifacts/related-tests.txt) |

其余实现沿用 009 / 010 的检查结果，未机械重跑全部历史。16 项原任务保持完成；局部修订遵循现有 Supported local configuration 与 Honest command results，不改变 Explore / Propose、规格、设计或任务范围。本次检查不是正式 Delivery Full Test。

## 交接

RA-A-001 的复现与局部回归已由 Author 验证。当前 manifest、README 与 OpenSpec context 指向 011，停在再次独立 `review-apply`。010 的 `changes-requested` 保留，尚无新 Reviewer verdict；Reviewer 核对本次修订及必要证据后才能决定是否批准。

历史、Git、固定 OpenSpec 及只读产品 next 的最终核对结果见 [summary.json](artifacts/summary.json)。未执行 Archive、Git checkpoint / push、正式 Delivery Full Test、Close 或下一 Change。
