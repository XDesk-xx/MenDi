---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: business-contract-ui-design-and-proactive-clarification
planningSlot: MVP-D04-C
batchId: 002-changes
actionId: business-contract-ui-design-and-proactive-clarification-review-propose-01
actionType: review-propose
role: reviewer
actor: codex-independent-reviewer
run: "020"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: proposal-approved
nextAction: apply
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/review-propose/SKILL.md
authorRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/019-propose/run.md
previousRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/019-propose/run.md
---

# MVP-D04-C 独立 Review Propose

**结论：approved，无阻断发现。** 固定[019 Author Propose](../019-propose/run.md)及当前五份正式规划文件，逐项对照[018审核](../018-review-explore/run.md)与其[语义反例](../018-review-explore/artifacts/semantic-review.md)。批准限于方案；不代表六份方法已经修改、宿主已能正确判断，或本次已完成UI业务验收。

## 方法与直接输入

使用稳定安装MenDi review-propose方法，保持Reviewer。完整读取proposal、design、tasks及action-runs/storybook-integration两份delta；核对主规格中受改要求、已有阶段方法组合职责和拟复用方法测试。独立读取固定OpenSpec1.14.1的tasks及apply instructions，仅获取指引，没有执行Apply。根manual-bootstrap通过当前manifest与只读CLI固定019，不伪造产品Review提交。

018技术proof的适用范围没有变化：它证明实际方法传递、动态instructions和角色来源边界，不能证明语义判断。019在proposal、design §4和任务中均保留这一限制。本次方案未改变loader或产品实现，无需重跑018交接实验；也不拿其旧PASS充当未来修改后的验收。

## 018边界的规格、设计与验收追踪

下表spec路径均位于当前Change。

| 边界 | 正式合同与方案 | 具体验收任务 |
| --- | --- | --- |
| 普通UI调整不新建Change | action-runs的Business contracts and iterative UI decisions及Ordinary UI organization changes场景明确MUST不要求新Change；旧名称、路径或页面数量不机械否决。design §2明确不增加Change/Action/Run手续，proposal区分日常UI工作与已授权C方法交付。 | 1.1、1.2、2.1、4.2：菜单等价调整、旧顶部菜单词面差异、已确认决定不重复问；检查实际方法处理，不能只测试关键词。 |
| 业务约束与明确验收UI要求不能降格 | 同一requirement列出权限、正确对象、完整性、状态/保存/发布/确认、历史和失败处理；An existing requirement differs场景禁止用design自动豁免。design §2区分实现措辞与真实承诺，不把所有UI差异自动归为新Change。 | 1.2的草稿改发布/Owner明确验收，2.1的测试绿但权限或确认缺口，3.2和4.2的历史入口、键盘/PDF反例。 |
| 关键未知不能由模型代答 | Proactive clarification requirement覆盖UI与非UI；默认截止、未答保留期限、已确认事实、隐含重要假设四个场景，明确不以假设/沉默/等待当批准。design §3要求先查事实、按依赖提问、只暂停依赖部分，不加默认等待时长。 | 1.1、1.2、2.1、4.2：期限未答、截止/时区/请求值、假设冒充确认、已有决定不重复问；Reviewer核对来源和答案承接。 |
| Author与Reviewer不依赖相同上游也要有同一尺度 | Author and reviewer apply the same distinction场景及design §1要求四阶段各自在实际自有正文承担职责，不强迫Reviewer加载Author方法。 | 1.3、2.2、3.2、4.1核对六阶段/修订映射、来源、角色及至少一个真实候选CLI交接和动态instructions；语义另由4.2及独立审核确认。 |
| 定位修复不弱化原场景 | storybook-integration的Finite UI tests保留原有限测试/新结果要求，新增普通定位变化、正常入口丢失及功能/可用性影响三个场景。 | 3.1的force/删确认断言/直达替代负例，3.2的历史入口/键盘/PDF判断；保留业务与技术必要断言、失败和清理，不新增无关UI工程或全设备矩阵。 |
| 旧记录保留、交接实测不等于语义认证 | action-runs旧规格差异场景禁止倒改历史；design §4/Migration Plan区分传递实测、人工语义核对和真实目标后续UI验证。 | 4.1–4.4要求新交接输出、实际事实/未知/处理/理由、工程检查及独立Review；不扩展旧Explore树，不把人工推演叫浏览器PASS。 |

