# Design

## Context

动机见 proposal。022 的七组 proof 经 023 独立重放批准：closed 四类查询被现有 open 校验拒绝；双 Delivery 索引、双批次和仅新槽位范围也被拒绝。源码事实包括 `records.ts` 的单索引限制、`associations.ts` 的单批次 / 全绑定在范围限制、`test-store.ts` 将读取绑定执行 workspace，以及 `fullTestStatus` 用当前 ID 解释指定路径。结果观察与 Full Test 准入目前共享 `verificationScope`；bind 清空 deliveryRunRef、保留 fullTestRunRef。

本项目 D02 为 manual-bootstrap，不迁移或试运行产品写入。Apply 的产品验收在从维护输入准备的隔离目标完成；阶段 Review 夹具只认证记录协议，真实批准仍由独立 Reviewer 作出。

## Goals / Non-Goals

**Goals:** 使当前选择、结构可读性、执行准入、材料适用性分别有明确规则；新增有限生命周期职责，复用受管路径、项目写锁、实际占号扫描和直接结果观察；保留版本 1 / 人工兼容与最小 next。

**Non-Goals:** 任意切换当前 Delivery 的写命令、重开非当前旧 Delivery、复活归档 Change、产品化人工历史、范围任意原地编辑、通用恢复 / 解锁 / 取消、自动认证源码或授权身份。没有轮次目录、历史依赖图、全库 hash、文件数量 / 行数 gate 或旧 proof 扩写。

## Decisions

### 1. 当前范围与历史身份分开

manifest 的 goal / plannedChanges 始终表达本轮工作范围；Reopen 用明确非空新范围替换这些字段，旧范围保存在不可变 Close / Full Test Run。新槽位必须与 Delivery 历史 bindings 的槽位互不复用，dependsOn 只指向新范围内槽位，继续使用非重复 / 无循环校验。需要修复旧交付时使用新的修复槽位与新 Change，不能重新激活旧 binding；旧产品仍由新完整测试集合验证。

bindings 仍按实际追加顺序保存。范围外项只允许 archived，保留原 planningSlot、changeId、archiveOrdinal、batchId 和 latestRunRef；本轮完成检查只取范围内 bindings。Change ID / 槽位在全 Delivery 唯一、归档号严格递增且不大于项目计数，当前非归档项唯一且为最后追加项。选择当前 binding 时只在本轮范围内取活动项或最后归档项，不能落回旧范围。

新增 `currentBatchId: string | null`，选择本轮工作批次。每个批次的成员只等于属于它的 bindings，批次之间互斥；Run 路径与 binding 原属一致。Reopen 保存 null，不预建目录；首次 bind 暂无 batchId，首次真实 Run 分配 N 后追加 N-changes 并设置当前批次。后续同轮 bind 加入它，旧数组不被替换。旧版本 1 未提供 currentBatchId 时只按原有 0 / 1 批次兼容；多个批次必须显式选择，不以数组末项猜测。

选择这一路径而非不断累加 plannedChanges，避免本轮操作继续读取全部旧归档 / 审核；也不引入另一份全历史范围清单或轮次对象。此版新范围的依赖边界是自包含的新槽位，旧能力的影响写在新方案 / 受测材料中。

### 2. 两个当前指针与持久收口

| 时点 | deliveryRunRef | fullTestRunRef | 其他直接选择 |
| --- | --- | --- | --- |
| 记录化 Open | 新 Open Run；首次绑定后退出 | 新 Delivery 不存在 | openRunRef 保存新 Open |
| 正式执行 / 修复 / 定向审核 | 当前操作 | 最近正式意图 / 结果 | 沿用 B 的当前交接 |
| Close 成功 | 新 Close Run | 本轮正式结果，保持 | closeRunRef 指向该 Close |
| Reopen 成功 | 新 Reopen Run | 原值保留作历史 | closeRunRef 保留旧 Close，currentBatchId=null |
| 新 Change bind | 清空 | 仍为历史 | 活动 binding，无新 Run 时初始 Explore |
| 本轮新正式执行 | 新正式 Run | 更新为同一新 Run | 仅本轮范围 / 批准 |

