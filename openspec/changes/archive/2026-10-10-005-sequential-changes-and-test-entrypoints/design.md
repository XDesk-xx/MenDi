# Design

## Context

动机与范围见 [proposal.md](proposal.md)。[003 Review Explore](../../../.mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/003-review-explore/run.md) 已独立重放四组 proof 并批准探索依据；这些 proof 隔离了现状限制，未证明产品支持第二次归档或持久测试恢复。本设计把审核要求收敛为可实施协议，验收以真实产品接口完成。

现有 product version 1 只接受一个 binding / batch；`currentRun` 的 active-or-archived 查找、query / Archive 的 `[0]`、workspace 对每个 archived Run 的读取和计数相等约束，以及 Archive 批量更新 binding，都需按同一规则修正。`createRun` 无 batchId 时替换批次数组，第二关联必须先加入已有批次。现有 Run 占号扫描和当前 binding 更新过滤可复用。

`inspectProject` 已提供本地规范根 / YAML 检查，`lockedWrite` 负责同步独占写入，阶段记录仍由 Author / Reviewer 显式完成。测试工具是当前 Action 内按需使用的执行能力，不新增阶段类型；正式 Delivery Full Test 由 D02-B 组织。

## Goals / Non-Goals

**Goals:**

- 用同一个当前对象规则贯穿 admission、关联、查询、阶段写入、Archive 和读回，当前必要输入不被历史链替代。
- 以既有脚本、显式工具入口和少量持久文件提供三类测试执行；进程退出事实和协作批准分开。
- 先整理本轮要扩展的混杂职责，保留现有写入 / 诊断约束，不形成另一套通用框架。

**Non-Goals:**

- 不实现 product 多 Delivery、Close / Reopen、正式 Full Test Action / 失败修复审核闭环或生产部署。
- 不迁移人工记录，不重写 Explore、旧 verdict、Run 或历史主规格；不扩展旧 C / D proof。
- 不支持其他平台 / 包管理器、后台脱离进程、跨进程自动取消、调度 / 缓存 / 通用预算、引用注册中心或 hash gate。

## Decisions

### 1. 显式追加顺序作为关联协议

product bindings 保留追加顺序，最多最后一项为非 archived；activeChangeId 必须指向该项。无活动项时全部 archived，当前对象为最后项；空数组没有当前对象。旧 ordinal 唯一递增、不大于项目总数；当前 archiving 的基准 / 新值由其直接 Archive Run 检查。阶段类型、actor / role 和固定 Author 校验保持。

把关联、批次结构和当前选择的实际规则集中到小型核心模块；`records.ts` 继续负责入口 / 范围格式接入，不继续混合增加整个测试模型。选择函数消费已验证结构，不读文件、不倒查历史、不给出批准。读取当前 Run、query / next、Archive 和诊断均采用同一结果，不保留 `[0]` 或 active-or-archived 分叉。

bind 在现有项目锁中重新检查 open、无活动项、当前末项完整归档、槽位 / Change 未占用和槽位依赖已有 archived binding，再检查选定上游的真实已有 Change。旧依赖只消费 binding 的已归档声明 / 一致结构，当前归档交接读取其必要终态；不递归读取所有旧批准。追加新 binding 为 Explore，并清空本项 Run；初次 Open 的可选关联同样检查槽位依赖。CLI 不认证 Owner 身份，实际激活授权继续由 Owner 原始范围保证。

沿用追加顺序可以避免多余的 currentBindingRef 与同步冲突；按最大 Run 推断对象会误用孤立占号；排序或扫描旧头部会把查询变成恢复，因此不用这些替代方案。

### 2. 在 bind 时加入已有批次，首次 Run 才建立新批次

当前 open 周期保留零或一个 Changes 批次。首次关联尚无 Run 时不建立批次；首次 Explore 根据全 Delivery 下一号创建批次，批次不另占号。前项已有批次时，第二次 bind 保留其 id / firstRun / runsRef，向 changeIds 追加新项并给新 binding 同一 batchId，即使它尚无 latestRunRef。

`createRun` 使用已加入的 batchId；修改批次成员时只定向更新，不能替换旧数组。对所有成员 / binding / Run 位置检查规范身份与安全结构，不要求无关旧文件存在。保留 `scanRunNumbers` 的全 Delivery 扫描、重复号拒绝和空占号跳过。Reopen 新批次留给 D02-C，当前不预建额外批次或另加 Run 索引。

### 3. 当前必要读取与第二次 Archive 收口

