# Spec Delta

## ADDED Requirements

### Requirement: Safe scope expansion after settled formal acceptance
系统 SHALL 支持已稳定结束的 groups-v1 正式 passed 或 failed 后，在同一 open 轮经明确 Owner 授权新增范围。追加不得复用旧 PASS，旧失败的实质修复及 Reviewer 交接未决时不得借追加绕过审查；运行中、清理未知及写入 unknown 均须阻断。

#### Scenario: Settled passed gains new pending work
- **WHEN** 旧完整正式 Run 稳定 passed、清理 confirmed，Delivery 尚未 Close，Owner 授权追加槽位
- **THEN** 原 Run 与通过事实、日志保持可查，新范围标为未完成，当前正式准入必须在新槽位归档后重新完整测试

#### Scenario: Settled failed gains new pending work
- **WHEN** 旧完整正式 Run 稳定 failed、实际执行/清理已确认且没有当前未决 Repair/Review
- **THEN** 可按真实授权追加，旧 failed 保留为历史事实，不隐含修复已批准，也不使用它为新范围直接 Close

#### Scenario: Active or unknown formal execution cannot be extended
- **WHEN** 当前正式尝试仍运行/未完成、资源清理不明、存在锁或提交终态 unknown、Repair/Review 未解决
- **THEN** 明确拒绝计划追加并保留现场，不改变旧正式指针或让当前问题通过新计划被遮蔽

### Requirement: Historical run inspection is independent from current eligibility
历史正式测试、Repair 和 Review SHALL 按原轮次与保存时范围可读，而本轮现在是否可重跑、再次修复或 Close MUST 另核最新权威范围、完成绑定和最新正式执行。历史结果有效不代表新范围已完成，旧 Run 不会被重标 passed/failed。

#### Scenario: Query past attempt after scope add
- **WHEN** 本轮先前有真实 passed/failed Attempt，后来合法追加新槽位
- **THEN** 显式历史查询仍保存原时间、集合、失败、结果与范围，不因扩大 plannedChanges 返回错误的轮次归属

#### Scenario: Old pass cannot satisfy a newly enlarged scope
- **WHEN** 当前追加范围尚未完成，调用者引用旧 passed/verified、旧 repairApproval 或其它先前测试来源申请正式验收/Close
- **THEN** 拒绝当前消费，不从旧来源拼接当前集合、不修改旧 Run；新完整验收必须覆盖追加后的整个当前范围
