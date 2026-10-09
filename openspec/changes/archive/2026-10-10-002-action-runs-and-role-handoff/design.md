# Design

## Context

动机与范围见 proposal.md。现有 `project.ts` 查询产品初始 Explore 或人工 next；`records.ts` 尚限制 product 首个 binding 与空批次；`workspace.ts` 已具备受管路径、独占锁、临时文件替换和失败路径报告。CLI 还没有 Action / Run 参数分支，产品 Skills 目录仅预留。

016 的隔离 proof 经 017 独立重放批准，支持跨进程提交、多 Run、直接 Author 引用及有限占号 / 锁冲突处理。原型扫描当前 Change 全部头部、只支持首次 Review 的简化逻辑不进入正式实现；本设计处理其已知限制，不重新认证所有历史。

## Goals / Non-Goals

**Goals:** 用当前 Run 作为 Action 的唯一进展正文，在一套简单记录命令中实现保存、提交、继续与独立审核交接；当前输入直接且按操作区分，部分写入可判断。

**Non-Goals:** 自动执行 Agent、身份认证服务、完整阶段语义验收、任意阶段回退、自动恢复、第二 Change 产品激活、Archive / Delivery 收口操作、人工格式迁移。无任务请求 DSL、ActionInstance 平台或文件 hash 清单。

## Decisions

### 1. 当前状态只定位一个 Run

沿用 product `formatVersion:1`，扩展当前 binding 的可选 `latestRunRef`、`batchId`，首次开始后 binding.state 为 `active`；没有 Run 的 A 格式仍以 `explore` 初始关联读取。`activeChangeId`、原范围与唯一 binding 约束不变。product `changeBatches` 从空扩展为当前已建立的单一批次，身份必须与 binding 一致，不增加第二 Change 激活能力。

当前 Run 用 YAML 头部 + Markdown 正文，头部为产品管理的结构化部分，保存以下必要字段：

| 字段 | 含义 |
|---|---|
| formatVersion、recordingMode | `1`、`product`，拒绝把人工 Run 当产品 Run |
| deliveryId、changeId、runNumber | 路径和记录身份；编号正整数，目录数字补足至少三位 |
| actionId、actionType、role、actorId | 本次 Action、阶段、声明角色和稳定操作者标签 |
| status | `draft` / `submitted` |
| outcome、result | 仅 submitted 时必有；`continuing` / `complete` 与非空结果摘要 |
| stageSkill、toolGuidance | 固定方法标识；明确请求的工具指导标识列表 |
| authorRunRef | Review 必有的固定 Author 输入 |
| revisesRunRef | Author 修订必有的直接对象 |
| verdict | 仅 complete Review 必有 |

新 Action 的 actionId 由 Change ID、首个 Run 号和类型生成，继续保持同一值。Action 未完成 / 完成由当前 submitted Run 的 outcome 决定，draft 表示工作中。无需单独 Action 文件或重复进展状态。当前 binding 的 latestRunRef 同时指向工作中的 draft 或最后提交；不再另保存一份产品 next，查询从当前头部派生。

选择直接指针而不扫描所有历史 Action 头部：既能定位真实当前进展，也不会让坏旧 Run、旧 Skill 文件或历史说明成为查询前置。初次开始没有 current Run 时不读不存在的指针；人工 latestRunRef 仍只是说明。

### 2. 四类显式记录命令

所有命令沿用 `--project`、`--openspec-bin` 和 `--json`。写命令还要求 `--role` 与 `--actor`；`actor` 是实际会话持续使用的标签，不能为空，不代表登录或认证。操作者和角色绑定到 draft，同 Action 继续不允许换标识。

```text
mendi action start --project <root> --change <id> --type <type> --role <role> --actor <id> [--author-run <ref>] [--revises <ref>] [--tool openspec]
mendi action continue --project <root> --action <id> --role <role> --actor <id>
mendi run save --project <root> --run <ref> --role <role> --actor <id> --body <markdown-file>
mendi run submit --project <root> --run <ref> --role <role> --actor <id> --outcome <continuing|complete> --result <summary> [--verdict <verdict>]
```

`--run`、`--author-run`、`--revises` 是项目内受管相对路径；身份同时核对当前 binding 和目录。`--body` 是明确指定的 UTF-8 Markdown 输入，可为绝对路径或相对目标根，不写输入文件；不是结构化执行请求。save 只更新正文，头部由程序保留，未知说明扩展不递归解析；正文的工具 / 结果 / 材料链接由 Agent 写出并按实际语义核对。

start 建立新 Action 和空 draft；continue 仅接受当前 submitted / continuing，建立新 draft、同 actionId，复制当前所选方法标识和固定 Author 输入。当前 draft 未提交必须先 save / submit，不因多跑命令另起 Run。save / submit 只接受当前 draft 的同角色 / 操作者；submit 还要求正文和 result 非空。已 submitted 的正文、outcome、verdict 不再修改或重新提交，陈旧 --run 拒绝。

成功结果返回目标、工具、Run 路径 / 编号、当前 Action 与状态；start / continue 返回实际加载的方法内容及文件位置。操作为记录准备或提交，输出不宣称已执行 Agent 方法。

