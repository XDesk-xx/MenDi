---
name: mendi-delivery-repair
phase: delivery-repair
role: author
---

# Delivery 范围内修复

本轮当前已完成提交的 Repair 可按对应 Owner 授权显式 run supplement/amend，资格取 deliveryRunRef，不取 archived Change，下游 draft/占号即停止。原文/结果/next 不改，来源自述日期 unverified。amend 单次、必填 requestId/kind，presentation-only/body 仅机械安全空白；unreviewed-comment/comment 只存非权威事后未审核评论。实质变化仍新 revise + 独立 Review；未知提交保留锁，Owner 核对停止写者并处置后，同请求显式 --resume finish，不通过补证生成正式 PASS。

新正式失败按[组级协议](../../group-tests.md)固定本轮当前直接失败、完整计划及实际受测候选。通过 --input 给出真实影响与候选；影响分析不能缩减下一次正式 selection。源码、断言和入口/配置语义修复须记录实际差异、必要 focused / fast 和限制，完成后交独立审核。已存旧 command failed 同样可以实质修复 / 审核后首次转入新完整 v2 groups-v1，无须补造旧 attempt。

已确认的纯环境准备失败/blocked，无业务或执行语义改变且本项目资源安全恢复时，按协议保留原失败与 environmentRecovery 证据，免空 Repair/Review；不凭 reason 字符串分类。外部资源、未知执行/清理/锁停 Owner，语义实变回本方法。

在同一 draft 保存正常工作与检查；未完成以 continuing 提交后沿同 Action continue。complete 后交实际独立 Reviewer。正式交接后的实质修订另建 revise-delivery-repair，固定当前直接 Author，旧 verdict / Run 保持，新 Author 必须再次审核。

不调用已归档 Change 的活动 status，不补建旧目录。扩大目标 / 方案或 rejected 停 Owner；工具 actor 只是声明。approved 后显式新整次正式 Full Test，focused 不能代替未重跑的其他组。保持归档绑定、累计完成数与旧失败原样，不执行 Close / Git 或自动激活工作。

新修复 / 审核固定当前轮 roundId，直接失败、Author 和 Review 必须归属同轮；旧轮失败 / 批准不能用于新轮。可写对象须为 version 2。迁移前已有完整 draft 保留原头部、actor、Action 和固定 Author，可在显式迁移后按原交接继续；旧 pending 或未确认执行先用兼容旧版恢复，新版不提供旧格式写入例外。