fullTestRunRef 存在不表示它当前适用，也不需要为 Open / Reopen Run 强制补 fullTest / repair。当前 Close 头部保存固定正式入口、executionId、本轮 scope / collection / basis、批准快照和材料判断，作为一次持久收口事实。默认 closed query 只读该当前 Close 与 manifest，标明未重验执行；不递归读正式结果、旧 Close 或审核正文。显式正式 status 才读父 / 子 / 必要日志，缺日志影响该指定结果读取，不反向改写已完成收口。

若当前生命周期 Run、类型、身份或 closed 对应 closeRunRef 不一致，查询失败，不回退旧 Archive。Reopen 的默认查询显示新范围 / 当前 Reopen，next 仅提示显式 bind；没有本轮 verification。closed 的 next 等待 Owner，实际可选新 Open / Reopen 留在方法 / 输出说明，不额外塞历史链。

### 3. Close 的直接输入与材料判断

新增命令（均为明确目标的本地操作，不调用旧 Change status）：

```text
delivery close --project <root> --input <project-relative-json> --role author --actor <id>
delivery reopen --project <root> --scope <project-relative-json> --reason <text> --role author --actor <id>
```

Close 输入格式：

```json
{
  "fullTestRunRef": ".mendi/runs/d01/015-delivery-full-test/run.md",
  "applicability": {
    "conclusion": "applicable",
    "materials": "实际当前代码、测试、依赖与配置的说明",
    "changes": "相对正式受测材料的变化说明；确无变化可为空",
    "reason": "为什么仍适用，必要补验的直接材料位置"
  }
}
```

Close 读取项目 / 当前 manifest、声明、当前正式父记录与直接子记录 / 必要日志、当前 full 入口及实际 Close 方法。要求 open product、本轮全部槽位一致完成且当前归档计数有效、无活动 / pending / 未解决修复，输入 ref = deliveryRunRef = fullTestRunRef；父为 submitted / complete / finished，直接观察 stable / passed，scopeMatch / commandMatch=match。正式父解析检查 scope 与 approvals 一一对应、角色不同、路径 / 阶段 / 先后身份，包含 repairApproval 时同样检查其已核对快照；Close 不重新读取快照来源正文或失败链。新修订会替换当前交接，不能用旧正式入口绕过。

applicability 需要 applicable、非空 materials / reason、字符串 changes；它保存 Author 的实际判断，不输出“自动认证源码”。方法要求检查真实候选与受测 basis、差异和必要验证：仅说明变动可沿用，未验证代码 / 测试 / 依赖 / 配置变化或无法确认则停止。CLI 无法由文字识别谎报或隔离任意外部源码写者，不增加 cryptographic gate；锁内重读本次真正消费的记录、声明、入口 / 日志保护已知一致性，仍声明该限制。

用正式执行已核对的直接事实快照避免重新要求每项旧正文；仅删除旧审核正文不撤销它曾被正式核对的事实。Close 不把普通 command PASS 当正式结果，不调用 full，不创建新 Reviewer 结论。

### 4. 读取按所属 Delivery，执行仍按当前准入

项目 product 索引接受多个唯一 ID / 规范 manifestRef，activeDeliveryId 必须精确指向登记项。只读加载器允许显式读取一个已登记对象，检查所读 manifest 的格式 / 身份 / 路径，不遍历其他 manifest 或正文。写操作只针对当前选择，非当前读取不能变成切换或写授权；manual-bootstrap 索引仍只读。

- `status / next --delivery <id>` 可选：省略使用 activeDeliveryId，提供时只读登记对象，不改变索引。保留查询既有固定 OpenSpec 信息协议，但 closed / 生命周期 / 归档查询 upstream:null，不调用旧 Change 的活动 status。
- `delivery full-test status --run <ref>`：从规范 Run 路径得到 Delivery ID，再与登记索引和该 manifest 核对，不静默使用当前 ID；不需要另传重复 ID。
- `test status --execution <id> --delivery <id>`：delivery 可省略为当前。execution ID 仅在该 Delivery 内定位，绝不跨索引搜索同名结果。

显式结果加载只依赖项目入口、指定 manifest、正式父 / 普通结果与必要日志，保留前后稳定观察、锁、身份及路径检查。将“当前范围的结构完成快照”从 verificationScope 执行准入中提取；历史结果匹配不要求 state=open、没有其他当前工作或最大 ordinal 等于项目当前计数。指定旧 Delivery 与其闭合范围可显示 scopeMatch=match；Reopen 后旧范围 changed / 当前未完成时 unavailable。commandMatch 继续对当前 package 观察，材料始终 requires-semantic-check，读取 ok 不代表新一轮通过。

