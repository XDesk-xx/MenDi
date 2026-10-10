# Design

## Context

动机见 [proposal.md](proposal.md)。014 独立 Review Explore 已批准 013 的限定实验：普通 full 即使通过仍非正式；两项归档后旧 Change 的修订入口拒绝；真实接线失败、局部修复及新完整集合重跑可复用现有执行能力。Review 未批准尚不存在的正式协议，本设计收敛这些直接输入与接线。

当前 `test-execution` 协议固定 command scope；`runTest` 自己跨 await 持项目锁。`action-store.createRun`、`runLocation`、阶段 context 与 workspace 归档读回均绑定 Change，query 无活动项时读最后 Archive。编号扫描已支持同级 Delivery 操作；底层入口、预检、进程与日志可复用。`dispatch.ts` 使用深层三元分派，新增接线前先整理。

## Goals / Non-Goals

**Goals:**

- 正式验收与普通命令事实分层，在一个操作写锁内固定直接输入、真实执行与保存结果。
- 无活动 Change 时有明确的 Author 修复 / 独立 Review 记录，当前交接只使用直接对象。
- 保存实际受测基准与已知匹配情况，材料真实性和覆盖判断仍由阶段工作负责，不伪造自动源码认证。

**Non-Goals:**

- 不实现 Close / Reopen、多 product Delivery、通用恢复 / 调度、引用注册中心或全库 hash gate。
- 不迁移人工历史、不改旧 Run / verdict / 归档，不扩大平台 / 包管理器支持，不自动安装依赖。
- 本次产品实现验收在受控项目完成；根正式 Full Test、Git、Archive 与下一 Change 保持单独边界。

## Decisions

### 1. 明确的 Delivery 命令，复用普通记录入口

新增四个入口；只有正式 run 执行测试，其余准备记录或只读。Owner 授权由实际会话保证，CLI 的 role / actor 是声明与明显冲突检查。

| 命令 | 必要参数和作用 |
| --- | --- |
| `delivery full-test run` | `--project --input --role author --actor --pnpm-bin`；固定声明后实际执行 full 并生成正式 Run |
| `delivery full-test status` | `--project --run`；只读指定同当前 Delivery 的正式 Run 与其直接结果，可查询旧 failed，不改变当前选择 |
| `delivery repair start` | `--project --from --reason --role author --actor [--revises]`；from 为当前 failed 正式 Run，revises 仅接受当前完成修复 Author / 当前 Review 固定的 Author |
| `delivery repair review` | `--project --author-run --role reviewer --actor`；固定当前完成修复 Author，准备独立 Review |

修复 / Review 使用既有 `run save --body`、`run submit --outcome --result [--verdict]` 和 `action continue --action`，根据实际 Run scope 走各自必要输入。正式 Full Test 禁止普通 submit / continue；当前 Full Test draft 可同 Author 保存故障说明，不能改执行字段。通用 Change `action start / resolve / instructions` 不因此获得 Delivery 类型或旧 Change 复活权限。未提供 Delivery Owner resolve / unknown finish / unlock。

选择独立入口避免把“无活动 Change”作为现有 Change context 的豁免，也不在每个命令复制一个通用 Action 框架。

### 2. 简单声明与操作实际输入

`--input` 是项目内安全相对 JSON 文件，执行时复制解析后的声明到正式 Run；后续查询不再依赖原文件。最小格式如下：

```json
{
  "collection": ["单元场景", "跨 Change 接线场景"],
  "basis": {
    "materials": "实际受测实现、测试、依赖和执行配置及影响范围的说明",
    "commit": "有 Git 基准时填写真实受测提交；无基准省略此字段",
    "changes": "相对该提交的必要未提交差异；无差异可为空"
  }
}
```

