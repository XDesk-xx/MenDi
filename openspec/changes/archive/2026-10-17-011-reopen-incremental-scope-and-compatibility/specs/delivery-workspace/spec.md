# Spec Delta

## MODIFIED Requirements

### Requirement: First delivery open

系统 SHALL 在已准备 OpenSpec 且没有 `.mendi/` 状态的目标执行首次 `delivery open`，要求 Delivery ID、标题及含目标和计划槽位的范围输入。成功 MUST 保存 version 2 项目入口、独立 manifest 和首轮权威范围，并能跨进程读回。Open SHALL 不创建 OpenSpec Change 或宣称槽位完成；显式与省略身份的合法首次入口均采用同一轮次模型。

#### Scenario: Open and read in a separate process
- **WHEN** 用户为受控项目提供合法 ID、标题和范围文件，执行 Open 后退出进程并重新查询
- **THEN** 查询显示同一 Delivery、open 状态、目标、计划槽位及关联，不依赖进程内缓存或旧临时输入

#### Scenario: Invalid scope is supplied
- **WHEN** ID 含路径分隔符或范围缺少目标、含重复槽位、悬空依赖或循环依赖
- **THEN** 系统在写前拒绝并指出输入问题，目标保持原样


### Requirement: Existing state is preserved

首次 Open MUST 拒绝不完整既有 .mendi 状态。已有 open、人工记录、重复 ID、旧 product 未迁移或未完成写入 SHALL 不覆盖；只有当前 version 2 product Delivery 完整 closed 时，显式新 ID Open 才能追加独立 manifest / 索引并选择新 Delivery，保留旧 Delivery 原文件与项目累计归档数。新 Delivery 从 001 编号，不通过 Open 重开旧 Delivery。

#### Scenario: Duplicate open
- **WHEN** 用户对仍为 open 的目标执行同一或不同 ID 的 Open，或在 closed 后复用已登记 ID
- **THEN** 系统报告现有状态及相关位置，原项目入口、manifest 和历史材料字节不变

#### Scenario: Partial directory already exists
- **WHEN** 目标 `.mendi/` 已存在但缺少入口或有效 manifest
- **THEN** 系统报告不完整状态，保留残留，不把目标当作空项目自动重试或清理

#### Scenario: Open a new delivery after close
- **WHEN** 当前可写 version 2 product Delivery 完整 closed，Owner 明确授权新 ID、标题与独立范围，Author 提供记录身份
- **THEN** 追加新 manifest / 索引并选择新 Delivery，保存 001-delivery-open；旧 manifest / Close / Run 不改，归档数不重置，不预建 Changes 批次

#### Scenario: An unindexed target is already occupied
- **WHEN** 新 ID 的受管 group / Run 位置存在其他内容或未完成写入
- **THEN** 普通新 Open 拒绝覆盖并报告现场；只有对应当前待提交操作的显式 resume 可按原输入补剩余提交


### Requirement: Read-only status and next

status / next SHALL 只读解释当前轮和当前交接，或显式指定的已登记 Delivery，不改变 activeDeliveryId / currentRoundId。系统 MUST 区分本地进展、历史执行与上游 readiness；生命周期 / 正式操作优先使用当前轮指针，无此指针时仅选择当前轮 binding。closed 读取当前 Close，不访问旧 Change status；pending 显示未完成，不回退旧 PASS 或历史最大号。status 的显式轮次选择只展示该轮已保存范围和收口，不生成历史执行权限。

#### Scenario: Prepared project without a delivery
- **WHEN** 查询有效 OpenSpec 目标且 `.mendi/` 不存在
- **THEN** 状态显示 MenDi 尚未 Open，下一步提示 `delivery-open`，文件保持不变

#### Scenario: Delivery without a change
- **WHEN** 查询一个合法的产品 Delivery 且尚无 Change 关联
- **THEN** 状态显示已有范围，下一步提示明确选择已有 Change 后执行 `change-bind`，不创建 Change

