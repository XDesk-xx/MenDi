# Design

## Context

动机与范围见 [proposal.md](proposal.md)，行为见两份 delta specs。初始 `src/drivers/cli.ts` 仅打印说明；工程基于严格 TypeScript、Node 22.23.2、pnpm 11.22.0。009 实施了产品，011 修订已获 012 批准；本轮 013 按 Owner 范围修订记录 / 查询兼容及工程检查，仍停在独立 Review Apply。

Run 003 的 Explore 和独立 Reviewer Run 004 已验证固定 OpenSpec、两文件最小存储、祖先根风险及配置优先级。P07 表明本地 planning 结构可使上游 `list` 成功，即使配置声明 store 或 YAML 损坏。Run 005 将实验迁移为 `.ts`，类型检查及新重放 8/8 通过，后由 007 独立补审批准。实验借用上游安装中的 YAML 仅为 proof 接线，不能成为产品依赖方式。

## Goals / Non-Goals

**Goals:** 用少量明确命令实现目标检查、首次 Open、首个 Change 关联和只读查询；保存可诊断的持久状态，使后续 Action / Run 能在相同目录布局上扩展。

**Non-Goals:** 不在本 Change 实现 Action / Run writer、阶段执行、Reviewer 验证、第二个 Change 切换、更多 Delivery 或 Close / Reopen；不实现自动初始化、store 管理、通用事务恢复或插件平台。调用者仍依 AGENTS 和 Owner 原始指令控制授权，CLI 成功不产生授权或批准。

## Decisions

### 1. CLI 与路径基准

沿用现有 `src/core`、`application`、`adapters`、`drivers` 目录，只增加实际需要的模块；不引入 DI 框架或通用命令注册系统。Node 参数解析后调用 application 操作，由适配器处理文件和进程。

| 命令 | 必要参数与行为 |
|---|---|
| `mendi delivery open` | `--project <path> --id <delivery-id> --title <text> --scope <json-path>`；可选成对 `--change <change-id> --slot <planning-slot>` |
| `mendi change bind` | `--project <path> --change <change-id> --slot <planning-slot>`；仅绑定产品 Open 后的首个 Change |
| `mendi status` | `--project <path>`；完整的简短状态 |
| `mendi next` | `--project <path>`；使用同一查询结果，聚焦下一步及其来源 |
| `mendi --help` | 不访问文件或外部工具 |

项目命令可附 `--openspec-bin <absolute-path>` 和 `--json`。缺省入口是本项目选定的 `D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js`；显式替代入口仍必须是稳定安装的 1.14.1，并在结果中显示。相对 `--project` 相对于调用目录解析；相对 `--scope` 相对于规范目标根解析，帮助明确此基准。上游始终以规范目标根为 cwd。避免将调用目录当作隐含目标。

所有参数组合、重复或未知参数在写前拒绝。ID 和 Change ID 采用小写字母、数字、连字符组成的安全单段名称，不允许斜杠、反斜杠、`.`、`..` 或绝对路径。计划槽位是唯一字符串键，不作为文件路径使用。

成功退出 0；参数用法错误退出 2；目标、上游、状态或写入失败退出 1。`--json` 的 stdout 只写一个 JSON 文档，不混入上游日志。成功为 `{ok:true, projectRoot, openspec:{entry,version,root}, ...data}`；失败为 `{ok:false,error:{code,message,details,fix}}`。人读成功写 stdout，人读失败写 stderr；必要命令信息与实际 stdout / stderr 放在错误 details。

### 2. 公开 CLI 适配器与配置检查

使用 Node `spawnSync(process.execPath, [entry, ...args], {cwd, encoding:'utf8', windowsHide:true, timeout:30000})`；不拼 shell 命令。先检查入口和版本，再调用 `list --json`；有关联时调用 `status --change <id> --json`。适配器对 JSON 先作为 `unknown` 解析，再按命令校验必要字段：root 的 path / source、changes 的名称、status 的 schemaName / actionContext.mode / artifacts 等。超时、信号、buffer / 启动错误、非零退出与坏 JSON 都保留原因，不能用默认空数组替代失败。