## 独立组合推演

以下为方案逻辑检查，不是未来实现已运行的结果。

1. **旧spec写顶部菜单，改侧栏，但另有Owner明确的入口验收要求**：不能仅凭“UI”二字放行，也不能仅凭旧词面要求新Change。现有合同先判实际要求是否仍有效、是否满足；未知取舍问具体影响。已知明确要求仍须保留，只有真实承诺变化才按既有流程处理。没有产生一律新Change或一律豁免的矛盾。
2. **handler未变、草稿改发布、测试仍绿**：文案可能改变理解及确认语义；action-runs标签变化场景与design §2要求核对实际结果/已有决定，任务1.2和2.1分别约束Author与Reviewer，不能用技术同一性代替业务等价。
3. **模型建议默认截止/30天保留，Owner未答**：建议没有变成批准；定稿只暂停依赖答案的部分，独立调查可继续，不能等一段时间再默认实施。已有明确答复则直接承接，不重新问卷。任务4.2要求实际说明事实/未知/处理/理由，Reviewer检查来源；没有用问句数量认证完成。
4. **界面合并后正常入口丢失，直达URL与鼠标路径仍成功**：正常入口与直达分开，目标所需键盘能力/PDF明确功能不被“普通设计”覆盖；无关目标也不强加设备矩阵。story场景和任务3.1/3.2一致。
5. **六阶段加载测试全绿，但新方法漏掉业务约束或重要未知**：design §4明确自动测试只证明正文/来源/映射与传递，人工语义核对和独立Reviewer仍是必需工作。任务不能用旧关键词断言或镜像测试代替语义验收；本次批准也不能代替后续Review Apply。

拟复用tests/target-methods.test.ts、target-method-handoff.test.ts和methods-and-numbers.test.ts确有方法映射、来源、缺项/Reviewer边界及按需指导测试。部分现有断言仅检查短语/头部，不能单独证明本次正文充分；方案已要求实际正文/来源核对、真实CLI及独立语义检查，允许仅在真实覆盖缺口补场景，未把现有测试名当验收保证。没有要求引入分类器、模型评分器或机械字段gate。

## 独立检查与限制

- 固定OpenSpec1.14.1 strict validation exit0、issues=[]，见[validation](artifacts/validation.json)。这是结构验证，不是语义批准理由。
- tasks instructions的specs/design依赖均done；只读apply instructions显示11项任务、0完成，见tasks-instructions.json和apply-instructions.json。ready不表示开始执行。
- 独立对比storybook-integration唯一MODIFIED requirement，两个原场景正文保留；action-runs两个ADDED requirement名称不与主规格重复，见[planning-check](artifacts/planning-check.json)。未同步主规格。
- 当前CLI状态固定019/review-propose，见status-before.json；git diff --check通过。受审HEAD为1cb40802e4707bcc405c33de8c881d0c44bcc22c。
- 本次只审核规划，没有运行产品行为全集或浏览器，没有修改方法再自签。Apply须取得更新后正文/交接、受影响测试和语义核对的新证据；若实际扩大运行时代码或安装范围，应按方案说明影响并补验证，不能默默借本次批准扩建。

无需新增Owner问题：三项核心边界已有决定，本方案没有引入新的范围/产品取舍；发布版本未在C决定，也不阻断本次方法方案。无阻断或必须补修的规划缺口。

## 交接与停止

仅新增020审核及直接检查输出，按manual-bootstrap更新manifest、README和context。019及其五份正式产物、017/018、旧Run/verdict、实现/测试/产品方法、主规格保持。A/B仍归档011/012，累计归档12。

下一步 `apply / author / awaiting-instruction`，固定Author019及本次Review020。当前会话保持Reviewer并停下；未执行Apply、Archive、正式Full Test/Close、DreMo/稳定安装操作或Git写入。
