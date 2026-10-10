# Tasks

承接 [proposal.md](proposal.md)、[design.md](design.md) 与四份 delta specs。所有勾选表示本 Change 实施进展，不能替代独立 Review Apply 或当前 Change 的实际 Archive；下述原生归档验证只操作受控测试项目。

## 1. 整理当前对象规则与 CLI 职责

- [ ] 1.1 将产品关联 / 批次结构验证及唯一当前对象选择整理到承担真实规则的核心模块，保留入口 / 范围解析；用结构用例验证空 / 单项、旧 archived + 新 active、末项 archived、错活动顺序、多活动、重复 / 倒序 ordinal、未知 Ref 与单 Change / manual 兼容。
- [ ] 1.2 让 currentRun、query / next、Action / 处置、诊断和 Archive 采用相同当前对象，消除 `[0]` / active-or-archived 误选；用现有查询 / 阶段 / 诊断回归及“新项尚无 Run 不回退旧项”用例验证。
- [ ] 1.3 在新增测试命令前分清 CLI dispatch、参数配置与人读输出职责，呈现模块承担实际输出逻辑，不建立纯转发层；用现有 arguments / CLI 用例核对帮助无副作用、JSON 单输出、角色和退出码不变，并在代码旁保留必要职责说明。

## 2. 顺序 bind、批次与必要输入

- [ ] 2.1 在首次 Open 可选关联及后续 bind 校验槽位依赖、身份与未占用；前项完整归档后显式追加下一已有 Change，拒绝活动 / archiving、未完成交接、未归档依赖与陈旧重复关联；通过真实 bind / 独占冲突测试确认拒绝无副作用、范围 / 入口 / 旧 binding 保留。
- [ ] 2.2 后续 bind 加入既有批次并保存 batchId，允许本项无 latestRunRef；首次 Action 复用该批次，不替换 changeBatches / 成员；用跨 Change Run、空占号跳过、重复号拒绝和新进程读回验证全 Delivery 连续编号。
- [ ] 2.3 workspace 仅读取当前必要 Run / Archive 交接，旧关联保留身份 / 路径 / 编号结构检查；覆盖旧 Run / 归档内容 / 说明失效、未知 Ref、必要当前输入缺失 / 坏头部、错身份与链接越界，验证当前失败不回退历史。
- [ ] 2.4 更新 README 中 bind、无新 Run / 归档后查询与批次示例；按受控项目执行文档命令并核对 next 不自动激活、批准或分配 Run，manual-bootstrap 仍不能被产品写命令迁移。

## 3. 两次 Archive 与有限收口

- [ ] 3.1 将 Archive 当前检查、native 执行返回和 commit / readback 定向到所选 binding，仅更新本项；通过第二项真实 Archive 和旧 binding / Run 字节比较验证累计编号到 2、旧项保持、当前终态正确。
- [ ] 3.2 对第二项覆盖计数、终态 Run 或 manifest 部分提交与新进程 local-only finish，当前基准 / 新值仍严格检查；通过故障注入验证 pending、旧 ordinal 小于总数仍合法、只增长一次与终态 Run 不改写。
- [ ] 3.3 覆盖当前第二 Archive repeated finish 幂等与旧 Archive execute / finish 陈旧拒绝；回归 none / prepared 重试、实际日期、retire capability、输入改变、锁冲突与受管路径，验证不重复原生效果、不放宽必要证据。
- [ ] 3.4 更新 README 的多次归档 / 当前必要输入 / finish 边界示例；结合本组原生测试核对规范日期编号、旧归档文件不成为当前操作前置，以及当前 Archive Run 缺失仍拒绝。

## 4. 目标脚本与本地测试入口

- [ ] 4.1 实现 package scripts 读取、三类默认名称与可选 mendi.tests 最小映射、直接 script 名规则；通过默认 / 覆盖 / 缺失 / 空值 / 错类型 / 非法名称 / 越界 / 未知扩展用例验证，只检查实际选定项，不猜测或改写目标配置。
- [ ] 4.2 实现 Windows / Node 22、既有 pnpm JS 入口与真实版本 / packageManager 预检，禁用 Corepack 自动下载；用真实已安装入口及受控错版本 / 缺入口 / 启动错误验证未运行反馈、无安装、无备用工具切换。
- [ ] 4.3 接入 test list 及 test run / status 参数配置，使用本地明确目标与 local-only 输出、不接受 openspec-bin；用 CLI 测试验证不同调用目录、帮助、缺参 / 重复 / 不支持参数、无需 Open 的 list、缺本地配置及不支持 product 状态拒绝。
- [ ] 4.4 更新 README 的映射、平台 / 工具支持范围与三条命令示例；在受控配置验证列出的实际 script / cwd，记录参数可用性，明确 package 未自动修改、full 命令不是正式验收。

