---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: explore-project-entry-003
actionType: explore
role: author
run: "003"
status: completed
actionStatus: completed
result: proof-supported
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-explore/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/002-revise-delivery-open/run.md
---

# MVP-D01-A Explore：项目入口与最小 Delivery Open

## Owner 授权与边界

Owner 原始消息：

> owner 授权激活第一个 change，开始 explore，核心功能 proof 认证

Author 激活路线图 MVP-D01-A，对项目入口、固定外部 OpenSpec 接入、目标根与配置来源、最小 Delivery / Change 关联和 status / next 的核心疑点进行真实实验。本次只形成 Explore 与 proof 材料，完成后停在独立 Review Explore 前；不写正式 proposal / design / specs / tasks，不执行 Apply、Archive、Git、正式 Full Test 或 Close。

## 基准与当前事实

- [路线图 §6.1、MVP-D01-A](../../../../../../mendi-foundation-and-delivery-roadmap.md)：首项无依赖，目标为可运行 CLI、选定 OpenSpec 接入、最小 Delivery 关联及只读 status / next。
- [协作约定](../../../../../../AGENTS.md)：Author 与独立 Reviewer 分工，Explore 只验证关键疑点，正常修复继续当前 Run。
- [项目入口](../../../../../project.json) 与 [Delivery manifest](../../../../../delivery-groups/20261009-01-single-change-manual-collaboration/manifest.json)：D01 人工 Open；本次 Owner 指令推进至首项 Change，原 Git checkpoint 未执行，不作为激活前置。
- 固定入口：`D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js`；安装包 `@fission-ai/openspec@1.14.1`。
- 工程只有 [CLI 骨架](../../../../../../src/drivers/cli.ts)，没有产品操作；实验代码将放在受控 `scripts/proofs/`，与正式实现分开。
- OpenSpec 原生 `list --json` / `context --json` 确认 root 为 `D:\Projects\MenDi`、source 为 `nearest`；激活前无 Change / specs。
- 已通过固定 CLI 的 `new change project-entry-and-minimal-delivery-open --goal ... --json` 创建 `.openspec.yaml`；`status --change ... --json` 读回 `schemaName=spec-driven`、`mode=repo-local`。Proposal 为 ready，其余产物 blocked，均未编写；这不是 Explore 自动批准或已可 Apply。
- 扫描整个 Delivery 的实际 Run 得到 `001`、`002`，建立首个 `003-changes` 批次，其首个实际 Run 为 `003-explore`，批次不占号。

## 关键问题与实际判断

1. 在显式目标上调用固定 OpenSpec，能否读到正确的 root、Change 事实及项目 context / rules，并保留原文件？
2. 能否用最小 `.mendi/project.json` 和每 Delivery 一个 manifest 保存范围及关联，退出进程后读回？
3. 从错误目录、仅有目录的空项目或声明外部 store 的配置进入时，上游会怎样选根；MenDi 如何拒绝静默换根或写入？

这三项已由下述真实实验支持。主要发现是：固定 CLI 足以提供 repo-local Change 事实与 instructions；MenDi 仍须自行核对显式目标及配置，不能把上游命令成功当作本次目标正确或阶段已经批准。

## 推荐方案与范围

1. CLI 明确选择目标项目，适配器使用选定的外部 OpenSpec 绝对入口、参数数组与显式 `cwd`。首版按 Windows、OpenSpec 1.14.1、repo-local `spec-driven` 设计；不使用 PATH 上不明版本或 `@latest`。
2. 写前确认目标有明确的本地配置，检查 YAML、schema 与 `store` 声明，并核对上游 `root.path` / `source`。缺配置时明确报告准备或初始化步骤；不通过祖先根、默认 store 或隐式 `new change` 初始化去修正调用位置。
3. 最小项目记录引用每 Delivery 独立 manifest；manifest 保存 Delivery 范围、Change 关联及最小进度。Run 按已经确认的批次布局组织，正式编号与 Action writer 属于 MVP-D01-B。
4. status / next 同时展示本地协作状态与相关 OpenSpec 事实。上游 `proposal=ready` 只是产物图状态；当前 MenDi 仍需 Explore 和独立 Review，不据此自动执行 Propose 或 Apply。
5. 保留已有 AGENTS、README 和 OpenSpec 配置。实验的重复 Open 明确拒绝写入；正式实现须在 Propose 中约定已有项目记录和写入部分成功时的处理，不静默覆盖或伪报完整成功。