collection 是非空、无重复的完整集合说明，不是命令生成器或测试文件注册表。只运行目标已有 full 映射的一个完整 script；真实 script 名 / 文本、工具、cwd 和执行参数由现有读取 / 执行逻辑生成，不信任声明提供的命令。basis.materials 必须明确且非空；commit 有值时为真实完整提交标识，changes 是必要差异说明 / 文本。无 Git 项目用 materials 说明实际材料，不以临时路径、固定四文件、任意版本计数或全库 hash 代替。

阶段方法要求 Author 从实际受测材料获取提交 / 差异与配置，声明覆盖充分；CLI 只校验结构与已知记录 / 命令事实，不自动运行 Git 或宣称该文本是机器扫描结果。定向 Reviewer 核对真实局部差异，Full Test Agent 在执行前 / 后判断受测材料是否变化。若发现不能确认的源码并发变化，不能以 command exit 0 宣称当前源码适用或允许 Close；已保存 passed 只保留本次声明下的执行事实，阶段摘要说明材料变化 / 未确认并按实际影响补验，不改写旧 Run。本轮不建设任意项目源码检测器，也不新增一个材料批准阶段。

首次正式执行要求全部当前 plannedChanges 都有 archived binding，且无活动 / archiving 项。只为这些本轮必要项读取直接终态 Archive、它固定的 Review Apply 及该 Review 的完整直接 Apply Author；校验同 Delivery / Change、submitted / complete、approved、不同 actor、archiveOrdinal / 路径一致。未关联 / 未完成槽位拒绝，不将最后 Archive 代表全部槽位。旧 Explore / Propose、说明和其他扩展不读取。

固定范围快照只包括 goal、plannedChanges 和各项 slot / changeId / archiveOrdinal，以及本次已核对的直接批准事实；忽略不参与范围的说明扩展。重跑时如果这些已核对事实仍适用、当前 failed / not-run / interrupted 正式 Run 的范围与当前 manifest 一致，可以沿用其批准事实快照，不重读全部旧批准文件。修复后另读当前定向 Review 与固定新 Author；不能沿原失败的前项、Review 历史或 Run 链补证。范围快照不一致时停 Owner，C 的范围编辑 / Reopen 不在 B 实现。

### 3. Delivery Run 协议与两个用途明确的指针

新 Run 路径为 `.mendi/runs/<delivery-id>/<NNN>-<actionType>/run.md`，与 `<NNN>-changes` 同级，使用同一 `scanRunNumbers` 及独占占号。四种类型为 `delivery-full-test`、`delivery-repair`、`revise-delivery-repair`、`review-delivery-repair`；前三种角色 Author，最后一种 Reviewer。actionId 为 `<delivery-id>-<首次编号>-<类型>`，continue 保持它。

新头部沿用 product version 1、deliveryId、runNumber、actionId / actionType、role / actorId、stageSkill、draft / submitted 与 outcome / result；另明示 `scope:delivery`、`changeId:null`。旧头部没有 scope 时按 Change 解释，旧路径、格式和批准保持。Full Test 的 `fullTest` 块保存范围 / 批准快照、collection、basis、实际入口、prepared / running / finished、可空 executionId、outcome 和必要失败原因；修复的 `repair` 块固定 failedFullTestRunRef、范围与完整 collection。Review 固定 authorRunRef；修订固定 revisesRunRef。失败来源是本轮直接对象，不建立父链。

product manifest 新增可选 `deliveryRunRef` 和 `fullTestRunRef`：前者选择当前 Delivery 操作进展，后者保留最近正式执行入口。修复 / Review 更新前者，保留后者；新正式 Run 固定后同时更新两者，即使尚未运行也不能回退旧 PASS。二者不能指向另一 Delivery 或不合法类型，不扫描目录最大号推断当前进展。

无活动 Change 且有合法 deliveryRunRef 时，query / diagnose / 通用保存提交选择 Delivery 进展；旧 `currentRun` 的 Change 选择继续供 Change / Archive 操作使用。当前选择和头部解析在一个明确的 scope 分支中共享，不另建注册中心。当前 Delivery 操作与活动 Change 并存是矛盾记录，拒绝而非选一个隐藏另一个；合法新关联前须结束既有交接并清空 deliveryRunRef，fullTestRunRef 保留为历史定位，不能证明新工作适用。失败、未完修复、未批准 Review、unknown 阻止 bind。

