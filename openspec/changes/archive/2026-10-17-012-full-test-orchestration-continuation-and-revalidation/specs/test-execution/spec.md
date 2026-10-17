## ADDED Requirements

### Requirement: Optional structured group execution contract

系统 SHALL 对显式接入的目标支持有版本的组级计划、执行请求与最终回执，固定项目、Delivery、轮次、尝试、候选、完整计划及实际选择。目标负责真实执行、业务依赖与资源；普通 command 入口保持命令粒度，不从 stdout、事件文本或旧 PASS 猜组事实。未知版本或无法支持的协议 MUST 在实际启动前拒绝，不静默降级。

#### Scenario: Opt into a declared group plan
- **WHEN** 目标已有 full 入口，调用者在授权范围显式选择有效协议、项目内计划与组选择
- **THEN** 锁内固定请求及新执行身份，将受管请求 / 回执位置交给目标，沿既有真实工具、无自动安装与意图先于启动的规则执行

#### Scenario: Reject an ambiguous or unsafe plan
- **WHEN** 组 ID 重复、依赖悬空 / 非前向、自环、选择越界、计划或回执路径离开目标，或请求期间直接输入变化
- **THEN** 明确拒绝对应问题，不猜映射、不覆盖旧结果；写后不确定保留实际现场

#### Scenario: Keep an opaque command opaque
- **WHEN** 未显式接入协议，命令输出含 pass / fail 事件或生成类似结果的文件
- **THEN** 仍只按真实命令合同解释，不自动产生组覆盖或正式汇总结论

### Requirement: Nonvacuous required group coverage

tests 组 SHALL 核对实际选择、完整结束、必需执行计数及执行前明确的非必需排除。未排除业务范围必须实际非空执行，必需 skip / TODO、取消、失败或未完成均不能满足覆盖。构建等 command 组 SHALL 核对其真实命令与声明产物条件，不能用改组种类或事后排除规避失败。覆盖声明 MUST 不宣传为自动业务认证。

#### Scenario: A runner reports success with only skipped and todo tests
- **WHEN** 必需测试组只有 skip / TODO，pass 事件或根 summary.success 为真，包装器退出 0
- **THEN** 保留原事件及命令事实，但组覆盖不成立，不将零业务执行或无 fail 解释为通过

#### Scenario: A group has mixed passes and failures
- **WHEN** 同一文件 / 逻辑组先后出现成功和失败
- **THEN** 最终组不能通过，不能按成功文件集合、第一个或最后一个成功覆盖失败

#### Scenario: Exclusions were declared before execution
- **WHEN** 完整计划已明确非必需项身份及理由，报告能对应其观察与必需计数
- **THEN** 单独展示排除及必需覆盖；失败后新增排除、改变选择或删减必需范围不能沿用原计划结论

#### Scenario: A non-test command group completes
- **WHEN** 构建等组真实结束、必要产物条件已核对，且没有未确认错误
- **THEN** 按该组完成条件解释，不伪造业务断言数；测试组不能改标 command 来跳过未满足的覆盖

### Requirement: Group completion after final lifecycle confirmation

组级事实 SHALL 区分事件、业务测试、容器及整次执行的终态。早期 pass 不能代替实际结束；晚退出 / 错误、取消、未确认进程关闭 / 清理及持久化不确定 MUST 保持相应非通过状态。只有必要回执、日志和终态完整保存读回、当前执行及资源边界确认后，组事实才可供正式消费。

#### Scenario: A process fails after an assertion passed
- **WHEN** 断言已 pass，随后容器退出非零或结束阶段产生错误
- **THEN** 保留早期事件但该组不通过，等待容器与根结束，不把临时成功当最终成功

#### Scenario: Cancellation emits failure events
- **WHEN** 已有部分 pass 后发生明确取消，后续事件标记 aborted / cancelled
- **THEN** 取消与普通断言失败分别解释，停止本轮；未完成尾项没有通过事实，资源停止未确认则保持 unknown

