---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: business-contract-ui-design-and-proactive-clarification
planningSlot: MVP-D04-C
batchId: 002-changes
actionId: business-contract-ui-design-and-proactive-clarification-explore-01
actionType: explore
role: author
actor: codex-author
run: "017"
status: completed
actionStatus: completed
outcome: complete
result: exploration-ready-for-review
nextAction: review-explore
nextRole: reviewer
completedOn: 2026-10-17
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
---

# MVP-D04-C Author Explore

Owner原始授权激活C并Explore，保持Author、必要真实proof、无提前实施，完成停独立review-explore；不修改DreMo或稳定安装、不push。

## 范围与事实

路线图MVP-D04-C和反馈原件mendi-ui-spec-granularity-improvement.md已明确：稳定业务契约、当前UI设计和未决产品决定分开；Explore / Propose主动提问，Review采用同一尺度。已确认方向不重复询问。根保持manual-bootstrap，沿用002-changes；C真实OpenSpec身份为business-contract-ui-design-and-proactive-clarification，017为本Delivery下一Run。上游new change只生成元数据，未写proposal / specs / design / tasks。

已读真实proposal instructions及context；context中此前“C未激活”是激活前快照，由本次Owner明确授权和当前manifest更新，不据旧背景否定本次操作。当前context指导中文、TS、必要proof和角色 / 授权边界，不复制完整背景进方案。

## 关键疑点与真实proof

**问题一：是否需改CLI、方法适配或强制UI指导才能交接本次规则？**

目的：确认现有四阶段实际方法、目标上游和动态项目约束的传递位置，避免只看文件目录就扩建能力。输入为当前checkpoint候选、真实1.14.1上游正文和隔离最小product目标；受控教师发布 / 学生读取条件只是检查instructions传递的具体材料，不是MenDi新增业务。

方法：受控TypeScript入口scripts/mvp-d04-c-explore.ts，经tsconfig.scripts真正类型检查。真实OpenSpec创建隔离Change，复制当前目标两个真实官方方法正文；真实候选CLI启动Explore，再读取该Action的proposal instructions。另直接调用现有loadChangeMethods读取explore / propose / review-explore / review-propose；不伪造Reviewer完成或阶段批准，不跑完整目标生命周期。

结果：proof-first.log为exit0；原始命令见proof-01/commands-*.jsonl，四阶段读取见proof-01/actual-methods.json，观察见proof-01/observation.json。实际stage内容等于自有文件，Author上游内容等于所选目标文件、generatedBy=1.14.1；两个Reviewer没有Author上游，未选Storybook也没有可选指导。真实instructions带回具体context和proposal规则，未产生proposal文件。

限制：CLI实际开始的是Explore，其他三个阶段只核对已有loader，不冒称已完成四阶段或UI用户流程。返回内容 / context相同证明传递，不证明宿主真正提问或语义判断正确；目标中没有实现UI，未启动浏览器、服务或MCP。此proof不认证任意宿主，不修改稳定安装。

判断：已有交接机制足够承载方法收敛，暂未发现需新增CLI字段、判定引擎、问题台账或改上游适配的技术缺口。

**问题二：上游已有主动澄清是否足够？**

实际1.14.1 Explore有查事实、聚焦关键问题、明确推荐 / 限制、等待回答的通用指导；Propose也有material ambiguity和不可留给Apply猜测的要求。当前四份自有方法主要规定阶段、proof、instructions、角色和交接，尚未明确业务 / UI划分以及Reviewer如何核对关键假设；Reviewer又不强制读取Author上游，不能凭Author方法已有文字推导审核尺度一致。

因此候选是收敛自有四阶段短指引，保持上游身份 / 来源与现有适配；必要时在Apply / Review Apply补“定位修复保留原场景和真实操作”的短说明。不要把同一长规则复制到目标context、Storybook和上游六份方法。此处仅为候选落点，没有修改方法正文。

## 代表情形推演与共同尺度

以下是基于路线图 / 原件的Author语义推演，供独立Review核对，并非真实UI运行PASS或自动分类器结果。后续Apply验收应核对交付的方法正文、实际返回内容和这些推理边界；不以关键词出现代替语义验收。

