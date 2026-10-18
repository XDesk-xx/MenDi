---
name: mendi-delivery-reopen
phase: delivery-reopen
role: author
---

# Delivery Reopen

在 Owner 明确授权后，由 Author 指定当前完整 closed product Delivery，通过 `--scope` 提供包含 `goal / plannedChanges` 的新范围 JSON，`--reason` 明确原因。新范围非空、自包含，槽位不能复用旧 bindings，依赖不能指向范围外或形成循环。保留旧 Close / Full Test、历史 archived bindings、原批次 / 路径 / 编号及累计归档数。

Reopen 只提交本轮范围与新事实：当前 Run 指向 Reopen，currentBatchId=null。随后显式 bind 不加入旧批次；首次实际 Change Run 才追加新的 NNN-changes。新工作完成后，首次正式验收读取本轮直接归档 / 审核与新完整集合，不继承旧 PASS、retry 或 repairApproval；同轮失败修复仍需独立定向审核与新整次执行。

仅写可写 version 2。每次锁内追加一个稳定 rNNN，保存本轮 roundId、日期和原因，同日多轮也不合并；同次恢复不重复追加。旧 scope / Full Test / Close 保存在原轮，当前顶层不再保留旧轮结果指针。`status --round <rNNN>` 展示只读保存摘要，不改变选择或生成历史 next。旧 product 先预览并获授权迁移；旧中断先兼容旧版恢复。

dependsOn 仅为本轮 DAG；baselineDependencies 显式列 deliveryId / planningSlot / closeRunRef，核对同项目登记 product 的归档绑定及指定 Close 快照。同 Delivery 必须为更早已关闭轮；跨 Delivery 来源可后来 Reopen，也可保持 v1。manual 仅作说明，不能满足硬依赖。不递归核对来源旧审核、日志或活动 Change，不把来源算作本轮新增完成项。

中断时保持 pending、占号和锁并停止。Owner 另行核对写者已停止及锁处置后，同 actor 可用 `delivery reopen --resume <当前 Run>` 有限继续；核对实际输入与提交前后基准，只补缺失本地提交，不新占号、改 terminal、二次计数、重跑测试或自动解锁。当前完整完成对象返回 already-completed，陈旧对象拒绝。成功不复活旧 Change 或授权下一 Change。