本次没有进入正式方案或产品实现。持久化实验采用两个文件写入，尚未证明崩溃原子性、并发安全或中断恢复；正式实现须保留可诊断的部分状态并明确冲突处理。实验借用固定工具安装中的 `yaml` 解析依赖；产品不能把这个实验接线默认为稳定公共 API，正式解析依赖在 Propose 中确定。OpenSpec 仍经公开 CLI 使用，不复制其内部实现。

## 核心 proof

目的：验证固定工具、目标定位与最小 Delivery 存储方案的核心可行性，以及会造成错误写入的边界。

输入与方法：使用受控夹具，在每次新建的 `.tmp/mvp-d01-a-explore-*` 目录中复制输入，运行真实 OpenSpec 和独立 Node 子进程。子进程的 XDG 配置 / 数据目录独立设置在本次实验目录，不修改宿主 store 注册表。实验脚本与必要输入保留在受控位置，正式输出放在本 Run 的 artifacts；运行不依赖旧 `.tmp` 内容，也没有清理整个 `.tmp`。

- [实验脚本](../../../../../../scripts/proofs/mvp-d01-a-explore.mjs)：仅为 Explore 原型，未接入正式 `src/` 或产品命令。
- [最小项目配置](../../../../../../tests/fixtures/minimal-project/openspec/config.yaml)、[已有配置](../../../../../../tests/fixtures/existing-openspec-project/openspec/config.yaml)、[store 声明夹具](../../../../../../tests/fixtures/declared-store-project/openspec/config.yaml)、[损坏配置夹具](../../../../../../tests/fixtures/invalid-openspec-project/openspec/config.yaml)。AGENTS 与 README 的 sentinel 文件同样属于受控输入。
- [当前完整结果](artifacts/attempt-002/report.json) 与 [31 次子进程原始命令 / 输出](artifacts/attempt-002/commands.json)。当前脚本 SHA-256 与报告 `scriptSha256` 一致，仅用于绑定本次实验代码，不要求全项目 hash。
- [首轮结果](artifacts/attempt-001/report.json) 与 [首轮原始输出](artifacts/attempt-001/commands.json) 原样保留：首轮执行当时的 6 项检查，随后为真实本地规格结构的配置优先级疑点补检查，形成当前完整的 8 项结果；不把首轮较少检查的 PASS 当作当前脚本结果。

实际命令（仓库根执行）：

```powershell
node scripts/proofs/mvp-d01-a-explore.mjs --output .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/003-explore/artifacts/attempt-002
```

重放须使用新的结果目录，例如 `attempt-003`；脚本拒绝覆盖已存在的结果目录。运行会从受控夹具新建自己的实验目标，不要求保留报告中那次 `.tmp` 目录。

环境：Windows，Node.js `v22.23.2`，OpenSpec `1.14.1`。当前完整实验退出码 `0`，**8 / 8 检查通过**。31 次子进程中 12 次预期拒绝返回非零，原始错误全部保留；没有将拒绝操作写成执行成功。

