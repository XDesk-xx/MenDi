# Proposal

## Why

现有 CLI 能保存 Delivery 与首个 Change 关联，但 Action、Run 和 Author / Reviewer 交接仍靠人工记录，跨进程继续时无法由产品明确当前进展与审核对象。已获独立批准的 Explore proof 支持以直接 Run 记录建立最小协作基础，当前需要把输入边界、提交顺序与 Reviewer 继续规则落实为可实施合同。

## What Changes

- 增加显式 `action start` / `action continue` 与 `run save` / `run submit`，保存轻量 Action 身份、角色、阶段方法和 Markdown 进展；draft 可保存，提交后不覆盖，同一未完成 Action 可多 Run。
- Run 在整个 Delivery 内连续占号，沿用 Delivery 操作与 Changes 批次同级布局；独占写入、部分失败与空占号保留并明确诊断。
- 产品 binding 仅用 `latestRunRef` 定位当前 Run，查询不解析全部历史头部；审核开始固定当前完整 Author 提交，Reviewer 后续继续沿用该对象，不把最新 Reviewer Run 错当成 Author。
- 按 Action 类型 / 角色选择产品阶段 Skill，并按明确请求读取 OpenSpec 工具指导；这些方法指导 Agent 手动工作，命令成功不意味着语义完成或审核批准。
- 增加最小 verdict / next 交接，修订创建新 Action，保留原提交；人工 bootstrap 仍只读，不强制迁移历史，也不通过产品自动激活第二 Change。
- 查询顺带区分“尚未关联”和“已归档、当前无活动 Change”，保留历史 / 未知 Ref 不阻断查询的已批准行为。

## Capabilities

### New Capabilities

- `action-runs`: Action 方法选择、当前进展、Run 分配 / 保存 / 提交、同 Action 继续及直接 Author / Reviewer 交接。

### Modified Capabilities

- `delivery-workspace`: 产品查询读取当前 Run，必要输入按操作扩展；人工查询保持原边界，归档无活动 Change 的人读说明更准确。

## Impact

预计影响 `src/core/records.ts` 及 Action / Run 规则、`src/application/` 工作操作、文件适配器、CLI 参数与显示、产品 `skills/actions/` / `skills/tools/`、相关测试与 README。沿用 YAML 与现有依赖，不新增编排平台、引用注册中心、认证服务、hash 清单或 gate。

本 Change 交付协作记录与方法接线；D01-C / D01-D 的真实阶段语义执行、完整回退、原生 Archive Action，以及正式 Delivery Full Test / Close / Reopen、Git 和下一 Change 激活均保持后续边界。当前人工会话继续用人工 Run 完成本 Change，不能用尚未实现的命令为自己补造产品执行事实。
