---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
batchId: 003-changes
actionId: apply-revision-and-native-archive-explore-01
actionType: explore
role: author
run: "030"
status: completed
result: proof-supported
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-explore/SKILL.md
nextAction: review-explore
nextRole: reviewer
---

# MVP-D01-D Explore

Owner 原始授权：`owner 授权激活下一个 change，开始 explore，核心功能 proof 认证`。

范围依据路线图 MVP-D01-D：Apply、修订与原生 Archive，包括对应阶段方法、同 Action 继续、必要验证、普通 revise、Owner 主动回退及真实归档后的记录 / 查询衔接；纳入路线图已列出的长文件维护判断。范围内本轮只开展探索与关键实验，停在独立 Review Explore。

固定 OpenSpec 1.14.1 的 list 确认 nearest root 为本仓库、原无活动 Change，随后实际 scaffold `apply-revision-and-native-archive`。复用 `003-changes`，本 Run 为 030；累计成功归档仍为 3。前序 C 的独立批准与 029 归档已保存，最近本地 checkpoint 为 `511c556`；这些是基准，不替代本 Change 的独立审核。

## Author 结论

结果为 **proof-supported**：继续与修订的既有产品记录可以沿用，操作级输入、Owner 回退和产品归档衔接存在明确待实现缺口。核心实验 **8 / 8**、**52 次真实子进程调用**，不是本 Change 的独立 verdict，也不证明产品 Archive Action 已实现。

1. 上游 Apply instructions 是操作协议：contextFiles 为具体路径数组，另有 tasks / progress、blocked / ready / all_done、missingArtifacts / missingPrerequisites、instruction、context 与 operationGuidance；不应套用四类 artifact 的 template / outputPath 协议。上游 Archive instructions 只提供当前目标、context 和 operationGuidance，不提供产品独立审核结论。
2. 当前 Apply continuing 和 revise-apply 可跨进程工作；修改要求后及 approved 后再次 revise 均指向新的独立 Review Apply，旧 Author 与 verdict 保留。没有理由为这部分重建一套阶段引擎。
3. 当前 action resolve 明确拒绝 Apply，普通 revise 也不能跨阶段。Owner 主动回退需显式目标阶段与直接 Author 输入，新建该阶段 Author 修订，重新经过相应 Review；不能重用旧批准跳回 Apply。既有 Owner 标签不认证真人身份。
4. 原生 Archive 已能执行同一 delta 一次同步与目录移动，项目累计编号可在安全核对后加到原生日期目录；产品记录目前仍不能解释 archived binding。D 必须同时落实执行与查询，不可补建旧活动目录、迁移成人工记录或改历史 Run 维持成功。
5. 原生 `--yes` 能归档未勾任务；即使工具 exit 0、上游 all_done 或文件齐备，也不能替代当前有效方案与独立 Review Apply。实际归档后，本地交接失败必须报告已发生效果，不能再次调用原生 Archive 或重复同步。

## 实际输入与验证方法

已读取本项目三份主规格的需求 / 场景、路线图 §5 / §6.1 / MVP-D01-D、当前 Action 与 Owner / Run / workspace 代码、产品 Apply / Review Apply 方法，以及上游 Explore 和 Apply 工作方法。读取上游稳定安装 Archive 的执行 / 失败分支，确认其会检查目标、验证 delta、同步后移动，并有特定失败回滚与回滚失败路径；未导入这些内部实现作为产品依赖，没有改固定工具。

本项目真实 proposal、Apply、Archive instructions 保存于 artifacts；当前尚无 proposal / design / delta / tasks，上游 Apply 为 blocked。这是 Explore 阶段的真实状态，不以 Author Explore 完成伪报规划齐备。生成的实验材料仅在受控沙盒，不作为当前 Change 的方案或批准。

实验入口：[TypeScript proof](../../../../../../scripts/proofs/mvp-d01-d-explore.ts)，使用受控 `minimal-project`、`delivery-scope.json`、真实固定 OpenSpec 及当前构建的 MenDi CLI。每轮创建全新目标，原始输出保存在新的 Run artifacts 目录；重放使用新输出目录，禁止覆盖原结果。

```powershell
pnpm build
node scripts/proofs/mvp-d01-d-explore.ts --output .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/030-explore/artifacts/proof-003
pnpm check
node --test tests/action-write.test.ts tests/owner-resolution.test.ts tests/query.test.ts
```

