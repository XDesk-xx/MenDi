# Design

## Context

动机与范围见 [proposal.md](proposal.md)。当前 application 的 start / continue / save / submit 都先走 `selected`，它构造固定 OpenSpec、执行 version / list，再读取 workspace 并查询活动 status。`saveRun` 因此无法在上游故障时保存说明。`OpenSpec.instructions` 当前只返回 proposal 的 context / rules；阶段方法返回真实 Skill 正文，但没有完整 artifact 接线。

当前 Run 格式为 1、角色为 author / reviewer，九种已有 Action 类型已支持 continuing、新修订和固定 Author；rejected 使普通 start / continue 停止。写入使用独占锁、创建新 Run、替换 manifest / draft 和最终读回；失败后保留已写现场。023 的 P01–P08 与 024 独立重放证明这些事实，不证明新的 Owner 入口、安全解锁或任意掉电恢复。

本轮修改三份既有能力的 delta。设计涉及公开 CLI 协议、application 输入选择、写入和角色边界，符合上游 design 的跨模块 / 数据模型 / 安全条件，需要保留 design.md。主规格和旧 Run 不在本轮 Propose 中修改。

## Goals / Non-Goals

**Goals:** 当前阶段可取得完整上游指引，Agent 明确如何消费；故障说明可在本地安全保存；确需换人或 rejected 后恢复有明确新记录；有锁时能观察真实现场。输入和行为见三份 delta，所有新增操作按其实际依赖校验。

**Non-Goals:** 自动语义写作、审核或推进，身份认证平台，跨阶段 Owner 回退、持久 stop / abort、解除锁命令、通用恢复引擎、Archive / 归档恢复和第二 Change 激活。Owner 可立即在会话中停止工作；D01-D 再设计需要持久操作的回退 / 中止。当前新增 Owner 模式仅覆盖 Explore / Propose，旧 Apply 记录命令保持原行为。

## Decisions

### 1. 三个显式入口，各自保留输入边界

拟定接口：

```text
mendi action instructions --project <root> --action <current-action-id> --artifact <proposal|specs|design|tasks> [--openspec-bin <entry>] [--json]
mendi action resolve --project <root> --run <current-ref> --role owner --actor <owner-label> --resolution <handoff|revise> --to-role <author|reviewer> --to-actor <label> --reason <decision> [--openspec-bin <entry>] [--json]
mendi workspace diagnose --project <root> [--run <explicit-reservation-ref>] [--json]
```

`--project` 延续现有规范根解析；产品 writer 仍拒绝 manual-bootstrap。instructions 要求当前 product Run / actionId，按归一化 phase 判断支持范围：explore（含 revise / review）仅请求 proposal 背景；propose（含 revise / review）支持四 artifact。Apply / Archive 显式拒绝，不自动扩展。没有当前 Run、陈旧 Action、未知 artifact 均拒绝；该读取不分配 Run，未请求的 artifact 不读取。

resolve 是显式 Owner 控制操作；只接受 `--role owner` 与非空 actor / reason，独立命令不让其他普通 Action 接受 owner 角色。真实 Owner 指令由当前会话 / 产品方法检查；CLI 记录声明和原因，不把参数视为身份认证。此处只设计入口，不在当前 Author 会话实际执行 Owner 处置。

诊断不接受工具参数，因为不启动上游。普通 status / next 的锁行为不变，不增加通用 ignore-lock 开关。

选择显式读取指引，避免每次 start / continue 都加载四份产物和依赖：Agent 按当前写作需要调用，既不会被无关 blocked artifact 阻挡，也能读回实际上游事实。没有引入任务 DSL 或复制上游 workflow。

### 2. 完整 instructions 保留公开协议与真实根

扩展现有 `instructions(changeId, artifact = 'proposal')`，保留旧调用可读 context / rules，并返回 typed 完整指引。application 先验证当前 Action 和目标 status，adapter 调用 `instructions <artifact> --change <id> --json`。

