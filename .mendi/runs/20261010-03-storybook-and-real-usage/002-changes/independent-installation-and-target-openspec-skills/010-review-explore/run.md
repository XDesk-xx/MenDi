---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-review-explore-01
actionType: review-explore
role: reviewer
run: "010"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: propose
nextRole: author
date: 2026-10-11
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/009-explore/run.md
---

# MVP-D03-B Review Explore

**verdict：approved，无阻断发现。** 固定独立审核 [009 Explore](../009-explore/run.md)，按项目 Review Explore 方法核对当前路线图范围、真实安装与目标方法 proof。探索足以支持 Propose；批准的是结论与边界，不表示目标方法读取已接入产品或 B 已验收。未修改 Author 材料、实现、历史 Run 或 verdict。

## 重点审核

| 重点 | 结论与证据边界 |
| --- | --- |
| 稳定安装与随包 Skills | 独立重跑 prepare：实际 tsc、pnpm pack、开发仓库外离线安装成功；从安装模块加载自有 Apply / Storybook 正文。安装目录为 `D:/tools/mendi/proofs/d03-b-009/independent-010`，不是开发源码链接。使用已有 store，仅证明已准备环境下独立安装与定位可行，不认证冷安装、最终发布方式或其他平台。 |
| 目标与 cwd | 两个新目标经固定 OpenSpec 1.14.1 初始化，目标官方方法的位置各自不同；生成标记为 generatedBy 1.14.1、方法 version 1.0。独立从 beta cwd 指定 alpha 启动，返回自有方法来自安装根，Run 实际写入 alpha，beta 与安装根没有对应误写。安装代码、自有方法、目标上游方法与外部 CLI 的三处定位有真实证据。 |
| 目标方法候选与产品缺口 | 独立重放候选缺文件、错基线、错身份及空正文拒绝；原 manifest 未变。沿用 009 的 EISDIR 不可读实验及限制，不把它称作 ACL 认证。独立确认当前产品在 beta 目标 Explore 方法缺失时仍分配 Run，输出没有 upstream；这支持新增接线的必要性，不能将候选成功当成产品已满足写入前失败。 |
| 必要输入与查询 | 独立移走本次安装的自有 Explore 方法后，start 返回 skill-unavailable，原 manifest、已有 Delivery Open Run 内容及 Run 目录条目不变，next 仍成功。无关 sync 方法缺失时，目标 Explore 候选和 next 可用；009 的 continue 失败保留 submitted Run / manifest 也有直接日志与断言。Propose 应复用这类窄边界，不把六份方法、历史说明或未知 Ref 全部变成前置。 |
| 已有 Change 的 Propose | 核对真实官方 propose 正文、逐项 instructions、保存的四类产物、strict validate 与 list / Apply instructions。产物落实目标离线、本地 notes/、无网络约束；只有一个 local-note-work，实施任务未勾选。方法适用片段与动态 instructions 可用于已有 Change；不能从头重复 new，也不能以 update-change 替代首次缺失产物创建。该实验不是根 B 的正式 Propose。 |
| pnpm 入口及执行环境 | 新 proof 的 pack / install 沿用 pnpmEntry；实际 UI results 场景仍写死本机路径，与 MENDI_UI_PNPM_BIN 不一致，009 未声称已修复。旧失败日志确认根 build 在 UI 严格依赖环境下被拒绝；冻结刷新成功不证明该差异已解决。直接 tsc 构建与离线安装成功只支持当前实验，不推广为所有工程入口一致；正式方案需要说明根工程与目标执行环境职责。 |
| 文档收敛与按影响验证 | 009 的详细过程保存在 Run，根 Change 仍为 scaffold，没有新建 explore.md。路线图已将文档、pnpm 与新方法接线纳入 B；补充建议仅作为规划输入，有效决策应收敛到根路线图及本 Change 正式产物。只补本次接线风险，沿用 A / 既有 Archive 的有效结论，不重做全部旧 proof 或把整套 UI 变成所有小改动的门槛。 |

## 独立验证

- `node scripts/proofs/mvp-d03-b-explore.ts <本 Run artifacts/independent-010 的绝对路径> prepare`：exit 0，真实构建 / 打包 / 离线安装、两个目标生成 / Open / bind、包内方法和目标方法读回通过。命令与输出见 [independent-010](artifacts/independent-010/)，实际位置见 [session](artifacts/independent-010/session.json)。只在新安装和新沙箱实验，没有迁移根 manual-bootstrap。
- 通过 Node 标准库调用本次已安装 CLI，定向核对跨 cwd、缺必要自有方法、查询不加载方法、目标方法产品缺口，并调用实际读取候选核对负例。见 [独立摘要](artifacts/independent-010/review-summary.json) 与同目录 review / review2 原始命令输出。
- Reviewer 首次断言误认为 Open 后不存在 `.mendi/runs`；实际已有合法 `001-delivery-open`。核对后改用既有 Run 内容、目录条目和 manifest 前后比较，相关拒绝与读回通过。原失败不是产品缺陷；保留第一次命令输出，修正说明在独立摘要中。
- `pnpm check`：exit 0，format / lint 各 131 文件、三个真实 TypeScript 配置通过，见 [check.log](artifacts/check.log)。未改产品源码，不重复执行整套 UI 或旧生命周期测试。

## Propose 收敛事项（非阻断）

1. 按实际阶段确定必要方法与最小“来源 + 基线 + 内容”返回方式，落实 start / continue 写入前失败和旧 Run 兼容；普通查询、保存与诊断不新增无关方法前置。Reviewer 保持自有独立审核，Archive 保持既有原生一次同步路径，不增加状态机或持久方法注册表。
2. 统一已选 pnpm 入口，明确根工程准备与目标严格执行预检的分工；不要把 UI 环境直接扩成根工程通用门槛，也不要静默关闭目标依赖检查来换取通过。具体入口修复与回归放在 Apply。
3. README / context 收敛为入口和必要背景，过程从当前 Run 定位；按本次影响选择工程与 UI 验证。旧材料缺失只影响真正依赖它的操作，不追补全部历史，不新增 hash、行数、证据数量或覆盖率 gate。

上述事项是既有 B 范围在正式方案中的收敛，不要求另建 revise-explore。生成标记不是文件未修改证明；本地修改的方法不能被称作未修改官方文件，不为此增加全量 hash。未认证多布局 / 多版本 / WebCodex、冷安装、Vue、MCP 或 C 的真实组合交付。

下一步为 Author Propose；本轮不生成根方案、不实施、不归档、不执行 Git 或正式 Full Test / Close。D03 保持 open / manual-bootstrap，A archived、B active、C 未激活，累计归档仍为 8；next 仅指向本次审核入口。