#### Scenario: Terminal persistence fails after child close
- **WHEN** 内存观察曾为 passed，但终态替换 / 读回 / 释放未确认，磁盘仍是不完整状态
- **THEN** 顶层保持 unknown / 不完整与现场，不挑内层 observed 成功用于结论；后续写入仍受原锁 / 未完成状态约束

### Requirement: Agreement of receipts and raw execution

结构化尝试 SHALL 保留实际命令的原 outcome，并独立核对选中范围、组最终回执、整体结束和退出事实的一致性。包装器退出 0 与组失败 / 必需缺口矛盾，或非零退出与未说明的全部成功矛盾时，协议观察 MUST 不可作为通过来源；正常非零与明确组失败可以保留已确认的部分事实，不能掩盖清理或持久化未知。

#### Scenario: The wrapper exits zero while events contain a failure
- **WHEN** 实际执行正常退出 0，但显式协议最终回执含必需失败、缺口或尚未完成
- **THEN** command 原事实仍为实际退出结果，新协议标为矛盾 / 未确认，不能形成通过结论；不解析 stdout 来修正旧 command 历史

#### Scenario: A final receipt is missing or stale
- **WHEN** 只有增量事件，或最终回执缺失 / 重复组 / 身份矛盾 / 使用另一尝试选择或候选
- **THEN** 不确认本次完整组事实，不从另一输出通道、最后事件或旧报告推断成功

### Requirement: Bounded collection under dependencies and resources

显式计划的普通独立失败 SHALL 保留并继续可执行独立后项，前置失败只阻断相关组；通过、失败、blocked、not-run、interrupted、unknown 分别展示。全局取消 MUST 停止本轮；清理或归属未知阻断共享资源后项，无法界定影响时停止相关执行并说明。任一必需项未满足，整体不能通过，不抢陌生资源或自动清锁。

#### Scenario: An independent middle group fails
- **WHEN** 计划中一个普通组失败，后续组不依赖该失败且资源安全
- **THEN** 保留失败，继续后项并收集后续真实问题，结束仍为非通过，最后通过不能覆盖前面的失败

#### Scenario: A build prerequisite fails
- **WHEN** 构建失败而只有部分组声明依赖该构建
- **THEN** 相关组明确 blocked，独立逻辑 / API 等组仍可执行，不把被阻断项伪造为已测失败或通过

#### Scenario: Cleanup is unknown for a shared resource
- **WHEN** 前组的资源清理 / 停止未确认，后组可能复用该资源
- **THEN** 保存现场并阻断共享后项，不凭旧 PID、端口预检或旧 PASS 认领资源；不能限定影响时停止相关执行

#### Scenario: A caller cancels the whole attempt
- **WHEN** 调用者明确取消当前尝试
- **THEN** 不再启动后组，沿原真实前台树停止合同记录 interrupted 或 unknown，不将取消当成可忽略的普通失败

### Requirement: Scoped timing and incremental execution progress

结构化执行 SHALL 报告必要逻辑组 / 昂贵阶段的单调持续时间、UTC 追溯、父子包含与时钟基准，区分整轮墙钟、工作量及可证明的关键路径。未测阶段明确未知；进度采用本次增量事件，不以反复扫全历史或重复搬日志替代。性能优化 MUST 保留真实范围、时间契约、隔离和清理，不设任意性能门槛或承诺无依据收益。

#### Scenario: Nested stages are reported
- **WHEN** 子阶段包含在父包络内，或有不同进程的单调时钟
- **THEN** 显示包含 / 基准关系，不直接叠加为墙钟，不相减不兼容基准、不编百分比或 ETA

#### Scenario: A read-only preparation is reused within an attempt
- **WHEN** 同次执行的输入 / 配置一致、只读产物及服务归属明确，使用者数据 / 上下文独立
- **THEN** 可按目标计划复用并记录实际准备成本；输入变化或适用性未知重新准备，不并发写同一 dist、不使用无来源旧临时产物

#### Scenario: An optimization would weaken a timing assertion
- **WHEN** 提速需要删场景、放宽原业务超时、盲重试或牺牲隔离
- **THEN** 不据此宣称优化成立，先处理真实热点 / 资源规划，保留必要真实到期、取消与预算链路
