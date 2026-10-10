---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: action-runs-and-role-handoff
planningSlot: MVP-D01-B
actionId: action-runs-and-role-handoff-explore-01
actionType: explore
role: author
status: completed
result: proof-supported
stageSkillRef: .agents/skills/openspec-explore/SKILL.md
nextAction: review-explore
nextRole: reviewer
---

# MVP-D01-B Explore

Owner 原始授权：`owner 授权激活下一个 change，开始 explore，核心功能 proof 认证`。

范围按已 Open Delivery 的下一未完成槽位 MVP-D01-B：Action 编排、Runs 与角色交接。保持 Author；核心 proof 与分析完成后停在独立 review-explore。

全 Delivery 实际 Run 为 001–015，下一号为 016；复用 003-changes 批次，批次不另占号。MVP-D01-A 已归档，保留其原编号、记录与 verdict。

## 基准与实际激活

- 上一 Change 的 [015-archive](../../project-entry-and-minimal-delivery-open/015-archive/run.md) 已记录真实归档；本地 checkpoint 为 `8a702ff9f85c1b7a944e27ef32bd95198554880c`。相关已生效规格为 `openspec/specs/project-entry/spec.md` 与 `openspec/specs/delivery-workspace/spec.md`。
- 固定 OpenSpec `1.14.1` 的 `list --json` 返回本项目 `nearest` 根，激活前没有活动 Change；`new change action-runs-and-role-handoff` 创建 `.openspec.yaml`，未手工搭建 Change 根。
- 保留 `manual-bootstrap` 身份，仅人工添加 B 的 binding、复用批次并设置当前交接；产品 bind 仍按 A 的批准边界拒绝人工记录和第二次关联。本轮没有修改 `src/` 或冒称产品 Action 已实现。
- 原 001–015 Run 与 verdict 未修改，累计完成数仍为 1。当前新 Change 尚未归档，不能算第 002 个已完成 Change。

## 关键疑点与推荐方向

1. **轻量 Action 如何跨进程继续？** 推荐在 Run 的结构化头部保存 `actionId`、类型、角色、状态与阶段 Skill。当前 Run 提交可表示进展仍未完成；完成后再继续必须明确区分正常下一 Action 与实质修订，不能继续覆盖已提交内容。隔离 proof 已验证同一 Action 两个提交及跨进程读回，不需要另建 Action 目录、请求 DSL 或独立编排平台。
2. **编号如何跨 Change 连续？** 分配时核对整个 Delivery 的 Run 目录，Changes 批次前缀不另占号。使用独占写入保护分配；已占号但没有完整 Run 的目录保留并报告，不复用、不自动清理。proof 支持此方向，未证明任意崩溃点的完整恢复。
3. **Action 怎样选方法？** 类型和角色确定阶段 Skill，读取实际 Skill 内容再交 Agent；仅按路径名称选中并不等于方法已经执行。proof 只采样 Explore 和 Review Explore：Author 使用当前上游 Explore Skill，Reviewer 使用受控实验指导。产品阶段 Skill 的落点与轻量内容在 Propose 明确；完整 Explore / Propose 语义链属于 D01-C。
4. **审核消费什么？** 必须有明确、同 Delivery / Change、已完成的当前 Author 提交，审核结果记录直接 `authorRunRef` 与 verdict。不能从 OpenSpec ready 或工具 PASS 推得 approved。真实独立性由 Owner 指定的会话角色保证；`actor` 字符串仅为隔离实验标签，不能视为身份认证机制。
5. **必要引用与说明如何区分？** 查询只读取当前状态实际需要的记录；必要当前材料缺失只阻止依赖它的操作。旧方案、历史说明、未知 Ref 不递归读取，不引入引用注册中心或依赖图。Action 开始或审核显式读取所需 Skill、Author 提交时检查存在性、受管边界和身份。

## 操作实际消费的输入

这是 Explore 对依赖的划分；具体字段、命令和错误协议留待 Propose 确定。

