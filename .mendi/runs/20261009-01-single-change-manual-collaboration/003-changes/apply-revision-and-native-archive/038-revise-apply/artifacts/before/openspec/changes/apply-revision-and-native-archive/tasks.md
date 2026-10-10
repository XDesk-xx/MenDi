# Tasks

任务以 design.md 的决策和三份 delta 为准；完成状态以逐项真实实施 / 验证后的勾选为准。每组随实施提交相应测试与方法文档，不扩写旧 Explore proof 充当产品验收。

## 1. 整理正在扩展的职责

- [x] 1.1 将 application/actions.ts 中指引与 Owner 处置分到 action-instructions.ts、action-resolution.ts，必要共享检查放入小范围上下文模块，CLI 直接接线；以既有 Action / planning / CLI 回归确认行为保持，不增加纯转发层。
- [x] 1.2 为 D 的操作 inputs、Owner 处置、Archive 执行 / 故障及查询准备分组测试和显式必要输入夹具；确认旧 C / D proof 与既有领域测试未被追加大流程，共用准备不隐藏批准、锁或故障点。
- [x] 1.3 在 AGENTS.md 与 Review Apply 方法落实 src / tests / scripts 各前三名、实际增长依据、职责判断及处理时机；核对无硬行数 / hash 门槛，旧限定 proof 的保留理由与下次整理触发条件有明确说明。

## 2. 接入真实操作指引

- [x] 2.1 为固定 OpenSpec adapter 增加独立 Apply operation 解析，校验实际 root / Change / schema、contextFiles、任务、进度 / state 及可选指导；以真实 blocked / ready / all_done 和畸形进度、必要输入缺失、身份 / 路径 / junction、未知 Ref 测试确认，不影响原 artifact 协议。
- [x] 2.2 增加 Archive instructions 解析并从真实 status 核对 schema，保留实际 context / guidance，不要求缺省 template / outputPath / schemaName；以固定工具响应和错身份 / 指导类型回归确认。
- [x] 2.3 接线 `action instructions --operation apply|archive`，与 artifact 互斥并校验当前 actionId / 阶段；更新产品 OpenSpec / Apply 方法与 CLI 使用说明，用真实 CLI 测试确认只读、陈旧请求拒绝且不改 Run / 任务 / 交接。

## 3. Apply 处置与显式回退

- [x] 3.1 扩展 Owner handoff 到未完成 Apply / Review Apply，扩展 rejected 同阶段 revise；更新 Apply 方法并测试直接 Author 固定、Reviewer 独立、旧 actor 陈旧拒绝和新修订必须重新审核，保留既有 Explore / Propose 行为。
- [x] 3.2 实现 `resolve --resolution rollback --phase ... --revises ...` 的严格较早阶段校验、新 revise draft 与直接 Owner 决策；测试 Propose / Apply 含 Review / revise 回退、目标完成 / 类型 / 身份 / 路径要求、历史 source 缺失时查询及逐阶段重新审核，不删产物或沿用旧批准跳段。
- [x] 3.3 覆盖处置的写前变化、并发、指针 / 读回失败与旧 Run 字节不变；更新 Owner 处置 / CLI 文档，确认失败不伪报成功、不改旧 verdict、不自动解除锁或扩展授权。

## 4. Archive 准备与原生执行

- [x] 4.1 增加 Archive Action、typed Run / binding 过渡态和直接 Review / Author / 尝试字段；准备要求当前独立 Review Apply approved 与真实 Apply all_done，普通 save 仅改笔记，submit / continue / 不支持 Archive review 修订拒绝；以产品前置及新进程解析测试确认准备无原生调用、无计数增长。
- [x] 4.2 实现显式 `action archive --mode execute` 的锁内复核、调用前标记与本次有限输入 / attempt 留存，adapter 保存公开包装 JSON、退出 / 信号 / stdout / stderr；在沙盒用固定入口实际归档测试原生同步、错误 / 非 JSON / 身份与路径拒绝和两个执行进程竞争，不使用跳过验证或重复同步。
- [x] 4.3 实现原生效果的定向读回、真实日期与唯一候选定位，区分 prepared / invoking / none / confirmed；以已完成但响应丢失、无可靠效果、源与目标并存、多个候选、规格 / 元数据变化及跨日期测试确认，不以错误码或旧预定目录认证无效果。
- [x] 4.4 允许显式 execute 仅在 prepared 或已保存 none 且再次确认无效果、输入 / 批准 / 任务仍有效时建立新 attempt；实现 prepared / none Archive 的 Owner rollback；以组内合法 prepared / 已保存 none 的产品场景验证两个显式入口，仍是 invoking 时 execute / rollback 拒绝，保留旧错误并验证新审核、输入改变 / 已发生 / 未知 / 锁未解除不得绕过。
- [x] 4.5 新建产品 Archive 方法并补 CLI / 操作说明，明确准备与执行分开、必要直接输入、实际效果判断、失败停止和 Owner 锁处置边界；用组内真实命令核对文档，不让方法自行另做一次规格同步或制造 Reviewer verdict。

