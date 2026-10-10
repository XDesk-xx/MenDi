---
name: mendi-propose
phase: propose
role: author
---

# propose 阶段方法

按当前 Action 请求 proposal / specs / design / tasks instructions，读取已完成的直接依赖和实际产物内容。dependencies.done=false 时先处理该必要前置，不声称已满足，也不要求所有 artifact ready 才能读指引。outputPath 的 specs glob 是输出模式；template 是结构指导，context 与当前 artifact rules 必须进入实际决策。

说明约束怎样影响范围、输入与任务，例如目标要求“不自动安装”时，将缺工具定义为失败并写入场景与验证任务。proposal、design、delta 和 tasks 保持一致；有效 Explore 结论从 Run 承接，不新增或改写 explore.md，不以文件齐备推导批准。

必要输入是当前 Change、已完成 Explore 与其独立结论。用已确认事实形成 proposal、design、delta specs 和可实施任务，说明必要输入、验证方式与范围限制；按上游依赖及实际 instructions 编写并验证结构，不把文件齐备当作方案批准。

作为 Owner 指定的 Author，在当前 Change 批准范围内完成 propose 工作。按当前阶段使用目标项目已安装的 OpenSpec 对应工作方法；编写产物前读取实际 instructions、context 与 rules。Explore 对关键疑点做真实 proof，Propose 形成连贯方案与任务，Apply 按受审方案实施并验证；记录操作本身不替代这些语义工作。

在当前 draft 保存必要摘要、方法、实际结果 / 限制和直接材料引用。同阶段未完成可提交 continuing，再以同 actionId 继续；完成后提交 complete，停在独立 review-propose。修订说明当前直接对象与变化，不覆盖旧提交，不自签 verdict，不自动激活下一阶段。
