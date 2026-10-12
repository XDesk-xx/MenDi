# Spec Delta

## MODIFIED Requirements

### Requirement: Stage skill and requested guidance

系统 SHALL 按 Action 类型和角色选择固定的产品阶段 Skill，修订使用相应 Author 阶段方法；必要工具指导 SHALL 仅按明确请求读取。开始 / 继续时 MUST 返回实际文件位置与内容，缺失、不可读或阶段身份矛盾时失败。Change Action SHALL 支持明确选择 Storybook 指导并持久读回该选择，未选择时不读取。方法选择和文件读取 SHALL 不被表述为已经执行该方法或完成工作，也不自动安装 / 启动工具或认证能力。

#### Scenario: Author and reviewer use different methods
- **WHEN** 用户分别开始 explore 与 review-explore，并明确请求 openspec 工具指导
- **THEN** 返回各自角色对应的产品阶段 Skill 及实际 OpenSpec 指导，Run 保存所选方法标识，审核不使用 Author 方法代替独立检查

#### Scenario: Required method is missing
- **WHEN** 当前操作选择的阶段 Skill 或明确请求的工具指导不存在、不可读或不匹配阶段
- **THEN** 操作失败且未分配新 Run；普通 status / next 不因不读取的方法文件失效而失败

#### Scenario: Explicitly select Storybook guidance
- **WHEN** Change Action 明确选择 Storybook 工具指导，所需方法有效
- **THEN** 返回固定角色阶段方法与该指导的实际文件 / 内容，Run 持久保存选择，继续与读回保持一致；不因此执行 CLI、启动服务或给出审核批准

#### Scenario: Existing runs and unselected guidance remain usable
- **WHEN** 旧 Run 的指导为空或 openspec，或当前操作未选择 Storybook 且其指导文件不存在
- **THEN** 正常读取对应必要方法及旧 Run，不强制补字段 / 文件；未使用的 Storybook 或 MCP 不成为查询依赖

#### Scenario: Reject invalid guidance before writing
- **WHEN** 请求未知 / 重复的指导或所选 Storybook 指导的身份与正文无效
- **THEN** 在分配 Run / 更新交接前拒绝，并保留旧记录及 verdict，不放宽受管路径和角色检查
