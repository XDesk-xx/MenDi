# Proposal

## Why

现有 `change bind` 只能绑定 Delivery 首次 Open / Reopen 时已经计划的槽位；Owner 在同一 Delivery 尚未 Close 时需要补充计划，必须人为 Close/Reopen 或改写 manifest。D05-B 的 P01–P07 及 014 独立 Review 证明：仅扩大本轮 scope 会使旧 Open 和 Full Test/Repair 等已完成 Run 的轮次归属校验失败；只清当前正式指针又不能保证历史读取及正确的 `next`。

## What Changes

- 新增显式 Author 命令 `mendi delivery change add --project <path> --input <change-add.json> --role author --actor <id>`（名称为本 Change 的产品入口），只对可写 product-v2 且 `open` 的**当前轮**追加一个或多个全新 plannedChanges 槽位。输入包含非空槽位、标题、依赖与追加原因、可追溯的 Owner 范围决定来源；按需带 roadmapSection / baselineDependencies。CLI actor 不冒充真实 Owner 授权。
- **追加不等于关联**：只修改当前轮计划与顶层投影，不自动 `change bind`、OpenSpec Change 创建/激活、生成 Changes 批次、增加轮次、改变旧绑定、归档编号或之前 Run 的事实。追加后仍须按现有 Owner 授权独立 bind。
- 为同一轮追加建立**明确的有限范围演进依据**和独立受管追加收据：追加前/后 scope 与直接来源可对应同一个 `roundId`，已提交旧 Open、正式 `passed/failed`、Repair/Review 和其他带 scope 的 Run 能按原范围读取，不能被当作新增范围的当前批准。
- **已稳定 Full Test 但未 Close 也允许追加**：原 `passed` 或 `failed` 记录和原始日志不变；范围追加同时撤销它对当前轮 Close 的适用性，`status/next` 提示新增槽位待 bind/后续完整验收，不从旧 `deliveryRunRef`、旧 `testAttemptRunRef` 或最后 Archive 猜当前成功。修复评审未解决、运行中/清理 unknown 或未确认资源时拒绝。
- 拒绝 closed、人工 bootstrap/未授权迁移旧格式、重复与历史轮槽位、依赖不存在/循环、错误的基线 Close、范围/输入/锁/指针并发冲突；同一次请求支持多个新槽位，重复调用与中断不能无声重复追加或假报成功。独立记录 Owner/Author 身份与真实前后差异，不建立全量 hash 链。
- 延续 D05-A 的完整 groups-v1 正式验收和 Close 单独授权。仅改变未来产品写入和当前查询/兼容能力，**不改 D01–D05-A 已提交的历史**，也不修补本项目 manual-bootstrap 为产品记录。

## Capabilities

### New Capabilities

无，追加能力归入现有 Delivery 规划与轮次合同，不再维护近似的第二套规划模块。

### Modified Capabilities

- `delivery-workspace`：开放轮次追加计划的 Author CLI、范围/依赖/授权准入、轮次不可变历史解释、当前交接和原子提交/中断保护。
- `action-runs`：在 Delivery 编号空间保存新追加操作收据并区分当前进展、旧历史结果与 active Change；避免追加记录抢占当前 Change 的阶段 Run。
- `delivery-verification`：同轮范围增长后过去的正式通过/失败和审核只作历史查询，当前完整验收身份失效并重新满足新增完整范围。
- `delivery-lifecycle`：Close 必须消费追加后的当前完整范围；仅 closed 才可 Reopen，不以追加命令代替它。

## Impact

- `src/application/project.ts` 与 CLI arguments/commands，`src/core/{scope,rounds,round-records,delivery-runs,delivery-next}`，`src/adapters/{workspace,delivery-runs}`、必要的 lifecycle/verification/status 消费者和 action/repair admission。
- `skills/` 中的 Delivery Open/bind、Full Test、Close 和新的追加操作方法/文档；方法仍遵循 Owner 边界。
- product-v2 隔离测试：无正式执行、有活动 Change、已稳定 passed/failed、旧 Open/Attempt/Repair/Review 查询与陈旧 Close、历史多轮、重复提交、依赖/基线/权限、并发/中断/恢复与跨进程读回。Explore 的 013/014 proof 为问题事实，不是新 Writer 验收。
- 不包括 D05-C/D、目标项目业务代码、自动 Git/发布/安装、完整通用版本管理器或外部 Full Test 追认。
