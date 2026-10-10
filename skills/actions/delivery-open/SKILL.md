---
name: mendi-delivery-open
phase: delivery-open
role: author
---

# Delivery Open

在 Owner 明确授权的目标项目与范围内，核对固定 OpenSpec 1.14.1、配置与实际输入。无状态首次 Open 可以成对省略 role / actor，保留旧入口且不补建历史 Run；显式 Author / actor 时记录 001-delivery-open。首次可选 Change / slot 成对提供，关联后当前工作转向 Change。

两种首次入口使用相同槽位与依赖准入；未归档依赖不能由 role / actor 绕过。普通错误槽位等可预检输入在创建 `.mendi` 前拒绝，修正后直接重试；锁内仍复核必要直接 Change，真实提交中断保留现场，不自动清理既有状态。

当前完整 closed 后，新 Open 必须指定 Author / actor 与新 ID、自包含范围；追加独立索引与 manifest，保留旧 Delivery、累计归档数和历史字节。Change bind 分开执行。拒绝仍 open、人工记录、重复 ID、未登记目录与中断残留；不自动安装工具或迁移人工历史。

正常提交依次保存 draft intent、原入口 / manifest / 实际输入，再发布 pendingDeliveryRunRef、terminal、manifest、项目选择 / 清 pending 并读回。成功只保存本次事实，不激活 Change、不授予 Git 或下一阶段权限。

中断时停止，报告真实占号、提交路径与锁。Owner 另行确认写者已停止并处置锁后，可用同 actor 的 `delivery open --resume <当前 Run>` 有限继续，只补缺失本地提交；不得混用正常输入、新占号、改 terminal、重跑测试或自动解锁。首次 intent 未登记入口时只能诊断现场，不能推测恢复或当空项目重新 Open。当前完整完成对象可返回 already-completed；后续工作后的陈旧对象拒绝。
