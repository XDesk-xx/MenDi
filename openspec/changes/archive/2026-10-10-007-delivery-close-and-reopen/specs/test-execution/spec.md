# Spec Delta

## MODIFIED Requirements

### Requirement: Intent before launch and read-only incomplete results

系统 MUST 在启动测试前持久保存意图。test status SHALL 读取明确 execution ID；未指定 --delivery 时使用当前已选 Delivery，指定时仅读取该已登记 product Delivery，不改项目选择。只读检查身份和必要日志，不要求对象 open、无活动项或符合新执行范围，不调用上游 / 测试。未完成、锁或读中变化如实为 unknown / 不稳定，不由旧 PID 消失推导终态。

#### Scenario: Read a completed result in a new process
- **WHEN** 完成执行后新进程读取指定结果，必要终态和日志完整
- **THEN** 返回同一集合、命令、cwd、实际结果与退出信息；成功只表示记录可读，读取已知 failed / interrupted 记录不重新运行命令

#### Scenario: A finished unknown record remains unconfirmed without a lock
- **WHEN** 新进程读取已保存的 finished / unknown，原执行已停止且锁已由明确的人工处置移除，必要记录 / 日志前后稳定
- **THEN** 保留原记录与 stable 观察，但 ok 为 false、outcome 仍为 unknown，非零退出；不写入、重跑、推导新终态或将锁不存在解释为执行已确认；已知 failed / interrupted / not-run 的完整稳定记录仍可读成功

#### Scenario: Writer disappeared after launch intent
- **WHEN** 新进程读到 running 意图，但无完整终态，即使记录 pid 不存在
- **THEN** 显示 unknown 与必要现场，旧 pid 仅为说明；不重试、补写 failed / passed、杀进程或解除锁

#### Scenario: A lock or changed record prevents a stable result
- **WHEN** 读取指定执行时仍有写入锁、必要记录 / 日志损坏或前后观察改变
- **THEN** 只读报告当前持久观察及未确认原因，非零退出，不将已观察的 passed 字段表述为稳定的完整成功；普通 status / next 的锁边界保持

#### Scenario: The same execution id exists in two deliveries
- **WHEN** 新旧 Delivery 均有 001-full，调用者指定 --delivery 为旧已登记 ID
- **THEN** 只读取旧 Delivery 的指定结果并展示所属身份，默认省略时只读当前对象；不按历史目录搜索或把另一结果套给当前 ID

#### Scenario: Historical execution is read after close or reopen
- **WHEN** 指定旧执行的 Delivery closed，或当前范围 / 活动 Change 已变化，必要结果 / 日志有效
- **THEN** 保留实际命令 outcome 并可稳定读回，不宣传新工作通过，不复用执行准入要求拒绝读取

#### Scenario: An explicit delivery is unregistered or unsafe
- **WHEN** --delivery 未登记、索引 / manifest 身份矛盾、位置越界，或结果 / 日志与指定身份不符
- **THEN** 明确失败，不回退当前 Delivery、不读项目外目标；未知 Ref 和无关旧日志不成为读取前置
