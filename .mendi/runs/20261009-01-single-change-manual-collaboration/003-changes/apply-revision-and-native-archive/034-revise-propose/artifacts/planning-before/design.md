# Design

## Context

见 [proposal.md](proposal.md) 的动机。031 独立批准 030 的探索依据；D01–D08 证明真实操作协议、普通 Apply 修订能力、Owner / product Archive 缺口和原生效果边界。D04 是原生成功后实验候选路径 EISDIR，不是现有产品恢复测试；本 Change 的 Apply 必须补真实产品故障与重复调用回归。

当前 application/actions.ts（466 行）混合普通记录、artifact 指引与 Owner 处置；core/actions.ts（282 行）定义阶段 / Run / next，adapters/openspec.ts（317 行）只接四类 artifact。product workspace 只支持首个活动 binding；累计归档和无活动归档查询仅支持人工记录。已有独占锁、临时替换、最终读回和故障 observer 可复用，没有跨文件崩溃原子性承诺。

## Goals / Non-Goals

**Goals:**

- 以真实操作协议支持当前阶段方法，保留既有版本 1、人工只读、独立审核与受管写入规则。
- 回退建立新 Author / Review 路径；Archive 准备、原生执行和本地收口有明确状态与直接输入。
- 在真实产品路径证明失败后不重复已发生的同步、完成计数仅增长一次、查询不调用旧活动 Change status。
- 扩展前整理实际职责，定向测试承担产品验收；旧 proof 保持限定用途。

**Non-Goals:**

不实现第二 Change 的 product 激活、其他 Delivery、正式 Full Test / Close / Reopen、自动安装、锁解除 / 杀进程、通用事务 / 恢复引擎、引用注册中心或全量 hash gate；不自动撤销产物、Git 或业务实现。当前仓库人工生命周期仍由 Author / 独立 Reviewer 手动衔接，产品写命令不改人工历史。

## Decisions

### 1. 操作指引与 artifact 保持不同协议

新增 `action instructions --action <id> --operation <apply|archive>`，与已有 `--artifact` 互斥且必须二选一。Apply 操作供 apply / revise-apply / review-apply；Archive 操作供当前 archive。其他阶段不扩大支持，artifact 的原有四类约束保持。

OpenSpec adapter 增加公开 operation instructions 接口，不复用要求 template / outputPath 的 artifact 解析器。Apply 校验真实 root、Change、schemaName、contextFiles 的路径数组、tasks 的 done / sourcePath / line、progress 与 state / instruction，以及可选 missingArtifacts / missingPrerequisites / context / operationGuidance；核对完成数与任务数据一致。blocked 时缺失输出不要求已经存在，但已返回路径必须属于当前 Change、无越界或外部链接。Archive 只校验真实 root / Change 与可选 context / guidance，schema 从 status 核对，不补造字段。未知扩展仅保留或忽略，不递归读取 Ref。

guidance 是 Agent 使用的提示输入，与程序状态分开；instructions 不实施、勾任务、生成批准或推进阶段。Archive 源目录已移走时不能把旧指引当 fresh 响应；此时使用 finish 的本地输入，而不是伪造 upstream status。

### 2. Owner 处置保持直接对象，新回退不借旧批准继续

保留 `action resolve` 的显式 Owner、actor、reason、当前 `--run`、`--to-role` / `--to-actor`。handoff 扩展到 Apply / Review Apply 未完成工作；同角色 / 同 Action 交接，固定 Author 与修订对象保留，接收 Reviewer 不得是该 Author actor。revise 扩展到 rejected 的 Apply 同阶段；changes-requested 与 approved 后普通修订继续使用现有 start / revise，不改旧 verdict。

新增 `--resolution rollback --phase <explore|propose|apply> --revises <完整目标 Author>`。通常目标严格早于当前阶段：Propose → Explore；Apply → Propose / Explore（包括各自 Review / revise）。Owner 指定的是同 Delivery / Change、submitted / complete、有正文的直接 Author，不搜索“最近获批历史”。接收者必须 Author，目标阶段与所给 Author 匹配。