上面 proof-003 为后续重放示例；本轮最终实际执行结果是 [proof-002/report.json](artifacts/proof-002/report.json)，完整命令 / stdout / stderr / 退出码见 [commands.json](artifacts/proof-002/commands.json)。

## 核心 proof

| proof | 目的与实际结果 | 限制 |
|---|---|---|
| D01 | 真实 Apply inputs 随 tasks 为未勾 / 缺失 / 已勾分别返回 ready / blocked / all_done；含真实上下文路径和非空操作 guidance。当前产品返回 unsupported-action-instructions | 未实现操作级公开入口，未声称 Agent 已消费这些输入或完成实现 |
| D02 | Apply continuing 后新 Run 保持 actionId；changes-requested 后修订、approved 后再次修订均要求新 Review Apply；陈旧 Author 审核拒绝，相关旧 Run 字节不变 | fixture Author / Reviewer 由实验程序组织，不批准当前 MenDi Change |
| D03 | Apply Owner resolve 返回 unsupported-resolution；普通跨阶段 revise-propose 返回 action-state-conflict；manifest 字节未变 | 主动回退是待 Propose 的新增产品行为，没有通过手改当前项目恢复 |
| D04 | 真实原生 Archive 新增一项需求，主规格只出现一次；随后在实验候选交接路径制造 EISDIR，原 product manifest 保留，活动目录已消失、归档及主规格已存在，真实 status 返回 incomplete-mendi-state | 本地失败是受控文件系统实验，不是已实现产品 Archive 事务或上游内部部分回滚；原生结果与候选交接效果分别观察 |
| D05 | 核对同一真实 archive 父目录与目标不存在后加累计编号 001，.openspec.yaml 字节一致；沙盒 product archived binding 的 next 仍返回 invalid-record | 编号整理只在沙盒，证明接线可行及当前格式缺口，不宣称产品归档查询已实现 |
| D06 | 真实原生目标冲突返回 archive_target_exists，活动 delta 和旧目标 sentinel 保留，没有写主规格 | 覆盖一个同步前失败，不推断所有失败均无效果 |
| D07 | 真实无规范声明 / 场景的 delta 返回 archive_validation_failed，活动 delta 保留，没有写主规格 | 没有使用 no-validate / skip-specs，也未测试全部上游回滚点 |
| D08 | 独立未勾任务沙盒执行原生 archive --yes 成功，归档内仍有未勾 tasks | 特意验证上游与产品批准职责不同；不能据此放宽 MenDi Archive 前置 |

首轮 [proof-001/report.json](artifacts/proof-001/report.json) 完成 D01–D03 后，在 D04 因实验预期错误码失败：原预期 change-not-found，实际本地记录先检查已消失的活动路径，返回 incomplete-mendi-state。修正实验断言后从新沙盒重放，proof-002 为 8 / 8；未改产品代码或重跑首轮目标的 Archive。首轮实际效果及现场另保存为 [proof-001-scene.json](artifacts/proof-001-scene.json)，保留首轮原始失败输出。

原始 Apply inputs、Archive guidance、原生响应和已同步主规格都保存在 proof-002 目录；必要结果不依赖旧 `.tmp`。实验不新增 scriptSha256、文件 hash 清单或 gate，保留必要的文件未变字节比较。

## 维护判断

统计与处理依据见 [maintenance-assessment.json](artifacts/maintenance-assessment.json)。按当前物理行数（含空行 / 注释）观察，排除生成物及测试输入夹具，不建立行数硬门槛或长期台账：

| 目录 | 当前前三名 |
|---|---|
| src | application/actions.ts 466；adapters/openspec.ts 317；core/actions.ts 282 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；query.test.ts 335 |
| scripts | mvp-d01-c-explore.ts 678；本轮 mvp-d01-d-explore.ts 487；mvp-d01-a-explore.ts 463 |

