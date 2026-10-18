# MenDi 优化事项：Reopen 增量保留历轮范围与当前轮独立验收

记录日期：2026-10-16。状态：Owner 已明确修复方向，待后续设计与落实。本次仅整理问题和方案，不激活 Change，不修改实现、稳定安装包或任何目标项目的生命周期记录，不执行 Git 提交或推送。DreMo 暂停后续推进。

本文是待处理事项，产品总设计仍以 `mendi-foundation-and-delivery-roadmap.md` 为唯一入口；正式方案落定后同步相关总设计与 OpenSpec 材料，不在本文另建长期产品规划。

## 问题与真实案例

Owner 明确要求：同一 Delivery reopen 应增量保留历轮范围，当前轮单独验收。Delivery 的身份和首次打开日期保持不变。

当前 MenDi 0.1.0 把 manifest 顶层 `goal / plannedChanges` 作为当前范围。Reopen 将新 scope 展开到既有 manifest，覆盖旧目标与计划；旧 bindings、批次、Run、Close 和 Full Test 引用仍保留，历史范围可通过 Run 和快照追溯，但 manifest 本身没有完整表达同一 Delivery 各轮承诺与收口的结构。

DreMo 的 Delivery `20261013-02-learning-workbench-and-feedback` 暴露了这一问题：

| 轮次 | 已登记事实 | Reopen 后的表现 |
| --- | --- | --- |
| 首轮 | P09、P10-L；Full Test Run027；Close Run028 | 原 `goal / plannedChanges` 被覆盖，旧归档绑定和历史引用保留 |
| 本轮 | 2026-10-16，Run029 reopen，新增 P10/P13 | 顶层范围仅显示 P10/P13，当前停在 Change 绑定/激活前 |

本问题不是旧 Run 或归档丢失，也不是本轮手工修改旧 submitted Run；它是持久化范围模型的缺口。工具按当前实现执行成功，不能证明符合 Owner 要求的增量语义。

直接证据入口（引用原件，不复制历史证据树）：

- 当前源码：`src/core/lifecycle-transition.ts` 的 reopen 分支通过 `...before.manifest, ...value.scope` 替换当前范围。
- 当前源码：`src/application/delivery-lifecycle.ts` 拒绝新范围复用旧 binding 的 `planningSlot`，因此不能简单把旧槽位重新塞进本轮输入。
- 固定安装包的方法：`D:/tools/mendi/current/node_modules/mendi/skills/actions/delivery-reopen/SKILL.md`，要求自包含新范围，保留历史绑定与收口。
- DreMo 当前 manifest：`D:/FD/src/DreMo/.mendi/delivery-groups/20261013-02-learning-workbench-and-feedback/manifest.json`。
- Reopen 记录及前态：`D:/FD/src/DreMo/.mendi/runs/20261013-02-learning-workbench-and-feedback/029-delivery-reopen/run.md`、同目录 `artifacts/before-manifest.json`。
- 已保存差异：DreMo checkpoint `cef33558a84b5cd37bd45b59f26ced79b1e22acb` 相对父提交的 manifest 变化。

以上是本次核查时的事实；后续实施需要重新核对当时源码及安装版本。

## 修复目标与边界

1. 同一 Delivery 每次 open/reopen 的范围都可直接查询，已完成轮次的目标、计划及验收引用不被下一轮覆盖。
2. Reopen 追加本次新增范围，明确当前轮；新轮不复活旧 Change，不重新登记旧槽位。
3. 当前轮完成判断和验收依据只来自当前轮；历史成果可作为依赖与回归基线，不能算作本轮新完成项或复用旧 PASS。
4. 保留 Delivery ID、首次日期、Change ID、Run 编号、归档编号及原路径；不新增轮次目录、不重排历史文件。
5. 以满足上述语义的最小模型修复，不扩展为通用版本管理、审批编排或全量历史 hash 系统。

## 建议的数据模型

建议在 Delivery manifest 中追加历轮范围集合，并以当前轮指针选择实际执行范围。以下字段仅为设计草案，不是已生效协议：

```text
Delivery
  formatVersion
  id / title / openedOn
  state
  currentRoundId
  rounds[]
    id
    openedOn / reason
    scope
      goal
      plannedChanges
    state
    openRunRef 或 reopenRunRef
    fullTestRunRef
    closeRunRef
```

轮次编号在 Delivery 内稳定递增，不依赖日期。同一天可以 close 后再次 reopen；Git 分支名也不作为轮次身份。首轮同样进入统一模型。

优先复用既有 open/reopen Run 作为轮次来历。绑定、批次和验收记录需要能够明确归属某一轮；是否增加 `roundId` 或利用已有直接关联，应在正式设计中选一种明确且最小的方式，避免重复维护相同事实。

