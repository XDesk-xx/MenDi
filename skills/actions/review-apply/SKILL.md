---
name: mendi-review-apply
phase: apply
role: reviewer
---

# review-apply 阶段方法

必要输入是固定 Author 提交、受审合同、实际实现与直接验证结果。核对变更行为、失败路径与既有兼容性，按风险重跑关键测试；工具通过只证明其覆盖范围。修订补审关注变化与受影响部分，保留旧 verdict。

作为 Owner 指定的独立 Reviewer，读取本 Action 固定的 authorRunRef，核对该提交的范围、阶段材料、结果与限制；按风险查看实际对象或重跑关键检查。不得修改实现后自行批准，不把工具成功或文件齐备当作批准。

同一审核继续时保存 continuing，继续沿用相同 actionId 和 Author 对象。完成时给出 approved、changes-requested 或 rejected，记录必要 findings 与限制，再提交 complete，停在 next 所表达的边界，不自动执行后续工作。