执行准入仍要求当前 open product、无 pending / 归档中工作和实际范围完成；旧 Close / 历史选择不能运行测试或成为修复来源。Reopen 后当前对象为 Reopen，或 bind 后 deliveryRunRef 已退出，首次 Full Test 走本轮 firstApprovals，不因为仍有 fullTestRunRef 就进入旧 retry，也不继承旧 repairApproval。之后同轮的失败、修复 / 独立 Review、再次完整执行继续 B 的规则，新完整集合必须真实覆盖新工作与相关旧能力。

### 5. 新 Open 的兼容与编号

当前 product 完整 closed 时复用 `delivery open --id --title --scope`，追加未用 ID 的独立 group、manifest 和索引，保留旧 manifest 字节、所有旧 Run 与 archivedChangeCount。新 Delivery 没有旧 bindings、批次、正式 / Close 指针；独立 Run 从 001 开始。

为记录新 Open 需要 `--role author --actor <id>`。对首次无 .mendi 的旧调用，二者可成对省略，保持既有首次 Open 行为且不补造 Run；显式提供时保存 001-delivery-open。closed 后追加 Open 必须提供该记录身份，缺少只报用法 / 输入问题，不写状态。首次 Open 原有可选 --change / --slot 保持；若同时记录 Open 并绑定，保留 openRunRef、退出 deliveryRunRef，当前选择该初始 binding。closed 后新 Open 只建立范围，不接收 --change / --slot，同一步的 Change 激活留给显式 bind 与其授权。

新 Open 验证固定 OpenSpec 1.14.1 / nearest root 与本地配置，不初始化或自动装工具。已有 open、人工模式、重复索引 / ID、占用目标、残留现场均拒绝。未登记的残留不是新的可用 Delivery；后续同 ID 普通 Open 不覆盖它，只允许本次明确 pending 操作的有限继续。

首次可选关联复用既有 `bindingFor` / `assertAssociationAvailable`：旧入口与记录化入口都在写前检查槽位、身份与依赖；空 binding 集合中尚未归档的依赖不能由显式 role / actor 绕过。记录化提交在创建 `.mendi` 前完成可预检的关联语义，锁内复核实际必要 Change；普通错误输入无状态残留，改正可直接重试。真实写入开始后的变化与中断仍保留实际目录、占号及相应锁 / pending，不自动清理既有现场。

### 6. 一次生命周期写入与有限继续

新增生命周期应用 / adapter 负责实际提交，不向 delivery-full-test.ts 堆 Close / Reopen。复用一个项目 lease、受管路径、独占占号与临时替换；实际扩展的 records / associations、结果观察与项目查询按结构 / 选择 / 准入职责整理，不引入只转发层或注册框架。

当前事务用项目入口新增 `pendingDeliveryRunRef`，仅在本次生命周期提交未完时存在，不是历史链。它可指向尚未登记的新 Open 的受管 Run，但必须是明确 Open 意图，来源为当前 closed ID，新目标 ID 未被其他项占用；Close / Reopen 则必须属于当前 ID。解析与只读诊断允许报告这个有限中间状态；普通写操作拒绝 pending，query 不回退原 PASS / closed 宣称本次成功。仍有锁时普通 query 继续报锁错误，诊断只读现场。

记录化首次 Open 的原基准为空：独占创建 .mendi / 锁和意图，入口首次发布为带 pending 的新 ID 索引，目标 manifest 尚未写时只允许 pending 诊断 / 同操作 resume，不把缺失 manifest 当作成功。若入口发布前中断，只保留未关联占号与不完整目录，不能猜关联或重复首次 Open；旧无记录首次 Open 仍沿原有不完整写入诊断边界。

专用命令执行顺序：写前完成必要校验；加锁重读；独占创建 draft 意图 Run 和本次实际输入副本；在 project.json 保存 pending 指针；复核本次直接输入；提交不可变 terminal Run；提交目标 manifest；追加 / 选择新索引（仅新 Open）并清 pending；完整读回并释放自身锁。Close / Reopen 不改 archive 数；新 Open 不覆盖旧 manifest。成功前有任何已写现场均非零、unknown / pending 并保留锁与路径，不宣传跨文件崩溃原子性。Run 已终态而 manifest / index 未完也仍是 pending，与 Archive 有限收口的诚实解释一致。