- C 的 678 行 proof 保留为限定 C 范围、已受审的历史实验，D 不追加场景或复制其候选本地保存实现。今后只有该实验自身确需修订才按进程职责 / 场景分组整理；不重写原结果或旧 PASS。
- application/actions.ts 同时承接普通记录、指引及 Owner 处置，D 会继续增加操作级输入和跨阶段回退，应在扩展前分离相关职责，Archive 独立承接外部工具效果及本地交接；不是拆转发层以压行数。具体任务由 Propose 明确。
- action-write.test.ts 保留已有写入 / 竞争边界覆盖；D 的 Archive / 回退独立按场景组组织，避免追加混合大流程。planning-cli.test.ts 保留 C 完整规划流程，D 不向它追加归档场景；如果修改公共准备逻辑，同步定向整理并验证相关覆盖。
- 新 D proof 虽较长，当前只有固定 CLI 准备 / 输出记录和八个有编号的 D 场景，没有子进程持锁 worker、候选业务实现或通用框架；其限制已显式记录。不能再无边界累加 Apply 产品验收或其他 Change 场景，必要的新产品回归放测试；如仍扩展该实验，先区分 Apply 记录流与 Archive 效果组。
- Propose 需落实路线图 §5 的维护观察要求到 AGENTS.md 与 Review Apply 方法；本轮只分析并留待任务，不提前改产品 Skills 或协作规则，不追改 C 审核。

## Propose 待收敛

1. 最小操作级 instructions：与 artifact 指引区分 Apply / Archive 协议；核对当前 Action / 阶段、Change / schema / root、实际输入路径、tasks / progress 与 guidance，返回真实事实，不自动实施、勾任务或给 verdict。保留按操作决定必要输入的规则。
2. Owner Apply handoff / rejected 同阶段 revise，以及主动退回早期 Explore / Propose 的显式边界：要求当前直接对象、同 Change 的明确目标 Author、目标阶段与非空原因，新建 Author 修订；保留旧 Run / verdict，不删除旧产物或自动回滚实现。回退后的阶段 Review 与正常顺序必须重走，不能从过去批准跳过。
3. Archive 的当前独立批准、方案与任务完成前置；固定上游原生同步一次，不由 Skill 再同步。执行前记录当前直接输入与预定路径 / 编号，验证实际根、目录和同步需求效果后才提交累计完成数与 archived binding；沿用项目累计 ID，不把激活顺序或 Run 当归档编号。
4. 限定失败处置：原生失败或响应不明先保存原始结果并观察实际材料。已归档但本地交接未完成，只能显式补当前操作的编号 / 本地收口，不重复原生 Archive；输入或效果无法确认则保持错误与现场。残留锁遵循既有 Owner 单独授权的人工处置，不引入通用恢复引擎、自动抢锁或补目录。
5. product archived binding、最终 Archive Run 与无活动 Change 的只读查询：无需已移走 Change 的活动 status，不读取全历史或代签效果；人工记录仍只读。产品首个 Change 的 Archive 不自动接入第二 Change、Close / Reopen 或正式 Delivery Full Test。
6. 对实际扩展的职责先整理，规划定向原生失败、已发生效果后的本地失败、复核 / 重试不重同步及归档后查询测试；可靠的 C 输入安全 / 写入 / 独立性结果继续沿用，不机械复制全部旧 proof。

这些是待受审方案收敛的建议，不是当前实现或产品 API 承诺；本轮没有未解决的工具 / 环境阻断。

## 工程验证与交接

- `pnpm build` exit 0；最终实验使用当前 TypeScript 源码的构建产物。
- [check.log](artifacts/check.log)：修正实验断言后 `pnpm check` exit 0；格式 / lint 各检查 38 个维护文件，实现 / 脚本 / 测试的真正 TypeScript 检查通过。
- [related-regression.log](artifacts/related-regression.log)：现有 Action 写入、Owner 处置与查询定向回归 **32 / 32**，exit 0；没有实现变化，前序其余仍适用结果沿用，未执行正式 Delivery Full Test。
- 当前 Change 仅有原生 scaffold；没有新建 Change 级 explore.md，分析及 proof 摘要统一在本 Run。未写 proposal / design / delta / tasks，未改 src、tests、产品 Skills、AGENTS、主规格或历史 Run；README / OpenSpec context / manifest 仅更新当前人工激活及交接。

当前 Author 已完成 Explore，`next=review-explore`、role=reviewer、直接 Author 输入为本 030。实际会话仍保持 Author，由独立 Reviewer 核对变化与关键实验；未生成 Reviewer verdict，未执行 Propose、当前 Change 实际 Archive、Git checkpoint / push、正式 Delivery Full Test / Close 或下一 Change 激活。`.tmp` 仅用于重建沙盒，本轮不清理旧目录。
