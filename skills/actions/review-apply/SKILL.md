---
name: mendi-review-apply
phase: apply
role: reviewer
---

# review-apply 阶段方法

独立审核使用本自有方法；`methods.upstream` 无强制 Author 方法。按当前变化核对实际实现、来源及 operation instructions，不执行 Apply Author 写入流程代替审核；目标方法交接与语义完成分别以返回内容和实际结果判断。

必要输入是固定 Author 提交、受审合同、实际实现与直接验证结果。核对变更行为、失败路径与既有兼容性，按风险重跑关键测试；工具通过只证明其覆盖范围。修订补审关注变化与受影响部分，保留旧 verdict。

UI 范围按需读取 Storybook 指导，核对目标 / 版本、预览归属与有限测试退出、修改后的新浏览器观察及结果。根工程与独立 UI 目标各自 typecheck 不可漏验；MCP 只认证宿主实际发现 / 调用能力，未启用时核对无 MCP 主路径，Storybook review URL 不代替本次独立审核。

普通 UI 调整不新建 Change，不因旧名称 / 路径机械否决。独立核对定位更新是否仍通过当前真实入口作用于正确对象，保留原用户场景、业务及必要技术断言、原失败和清理；拒绝以强制点击、吞错、删场景或放宽断言制造通过。正常入口可达与直达 / 刷新 / 授权分别核对，后端或 URL 可用不能替代真实用户操作；页面合并丢失历史入口、滚动影响目标所需键盘 / 移动能力或 PDF 明确功能都须说明影响和验证，不强加无关设备矩阵。必要 DOM 保持 / 布局 / 无整页刷新断言不能借定位修复删除；权限、默认值、确认及 Owner 明确 UI 验收承诺仍须成立，重要未知不能由模型补造或仅用 design 备注豁免。方法加载 / 测试绿不认证上述语义，不倒改旧归档、Run 或 verdict。

product 当前 Review Apply 可显式读取 `action instructions --action <当前 ID> --operation apply`，核对实际任务和当前操作输入；该只读输出不替代固定 Author、受审合同或 Reviewer 判断。必要直接对象缺失、路径 / 身份不一致时阻断对应审核操作，不以旧批准继续。

在当次审核摘要列出 src / tests / scripts 各自维护代码物理行数最多的前三名（不足三个列全部），根据可靠的本轮基准说明明显增长、职责是否混杂及处理结论；没有可靠基准不造增长。当前继续扩展的混杂职责先整理，核对其回归覆盖，不为压行数拆纯转发层。不设硬行数、容量或 hash gate，不建立独立维护台账或查询依赖。

旧 C / D Explore proof 未继续扩展时保留限定事实；新的产品验收必须进分组测试。较长完整流程说明适用范围及下次整理触发条件，不能只因行数改写历史。若确需扩展旧 proof，先分离 Apply 记录与 Archive 效果组，再保留简单 TypeScript 入口和旧输出。

作为 Owner 指定的独立 Reviewer，读取本 Action 固定的 authorRunRef，核对该提交的范围、阶段材料、结果与限制；按风险查看实际对象或重跑关键检查。不得修改实现后自行批准，不把工具成功或文件齐备当作批准。

同一审核继续时保存 continuing，继续沿用相同 actionId 和 Author 对象。完成时给出 approved、changes-requested 或 rejected，记录必要 findings 与限制，再提交 complete，停在 next 所表达的边界，不自动执行后续工作。