意图保留操作类型、原选择、目标 ID、实际 input、受影响 project / manifest 的提交基准与预期目标。确需副本只保存本次真实被改写的入口 / manifest 和声明于短名 artifacts/before-project.json、before-manifest.json、input.json；不复制 Run 树，不建立 hash 清单。已知输入未变检查只用于本次操作，不能声称全库隔离。

三类命令均支持 `--resume <当前RunRef>` 分支，仅需 project / role / actor（Open 的正常 openspec 参数与新建必填字段不用于此本地分支）。实际 Owner 先另行核对原写者和任务已停止、按既有边界处置残留锁；resume 本身不解锁。锁内核对 project.pendingDeliveryRunRef、相同类型 / actor、原始直接输入及每项记录为已知 before / 已知 after，拒绝变化 / 占用 / 错身份。只补缺失终态或目标 manifest / index，已有 submitted Run 原字节保持，绝不重新运行测试或分配号。孤立占号未成为 pending 时保留，不自动关联；只有明确无效果且当前基准有效的另一次正常请求才可新分配。

已完成同一操作仍为当前时，resume 返回 already-completed；后续选择 / 工作已变化则拒绝陈旧入口。新 Open 已选中但最终读回失败时，仍按本次实际终态与目标可读性判断，不认为原指针必然仍在旧对象。必要输入丢失 / 外部变化超出有限提交模式时停止 Owner，不提供通用回滚 / 删除 / 补建。

### 7. 维护与验证组织

新增 Close、Reopen、新 Open 方法说明实际 Owner 边界、必要输入、材料判断、失败 / resume 与停止点。普通 save 仅可保存当前同 actor / role draft 的故障笔记，不改 intent；普通 submit / continue 不产生生命周期终态。查询不加载方法全文。

测试按 Close 准入、closed / 历史读取、Reopen 范围 / 批次、新 Open / 全局计数、写入中断 / 有限继续分组，使用新的 lifecycle-support 维护真实准备职责；不继续向 delivery-repair.test.ts 或旧 C / D proof 添完整流程。整链测试使用维护 full-test-project 中真实单元与接线测试并与声明相符，实际原生归档、前台完整执行；声明审核夹具与真实独立阶段批准清楚区分。

保留 B 对取消 / 后代未确认的 unknown 限制；新增直接准入场景证明 unknown 不能 Close，不重跑无关取消全套。缺必要输入、失效说明 / 未知 Ref、越界 / junction、角色 / 陈旧对象、锁及关键提交点均有针对性断言。普通 check、build 与受影响回归完成后按新增变化决定扩大检查；Apply / Review Apply 记录三类代码前三名及增长 / 职责依据，不建立额外门槛。

## Risks / Trade-offs

- [材料说明不能自动证明源码未变] → 明确阶段核对、影响 / 补验与 CLI 限制；不把 applicable 文本或单次记录比较当自动认证。
- [多文件提交中断] → 单 lease、pending 入口、真实已写路径、有限显式 resume；不自动回滚 / 解锁，终态先写不等于整体成功。
- [新范围不复用旧槽位] → 历史身份稳定；修复旧能力用新槽位，新 full 验证相关旧能力。此版不做任意历史范围编辑。
- [旧首次 Open 未保存 Run] → 原行为只读兼容；新记录化 Open 显式 actor，closed 后的新 Open 必须记录，不追补旧历史。
- [显式历史 manifest 当前记录已损坏] → 报所选对象实际错误，不扫描无关历史恢复；default 新 Delivery 查询不消费旧 manifest。

## Migration Plan

不批量迁移或重写历史，version 1 缺新字段按旧单 Delivery / 单批次读取。新格式仍为 version 1 的有界扩展，由实际 Close / Reopen / 记录化 Open 写入所需字段；无法表达一致身份的扩展拒绝。manual-bootstrap 全程只读，本项目当前材料仅人工维护。新写入开始前可回退代码；一旦真实使用多个 Delivery / closed / 多批次，新记录不能用旧只支持 open 单批次的版本解释，应保留文件并使用支持该格式的版本，不删除或降级改写。