Archive 只有尚未调用原生或在当前现场重新证明确无效果时，可回退到 Apply / Propose / Explore：恢复活动 binding 并创建目标 revise，保留旧 Archive draft / 尝试；不把指针直接恢复到过去 approved Review。这样已确认无效果但需改方案的失败有合法出口。invoking、效果未知 / 已发生、锁未解除或已完成 Archive 不能回退、handoff 或重开。

新 Run 的 ownerDecision 仍只保存最近直接来源与目标阶段；rollback 的 sourceRunRef 是处置前当前 Run，revisesRunRef 是指定目标 Author，两者是不同必要输入。声明 phase 是目标阶段，来源阶段由当前 Run 核对。查询只校验声明结构与当前身份，不读来源历史；实际处置与 Review 读取当次必要直接对象，锁内复核，创建新 draft。旧 Owner 字段缺失或只有原 handoff / revise 仍可读。

目标修订完成后依次进入该阶段独立 Review，再正常 Propose / Apply；不能用过去批准跳段。actor 是责任标签，不认证真人或授权本身。回退不删除已有规划或实现，Author 在新工作说明哪些仍适用、哪些需修订。

### 3. Archive 准备、执行、finish 共用当前记录

`action start --type archive --role author --actor <id>` 只准备 Archive draft 与实际 `skills/actions/archive/SKILL.md`。要求当前 Run 为完成、approved 的 Review Apply，其 authorRunRef 指向同 Change 完整 Apply / revise-apply Author，Reviewer actor 与固定 Author 不同；读取真实 Apply inputs，要求 all_done / remaining=0、规划必要输入存在。写前复核，准备成功将当前 binding 设为 archiving 并指向新 Archive Run；准备不增加完成数或执行原生调用。

新增 `action archive --run <当前 Archive> --role author --actor <原 actor> --mode <execute|finish>`，必须显式选模式。execute 重新校验固定批准 / Author、当前规划 / 任务、指引、当前对象和路径；同一独占锁内保存调用标记后才调用固定入口 `archive <change> --json --yes`。不用 no-validate / skip-specs，不由 Skill 再应用 delta。API 保留 status / instructions 的公开接入，不依赖上游内部模块。

当前 draft 的专属 `archive` 信息保存直接 Review / Author Run 引用、countBasis / ordinal、尝试号、调用阶段、必要源 / 目标定位及实际响应定位；只对 archive 类型解析这些已知字段。普通 save 只改正文，不改这些字段；普通 submit / continue、review-archive / revise-archive 拒绝。归档完成只由 execute / finish 更新为 submitted / complete、result=archived；不会生成新 Reviewer verdict。

每次实际尝试在本 Run artifacts 的新 attempt 目录保存直接批准 / Author 和必要 Change 元数据、当前 delta / 受影响主规格的有限输入副本、原始命令结果与读回；不覆盖旧失败，也不复制所有历史或生成 hash 清单。调用阶段至少区分 prepared（未调用）、invoking（可能已有外部效果）、none（本次现场证明确无效果）、confirmed（原生效果确认）。不能从非零退出直接切成 none。

### 4. 真实日期、效果确认与有限继续

准备时只预定 ordinal=countBasis+1；真实目录日期采用原生结果的 archivedAs / path，并核对 root、Change、日期格式与实际材料。执行前的日期仅是定位线索：未调用时可重新读取当次日期；调用已经开始不能只拿旧预定路径判定无效果或重新归档。正常公开成功结果是 `{ archive: {...}, root: {...} }`，失败可为 `{ archive: null, status: [...] }`，原始退出 / stdout / stderr 均保留。

原生效果确认核对：活动源消失；当前同一 Change 的唯一原生或预定编号目录为真实受管目录；元数据与本次源一致；当前 delta 的新增 / 修改需求正文及场景、删除 / 重命名效果对应主规格，并保留未涉及内容。使用本次有限源材料做定向读回，不重新实现语义同步或将 main strict validate 当作效果证明。原生响应缺失时，finish 可以检查 archive 父目录的直接候选名与本次元数据 / delta；候选不唯一、源与目标同时存在、输入缺失或冲突均停止。

