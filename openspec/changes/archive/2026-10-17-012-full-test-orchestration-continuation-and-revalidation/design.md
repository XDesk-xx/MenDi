# Design

## Context

动机与范围见 proposal。009 的真实执行及 010 / 011 独立审核是直接输入；011 的 E1–E6 要求把覆盖、事件层级、退出、取消和终态保存分别解释。现有执行器持有一把项目锁，真实启动 pnpm 前保存意图，未知时保留现场；A 已提供 round / 当前投影、正式快照和直接基线。继续复用这些边界。

## Goals / Non-Goals

**Goals:** 新模式可以完整收集、明确续跑尚未执行的组、在独立修复审核后按实际影响复验，并与历史单次模式清楚区分；正式消费只读取当前操作需要的有限直接事实。

**Non-Goals:** 不把 runner 的每条断言都变成 MenDi Action，不建设通用 DAG / 缓存 / 进程管理平台，不认证任意源码、真人或跨项目资源。新协议不是 Node 事件原样透传；本轮不支持从旧不透明命令推导内部覆盖，不提供 detached 服务恢复、自动清锁或未知尝试 resume。

## Decisions

### 1. 目标拥有执行，MenDi 固定请求并消费协议

采用显式 `mendi-group-tests/1`，仍执行目标已有 full script。结构化正式声明使用 `mode: groups-v1`；没有该声明继续旧 command 模式，普通 test run 不因看到报告文件而升级。

新声明包含项目内 planRef、candidate、purpose、selection 和必要直接来源；首次 purpose=initial，必须选择全部必需组；continue 选择原未执行 / 被阻断且现在具备前置的组；retest 选择当前修复审核要求及实际扩大的影响范围。selection 是稳定组 ID，不接受任意命令文本。计划不携带 MenDi 自动执行的 shell 表达式，实际命令仍为已核对的 package script。

有前次进展时须明确 fromRunRef，匹配当前实际进展；后续准入读取该对象自身的有界进展快照，不沿 fromRunRef 递归遍历。已知失败后不能把 purpose 改成 initial 绕过必要修复审核。known not-run / interrupted 且现场已安全完成时，可按新的实际执行指令 initial 重跑全部必需组；未确认现场仍先处置，不自动重试。

持锁后保存请求，包含协议、项目 / Delivery / round、attempt Run / 子 execution ID、候选、完整计划快照、选择、已核对的必要前置事实及输出位置。通过仅新模式设置的 `MENDI_GROUP_TEST_REQUEST` / `MENDI_GROUP_TEST_REPORT` 绝对路径交给目标。输出在本次新分配 execution 目录，目标不能指定项目外结果路径或覆盖旧输出；请求字段和路径回执必须一致。预检不调用 target 测试、不自动安装 / 下载，端口检测不等于已经占有端口。

目标 runner 负责有序清单、业务前置、真实构建 / 启动 / 断言、端口 / 数据 / 清理和非零退出传播。随包方法给出协议与接线指导，受控 Node 参考目标在 tests/fixtures 验证接线，不增加 MenDi 对全部 runner 的自动适配或为其生成业务测试。增量事件只用于进度，最终报告是必要终态；不能从 stdout、TAP 文本或文件成功集合生成正式事实。

备选是由 MenDi 接管每个项目全部子命令调度，或只修改目标脚本不改变正式合同。前者扩大业务 / 资源责任，后者不能解决多来源消费和 E4 / E5，均不采用。

### 2. 最小计划与报告

计划为有序 groups，字段限定为：稳定 id、标题、kind（tests / command）、required、前置组 ID、共享 resource ID、实际测试选择 / 完成条件、必要准备说明。依赖只能引用此前组，拒绝重复 / 悬空 / 自环，保留少量实际关系，不增加通用调度语言。非必需组或组内排除项须在执行前具有明确身份和理由；报告不能事后删减计划。

tests 组的回执包含实际选择、完整枚举 / 结束标记、required 测试计数、明确排除项、晚期错误、进程结束与清理事实。没有全量每条断言元数据要求；有排除项时必须能将其稳定身份和观察与计划对应，计数不得把排除项混成必需通过。未排除业务范围须实际执行且非空，failed / cancelled / skipped / todo / pending 均为零才可能通过。计数和总数 / 根结束摘要须一致，不能只看 summary.success。覆盖充分的业务判断仍须计划和独立审核，计数不是业务认证。

