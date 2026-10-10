# Spec Delta

## MODIFIED Requirements

### Requirement: Explicit project target

除帮助外，项目命令 MUST 要求 `--project <path>`，解析并展示目标规范路径；系统 SHALL 拒绝不存在的目录、缺少本地 OpenSpec 配置的目标，以及依赖上游时实际 root 与目标不一致的情况，不静默采用祖先项目。

#### Scenario: Explicit root from another working directory
- **WHEN** 调用者从其他目录使用 `--project` 指向已配置的真实项目根
- **THEN** 操作以该项目根执行，结果展示同一规范路径，不依赖调用者当前目录选择项目

#### Scenario: Nested directory is not a configured project
- **WHEN** 显式目标是某个 OpenSpec 项目的子目录，且该子目录无本地配置
- **THEN** 系统报告目标未准备和具体配置路径，不读写祖先 MenDi 状态，也不自动初始化

#### Scenario: Bare openspec directory resolves to an ancestor
- **WHEN** 目标只有空 `openspec/` 目录，或上游实际 root 指向祖先目录
- **THEN** 系统拒绝该目标并保留文件，不能把祖先 root 作为本次操作目标

#### Scenario: Test operations use an explicit local target
- **WHEN** 在其他目录执行 test list / run / status，目标有合法本地 OpenSpec 配置和该操作的实际必要输入
- **THEN** 以同一规范目标根读取 package / 本地执行记录或执行脚本，不读取祖先配置或状态；不声称校验本次未调用的上游 root

### Requirement: Selected external OpenSpec

系统 SHALL 对依赖上游的操作通过选定的外部 OpenSpec 公开 CLI 接入，确认版本 1.14.1、root source 为 `nearest`、Change 为 repo-local `spec-driven`，展示实际入口；工具不可用、版本或来源不支持 MUST 失败，不使用 PATH 或自动安装替代。保存本地 draft、只读本地诊断及 test list / run / status SHALL 不启动上游进程，仍校验明确目标、本地配置和实际必要记录，不伪报工具已验证。

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

#### Scenario: Local test execution does not consume OpenSpec facts
- **WHEN** 固定 OpenSpec 暂不可用，但本地 test 操作的明确目标、配置和实际必要输入有效
- **THEN** list / status 不依赖该工具，run 只另外检查选定测试工具和运行前置；结果明确 local-only、openspec:null、upstreamAccess:not-required，不伪报上游版本 / root / 阶段已验证