finish 为 local-only：本地配置、明确根、当前 Archive / binding、必要直接批准和本次输入 / 实际效果有效即可，不启动上游、不检查旧活动 status。它最多确认原生效果、安全加编号并提交本地交接。完成读回后再调用 finish 返回 already-completed，不新建 Run、不改终态正文、不调用原生或增加计数。

execute 只有 prepared 或本次现场证明 none 才能调用。none 要求原活动 Change 元数据 / delta 和所有本次受影响主规格仍与调用前一致，未出现本次归档目录，固定批准 / 任务重新有效；旧错误保留，新尝试必须由显式 execute 发起。涉及规划改变时先走 Owner 回退与新审核，不让输入副本“仍相同”的检测替代语义 Review。invoking / confirmed 或无法确认的现场只能 finish / 停止，绝不自动重试原生。

锁仍存在时所有新写入拒绝；已有 diagnose 只读报告现场，人工解除需 Owner 单独授权并核对停止写者、token 与实际材料。该边界不因 finish 存在而放宽。只处理当前操作已可解释的现场，不重建旧目录、关联任意占号、强制覆盖或发展为通用恢复。

### 5. 有序本地提交与查询

product 记录仍限单 Delivery、首个 binding / 批次；新增合法 archiving / archived 状态。旧 product 项目缺 archivedChangeCount 时按 0 解释，普通读取不补写；新完成保存非负安全整数，ordinal 跨日期 / Delivery 的语义保持，未来多 Delivery 创建仍不在范围。

本地收口的顺序：核对原生效果 → 将实际原生目录安全改名为 `YYYY-MM-DD-NNN-change-id`（源 / 目标直接位于真实 archive 父目录，编号目标不存在）→ 项目计数写为预定新值 → 写 Archive submitted / complete → manifest archived、archiveOrdinal 与真实 changeRef、activeChangeId=null → 完整读回 → 释放本次锁。每个写入使用临时替换与读回；不会承诺跨文件原子性。

| 观察到的阶段 | 显式 finish 行为 |
|---|---|
| 原生确认，仍是未编号目录 | 核对内容后只补编号改名 |
| 编号目录已存在且与当前操作一致 | 不再移动，继续剩余记录提交 |
| count 为 countBasis 或 ordinal | 前者写为 ordinal，后者保持；其他值拒绝，不重新分配 |
| 终态 Run 已写，binding 仍 archiving | 核对其直接身份与预期结果，只补 manifest，不改已提交正文 |
| 最终计数 / Run / binding 一致 | local-only 返回 already-completed |
| 无原生效果或现场未知 / 冲突 | finish 不执行原生，不标完成，报告具体阻断 |

过渡态 query 校验当前 Archive Run / binding 的类型、身份和阶段，返回 pending、当前对象与最小 next（execute / finish 或现场核对），upstream:null；不要求已移走的源路径，不从路径消失推断成功。普通 Action / Owner 写入在该态拒绝，只有上述无效果 Owner 回退例外。counter 或 Run 已写但 binding 未提交时仍为 pending。原锁存在仍沿用锁错误。

最终态 query 读取唯一 archived binding 的最新 Archive Run，核对 submitted / complete、result / 编号和计数，显示已归档 / 无活动 Change，next=delivery-next / awaiting-owner-instruction；归档路径只定位，不读归档内容或过去批准、调用旧活动 status。上游 version / list 的普通查询检查保留，upstream 为 null。旧人工 archived / next 保持只读，不当 product Run 验证。原生源丢失但没有合法当前归档记录仍报输入错误。

### 6. 扩展前的职责整理与方法任务

在增加操作指引 / 回退前，将 application/actions.ts 的指引与 Owner 处置分别移至 application/action-instructions.ts 与 application/action-resolution.ts；把真正共享的当前工作 / actor / 直接 Author 检查放在小范围公共上下文模块，原文件保留普通 start / continue / save / submit。CLI 直接引用相应职责模块，不加只转发的层。Archive 由 application/archive.ts 编排实际前置、外部调用和本地 finish，必要写入 / 协议分别留 adapter，不把流程继续堆进 actions.ts。

