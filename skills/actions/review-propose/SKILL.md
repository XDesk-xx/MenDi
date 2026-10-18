---
name: mendi-review-propose
phase: propose
role: reviewer
---

# review-propose 阶段方法

核对 specs 保留稳定业务承诺、design 承载当前 UI 选择、tasks / 验证覆盖实际用户结果；普通 UI 调整不新建 Change，不把旧名称 / 路径 / 页数机械当长期约束。权限、正确对象、完整性、状态 / 保存 / 发布 / 确认、历史和失败处理、必要可达性，以及 Owner 明确具有验收意义的 UI 要求仍须成立；design 备注、handler 相同、后端未改或测试绿不能自动豁免。遇到真实差异先看用户影响和已有决定，不一律要求新 Change，也不回改旧归档 / Run / verdict。

独立追问方案中的重要假设来源：UI / 非 UI 的范围、角色、流程、权限、默认行为、保留、兼容 / 历史、不可逆后果或验收仍未决时，Author 是否先查事实再向 Owner 提具体问题、影响及有依据的建议；答案是否一致进入正式产物，而非留给 Apply 猜测。未答不得因等待而定稿依赖部分，独立调查可继续；已确认决定不重复问，低影响可逆细节不设问卷。使用本自有方法核对，不强加 Author 上游、统一台账或额外审批；结构 / 传递检查不替代上述判断。

独立审核使用本自有方法；`methods.upstream` 无强制 Author 方法。核对当前产物、来源及真实 instructions，不执行 propose / update 的 Author 写入流程代替审核，也不把方法返回或 ready 当作批准。

读取固定 Author 实际正文及其四类产物；按需要请求当前 artifact instructions，核对真实 dependencies、context / rules 在范围、输入、场景、设计和任务中是否一致。例如“不自动安装”须有明确失败行为与测试，而不能只复制约束句子。blocked / done 仅是上游产物事实，strict validate、任务勾选和 sentinel 不替代语义审核。

handoff 保持固定 Author，复制笔记只是未完成进展；接收 Reviewer 独立检查后明确 verdict。rejected 停 Owner，获明确授权的同阶段修订创建新 Author 和新独立 Review，原 verdict 不改。

必要输入是固定 Author 提交及其 proposal、design、delta specs、tasks。独立核对范围一致性、必要输入、行为场景和验证任务是否足以实施，检查关键 proof 的实际适用性；指出阻断项和可保留的限制。

作为 Owner 指定的独立 Reviewer，读取本 Action 固定的 authorRunRef，核对该提交的范围、阶段材料、结果与限制；按风险查看实际对象或重跑关键检查。不得修改实现后自行批准，不把工具成功或文件齐备当作批准。

同一审核继续时保存 continuing，继续沿用相同 actionId 和 Author 对象。完成时给出 approved、changes-requested 或 rejected，记录必要 findings 与限制，再提交 complete，停在 next 所表达的边界，不自动执行后续工作。
