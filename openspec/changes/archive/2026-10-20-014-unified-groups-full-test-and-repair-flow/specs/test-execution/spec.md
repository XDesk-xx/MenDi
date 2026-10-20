# Spec Delta

## MODIFIED Requirements

### Requirement: Optional structured group execution contract

系统 SHALL 对普通工具调用支持显式接入的组协议；**新的正式 Delivery Full Test MUST 要求 `groups-v1` 协议**，固定项目、Delivery、轮次、候选、完整计划及本次全部必需组选择。目标负责真实执行、业务依赖与资源；普通命令不得自动转成组事实。未知版本或协议不支持 MUST 在启动前拒绝，不静默降级到旧 command。

#### Scenario: Opt into a declared group plan
- **WHEN** 目标已有 full 入口，Owner 授权的正式执行使用有效 `groups-v1`、项目内完整计划以及全部必需组选择
- **THEN** 锁内固定请求及新执行身份，将受管请求和回执位置交给目标，沿既有真实工具、不自动安装及意图先于启动的规则执行

#### Scenario: Reject an ambiguous or unsafe plan
- **WHEN** 组 ID 重复、依赖悬空 / 非前向、自环、选择越界或少必需组、计划或回执路径越界，或请求期间直接输入变化
- **THEN** 拒绝、不产生正式通过；写后不确定保留现场，不能回退到旧 command

#### Scenario: Keep an opaque command opaque
- **WHEN** 普通命令未显式接入分组协议，stdout 含 pass / fail 字样或生成看似组报告的文件
- **THEN** 只按实际普通命令解释，不自动形成组覆盖或正式 PASS

### Requirement: Agreement of receipts and raw execution

新结构化正式执行 SHALL 保留真实子命令原 outcome，并独立核对本次全部必需组的最终回执、根结束、退出事实和清理的一致性。包装器 exit0 与组失败 / 必需缺口矛盾、非零却声称无原因的全部成功等 MUST 阻止本次正式 PASS；安全已结束的 known invalid 与 unknown 执行/清理分别处理。

#### Scenario: The wrapper exits zero while events contain a failure
- **WHEN** 实际命令退出 0，但最终报告含必需失败、未执行或不一致
- **THEN** 保留命令真实退出，组协议记录 invalid / failed，正式结果不得 passed；不根据 stdout 重写旧 command

#### Scenario: A final receipt is missing or stale
- **WHEN** 仅有增量事件，或最终回执缺失、组重复、身份/候选/范围错配
- **THEN** 不确认正式完整通过，不从最后事件、旧报告或另一个执行结果推断成功

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

## ADDED Requirements

### Requirement: Whole-run required coverage controls formal PASS

新 groups-v1 正式结果 MUST 核对真实完成与非空业务计数、全部必需组状态、计划排除、最终报告及资源清理；不接受旧组 PASS、必需 skip/TODO、取消、未知状态或瞬时包装器成功补齐。一次新完整执行最终汇总全部失败与阻断。

#### Scenario: Full set passes
- **WHEN** 本次全部必需组真实通过、无必需 skip/TODO/取消、最终报告有效且清理已确认
- **THEN** 组执行材料具备直接形成本次正式 passed 的必要覆盖事实，仍须通过正式 Run 提交与读回

#### Scenario: Independent errors are collected
- **WHEN** 中段失败而尾部组独立且执行安全
- **THEN** 尾部继续，统一记录所有错误，不隐藏未执行或阻断

#### Scenario: Unknown cleanup or result
- **WHEN** 子执行、资源清理、最终回执或持久提交存在 unknown
- **THEN** 保留真实现场，阻止正式 PASS，不能简单重试或自动清锁
