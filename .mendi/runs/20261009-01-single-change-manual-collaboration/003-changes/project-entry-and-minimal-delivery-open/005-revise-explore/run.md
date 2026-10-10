---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: revise-explore-project-entry-005
actionType: revise-explore
role: author
run: "005"
status: completed
actionStatus: completed
result: proof-supported
date: 2026-10-09
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/004-review-explore/run.md
---

# Explore proof TypeScript 修订

Owner 本次指令：

> 先修改为 ts，不要用 mjs，写进 agents.md，然后 propose

本次采纳 Reviewer Run 004 的非阻断建议 RE-A-001，将已交接的实验脚本迁移为 TypeScript，并增加真正的类型检查。保留 Author Run 003、Reviewer Run 004 及各自输出；新建本修订记录，随后按 Owner 指令进入 Author Propose。未把新脚本声明为已经独立审核。

## 修改与依据

- 当前维护入口为 [mvp-d01-a-explore.ts](../../../../../../scripts/proofs/mvp-d01-a-explore.ts)。补充子进程结果、上游 JSON 读回、实验项目 / Delivery 结构、检查结果及快照的类型，异常使用 `unknown`；保留 P01–P08 的实验目的和执行语义。
- [AGENTS.md](../../../../../../AGENTS.md) 规定项目维护的实现、测试、构建及 proof 脚本使用 `.ts`，不使用 `.mjs`，并纳入真正的类型检查。上游与生成输出保持原格式。
- [tsconfig.scripts.json](../../../../../../tsconfig.scripts.json) 独立覆盖 `scripts/**/*.ts`，继承严格模式，启用 `erasableSyntaxOnly`、`verbatimModuleSyntax` 和 `noEmit`。`pnpm typecheck` 同时检查产品源码与脚本；`pnpm typecheck:scripts` 可单独检查脚本。产品 `build` 的输入与输出布局保持原样。
- 当前 Node 22.23.2 原生运行 `.ts`，不新增 runner 依赖。Node 原生类型擦除不执行类型检查，因此静态检查与真实运行分别验证，依据 [Node 官方说明](https://nodejs.org/docs/latest-v22.x/api/typescript.html)。
- 历史脚本逐字节保存为 [pre-migration-source.txt](artifacts/pre-migration-source.txt)，SHA-256 为 `a287d9b86e6785e3b8d5e28099256dda18140534b560feaa06e5acf54d36b7f1`。Run 003 / 004 中的旧 `.mjs` 链接和原始命令属于历史路径，迁移映射以本记录为准；旧 PASS 继续绑定旧源码，未重新赋给新脚本。

## 实际验证

1. `pnpm typecheck`：PASS，分别执行源码 `tsc --noEmit` 与脚本 `tsc -p tsconfig.scripts.json`；没有使用 `@ts-nocheck` 或省略脚本检查。
2. 仓库根实际执行：

```powershell
node scripts/proofs/mvp-d01-a-explore.ts --output .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/005-revise-explore/artifacts/replay-001
```

退出码 0，P01–P08 全部通过。[新报告](artifacts/replay-001/report.json) 的 `scriptRef` 和 `scriptSha256` 绑定当前 `.ts`；[原始命令输出](artifacts/replay-001/commands.json) 包含 31 次子进程，其中 12 次为预期拒绝。实验重新复制受控夹具并创建 fresh sandbox，未依赖旧实验目录。

3. 核对原 Run 001–004 全部文件的修订前后字节：一致；旧结果及 verdict 未改写。迁移仅改变当前脚本与工程检查配置，没有正式 CLI 实现。

类型标注约束实验内部数据与调用，但 JSON 类型断言不是正式产品的运行时协议验证；产品解析须在方案中设计独立检查。原有并发、两文件提交、完整生命周期等限制继续成立。此记录为 Author 定向验证，不代替 Reviewer 对修订的审核；Owner 已明确要求接续 Propose，新方案会引用旧批准与本次新结果并分别说明其身份。