command 组用于构建等非业务测试，必须声明实际命令步骤和完成条件，并报告真实退出与必要产物检查；不能把 tests 组改标 command 来绕开覆盖。产物路径受管，既有真实构建 / 缺依赖 / 配置 / 安装保护场景保持。

每个 selected group 必须有且仅有一个最终观察，未 selected 项不伪造终态。回执的组顺序 / 身份对照计划，事件先后不决定逻辑计划顺序。最终态包括 passed、failed、blocked、not-run、interrupted、unknown：

| 条件 | 最终解释 |
| --- | --- |
| 真实必要工作、覆盖 / 完成条件和结束 / 清理均确认 | 才可 passed |
| 业务失败、必需 skip / TODO / 零执行、晚退出或结束错误已确认 | failed，并列出覆盖 / 结束原因；早期 pass 不能覆盖 |
| 明确前置失败 / 缺失 | blocked，不伪造已执行失败 |
| 选中但明确未启动 | not-run，保留原因 |
| 本轮取消，确认当前支持进程树关闭 | interrupted；取消不是普通断言失败 |
| 结果缺失 / 矛盾、未确认关闭或清理、写入 / 读回不确定 | unknown，不从 PID 消失推断完成 |

目标的子测试、文件容器、suite 与根汇总须分层解释：同一文件先成功后失败最终不能通过，late exit 优先于早期成功，testAborted 等取消不折叠为普通业务失败。Node 适配示例必须覆盖 E1–E3，不能沿用 Explore 的文件集合算法作为产品实现。

### 3. 命令事实、协议结果与持久完成分别保存

底层 TestExecution 保持 command 范围及原始 outcome，不改 E4 中包装器实际退出 0 的事实。新父类型 `delivery-test-attempt` 保存 raw execution、协议观察、计划 / 选择 / 候选和组事实；不冒用旧 fullTest passed 字段。

每个已完成 attempt 另保存当前完整计划的扁平 progress 快照：各组最近已观察状态、直接来源以及未解决失败 / 未执行原因。快照由当前直接进展与本次实际选择 / 回执生成，不采信任意调用者提交的伪造状态；不嵌套前次快照。它支持续测选择、前置核对和 next，不等于候选 verified。候选变化时先按当前批准影响清除受影响 / 未确认组的适用性，沿用组仍须明确依据；最终结论重新核对显式直接来源，不能只看 progress 全绿。

仅在子进程 close、最终报告完整、选择全部有终态、回执 / 退出一致、必要日志和父子终态持久读回、资源安全后，attempt 才是可消费的 known finished。选中必需组存在失败 / 缺口时，目标应非零；目标退出 0 却有失败 / 缺口，或全部选中组成功却存在未说明的非零退出，均标记协议矛盾，attempt 不可用于通过结论。正常非零对应明确组失败可以形成有效的部分事实，但清理或报告完整性未知时不能挑取其内层成功。

记录分别保存执行持久状态及 protocolState（valid / invalid / unconfirmed）。完整可读但已证实矛盾的报告为 invalid，组来源全部不可用于结论；若真实执行 / 清理和持久完成已确认，可以正常结束失败操作并释放本次自有锁，转范围内修复，不把协议错误本身伪装成仍有写者。进程 / 清理 / 保存未确认则为 unconfirmed，继续现有 unknown 现场边界。缺报告或组事实无法核对不能推导通过，只有确认写者结束且安全持久完成时才可将其作为可诊断的协议失败，而非可复用的部分成功。

E6 的内存 observed=passed 不是可消费事实；最终保存失败保持 draft / unknown 及锁，不发布 attempt 完成或候选 verified。延续现有锁归属及失败现场协议，不新增自动重试 / 修复终态。稳定已提交失败可以显式开始新 attempt，未完成写现场必须先按原处置边界处理。

### 4. 继续收集与资源阻断

一个普通组失败不自动终止独立后项，目标按计划标出被依赖阻断的组并继续其余可执行项；任何必需项未满足，最终整轮仍不能通过。实际取消停止本轮，不让 continue-on-failure 吞掉取消。清理 unknown 对共享资源的后项形成阻断；不能可靠限定影响时停止相关执行，未运行项记录理由。

MenDi 不凭旧 resource ID 宣称仍拥有端口、服务或数据，当前前台树之外的进程不自动处理。新的 attempt 不隐式复用旧服务 / 浏览器 / 数据 / 临时构建；前次组通过不等于资源仍可安全用。必需前置事实可来自明确有效的旧组结果，但实际启动所需产物和准备仍由目标核对；资源状态未知不能靠来源 PASS 越过。

