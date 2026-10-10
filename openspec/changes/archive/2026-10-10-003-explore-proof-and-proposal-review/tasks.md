# Tasks

依据 [design.md](design.md) 与三份 delta；没有会改变规格或任务拆分的未决问题。16 项任务已在 027 Apply 实施并验证，028 独立 Review Apply 批准；方案写作不计为功能完成，各组实现、测试与使用说明均已完成。

## 1. 当前阶段 instructions

- [x] 1.1 扩展 OpenSpec adapter 的完整 typed artifact instructions，保留默认 proposal 调用，核对 root / Change / artifact、status schema、必要内容、输出及直接依赖路径；用真实固定 1.14.1 和坏字段 / 身份 / 越界 / junction 响应测试验证，原 context / rules 接入回归通过。
- [x] 1.2 接入只读 `action instructions` 参数、application 和人读 / JSON 输出，限定当前 product Action 与 explore / propose 的 artifact 范围；用 CLI 验证陈旧 Action、错阶段 / artifact 拒绝、blocked dependencies 如实返回、读取前后当前 Run / manifest 字节不变。
- [x] 1.3 在 OpenSpec 工具指导与 README 写明按需读取 instructions、目标 context / rules、输出与依赖的步骤和限制；核对文档命令与实际 CLI 输出匹配，未自动生成产物 / Run / verdict。

## 2. 本地 draft 保存

- [x] 2.1 将 save 的本地根 / 配置 / workspace / draft 选择与上游操作分开，保留锁内复核、身份 / 路径与原安全替换 / 读回；测试固定入口缺失及 status 故障时保存成功且 draft 未提交、实际 runner 未被调用，submit / continue 仍因其必要上游输入失败。
- [x] 2.2 覆盖错角色 / actor、陈旧 / 已提交、缺当前 Change / Run / 配置 / 正文、越界 / junction、锁冲突与读回失败，并验证固定 Author 缺失时 Reviewer 可存故障说明但正式 submit / continue 拒绝；校验拒绝 / 替换前失败保持原正文，替换后读回失败保留实际写入、锁与错误，不重提或回滚；所有情况均不得改旧 submitted Run。
- [x] 2.3 完成本地保存人读 / JSON 输出和 README 输入表，明确 executionMode local-only、openspec null、upstreamAccess not-required、旧 --openspec-bin 不访问；真实 CLI 输出没有假版本 / root，现有依赖上游输出与回归保持正确。

## 3. Owner 的受限工作处置

- [x] 3.1 为接收 Run 增加可选 typed ownerDecision 并验证直接来源 / 模式 / 声明 Owner / 接收身份 / phase，兼容无该字段旧 Run；测试声明矛盾拒绝、当前查询不读取来源旧正文、正常 continuing 只继承最近决策说明，不增长历史引用链。
- [x] 3.2 接入 `action resolve` 的 handoff：当前 draft 或 submitted / continuing 的 Explore / Propose Author 或 Reviewer，新接收 actor / 同角色，沿用 actionId / 固定对象并复制待继续笔记；测试不同进程读回、Review 不触发 Author 重做、旧 actor / 陈旧 ref 拒绝、同 actor 不创建多余 Run、固定 Author 不完整或明显自签写前拒绝，旧直接记录字节不变。
- [x] 3.3 接入 rejected 后同阶段 revise：新 Author revision Action / 空 draft、被修订 Author 直接关联和 Owner 决策；测试旧 rejected 不变、普通 start / continue 仍拒绝、非 Owner / 非 rejected / complete handoff / 跨阶段 / Apply 处置拒绝、新修订完成后只提示独立 Review。
- [x] 3.4 将 resolve 纳入原独占写入 / 分配 / 最终读回，支持 handoff 初始正文并在锁内复核当前指针和固定对象；并发及提交前 / 读回故障测试证明无错误成功、旧记录保留、残留占号跳过。同步 README 与工具指导解释 Owner 声明不是身份认证、新 draft 未完成语义工作，既有 start / continue 行为回归通过。

## 4. 只读锁诊断和阶段方法

- [x] 4.1 实现不访问上游的 `workspace diagnose`，限定本地入口 / manifest / 当前 Run / 锁与显式同 Change reservation，报告存活观察、必要错误、相关临时路径与前后变化；真实受控子进程 / 故障现场测试区分活跃写者、指针提交前未关联、已 submitted、pid unknown、损坏与读中变化，所有诊断前后现场字节不变，普通 query 仍拒绝锁。
- [x] 4.2 覆盖诊断显式路径越界 / junction / 错身份、缺必要记录、无锁、manual-bootstrap 不解析人工 Run 和不支持其 --run；验证没有 unlock / kill / ignore-lock 入口。同步 README / 工具指导的人工处置步骤，明确新 Owner 授权、停止所有写者、同 token / 文件复核及不确定时停止，不实现或执行解锁。
- [x] 4.3 完善 Explore / Review Explore / Propose / Review Propose 方法对 proof、实际 instructions / dependencies / context / rules、方案一致性和独立 verdict 的指导；核对实际返回的阶段方法 / 工具内容与角色、固定 Author 及当前输入吻合，Agent 示例产物能说明约束如何影响方案，不以 sentinel 或工具 PASS 代替语义审核。
- [x] 4.4 在方法中落实 Explore 分析 / 候选 / proof 摘要只进 Run、原始输出进 artifacts / 受控文件；保留既有受审 explore.md、旧 Run / verdict。按 024 非阻断提示补 proof 脚本幂等创建临时父目录，在自有空环境验证可重建，保留早期结果、不删除仓库 .tmp、不重做无关历史。

## 5. 跨边界集成验证

- [x] 5.1 在受控小型目标用真实 MenDi / 固定 OpenSpec 串起 Explore 输入与核心 proof、Review 的修改要求 / Author revise、Propose 四 artifact instructions / 依赖以及 Review Propose；记录实际 context / rules 如何进入产物，另外验证 Author / Reviewer handoff 和 rejected 同阶段 Owner 修订。实验 actor / verdict 明确为夹具，当前 Change 的独立审核由独立 Reviewer 完成，不在测试中自签真实批准。
- [x] 5.2 执行普通 `pnpm check`、build、相关 focused 回归及现有 `pnpm test`，对当前 delta strict validate；新协议 / 本地保存 / Owner / 诊断新增覆盖与各组文档同时完成后再集成验证。结果与限制简记当前 Apply Run / artifacts，不新增 hash 清单、行数 gate、逐检查 Run 或正式 Delivery Full Test。

## Workflow follow-up

- 025 Propose 已在 026 独立批准；Owner 的 apply 触发 027 实施。完成后当前交接停在独立 Review Apply，Author 不自签批准。
- Apply 实施与必要修订交给独立 Review Apply；Archive、checkpoint、正式 Delivery Full Test / Close、下一 Change 保持各自明确边界，不加入本次已完成任务。
- MVP-D01-D 接续 Apply 阶段方法、主动跨阶段回退 / 必要持久中止及原生 Archive / 部分失败分析，本 Change 不预先实现。