| 操作 / 状态 | 实际必要进展输入 |
| --- | --- |
| 新活动项尚无 Run | 当前 binding、真实活动目录 / status；不读前项 Run |
| 普通活动项 | 当前 Run；Review continue / submit 等按操作另读固定 Author / 方法 |
| 当前 archiving | 当前 typed Archive Run、操作实际需要的 attempt / 输入；不调用已移走源的 status |
| 无活动项、最近 archived | 最后 binding 的终态 Archive Run、ordinal 与项目总计数；不读更旧项文件 |
| bind 下一项 | 当前最近归档交接及范围 / 依赖结构、目标真实已有 Change |

未选中的旧 binding 保留规范 Change / 槽位 / 编号 / batch / Run 定位校验；不存在性不作为输入错误，也不递归读取说明 Ref。实际读取 / 写入仍经过受管路径和链接越界检查，未知扩展不产生依赖。

Archive 保持 prepare → 显式 execute / local-only finish 的原协议。第二次操作只定向更改当前 binding，累计 countBasis / ordinal 为当前项目值 / 下一值；旧项、计数以外的入口字段、旧终态正文和 verdict 保持。计数或终态先写而 manifest 未收口时，只对当前 Archive 判断 pending，旧 ordinal 小于新总数不会阻塞。当前第二 Archive 重复 finish 仍幂等；下一项已成当前后，请求旧 execute / finish 属于陈旧对象，拒绝。

不通过移除当前 Archive 校验实现多 Change，也不将完整 finish 扩展成历史修复。二次归档、none 重试、部分提交和 retire capability 的回归都使用已有真实协议。

### 4. 最小脚本映射与明确的工具入口

目标 `package.json` 的 scripts 是唯一命令来源，默认映射三个 `test:<kind>`。可选映射仅覆盖名称，例如：

```json
{ "mendi": { "tests": { "focused": "test:unit", "fast": "test:smoke", "full": "test" } } }
```

未声明的集合仍使用默认。直接 script 名以字母数字开头，只含字母数字、冒号、下划线、连字符，不能是参数、正则集合或任意命令文本；对应 scripts 值必须非空。未知映射扩展不被解释为路径。list 展示三项实际 script / 文本及不可用原因；run 仅检查选定项，不能用另一个集合兜底。package 本身损坏或不安全则失败。

首版接口：

```text
mendi test list --project <根> [--json]
mendi test run --project <根> --kind <focused|fast|full> --actor <标识> --pnpm-bin <现有绝对 JS 入口> [--json]
mendi test status --project <根> --execution <NNN-kind> [--json]
```

这些入口不接受 `--openspec-bin`，使用本地 `inspectProject`，明确 local-only / openspec:null / upstreamAccess:not-required。list 无需已 Open；run 必须有合法 open product Delivery、无 archiving 或写入冲突，可在没有活动项时执行；status 只读指定当前 Delivery 下的执行记录，不依赖原 pnpm 仍可用、当前 package script 仍相同或当前 Run 的正文。

run 仅支持 Windows、Node 22 与 pnpm 11.22.0；若 packageManager 存在，必须匹配 pnpm 11.22.0（允许现有完整性后缀，不新增校验清单）。调用者显式传入已安装 pnpm JS 入口，先执行真实 `--version`；允许既有 Corepack shim，但设置 `COREPACK_ENABLE_NETWORK=0`，缺缓存或版本冲突就失败。该开关仅控制 Corepack，不能禁止 pnpm 自身的运行前安装。pnpm 11.22.0 默认 `verifyDepsBeforeRun=install`，因此两次后续调用都由 MenDi 显式覆盖子进程环境中的该策略，不沿用目标或调用者的 install / prompt 设置，不改写目标配置。

在项目锁内复核工具 / 选定 script 后，先以当前 Node、目标 cwd 和参数数组 `[pnpmEntry, 'run']` 做**不传 script 名**的依赖预检，强制 `pnpm_config_verify_deps_before_run=error`。固定版本会先检查依赖，再列出命令而不执行任何 script；缺失 / 不同步或检查无法完成时，预检非零，返回 not-run、executionId=null、实际命令 / 输出与原因，释放正常持有的自身锁，不建立测试执行目录或启动选定脚本。即使真实版本预检已经成功，也不能把此非零当作测试 failed。

预检 exit 0 后，按 Decision 6 保存执行意图，再以 `[pnpmEntry, 'run', scriptName]` 启动选定命令；这次强制 `pnpm_config_verify_deps_before_run=warn`，仍关闭 Corepack 网络，shell=false。warn 不进入 install / prompt 分支；即使依赖在两次调用之间被外部修改，执行调用也不能自行安装。此时实际脚本行为决定结果，不宣称依赖始终同步：脚本因变动而实际失败仍是 failed。两次环境分别从调用者环境复制并覆盖，不原地修改宿主环境；Windows 同名大小写键须归一，不能残留另一个 install 值。命令 / cwd、两次不同策略及依赖预检摘要如实展示。没有依据识别的启动 / 退出仍按 unknown 处理，不解析一条错误文本或脚本自报 sentinel 判定结果。