### 5. 候选身份、续测与修复影响

candidate 为显式 id 与 basis：复用既有 commit（可选完整提交）、materials、changes 说明。相同 id 不能对应矛盾 basis；产品 / 测试 / 依赖 / 执行配置的材料变化使用新 id，并说明相对来源的影响。仅说明 / 证据整理变化不机械使已测材料失效。这个身份是可审核声明，不是自动扫描源码或签名。

continue 要求当前轮、完整相同计划和候选、原 attempt known finished、选择确为未完成且现在可运行的组；保留原失败，不要求为了跑独立尾项先修复失败组。继续记录不得宣称原失败已解决。

retest 消费当前 Author repair 和固定的独立 Review approved；扩展既有 repair / review 的结构化分支，保存失败来源、当前候选、affectedGroupIds、仍适用组及原因。修复审核核对真实变化、业务断言和公共影响，不只批准 metadata；工具核对 Author / Reviewer 区分、直接对象、范围、候选及影响声明一致。对公共构建 / 权限 / 依赖 / 数据 / 环境变化扩大复验，无法可靠界定时要求必要完整范围。

“当前失败”在组模式指当前 progress / incomplete 结论中尚未解决的直接失败，不要求最新一次 attempt 自身失败。例如中段失败后尾项 continue 已通过，repair 仍可显式固定原中段失败；准入核对其仍属于本轮计划 / 当前未解决问题，既不回退当前指针，也不扫描全部历史寻找失败。

跨候选沿用通过组，必须在当前影响 / 适用性声明中逐组说明，并由必要修复 Review 覆盖；同轮同候选正常续测不额外增加 Reviewer。旧命令模式修复后仍按旧合同新整次执行，不能将 command PASS 或普通 focused 追认为新协议的组来源。计划或必需范围改变是显式重新规划 / 新首次尝试，不能改旧计划删失败；先前有相同组名也不能自动匹配。

### 6. 当前候选验证结论

新增 `delivery verification create --input <项目内声明> --role author --actor <id>`，只验证并保存结论，不执行测试。`delivery verification status --run <ref>` 只读；`delivery full-test status` 分辨旧单次与新 attempt。结构化 run 仍通过 `delivery full-test run --input`，输入 mode / purpose 明确区分 initial / continue / retest。

create 输入提供完整计划、当前候选及每个必需组的一个明确 source attempt / group，不隐式挑历史最大号、最后通过项或递归失败链。核对全部来源均为同项目 / Delivery / round、相同计划、known finished，选中组终态 passed，身份及实际覆盖有效，适用性和必要批准完整；重复 / 缺口 / 冲突均不 verified。来源可以是整体 known failed attempt 中真实通过且清理确认的独立组，其余失败须由新来源解决。全局取消 / 持久化 / 资源未知的未确认来源不能被挑成功项绕过。

新增父类型 `delivery-verification`，结果为 verified / incomplete，保持与原 command outcome 分开。保存当前轮 scope、A 的 baselineFacts、计划、候选、组来源与有限直接快照、适用性和必要批准 / 缺口。create 在现有项目锁内复核直接输入并沿 Run 编号 / 提交原语完成，保存失败保留现场。来源和快照是本次实际读取，不复制整个证据树或建立引用图。

构造结论时读取显式选定 attempt、其子记录 / 最终报告 / 必要日志及当前必要修复审核；只检查这些直接对象。结论保存足够的组完成、原命令 / 协议一致性及批准快照。普通 query / status / Close 消费当前结论与本地直接快照，不再次递归展开其来源历史、失败父链或旧 Review 正文；查询某 attempt 时仍按其自身必要结果 / 日志解释。快照缺失 / 损坏或观察不稳定则结论 unknown，不能回退另一旧 verified。

不是新建汇总专门 Review 阶段；独立性来自实际需要的 Change Apply 审核与修复 / 影响 Review。验证记录只做结构与直接事实核对，不能代替 Owner 或 Reviewer 判断实际覆盖及材料真实性。

### 7. 当前指针、旧读者与 Close

v2 项目 / manifest 沿 A 的轮次模型，新增本轮 testAttemptRunRef / verificationRunRef；current deliveryRunRef 指向实际最新 typed 进展，不借旧 fullTestRunRef 回退。扩展统一投影 / 读回：Reopen 清除新轮当前指针，旧轮保留原 attempt / verification / Close；不向旧 Run 批量补字段。

