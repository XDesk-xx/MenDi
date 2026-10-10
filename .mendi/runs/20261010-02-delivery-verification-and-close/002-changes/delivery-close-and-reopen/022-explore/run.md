---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-explore-01
actionType: explore
role: author
run: "022"
status: completed
actionStatus: completed
result: proof-supported
nextAction: review-explore
nextRole: reviewer
date: 2026-10-10
---

# MVP-D02-C Explore

Owner 原始指令：owner 授权激活 MVP-D02-C，开始 explore，核心功能 proof 认证。

保持 Author，范围为路线图 MVP-D02-C 的 Close、closed 查询、Reopen 原 Delivery 与 closed 后 Open 新 Delivery。激活使用固定 OpenSpec 1.14.1 原生 scaffold，复用 002-changes、连续 Run 022；D02 仍 open / manual-bootstrap，项目累计归档数 6，A / B 已归档。当前 Change 只包含原生 metadata；探索与 proof 摘要保存本 Run，原始输出保存 artifacts，不新建 explore.md。

使用 openspec-explore 与项目 Explore 方法；Owner 原始激活 / 核心 proof 指令及项目约定授权本轮人工激活、记录、受控实验和背景同步。不修改 src 或提前实现生命周期命令，不编写完整 Propose。完成后停独立 Review Explore，不执行本项目 Close / Reopen / 新 Delivery Open、正式 Full Test、Archive 或 Git。

## 实际背景与授权边界

激活及真实 proposal instructions（context / rules）响应见 [activation](artifacts/activation/)。固定工具的 list 确认 nearest root 为 MenDi、没有活动原生 Change，new change 创建 `.openspec.yaml`；proposal ready、后续产物 blocked。实际 instructions 没有额外 rules；context 要求中文、直接必要输入、真实 proof 和人工记录兼容。初始 context 仍描述 C 未激活，本次仅同步 README / context 为实际新交接。未创建 proposal、design、delta specs、tasks 或 explore.md，原生 readiness 不代表阶段批准。

B 的 020 独立批准、021 实际归档及 0508d91 change checkpoint 为当前依赖事实。既有路线图中 C 的补充维护要求已读取并纳入分析，未改写该文件。人工记录激活通过维护当前 manifest 完成，不调用 product bind / start 来迁移历史；旧 Run、verdict 和归档计数不变。

## 会改变方案的事实

1. `core/associations.ts` 的 product 校验要求 state=open、最多一个批次；`core/records.ts` 将当前 Delivery 指针与非 open 状态视为冲突，product 项目索引最多一项。`adapters/test-store.ts` 的结果读取也解析同一 workspace；因此仅修改 query 分支或给 manifest 添加 closed 字段，不能使正式 / 普通结果读取成立。`core/delivery-verification.ts` 的 verificationScope 还把 open / 无活动项 / 全部槽位归档及项目最新计数绑在一起，需要保留其执行限制，同时避免将这些限制推广为历史结果的读取前提。
2. `fullTestStatus` 使用当前 workspace.id 定位指定 Run；新 Delivery 的索引与选择实现后，必须明确显式历史 Run 的所属 Delivery，不能将它当作当前 Delivery 的 Run。普通 execution ID 在不同 Delivery 可重复，旧普通结果的明确定位也需在 Propose 收敛；默认 status / next 仍只解释当前选择，不扫描历史推断当前。
3. 当前 full passed 只认证真实执行。scopeMatch / commandMatch 可以 changed 或 unavailable，materialApplicability 仍为 requires-semantic-check；读取 ok、next 提示及持久 passed 不能单独形成 Close 准入。Close 必须核对本轮范围、直接正式结果和仍实际需要的批准事实，并由阶段工作判断受测材料适用性。B 已固定的批准事实快照可沿用其适用部分，不重新把全部 Archive / Review / Author 正文或失败链变成查询 / Close 的统一前置。
4. 既有 bind 会退出 deliveryRunRef 当前选择并保留 fullTestRunRef。后者可读为历史 passed，在新活动 Change 下 scopeMatch=unavailable；这是保留执行事实，不是继承新一轮验收。Reopen 要明确新工作范围与当前进展，保存旧 Close / Full Test 原样；首次新正式执行不能走旧修复批准 / 集合的重试分支，也不能把 Reopen 本身写成通过。
5. Reopen 的新批次不能沿用当前“一批次成员等于全部 bindings”的结构。历史 binding / 批次须保留原属，当前范围和当前工作批次须各表达实际用途。仅将 plannedChanges 换成新槽位会使旧 binding 的槽位落在范围外；不能靠删除旧 binding 解决。具体字段留给 Propose，但须满足路线图 §4.1：Close / Reopen 与 Changes 批次同级，没有轮次目录；Reopen 不预建批次，首次实际新 Change Run 才建立 NNN-changes，继续整个 Delivery 的 Run 编号。
6. `openDelivery` 及 `createWorkspace` 目前都要求 `.mendi` 不存在；后续新 Open 应在当前 closed 且必要收口完整时，追加新的独立 manifest / 项目索引并选择它，保持项目累计归档计数。不能重建 `.mendi` 或覆盖旧 Delivery。新 Delivery 的 Run 从 001 开始，原 Delivery Reopen 则沿已有号增长，两者不是相同操作。