采用公开 CLI 的无 script 预检，把“依赖拒绝”和“选定命令执行”分成可直接观察的调用，避免在混合脚本日志中猜测错误来源；不读取 pnpm 内部模块、不增加 reporter 协议、目标 wrapper 或通用包管理器适配。不自动运行 install 或初始化，不修改目标 package、pnpm 配置、依赖目录或锁文件；用户显式选定脚本自身的安装 / 写入行为按该脚本执行，不将它误报为 MenDi 自动安装。原始局部验证见 006 Run；旧 002 / 003 无依赖夹具不能认证这条保证。

固定宿主的 `C:/nvm4w/...` 只属于 Explore proof，不写入产品默认；自动探测 PATH、生成任意 exec 命令或引入通用包管理器适配会扩大首版范围，因此采用明确参数。

### 5. Delivery 下的小型执行记录，独立于阶段 Run

结果存于 `.mendi/delivery-groups/<delivery-id>/tests/001-focused/`，内有 `result.json`、`stdout.log`、`stderr.log`。本 Delivery 的执行目录序号独立递增、至少三位，空占号保留；重复编号拒绝。没有 latestTestRef、全库 hash 或历史日志扫描。`test status` 要求明确 execution ID，后续 Full Test 可消费明确结果入口，不依赖隐含“最后一次通过”。

result 使用 formatVersion=1，包含执行 ID / kind、规范 projectRoot / cwd、Delivery ID、可空 Change 快照、actorId、入口 / 参数、选定 script 文本快照、开始 / 完成时间、executionState、outcome、exitCode / signal、可空本次子进程 pid、必要日志定位及中断原因；另保存本次 dependencyCheck 的命令、error 策略与真实 exit 0 摘要，以及执行调用的 warn 策略，不复制预检的整份脚本列表。字段表达实际发生的执行事实；`scope:command`、`formalDeliveryTest:false` 明示集合名称不构成验收。快照 Change 不要求永远活动，也不读它的历史文件；记录身份与受管定位仍校验。

终态结果不可重写；再次显式执行占新目录。结果不会进入普通 status / next 的读取链，不改变 Run 计数、archiveOrdinal、当前 binding、next 或 verdict。日志原始内容保存一次，结果只给定位和摘要。

放在阶段 Run 内会使正式验收依赖仍活动的 Change，或向完成 Run 添加新的生命周期含义；一项检查一个阶段 Run 会混淆正常工具工作与交接。因此采用 Delivery 内的执行目录。

### 6. 同一锁内的前台执行与真实结果

现有 `lockedWrite` 是同步回调，不能把 Promise 直接传入。先提取已有锁的真实 acquire / token / owner-release 职责，现有同步写路径沿用相同协议；测试执行者显式持有同一个项目锁，await 子进程和日志完成后才保存 / 读回 / 释放。已写路径与保留失败现场规则共用，不新增通用异步事务层。

运行前工具预检并在锁内复核选定 script / 工具输入，完成 Decision 4 的无 script 依赖预检后，才独占建立目录与 prepared / not-run，随后**在选定命令 spawn 前**保存 running / unknown 意图；只有意图完整读回才启动测试，启动后记录本次执行 child pid，不把版本 / 依赖预检进程当成测试已启动。日志直接写入固定文件，每个 chunk 按 writeSync 实际返回的字节数续写直到完成；返回零进展或抛错走 unknown / 保留现场，结束事件不能代替日志完成；日志完成、终态替换读回及自身锁释放全部成功后，run 才返回完整通过。

| 事实 | 记录与命令结果 |
| --- | --- |
| 入口 / 环境预检不满足，尚未分配执行 | not-run 错误、executionId=null，exit 1；无测试子进程 |
| 无 script 依赖预检非零，即使版本预检已成功 | not-run、executionId=null，exit 1；返回实际预检退出码 / 原因，不启动选定命令，不安装依赖或改锁文件 |
| prepared 阶段，或明确 spawn error 无子进程 | not-run；后者在已占号结果保存原因，exit 1 |
| running 意图或不确定退出 / 保存 | unknown；不根据 pid 失踪猜结果，不发布 passed |
| 正常结束、退出 0且保存完整 | finished / passed，exit 0 |
| 正常结束、退出非零且保存完整 | finished / failed，exit 1，保留真实退出码 |
| 本次支持范围的中断确认 | finished / interrupted，exit 1，保留实际退出及停止依据 |

