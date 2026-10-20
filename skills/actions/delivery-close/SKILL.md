---
name: mendi-delivery-close
phase: delivery-close
role: author
---

# Delivery Close

按[组级协议](../../group-tests.md)只消费当前完整 v2 groups-v1 正式 passed。仅在 Owner 另行授权后由 Author 对当前 open product 当前轮收口。声明 JSON 唯一选择 `testAttemptRunRef`，并含 `applicability:{conclusion:"applicable",materials,changes,reason}`；材料与理由非空，差异明确填文本。输入等于 manifest.testAttemptRunRef 和最新 manifest.deliveryRunRef，实际核对轮次、范围、批准/基线快照、全部必需覆盖、真实协议/子结果/清理/日志及当前命令，保存 typed v2 acceptance。旧 fullTestRunRef / verificationRunRef 选择器单独或混用都不能新 Close；已完成历史 Close 按原类型继续只读。

Author 核对真实材料与差异是否仍适用，并把判断、执行快照与范围保存到 Close。工具成功和 actor 字段不证明源码、Owner 授权或独立语义认证。普通 PASS、failed / not-run / interrupted / unknown、当前活动 Change、修复或陈旧入口都不能收口。说明整理可沿用可靠且适用的正式结果。

本次只读取直接正式结果与日志，不追读旧 Archive / Review / Author 正文、旧失败链、历史说明链接或未知 Ref。保留必要身份、受管路径和写入安全检查。closed 默认查询展示持久收口事实，不再次验收；显式 formal / test status 仍要求必要日志，结果 ok 与材料适用性分开。

仅收口可写 version 2 当前轮；新 Close 保存 roundId，正式结果及其基线声明 / baselineFacts 与本轮一致，旧轮 PASS 不能借用。Close 使用本轮正式执行保存的直接基线完成快照，不重新展开来源旧历史。旧 product 的持久 Close 继续只读可查；任何旧格式 resume / note 写入先停止，兼容旧版恢复完整后再显式迁移。

中断提交保持 pending、占号与锁，普通操作停 Owner。Owner 另行确认写者停止并处置锁后，同 actor 可执行 `delivery close --resume <当前 Run>`，核对原输入 / 前后基准后仅补缺失本地提交。不得新占号、重跑测试、改已提交 Run 或自动清锁；当前已完整完成返回 already-completed，后续改变后的陈旧对象拒绝。停在实际 Owner 下一指令。