### 4. 一次持锁的正式执行与真实底层复用

将 `src/application/tests.ts` 的依赖预检、执行号 / 日志准备、运行意图、前台执行与终态保存整理为有实际职责的内部执行服务。它接受当前项目与已经取得的操作 lease，在启动前暴露持久执行身份给调用者；不自己第二次加锁 / 释放外层锁，不负责验收范围和审核。普通 `runTest` 仍自行加锁并调用该服务，公开输出 / 预检 / unknown 行为不变。Full Test 应用操作同样只持一个项目锁，复用该服务，不嵌套公开 runTest。

顺序为：本地无副作用 admission → 加锁并复核 → 创建 Full Test draft / 范围与声明快照、关联两个指针并读回 → 现有工具 / 依赖检查 → 独占子执行目录和日志 → 保存子意图及父 Run 的 executionId / running → 真正启动 → 保存子终态 → 复核当前直接范围 / 声明 / full 入口与必要输入的实际字节 → 写父终态并完整读回 → 正常释放自身锁。指针提交失败或启动前意图失败，不启动测试；已写占号保留。

普通子执行保持 `scope:command / formalDeliveryTest:false`；正式意义只在已声明且本次发起的父 Run。两层结果必须属于同项目 / Delivery、kind=full、实际命令与声明选定入口一致。本次真实退出和保存支持 passed / failed / not-run / interrupted；unknown 保留未确认及现场，不从预检 exit 0、日志 sentinel 或旧 pid 推断结果。

Apply 中的真实集成发现宿主 `node:test` 内部 `NODE_TEST_CONTEXT` 会令嵌套目标测试跳过却退出 0；执行环境去除这一内部字段，不修改宿主环境。受控接线场景核对真实失败断言、正常非零退出和两组各次实际运行，避免仅认证记录或报告自报。

scope / 输入结构拒绝不占 Run；声明已固定后工具 / 依赖拒绝记录正式 not-run、executionId=null，普通子执行仍不分配目录。已分配后启动失败可有 executionId，仍按事实 not-run。预检 / 工具原始输出存当前 Run artifacts，结果只摘要并引用，不复制为另一份证明树。缺依赖按既有 error 预检拒绝、选定调用强制 warn 禁止自动安装，正常依赖准备属于调用者；不得继承目标 install 策略。

若日志 / 父 Run / manifest / 最终读回或自身锁释放失败，操作非零、保留已写路径和锁 / unknown。不得改已完成旧 Run、重跑子命令、清锁或提供自动 finish。终态已经写而报告仍失败时按实际现场诊断，不回滚成可重提 draft；普通查询遇到不完整 / 锁现场不报告正式已确认通过。B 的 unknown / 崩溃恢复停 Owner 核对，不新增恢复协议。

### 5. 归档后修复与独立定向 Review

repair start 的 from 必须等于 fullTestRunRef，且是本轮 scope 一致的完整 failed，不接受普通 failed、旧失败、unknown 或未确认现场。reason 非空；固定 failedFullTestRunRef 和 collection 后返回 Author 方法。Author 在同一 draft 做实际修复、必要 focused / fast，并写清原因、范围、实际差异 / 受测材料、验证与限制；常规检查不逐项建 Run。没有代码修复的失败调查也必须如实说明，不能伪装已修复。

三个产品方法分别为 `skills/actions/delivery-full-test/SKILL.md`、`delivery-repair/SKILL.md`、`review-delivery-repair/SKILL.md`；revise 复用 Author 修复方法。新增实际方法加载支持 Delivery 阶段身份，复用已有文件读取 / 验证职责；不访问归档 Change 的 OpenSpec instructions。修复记录仅本地检查当前 Delivery 和 source scope，不强迫重建活动目录。

