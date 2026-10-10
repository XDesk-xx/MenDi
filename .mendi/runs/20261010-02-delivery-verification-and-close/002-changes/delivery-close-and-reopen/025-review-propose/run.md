---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: delivery-close-and-reopen
planningSlot: MVP-D02-C
batchId: 002-changes
actionId: delivery-close-and-reopen-review-propose-01
actionType: review-propose
role: reviewer
run: "025"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: apply
nextRole: author
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/delivery-close-and-reopen/024-propose/run.md
---

# MVP-D02-C Review Propose

Owner 指令：review-propose。固定独立审核 024 Propose 及当前 proposal、design、五份 delta specs、tasks，使用项目 [review-propose 方法](D:/Projects/MenDi/skills/actions/review-propose/SKILL.md)；保持简单，不增加新的 gate。

**verdict：approved。** 无阻断发现，方案足以进入 Apply。批准的是范围、行为设计和实施验证安排，不代表生命周期已经实现或正式验收通过。未修改 Author 024、方案、规格、任务或实现后自签。

## 语义审核

| 重点 | 结论及对应实施安排 |
| --- | --- |
| closed 与历史查询 | design §2 / §4 区分持久收口摘要与显式正式 / 普通结果读取。默认 closed query 只读当前 Close / manifest，缺旧日志不撤销历史收口；显式结果仍读必要父 / 子 / 日志并检查稳定性。正式 Run 按路径所属登记 Delivery、普通 execution 按可选 --delivery 定位，同名 ID 不跨目录搜索。任务 4.1–4.3 覆盖跨进程、旧计数、缺日志及错误身份。 |
| Close 必要输入 | §3 固定输入 ref = deliveryRunRef = fullTestRunRef，本轮完整、当前 stable known passed、范围 / 命令匹配、直接批准快照一致。范围内未完成修复、普通 PASS、旧结果、unknown 和不完整记录均拒绝。批准快照只校验其直接身份与适用范围，不重新读取所有来源正文或失败链；任务 3.1–3.3 同时验证必要输入拒绝与旧说明缺失可用。 |
| 材料适用性 | applicability 保存阶段对实际候选、差异和补验的判断，不将文字或 actor 当作自动源码 / Owner 认证。仅说明变化可沿用，未验证实现 / 测试 / 依赖 / 配置变化须停止；锁内直接输入复核只保护本次消费对象。CLI 对任意外部源码变化和谎报无法自动认证的限制明确，不用全库 hash 补洞。 |
| Reopen 的范围与选择 | §1 / §2 / §4 保留旧 binding / 批次 / Close / PASS，以新自包含槽位表达本轮范围；当前选择不回退旧 archived 项。currentBatchId=null，首次实际新 Run 才建批次，整个 Delivery 连续占号。新正式执行只消费本轮 direct approvals / 声明，不进入旧 retry 或继承 repairApproval；任务 1、5、7 验证新范围及后续修复完整重跑。 |
| 新 Open 与兼容 | §5 当前完整 closed 后追加独立索引、manifest 和 001 Open，保留旧记录与全局计数；无旧正式指针、无预建批次。首次旧入口可成对省略 role / actor，显式记录化入口才写 Run，不发明 actor 或补旧历史。后续 Open 与 bind 分开，manual-bootstrap 不迁移；任务 6 与 7.2 覆盖兼容及真实新旧选择。 |
| unknown 与有限继续 | §6 的 pendingDeliveryRunRef 仅表达当前生命周期提交，终态已写不等于整个操作完成。resume 只在原类型 / actor / 直接基准和现场一致时补剩余本地写入，终态不改、不新占号、不重测；原锁须由 Owner 另行核对处置。入口发布前的孤立占号不猜关联，已完成重试只在仍为当前时返回 already-completed，陈旧对象拒绝。任务 2、6.3 覆盖关键提交点，未新增通用恢复或自动解锁。 |

