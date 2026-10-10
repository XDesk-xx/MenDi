---
name: mendi-review-apply
phase: apply
role: reviewer
---

# review-apply 阶段方法

必要输入是固定 Author 提交、受审合同、实际实现与直接验证结果。核对变更行为、失败路径与既有兼容性，按风险重跑关键测试；工具通过只证明其覆盖范围。修订补审关注变化与受影响部分，保留旧 verdict。

product 当前 Review Apply 可显式读取 `action instructions --action <当前 ID> --operation apply`，核对实际任务和当前操作输入；该只读输出不替代固定 Author、受审合同或 Reviewer 判断。必要直接对象缺失、路径 / 身份不一致时阻断对应审核操作，不以旧批准继续。

在当次审核摘要列出 src / tests / scripts 各自维护代码物理行数最多的前三名（不足三个列全部），根据可靠的本轮基准说明明显增长、职责是否混杂及处理结论；没有可靠基准不造增长。当前继续扩展的混杂职责先整理，核对其回归覆盖，不为压行数拆纯转发层。不设硬行数、容量或 hash gate，不建立独立维护台账或查询依赖。

旧 C / D Explore proof 未继续扩展时保留限定事实；新的产品验收必须进分组测试。较长完整流程说明适用范围及下次整理触发条件，不能只因行数改写历史。若确需扩展旧 proof，先分离 Apply 记录与 Archive 效果组，再保留简单 TypeScript 入口和旧输出。

作为 Owner 指定的独立 Reviewer，读取本 Action 固定的 authorRunRef，核对该提交的范围、阶段材料、结果与限制；按风险查看实际对象或重跑关键检查。不得修改实现后自行批准，不把工具成功或文件齐备当作批准。

同一审核继续时保存 continuing，继续沿用相同 actionId 和 Author 对象。完成时给出 approved、changes-requested 或 rejected，记录必要 findings 与限制，再提交 complete，停在 next 所表达的边界，不自动执行后续工作。