| 字段 | 必要判断 |
|---|---|
| root / changeName / artifactId | 与已验证 nearest 根、当前 Change 和显式 artifact 一致 |
| schema | 从真实 status 核对 spec-driven；instructions 若返回 schemaName 也须一致，不要求该命令未提供的字段 |
| instruction / template / outputPath / resolvedOutputPath | 必要字符串；检查输出属于当前 Change，保留上游 glob pattern，不将其当具体文件 |
| dependencies | 必要数组，校验 id、done 布尔和相对 path；已支持的直接 artifact，路径属于同一 Change |
| context / rules | 缺省可无；存在时分别为字符串 / 字符串数组，消费当前 artifact 对应规则 |
| 未知字段 | 不作为新依赖，不按 Ref 后缀递归读取 |

检查明确根和 Change 路径关系，拒绝 `..`、绝对依赖路径、身份矛盾及经已存在目录 junction 越界；glob 只在允许的输出模式中保留，检查其静态路径前缀的规范位置。返回 metadata / 指引，不在 CLI 中自动打开或写依赖文件。missing / blocked dependencies 如实返回，由 Agent 读取完成的直接依赖、按上游条件先补必要输入；不能要求全体产物 ready 才能获取指引。

成功结果包含实际工具信息、当前 Run 元数据和完整指引；上游失败或坏协议沿用非零退出与实际调用 stdout / stderr。不缓存为唯一输入，写作前按需重新读取目标的有效配置与产物。

### 3. 草稿保存走本地路径，正式提交保持原检查

application 区分本地选定项目与需要上游的选定项目。复用 `inspectProject` 对明确根 / 主 YAML / repo-local schema 的检查；本地保存不构造 OpenSpec。readWorkspace 仍验证活动 Change 目录、入口 / manifest 身份、受管位置和锁；currentRun / draft 校验同 role / actor、当前 ref 和未提交。明确正文按现有目标相对 / 绝对文件读取，写入仍在独占锁中再次检查当前记录，使用原 replaceDraft / 读回，不能只在锁外验证。

本地保存结果明确 `executionMode:local-only`、`openspec:null`、`upstreamAccess:not-required`，并返回实际当前 Run / next。`--openspec-bin` 为兼容旧 save 调用仍可解析，但不验证或使用它，结果不报告该入口已验证。依赖上游的操作继续使用实际 info；驱动的人读输出须处理本地结果，不能解引用 null。

| 操作 | 实际读取 |
|---|---|
| save | 本地配置、入口 / manifest、活动路径、当前 draft、role / actor、明确正文、独占锁与当前读回 |
| submit | 原上游选择 / status、当前 draft / 正文 / result / outcome；Reviewer 另读固定完整 Author 和 verdict |
| start / continue / resolve | 原上游 / 当前工作、所选方法；Reviewer 或 revise 按需读固定 Author / 被修订 Author |
| instructions | 上游和当前 Run 的 Action / phase，当前显式 artifact 的指引 metadata；不读取 Owner 来源历史或代核对 Reviewer 的 Author 内容 |
| diagnose | 本地配置 / 入口 / manifest / 当前 product Run / 锁；仅额外读显式同 Change reservation |

Reviewer draft 即使固定 Author 正文缺失也可保存说明，continue / submit 仍失败。工具入口缺失、版本错误或 status 故障只对需要工具的操作生效。配置损坏、活动 Change 路径缺失、角色不符或锁存在仍阻断 save；不能退到其他配置 / 历史或把上游检查放宽当权限放宽。

### 4. Owner 决策放在新的接收工作 Run

不增加另一份决策中心或一个只为转发的 Owner Run。一次实际处置创建一个接收方工作 draft，并在头部增加可选的结构化 `ownerDecision`：

```yaml
ownerDecision:
  resolution: handoff # 或 revise
  role: owner
  actorId: owner-label
  reason: 明确处置原因
  sourceRunRef: .mendi/runs/<delivery>/<batch>/<change>/<number>-<type>/run.md
  targetRole: reviewer # 或 author
  targetActorId: receiving-label
  phase: explore # 或 propose
```

