---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: business-contract-ui-design-and-proactive-clarification
planningSlot: MVP-D04-C
batchId: 002-changes
actionId: business-contract-ui-design-and-proactive-clarification-review-apply-01
actionType: review-apply
role: reviewer
actor: codex-independent-reviewer
run: "022"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: apply-approved
nextAction: archive
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/review-apply/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/021-apply/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/021-apply/run.md
---

# MVP-D04-C 独立 Review Apply

**结论：approved，无阻断发现。** 固定[021 Author Apply](../021-apply/run.md)，依据020批准的019方案、当前六份实际方法及交接/验收证据独立判断。三项重点边界已落实到正文，并实际进入当前候选交接。批准范围是本Change的方法交付，不认证任意宿主会遵循指令、真实UI业务已测试或稳定安装已更新。

## 审核覆盖

使用稳定安装MenDi review-apply及OCR delegate，后者只负责选文件/规则，语义由本Reviewer完成。preview前排除历史artifacts、依赖、生成物及未扩展017脚本；选入3项全部审核、跳过0。OCR默认未选六份Markdown方法，已主动逐份读取完整正文、差异及相关说明，不能用工具的覆盖率宣称方法已审核。选入/补读和排除理由见[review-coverage](artifacts/review-coverage.json)。另外读取当前任务、020要求、拟复用测试和021首次失败/最终结果；未改变Author实现或自签修复。

本次实际变更为六份skills/actions正文、当前README说明及159行可重建交接程序；src/tests没有变化，官方上游与工具指导未改。新增程序只做目标准备及传递核对，不实现业务分类器；未扩展旧Explore完整流程。

## 020三项边界与实际正文

| 重点 | 正文落点与独立语义判断 |
| --- | --- |
| 普通UI不新建Change | Explore/Propose开头及三份Review、Apply定位段均明确普通UI不新建Change，Author还明确不额外增加Action/Run。旧名称、路径或页面数量不机械冻结设计。Propose原有“当前Change已绑定，跳过new change”仍保留，不与日常UI边界冲突。侧栏替代顶部且角色/对象/结果不变应更新设计/定位，不能仅因旧spec词面要求新Change。 |
| 业务约束不能降格 | Explore/Propose及对应Review明确权限、正确对象、完整性、状态/保存/发布/确认、历史/失败处理和Owner明确验收UI要求；Propose与Review Propose禁止design备注、handler相同、后端未改、测试绿自动豁免。Apply两方进一步要求正常入口与直达分别验证、保留历史访问和必要功能。已知权限泄漏是缺陷，不是让Owner重新决定是否允许的未知。 |
| 关键未知不能模型代答 | Explore/Propose明确先查事实/已有回答，关键范围、默认行为、保留、兼容、不可逆后果和验收未知须具体提问；未答只暂停依赖定稿，不能将沉默/等待当批准，也不留给Apply猜测。两份Review自身检查假设来源及答案承接，不依赖Author上游；Apply遇实际未决承诺变化也须先说明/提问，Review Apply禁止模型补造。非UI与UI同样适用。 |

独立使用020的组合反例核对上述正文，而非仅检查关键词：

- 旧spec写顶部菜单，但Owner又明确某确认文案有验收意义：位置措辞可迭代，明确确认要求仍须成立；不能由“普通UI”吞掉后者，也不一律要求新Change。
- 草稿改发布、handler相同且用例绿：Propose和Review Propose明确要求看用户理解/确认语义，不足时问实际决定；不会由技术同一性推出等价。
- 默认截止/时区或非UI保留期限未答，模型建议当天/30天：没有批准就不能定稿依赖部分；建议不是决定，等待不是回答。已确认方向不重复问，低影响可逆细节仍可自行处理。
- 合并页后历史入口丢失但直达URL成功，或鼠标成功但目标必要键盘操作失败：Apply/Review Apply明确分别验证正常入口和直达，保留必要历史/键盘/PDF功能，不强加无关全设备矩阵。
- 定位失败后force点击或删除确认/无刷新断言取得绿：两份方法均明确保留原场景、业务与技术必要断言、原失败和清理，不能用弱化验证放行。

这些是Reviewer对交付正文的人工语义检查，与021的Author表分别承担独立判断；没有把它们伪称浏览器测试、自动分类器评分或未来所有宿主的行为保证。正文保留了阶段角色与原停止边界，没有借新规则回写旧Run/verdict。

## 独立交接与验收