| 情形 | 业务判断与应保留的验证 | 阶段影响 |
| --- | --- | --- |
| 菜单改位 / 改名 | 正常入口仍可发现、可操作且作用于正确对象；旧标签本身不等于业务承诺 | 通常design / 定位更新，不新建Change；旧措辞涉及真实业务约束或明确验收承诺时再核对实际影响 |
| 合并课程与课次页面 | 不能遗漏授权过滤、对象选择、当前 / 历史访问；页面数量不是默认约束 | 说明真实流程与受影响场景，不机械要求旧页数 |
| 分页按钮改滚动 | 仍需有界接口、正确过滤 / 排序、失败处理；PDF逐页等显式功能另判 | 通常交互设计，可逆细节不逐一问卷 |
| 默认截止变化 | 会改变实际提交结果，显示 / 时区 / 请求值 / 服务器约束都相关 | 尚无Owner决定时先问并暂停依赖该答案的定稿，不能自行选默认 |
| 权限泄漏 / 未确认提交 | 数据可见范围和确认条件属于业务承诺；测试绿或后端未改均不能豁免 | 指出真实行为缺口及必要修复 / 决策，不当普通UI调整 |
| 接口存在但正常入口不可达 | 直达URL成功不证明用户能找到并完成操作 | 正常导航与直达 / 刷新 / 授权分开核对；必要键盘 / 移动可用性按实际目标 |
| 选择器过时 | 保留原用户场景、技术必要断言、失败和清理；用当前真实入口定位 | 不靠force点击、吞错、删除测试或放宽业务断言制造PASS |

Owner明确指定且具验收意义的UI要求仍是约束；新规则不授权把旧正式要求整体降格、追改历史Run / verdict，或将过去失败改判为成功。

## 候选方案与未决项

推荐按现有方法能力收敛：Explore识别稳定约束、候选和关键未知；Propose核对答案并让specs / design / tasks一致；Review Explore检查proof / 未决 / 假设来源；Review Propose核对UI约束粒度、实际用户影响和关键问题是否被跳过。相应正式合同优先复用action-runs的阶段方法职责，必要UI验证边界在storybook-integration内明确；最终delta范围由Propose按真实instructions收敛，不为凑规格创建近义新能力。

不推荐增加机器自动认证UI等价、强制通用问答表、逐视觉细节Owner审批、全量历史审计或额外生命周期。方法“必须问”约束宿主工作和独立审核，不表示工具能够认证任意答案真实性。

Owner已明确：普通UI调整不新建Change。不能从旧spec中出现菜单 / 按钮 / 路径名称机械推导必须新Change，也不让spec粒度过细反过来冻结UI；先核对是否仅等价实现变化。新C方法应明确区分普通UI迭代、实际业务承诺变化和Owner明确的验收UI约束。后两者存在未决时，先问具体影响，按已有项目流程处理；不增设一律新Change、问答台账或审核阶段。旧归档、Run和verdict保持。

版本号 / 发布准备另属D04出口，0.2.0只是此前建议并未被Owner确认；本C不修改包版本、安装脚本或自动切换稳定目录。

## 当前检查与边界

pnpm check exit0，含格式 / lint、src / scripts / tests三套真实TypeScript检查，见artifacts/check.log；proof单独类型检查也通过。只新增受控探索入口与本Run证据，未修改src / tests / 产品Skills / 主规格，未提前形成正式方案或实现。旧Run / verdict、A / B归档与checkpoint、路线图 / 三份反馈原件保持。无Git写入 / push、根正式Full Test / Close、DreMo或稳定安装写入。

## Owner澄清与结论

最初问题把“旧spec差异”与“由新Change承接”绑在一起，Owner先指出历史不可回改，继而明确普通UI设计一般不做新Change；Author撤回过度推断。Owner最后确认“写错了，普通UI调整就是不新建change的”，不是尚有未完成决定。最终采用前述实际影响边界，没有把前两次提问选项当成批准。

当前没有阻断本Explore的关键未决项。正常UI布局 / 文案 / 导航等实现选择不逐项征求Owner；真正影响业务或验收的未知依赖仍须在未来真实工作中主动提问，不由本次推演预先代答。版本号也未在本C中决定。

## 独立Review Explore交接

固定本017为Author对象，无verdict。建议Reviewer重点核对：现有交接 / instructions proof只支持“无需新增适配”的限定技术结论；方法语义缺口及代表情形推演足以支持后续Propose，而非宣称UI业务测试通过；普通UI不新建Change与不改历史同时成立，关键产品决定不得由模型补造。

检查：proof真实CLI / loader执行exit0；脚本真实TypeScript检查及pnpm check exit0；git diff --check通过。边界读回见artifacts/boundary-readback.json：HEAD仍1cb4080，累计归档12，根manual-bootstrap，稳定包0.1.0及原时间戳保持，产品src / tests / skills / 主规格和旧归档无差异，未访问 / 修改DreMo。

仅C元数据、新017 / 直接证据、受控TS探索入口、manifest和当前README / context更新。正式proposal / design / specs / tasks留待获准Propose，不提前实现或改变上游方法。next为review-explore / awaiting-review / reviewer，authorRunRef固定本017；本会话保持Author，不启动Reviewer，不push、不归档、不执行根正式Full Test / Close或发布。
