---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: explore-proof-and-proposal-review
planningSlot: MVP-D01-C
actionId: explore-proof-and-proposal-review-explore-01
actionType: explore
role: author
status: completed
result: proof-supported
stageSkillRef: .agents/skills/openspec-explore/SKILL.md
nextAction: review-explore
nextRole: reviewer
---

# MVP-D01-C Explore

Owner 原始授权：`owner 授权激活下一个 change，开始 explore，核心功能 proof 认证`。

范围按路线图下一槽位 MVP-D01-C：Explore proof 与方案审核。本轮完成关键疑点实验及分析，停在独立 review-explore；不自动 Propose 或修改产品实现。

固定 OpenSpec 1.14.1 已确认本项目 nearest root，原活动 Change 为空，并实际 scaffold `explore-proof-and-proposal-review`。全 Delivery 原 Run 为 001–022；本次占号 023，复用 003-changes，保留 manual-bootstrap 记录身份。累计完成数仍为 2。

## 当前结论

Author Explore 与关键 proof 已完成，结果 `proof-supported`；当前可交独立 Reviewer，未提供本 Change 的 verdict。详细分析与建议见 [explore.md](../../../../../../openspec/changes/explore-proof-and-proposal-review/explore.md)。

1. 新会话中同一实际操作者沿用稳定 actor 可继续；真正换操作者、放弃 draft 或 rejected 后恢复需要明确 Owner 决策及新工作记录。P03 证明当前没有 rejected 后普通恢复入口，不能手改旧 verdict 或借 actor 标签绕过独立性。
2. 有锁时必须区分活跃写者、指针提交前的未关联 draft，以及已提交但报告失败。P05 的原 manifest 未变，P06 的实际 Run 已为 submitted / complete；后者不能当成可重提的 draft。仅 pid 不足以判断锁归属，未验证安全解除锁命令。
3. 当前 save 与 submit 都依赖上游 status。P07 / P08 的隔离候选表明草稿保存可保留本地配置、当前 draft、身份、路径、锁和读回检查而不调用上游；正式 submit / Review 校验仍保持，产品实现未变。
4. 公开 instructions 确实提供目标 context / rules、instruction、template 和依赖；当前 Action 只返回方法指导，不能声称已消费完整阶段输入。后续 Propose 需明确最小接线，Agent 写作及独立语义审核不能由文件齐备或工具成功代替。

## 实际输入与方法

- 已全文核对主规格 `project-entry`、`delivery-workspace`、`action-runs` 及场景，检查当前 application、Run / 写入 adapter 和产品阶段方法。D01-B 的既有实现、020 / 021 批准仍为基准，不修改 001–022 Run 或旧 verdict。
- 实际读取上游 `.agents/skills/openspec-explore/SKILL.md`、产品 `skills/actions/explore/SKILL.md` 与 `skills/tools/openspec/SKILL.md`。Owner 明确要求 proof，实验代码仅为受控探索脚本；没有修改 `src/`、产品 Skills 或主规格。
- 当前上游 proposal instructions 已读取，但未编写 proposal。原始 [初始 instructions](artifacts/upstream-instructions.json) 留存激活时尚未更新的 context；[当前 instructions](artifacts/upstream-instructions-current.json) 已反映 C 的活动状态。项目当前没有 proposal rules，P01 在既有受控目标验证真实非空 rules，不编造本项目规则。

## 核心 proof

目的：为 D01-C 的阶段输入、继续 / 异常处理与草稿保存建议提供真实依据，包含一次修改要求和一次 rejected，不提前完成全部产品验收。

方法：[TypeScript 实验脚本](../../../../../../scripts/proofs/mvp-d01-c-explore.ts) 从既有 `minimal-project` 与 `delivery-scope.json` 创建新目标，使用真实固定 OpenSpec scaffold、真实 MenDi CLI Open / bind / Action / Run / query。临时执行目录每次重建，不承载唯一输入或正式证据。Node.js `v22.23.2`，固定上游 1.14.1；最终结果 **8/8**，**44 次子进程调用**。

```powershell
pnpm build
node scripts/proofs/mvp-d01-c-explore.ts --output .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/explore-proof-and-proposal-review/023-explore/artifacts/proof-003
pnpm check
node --test tests/action-write.test.ts tests/action-cli.test.ts tests/query.test.ts
```

重放必须使用新的输出目录，例如 proof-004；脚本拒绝覆盖旧输出。原始 [commands.json](artifacts/proof-003/commands.json) 和 [report.json](artifacts/proof-003/report.json) 保存实际 stdout / stderr、退出码、上游故障注入结果、错误观察，以及 P05 / P06 的原始 manifest / Run / lock / 临时文件内容。删除临时沙盒也能读到关键现场，不依赖旧环境。

