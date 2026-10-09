---
name: mendi-propose
phase: propose
role: author
---

# propose 阶段方法

必要输入是当前 Change、已完成 Explore 与其独立结论。用已确认事实形成 proposal、design、delta specs 和可实施任务，说明必要输入、验证方式与范围限制；按上游依赖及实际 instructions 编写并验证结构，不把文件齐备当作方案批准。

作为 Owner 指定的 Author，在当前 Change 批准范围内完成 propose 工作。按当前阶段使用目标项目已安装的 OpenSpec 对应工作方法；编写产物前读取实际 instructions、context 与 rules。Explore 对关键疑点做真实 proof，Propose 形成连贯方案与任务，Apply 按受审方案实施并验证；记录操作本身不替代这些语义工作。

在当前 draft 保存必要摘要、方法、实际结果 / 限制和直接材料引用。同阶段未完成可提交 continuing，再以同 actionId 继续；完成后提交 complete，停在独立 review-propose。修订说明当前直接对象与变化，不覆盖旧提交，不自签 verdict，不自动激活下一阶段。
