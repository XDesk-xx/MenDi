# Spec Delta

## ADDED Requirements

### Requirement: Selected operation instructions protocol

系统 SHALL 从选定 OpenSpec 1.14.1 的公开 instructions 读取 Apply / Archive 指引并核对明确根、Change 与实际 schema。Apply MUST 保留具体 contextFiles、tasks / progress / state、instruction 和可选缺失列表 / context / operationGuidance；Archive MUST 保留实际 root / Change / context / guidance，不要求没有返回的 artifact 字段。实际输入路径及必要类型 MUST 校验，未知扩展不递归读取。

#### Scenario: Apply instructions report concrete tracking inputs
- **WHEN** 固定工具返回当前 Apply 的 blocked / ready / all_done 与具体上下文文件、任务和进度
- **THEN** 返回这些真实字段，校验上下文 / task source 路径位于当前 Change 和身份一致，blocked 的缺失文件不会被伪报存在或自动创建

#### Scenario: Archive instructions omit artifact and schema fields
- **WHEN** 固定工具 Archive instructions 提供根、Change 和操作 guidance，但不提供 schemaName / template / outputPath
- **THEN** 必要 schema 由该 Change 的真实 status 核对，返回实际 guidance，不以臆造字段满足 artifact 解析器

#### Scenario: Operation output is malformed or unsafe
- **WHEN** 上游身份、root、必要状态 / 进度 / 路径不符，guidance 类型错误，或路径越界 / 经链接指向项目外
- **THEN** 非零退出并指出实际协议问题，不写记录或调用归档，不退回 PATH / 其他工具，也不把未知 Ref 作为全历史依赖

### Requirement: Honest native archive result and local finish mode

系统 SHALL 保留原生 Archive 的完整调用、退出 / 信号、必要 stdout / stderr，并分别处理成功的 archive 包装对象与失败的 archive:null / status 输出。成功 MUST 核对实际 root、Change、archivedAs / path、specsUpdated 及实际材料，不能凭响应完整就认定本地提交成功。仅本地 finish SHALL 明示 local-only 与未访问上游，不调用旧 Change status、原生归档或自动换工具。

#### Scenario: Native success uses the public response wrapper
- **WHEN** 固定入口 exit 0，公开 JSON 返回 archive 对象与 nearest root
- **THEN** 读取包装内真实 Change、日期名 / 绝对位置与同步结果，核对受管目录及当前 delta 效果后分别报告原生与本地完成状态

#### Scenario: A native command errors or its response cannot be used
- **WHEN** 原生返回非零 / 超时 / 非 JSON / archive:null / 错身份，或 root / 路径不合法
- **THEN** 保留原始命令结果并返回失败，不从非零推断未同步或未移走，不伪造有效归档响应

#### Scenario: Local finish does not require a running upstream tool
- **WHEN** 当前同一 Archive 的必要本地输入与可确认效果有效，用户显式请求 finish，选定工具暂时不可用
- **THEN** 只核对并提交本地收口，openspec 为 null、executionMode 为 local-only、upstreamAccess 为 not-required，不声称本次验证工具版本 / 上游状态
