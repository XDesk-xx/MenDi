# Proposal

## Why

当前自有阶段方法尚未明确区分稳定业务承诺、当前 UI 方案与未决产品决定；Reviewer 又不必继承 Author 的上游方法，仅靠上游通用澄清指引不足以形成共同尺度。需要避免既把菜单、页面和文案固化为长期业务要求，又以“后端未改 / 测试绿”掩盖默认行为、权限、确认和可达性变化。

## What Changes

- 收敛自有 Explore / Propose 与对应独立 Review 方法：业务承诺写入 specs，当前信息架构与交互方案写入 design，任务和验证核对实际用户结果。
- 落实 Owner 已确认的边界：普通 UI 调整不新建 Change，不因旧规格出现菜单 / 按钮 / 路径名称机械要求新 Change；真正业务承诺或明确验收约束的未决变化按实际影响澄清，沿用现有项目流程。
- 主动澄清适用于 UI 与非 UI：先查事实和已确认决定，关键未知向 Owner 提具体问题及影响 / 建议；答案未到只暂停依赖部分，不把假设或等待冒充批准。
- 在 Apply / Review Apply 补充定位修复尺度：保留原用户场景、必要技术断言、失败和清理，正常入口与直达 / 刷新 / 授权分别验证，不靠强制点击、吞错或删场景制造通过。
- 用实际方法交接核对和代表情形的语义审核验收；不增自动分类器、CLI 字段、问答台账、审批阶段、默认 Storybook 依赖或全量历史重测。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `action-runs`：扩充阶段方法对业务 / UI 边界、主动澄清和独立审核共同尺度的职责；保持已有记录、角色和交接机制。
- `storybook-integration`：补充 UI 定位更新、真实正常入口及必要技术断言的验证边界，不改变工具、服务归属与可选接入合同。

## Impact

预计修改六份 `skills/actions/` 阶段方法、相关 TypeScript 方法交接测试及必要当前使用说明。`skills/tools/storybook/` 仅保留已有工具执行职责，不复制新的通用判断长文；当前未发现需要修改 `src/`、上游 `.agents/skills/` 或持久记录格式。

依据固定 Author017 与独立批准018，交接 proof 只证明现有传递可用，未认证宿主会判断业务语义。普通 UI 的日常设计 / 定位更新不新增 MenDi Change 或 Action 要求；本 C 则是 Owner 已授权的方法能力交付。

不修改 DreMo、稳定安装、旧归档 / Run / verdict、主规格或包版本；发布候选、正式 Full Test / Close、Archive 和 Git 各保持后续授权边界。本次产物完成后停独立 Review Propose。