### 3. 方法选择与最小交接表

内置简单类型表支持 `explore`、`propose`、`apply`，三种对应 `review-*`，及三种 `revise-*`；只允许各自 author / reviewer 角色。Author 基础阶段对应 `skills/actions/<phase>/SKILL.md`，Review 对应 `skills/actions/review-<phase>/SKILL.md`，修订复用对应 Author 方法。产品 Skill 使用最小指导：目的、实际角色、必要输入、工作方法、提交要求及停止边界。不得将 Reviewer 实验夹具打包成正式指导。

六个产品方法不复制整个上游 OpenSpec Skill。Author 指导要求按实际阶段消费已安装上游工作方法，Reviewer 指导要求独立核对明确 Author 对象；D01-C / D01-D 再完成具体阶段语义和工具接线。`--tool openspec` 是本轮唯一显式工具指导，读取产品 `skills/tools/openspec/SKILL.md`，说明固定公开 CLI、显式根和真实失败输出；无选项则不读。固定路径由安装包位置解析，Run 保存方法标识，返回结果展示实际路径；不把安装包方法误解释为目标项目内受管材料。

start / continue 实际读取所选方法，检查名称 / 阶段 / 角色元数据；缺失或不匹配写前失败。save / submit 校验记录的方法标识与固定类型表，但不重新载入方法正文；status / next 不读取方法文件。

| 当前提交 | 下一提示 / 可显式开始 |
|---|---|
| 无当前 Run、已有活动 binding | Explore Author |
| 当前 draft | 当前 Run save / submit；不新分配 |
| submitted / continuing | 同 Action continue |
| Author complete（含对应 revise） | 匹配阶段的独立 Review |
| Review complete / approved | explore → propose；propose → apply；apply → archive 边界 |
| Review complete / changes-requested | 对当前固定 Author 的相应 revise |
| Review complete / rejected | Owner 决策，拒绝一般 start / continue |

初始 start 只接受 Explore；正常下一阶段 start 必须匹配上述当前交接。Archive 与 Delivery 类型本轮不接受，apply approved 只返回待后续能力 / Owner 指令的边界。所有 next 都只是推荐，不自动运行。

Owner 范围内的主动局部修订允许对当前完成 Author，或最新匹配 Review 固定的 Author，使用 `revise-<phase> --revises <ref>` 建立新 Action；不支持跨阶段任意回退。changes-requested 必须使用相同 revise 类型和对象，rejected 先停 Owner 决策，不自行续开。修订建立后当前指针取代旧批准入口，当前 next 由新 Run 派生；旧 Author 与 Review 文件保留，不改旧 verdict。

### 4. Review 固定对象，继续不重新猜 Author

初次 Review start 必须提供 `--author-run`，并与当前指针直接指向的完成 Author 一致：同 Delivery / Change、matching phase、product、submitted / complete；Author actorId 与 Reviewer 标签不同。匹配 phase 包括基础 Author 或该阶段 revise。完整正文和提交摘要是必要材料，缺失 / 坏记录拒绝。

Reviewer continuing 只依据当前 Reviewer Run 的 actionId、角色 / 操作者和固定 authorRunRef；实际重新读取该 Author 输入验证身份、完成状态与不同操作者，**不要求 Author 等于当前最新 Reviewer Run**。新 draft 保留同 authorRunRef；save 只改 Reviewer 正文，submit 同样使用固定对象。当前指针变化、Action / 对象身份矛盾会拒绝陈旧写者，不重查旧审核链。

Review complete 需要合法 verdict 与非空正文 / 结果，continuing 不允许 verdict；Author 永远不允许 verdict。程序只拒绝明显同标签自签及类型 / 角色矛盾，不认证人或阻止恶意换标签；真实 Author / Reviewer 独立性必须由会话与 Owner 保证。批准是 Reviewer 的显式语义结论，工具 PASS、OpenSpec readiness 与方法读取均不能代替它。

### 5. 具体输入依赖与错误

| 操作 | 实际必要输入 |
|---|---|
| status / next | A 的配置、工具、project、manifest、活动 Change；product 当前指针存在时再读该 Run 头部；不读固定 Author、Skill 或所有旧 Run |
| start | 上述当前状态；所选方法；开始 Review / revise 时直接读取对应 Author；分配时扫描实际目录占号 |
| continue | 当前 submitted / continuing Run、匹配 actionId / 角色 / 操作者、其所选方法；Review 再读固定 Author；分配占号 |
| save | 当前 draft、匹配 --run / 角色 / 操作者、明确正文输入；无需读取旧 Author 或方法正文 |
| submit | 当前 draft 全记录、匹配身份、正文 / result / outcome；Review 再读固定 Author 与 verdict 规则 |

status / next 不读取当前 Run 正文中的材料链接，也不递归解析任何 Ref 字段。必要当前指针坏、输入丢失和越界仍失败；不存在的旧说明 / 未知字段仅保留。Review 指针的路径形状与身份字段校验不是读取其内容；普通查询不会要求目标存在。