## 5. 持锁与执行结果存储

- [ ] 5.1 从同步 workspace 写入中提取实际 acquire / owner-token release 逻辑，测试执行者显式持锁跨 await；先回归已有 Open / bind / Run / Archive 的冲突、写失败和锁保留，再验证异步等待时第二写者拒绝、锁未提前释放。
- [ ] 5.2 实现 Delivery 下 tests/NNN-kind 独占占号和 result / 固定日志存储协议，记录 prepared / not-run，再在 spawn 前持久保存 running / unknown 意图；用占号、重复 ID、错身份、目录 / junction 越界和意图写失败验证不启动测试、不影响 Run / 归档编号。
- [ ] 5.3 实现结果替换读回、日志完成与终态不可变；通过日志、终态 rename、读回和锁释放故障验证 unknown / 非零及真实现场保留；正常 failed / interrupted 终态释放自身锁，再次执行保留前次字节。
- [ ] 5.4 实现指定 execution 的只读 test status；覆盖完整结果新进程读取、running 意图 / pid 失踪、持锁 / 读中变化、缺日志 / 损坏、原工具和 script 不可用，验证不写文件、不重跑、不 kill、不放宽普通 query 锁边界。
- [ ] 5.5 更新 README 的执行目录、字段解释与故障读取示例；对照本组输出说明 observed 与完整成功、未运行 / 未知、旧 pid 仅为说明，确认不新增历史依赖、hash 清单或自动锁处置。

## 6. 真实前台执行与取消

- [ ] 6.1 实现以 Node + 明确 pnpm 入口 / 参数数组启动选定脚本，目标 cwd 与实时 stdout / stderr 日志完整保存；用真实受控脚本验证 focused exit 0、fast 非零、普通 full exit 0及成功锁释放，核对 JSON 不混入子进程输出。
- [ ] 6.2 在本次前台执行中接入调用者取消，只停止实际持有的 Windows 子进程树，保存实际停止返回及 close；用受控等待程序和后代实际核对停止 / interrupted，覆盖无法确认的 unknown，不依赖日志 sentinel 认证结果、不使用旧 pid 或其他项目进程。
- [ ] 6.3 覆盖真实 spawn failure、异常信号 / 退出未知、意图后中断、日志保存失败与新进程恢复读回；通过受控故障测试确认所有这些状态不产生 passed、不自动重试，夹具自身停止后必要现场保留，测试不遗留活跃受控进程。
- [ ] 6.4 验证再次显式执行创建新结果，passed / failed / interrupted 不修改 Run / next / binding / verdict / 项目计数；用目标材料字节比较及实际 status / next 读回，并更新 README 的结果 / 取消边界与非正式 full 示例。

## 7. 跨能力集成与交接

- [ ] 7.1 在新建受控项目使用原生 OpenSpec scaffold 和真实产品接口完成首项 Archive → 第二项 bind → 无 Run 查询 → 第二项阶段 Run / 新进程查询 → 第二次实际 Archive；验证同批次、Run 连续、计数 2、旧项保持以及末项 archived 查询，不以 fixture-only 选择投影替代验收。
- [ ] 7.2 结合上述流程，在无活动项和普通阶段分别执行 / 查询真实测试结果；验证 full 成功仍为 command scope、普通 query 不依赖旧测试日志、没有正式 Full Test / Close / 自动下一 Change，manual-bootstrap 原样兼容。
- [ ] 7.3 执行 pnpm check、pnpm test 的当前实现回归及固定 OpenSpec 当前 Change strict validate，覆盖受影响 Action / Apply / Archive / 查询与新执行场景；摘要记录命令、实际结果和限制，失败只修具体问题，不重做无关历史或正式 Delivery Full Test。
- [ ] 7.4 在 Apply 摘要列出 src / tests / scripts 各自物理行数前三名、可靠增长基准与职责整理结论，直接引用本次必要证据并保留旧 Run / verdict；核对新 Author 交接仅指向独立 Review Apply，不自签、不激活下一 Change。

## Workflow follow-up

- 独立 Review Propose approved 后，Owner 后续明确 Apply；本次 Propose 不实施上述任务。
- Apply 完成后由独立 Reviewer 核对变化与验收；批准后按 Owner 后续 Archive 指令执行当前 Change 的实际归档。
- checkpoint / push / PR / merge、正式 Delivery Full Test、Close / Reopen 与下一 Change 激活分别遵守后续授权，不作为本 Change 的勾选任务或自动跟进。