#### Scenario: Upstream proposal is ready
- **WHEN** 本地关联阶段为 Explore，而上游 proposal 为 ready 或所有规划文件已齐备
- **THEN** next 仍按本地当前 Run 或初始 Explore 交接解释，不自动改为 Propose 或 Apply，不把上游事实解释为批准；记录操作与 Agent 的阶段语义工作分别说明

#### Scenario: Bound change disappears
- **WHEN** manifest 当前普通活动 Change（非合法归档过渡态）无法从上游读回
- **THEN** 查询报告引用失效并展示关联位置，不忽略关联或将 Delivery 判为可继续

#### Scenario: Product run is read after process exit
- **WHEN** 无当前 Delivery 操作，product binding 的 latestRunRef 指向有效当前 Run，新进程读取 status / next
- **THEN** 显示同一 Action、Run 状态、进展结果及最小 next，只解析该当前记录，不读取全部历史 Run 正文或递归说明链

#### Scenario: Manual progress remains manual
- **WHEN** manual-bootstrap manifest 中存在最新 Run 与 Reviewer 交接引用
- **THEN** 查询保留人工 next 和说明来源，不读取这些 Run 作为新增产品运行前提、不认证其语义或调用产品写入

#### Scenario: Query the next change before and after its first run
- **WHEN** 前项归档后显式关联第二 Change，先在无新 Run 时查询，再完成首次阶段记录并在新进程查询
- **THEN** 两次都选择第二项；先显示它的 Explore / 上游事实，后显示其新 Run，不显示第一项 Archive 为当前进展

#### Scenario: Query after the second archive
- **WHEN** 第二项完整归档、无活动项、无当前 Delivery 操作且其必要终态有效
- **THEN** 选择追加顺序最后的第二项，upstream 为 null，next=delivery-next / awaiting-owner-instruction，不自动 bind 第三项

#### Scenario: Query current delivery acceptance or repair
- **WHEN** 全部 Change 已归档，当前 Delivery Run 为正式 Full Test、局部修复或定向 Review
- **THEN** status / next 在新进程选择该 Run、展示相应结果 / 角色 / 当前必要输入，upstream 为 null，不重新读取旧 Change 活动 status 或把旧 Archive 当当前进展

#### Scenario: Current delivery record conflicts or is missing
- **WHEN** Delivery 指针指向缺失 / 损坏 / 错身份 / 越界 Run，或同时存在活动 Change 与未退出的 Delivery 操作
- **THEN** 明确输入错误或冲突，不静默回退到 Archive、历史最大号或旧 PASS，不自动修复指针

#### Scenario: A writer appears during the direct result read
- **WHEN** 当前正式 Run 已读到 passed 头部，但直接子结果 / 日志观察出现竞争或变化
- **THEN** status / next 的本次 outcome 与 next 一致为未确认并停 Owner，持久 passed 保留作原事实，不读取额外历史来绕开本次不稳定

#### Scenario: Query a closed delivery and an explicitly selected historical delivery
- **WHEN** 当前 Delivery closed，或新 Open 后用 --delivery 指定已登记旧 Delivery
- **THEN** 读取对应 manifest 和当前 Close 摘要，upstream:null，保留实际 closed / open 与人工来源；不改变项目选择、不重验旧正式结果或调用旧活动 Change

#### Scenario: Reopened scope has no associated change
- **WHEN** Reopen 已完成但本轮尚无 binding
- **THEN** 解释 Reopen 的新范围及显式关联提示，不把历史最后 archived 项或旧正式 passed 当作本轮进展

#### Scenario: A lifecycle operation is pending
- **WHEN** 项目入口保存当前待提交生命周期 Run，终态 Run 或目标 manifest / 索引尚未完整收口
- **THEN** 查询报告 pending / unknown 与当前直接入口，阻止其他写入，不以已写 complete 头部、旧 closed 或旧 PASS 宣称本次完整成功