沿用用法错误退出 2，业务 / I/O / 写冲突退出 1，成功退出 0。新增明确错误类别：`invalid-action`、`action-role-mismatch`、`action-state-conflict`、`run-not-current`、`run-already-submitted`、`run-input-missing`、`invalid-run`、`review-input-invalid`、`self-review`、`skill-unavailable`、`run-number-conflict`；受管越界与锁冲突复用现有类别。错误展示实际必要输入 / 路径与修正建议，不触发补证或其他流程。

### 6. 占号与写入顺序

在同项目 `.mendi/write.lock` 下重读当前状态，分配同 Delivery 所有实际 `<数字>-<操作>` Run 目录的最大号 + 1。仅识别约定层级：Delivery 根操作，以及 `<数字>-changes/<changeId>/<数字>-<操作>`；不递归 artifacts 或将其数字目录误作 Run。批次前缀不占号，重复实际号拒绝，空 Run 目录占号并返回诊断。目录 / junction 经 managedPath 核对；不读取历史 Run 头部 / 正文。当前指针本身不完整仍阻断，不能借跳号伪装当前进展可继续。

product 第一次 Action 时建立批次，前缀复用本次首号；Open 本身在 A 中没有产品 Run，则第一个真实 Run 可以是 `001-changes/<id>/001-explore`，不补造历史 Open Run。已有人工 003-changes 不迁移。

start / continue 有两个落盘对象：独占建立新 Run 目录、以 wx 写完整 draft，然后用同目录临时文件 + rename 更新 manifest 指针 / 批次，最终读回当前 Run 与 manifest。不存在新文件时可安全释放本次锁；一旦修改发生，任何替换 / 读回失败保留本次锁和现场，错误列出已写路径。成功读回后确认锁 token 仍属于本操作，再释放；释放失败同样不返回成功。新方法先读，避免缺方法却占号。

save / submit 不换当前指针：在锁下校验当前 draft，写同 Run 目录唯一临时文件，再 rename 替换 draft run.md，读回并释放自身锁。submit 的 rename 使头部变为 submitted；此后即使最终报告失败，也不得自动重提。操作可检测到的部分失败以及硬中断留有锁，后续普通查询报告未完成写入，不假装旧 manifest 代表完整状态。重放不抢锁，不自动删除、回滚或认领孤立 Run；Owner 核对后决定如何处理现场。本轮不新增恢复命令。

现有 workspace writer 出错后通常释放锁，不足以保护新双文件 Action 写入；在实际文件适配器中扩展“修改后失败保留锁”策略，A 的既有正常 / 错误行为必须回归。不要直接照搬 Explore 原型 finally 无条件释放的写法，也不声称跨文件事务原子性。

### 7. 查询、兼容与组织

JSON 增加当前 `action` / `run` 事实，next 最多保留 action、status、role、reason 和相应 currentRunRef / authorRunRef / revisesRunRef；不复制全部来历。阶段 `executable:false` 表示语义工作不由 CLI 自动执行，即使本轮已有显式记录命令，也不等于可自动完成阶段。人读帮助和输出解释记录命令的能力。

无 Run 的 product v1 仍可查询并开始第一次 Explore；未知 product 说明保留。manual-bootstrap 保持 A 的只读解析和人工 next，新增写命令写前统一拒绝，不消费旧 Run 头部。仅人读查询修正无关联 / 已归档无活动的区别，不改 archived JSON 身份、不调用旧活动 status。

实现按职责放在 core 的类型 / 规则、application 的 Action / Run 操作、adapters 的真实文件 / 方法读取、drivers 的参数和显示；复用既有 path / error / OpenSpec 能力。不按任意行数拆层或新增只转发的模块；YAML、TypeScript、测试和 check 仍沿用现有依赖与工程命令。

## Risks / Trade-offs

- [同标签校验不等于身份认证] → 明示会话独立性由 Owner 保证，验证明显自签和错误角色，不建设认证服务。
- [提交文件与当前指针不是跨文件原子事务] → 写后失败保留锁、读回后才成功，执行定点故障注入，保留原文件和实际已写路径。
- [新 Run 保存接口可能被手工外部改写绕过] → 所有产品命令校验当前头部 / 身份并拒绝 submitted 修改；保持本地协作与可信操作者边界，不增加 hash gate。
- [Reviewer 多 Run 会把最新 Review 误当 Author] → Review Action 固定直接 authorRunRef，continue / submit 只校验该固定输入，不重新猜对象。
- [基础方法接线被误报为完整阶段能力] → 输出和方法明确记录 / Agent 语义区别，真实 D01-C / D01-D 流程另行验证。

## Migration Plan

在目标测试项目上由原产品 Open / bind 进入首次 Action，验证旧无 Run 记录可读及新记录跨进程可读。当前 MenDi 人工 Delivery 和 001–017 不迁移、不重写，B 自身实施仍通过人工交接。发布 / 安装与 Git 均另需授权；回退到 A 代码时新产品 Run 记录将不受支持，应先保留现场并明确错误，不自动删记录恢复旧外观。