本地配置选择 `config.yaml` 优先，仅不存在才选 `config.yml`。直接依赖 `yaml@2.9.1` 的公开 `parse` API，解析后要求映射，拒绝任何 `store` 键，schema 缺省或为 `spec-driven`。检查顺序先本地配置再上游 root；后者须 source=`nearest` 且 realpath 等于目标。有关联时还须 mode=`repo-local`、schemaName=`spec-driven`。context / rules / guidance 原样留在目标，由上游 instructions 读取；本阶段不另做复制或转存。

选择直接 YAML 依赖是因为已有安装实际为 2.9.1，且 [官方 API](https://eemeli.org/yaml/) 提供公开解析入口。Apply 时安装并锁定；当前 Propose 不安装。手工识别 `store:` 文本会漏掉 YAML 等价表达，上游内部依赖路径又不构成稳定合同，因此不采用这两种方式。

### 3. 范围输入与持久格式

范围文件只读 JSON：`{goal: string, plannedChanges: [{slot, title, dependsOn: string[], roadmapSection?: string}]}`。要求非空目标、至少一个唯一槽位、有效标题，依赖全部指向本文件中的其他槽位且无环。该文件是写入源；成功后完整必要范围存在 manifest，不依赖原输入继续查询。具体产品总规划仍只有根路线图，manifest 是本次 Delivery 已选范围的快照。

产品记录增加 `formatVersion:1`、`recordingMode:'product'`，使用当前已经确认的目录：

| 文件 | 字段 |
|---|---|
| `.mendi/project.json` | `formatVersion`、`recordingMode`、`name`（目标目录名）、`deliveryGroupsDir`、`activeDeliveryId`、`deliveries:[{id,manifestRef}]` |
| `.mendi/delivery-groups/<id>/manifest.json` | `formatVersion`、`recordingMode`、`id`、`title`、`state:'open'`、`openedOn`、`goal`、`plannedChanges`、`changeBindings`、`activeChangeId`、`changeBatches:[]` |
| 初始 Change binding | `planningSlot`、`changeId`、`changeRef:'openspec/changes/<id>'`、`state:'explore'` |

`openedOn` 取执行机器的本地日期，标识由调用者明确传入，不在 D01-A 自动分配 Delivery ID。项目入口与 manifest 的 ID、当前关联、槽位和引用必须一致；非法版本、坏 JSON、多个当前关联或缺 manifest 都报告状态错误。

D01-A 不写 `openRunRef`、`latestRunRef` 或虚构 Action；`changeBatches` 保持为空，直到 D01-B 实际执行首个 Run。后续继续使用 `NNN-changes/<change-id>/<NNN>-<operation>/`，批次复用首个实际 Run 号，不额外占号。此处明确留白，不预创建 Run 目录。

操作使用的受管路径须为约定的项目相对路径。读取或写入前核对绝对解析结果与现有父目录 realpath 留在目标内，拒绝外部 junction / symlink、越界路径或指向其他身份的文件。显式 scope 文件可从用户给定位置只读导入。不得递归按字段名 `*Ref` 推导文件依赖；不建立引用注册中心或依赖图。

| 操作 | 真正读取的必要输入与路径 |
|---|---|
| 所有项目命令 | 显式目标、本地配置、选定工具入口及真实 root |
| 首次 Open | scope JSON；可选已有 Change 的活动路径与上游 status；写路径仍按独占目录 / 锁规则 |
| bind | 项目入口、当前 Delivery manifest、指定已有 Change 的活动路径和 status；锁内重新读回 |
| status / next | 项目入口、当前 manifest；仅当前活动 binding 的活动路径和上游 status |

索引仍校验 Delivery / manifestRef 身份；binding 的 changeRef 校验身份、位置与受管路径安全。历史 Delivery 的 manifest 不必全部存在。历史 Run、旧方案、roadmap 链接、批次目录及未知扩展字段只保留 / 展示，不解析为读取输入，也不因缺失阻断查询。

### 4. 首次 Open、关联和已有状态

首次 Open 只支持目标尚无 `.mendi/` 的情况；任何已有状态一律拒绝，错误指出记录或残留位置。这样保持 Explore 已证明的冲突行为，并避免尚无 Close 能力时推导如何开第二个 Delivery。后续多 Delivery 在 D02 的实际需要中扩展，而不是提前修改当前历史。

可在 Open 时关联已有 Change；如果不传，manifest 保存空关联。之后 `change bind` 只接受产品格式、open 状态、无当前 Change且无既有关联的记录，并验证计划槽位、上游 list / status 后更新 manifest；同一 Change 的重复 bind 也作为冲突拒绝，不用“幂等成功”掩盖阶段变化。只关联已有 Change，不调用 `new change` 或生成规划产物。

当前 `manual-bootstrap` 项目入口和 manifest 用一个明确的只读分支解析：要求当前必要 ID / 范围 / 关联结构有效；展示原有 `next`、`latestRunRef`、审核引用和 `openCheckpoint` 等交接信息，标记 `source:'manual-bootstrap'`。不重写未知历史字段，不读取历史 Markdown 代签 verdict。其他未版本化数据拒绝；产品 bind 对人工记录返回 `manual-state-read-only`。

人工归档交接将 binding 设为 `state:'archived'`，changeRef 指向 `openspec/changes/archive/YYYY-MM-DD-<changeId>`，并清空该 Change 的 `activeChangeId`。Owner 归档命名采用项目累计完成 ID：新 binding 可显式提供正整数 archiveOrdinal，路径为 `openspec/changes/archive/YYYY-MM-DD-NNN-<changeId>`，NNN 补足至少三位；原无编号记录仍只读兼容。归档路径须与 Change ID、日期和显式编号一致；archived binding 不能仍是活动 Change。非 archived binding 保持活动目录布局；产品 version 1 写入范围不扩展到 archived。只读查询保存这个本地事实，不探测 / 补建活动目录，也不调用 archived Change 的上游 status。若没有活动 Change，`upstream:null`；人工 next 原样展示且 executable=false。

归档引用用于定位已记录材料，但查询不读取该目录的内容，也不要求其存在来展示本地交接；不声称验证了归档效果或批准。归档字段不完整 / 身份不符则报错，绝不因活动目录消失自动推断 archived。Archive 的真实执行及记录写入仍由以后单独授权的流程处理。

这种显式只读兼容使当前项目能够使用新查询，而不会通过自动迁移丢失批准、Run 或 checkpoint 信息。实验存储格式不等于当前人工 bootstrap；测试只对规定格式认定兼容。

### 5. 最小写入一致性

所有业务和上游检查完成后才写入。首次 Open 用不带 `recursive` 的 `mkdir(.mendi)` 取得首次创建权；目录已存在的竞争调用失败。创建 `.mendi/write.lock`（`wx`），保存本次操作与进程信息。bind 使用同一独占锁；取得锁后重新读回并核对前置，避免两次 preflight 都通过后覆盖。锁是并发写拒绝机制，不是授权记录。

首次 Open 先创建 group 并写 manifest，再在 `.mendi/` 同目录写临时 project 文件并 rename 为 `project.json`，项目入口是最后的可读提交点。bind 在 group 同目录 `wx` 写临时 manifest，再 rename 替换正式文件；绝不通过先删正式文件来完成替换。Windows 替换失败时报告并保留旧文件及必要现场。每次操作只清理自己确认拥有的锁，不删除别人的锁或整个目录。

成功前读回正式记录，释放自有锁后才输出成功。读回或锁释放失败也报告真实结果；若正式文件已经提交，错误 details 标明已提交路径，而不是承诺全部回滚。普通失败可释放自身锁，留下不完整数据与临时文件供诊断；进程中断可留下锁。查询遇到锁返回 `write-in-progress-or-interrupted`，缺 project / manifest 返回 `incomplete-mendi-state`；后续 Open 拒绝已有目录，bind 拒绝残留锁。

此设计防止并发覆盖与截断写入，但两个文件不是一个原子事务，也不承诺断电耐久性。无自动锁抢占、事务日志或通用恢复命令；错误列明路径与人工核对建议。已有合法 project 的 bind 失败仍可在锁释放后读到旧关联；残留锁须由另行明确的检查处理。

### 6. status / next 的来源

两命令共享 query 服务，仅改变展示重点，不写文件。返回最小本地状态及相关上游事实：

| 本地事实 | 下一步 |
|---|---|
| 有效目标，无 `.mendi/` | `delivery-open`，说明需明确范围和授权 |
| 产品 open，无 Change | `change-bind`，说明先选择已有 Change 与槽位 |
| 产品关联初始 Explore | `explore`，`source:'local-state'`、`executable:false`，说明阶段 Action 将在后续 Change 实现 |
| 人工 bootstrap | 原记录 action / status / role 及引用，`source:'manual-bootstrap'`、`executable:false` |
| 缺文件、坏记录、锁残留或上游关联失效 | 非零失败，列明问题；不输出可继续的成功 next |

上游 readiness 单独放 `upstream`：真实 schema、planning complete、artifacts 状态。即使上游 proposal ready 或 planning complete，也不能替代 MenDi 的本地阶段或 reviewer 批准。当前人工 next 可以是 `review-propose`，这是已记录交接提示，不表示 D01-A 已实现阶段引擎。

### 7. 类型检查与验证接线

proof 迁移已经完成：当前 `.ts` 由 `tsconfig.scripts.json` 检查，产品 `tsconfig.json` 仍只构建 `src` 到 `dist`。Node [官方说明](https://nodejs.org/docs/latest-v22.x/api/typescript.html) 明确原生 `.ts` 只做类型擦除；保留单独 `tsc` 检查，不引入 runner。

Apply 增加 `tests/**/*.ts` 的 noEmit 类型检查入口，接入 `pnpm typecheck`；集成测试由 Node test runner 执行 `.ts`，通过子进程运行已构建 CLI。真实上游接入用本次固定安装和受控夹具；只有超时、坏 JSON、版本漂移与写入故障等难以稳定制造的边界使用受控替身 / 注入。区分真实接入结果和替身边界结果。

验证覆盖 specs 的行为；复用已有 P01–P08 的输入和判断，新增对 config.yml、参数基准、产品协议、manual-bootstrap、锁 / 部分写入的定向检查，不重新执行全部历史或称其为正式 Delivery Full Test。

013 修订以 Biome 2.5.15 统一维护中的 src / tests / scripts TypeScript 格式，启用基础 correctness / suspicious lint。`check` 依次运行 format:check、lint、typecheck；不引入类型检查替代品、行数限制或为压行数拆层。显式限定检查输入，排除 `.mendi` 历史、dist / runtime / .tmp、node_modules 和 tests/fixtures 的字节敏感输入。失败修复具体代码问题即可，不触发历史补证。测试的字节比较继续保留；proof 的新结果停止无实际消费者的 scriptSha256，旧报告不变。

## Risks / Trade-offs

- [两个文件提交不原子、断电可留残留] → 项目入口最后提交；非零失败和缺文件 / 锁诊断；保留现场，不自动追认成功。
- [固定上游升级或接口变化] → 核对精确版本和 JSON 结构，错误可诊断；版本扩展另行实测。
- [类型断言不能验证外部数据] → 产品 YAML / JSON 用 `unknown` 加运行时检查；proof 的现有断言仅支持实验结论。
- [仅首次 Delivery、首个 Change 可写] → 帮助明确限制，当前人工记录可读；后续变更扩展写协议时保留原记录。
- [人工 next 与产品阶段能力不同] → 显示来源和 `executable:false`，上游事实单独展示，绝不自动执行下一阶段。

## Migration Plan

原脚本迁移、方案审核和 Apply 已完成；013 在同一 Change 内按 Owner 指令局部修订并补审，不重做完整 Explore / Propose，不执行 Archive。不修改目标文档和上游配置。新项目由产品生成 version 1，当前人工状态保持只读，不自动迁移或写入历史。实现若需修订，使用正常代码修订与新的验证结果；Git checkpoint、部署及生产写入仍需各自授权。
