---
name: mendi-explore
phase: explore
role: author
---

# explore 阶段方法

先查项目事实与 Owner 已确认决定，区分稳定业务约束、当前 UI 候选和关键未知。约束关注角色 / 权限、正确对象、数据完整性、状态与保存 / 发布 / 确认条件、历史保留及失败处理；菜单、布局、文案和页面组织通常是设计选择。普通 UI 调整不新建 Change，也不额外增加 Action / Run；旧名称或路径的词面差异不机械判为业务越界。仍须核对关键能力可发现、可操作及实际用户影响；Owner 明确且具有验收意义的 UI 要求不能直接降格，后端未改或测试绿不能豁免业务变化。

对会改变目标、角色、范围、核心流程、权限、默认行为、数据保留、兼容 / 历史处理、不可逆后果或验收的关键未知，向 Owner 提具体问题，说明影响并给有依据的建议；按依赖聚焦，不让模型默认成为产品决定。答案未到只暂停依赖部分的定稿，继续独立调查，不把沉默或等待当批准。该原则同样适用于非 UI 工作；已有回答不重复问，可查事实先查，低影响可逆细节自行判断并简记，不新增统一问答台账或审批层。

本次 `methods.upstream` 提供当前目标的 openspec-explore 正文、来源及 generatedBy 1.14.1，使用适用部分完成探索；revise-explore 沿用该方法并说明直接修订对象。自有方法来自安装包，目标上游方法来自当前项目；缺项须明确准备，不自动 init / update，也不借开发仓库兜底。方法已返回只证明交接，实际 proof 才说明工作结果。

读取 `action instructions --action <当前 ID> --artifact proposal` 的真实背景，说明目标 context / rules 如何约束范围。这里只支持 proposal 背景，不提前编写全部方案。对能改变方案的疑点选择可重建 proof，记录目的、输入、方法、实际结果与限制；不把字符串 sentinel 或命令 PASS 当核心事实。

问题、候选、分析和 proof 摘要写进 Run，原始输出进该 Run 的 artifacts 或受控文件；今后不新建 Change 级 explore.md。旧已受审探索文件保持原样，正式方案承接有效决策。

未来阶段同一次真实执行的必要 stdout、报告或请求只保存一份原件，其它摘要使用可直接读取的受管引用。可复建输入记录受控 scripts/tests/fixtures 入口、实际参数及实测结果，不复制整棵临时工程；当前唯一输入或失败/unknown 原件只在 .tmp/runtime 时，须在清理前保存必要字节一次到本 Run，否则明确 incomplete 并保留现场。不要按内容相同合并不同执行，不回写旧 submitted 历史。正式双物理日志（含 0B）和 groups-v1 回执/清理合同保持；缺失不能推断 empty 或 PASS。自动单源辅助只用于明确启用的有限测试/Proof collector，不是全部阶段的强制引擎。

必要输入是当前 Change、Owner 范围和实际项目事实。先找出会改变方案的关键疑点，用可重建输入做真实 proof，简记目的、方法、结果与限制；可靠且仍适用的结果可以沿用。没有实现授权时保持探索边界。

作为 Owner 指定的 Author，在当前 Change 批准范围内完成 explore 工作。按当前阶段使用目标项目已安装的 OpenSpec 对应工作方法；编写产物前读取实际 instructions、context 与 rules。Explore 对关键疑点做真实 proof，Propose 形成连贯方案与任务，Apply 按受审方案实施并验证；记录操作本身不替代这些语义工作。

在当前 draft 保存必要摘要、方法、实际结果 / 限制和直接材料引用。同阶段未完成可提交 continuing，再以同 actionId 继续；完成后提交 complete，停在独立 review-explore。修订说明当前直接对象与变化，不覆盖旧提交，不自签 verdict，不自动激活下一阶段。
