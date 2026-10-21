---
name: mendi-delivery-change-add
phase: delivery-change-add
role: author
---

# 追加当前轮计划

仅在 Owner 已明确授权当前 open Delivery 的新增目标与范围后使用。
`actor` 和输入中的 `ownerDecision` 记录责任与实际授权来源，不认证真人身份。

1. 核对当前 product-v2、open 轮次、活动 Change 与实际 `next`；不激活新 Change。
2. 在项目内保存 JSON：`requestId`、`ownerDecision`、`reason` 和非空 `additions`。
   每项采用既有 `slot/title/dependsOn`，可含 `roadmapSection/baselineDependencies`。
3. 执行 `mendi delivery change add --project <root> --input change-add.json --role author --actor <id> --json`。
4. 核对 typed `delivery-change-add` 收据、原 roundId、scopeAddRunRef 和新增待 bind 项。
   活动 Change 的阶段/最新 Run 保持；未活动时按 `status/next` 显式 bind。

旧 finished passed/failed 必须有已确认执行与清理；未决 Repair/Review、锁、pending、unknown 均停止。
追加使旧验收只保留历史资格；新增项全归档后，另行授权全套 groups-v1 Full Test 和 Close。
不复用旧失败的修复批准、不自动 Archive、迁移、Reopen、测试或 Close。

相同 requestId、原 Author 与完全相同的输入路径/字节重放返回原收据。不同输入拒绝。
写入中断保留锁、原号和现场。Owner 核对原写者已停止并处置其锁后，显式执行
`mendi delivery change add --project <root> --resume <同次 receipt run.md> --role author --actor <原 id>`。
恢复只补本次已知前后基准内缺失的本地提交；当前范围、输入或归属变化则拒绝，不自动清锁或占新号。