已对照现有 records / associations、workspace 读取、test-store 观察和 B 正式验收规则：旧单索引 / 批次、open 准入与历史读取共用的限制确实需要本方案调整；Archive 正在提交时的 countBasis 校验不能随历史 ordinal 可读规则一起放宽。tasks 1.3 已明确这一区别。

新增 pending 是未完成操作的当前入口，不是新增历史证据链。短名 before-project / before-manifest / input 副本只服务本次提交；完成后普通查询不读取它们。实施须保持该依赖边界，不将有限继续抽象成全流程恢复平台。原有字段、路径、锁和角色保护继续适用，没有新增行数、hash、证据数量或工程检查 gate。

## 验证安排与保留事项

任务按记录结构、生命周期提交、Close 准入、读取、Reopen、新 Open、实际接线分组，职责与依赖清晰。7.1 / 7.2 要求真实多 Change 归档、相符的单元 / 接线测试和两次 Close，并覆盖 closed 后新 Open；已落实 023 对 foreground:pass proof 不能认证真实覆盖的限制。旧长 proof、delivery-full-test.ts 与 delivery-repair.test.ts 不继续混入新生命周期职责。

非阻断说明：任务 7.3 的“既有适用的 test:full”须以实际目标 package scripts 为准。当前根 package.json 只有 `pnpm test`，没有 `test:full`；根相关工程回归使用现有入口，隔离生命周期目标使用其真实 full 映射。不为凑名称新增脚本，不把未运行的命令记为通过，也不触发根正式 Full Test。可在 Apply 随实际命令记录澄清，不需要单独 revise-propose。

沿用 023 对 P01–P07 的独立审核和工程检查，以及 B 020 对 unknown / 后代未确认的有效限制。当前方案没有改变 proof 或维护源码 / 既有测试，无需重跑探索、取消全套或全仓库行为回归。新增 Close 的 unknown 拒绝及真实生命周期成功 / 中断仍须在 Apply 实测；计划中的断言不是已通过证据。

## 本次独立检查

| 检查 | 实际结果 |
| --- | --- |
| 固定 OpenSpec `validate delivery-close-and-reopen --strict --json` | exit 0，1/1 valid、issues=[]，见 [validate.json](artifacts/validate.json)。 |
| 固定 `status`、design / tasks instructions | 均 exit 0；nearest root=MenDi，规划产物完整；design 依赖 proposal，tasks 依赖 specs / design，均 done=true，无附加 rules，当前 context 与范围一致。见 [status.json](artifacts/status.json)、[design-instructions.json](artifacts/design-instructions.json)、[tasks-instructions.json](artifacts/tasks-instructions.json)。 |
| 固定 `instructions apply` | exit 0，state=ready，21 total / 0 complete / 21 remaining，实际 contextFiles 为本次产物。见 [apply-instructions.json](artifacts/apply-instructions.json)。ready 不授予实施或验收批准。 |
| 本次 delta 与主规格核对 | 15 个 MODIFIED 块均有对应原要求且保留原场景名；五份 delta 与设计 / 任务已人工核对语义。见 [coherence.json](artifacts/coherence.json)。名称检查仅为辅助，不替代审核、不建立数量 gate。 |

本轮仅新增 Reviewer 记录 / 上述输出并同步当前交接说明，没有生成实现或勾选任务。普通 check / build 和 proof 沿用 023 的适用结果，不宣称本轮重新运行。

## 交接

下一步 Author `apply`，当前必要入口只指向本 025，由头部固定 024。D02 保持 open / manual-bootstrap，C 活动，A / B archived，累计完成数 6；README / context 同步阶段，新进程 status / next 读回见 artifacts/status-final.json 与 next-final.json。

本轮停在 Apply 边界，未执行 Apply、产品生命周期、根正式 Full Test、Archive、Git 写操作或下一 Change 激活。旧编号、Run 与 verdict 保留。
