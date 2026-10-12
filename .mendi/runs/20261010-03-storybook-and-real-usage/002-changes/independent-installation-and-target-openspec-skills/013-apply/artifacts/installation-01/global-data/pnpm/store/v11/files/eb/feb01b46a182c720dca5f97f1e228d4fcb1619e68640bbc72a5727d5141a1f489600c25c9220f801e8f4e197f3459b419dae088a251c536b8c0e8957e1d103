---
name: mendi-delivery-full-test
phase: delivery-full-test
role: author
---

# 正式 Delivery Full Test

先核对实际 Owner 授权、本轮全部完成槽位及直接 Apply / Review 批准。提供项目内声明 JSON：非空无重复 `collection`、`basis.materials` 和 `basis.changes`；有 Git 基准时填写真实完整 `basis.commit`，无基准省略。说明实际源码、测试、依赖、执行配置及差异，不以任意版本数或文件 hash 清单代替。

使用目标已有 full 入口一次执行全部声明集合。调用者正常准备依赖，工具不自动安装。父 Run 保存 `scope:delivery`、完整范围与已核对批准快照、声明、实际入口和 prepared / running / finished 状态；子结果保持 `scope:command / formalDeliveryTest:false`。父 Run 保存 `executionId` 和实际 outcome，依赖 / 工具拒绝时为 not-run、子 ID 可为空，原始预检输出放当前 artifacts。普通 submit / continue 不能产生正式终态。

passed 只证明本次声明下完整命令正常退出与必要两层结果保存读回。执行前后核对实际材料及影响；CLI 显示 `scopeMatch / commandMatch` 和 `materialApplicability:requires-semantic-check`，不自动认证任意源码。发现并发变化或不能确认时，保留原执行事实，在阶段摘要说明并按影响补验；不能宣称当前材料已通过或据此 Close。

failed 转范围内 Author 修复及独立定向 Review，approved 后显式重新运行原整个集合，不能拼接 focused。已核对且仍适用的本轮批准快照可以沿用，不追读历史失败父链。known not-run / interrupted 现场完整时允许显式新执行；unknown / 未完成 / 写入失败保留现场停 Owner，不重试、不自动 finish 或清锁。

修复后首次执行和后续重跑都需要当前必要 Review 的完整头部与非空正文，查询不因此倒查正文。取消时停止命令返回成功仍需本次 child / 日志管道关闭确认；无法确认则有界返回 unknown，可能仍有存活后代，须核对现场，不能据入口退出宣称整树停止。查询遇到本次不稳定观察时 next 同样停 Owner，不以旧 passed 提示收口。

结果与最新正式入口只供后续 Close 直接核对本轮范围、必要审核和实际候选影响，不构成 Close / Archive / Git / 下一 Change 授权。
