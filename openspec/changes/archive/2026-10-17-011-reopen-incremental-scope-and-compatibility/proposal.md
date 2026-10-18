# Proposal

## Why

当前 Reopen 以新范围覆盖 manifest 顶层目标与计划，旧绑定和收口虽保留，同一 Delivery 的历轮承诺却没有统一、可查询的表示。002 Explore 及 003 独立审核确认，直接拼接旧槽位或仅添加 v1 扩展字段均不能修复该问题，必须连同当前轮消费、格式兼容与授权迁移一起交付。

## What Changes

- 为新的 product 项目入口和 Delivery manifest 采用 `formatVersion: 2`，以 `rounds[] / currentRoundId` 保存首次 Open、每次 Reopen 与其范围、工作批次及收口；顶层保留的当前字段仅为统一生成、校验的投影。Delivery ID、首次日期、Run / Change / 归档身份与路径不变。
- 默认工作与 next 只消费当前轮；允许按 `status --round <round-id>` 查询已登记轮次的完整范围及收口。Reopen 只追加新轮，不重新绑定旧槽位或借旧 PASS 收口。
- 在计划槽位的 `baselineDependencies` 中明确已交付成果，支持同一项目内同 Delivery 跨轮及跨 Delivery 的直接结构化核对。本轮 `dependsOn` 继续只表示本轮待完成工作；来源 product 的归档关联与指定 Close 完成事实可核对，旧 product 来源无需先迁移，manual-bootstrap 只能作说明。
- **BREAKING**：新版对旧 product 保留只读查询与明确结果读取，所有普通产品写入口须先迁移；不通过查询、bind、保存笔记、测试或 resume 静默升级。manual-bootstrap 继续只读，不纳入产品迁移。
- 增加显式 `delivery migrate preview / apply / resume`，只迁移当前选定 Delivery 及必要项目入口，保留其他 Delivery 的原文件。支持记录完整的 open / closed 状态及活动 Change / draft；有写锁、pending、未确认执行或不完整提交时先停在对应恢复边界。
- 预览按实际必要直接材料重建轮次与归属，充分旧范围和收口可明示为 `legacy-baseline`，不补造 Open Run；真实缺口、矛盾或预览后输入变化拒绝写入。复用现有独占锁、Delivery Run 编号及 pending 机制，迁移完成保持原协作交接，中断显式继续且不重复追加轮次。
- 正式 Full Test、repair / review 和 Close 明确消费所属轮次及本轮直接依赖事实；旧失败、旧单次成功与原批准保持，A 不改变同轮多次执行的组合政策。

## Capabilities

### New Capabilities

无。不新建通用版本、依赖解析或迁移平台。

### Modified Capabilities

- `delivery-workspace`：版本化轮次范围、只读历史查询、当前轮关联 / 批次与旧格式写入边界；同项目内已交付 product 基线的直接依赖核对。
- `delivery-lifecycle`：首轮与增量 Reopen、轮次 Close、授权迁移预览 / 提交 / 恢复及不改变活动交接的迁移收据。
- `delivery-verification`：正式结果、修复和收口的轮次归属，结构化基线的直接完成快照及旧结果的限定读取；现行同轮整次执行合同不变。

## Impact

- 主要代码落点为 `src/core/records.ts`、`associations.ts`、`batches.ts`、`lifecycle-transition.ts`、验收 / Run 解析，及对应 application、storage adapter、CLI 参数与输出。各写入口共享必要的格式与轮次准入，读取不能误用写入 gate；迁移纯转换与存储提交分开，不扩大成通用引擎。
- 同步受影响的 Open / Reopen / Close、阶段 / Archive、验收及迁移指导；场景测试覆盖旧 product 与 manual 只读、活动 draft 迁移、多次及同日 Reopen、跨 Delivery 基线、缺口与冲突、旧 PASS 隔离及中断恢复。复用有效 Explore proof，不扩展旧大型 proof 作为产品验收。
- 不增加外部依赖、不升级 OpenSpec、不在本 Change 自动决定修复版包版本或切换稳定安装。DreMo 和现有稳定安装均不在本阶段写入范围；实际目标迁移、正式 Full Test / Close、Git 与发布继续各依授权。
