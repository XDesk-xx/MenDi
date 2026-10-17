---
name: mendi-apply
phase: apply
role: author
---

# apply 阶段方法

使用 `methods.upstream` 中当前目标 openspec-apply-change 的真实正文及实际 Apply instructions，Apply / revise-apply 都遵守此入口。随包自有方法规定授权与交接；选择 Storybook 仅增加可选指导，不取消目标 Apply 方法。方法缺失、不可读或生成基线不符时新交接写前拒绝，先明确准备当前目标，不自动安装或借其他项目兜底。

必要输入是当前 Change、已批准方案、设计、规格和实际 tasks。按依赖实施，每项行为成立后更新任务；运行针对当前变化的必要检查并保留实际失败 / 修正结果。缺少当前关键输入时明确问题，不猜历史或扩大授权。

UI 范围按需使用产品 Storybook 指导：目标拥有配置 / scripts / stories，宿主执行实际工具连接。分别记录持续预览与有限测试，核对本次 / 外部 / 未知服务归属，修改后获取新结果；缺工具或 MCP 未启用按事实说明，不自动安装，不为非 UI 目标增加依赖。

product 当前 Apply / revise-apply 可显式读取 `action instructions --action <当前 ID> --operation apply`。它与 `--artifact` 二选一，只返回真实 contextFiles、tasks（done / sourcePath / line）、progress / state、instruction 和可选 context / operationGuidance；blocked 明确缺失，ready / all_done 不代表实施、批准或任务被自动修改。人工 bootstrap 不使用产品写入命令迁移记录。

作为 Owner 指定的 Author，在当前 Change 批准范围内完成 apply 工作。按当前阶段使用目标项目已安装的 OpenSpec 对应工作方法；编写产物前读取实际 instructions、context 与 rules。Explore 对关键疑点做真实 proof，Propose 形成连贯方案与任务，Apply 按受审方案实施并验证；记录操作本身不替代这些语义工作。

在当前 draft 保存必要摘要、方法、实际结果 / 限制和直接材料引用。同阶段未完成可提交 continuing，再以同 actionId 继续；完成后提交 complete，停在独立 review-apply。修订说明当前直接对象与变化，不覆盖旧提交，不自签 verdict，不自动激活下一阶段。

产品写入须为可写 version 2；Action / Run 沿 planningSlot 的唯一轮次及原 batchId 归属，首次实际 Run 才建批次，不移动旧轮成员或给旧 Run 补 roundId。旧 product 的只读 instructions 保持可用，保存 / 提交 / 继续必须先获授权迁移；迁移保留的旧 draft 继续使用原 Action、actor 和固定 Author，不因格式收据切换阶段。

Owner 可显式 handoff 未完成 Apply / Review Apply，或对当前 rejected Review Apply 选择同阶段 revise；更早阶段回退必须显式 rollback，指定当前 Run、较早阶段及完整直接 Author。回退创建新的目标 Author 修订，完成后重新独立审核并顺序继续，不删除已有实现，不沿用过去批准跳段。CLI actor 只记录责任标签，实际授权仍来自 Owner。