## 核心 proof

维护入口：[mvp-d02-c-explore.ts](D:/Projects/MenDi/scripts/proofs/mvp-d02-c-explore.ts)。脚本仅调查既有产品接口和输入模型，不实现新生命周期命令。输入由维护中的 tests/helpers、delivery-support、fixtures 与固定 OpenSpec / pnpm 从新隔离目录准备；阶段审核是明确的声明夹具，不认证真人或当前项目的批准。

首次六组见 [proof-001.log](artifacts/proof-001.log)、[report](artifacts/proof-001/report.json)，coldTemporary=true：清空后的 `.tmp` 只含 .gitkeep，环境仍可重建。新增独立的布局 / 范围疑点后，最终脚本在另一新隔离目标执行七组，见 [proof-002.log](artifacts/proof-002.log)、[report](artifacts/proof-002/report.json)。第二次 coldTemporary=false 只表示前次实验目录仍在；新进程重新创建种子并真实归档，不读取旧隔离目录构造输入。

| 目的 | 实际输入与方法 | 观察与限制 |
| --- | --- | --- |
| P01：取得可信的查询对象 | 既有产品接口实际完成两项原生 Archive，正常离线准备依赖，再执行正式 full script | 实际 passed，父 Run 015-delivery-full-test 与直接子结果 / 日志保存；是隔离目标既有 B 能力，不是 C 验收或根正式 Full Test。 |
| P02：必要输入收窄 | 删除隔离目标的旧 Archive / Review / Author 正文，增加失效未知说明 Ref；新进程 status / next | 两种查询 exit 0，选同一正式结果、upstream:null、passed；不能由此放宽正式操作自身需要的输入。 |
| P03：执行事实与适用性分开 | 分别改变当前范围和 full 命令，再读取旧正式结果；范围变化后请求新正式运行 | 旧 outcome 仍 passed，但 scope / command 为 changed；新运行 not-run / delivery-state-conflict、无写入。旧父 Run 字节不变。 |
| P04：closed 结果读取 | 将同一真实目标 manifest 投影为 closed；跨进程查询 status / next / 正式 status / 普通 status，并直接读取父 / 子记录 | 四种查询均 invalid-record；直接安全读回父 / 子仍 passed。close / reopen CLI 均用法错误 exit 2。closed 是明确夹具投影，没有实际 Close，不把上述拒绝包装为产品支持。 |
| P05：新 Open / 多索引 | 在 closed 投影上实际调用新 ID 的 delivery open；将真实项目索引投影为两项后调用解析器 | Open 拒绝 existing-mendi-state，旧入口 / manifest 字节不变；两项 product 索引被拒绝。没有创建新 Delivery 或改 root 项目。 |
| P06：新工作选择与编号 | 恢复 open 并明确扩展夹具范围；原生 scaffold third-entry、真实 bind 与 Explore start、新进程 query | deliveryRunRef 清空、fullTestRunRef 保留；旧 passed 可读但 scope unavailable，当前为新 Change draft，没有 verification。Run 015→016、归档数仍 2、旧正式 Run 字节保持；这是既有 bind 行为，不冒充 Reopen。 |
| P07：跨批次 / 范围模型 | 从 P06 的真实 manifest 构造两个分组一致的批次输入，以及仅含新槽位的范围输入，调用真实解析器 | 两者均 invalid-record，原 manifest 字节保持；纯输入投影，不创建缺失目录、不移动 Run，也没有实现多批次。 |