| proof | 方法与实际结果 | 支持的结论与限制 |
|---|---|---|
| P01 | 在新配置与已有配置目标实际执行 `list`、`new change`、`status`、`instructions proposal`；读到 `nearest`、`repo-local`、`spec-driven` 和各自的 context / rules sentinel | 固定公开 CLI 可用于本地接入并保留项目指导；新项目输入已准备 repo-local 配置，未声称验证未初始化项目的自动接入 |
| P02 | 独立进程执行实验 Open，再由另一进程读取两个持久文件并查询真实 Change；重复 Open 拒绝，目标快照不变 | Delivery 范围与 Change 关联可跨进程读回；`next=explore` 与上游 `proposal=ready` 分别展示。未实现独立 Review 或完整生命周期规则 |
| P03 | 从已有目标的子目录执行 `list`，实际返回父目标根；显式目标守卫返回 `local-config-missing`，写前后文件一致 | 不能把调用目录直接当作真实项目根，缺本地配置应先报告 |
| P04 | 目标仅有裸 `openspec/` 目录；上游实际返回 MenDi 仓库祖先根，实验拒绝且目标无新增文件 | 目录存在不证明目标已接入；不得静默采用祖先根写入 |
| P05 | config-only 目标声明未注册 store / YAML 损坏，上游分别返回 `no_registered_stores` / `invalid_store_pointer`；实验写前拒绝 | 真实错误应保留原因与来源，不自动注册 store 或改用其他根 |
| P06 | 比较两份正向夹具中的已有文件快照，AGENTS、README、配置字节一致；每次从夹具创建独立实验目录 | 关键输入受控，可重建实验。只证明本次 fresh sandbox，不是整个仓库空 `.tmp` 的正式交付验收 |
| P07 | 给两份负向目标增加真实 `openspec/changes/` 结构后，上游 `list` 反而退出 `0` 并返回本地 `nearest`；实验仍拒绝 store 声明和坏 YAML，文件不变 | `list` 成功不意味着配置有效或来源明确；本地模式需独立配置检查。未声称已实现合法 registered store 接入 |
| P08 | 实验遇到不存在的 Change / 其他 schema，分别返回 `change-not-found` / `unsupported-schema`，目标不变 | 关联和支持范围必须明确，不能静默接受未知 Change 或 schema |

源码依据为选定安装中的 `dist/core/root-selection.js`、`dist/core/artifact-graph/instruction-loader.js` 和 `dist/commands/workflow/new-change.js`，实际行为由上述原始命令输出验证。本次 proof 支持方案选择，不等同于正式 MenDi CLI 功能认证，也不代替独立 Reviewer 结论。

## 未决事项与验证限制

- 正式命令参数、字段协议、写入冲突和部分成功处理在 Propose 中确定；本次最小实验不提前冻结所有产品合同。
- 正式 CLI 尚未实现；原型只验证接入、配置拒绝、最小存储和查询。工具版本漂移、并发 / 崩溃、超时 / 中断、完整角色与阶段检查尚未验证。
- 未执行 Apply、Archive、正式 Full Test / Close、安装发行或跨平台验收；当前 Change 的 proposal / design / specs / tasks 均未编写。

## 交接

Author Explore 与核心 proof 已完成，当前提交可交独立 Reviewer 检查问题、推荐方案、真实实验与限制。`result=proof-supported` 是 Author 的证据结论，不是 Reviewer 的 `approved`；下一步为 `review-explore`，本次不创建 Reviewer Run 或切换角色。

Reviewer 重点核对 P03 / P04 的祖先根风险、P07 的配置优先级、P02 的跨进程读回与未证明的写入原子性，以及这些限制是否适合在 Propose 中进一步设计。Git checkpoint 未执行，HEAD 仍为 `1b3f2180b7d650def7be438caa6ec03944d4b415`；本次 Owner 授权激活 Change 不推导 Git 权限。

最终读回：[实际 Change list](artifacts/change-list.json) 仅有本 Change；[实际上游 status](artifacts/change-status.json) 仍为 proposal ready、其余产物 blocked，规划未完成。Node 核对 manifest、唯一 Change / 批次关联、实际 Run `001` 至 `003`、材料链接与当前脚本身份均通过；`git diff --check` 通过，暂存区为空，`src/`、`package.json` 和依赖锁文件无变更。工具实验与已确认记录足以提交 Explore 审核，不能据此越过 Review 或开始 Apply。