#### Scenario: Read a preserved historical round
- **WHEN** status 明确选择 version 2 Delivery 的一个已登记历史轮次
- **THEN** 显示其完整目标、计划、来源、批次与收口摘要，标明只读；不改变当前选择、不调用历史活动 Change、不把当前 next 冒充历史动作

#### Scenario: A requested round is absent or legacy-only
- **WHEN** 指定未知轮次，或向没有轮次模型的旧 product / manual-bootstrap 请求结构化轮次查询
- **THEN** 明确报告不存在或格式不支持；普通旧格式查询仍可用，不静默写入轮次或猜历史


### Requirement: Ordered product associations and shared batch identity

product bindings MUST 按追加顺序保留，只有最后项可非归档；Change / 槽位唯一、归档编号及 binding / Run / batch 身份须一致。version 2 每个绑定须归属唯一已保存轮次，每个批次成员只能来自同一轮；当前批次仅选择当前轮工作批次，Reopen 后可为 null。旧 product 只读按旧模型解释；不读取历史正文猜当前对象，也不移动旧成员、重编号或通过新增轮次复活旧槽位。

#### Scenario: An appended change has no run yet
- **WHEN** 前项已有批次，第二项刚 bind，继承相同 batchId / 成员身份但尚无 latestRunRef
- **THEN** 记录合法，首次新 Run 复用该批次；旧批次成员不丢失，不因无新 Run 删除已有批次

#### Scenario: Binding order or batch membership contradicts identity
- **WHEN** 有多个非归档项、活动项不是最后追加项、旧编号倒序 / 重复 / 大于总数，或成员重复 / 未关联 / 与 Run 身份位置不符
- **THEN** 拒绝矛盾记录，不排序修复、不回退第一项或把占号目录当正式交接

#### Scenario: Version one and manual records remain bounded
- **WHEN** 读取原有单 Change version 1 product 或合法 manual-bootstrap 记录
- **THEN** 旧单批次 product 按既有范围解释，缺 currentBatchId 时只兼容原单批次；人工记录仍只读，不套用产品新规则或迁移历史；多个批次必须有明确当前选择，不能猜最后一项

#### Scenario: Reopen preserves old bindings outside the new scope
- **WHEN** 旧范围已 closed，Reopen 指定互不复用槽位的新范围，随后新批次保存真实新 Run
- **THEN** 历史 archived binding 与原 batchId / latestRunRef 保留，新范围只解释本轮 binding；每个批次成员与对应绑定一致，不把所有 binding 强塞进新批次

#### Scenario: Current batch membership is contradictory
- **WHEN** 当前批次含范围外成员、同一 Change 分属多个批次、Run 与原批次身份不一致，或非归档 binding 不在本轮范围
- **THEN** 拒绝矛盾记录，不迁移旧成员、不排序修复或扫描历史推断范围

## ADDED Requirements

### Requirement: Authoritative delivery rounds

version 2 product SHALL 保存有序且身份稳定的历轮范围与明确当前轮。首轮及每次 Reopen 的目标、计划、来源、日期、批次与收口 MUST 可直接定位；旧轮承诺不得被后轮覆盖。Delivery 身份和首次日期保持，轮次不依赖日期或 Git 分支，不增加轮次目录。顶层保留的当前字段 SHALL 由同一逻辑投影并核对，不允许与权威轮次独立写入。

#### Scenario: Reopen adds work to an existing delivery
- **WHEN** 已关闭首轮承诺 P09 / P10-L，Reopen 新增 P10 / P13
- **THEN** 两轮范围同时保留，当前轮只含 P10 / P13，旧归档与收口仍归原轮，不成为本轮待完成项

#### Scenario: Several rounds share one date
- **WHEN** 同一 Delivery 在同一天多次合法 Close / Reopen
- **THEN** 每轮标识稳定且互不冲突，重读及同次恢复不追加重复轮次