| proof | 真实观察 | 限制 |
|---|---|---|
| P01 | 实际公开 instructions、非空目标 context / proposal rules、template / instruction，以及所选阶段 / 工具方法可读；Action 仍为 draft | sentinel 证明输入传递，不证明 Agent 已完成语义写作 |
| P02 | 新进程同 actor 继续同 actionId；不同 actor 继续 / 保存拒绝，旧 submitted / continuing Run 字节不变 | actor 仅是标签，不认证真实人或授权他人接管 |
| P03 | changes-requested → 新 revise-explore；后续 rejected → Owner；普通 start / continue 拒绝，旧两份 verdict 字节不变 | 同一实验程序构造 Author / Reviewer 夹具，不是本 Change 的独立审核 |
| P04 | 活跃子进程持独占锁，query / 第二写者拒绝；原锁保留，原写者正常释放后可查 | 未实现抢锁、解除或通用恢复 |
| P05 | 指针提交前注入失败，manifest 原字节未变；新 draft、锁和临时 manifest 保留，query 拒绝 | 不能把已写 draft 当有效当前关联；未测试所有掉电点 |
| P06 | 提交替换之后注入失败，子进程已退出；实际 submitted / complete，锁保留，query / 重提拒绝 | 不以非零退出推断未提交，未验证人工安全解除 |
| P07 | version / list 为真实上游，仅 status 通过 ProcessRunner 注入故障；现有 save / submit 拒绝且 draft 未变，隔离候选可保存本地 draft | 候选只存在于 proof 脚本，不是产品离线保存能力 |
| P08 | 候选拒绝错 actor / role、陈旧 / 缺失 Run、缺正文 / 配置、越界引用 / 矛盾 binding、锁和已提交；Review 可存草稿但正式提交仍因缺固定 Author 拒绝 | 不放宽正式提交、继续或审核前置；沿用 B 的其余路径 / junction 回归 |

初次 [proof-001](artifacts/proof-001/report.json) 在 P01 因实验断言误用 `save-or-submit` 而失败（实际字段为 `run-save-or-submit`），尚未通过实验；正常修正后 [proof-002](artifacts/proof-002/report.json) 8/8。随后增加原始现场保存、本地配置与更精确的越界拒绝观察，最终 proof-003 8/8。保留早期结果，本次检查 / 修复未另建 Run，产品代码没有为实验结果而修改。

## 工程检查与沿用

- `pnpm build` 退出 0，真实 CLI 实验使用当前源码构建产物。
- [check.txt](artifacts/check.txt)：`pnpm check` 退出 0；格式、lint 覆盖 32 个维护中 TypeScript 文件，源码 / 脚本 / 测试类型检查通过。
- [related-regression.txt](artifacts/related-regression.txt)：现有 Action 写入、跨进程 CLI 与查询相关回归 **27/27**，退出 0；包括角色 / 当前输入 / 固定 Author、并发 / 中断 / 重提，以及历史 / 未知 Ref、归档后查询和越界 / junction。
- 未改产品源码，D01-B 其他仍适用的已受审结果沿用；没有机械重跑全套旧 proof，未执行正式 Delivery Full Test。新结果没有 scriptSha256、全量 hash 或额外 gate；实验中的字节比较保留。

## Propose 待明确与交接

Propose 需明确 Explore / Propose 所需 instructions 的最小入口、返回字段与 Agent 消费方式；划清本地草稿保存和正式提交的输入；确定最小 Owner 决策、只读锁诊断及必要显式解除的可处置状态和记录字段。真实 Owner 处置入口尚未实现或验证，不以手改当前记录恢复；Archive 部分失败、规格同步与 Apply 接线仍归 D01-D。

独立 Reviewer 重点核对 P01 的输入传递 / 语义工作区别、P03 的夹具 verdict / 实际会话独立性、P05 / P06 的提交判别、P07 / P08 的候选 / 产品边界，以及建议是否受路线图授权范围约束。可靠旧结果可以沿用，只补变化部分。

当前交接仅指向本 Author Run，`next=review-explore`、`role=reviewer`；当前 Change 尚未形成 Propose 四产物，累计完成数仍为 2。未执行 Git 写入、Archive、正式 Delivery Full Test / Close、下一 Change 激活、可选工具安装或 `.tmp` 删除。

最终 [handoff-readback.json](artifacts/handoff-readback.json) 确认真实 MenDi status / next 成功，当前为 C、人工来源、`review-explore / reviewer / executable:false`，直接 Author 输入为本 Run。实际编号 001–023 无重复 / 空占号，下一号 024；上游 proposal ready、其余规划产物 blocked、isPlanningComplete=false。读回时上述 10 个直接材料链接均可定位，累计完成数仍为 2。[最终 instructions](artifacts/upstream-instructions-final.json) 已包含完成后的当前 context；查询读回不替代独立审核。