原始 CLI 命令 / stdout / stderr / exit 与正式执行、必要日志分别保存在对应 proof 目录的 commands-* 和 delivery-scenes-*；报告是本次观察摘要，不复制历史证据树。未增加 scriptSha256、文件 hash 清单或容量 / 数量 gate。测试中的必要文件未变比较继续保留。

## 推荐候选及 Propose 收敛点

推荐复用现有受管路径、身份、写锁、Run 分配与完整读回能力，在独立生命周期职责中实现 Close / Reopen 与已有状态后的新 Open；将“结构有效、指定结果可读”与“允许执行当前新操作”分开。不能整体放宽 open 检查后仍用原 Full Test 执行准入解释 closed，也不通过补旧目录、修改旧 Run 或清空旧 manifest 达成查询。

- Close 直接消费当前正式结果、范围 / 集合与已核对批准事实；known passed、稳定必要日志、范围 / 命令一致是可检查事实，受测材料适用性仍由明确材料与真实阶段判断承接。必要输入缺失 / 越界、活动或未完成工作、failed / unknown、范围变化或未批准均不能 Close；不沿历史失败 / 修订链补证。
- closed 的默认 query 展示已收口的当前 Delivery 与必要直接记录；显式旧结果读取按其所属 Delivery 解释，不要求旧活动 Change 或依赖当前项目最大归档号才认证旧执行事实。它不能自动产生 Reopen / 新 Open 授权。
- Reopen 由 Owner 明确新工作范围，保留旧 Close、批次、binding、累计号与旧执行结果，同时退出旧验收的当前适用选择。范围与历史关联的共存、当前批次选择及新 Full Test 的准入要一起设计；不只添加一个 state 字段。
- 新 Open 追加独立 Delivery 并切换当前选择，初始 001 与旧 Delivery 连续号明确分开。只允许合法 closed 后的新目标，不绕过冲突 / 锁或迁移 manual-bootstrap；原首次 Open 继续处理 `.mendi` 不存在的情况。
- 写入前拒绝不改变记录；写入后故障保存实际 committed paths、unknown / 未完成与锁现场，后续按既有 Owner 边界处理。具体提交顺序 / 有限继续方式由 Propose 明确，不增加通用恢复、自动解锁、历史 pid 处置或自动重试。

生命周期编排与 Close / Reopen 场景独立于 delivery-full-test.ts 和 delivery-repair.test.ts，不继续向长执行编排和完整修复流程堆入新职责；实际需要扩展的共享记录 / 查询逻辑先整理，避免转发层和额外台账。产品方法、CLI 参数、结果类型、历史显式选择和最小 next 字段在 Propose 收敛，本 Run 不提前给出完整任务清单。

## 验证与未认证事项

最终 proof 七组观察全部符合断言、exit 0；普通 pnpm check 覆盖 98 份维护文件的格式 / lint 与三套真实类型检查，build exit 0。见 check-complete.log、build.log。初次类型检查指出 proof 对联合返回缺少错误分支收窄，已添加实际字段断言后通过，没有修改类型配置或跳过检查。源码和既有测试未变，无需重跑整个旧回归。

B 020 对真实立即取消、停止未确认、入口退出且后代存活的独立证据与 unknown 限制继续适用；unknown 不可用于 Close。它不认证任意后台进程已消失，也不授权本轮自动清场。017 全回归原 167/169 及后续补审范围保持原结论。

尚未认证真正 Open → 多 Change → Full Test → Close → Reopen → 新工作 → 新 Full Test → Close，或 closed 后新 Open 的实际成功与故障收场。这些能力当前不存在，须经 Propose / Apply / 独立审核和相应产品场景验收；本次 proof 认证的是关键前置 / 读取 / 选择限制及方案依据，不是生命周期完成。

## 当前交接

Author Explore 完成，result=proof-supported，无 Reviewer verdict。当前唯一审核入口为本 022，下一步独立 Review Explore；D02 open、C 活动、A / B 归档、累计完成 6。README / context 更新实际背景，最终 native status 与本地 status / next 读回保存 artifacts。未执行 Git、根正式 Full Test、Close / Reopen / 新 Open、Archive、清理 .tmp 或下一 Change 激活。
