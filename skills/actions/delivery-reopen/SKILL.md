---
name: mendi-delivery-reopen
phase: delivery-reopen
role: author
---

# Delivery Reopen

在 Owner 明确授权后，由 Author 指定当前完整 closed product Delivery，通过 `--scope` 提供包含 `goal / plannedChanges` 的新范围 JSON，`--reason` 明确原因。新范围非空、自包含，槽位不能复用旧 bindings，依赖不能指向范围外或形成循环。保留旧 Close / Full Test、历史 archived bindings、原批次 / 路径 / 编号及累计归档数。

Reopen 只提交本轮范围与新事实：当前 Run 指向 Reopen，currentBatchId=null。随后显式 bind 不加入旧批次；首次实际 Change Run 才追加新的 NNN-changes。新工作完成后，首次正式验收读取本轮直接归档 / 审核与新完整集合，不继承旧 PASS、retry 或 repairApproval；同轮失败修复仍需独立定向审核与新整次执行。

中断时保持 pending、占号和锁并停止。Owner 另行核对写者已停止及锁处置后，同 actor 可用 `delivery reopen --resume <当前 Run>` 有限继续；核对实际输入与提交前后基准，只补缺失本地提交，不新占号、改 terminal、二次计数、重跑测试或自动解锁。当前完整完成对象返回 already-completed，陈旧对象拒绝。成功不复活旧 Change 或授权下一 Change。
