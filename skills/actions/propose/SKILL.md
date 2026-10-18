---
name: mendi-propose
phase: propose
role: author
---

# propose 阶段方法

定稿前复核已有事实、Owner 决定与关键未决项。specs 描述稳定业务承诺，design 承载当前菜单 / 布局 / 文案 / 页面与交互选择，tasks / 验证核对实际用户结果。普通 UI 调整不新建 Change，也不额外增加 Action / Run；旧名称或路径不机械冻结 UI。仍须保留权限、正确对象、完整性、状态 / 保存 / 发布 / 确认、历史及失败处理，以及 Owner 明确具有验收意义的 UI 要求；不能仅以 design 说明豁免真正承诺，不回改旧归档、Run 或 verdict。

UI 或非 UI 的关键产品未知须先查事实和已确认回答；会影响目标、角色、范围、流程、权限、默认值、数据保留、兼容 / 历史、不可逆后果或验收时，向 Owner 问具体决定及影响，给有依据的建议。答案未到只暂停依赖定稿，不将假设、沉默或等待写成批准，也不留给 Apply 猜测；低影响可逆细节自行处理并简记，已确认决定不重复问，不设统一问答台账或额外审批。将有效答案落实到范围、specs / design / tasks 与验收的一致性。例如默认截止需核对时区 / 显示 / 请求值与服务器条件，“草稿”改“发布”须看用户理解和确认语义，不能只看 handler 相同或测试绿。

首次 Propose 从 `methods.upstream` 取得当前目标 openspec-propose 的实际正文，当前 Change 已绑定：跳过 new change，只复用上下文检查与按 instructions / 依赖编写产物的片段，包括同 Action continue。revise-propose 使用 openspec-update-change 的已有产物修订规则与适用 glob 新增条件；不能用它代替首次缺失产物创建，不适用的缺项明确报告。正文来源与生成基线必须可读，方法返回不表示产物已创建或已批准。

按当前 Action 请求 proposal / specs / design / tasks instructions，读取已完成的直接依赖和实际产物内容。dependencies.done=false 时先处理该必要前置，不声称已满足，也不要求所有 artifact ready 才能读指引。outputPath 的 specs glob 是输出模式；template 是结构指导，context 与当前 artifact rules 必须进入实际决策。

说明约束怎样影响范围、输入与任务，例如目标要求“不自动安装”时，将缺工具定义为失败并写入场景与验证任务。proposal、design、delta 和 tasks 保持一致；有效 Explore 结论从 Run 承接，不新增或改写 explore.md，不以文件齐备推导批准。

必要输入是当前 Change、已完成 Explore 与其独立结论。用已确认事实形成 proposal、design、delta specs 和可实施任务，说明必要输入、验证方式与范围限制；按上游依赖及实际 instructions 编写并验证结构，不把文件齐备当作方案批准。

作为 Owner 指定的 Author，在当前 Change 批准范围内完成 propose 工作。按当前阶段使用目标项目已安装的 OpenSpec 对应工作方法；编写产物前读取实际 instructions、context 与 rules。Explore 对关键疑点做真实 proof，Propose 形成连贯方案与任务，Apply 按受审方案实施并验证；记录操作本身不替代这些语义工作。

在当前 draft 保存必要摘要、方法、实际结果 / 限制和直接材料引用。同阶段未完成可提交 continuing，再以同 actionId 继续；完成后提交 complete，停在独立 review-propose。修订说明当前直接对象与变化，不覆盖旧提交，不自签 verdict，不自动激活下一阶段。
