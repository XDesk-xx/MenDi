---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
actionId: review-apply-project-entry-012
actionType: review-apply
role: reviewer
run: "012"
status: completed
result: approved
date: 2026-10-09
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/011-revise-apply/run.md
---

# MVP-D01-A Review Apply

**verdict：approved。** 独立审核 [011-revise-apply](../011-revise-apply/run.md)，关闭 [010](../010-review-apply/run.md) 的 RA-A-001 / P2，无新增必须修订项。010 的其他审核结果仍适用，与本次局部补审共同支持当前实现通过 Review Apply。

## 修订核对

`src/adapters/project.ts` 的两处配置拒绝分支只输出 `configPath` 与 `storeType` / `schemaType` 字符串，YAML 循环值不会进入错误详情。拒绝规则、错误码、退出码和修正提示保持原语义；不需要通用对象遍历或修改方案。

完整阅读该文件和 `tests/cli.test.ts`，并复核 CLI catch、MendiError 与测试助手。四项新增测试使用受控源码中的自引用 YAML，实际调用构建后的 CLI，覆盖 store / schema × 人读 / JSON，每项分别执行 status 和 delivery open，共八次命令；检查错误协议、目标文件不变和未创建 `.mendi`。这足以关闭原发现。

## 独立验证

| 命令 | 结果 |
|---|---|
| `pnpm typecheck` | 退出 0，src / scripts / tests 三份配置通过 |
| `pnpm build` | 退出 0，随后回归使用本轮重新构建的 CLI |
| `node --test --test-name-pattern='自引用 YAML' tests/cli.test.ts` | 4/4 通过，无跳过；[输出](artifacts/focused-tests.txt) |
| `node --test tests/project.test.ts` | 5/5 通过，无跳过；[输出](artifacts/project-tests.txt) |
| `git diff --check` | 退出 0 |

本轮针对两文件修订及其错误输出路径；原实现全面检查和 27 项测试沿用 010，011 的其他相关回归及严格规格验证作为补充。未重做 Explore / Propose，也不将本轮验证称作正式 Delivery Full Test。

## Open Code Review delegate

使用 [delegate Skill](C:/Users/xuser/.codex/plugins/cache/open-code-review/open-code-review-codex/1.0.0/skills/open-code-review-delegate/SKILL.md)，执行 `ocr delegate preview --format json --exclude '.mendi/**,openspec/**,scripts/proofs/**'`，再对实际复核文件执行 `ocr delegate rule --format json <paths...>`。仅使用文件选择与规则解析，没有调用 OCR 外部模型；最终判断由本 Reviewer 给出。

preview 捕获工作区文件 112 个，排除 98 个，可审候选 14 个。Git 尚未记录原 Apply，因此候选包含 009 的旧实现；本次按 011 的修订范围审查。逐文件记录如下（status 为 preview 的 Git 状态）：

| path | status | 本轮处理 |
|---|---|---|
| package.json | modified | skipped：非 011 修订，沿用 010 |
| src/drivers/cli.ts | modified | reviewed：错误输出渠道与序列化 |
| tsconfig.json | modified | skipped：非 011 修订，沿用 010 |
| src/adapters/openspec.ts | added | skipped：非 011 修订，沿用 010 |
| src/adapters/paths.ts | added | skipped：非 011 修订，沿用 010 |
| src/adapters/project.ts | added | reviewed：两处修订及配置读取上下文 |
| src/adapters/workspace.ts | added | skipped：非 011 修订，沿用 010 |
| src/application/project.ts | added | skipped：非 011 修订，沿用 010 |
| src/core/errors.ts | added | reviewed：错误详情及默认提示 |
| src/core/records.ts | added | skipped：非 011 修订，沿用 010 |
| src/drivers/arguments.ts | added | skipped：非 011 修订，沿用 010 |
| tests/helpers.ts | added | reviewed：实际进程、夹具与目标保留断言 |
| tsconfig.scripts.json | added | skipped：非 011 修订，沿用 010 |
| tsconfig.tests.json | added | skipped：非 011 修订，沿用 010 |

候选统计：total_files=14，reviewed_files=4，skipped_files=10，coverage_rate=28.57%。这不是本轮修订覆盖率：`tests/cli.test.ts` 被 OCR 默认测试路径规则排除，已显式加入 rule 查询并独立审查；011 声明的两个修订文件均已覆盖（2/2）。规则中的 React / DOM 条目不适用当前 CLI，不据此制造修订任务。

## 交接

当前实现获批，下一步为 Author 在 Owner 指令下执行 Archive。当前交接材料指向本 Run；010 的原判定及 011 的 Author 记录保留。本轮未修改实现、历史 Run 或编号，不新增文件 hash 清单；未执行 Archive、正式 Delivery Full Test、Close、Git checkpoint / push 或下一 Change。
