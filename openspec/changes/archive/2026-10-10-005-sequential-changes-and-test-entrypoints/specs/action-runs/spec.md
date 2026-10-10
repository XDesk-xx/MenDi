# Spec Delta

## MODIFIED Requirements

### Requirement: Delivery-wide run allocation

系统 SHALL 在整个 Delivery 内按实际已占号 Run 目录分配递增编号，至少三位，跨 Change 连续；Changes 批次目录 MUST 不消耗额外序号；同一 open 周期的后续 Change 复用已有批次及成员，不替换批次数组。分配 MUST 使用独占写入并拒绝重复号、不安全路径与冲突。空占号目录 SHALL 保留并报告，后续不复用；编号分配 SHALL 不认证或读取全部历史提交正文。

#### Scenario: Continue across changes in a batch
- **WHEN** 同 Delivery 历史操作 / Change 已占号到 015，当前批次为 003-changes
- **THEN** 新 Run 使用 016，批次不另占号，旧 Run 位置和内容不变

#### Scenario: An interrupted reservation exists
- **WHEN** 与当前指针无关的安全 Run 目录已占号 019 但无完整 run.md
- **THEN** 新分配跳过已占号的 019，使用下一号并报告残留，不清理现场或声称 019 已完成

#### Scenario: A number is duplicated or another writer owns the lock
- **WHEN** 扫描发现同 Delivery 重复序号，或其他进程持有写入锁
- **THEN** 拒绝分配并报告冲突，原记录及他人锁保持不变

#### Scenario: Create the first run of the second change
- **WHEN** 第一项已归档、第二项明确 bind 并加入既有批次，当前关联尚无 Run，显式开始 Explore
- **THEN** 在该批次的第二 Change 目录保存新 draft，使用全 Delivery 下一占号；批次 firstRun / 旧成员、旧 Run 和归档数保持

### Requirement: Current run as direct state input

系统 SHALL 使用唯一当前 binding 的 latestRunRef（活动项优先，无活动时取追加顺序最后的 archived 项） 定位当前产品 Run，校验受管位置、Delivery / Change / Run 身份与必要头部，并由该 Run 解释 Action 进展。当前 Run 缺失、损坏或身份矛盾 MUST 报错；普通状态查询 SHALL 不解析无关历史头部、不递归读取说明引用，也不为查状态分配 Run。

#### Scenario: Read progress in a new process
- **WHEN** 新进程查询存在有效当前 Run 的 product 记录
- **THEN** 显示相同 Action、类型、角色、draft / submitted 状态和 continuing / complete 结果，引用失效的历史说明或未知 Ref 不影响该查询

#### Scenario: Required current run is unavailable
- **WHEN** latestRunRef 指向缺失、坏头部、越界位置或另一个 Change 的 Run
- **THEN** 查询失败并明确当前输入问题，不回退猜测历史最新文件或补建记录

#### Scenario: A new association has no current run
- **WHEN** 第二项为活动 binding 但没有 latestRunRef，第一项保留 archived Run
- **THEN** 返回第二项尚无当前 Run，允许按初始 Explore 显式开始；不得选择第一项、扫描最大历史编号或从工具 readiness 推断阶段

#### Scenario: Historical runs do not replace the selected input
- **WHEN** 当前必要 Run 有效，但其他 archived 项的旧 Run 或说明不可用
- **THEN** 普通查询和当前阶段操作只消费当前必要输入；旧绑定身份 / 安全定位保留，但不读取无关历史头部

#### Scenario: Current write is directed at an older change
- **WHEN** 当前已为第二项，却请求对第一项的 Action / Run 保存、提交、继续或归档
- **THEN** 按非当前 / 陈旧对象拒绝，不改旧 submitted Run、verdict 或当前指针