以当前程序可重建输入在022自己的[handoff-probe.ts](artifacts/handoff-probe.ts)重放，未向021保存新输出。先由当前源码重新tsc构建，再实际启动候选CLI Explore并读取proposal instructions；更新后的Explore完整正文等于当前来源，目标context/rules实际传递。六阶段及三种修订映射九次loader核对正文、上游数量及未选Storybook空指导。

独立补验：移走隔离目标四份Author上游方法后，review-explore/review-propose/review-apply仍返回各自完整当前正文，三个Author阶段则明确skill-unavailable，不静默兜底。目标未创建proposal或伪造阶段批准。见[handoff.log](artifacts/handoff.log)、handoff-01/methods.json和handoff-01/independent-boundaries.json；实际命令原始输出单存commands-*.jsonl。真实CLI只启动Explore，其余为loader检查，不宣称九个完整CLI生命周期。

独立 `node --test --test-concurrency=2 tests/target-methods.test.ts tests/target-method-handoff.test.ts tests/methods-and-numbers.test.ts`：**11/11、exit0**，见[method-tests.log](artifacts/method-tests.log)。包含来源/映射、缺项、按需指导、Reviewer无Author上游前置和交接写入边界；既有少量短语断言不能认证新语义，完整正文/来源复验及上面的独立语义检查补足本次验收。

### 工程检查与保留失败

- 本次先为pnpm设置verify_deps_before_run=error，`pnpm check`与`pnpm build`均在预检以ERR_PNPM_VERIFY_DEPS_BEFORE_RUN拒绝，提示workspace结构与安装记录不一致；原样保留check.log/build.log。这两次没有执行检查正文，不能报告为PASS，也不是方法代码失败。
- 未安装/修复依赖。直接调用现有node_modules/.bin/biome.cmd执行format检查和lint，两者exit0；直接调用已安装TypeScript分别执行tsc --noEmit、tsconfig.scripts.json、tsconfig.tests.json，三者exit0，再tsc构建exit0。命令与package scripts检查内容一致，结果见direct-check.log/direct-build.log；不能称pnpm预检已修复。Reviewer probe自己的tsconfig类型检查也exit0。
- 021原check-final及方法11/11记录保留；其handoff-first确为重复scaffold夹具失败，修正输入后的handoff-repaired为新执行，不将旧失败翻为PASS。本次独立复验使用修正后的可重建输入。
- 固定OpenSpec1.14.1 strict验证exit0；只读apply instructions确认11/11，不把all_done当审核批准。当前状态固定021，git diff --check通过。
- 本次没有运行根行为全集或浏览器：运行时代码/记录合同未改，所验对象是方法与交接；真实目标之后应用方法仍须取得自身适用的UI结果。也未执行根正式Full Test或稳定安装验证。

## 非阻断维护说明

当前tasks.md开头仍有“当前任务均未执行”的规划期说明，与11个勾选、实际instructions和021完成记录不一致。这是状态说明遗漏，不改变实际任务/合同或本次结论；后续相关文档收尾时修正即可，不为此另建修订Run、撤回批准或由Reviewer修改Author材料。

## 维护规模与职责

独立按维护TypeScript物理行统计，排除fixtures/依赖/生成物，基准HEAD为1cb40802e4707bcc405c33de8c881d0c44bcc22c，见code-counts.json。

| 目录 | 前三名 | HEAD→当前 |
| --- | --- | --- |
| src | application/project.ts；core/delivery-runs.ts；application/delivery-lifecycle.ts | 374→374；372→372；371→371 |
| tests | action-write.test.ts；planning-cli.test.ts；delivery-repair.test.ts | 467→467；444→444；394→394 |
| scripts | proofs/mvp-d01-c-explore.ts；proofs/mvp-d01-d-explore.ts；proofs/mvp-d01-a-explore.ts | 678→678；487→487；463→463 |

前三名均无增长；本次Apply新增mvp-d04-c-apply.ts 159行，017探索程序是此前已存在输入，不算本次Apply增长。程序职责限当前交接验证，没有通用状态引擎或纯转发层；六份方法按阶段作必要重述，未新增跨阶段必读文件。旧长proof未扩展，继续保持限定用途；以后确需扩展完整Apply/Archive链时再先分离记录流和效果组，本次不因行数强拆。

## 停止边界

仅新增022审核与直接证据，并按manual-bootstrap更新manifest/README/context。021、旧Run/verdict、受审产物及方法保持；未自行改实现后批准。A/B仍归档011/012，累计12，C尚未归档。未操作DreMo、稳定安装、包版本、根正式Full Test/Close或Git写入。

下一步 `archive / author / awaiting-instruction`，固定Author021和Review022。当前会话保持Reviewer，完成后停下。
