# Tasks

## 1. 记录结构、当前范围与批次

- [x] 1.1 按 design §1 / §4 整理 records / associations 的结构读取与当前选择职责，支持唯一多 Delivery 索引、open / closed、本轮范围与历史 archived binding、显式 currentBatchId；用 records / associations 场景验证旧单批次和人工只读兼容、错身份 / 多当前项 / 重复编号与成员冲突拒绝。
- [x] 1.2 修改本轮 binding 选择与首次新批次建立：Reopen 后 bind 不加入旧批次，首次实际 Run 才追加 NNN-changes，保留原数组 / 成员 / 路径；用 sequential / allocation 场景验证原号连续、空占号不复用及旧绑定字节保持。
- [x] 1.3 将 completion snapshot 的结构解释与 verificationScope 的当前执行准入分开；用场景验证旧 archived ordinal 小于全局计数可读，而当前 Archive countBasis / ordinal、本轮正式执行完整性和累计增长规则仍有效。

## 2. 生命周期记录与一次本地提交

- [x] 2.1 扩展 Delivery Run 的 Open / Close / Reopen 类型、方法 / Author / actor、直接输入 / 收口摘要与 submitted 不可变校验，不为其强制 fullTest / repair；用头部 / 参数测试验证错类型 / 角色 / 路径拒绝及旧 B 记录仍可读。
- [x] 2.2 在独立 lifecycle 应用 / adapter 中复用项目 lease、占号、临时替换与读回，落实 draft intent → pendingDeliveryRunRef → terminal → manifest → index / 清 pending 的提交边界；新增写入测试在各实际提交点注入失败，验证实际路径 / 占号 / 锁保留且 query 不回退旧成功。
- [x] 2.3 实现专用 --resume 当前操作及 already-completed，核对同 actor / 类型、原输入 / before-after 基准、项目选择与安全位置，只补缺失本地提交；按操作分组验证不新占号、不改 terminal、不二次计数，陈旧 / 输入变化 / 占用 / 仍有锁均拒绝，更新方法中的有限继续说明。

## 3. Close 准入与适用性

- [x] 3.1 实现 Close 声明、Author / actor、本轮完成、两个指针一致、stable known passed 父 / 子及日志、范围 / 命令匹配和完整批准快照检查；新增 Close admission 场景覆盖必要审核 / 日志缺失、普通 PASS、陈旧对象、活动项 / 修复、failed / not-run / interrupted / unknown，以及写前拒绝无占号。
- [x] 3.2 保存材料 / 差异 / applicable 理由与实际收口摘要，提供 delivery-close 方法及 CLI / 人读 / JSON 输出；场景验证空判断拒绝、说明整理可沿用、当前修订取代旧入口后不可 Close、工具 / actor 不被描述为源码或 Owner 认证。
- [x] 3.3 验证 Close 只消费当前正式事实快照与直接执行，不读取旧 Archive / Review / Author 正文、失败链或未知 Ref；用失效历史说明 / 未知 Ref 和必要路径越界 / junction 场景证明依赖收窄与安全拒绝同时成立。

## 4. closed 与显式历史读取

- [x] 4.1 改造只读 workspace 选择与 query，支持可选 --delivery、当前 Close / Reopen / Open 与 pending 解释，保持 fixed-tool 查询协议、closed upstream:null 和最小 next；新进程测试默认 / 指定选择、当前 Run 缺失、锁 / pending、旧目录不存在，确认查询不改 activeDeliveryId / 文件。
- [x] 4.2 将正式 status 按 Run 路径所属登记 Delivery 读取，普通 test status 增加 --delivery；调整 test-store 的观察使直接读取不借 open / 当前无活动执行准入，保留父子身份、必要日志和前后稳定性；覆盖两个 Delivery 同名 execution、closed / Reopen 后旧结果、旧 ordinal 小于总数、错索引 / 越界与缺日志。
- [x] 4.3 在 README / 帮助和方法中明确默认 closed 查询只展示持久收口、显式结果仍检查必要日志，ok 与适用性分开；用输出场景核对未自动重验 / PASS 继承、unknown / 日志变化仍非零并停 Owner。

## 5. Reopen 与本轮首次新验收

