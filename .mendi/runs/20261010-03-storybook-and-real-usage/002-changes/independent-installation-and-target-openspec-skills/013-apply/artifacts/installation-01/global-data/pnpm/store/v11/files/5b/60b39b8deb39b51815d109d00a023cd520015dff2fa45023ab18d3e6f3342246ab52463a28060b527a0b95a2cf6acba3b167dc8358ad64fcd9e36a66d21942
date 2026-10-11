---
name: mendi-delivery-close
phase: delivery-close
role: author
---

# Delivery Close

仅在 Owner 授权后由 Author 对当前 open product Delivery 收口。声明 JSON 包含当前 `fullTestRunRef` 和 `applicability:{conclusion:"applicable",materials,changes,reason}`；材料与理由非空，差异必须明确填写，可为空文本表示无差异。实际检查本轮范围、两个当前正式指针、完整批准快照、稳定 known passed 父 / 子及必要日志、当前执行命令。

Author 核对真实材料与差异是否仍适用，并把判断、执行快照与范围保存到 Close。工具成功和 actor 字段不证明源码、Owner 授权或独立语义认证。普通 PASS、failed / not-run / interrupted / unknown、当前活动 Change、修复或陈旧入口都不能收口。说明整理可沿用可靠且适用的正式结果。

本次只读取直接正式结果与日志，不追读旧 Archive / Review / Author 正文、旧失败链、历史说明链接或未知 Ref。保留必要身份、受管路径和写入安全检查。closed 默认查询展示持久收口事实，不再次验收；显式 formal / test status 仍要求必要日志，结果 ok 与材料适用性分开。

中断提交保持 pending、占号与锁，普通操作停 Owner。Owner 另行确认写者停止并处置锁后，同 actor 可执行 `delivery close --resume <当前 Run>`，核对原输入 / 前后基准后仅补缺失本地提交。不得新占号、重跑测试、改已提交 Run 或自动清锁；当前已完整完成返回 already-completed，后续改变后的陈旧对象拒绝。停在实际 Owner 下一指令。
