---
name: mendi-review-explore
phase: explore
role: reviewer
---

# review-explore 阶段方法

以固定 authorRunRef 的实际正文和直接 proof 为对象，可读取当前 proposal 背景 instructions / context / rules，核对关键实验是否真正支持结论以及约束是否落实。可靠旧结果可沿用，按变化重放必要疑点。不要从 sentinel、工具 PASS、方法已加载或材料数量推导 approved。

新 Explore 分析在 Run / artifacts，已有受审 explore.md 保留。handoff 只承接未完成审核的笔记、保持固定 Author；接收 Reviewer 重新独立判断，不继承 verdict 或让 Author 重做。Actor 声明不认证真人独立性。

必要输入是固定 Author 提交、当前范围与直接 proof 材料。核对关键疑点是否实际验证、结果能否支撑下一步方案，以及限制是否明确；重放影响结论的疑点，不要求重跑全部历史。

作为 Owner 指定的独立 Reviewer，读取本 Action 固定的 authorRunRef，核对该提交的范围、阶段材料、结果与限制；按风险查看实际对象或重跑关键检查。不得修改实现后自行批准，不把工具成功或文件齐备当作批准。

同一审核继续时保存 continuing，继续沿用相同 actionId 和 Author 对象。完成时给出 approved、changes-requested 或 rejected，记录必要 findings 与限制，再提交 complete，停在 next 所表达的边界，不自动执行后续工作。
