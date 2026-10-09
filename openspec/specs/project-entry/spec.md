# project-entry Specification

## Purpose
让 MenDi 的每次项目操作都对应明确的目标根与选定的外部 OpenSpec，保留目标项目已有规则和配置，并向调用者提供可判断的真实结果、拒绝原因及准备建议，避免命令成功却读写了其他项目。

## Requirements

### Requirement: Explicit project target

除帮助外，项目命令 MUST 要求 `--project <path>`，解析并展示目标规范路径；系统 SHALL 拒绝不存在的目录、缺少本地 OpenSpec 配置的目标，以及上游实际 root 与目标不一致的情况，不静默采用祖先项目。

#### Scenario: Explicit root from another working directory
- **WHEN** 调用者从其他目录使用 `--project` 指向已配置的真实项目根
- **THEN** 操作以该项目根执行，结果展示同一规范路径，不依赖调用者当前目录选择项目

#### Scenario: Nested directory is not a configured project
- **WHEN** 显式目标是某个 OpenSpec 项目的子目录，且该子目录无本地配置
- **THEN** 系统报告目标未准备和具体配置路径，不读写祖先 MenDi 状态，也不自动初始化

#### Scenario: Bare openspec directory resolves to an ancestor
- **WHEN** 目标只有空 `openspec/` 目录，或上游实际 root 指向祖先目录
- **THEN** 系统拒绝该目标并保留文件，不能把祖先 root 作为本次操作目标

### Requirement: Supported local configuration

系统 SHALL 在读取上游事实及执行写入前独立检查目标的本地 YAML 配置；优先使用 `config.yaml`，仅其不存在时使用 `config.yml`。配置 MUST 是映射，schema 缺省或为 `spec-driven`；存在 `store` 声明、其他 schema 或解析错误时 SHALL 报告来源并拒绝操作。

#### Scenario: Valid existing configuration is preserved
- **WHEN** 项目已有有效 context、rules 和操作 guidance
- **THEN** 接入与查询保持配置、AGENTS 和 README 原字节，上游继续从原配置读取项目指导

#### Scenario: Store declaration exists beside local planning structure
- **WHEN** 配置声明 store，且本地 `openspec/changes/` 足以让上游 `list` 返回成功
- **THEN** 系统仍报告不支持的 store 来源，不改用本地模式或默认 store

#### Scenario: Invalid primary configuration
- **WHEN** `config.yaml` 损坏，同时存在有效 `config.yml`
- **THEN** 系统报告主配置解析错误，不退回第二个文件，也不改变原文件

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

### Requirement: Basic maintained-code checks

项目 SHALL 为维护中源码、测试和脚本统一格式并提供基础 lint；普通 check MUST 聚合格式检查、lint 与现有 TypeScript 类型检查。检查 SHALL 排除历史 Run、生成物及字节敏感夹具，不设文件行数门槛，不通过检查失败追加历史补证流程或 hash gate。

#### Scenario: Maintained code needs formatting or lint repair
- **WHEN** 维护中 TypeScript 文件格式或基础 lint 不通过
- **THEN** check 非零退出并指出具体问题；修正后原有类型检查与相关回归仍执行，不要求改写历史证据

#### Scenario: Proof reports and unchanged-file comparisons
- **WHEN** 生成新 proof 结果或执行目标文件保留回归
- **THEN** 新 proof 不输出无消费者的 scriptSha256，旧证据保持原样，测试中验证文件未被修改的字节比较仍保留

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
