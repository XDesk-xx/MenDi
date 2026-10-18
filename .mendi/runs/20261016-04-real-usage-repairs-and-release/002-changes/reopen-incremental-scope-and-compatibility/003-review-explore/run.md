---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: reopen-incremental-scope-and-compatibility
planningSlot: MVP-D04-A
batchId: 002-changes
actionId: reopen-incremental-scope-and-compatibility-review-explore-01
actionType: review-explore
role: reviewer
actor: codex-independent-reviewer
run: "003"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: explore-approved
nextAction: propose
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-16
stageSkillRef: skills/actions/review-explore/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/002-explore/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/reopen-incremental-scope-and-compatibility/002-explore/run.md
---
# MVP-D04-A 独立 Review Explore

Owner 本会话指令为 `role: reviewer / review-explore`。固定审核对象为 [002 Author Explore](../002-explore/run.md)，不切换 Author，不改实现或该 Author 提交。结论：**approved**，无阻断发现；关键现状实验足以支撑进入 Propose，不表示新轮次模型或迁移已实现。

## 方法、输入与独立核对

实际读取稳定安装 `D:/tools/mendi/current/node_modules/mendi/skills/actions/review-explore/SKILL.md`，核对项目 AGENTS、根路线图 §7 D04-A、当前 manifest、OpenSpec context、Author 正文及直接 artifacts。稳定 CLI 的 status / next 确认当前为 manual-bootstrap / review-explore，固定 Author 为 002；产品写入不支持此人工记录，故沿项目既有方式保存本审核和交接，不声称执行过产品 action start / save / submit。

审核选入新增 `scripts/mvp-d04-a-explore.ts`、直接复用的 lifecycle / delivery / test helpers，以及范围解析、Reopen / Close、批次与正式结果消费的现有源码和相关规格。旧 Delivery artifacts、生成物和无关历史未纳入；本次是 Explore 语义与 proof 审核，未使用 OCR 或以工具选文件代替判断。

Owner 两项兼容决定以固定 Author 的“Owner 已确认的兼容决定”及当前 context 为交接输入：旧 product 查询保持只读、写入先预览再显式迁移；充分旧范围与收口可标明旧格式基线，不补造 Open Run。它们与路线图允许的兼容收敛一致，当前没有需要推翻或重新索取的产品决定，也不授予实际目标迁移权限。

## 结论与证据

| 核对项 | 独立判断 |
| --- | --- |
| Reopen 范围问题 | `lifecycleTargets` 确实以新 scope 覆盖顶层；重放观察到旧 A/B 变为 P10/P13，ID、首次日期、旧 binding / batch 与收口引用保留。Author 正确区分范围表示缺口与历史文件丢失。 |
| 简单拼接与依赖 | 旧槽位并入新范围、dependsOn 指向旧槽位均被明确拒绝，manifest 未变且未占号。不能沿当前读写规则直接拼数组；跨轮成果和本轮义务须由 Propose 明确区分。 |
| 旧 PASS 边界 | Reopen 后、绑定前，旧结果 passed 但 scopeMatch=changed；Close 因当前指针不符被拒绝，新范围 completionScope 也拒绝。旧结果可读不等于新轮可收口。这里只验证既有入口，不能当作未来新模型全部跨轮组合的验收。 |
| 批次与历史 | bind 不创建批次，首次 Explore 才建立 018-changes；旧批次、正式 Run 与 Close 字节保持。无需新增轮次目录或迁移旧路径。 |
| 必要历史材料 | 暂移直接 before-manifest 时普通 status 仍成功、同一 Reopen resume 拒绝；恢复文件后继续。该实验支持按操作确定必要输入，未冒充迁移 preview。 |
| 格式兼容 | 当前 v1 解析器忽略与顶层矛盾的 rounds；不认识的格式版本明确拒绝。版本化模型与统一读写者是有依据的候选，具体版本值仍未定稿。 |
| 旧来源与人工记录 | 新隔离 product 确实无 openRunRef，直接前态存在旧 scope 与真实 Close；manual-bootstrap 查询成功、生命周期写入拒绝且直接输入未变。允许明确 legacy baseline 比补造历史更符合现状，但不能由此宣称未知更早轮次完整。 |

独立重放结果见 [result](artifacts/proof-01/result.json)，命令回执见 [proof-command](artifacts/proof-command.json)。复用 Author 受控入口前已审查脚本和依赖准备，并先重建当前仓库 dist，避免源码调用与 CLI 读回来自不同构建。输出使用全新隔离目标；阶段批准为明确夹具输入，真实命令及生命周期调用仅服务本次实验，不是根 D04 的正式 Full Test 或实际审核批准。

为运行原入口，只复制其实际需要的 Author `artifacts/before-manifest.json` 至本 Run 同名短路径；该文件是 proof 的人工格式输入，不是审核前当前 manifest 的备份。不复制旧 Run / 证据树。新隔离正式结果的[直接读回](artifacts/proof-01/fixture-formal-result.json)、[stdout](artifacts/proof-01/fixture-full-stdout.log)与[stderr](artifacts/proof-01/fixture-full-stderr.log)已保存在本 Run，临时目录不是唯一证据。

## 验证与一次辅助断言纠正

- `pnpm build`：exit 0，见 [build](artifacts/build.json)。
- `node scripts/mvp-d04-a-explore.ts <本 Run>/artifacts/proof-01`：exit 0，8 组断言均完成；真实隔离 Full Test 子命令 2/2 passed、0 skipped。
- `pnpm check`：exit 0，140 文件格式 / lint 和 src / scripts / tests 真正 TypeScript 检查通过，见 [engineering-check](artifacts/engineering-check.json)。
- 固定 OpenSpec 1.14.1 status：repo-local / spec-driven，proposal ready，specs / design / tasks blocked，尚无规划产物。`git diff --check` 通过。
- 补充导出 formal status 后，Reviewer 辅助断言错误地仍要求 scopeMatch=changed，实际为 unavailable；保留[失败说明](artifacts/readback-assertion-failure.json)和原始成功 CLI 读回。根因已定位到 `src/adapters/delivery-verification.ts` 的 activeChangeId 分支：此时 proof 已开始 round-entry，先前 changed 的观测发生在绑定前。按两个实际时点分别断言通过，见 [legacy-and-readback](artifacts/legacy-and-readback.json)。未改产品或 Author proof，未重跑整条链掩盖失败；该差异不是产品回归。

## 限制与交接

Propose 应收敛唯一权威范围、稳定轮次身份、现有记录归属、跨轮基线表示、旧 product 全部写入口的迁移边界，以及直接材料缺失 / 矛盾和中断恢复。迁移成功、连续同日多轮、新格式跨轮结果绑定与恢复矩阵仍需后续设计和 Apply 验收，本审核不要求 Explore 提前实现。A 不改变 B 的同轮结果组合政策或现行正式验收合同。

本次只新增审核 Run / artifacts 并更新当前 manifest、README 和 context 交接；Author 002、源码、测试、proof 脚本、产品 Skills、主规格及已提交历史保持。未执行根正式 Full Test / Close、归档、迁移、DreMo 操作、稳定安装切换或 Git 写操作。D04-B / C 未激活，累计成功归档仍为 10。

下一步：`propose / author / awaiting-instruction`。本 Reviewer 停在此处。