如果为兼容保留顶层 `goal / plannedChanges` 或收口指针，必须声明它们是当前轮投影并由统一逻辑产生，不能成为另一套可独立修改的权威范围。Delivery 总览应展示历轮承诺和累计成果，当前执行入口则只读取当前轮。

## 生命周期与验收行为

| 操作 | 预期行为 |
| --- | --- |
| 首次 open | 建立首轮，保存首次范围；保留稳定 Delivery 身份 |
| reopen | 在已关闭轮次之后追加新轮，保存新目标、计划、原因和原 Close 来历；旧轮不变 |
| Change bind / 阶段工作 / archive | 关联当前轮的新槽位与新批次，保持旧绑定、批次和归档事实 |
| status / next | 简洁显示当前轮、范围和下一步；能够按需查询历轮范围与收口，不在 next 递归堆积全部历史 |
| Full Test | 对当前候选验证本轮新增工作、受影响旧功能及项目必跑集合，结果明确归属当前轮 |
| close | 核对当前轮必要范围、独立评审、归档及适用验收结果，保存该轮 Close；不能由旧轮收口引用满足 |

跨轮依赖可以引用已经交付的能力，不要求重复激活旧 Change。本轮 P10 可依赖首轮 P09/P10-L，但首轮槽位不成为本轮待完成项。对其他 Delivery 的依赖沿用真实已交付基线，不为表达依赖重新登记对象。

旧轮通过结果不能自动视为新轮通过。验收“所属轮次”和测试“执行集合”要分开：当前轮独立验收并不等于只运行新增功能测试。

与 `mendi-full-test-continuation-improvement.md` 协同：该事项另行讨论同一轮失败后按影响范围续测/复验的政策。本修复不提前决定必须整轮重跑或允许何种结果组合，也不更改现行规则；无论最终政策如何，都必须保留失败来历，禁止跨轮借用旧 PASS 直接收口。

## 兼容与已有数据处理

这是持久化模型变更，需要明确格式版本、读取兼容和迁移方式，不能只修改数组拼接。

- 对旧格式先只读识别，不因普通 status / next 静默改写目标记录。是否支持兼容查询及哪些写操作要求迁移，应在正式设计中明确。
- 可用原 open/reopen Run、scope 输入、前态快照、批次及收口记录重建历轮范围；只读取确实必要的直接材料，不递归要求所有历史证据齐全。
- 迁移应先给出目标、识别结果与差异预览；写入单独授权。材料不足或相互矛盾时报告具体缺口，不猜测补造范围、轮次或验收结论。
- 迁移只更新获准的当前表示及必要新增关联，不改写 submitted Run、旧 verdict、归档身份、原始日志或旧 Full Test / Close 的历史事实。
- 迁移与 reopen 均要覆盖中断和重复执行，保留占号与现场，避免重复追加轮次；不自动清锁。
- MenDi 修复、验证及稳定版本准备完成后，再单独处理 DreMo 的兼容与迁移。当前不手工向 DreMo manifest 添加工具不认识的字段，也不重做 Run029 或改写 checkpoint。

## 验收场景

| 场景 | 必须证明的结果 |
| --- | --- |
| 首次 open 后 close | 首轮目标、计划和收口归属清晰 |
| 首轮 P09/P10-L，reopen P10/P13 | 两轮范围同时保留，当前范围只有 P10/P13；旧绑定与归档不变 |
| 连续多次及同日 reopen | 轮次身份稳定、不冲突、不覆盖旧轮 |
| 当前轮 bind / next / archive | 只推进本轮槽位，旧批次不被重新使用 |
| 当前轮依赖旧成果 | 允许引用有效基线，旧成果不被登记为本轮新交付 |
| 旧 Full Test PASS / Close 存在 | 新轮仍需满足自身验收，旧结果不能直接关闭新轮 |
| 新轮验收与回归 | 执行集合可包含旧功能，结果归属新轮且范围准确 |
| 历史查询 | 可定位每轮承诺和原收口，不要求复制整条历史链 |
| 旧格式兼容及迁移 | 普通查询不静默写入；预览准确；不改原始历史；缺失/矛盾有明确报告 |
| 中断与恢复 | 不重复追加轮次、不丢失原范围、不自动清锁 |

后续实施需同步维护源码、类型/解析、CLI 查询、产品 skills、测试夹具及产品总设计。实际受影响面由 Explore 核实，不能只改 manifest 写入点就宣称完成。

## 当前停止边界

本次只新增此文档，不执行 MenDi Delivery open/reopen、Change 激活、实现、评审、迁移、发布或 Git 操作。DreMo 保持当前已 reopen、尚未激活 Change 的状态，等待工具修复及后续明确指令。