#### Scenario: A projection contradicts authoritative scope
- **WHEN** 顶层当前范围 / 状态 / 指针与已保存当前轮不一致，或同一槽位归属多轮
- **THEN** 报告具体记录矛盾，不选任一来源继续写入或自动修复

### Requirement: Legacy read compatibility and explicit write migration

新版 SHALL 保留 version 1 product 的只读查询、指引与指定结果读取，manual-bootstrap 继续只读。普通产品写入 MUST 要求可写的新格式；新建空目标和明确迁移除外。旧格式的 bind、阶段 / Run、归档、普通测试、正式验收 / 修复、生命周期及旧操作 resume SHALL 写前拒绝并提示迁移 / 旧版恢复，不静默升级。已有旧 pending / 不完整操作须先用旧版恢复，不能作为新版迁移输入。

#### Scenario: Query legacy progress without upgrading
- **WHEN** 普通 status / next、只读 instructions、test status 或正式结果 status 读取必要输入完整的旧 product
- **THEN** 保留原查询合同与 outcome，注明旧格式及写入需迁移，不修改文件，不因缺新字段新增失败

#### Scenario: A legacy writer is requested
- **WHEN** 新版收到针对 version 1 product 的普通产品写请求，包括旧操作 resume
- **THEN** 在新占号、业务执行、原生调用或文件替换前拒绝；若原操作中断，提示使用原兼容版本在另行授权下恢复后再迁移

#### Scenario: Selected and historical deliveries use different versions
- **WHEN** 项目入口及当前 Delivery 已迁移，其他登记 Delivery 的原 version 1 manifest 保留
- **THEN** 新版仍可只读查询旧 Delivery；未迁移来源不会被全局扫描、自动升级或强制改写

### Requirement: Structured delivered baseline dependencies

计划槽位 SHALL 区分本轮 dependsOn 与已交付 baselineDependencies。结构化基线仅接受同一项目已登记 product Delivery 的指定槽位和直接 Close 事实，可为同 Delivery 旧轮或跨 Delivery；旧 product 来源不强制迁移。系统 MUST 核对真实归档身份、指定 Close 的完成范围和一致性，不重绑旧槽位、不要求旧 ordinal 等于项目最新计数，不递归解析来源依赖或旧审核正文。

#### Scenario: Use a prior round without reviving its changes
- **WHEN** P10 结构化引用同 Delivery 已关闭轮次的 P09 / P10-L
- **THEN** 核对明确来源的完成与 Close 事实，允许 P10 在本轮推进，来源槽位、Change、批次与归档不变

#### Scenario: Use another registered delivery
- **WHEN** 当前槽位引用另一已登记 product Delivery 的已交付槽位和其指定 Close
- **THEN** 只读核对该来源，即使它后来 Reopen 或仍为旧格式也按指定历史 Close 判断；不改变 activeDeliveryId，不强制迁移来源，不把来源列为本轮新增完成项

#### Scenario: Source is manual or cannot be verified
- **WHEN** 结构化来源为 manual-bootstrap、未登记 / 项目外对象、非归档槽位、缺失 Close、Close 不含该完成项，或身份 / 路径矛盾
- **THEN** 拒绝实际依赖它的范围准入、bind 或正式验收并给出具体问题；人工来源仍可保留普通说明，但不能满足产品硬依赖

#### Scenario: A baseline source has unavailable explanatory history
- **WHEN** 来源 manifest、归档绑定、指定 Close 完成快照一致，但旧 Author / Review / 归档内容、日志或其他说明不可用
- **THEN** 不把这些无关历史新增为基线必要输入，不递归补证；真正直接完成事实缺失仍拒绝

#### Scenario: Ordinary query does not execute dependency admission
- **WHEN** 当前必要记录完整，但它说明的基线来源后来不可用
- **THEN** 普通 query 展示已保存声明，不额外遍历来源；需要消费该基线的写入 / 正式验收另按其直接输入拒绝
