## MODIFIED Requirements

### Requirement: Selected external OpenSpec

系统 SHALL 对依赖上游的操作通过选定的外部 OpenSpec 公开 CLI 接入，确认版本 1.14.1、root source 为 `nearest`、Change 为 repo-local `spec-driven`，展示实际入口；工具不可用、版本或来源不支持 MUST 失败，不使用 PATH 或自动安装替代。仅保存本地 draft 与只读本地诊断 SHALL 不启动上游进程，仍校验明确目标、本地配置和实际必要记录，不伪报工具已验证。

#### Scenario: Supported fixed installation
- **WHEN** 使用已选定的稳定安装入口执行 `list`、`status` 或读取项目指导
- **THEN** 系统传递显式目标根和完整参数，解析公开机器输出，不依赖 OpenSpec 内部模块

#### Scenario: Wrong or missing executable
- **WHEN** 依赖上游的操作指定的入口不存在或实际版本不同于 1.14.1
- **THEN** 系统报告入口与实际原因，操作非零退出且不写入目标

#### Scenario: Unknown change is requested
- **WHEN** Open 或关联请求指定的 Change 不在目标的上游 list 中
- **THEN** 系统报告 Change 不存在，不创建 Change、不创建关联、不改写已有记录

#### Scenario: Local operation does not require a running tool
- **WHEN** 保存合法当前 draft 或只读诊断本地 product 现场，而固定工具不可用
- **THEN** 操作仅按本地必要输入判断，结果明确未访问上游；不得声称版本、上游 root 或 Change 状态已验证，正式提交及其他上游操作仍拒绝不可用工具

### Requirement: Honest command results

系统 SHALL 提供中文简短输出及 `--json`；成功 MUST 包含明确目标和实际执行模式，依赖上游时包含真实工具信息，本地操作明确未访问上游。失败 MUST 包含错误代码、原因和修正提示。启动失败、超时、非零退出、非 JSON 或缺少必要字段的上游结果 SHALL 非零退出，不解释为有效业务状态；诊断收集到的现场 SHALL 不表示写入成功或可自动恢复。

#### Scenario: Malformed upstream machine response
- **WHEN** 上游返回非 JSON、缺少 root 或不符合所需命令的字段结构
- **THEN** 系统报告协议错误及相关命令信息，不声称 Open 或查询成功

#### Scenario: External command fails
- **WHEN** 外部进程启动失败、超时、被信号终止或返回非零退出码
- **THEN** 系统保留实际退出或运行错误信息及必要 stdout / stderr，向调用者返回失败

#### Scenario: Help is safe
- **WHEN** 用户只请求帮助或输入未支持的命令
- **THEN** 帮助无需访问项目；未支持命令报告用法错误且不初始化、推进阶段或写入文件

#### Scenario: Local result is distinguished from verified upstream facts
- **WHEN** 本地保存或诊断返回 JSON
- **THEN** 结果标记 local-only、openspec 为 null、上游访问 not-required；不得使用未执行的版本 / root 检查填充成功事实，诊断另说明现场是否完整和普通操作是否被锁阻断

## ADDED Requirements

### Requirement: Complete artifact instructions from the selected target

系统 SHALL 按明确当前 artifact 读取固定 OpenSpec 的公开 instructions，返回真实 instruction、template、输出位置、直接 dependencies 及可选 context / rules。系统 MUST 校验请求的 Change / artifact / schema / root 身份、必要字段与目标内输出及依赖路径；异常时非零退出。读取 SHALL 不写产物、改配置、分配 Run、同步规格或生成批准。

#### Scenario: Read guidance with actual project constraints
- **WHEN** 当前操作显式读取合法 artifact 指引，目标配置包含对应 context / rules
- **THEN** 返回目标实际指引和约束，保留直接依赖的 done 状态与输出 pattern，由 Agent 决定当前工作，不从字段存在推断语义遵循

#### Scenario: Requested artifact or returned paths are inconsistent
- **WHEN** 请求不支持的 artifact，或输出缺必要字段、身份不同、路径越界 / 经 junction 指向外部
- **THEN** 读取失败并指出当前实际问题，目标文件与本地交接保持不变，不回退其他工具或路径

#### Scenario: Unrelated history and extension references are unavailable
- **WHEN** 当前完整 instructions 有效，但历史说明、旧方案或未知 Ref 扩展不可用
- **THEN** 读取当前指引仍成功，不递归解析说明字段或建立全历史依赖注册表
