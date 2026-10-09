---
name: mendi-review-propose
phase: propose
role: reviewer
---

# review-propose 阶段方法

读取固定 Author 实际正文及其四类产物；按需要请求当前 artifact instructions，核对真实 dependencies、context / rules 在范围、输入、场景、设计和任务中是否一致。例如“不自动安装”须有明确失败行为与测试，而不能只复制约束句子。blocked / done 仅是上游产物事实，strict validate、任务勾选和 sentinel 不替代语义审核。

handoff 保持固定 Author，复制笔记只是未完成进展；接收 Reviewer 独立检查后明确 verdict。rejected 停 Owner，获明确授权的同阶段修订创建新 Author 和新独立 Review，原 verdict 不改。

必要输入是固定 Author 提交及其 proposal、design、delta specs、tasks。独立核对范围一致性、必要输入、行为场景和验证任务是否足以实施，检查关键 proof 的实际适用性；指出阻断项和可保留的限制。

作为 Owner 指定的独立 Reviewer，读取本 Action 固定的 authorRunRef，核对该提交的范围、阶段材料、结果与限制；按风险查看实际对象或重跑关键检查。不得修改实现后自行批准，不把工具成功或文件齐备当作批准。

同一审核继续时保存 continuing，继续沿用相同 actionId 和 Author 对象。完成时给出 approved、changes-requested 或 rejected，记录必要 findings 与限制，再提交 complete，停在 next 所表达的边界，不自动执行后续工作。
