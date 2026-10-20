---
name: mendi-delivery-full-test
phase: delivery-full-test
role: author
---

# 正式 Delivery Full Test

新正式写入唯一使用[组级协议](../../group-tests.md)的 groups-v1 完整 initial；旧 command、v1 continue/retest/verification 仅供历史读取。先核对实际 Owner 授权、本轮全部完成槽位及直接 Apply / Review 批准。项目内声明 JSON 包含 mode、planRef、candidate（id 与 basis.materials/changes，可选完整 commit）、purpose:initial 和全部必需 selection。新父 Run 保存 attempt.version:2、当前轮、完整计划/候选/批准/基线、真实执行、协议及正式终态。

正式启动前，先查看目标已有 full 入口、配置及准备检查，核对本次实际需要的依赖、构建输出、服务、端口与绑定地址、测试数据和并行共享资源。优先沿用目标已有准备入口；无服务或端口需求的集合不强加检查，不扫描全机或扩成通用资源平台。由目标项目执行实际准备和资源检查，MenDi 的 skill 提醒不代表 CLI 已自动完成这些检查。

固定端口被占用时，在启动受影响测试前核对占用者及服务身份；不能仅凭 PID、URL 可达或旧记录认领复用，更不能自动杀掉无关进程。支持动态端口时，由服务实际绑定取得端口并传给测试及相关配置，不先探空闲、关闭探针后假定稍后仍可用。提前检查不代替启动时的真实绑定、就绪与本次资源归属确认；只清理本次取得且归属明确的资源。

环境冲突或必要资源未准备好，说明具体资源、观察和受影响范围，先处理或暂停依赖项，不把未启动业务记成断言失败、PASS 或覆盖完成；安全且资源独立的检查可继续。若正式执行尚未启动，保存准备诊断，不伪造 child、测试计数或正式失败终态；若已启动，保留实际命令结果及组协议下的 blocked / not-run 等事实，不用环境说明覆盖原失败。检查与准备本身不代替完整验收，不因冲突临时删减必需范围。

使用目标已有 full 入口一次执行全部声明集合。调用者正常准备依赖，工具不自动安装。父 Run 保存 `scope:delivery`、完整范围与已核对批准快照、声明、实际入口和 prepared / running / finished 状态；子结果保持 `scope:command / formalDeliveryTest:false`。父 Run 保存 `executionId` 和实际 outcome，依赖 / 工具拒绝时为 not-run、子 ID 可为空，原始预检输出放当前 artifacts。普通 submit / continue 不能产生正式终态。

passed 要求本次全部必需组真实通过、计数与根结束完整、无必需 skip/TODO/取消、报告/退出一致、清理及父子持久读回稳定；wrapper exit0 不足以通过。执行前后核对实际材料及影响；CLI 显示 `scopeMatch / commandMatch` 和 `materialApplicability:requires-semantic-check`，不自动认证任意源码。发现并发变化或不能确认时，保留原执行事实，在阶段摘要说明并按影响补验；不能宣称当前材料已通过或据此 Close。

failed 转范围内 Author 修复及独立定向 Review，approved 后显式重新 initial 全部必需组，不能拼接旧组或 focused。纯环境准备 failed/blocked 仅在原报告或预检、资源归属/恢复/清理及未变直接材料均可核实后按组协议 environmentRecovery 免空修复记录。已核对且仍适用的本轮批准快照可以沿用，不追读历史失败父链。known not-run / interrupted 也须确认当前安全与材料，不能直接绕过准备证据或实质修复审核；unknown / 未完成 / 写入失败保留现场停 Owner，不重试、不自动 finish 或清锁。

修复后首次执行和后续重跑都需要当前必要 Review 的完整头部与非空正文，查询不因此倒查正文。取消时停止命令返回成功仍需本次 child / 日志管道关闭确认；无法确认则有界返回 unknown，可能仍有存活后代，须核对现场，不能据入口退出宣称整树停止。查询遇到本次不稳定观察时 next 同样停 Owner，不以旧 passed 提示收口。

结果与最新正式入口只供后续 Close 直接核对本轮范围、必要审核和实际候选影响，不构成 Close / Archive / Git / 下一 Change 授权。

新正式记录固定当前 version 2 轮次 roundId 和本轮完成范围，并直接核对 baselineDependencies，保存 baselineFacts（当前槽位、来源 Delivery / 槽位 / Close / Change / ordinal）。只读直接来源，不读取来源活动 status、旧审核正文或旧日志，不迁移旧来源。Close 消费本次保存快照与本轮声明；基线不替代当前轮执行。旧结果保留原 outcome，只在明确迁移收据的旧编号边界内解释缺 roundId；新记录缺归属或跨轮批准拒绝。旧 product status 可读，run 必须先显式迁移，旧未确认执行先兼容旧版恢复。