Author complete 后准备 Review，读取固定新 Author 的完整头部和正文，Reviewer actor 与 Author 不同；实际审核在独立会话完成，自动化验收中的 approved 只能标明记录夹具。Review 核对直接失败的事实、局部差异、命令 / 集合变化是否在范围内和定向验证；继续 / submit 保持同一 authorRunRef，需要的直接失败与 Author 不可用时停止，query / draft save 不读这些正文。

Review complete 采用 approved / changes-requested / rejected。approved 提示显式新的完整 Full Test；changes-requested 创建 revise-delivery-repair；当前完成 Author 的主动范围内实质修订也另建该类型，旧 approved 失效。rejected 或范围 / 方案实质变化停 Owner，普通 start / continue 不处理 rejected 恢复；后续 Owner 重新规划按已有授权边界开展，不由 B 提供通用处置命令。

### 6. 新整次执行及可复用的适用结果

failed 后新 full 要求当前 approved 定向 Review、固定 submitted / complete 新 Author 与直接失败 scope 对应。collection 必须与本次失败完整声明相同，不能删一组或换脚本来绕开缺陷；经定向审核的范围内执行配置修复可以更新实际 full 命令，但必须仍运行整个集合，材料 / 差异在 Author 与新声明中明确，不能仅因 script 字节不同就机械要求完整 Explore / Propose。未审变化或扩大范围回 Owner。

新执行独占新 Run / 子执行，保留旧失败三文件字节；一个新结果来自一次整个声明集合，不拼接旧 full 和新 focused。若新 full 再失败，修复固定这次当前失败；新 Run 内沿用已核对的本轮必要批准事实，不读取更旧父失败。not-run / interrupted 在现场完整且无未审材料修订时可显式新执行，仍保留当前必要定向批准；unknown / 未完现场停止，不自动重试。

query 和 full-test status 分开显示：持久 outcome / executionId、collection / basis、当前 scope 与入口是否 match / changed / unavailable，以及 `materialApplicability:requires-semantic-check`。CLI 不输出未经验证的 `applicable:true`。源码 / 测试 / 依赖变动按实际影响由阶段工作判断；当前 full 配置变化可明确报告不匹配，说明整理不因无关字段变化使结果失效。实际必要日志 / 子结果缺失或身份矛盾必须失败，当前入口无法读取时报告匹配 unknown，不把历史结果本身改写。

未来 C 的 Close 直接读取 fullTestRunRef 的完整正式事实、本轮 scope、必要审核和实际候选差异，作当前适用性判断；本轮仅提供入口和诚实信息，不实现 Close 或新“适用性批准”阶段。不强制全库文件快照、Git 命令可用性或任意容量 / 行数 / 证据门槛。

### 7. 当前选择、必要引用与写入诊断

| 操作 | 额外必要读取 | 不自动读取 |
| --- | --- | --- |
| 当前 Delivery status / next | 当前 Run 头部；当前正式执行的直接子结果 / 必要日志 | 旧 Archive / Review / Author、scope 内记录的说明 refs、修订 / 失败父链 |
| full-test status 指定旧 Run | 同当前 Delivery 的明确正式 Run、它的直接子结果 / 日志 | 当前最新结果不能替代指定对象，不读旧范围内的历史正文 |
| 首次正式 run | 当前本轮各项直接 Archive / Review Apply / 固定 Apply Author、声明、实际 full 入口 / 工具 | 旧 Explore / Propose / 其他说明和未知扩展 |
| 修复后正式 run | 当前 failed 及适用批准快照、当前定向 Review / 新 Author、声明与实际 full 入口 | 失败父链及更旧定向 Review |
| repair start / 修订 | 当前失败、当前进展及修订直接 Author，所需方法 | 旧方案、所有历史 Run |
| 定向 Review start / continue / submit | 当前固定 Author / 直接失败 / 必要范围和事实；开始 / 继续另读方法 | 无关历史审核或原 Change 的活动 status |
| draft save / diagnose | 当前本地记录、scope / role / actor / 正文或锁观察 | 上游、方法正文、Review 的固定 Author 正文 |

