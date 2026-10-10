---
name: mendi-apply
phase: apply
role: author
---

# apply 阶段方法

必要输入是当前 Change、已批准方案、设计、规格和实际 tasks。按依赖实施，每项行为成立后更新任务；运行针对当前变化的必要检查并保留实际失败 / 修正结果。缺少当前关键输入时明确问题，不猜历史或扩大授权。

product 当前 Apply / revise-apply 可显式读取 `action instructions --action <当前 ID> --operation apply`。它与 `--artifact` 二选一，只返回真实 contextFiles、tasks（done / sourcePath / line）、progress / state、instruction 和可选 context / operationGuidance；blocked 明确缺失，ready / all_done 不代表实施、批准或任务被自动修改。人工 bootstrap 不使用产品写入命令迁移记录。

作为 Owner 指定的 Author，在当前 Change 批准范围内完成 apply 工作。按当前阶段使用目标项目已安装的 OpenSpec 对应工作方法；编写产物前读取实际 instructions、context 与 rules。Explore 对关键疑点做真实 proof，Propose 形成连贯方案与任务，Apply 按受审方案实施并验证；记录操作本身不替代这些语义工作。

在当前 draft 保存必要摘要、方法、实际结果 / 限制和直接材料引用。同阶段未完成可提交 continuing，再以同 actionId 继续；完成后提交 complete，停在独立 review-apply。修订说明当前直接对象与变化，不覆盖旧提交，不自签 verdict，不自动激活下一阶段。

Owner 可显式 handoff 未完成 Apply / Review Apply，或对当前 rejected Review Apply 选择同阶段 revise；更早阶段回退必须显式 rollback，指定当前 Run、较早阶段及完整直接 Author。回退创建新的目标 Author 修订，完成后重新独立审核并顺序继续，不删除已有实现，不沿用过去批准跳段。CLI actor 只记录责任标签，实际授权仍来自 Owner。