新类型必须在全部消费端显式识别，未知类型 / 协议版本拒绝；旧消费者不能因额外字段被忽略就将新结论当旧 fullTest passed。新 Close 输入 fullTestRunRef 与 verificationRunRef 恰选其一：前者保持旧单次合同；后者要求当前进展和当前轮 verification 指针一致且结论稳定 verified，保存明确 candidate-verification 类型的 acceptance 快照。缺必要组、批准或材料适用性均不收口。

旧正式 Run、旧 Close 快照及 command 子结果继续读取，不强制补计划、覆盖计数、候选 id 或阶段时间。新协议有清楚 opt-in 与版本，旧结果不升级。历史结果、当前轮适用性和当前候选完整结论在人读 / JSON 中分别展示；普通 focused 或新 attempt 的选中范围通过不能直接使 next 提示 Close。未 verified 时 next 指出当前需要的续测、修复 / Review 或不确定现场，不能由旧 PASS 猜通过。

### 8. 阶段时间、进度与有限优化

目标输出可选增量 events，含 attempt / group、单调持续时间、UTC、阶段、父子关系、排队 / 准备 / 构建 / 启动 / 断言 / 等待 / 清理 / 证据整理。报告文件使用当前 execution 内受管路径；事件不完整不推导通过，必要最终回执仍须完整。各进程时钟基准明确，不能直接相减不同基准的绝对单调值。

MenDi 记录自身准入 / 工具 / 依赖检查、启动到 close、保存 / 读回等包络，目标阶段与包络注明包含关系；墙钟、工作量和可证的关键路径分开，资料不足时显示未测，不生成百分比 / ETA。增量读取按追加位置和实际事件报告，不递归轮询全历史或重复搬运日志。

首轮在受影响入口测量热点；只在同次目标执行、输入 / 配置一致且归属确认时复用只读准备，数据 / 账号 / 浏览器上下文及清理独立。不能并发写同一 dist、拿旧 .tmp 当缓存或放宽业务预算。并发 / 复用是目标的有界选择，本 Change 通过受控目标验证指导及合同，具体 DreMo 热点另行授权，不承诺跨项目提速。

### 9. 实施组织

先整理再扩展：core 分开计划 / 回执、候选来源及兼容解析；adapters 处理受管协议文件与有限输入复核；application 分开 attempt 准入、执行提交、结论构造与查询。复用现有 test-process / test-store、锁与 Run 原语，保留 full-test-admission 的实际职责，不把所有新模式放回 project.ts 或 delivery-full-test.ts 长函数。新模块承担实际责任，不加纯转发层压行数。

## Risks / Trade-offs

- 目标可以错误声明覆盖 → 显式计划 / 最终回执、双通道一致性、独立阶段核对和 E1–E5 反例同时约束；不宣传为自动业务认证。
- 多来源拼接掩盖原失败 → source 明确、完整覆盖、影响批准和 typed 结论；原尝试及日志不可改写。
- 晚期 / 资源 / 保存故障被成功事件掩盖 → 已确认结束、清理和持久化是消费前提，E3 / E6 负例保留。
- 新指针遗漏轮次投影或旧消费者误认 → 全部共享消费者和 Reopen / 历史查询一起更新，未知新类型明确拒绝，旧分支单独回归。
- 性能统计额外成本 / 负载影响 → 覆盖昂贵阶段，单次样本只说明本次；依据可比较数据优化，不加统计平台或硬门槛。

## Migration Plan

1. 仅在隔离 product 目标实现 / 验证新 opt-in 协议与旧模式；根人工历史、真实目标、稳定安装和 DreMo 保持。
2. 保留旧记录解析，增加已识别的新类型 / 明确 selector；验证旧输入不要求新字段，新类型不能走旧 passed 分支。
3. 完成真实组收集、续测、修复审核、部分复验、候选结论及 Close 集成和 E1–E6 负例；独立 Review Apply 后再按授权 Archive。
4. D04 全部出口确定包版本、正式验收、打包 / 稳定切换与目标接线；本 Change 不切换安装或自动改造旧项目。旧模式继续工作，新协议不可用时明确拒绝，不能静默降级执行后冒充结构化通过。
5. 新模式发生故障保留现场，原工具支持的同次本地收口按既有边界处理；本 Change 不提供未知 attempt 自动恢复或发生新工作后的降级 / 历史覆盖。