已完成 failed / interrupted 是有效终态，写入成功后正常释放自身锁；不能仅因为行为失败就当成持久化失败保留锁。实际写入、读回、锁释放或停止不确定，则保留锁 / 已写目录并返回非零。终态文件可能已经落盘的失败不得回滚或修改它，输出区分观察到的字段与未完整确认的命令成功。

持锁期间普通 query / writer 继续遵守原锁错误；显式 test status 作为只读执行观察，仅解析项目 / manifest 的身份与指定结果、日志、锁及前后变化，不借此开放普通 query 的 ignore-lock。存在锁 / 变化 / 必要输入损坏时有效结论为 unknown，输出观察和非零；无锁、前后稳定且结果已知的完整终态才使 status 成功，其 outcome 可以 failed / interrupted / not-run。stable 只说明文件观察稳定；finished / unknown 即使原锁已由人工处置，仍输出原记录、ok:false 并非零退出，不将记录可读解释为执行已确认。status 不写结果、不解除锁、不认证旧 pid。

### 7. 首版取消的有限边界

前台 run 收到 SIGINT / 调用者取消时，只对本进程实际启动且仍持有的 child 进行 Windows `taskkill /PID <本次 pid> /T /F`；记录实际停止返回与 child close。只有支持的前台进程树停止可确认才归 interrupted，否则 unknown / 失败现场保留。不从磁盘旧 pid 发起 kill，没有跨进程 stop / 自动重跑 / 自动回收。脱离前台树的后台进程不在本次认证范围，文档明确这一支持边界。

生产执行不设置 Explore 的 20 秒 watchdog；按用户显式取消处理。测试夹具自己的等待 / 超时用于防止回归挂起，须真实验证根子进程及受控后代停止，不靠一条输出文字认证通过。启动、非零、异常信号、保存失败和重启后的 running 意图分别覆盖。

### 8. 实施职责与验收组织

先整理本轮继续扩展的核心关联 / 批次解析和 CLI dispatch / 人读输出；输出模块承担实际呈现，关联模块承担真实验证，不是仅换路径的转发层。Archive 应用保留有限编排，使用统一当前对象及现有效果 / commit adapters；无需因旧文件长而重写未继续扩展的 proof。

测试入口解析、结果协议 / 存储、前台进程及测试应用编排按真实职责放置，使用现有 Node APIs。锁提取覆盖已有同步路径，CLI 接入异步执行后核对 JSON 单输出、失败 exit 和帮助不访问项目。继续维护 TypeScript 三配置检查，Apply / Review Apply 报告三个目录各自前三物理行数及可靠增长依据，不制造硬门槛或新台账。

验收分三组：真实关联 / 当前选择 / 同批次编号；两次真实 Archive 与第二项的有限恢复 / 幂等；真实 test 执行 / 取消 / 保存 / 新进程读回。重点管线用原生 OpenSpec scaffold 和真实产品接口，夹具批准仍仅用于可控阶段前置，不把它宣称为真人认证。旧 proof 结论可引用，但不能替代新产品场景。

## Risks / Trade-offs

- [只放宽数组导致下游错误] → admission、当前选择、批次、Action、Archive 和读回一起改，完整跑到第二次实际 Archive。
- [异步子进程使现有同步锁提前释放] → 提取锁持有职责并验证执行期间另一写者被拒绝，完成 / 失败释放规则分别覆盖。
- [归档计数或终态部分提交] → 保留当前基准 / 新值、已提交 Run 不可变和 local-only finish，只定向收口第二项。
- [启动 / 停止 / 保存中断不能知道实际结果] → spawn 前保存意图，日志完成后才提交；未知不通过，记录可读不代替已完成。
- [长期测试阻塞其他写者和普通 query] → 首版明确前台串行执行，显式 test status 可只读观察；不新增调度器、抢锁或后台运行。
- [平台和工具支持有限] → 文档声明 Windows / Node 22 / pnpm 11.22.0 / 前台树范围，缺工具失败；Corepack 网络禁用与 pnpm error / warn 两段策略分别验证，目标 install 配置不能恢复自动安装；扩展平台另列范围。

## Migration Plan

只增加 version 1 product 的顺序多 Change 解释和新的执行记录；保持单 Change 行为回归，无历史批量转换。MenDi 自身人工 D02 仍通过 Run / manifest 交接，不调用产品写命令迁移。正式审过的旧 Run 与主规格在本轮保持。

Apply 完成后新增记录只能由支持该格式的版本解释；回退旧产品不能声称新多 Change / test 记录已被验证，不自动删除或降格记录。发布、归档、Git 与部署须各自后续授权，本次设计不执行迁移或上线。