- [x] 5.1 实现当前完整 closed 的显式 Reopen、新范围 / 原因和历史保留，设置 currentBatchId=null、当前 Reopen 与旧 fullTestRunRef / closeRunRef；按场景验证不预建批次、不复活旧 Change、不变归档数、空 / 复用槽位 / 依赖不合法 / 非当前 closed 拒绝，提供 delivery-reopen 方法。
- [x] 5.2 将 bind 与正式执行准入对接 Open / Reopen，首次新验收只核对本轮直接归档 / 审核并接受新完整集合，不进入旧 retry 或继承 repairApproval；场景验证新范围 / 集合真实可执行、旧 PASS 不能 Close，后续新范围失败修复仍要求当前独立定向审核及新整次执行。

## 6. closed 后新 Open 与兼容

- [x] 6.1 实现 closed 后显式新 ID Open 的追加 / 选择、独立 manifest / 001-delivery-open 与无旧正式指针；正常分支核对固定 OpenSpec / 配置、Author / actor 与受管输入 / 目标，保留旧 manifest / 索引项 / Run 与全局计数。新增场景验证另一进程选择、重复 / 占用 ID、仍 open、人工格式及旧材料字节保持。
- [x] 6.2 保留无状态旧首次 Open 成对省略 role / actor 的入口；显式记录化首次 Open 保存 001，原可选首次绑定退出 Open 当前指针；closed 后新 Open 要求记录身份且分开 Change bind。补参数 / first-open 回归与 delivery-open 方法 / README 示例，确认不补旧 Run、不默认发明 actor、不通过产品迁移本项目人工历史。
- [x] 6.3 覆盖新 Open 的未登记 group、pending / 索引选择提交、最终读回 / 释放失败及显式继续，核对旧 Delivery 不覆盖且计数不重置；首次记录化 Open 缺入口的现场也应如实诊断，不能把残留当空项目重新 Open。

## 7. 实际接线与相关回归

- [x] 7.1 新增按准备职责组织的 lifecycle-support 与独立整链场景，从维护输入实际 Open → 多 Change / 原生 Archive → 声明相符的完整测试 → Close → Reopen → 新工作 / Archive → 新完整测试 → Close；读取各次真实日志 / outcome，并验证全 Delivery 编号、新批次、历史未变与累计归档数。
- [x] 7.2 另完成 closed 后新 Delivery Open、实际归档增长与同名普通执行，跨进程读取当前新对象及指定旧正式 / 普通结果；审核 verdict 仅作为明确的记录夹具，不把准备函数或旧 Explore foreground:pass 当真实覆盖 / 独立阶段批准。
- [x] 7.3 执行普通 pnpm check、build 与本次影响的记录、分配、Archive、query、CLI、普通测试、Full Test / 修复回归，再执行既有适用的聚合测试（本仓库为 pnpm test，含 build；隔离目标按真实 test:full 映射执行）；记录实际通过 / 失败 / 未确认与必要单份日志，不触发根正式 Full Test、不重跑无关取消 proof 或追加 hash gate。失败修正具体问题后重跑受影响检查。
- [x] 7.4 在当前 Apply 摘要记录 src / tests / scripts 各自维护代码行数前三名和有可靠基准的增长 / 职责结论，同步实际 README / context / 方法，交独立 Review Apply；检查本轮扩展混杂职责已整理且无纯转发层，旧 Run / verdict、旧 C / D proof 原用途保持。

## 8. 027 独立审核后的定向修订

- [x] 8.1 修复 RA-C-001 / RA-C-002：首次记录化 Open 复用既有槽位与依赖准入，在创建状态目录前完成可预检语义并保留锁内复核；真实固定 OpenSpec 回归覆盖两种入口拒绝未归档依赖、合法关联、错误槽位修正后直接成功，以及直接输入在提交期间变化和原有首次失败 / resume。执行 pnpm check、build 与受影响回归，在新 Author Run 记录行数 / 结果并停独立 Review Apply，保留旧 Run / verdict。

## Workflow follow-up

- 本方案完成后先交独立 Review Propose，批准与 Owner 后续 Apply 指令具备后才实施；任务齐备不是批准。
- Apply 完成停独立 Review Apply；实际 Archive、项目正式 Full Test / Close / Reopen / 新 Open、Git 和后续 Change 保持各自授权边界。