| 操作 | 必要输入与用途 | 不作为前置的说明 |
|---|---|---|
| 现有 status / next | 本地配置、固定工具、project、当前 manifest；有活动 Change 时读其路径和上游 status | 历史 Run、旧审核、旧方案、未知 Ref；查询不分配 Run 或执行 Action |
| Action 开始 / 继续 | 明确项目 / Delivery / Change、当前 Action 身份与角色、实际选中的阶段 Skill、当前未完成进展 | 无关历史说明；不能仅从上游 readiness 决定阶段完成 |
| Run 分配 / 提交 | Delivery 内实际已占号目录、受管写入位置与锁；待提交记录及当前 Action | 只因字段名带 Ref 而遍历的任意材料；旧已提交正文不参与改写 |
| Review 提交 | 当前完整 Author Run、相同身份和阶段、Reviewer 角色、明确 verdict；按风险查看其中实际提交的材料 | 无关历史链接；工具结果不替代人工 verdict |

编号扫描读取的是实际存储布局，不是追溯链接或全历史证据内容认证。proof 原型为简化实验，会检查当前 Change 的既有 Action 头部以拒绝已完成 / 旧 Action 继续；正式实现必须在 Propose 明确当前输入边界，不能把这段原型直接变成每次查询解析全部历史的产品规则。

## 核心 proof

目的：用真实子进程和文件提交证明轻量 Action / Run 方案可跨进程交接，并核对会导致错误交接的边界。

输入与方法：[TypeScript 原型](../../../../../../scripts/proofs/mvp-d01-b-explore.ts)，当前真实上游 `.agents/skills/openspec-explore/SKILL.md`，及 [Reviewer 实验指导](../../../../../../tests/fixtures/action-handoff/reviewer-skill.md)。原型不接入产品 CLI；每轮创建新的 `.tmp/mvp-d01-b-explore-*` 沙盒，复制必要 Skill 输入，设置跨 Delivery 操作和旧 Change 的占号样例，由独立 Node 子进程保存 / 读取实验 Run。临时目录可丢弃，正式脚本、夹具与结果均受控；不依赖过去沙盒。

```powershell
node scripts/proofs/mvp-d01-b-explore.ts --output .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/action-runs-and-role-handoff/016-explore/artifacts/proof-002
pnpm check
node --test tests/query.test.ts tests/records.test.ts
```

重放使用新的输出目录，例如 `proof-003`；已有结果不可覆盖。Node.js `v22.23.2`，当前完整结果为 **8/8**，20 次子进程调用，其中 12 次预期拒绝退出 1，其余 8 次退出 0。原始 [commands.json](artifacts/proof-002/commands.json) 和 [report.json](artifacts/proof-002/report.json) 保留实际输出。

| proof | 实际方法与观察 | 支持的判断 / 限制 |
|---|---|---|
| P01 | 历史占号 001、002、015 分布在同 Delivery 不同操作 / Change；新 Explore 分配 016，实际读取 Author Skill | 批次不占号，类型 / 角色确定实际 Skill；不是完整 Skill 语义执行认证 |
| P02 | 另一子进程以同 actionId 提交 017，继续状态变为 complete；再用新进程读回两份，016 字节不变 | 同 Action 可多 Run，提交不可覆盖，进展与完成分开 |
| P03 | 错角色、错阶段 Skill、重复预期编号 017、完成后的同 Action 继续分别拒绝 | 角色 / 类型 / 方法及编号一致性必要；不证明全部阶段合法转换 |
| P04 | 缺失 Author 文件、未完成 Author 016、未指定 Author、同 actor 自签分别拒绝；独立实验 Reviewer 018 明确关联 Author 017，跨进程读回 | 审核依赖当前提交；实验 approved 仅为夹具输出，不是本项目审核 |
| P05 | 已提交 Run 内历史 missing-old.md 和未知 nestedRef 指向 ../outside，读取仍成功，未读取说明目标 | 说明不能仅因 Ref 命名成为必要输入 |
| P06 | 实际读取的 Run 路径越界被既有 managedPath 拒绝，错误 Change 身份的 Run 被拒绝 | 保留边界与身份检查；本轮没有补做所有 symlink / junction 攻击实验，沿用 A 的相关回归 |
| P07 | 当前选中的 Skill 缺失拒绝；019 空占号目录保留，后续分配 020 并回报 incompleteReservations | 必要 Skill 缺失与说明失效不同；空目录保留不等于恢复成功 |
| P08 | 父进程实际持有独占写入锁，子进程新写被 EEXIST 拒绝；原锁内容保留，没有 021 目录 | 不抢锁、不覆盖占用；未验证所有并发与崩溃时序 |