更新 Apply / Review Apply / 新 Archive 与 OpenSpec 产品方法；AGENTS 和 Review Apply 方法落实路线图 §5：三类目录前三名、当前明显增长、职责判断与处理时机，不足三个列全部；无可靠基准不造增长。审核关注真实职责和覆盖，不设硬行数、容量或 hash gate。

C proof 678 行与 D proof 487 行保留为受审、限定范围的探索，不添加产品验收、其他 Change 场景或继续扩写 C 候选保存。action-write.test.ts（467）保留写入领域；planning-cli.test.ts（444）保留 C 规划流，不追加 D 大流程。新增 Owner 回退、操作 inputs、Archive 执行 / 故障与查询分别成场景组；共用准备只暴露直接必要输入，不隐藏批准或故障点。如果确需扩展旧 proof，先分离 Apply 记录流与 Archive 效果组，再保留简单 TS 入口和旧输出。

### 7. 验证落到真实产品路径

- 真实固定 CLI 操作 inputs：缺 tasks / blocked、ready / all_done、context / guidance、错误身份 / 进度 / 路径与未知 Ref；兼容既有 artifact 输入。
- 真实 Owner Apply handoff / rejected revise / earlier rollback，以及无效果 Archive 放弃：同 Action / 新 revision 的直接对象、重新审核、非法目标、陈旧对象、写前变化和锁内失败。
- 真实产品 Archive：无批准 / 未完任务拒绝、成功同步与编号、原生冲突 / 无效 delta、包装结果和异常响应。用当前 Run / workspace 写入 observer 定向注入编号前、计数提交后、Run 完成后与最终 manifest / 读回失败，实际读回错误与效果。
- 新进程 finish、再次 finish、两个真实竞争执行者、错误候选 / 越界 / 外链、源与目标并存、跨日期定位；核对原生调用次数及计数只增长一次。未知响应至少覆盖原生已实际完成但响应丢失和无可靠效果的停止路径。
- product 过渡 / 完成查询、归档目录不再可读、旧说明 / 未知 Ref 失效；保留必要当前 Run / 锁 / 身份拒绝、人工查询及产品写入拒绝。
- `pnpm check`、现有相关回归与新测试、主 / delta structural validation 按实际变化执行；不重跑全部旧 Explore，不把这些称为正式 Delivery Full Test。三目录维护报告进入新的 Review Apply 摘要。

## Risks / Trade-offs

- [外部调用与多文件本地提交不原子] → 调用标记先落盘、原始结果和有限源输入保留、明确阶段、有限 finish；未知现场停止，不宣称任意掉电恢复。
- [原生内部失败可能回滚或回滚失败] → 根据实际源 / 目标 / 规格核对，不以错误码单独认证无效果；产品测试补自己的收口行为，沿用 031 对未覆盖上游分支的限制。
- [指引 / 全勾任务不是批准] → 固定当前 Review / Author、顺序与重新审核保持；语义与真实角色独立性仍由会话负责。
- [新增过渡态可能放宽正常路径检查] → 仅匹配当前 Archive 的已知 typed 状态允许源缺失，普通缺失仍报错，错误状态 / 路径和并发用定向回归验证。
- [为了数字拆分造成更多间接层] → 按正在扩展的真实职责划分，CLI 直接接线，旧完整测试 / proof 保留边界和维护触发条件。

## Migration Plan

不迁移旧 Run、不改历史 verdict；可选新字段只在新 Archive / Owner 工作中产生。旧 version 1 与 manual-bootstrap 保持可读，计数缺省只在操作内解释。先整理职责并保持既有回归，再接操作 inputs / Owner 回退，再实现 Archive 状态和有限提交，最后方法与定向验收。新增记录出现后不把旧程序能否解析当作兼容承诺；若撤回实施，保留新材料与错误现场，由 Owner 决定处置，不自动反向移动目录或减计数。