旧无该字段的格式 1 Run 保持兼容。已知字段检查模式、声明角色、非空 actor / reason、来源同 Delivery / Change 且编号早于接收 Run、目标角色 / actor / phase 与新 Run 一致；不读取 sourceRunRef 历史正文。正常 continuing 继承最近决策说明；再次处置只保存本次直接来源和最新决策，不累积数组或整条来历。普通未知扩展仍仅保留。

| resolution | 允许的当前状态 | 接收 Run / Action |
|---|---|---|
| handoff | phase 为 explore / propose，Author 或 Reviewer 的 draft，或 submitted / continuing；接收角色相同且 actor 必须不同 | 同 actionId / actionType / 方法 / 工具标识，保留原 authorRunRef 或 revisesRunRef，新 draft 复制当前工作正文作为待继续笔记；旧记录原样保留 |
| revise | phase 为 explore / propose，当前 Reviewer submitted / complete / rejected，直接完整 Author 有效；接收角色必须 author | 新 `revise-<phase>` actionId，新 draft 正文为空，revisesRunRef 为被拒绝 Author，方法为该 Author 阶段，工具标识从被修订 Author 保留 |

handoff Reviewer 要重新核对固定 Author 的完成状态、同阶段 / 同目标、正文及接收 actor 与 Author 不同；不制造 Author 修订，不改变审核对象。复制的笔记不继承 verdict / outcome / result，接收 Reviewer 必须独立检查。完成 Review 不允许 handoff；非 rejected 的修改继续走已有 revise 入口，不用 resolve 绕过阶段状态。新会话同实际操作者沿用旧 actor即可，不调用 handoff。

所有输入、方法和直接对象在写前验证，再在现有独占写入回调中读取当前指针 / Run 并复核；并发变化拒绝。扩展 createRun 支持仅 Owner handoff 需要的初始正文，普通 start / continue 的既有行为不变。提交新 Run 与 manifest 后读回验证，再返回接收方当前 draft / next；失败沿用残留锁、临时文件和占号保留。旧 Actor 不能保存 / 提交旧 draft，也不能用旧 actor 编辑接收 draft。普通 rejected 的 start / continue 拒绝规则仍保留；resolve 通过明确新工作记录恢复，不改旧 verdict。

### 5. 只读诊断，不实现解除锁命令

把“读取锁下现场”限定在 diagnose 的只读 adapter 内，普通 query 和全部 writer 不开放 bypass。先 inspectProject，受管读取锁并记录 token / pid / operation、锁格式错误或不存在；不构造 OpenSpec。读取入口 / manifest 和当前 Run，损坏时保留错误观察；如显式 `--run`，限定同 Delivery / 当前 Change 的合法受管 product Run，单独显示 `isCurrent` 和真实头部，不自动关联。

仅列出当前 manifest / Run 相关目录中同文件前缀的临时替换路径，不扫描历史正文，不按失败报告中的任意 Ref 自动读文件。临时文件不当正式状态输入。manual-bootstrap 只诊断入口 / manifest / 锁，明确人工来源、不解析人工 Run 为 product；人工模式提供 `--run` 请求返回不支持错误。

process liveness 用可替换的本地探针观察正整数 pid：alive、not-found、unknown。pid 存在不能证明还是原写者，not-found 不能证明任务无占用；权限不足等不能误报 dead。锁 / manifest / 当前 Run 做有限前后字节读回，观察到变化时标为 changed-during-read，不拼接稳定成功。同一文件只保存首次快照，显式 reservation 与 current 相同也不覆盖它；必要错误标记 incomplete，不能读取锁时不声称无锁。该比较仅限本次读取，没有 hash 清单或历史 gate。

返回独立诊断结果：local-only、锁观察 / blockedByLock、当前身份与状态、显式 reservation、必要错误、临时路径及 liveness。分类是 `current-submitted-observed`、`unreferenced-run-observed`、`draft-observed`、`no-lock-observed` 或 `unknown`；没有 token 等缺失必要信息则报不完整。诊断成功只表示完成可读观察；本地输入损坏 / 路径不安全 / 读中变化退出 1，pid 的 unknown 如实呈现，不当作恢复许可。

选择仅诊断，是因为 P05 / P06 已证明判别依据，但尚未证明安全解锁；新增自动处置会引入不必要的进程归属与恢复机制。后续实际遇到残留锁时，人工流程明确为：