准备时首次因输出父目录未建立而 ENOENT，尚未进入实验；原因与正常修复记录在 [preparation-attempt.txt](artifacts/preparation-attempt.txt)。[proof-001](artifacts/proof-001/report.json) 保存较早 7/7 与 19 次调用；随后增补 P08，并调整原型错误输出为稳定错误代码，生成新的 proof-002。没有改写早期结果或新建检查 Run。

## 基础检查与沿用结果

- [check.txt](artifacts/check.txt)：`pnpm check` 退出 0；格式 / lint 覆盖 21 个维护中 TypeScript 文件，源码、脚本、测试三个类型检查通过。
- [related-regression.txt](artifacts/related-regression.txt)：当前实际执行查询与记录的 **9/9** 回归，含必要输入缺失、历史 / 未知 Ref、越界 / junction、身份矛盾及归档后查询，退出 0。
- A 的受审产品实现仍为基准；本次没有修改源码，未机械重跑全部历史 proof / 回归。无新增 hash 清单或 hash gate；旧证据保持原样，文件未变实验用字节比较。

## Propose 需确定与当前限制

- 明确产品 Action 开始、继续、保存、提交、查询的命令及字段，draft 与已提交 Run 的边界，当前状态从哪里读、写入顺序及中断现场如何报告。原型只演示提交快照，没有实现 draft 编辑或 Run / manifest 多文件提交一致性。
- 明确产品阶段 Skill 的最小清单与角色规则，工具指导按需选择，不能用原型中的 Reviewer 夹具代替产品方法；不建立通用 Skill 注册中心或请求 DSL。
- 明确 Reviewer 当前 Author 输入的定位规则、同阶段修订的旧批准处理，以及 verdict 到 next 的最小映射。原型只采样一组 Author / Reviewer，不证明多阶段回退、Reviewer 自身多 Run 继续或完整权限控制。
- 人工 bootstrap 查询和原历史继续保留，不能将本轮人工激活伪装成已实现第二 Change 产品激活。产品写路径是否继续仅接受 product 记录，必须在方案明说，不强制迁移人工旧记录。
- 本 Change 实施涉及查询展示时，顺带区分“尚未关联”和“已归档、当前无活动 Change”；此前非阻断提示不在 Explore 中直接修复。

## 交接

Author Explore 与关键 proof 已完成，结论 `proof-supported`，可交独立 Reviewer 评估范围、必要输入划分、推荐方案及实验限制。没有 Reviewer verdict，不自动 Propose / Apply；proposal、design、delta specs、tasks 尚未编写，上游 proposal ready 仅表示可以编写。

Reviewer 重点核对 P02 的进展 / 完成区别、P04 的直接 Author 关联与会话独立性、P05 的说明边界、P07 / P08 的占号和写入冲突，以及上述未证明部分是否可留待 Propose 明确。当前交接只指向本 Run；不继承 A 的整条历史引用链。

本次没有 Git 操作、Archive、正式 Delivery Full Test / Close、下一 Change 激活或可选工具安装。

最终读回保存在 `artifacts/handoff-readback.json`：实际 Run 为 001–016，无重复编号；当前批次包含 A 与 B，累计完成数仍为 1。真实 MenDi status / next 均成功，当前为 B、`next=review-explore`、`role=reviewer`、`executable=false`；固定上游 list 仅有 B，proposal ready，其余规划产物 blocked。本 Run 的 9 个直接材料链接均可定位。当前状态已可交独立 Reviewer，不把该读回当作审核批准。