`managedPath` 和规范路径 / Run 身份校验复用；不按 Ref 后缀递归要求存在。diagnose 识别新的 Delivery 头部、当前指针及明确同 Delivery 残留占号，保持前后字节观察和只读锁边界；不能从原 pid 不存在宣布本次执行未运行 / 通过。

当前 formal pass 仅提示 delivery-next / awaiting-owner-instruction；failed 提示 Author repair，not-run / interrupted 提示显式 full retry，unknown / 未完执行提示 Owner 核对。repair / Review draft 和 continuing / complete 采用已有最小交接原则，每轮只列当前实际必要输入，不累积证据链。

### 8. 实施结构和验收安排

Delivery 协议 / 范围规则、Run 文件读写、验收与修复应用职责分别组织；底层执行服务承担完整执行生命周期，原 tests.ts 保留普通操作接线。driver 先改为直观分派，再接四个入口，output 展示 scope 和事实 / 声明边界；不引入通用注册框架或为压行数增加转发层。

新验收按 `delivery-full-test`、`delivery-repair`、`delivery-verification-query` 和写入 / 并发场景组织，复用既有受控 setup，避免扩充 planning-cli 长流程。真实路径覆盖两项原生归档后首次正式失败 → Author 修复提交 → 不同 actor 的 Review 记录 → 新整个 full → 新进程查询；夹具 Review 只认证记录协议，真正阶段批准仍由独立 Reviewer 作出。断言检查真实失败 / 退出、两组各次实际执行、旧失败字节不变和原归档绑定不变，不单靠组标记或 report 自报。

## Risks / Trade-offs

018 Review Apply 的范围内修订澄清三处既有边界：首次修复后 admission 与后续沿用批准都需要当前直接 Review 非空正文，query / draft save 不因此增加正文依赖；deliveryNext 接受调用方本次正式观察 outcome，unknown 不能按持久 passed 提示收口，原头部不改写；共享执行器在停止命令后最多等 5000ms 的 close 确认，taskkill 调用自身也设 5000ms 超时。停止命令成功但管道未关时将停止降为未确认、有界返回 unknown，保留锁和已收到日志，不由旧 pid 推断整树停止，不增加恢复 / 清锁。真实启动即取消仍在 after-launch 立即触发；测试 watchdog 仅处置测试自己核对的隔离进程，若依赖它才返回即判测试失败，不将其人工停止当成产品 interrupted。

- 单个项目锁不能隔离编辑器 / 未遵约脚本写源码 → 执行方法核对实际候选变化，未知则不作正式通过；公开记录材料是声明，未认证事实不冒充机器认证。
- 复用执行器改变原 unknown / 日志 / 依赖预检边界 → 先整理真实职责，再运行现有执行、依赖、短写与故障回归；不降低预检。
- 多文件提交不是崩溃原子事务 → 保存意图、返回实际已写路径，unknown / 锁现场停止并只读诊断，不另建通用恢复。
- 初次验收确实需要本轮直接批准；旧文件缺失可能阻止该操作 → 明确与普通查询依赖不同；已核对且适用的快照可供当前重跑沿用，不追读全部历史。
- 表面通过可能被误读为 Close 已获准 → outcome、basis 与适用性分开呈现，阶段方法明确当前材料判断与 Owner 收口边界。

## Migration Plan

无自动记录迁移。旧 product Change Run 缺少 scope / Delivery 指针时保持原选择和格式；manual-bootstrap 保持原 next、只读来源及兼容。新增 product 字段只由明确 Delivery 操作写入，不补建旧目录、旧 Run 或旧 full 记录。

本次按受审任务实施、正常准备工程依赖、分组验收和独立 Review Apply；归档 / 发布仍需单独指令。若尚未使用新记录可退回旧实现；已有新 product 记录时不能假装旧版本完整支持，应保留数据并使用能解释该协议的版本，不删除记录或强行回写历史。
