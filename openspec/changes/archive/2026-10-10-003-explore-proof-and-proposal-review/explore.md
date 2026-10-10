# MVP-D01-C Explore：Explore proof 与方案审核

Owner 已明确授权激活下一 Change 并开始 Explore / 核心 proof。下一槽位是路线图 MVP-D01-C，依赖已归档的 MVP-D01-B。本轮保持 Author，分析与实验完成后停在独立 review-explore；proposal、design、delta specs、tasks 留待后续 Propose。本文记录探索依据，不替代受审方案。

## 基准和输入

- 现有 `project-entry`、`delivery-workspace`、`action-runs` 三份主规格已全文核对，包括场景。D01-B 已批准的记录与角色边界仍为基准；本轮不撤回旧批准、不改历史 Run。
- 固定 OpenSpec 1.14.1 实际 `list --json` 确认 `D:\Projects\MenDi` 的 nearest root，激活前无活动 Change；`new change` 已创建当前 `.openspec.yaml`。
- 当前上游 `instructions proposal --change explore-proof-and-proposal-review --json` 已读取 instruction、template、dependencies、context。当前项目没有 proposal rules 字段，不编造其存在；受控目标另验证真实非空 rules 的传递。
- 本次采用实际 `.agents/skills/openspec-explore/SKILL.md` 的探索方法与产品 `skills/actions/explore/SKILL.md` 的 proof / 角色交接要求。Owner 要求真实 proof，实验代码只放受控 TypeScript 脚本，不修改产品实现。
- 本项目保持 `manual-bootstrap`；人工追加 C binding 和 023 Run，复用 `003-changes`。产品写命令没有用于改写人工历史；产品行为实验在每次新建的隔离目标执行。

## 核心 proof

受控输入由 [实验脚本](../../../scripts/proofs/mvp-d01-c-explore.ts) 和既有 `tests/fixtures/minimal-project`、`delivery-scope.json` 重建；所有正常产品路径使用真实 MenDi CLI 和固定 OpenSpec。脚本逐项断言实际状态 / 退出码，保存原始调用与必要现场，不生成 scriptSha256 或 hash 清单。

最新正式实验结果见 [023 Explore Run](../../../.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/explore-proof-and-proposal-review/023-explore/run.md)。其中受控 review 的 actor / verdict 仅用于规则实验，由同一实验程序构造，不是本 Change 的独立 Reviewer 审核，也不能认证真实身份。

| 实验 | 观察 | 支持的结论 |
|---|---|---|
| P01 | 上游实际 proposal instructions 包含 template、instruction、目标 context 与 proposal rules；Action 返回 Explore 和按需 OpenSpec 指导，但 Run 仍为 draft | 公开 CLI 可提供阶段输入；读取与方法选择不能代替 Agent 语义工作或 approved |
| P02 | 不同进程使用原 actor 可继续同 actionId；换标签继续或保存当前 draft 都拒绝，旧 continuing Run 字节不变 | 恢复同一实际操作者会话应沿用稳定标签；actor 字符串不认证身份，不能让另一人冒用标签接管 |
| P03 | changes-requested 可建立新 revise-explore 并保留旧 verdict；后续 rejected 使 next 指向 Owner，普通 start / continue 均拒绝 | 修改要求路径可用；真正拒绝后的恢复需要明确 Owner 决策入口，手改 verdict 不能作为入口 |
| P04 | 活跃子进程真实持锁时查询和第二写者拒绝；原锁字节保留，原写者正常释放后可查询 | 有锁不能直接删除；活动写者需等待 / 协调，不抢占 |
| P05 | before-manifest-commit 注入失败后 manifest 原字节未变，新 draft / 临时 manifest / 锁保留；普通 query 拒绝 | 已写 Run 不证明指针已提交；需要区分未关联 reservation 与有效当前工作 |
| P06 | Run 替换之后、读回之前失败；子进程已退出，实际 Run 为 submitted / complete，锁保留，普通 query / 重提拒绝 | 非零退出不等于未提交；诊断必须看实际记录，不回滚或重提已提交 Run |
| P07 | 仅注入 OpenSpec status 失败，version / list 仍使用真实固定 CLI；现有 save / submit 都拒绝且 draft 不变；隔离本地保存候选能保存正文并保持 draft | 可以考虑让草稿保存不依赖上游进程；该候选未进入产品，正式 submit 没有被放宽 |
| P08 | 本地候选保留配置、当前输入、身份、路径、锁和提交不可变边界；缺固定 Author 时可存 Reviewer 草稿，但真实正式 Review submit 仍拒绝 | 按操作划分必要输入有可行基础；草稿故障说明不构成审核结论 |

## 对方案的建议

### 阶段接线

保持 CLI 记录工作与 Agent 完成语义工作的分工。Author Explore 先确定关键疑点、选择可重建实验并解释失败和限制；Review Explore 固定本次 Author 提交、独立核对方法与结论；Propose 通过对应上游工作方法按实际依赖获取 proposal / specs / design / tasks instructions，消费当前项目 context / 对应 rules，再写连贯产物；Review Propose 检查范围、关键取舍和可实施性。各方法只要求当前直接输入，不建立引用注册表或深层依赖图。