## 5. 有限 finish、累计编号与查询

- [x] 5.1 实现 `--mode finish` 的 local-only 观察 / 收口：在原写者停止、锁按既有授权处置后锁内核对当前 attempt；完整现场证明确无效果时保存 invoking → none，返回 observed-none / pending 与显式 execute 提示。测试 invoking 落盘后原生启动前、原生无效果结束后 none 保存前两处真实中断，夹具明确核对停止写者并处置测试锁，再用新进程观察；确认原生调用次数、计数、正文 / binding / Run 编号不变、原 attempt / 错误保留，并与 4.4 联验两个显式出口。已确认效果仍按安全编号和 countBasis / ordinal 收口，测试工具不可用、真实日期、旧计数缺省、编号冲突 / 越界 / 外链，不调用上游或另配编号。
- [x] 5.2 按设计顺序提交计数、终态 Run、manifest 并完整读回；在真实产品写入点注入编号前、计数后、Run 后和最终 manifest / 读回故障，由夹具显式模拟 Owner 核对并处置已停止写者的测试锁后用新进程 finish，确认计数只增长一次、已提交 Run 字节不改、原生不重调。
- [x] 5.3 测试完整收口 / none 观察后的 repeated finish、故障后的多次 finish、两个竞争写者、缺必要 attempt / 直接批准、输入变化、写者活跃 / unknown 及观察提交 / 读回失败；覆盖原生已有实际效果和 confirmed 不得降为 none，证据不足停止，提交失败非零并保留锁 / 现场。核对 observed-none 始终未完成，already-completed 不新增 Run / 修改正文 / 增长计数，不覆盖目标、补旧目录或自动处置原锁。
- [x] 5.4 实现合法 archiving / archived 的只读 status / next、过渡态写入限制与无活动交接；测试 invoking / none / confirmed 分别提示 finish 观察 / 显式 execute / finish 收口，none 且活动源存在仍 pending，query 不重新判定或重试；保留源已移走、部分计数 / Run 已写、最终归档目录 / 历史说明 / 未知 Ref 不可用、当前必要 Run 缺失、普通活动源缺失和人工只读兼容，不调用旧 Change status、不激活下一 Change。
- [x] 5.5 更新 Archive / 查询方法与 README 的 execute / finish 示例、无效果重新分类 / 独立后续命令、部分提交解释和累计编号约定；以组内查询和调用次数核对 local-only 标记、observed-none / pending / 完成结果与最小提示，明确无效果观察不代替批准或另一次 execute / Owner rollback。

## 6. 综合验证与 Author 交接

- [x] 6.1 执行 pnpm check、build、现有相关回归和本 Change 的分组测试，并做主规格 / 当前 delta strict validate；记录实际命令、结果及未覆盖边界，可靠且仍适用的旧 proof 可沿用，不称为正式 Delivery Full Test。
- [x] 6.2 在新的 Author Apply Run 汇总任务读回、真实产品归档沙盒结果、失败 / 重复 finish 证据和三目录维护观察，交给独立 Review Apply；确认当前仓库 Change 未被测试归档，旧 Run / verdict 保留，未执行 Git、Delivery 收口或下一 Change 激活。

## Workflow follow-up

- 当前 Propose 完成后先由独立 Reviewer 审核方案，再按 Owner 指令进入 Apply。
- 实施并获得独立 Review Apply 批准后，只有 Owner 明确指令才实际 Archive 当前 Change；随后 Change checkpoint / 其他交付边界另行授权。