1. Owner 另行明确授权处理该目标；诊断及当前阶段授权都不代替该授权。
2. 核对规范绝对目标、原 token / operation、当前 manifest / Run 和已写路径，区分已提交与未关联。
3. 停止或协调该目标所有写者，核对实际任务和文件占用；pid 存活 / 复用 / unknown 或无法保证无写者时停止，不删除。
4. 在排除并发写者的期间再次读取同一锁 token 和正式文件。任何变化停止；仅在完全可判断的现场解除这一残留锁，保留临时文件和占号，不修指针、不删 Run、不重提。
5. 只读查询当前真实状态：已 submitted 沿 next 显式后续；未关联占号保留并由下一次合法分配跳过。结果写入当前工作进展 / 对应授权记录，不为每条观察命令建 Run。

此流程是单独授权后的人工边界，当前不执行，也不给 CLI 添加 unlock、自动抢占、kill 或 recovery。复杂 / 不可判断现场不进入解除流程；Archive 部分失败由 D01-D 单独处理。

### 6. 阶段方法与探索材料统一

产品四份 Explore / Propose / Review 方法补实际消费步骤：Author 获取当前实际指引和依赖，应用目标 context / artifact rules，选择风险相关 proof / 产物；Reviewer 固定 Author，按变化核对材料和语义，不从 sentinel、任务全勾、strict validate 或命令 PASS 推导 approved。工具指导提供三个入口和明确限制，不重复复制上游方法实现。

统一今后不新建 Change 级 explore.md。Explore Run 承载问题、候选、关键实验和限制；artifacts / 受控文件承载原始输入与输出。当前 C 的 explore.md 已被 023 / 024 引用，作为历史保留、不删改；A / B 不补建文件。Propose 的四类产物收敛有效决策，不再维护第二份探索结论。这是材料组织修正，不改变 023 的实验事实或 024 verdict，无需重做 Explore。

当前已更新 AGENTS 和路线图的稳定协作规则；产品 Skill 的同一规则将在 Apply 接入。顺带按 024 非阻断提示，在 proof 脚本创建 `.tmp/` 父目录后再 mkdtemp，使新空环境可重建；不清理旧沙盒、不改早期结果。

## Risks / Trade-offs

- Owner 仅声明角色和 actor → 实际授权由会话方法核对，CLI 不宣传身份认证；测试中使用的标签不证明真人独立性。
- 持锁时读文件不是原子快照 → 报告观察和变化，普通 writer / query 继续拒绝；不以稳定一次读回证明可安全解锁。
- 本地 save 可在上游不可用时成功 → 输出明确未验证上游，submit / 继续 / Review / resolve 仍保留其必要前置。
- copied Reviewer 笔记可能误当已批准 → 新 draft 无 verdict / result / outcome、固定 Author 不变，接收 Reviewer 重新独立核对。
- Owner 新 Run / manifest 仍可能跨文件失败 → 复用已有锁、实际已写路径与读回，保留残留，不宣称崩溃原子性。
- 新指引协议可能缺字段 / 改路径 → 真实固定 CLI 测试和坏响应注入分别验证，schema 从 status 取真实事实，不臆造 instructions 字段。

## Migration Plan

无数据迁移、安装或新依赖。Apply 在当前代码与格式 1 上增量实施，旧无 ownerDecision 的 Run 和 manual-bootstrap 查询兼容；仅新的 Owner 处置记录增加字段，不改旧头部、批准或 archiveOrdinal。

先完成相关类型 / adapter / application / CLI 和 focused 检查，再真实目标串起 instructions、Explore / Review、Propose / Review、一次修改要求及 Owner handoff / rejected 修订；最后 check、现有相关与必要全回归、独立 Review Apply。新增行为未实现前不使用其入口维护当前人工记录。本轮 Propose 不执行实现、解锁、Git、Archive 或正式 Delivery 测试。

回退实施代码时保留已提交记录和现场；不能把包含新 Owner 字段的实际决策当未知内容静默抹去或用旧工具绕过角色规则。具体发布 / 版本管理不在本轮范围。