目前 `startAction` / `continueAction` 读取阶段 Skill 与明确请求的工具指导；application 没有调用 `OpenSpec.instructions`。现有 adapter 的该方法只返回 proposal 的 context / rules，不返回完整 instruction、template、输出位置和依赖。P01 证明公开 CLI 提供这些材料，不能将当前记录接线描述成已消费完整阶段输入。Propose 应明确最小产品入口与返回字段：保留实际 root / Change / schema 校验、按当前所需 artifact 读取公开 instructions，由 Agent 解释内容；不复制上游 workflow、自动写方案或自动推进审核。

本次真实 Explore 已按项目方法进行分析和 proof；P01 本身只验证输入可取得，不声称实验程序执行了完整 Agent 推理。项目 rules 是提示约束，语义遵循由 Author 产物和独立审核判断，不能从 sentinel 出现在输出就推出方案符合规则。

### Owner 决策与稳定标签

同一实际操作者换会话继续时，沿用原 actor、role、actionId 即可；P02 不支持增设身份平台。真正换操作者、放弃 draft 或 rejected 后重启，不应改旧 actor / verdict，也不能用 ordinary continue 绕过边界。

推荐仅为这些实际受阻状态增加显式 Owner 决策记录：直接关联当前 Run，写原因、继续目标阶段和接收操作者，随后建立新的 Author 工作记录；旧提交与审核原样保留，新结果重新独立审核。命令名称、可处置状态与记录字段由 Propose 确定；没有 Owner 决策时继续阻断。正常 same-actor continue 不增加决策手续。跨阶段主动回退只补改变的输入与关键 proof，不能默认拥有回退授权。

### 残留锁：先观察，后明确处置

当前 query 的锁错误只有“正在写入或已中断”，无法继续查询状态。建议提供小范围本地只读诊断：读取受管 lock、项目 / manifest、当前直接 Run，以及本次失败结果中明确的已写路径；不扫描或认证全部旧 Run。观察结果至少区分：

| 现场 | 必要人工核对 | 处置边界 |
|---|---|---|
| 原写者仍活跃 / 归属不明 | token、pid、operation、实际进程和工作占用；pid 单独不证明归属，可能被复用 | 不解除、不抢锁，协调原写者；无法确认则保留现场 |
| Run 已落盘但指针未提交 | 原 manifest、reservation 头部及临时 manifest；新 Run 尚非 current | 保留占号和文件，不自动关联、重提或把实验 draft 当成功 |
| Run 已提交但最终报告失败 | 当前指针、实际 submitted 头部 / 正文、失败点及已写路径 | 保留提交；停止写者并确认后才可考虑只解除原 token 对应锁，不回滚 / 重提 |
| 临时替换尚未完成或输入损坏 | 正式文件与临时文件分别读回；确认能否判断，禁止猜测 | 报告不确定，交 Owner 处理，不删除证据或自动拼接状态 |

若增加处置命令，须显式授权、核对同一锁 token 与已停止 / 无占用状态，在写入边界复核现场后仅执行确认的最小处置；只读诊断不授予清理权限。普通 query / 新写仍拒绝未处置锁。P05 / P06 支持分类依据，未验证安全解除、崩溃后重试、OS 掉电持久性或所有 rename 时序。诊断 / 必要解除归 D01-C 的异常接线；Archive 部分失败及规格同步仍由 D01-D 研究，不扩展成通用恢复引擎。

### 按操作划分保存与提交

| 操作 | 建议必要输入 | 不作为运行前提 |
|---|---|---|
| 保存当前 draft 的进展 / 故障说明 | 明确规范根、有效 repo-local 配置、本地 product open / active binding、当前 draft、同 role / actor、明确正文文件、受管路径和独占写入 / 最终读回 | 固定工具执行成功、上游 status、Skill 正文、历史说明链接、固定 Author 正文 |
| 正式 Author submit | 现有目标 / 上游检查、当前 draft、角色 / actor、非空正文 / result、outcome、合法阶段及写入安全 | 无关历史说明与未消费 Skill 正文 |
| 正式 Review submit / continue | 现有提交检查或方法选择，另外读取同 Delivery / Change / phase 的固定完整 Author；不同 actor 与明确 verdict 规则 | 全历史审核链、未知 Ref、任意 hash 清单 |

本地候选仅探索 status 不可用时保存的可行性，不跳过配置，也不把坏 / 缺失的当前 Change 或 Run 当正常状态。正式产品要在 Propose 明确工具不可用、活动路径缺失和 lock 存在时分别如何报错。本地保存成功只说明 draft 正文已读回，不能声称上游可用或阶段完成。

## 实施归属及限制

- D01-C：Explore / Propose 阶段输入与方法接线、对应独立审核指导；沿上述 proof 确定必要的本地草稿保存、最小诊断与 Owner 恢复规则，并通过方案审查限定命令与记录。后续 Apply 才改产品。
- D01-D：Apply / Revise 的真实编排、原生 Archive 与部分失败分析；沿用已经验证且仍适用的输入、角色和安全边界，不要求重做整个 B。
- 无身份认证平台、依赖图、自动抢锁 / 回滚 / 重提、全量 hash、行数或证据容量门槛。无需每个异常建 Run。
- 未验证完整 Propose 四产物生成、其独立审核、真实 Owner 接管 / 解除锁命令或所有异常恢复。这些不是当前产品既有能力；本轮不提前实现或宣称验收完成。

Author 结论：上述真实观察足以支持受限方案继续设计，但新产品行为仍需 Propose 与独立审核。当前交接停在独立 Review Explore，由 Reviewer 检查实验与建议是否匹配；未提供本 Change 的 verdict。
