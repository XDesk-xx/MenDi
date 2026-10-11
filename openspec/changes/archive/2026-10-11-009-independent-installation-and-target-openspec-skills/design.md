# Design

## Context

动机见 [proposal](proposal.md)。009 / 010 已证明 Windows、Node 22.23.2、pnpm 11.22.0、OpenSpec 1.14.1 下的真实打包 / 离线独立安装、双目标生成方法和候选读取可行；产品在缺目标方法时仍能 start，是待实施缺口。候选脚本不接入产品，隔离目标的规划实验不等于本 Change 的实施。

`src/adapters/methods.ts` 当前加载安装根自有阶段方法与显式工具指导。`actions.ts` 的 start / continue、`action-resolution.ts` 的 Owner 接收交接和 `archive-prepare.ts` 都在新 Run 写入前加载自有方法，适合接入目标方法。`action-instructions.ts` 与 OpenSpec adapter 已有实际 artifact / Apply / Archive instructions，继续复用。Run 已保存 stageSkill / toolGuidance，查询按必要当前对象解释，根仓库开发记录保持 manual-bootstrap。

## Goals / Non-Goals

**Goals:** 在既有方法交接增加可读目标方法，明确阶段入口及失败范围，保留安装 / 目标 / CLI 三处职责；用实际安装与阶段产物验证接线，使现有包可稳定应用。

**Non-Goals:** 工具升级流程、未来支持清单、全量版本注册表、多布局 / 共享 / 远端方法、全库 hash 或引用扫描、自动连接 MCP、重新设计 Action / Run、迁移人工历史，以及 C 的真实 Vue / 无 UI 完整流程。当前包装和方法验证不认证冷安装、其他平台或跨环境宿主；升级只留路线图 §9.1。

## Decisions

### 1. 目标方法单一来源，保留当前基线

上游来源固定为已规范化当前目标的 `.agents/skills/<方法名称>/SKILL.md`。固定阶段映射生成相对路径，复用 `managedPath` 的逐层 realpath / junction 越界检查，确认普通文件，再解析 YAML 头部、非空正文、name 和 metadata.generatedBy。缺失 / 不可读 / 身份 / 基线错误使用 `skill-unavailable`，附实际 file 与 observed / expected；越界保留 `unsafe-reference`。metadata.version 只作上游方法元数据，不作 CLI 版本或文件完整性证明。

读取器复用现有 YAML 与文件 API，不引入依赖；与 CLI 检查的 1.14.1 保持一致，可用普通常量避免误写，不建立兼容管理器。目标缺项只说明明确准备要求，不自动 init / update 或借其他目录兜底。共享服务和随包复制六份官方方法会混淆来源，暂不采用。

### 2. 保留现有输出，增加即时 upstream 数组

现有 `methods.stage` 与 `methods.guidance` 的形状和来源保留。Change 新交接增加 `methods.upstream`，每项包含 `{ name, projectRoot, ref, file, generatedBy, content }`：ref 为当前目标内相对路径，file 为经安全核对的实际绝对来源，content 为本次真实读取的完整文本。无需上游方法的 Review 返回空数组；Delivery 自有方法入口保持原行为。当前 `projectRoot`、run.changeId、actionType 与自有阶段指导足以绑定执行目标及阶段，不额外复制一套执行模型。

此数组只用于本次输出，不写成持久 Run 必填字段、不保存正文快照或 hash。旧头部解析不变；旧 continuing Run 在新继续时重新读取当前目标。返回正文解决本机宿主实际可读问题，但不由此承诺 Windows 路径适用于 WebCodex。加载成功与遵循方法分别由返回内容和实际工作结果证明。

### 3. 阶段映射具体收敛

| Action 类型 | 必需目标方法 | 宿主执行约定 |
|---|---|---|
| explore / revise-explore | openspec-explore | 在当前范围分析并做核心 proof，摘要进 Run，不提前实施 |
| propose，包括同 Action continue | openspec-propose | 已绑定 Change；复用其检查上下文、按实际 instructions 与依赖编写产物的片段，跳过 new change |
| revise-propose | openspec-update-change | 修订已有正式产物，按真实规则处理部分 glob 新增；不替代首次缺失产物创建 |
| apply / revise-apply | openspec-apply-change | 使用当前真实 Apply inputs / tasks，按受审方案实施验证 |
| review-explore / review-propose / review-apply | 无强制 Author 方法 | 自有独立审核；按核对需要读取事实和已有 instructions，不执行 Author 流程 |
| archive 准备 | openspec-archive-change | 读取适用归档指引；MenDi 自有规则确定批准和实际 native archive 的一次同步路径 |
| Delivery 操作及其修复 / Review | 无 Change 方法 | 按原 scope 消费必要输入，不伪装活动 Change |

可选 `--tool openspec` / `--tool storybook` 继续表示自有工具指导，维持单选语义；阶段必需方法独立加入，Apply 选择 Storybook 时仍交接 openspec-apply-change。不存在上游同名 Reviewer 方法的假设，archive / sync 正文不作为执行第二次同步的指令。首次 Propose 的未完成依赖按公开 instructions 处理，非机械要求全部 ready；修订入口遇到不适用的缺失产物须报告实际情况，不能用修订方法伪报补全。

### 4. 所有新交接入口在占号前检查

保持 `loadMethods` 的随包自有职责，增加窄的 Change 方法组合入口供 start / continue / resolve / Archive 准备共用；目标解析与阶段映射在方法 adapter 内实现。若职责确需独立，只提取实际文件解析与安全验证，不加纯转发层。普通查询、instructions 只读、save / submit、diagnose、Archive execute / local-only finish 不新增方法读取：准备之后执行沿用既有批准 / 输入 / 效果协议，不因新增接线破坏旧 prepared Run 的收口。

先按当前目标 / Action 检查角色、直接 Author、既有状态，再在写入前读取必要自有和目标方法。锁内复核当前阶段及直接对象，并在 createRun 前重新核对必要方法；返回与该次写入对应的读取内容，不使用旧 Run 缓存。锁前缺方法时不产生锁、占号或 manifest 更新；锁内发现并发变化按既有失败现场规则处理，不强行回滚。保留实际写入冲突与路径检查，不声称跨文件或外部方法读取具有事务原子性。

Owner resolve 的 handoff / revise / rollback 用实际接收阶段决定所需方法；Reviewer 接收无需 Author 方法，Author 接收不能绕过检查。Archive 准备接线在既有批准和任务检查之后、Run 占号之前；execute 仍只有一次 native 调用，finish 仍本地观察，不加载 sync 或添加归档状态机。

### 5. 独立安装、pnpm 与文档收敛

沿用 package 的 dist / skills / README、Node `>=22.20.0 <23` 声明及 pnpm 11.22.0；实际验证范围为当前 Windows / Node 22.23.2，不据 engines 范围声称已验证所有 Node 22 或其他平台。外部 CLI 路径可显式指定同基线稳定入口。README 给出从开发仓库外固定目录安装本地包、目标方法明确准备与 CLI / Skills 使用入口；目标生成操作属于准备，Action 不自动安装或 init。

`tests/ui/results.test.ts` 从既有 `scripts/test-ui.ts` 复用 `pnpmEntry`，消除固定路径与 `MENDI_UI_PNPM_BIN` 差异。根 build / pack 使用根工程正常环境；目标执行仍强制既有严格依赖预检，并用无自动安装的 script 环境。Explore 复用 UI 环境导致根 build 拒绝的日志保留；新的验收准备明确区分 cwd 和环境，不把 UI 的目标策略施加给根工程，也不放宽产品预检来取得 PASS。用另一个真实可选稳定 pnpm 入口验证实际命令来源；缺入口 / 错版本保持失败。

README 收敛为工程准备、稳定安装、配置 / CLI / Skills 短入口与当前 manifest；详细操作方法保留自有 Skills，产品约束在主规格与本 Change，历史过程从最近 Run 定位。OpenSpec context 只保留当前必要背景、入口和本轮范围，删除重复旧 Delivery 过程；保留项目既有操作 guidance。AGENTS 协作与目标既有规则不被安装或 Action 覆盖。

### 6. 验证按风险与职责组织

- 快速行为测试用明确标记的受控方法夹具核对解析、头部区分、空正文 / 缺失 / EISDIR、越界及全部阶段映射；实际 start / continue / Owner resolve / Archive 准备验证失败前后 manifest / 当前 Run 字节与 Run 目录占号。复用 `tests/action-support.ts` 的统一目标准备，避免每项测试自行维护六份伪上游流程。
- 产品验收新增分组 tests，使用固定 CLI 真实生成方法、真实编译打包并在开发仓库外稳定目录安装；两个隔离目标、不同 cwd / 新进程读取真实正文，检查目标写入位置与未选目标 / 安装根。长期输入和 TypeScript 准备脚本受控，安装与 `.tmp` 可重建，不作唯一证据。
- 安装场景放 `tests/installation/`，用显式 `pnpm test:installation` 发现并执行；准备脚本 `scripts/prepare-installation-tests.ts` 显式构建、打包并安装新的隔离包，测试入口只消费已准备环境，缺项拒绝，不自动安装或默默跳过。scripts / tests 纳入现有真实 tsc，Biome 增加该维护目录；普通 `pnpm test` 继续原有快速回归，不让每轮自动安装。
- 在真实隔离已绑定 Change 使用交接的 propose 方法与逐项 instructions 完成四类产物，目标 context / rules 落入实际内容，strict validate 和 list 证明未新建第二 Change；任务未实施。Review 用独立记录夹具测试产品边界，不把夹具 verdict 当成真人批准。Archive 补接线和一次同步的定向回归，沿用其余有效归档结论，不扩写旧长 proof。
- pnpm 变动补 UI 有限结果场景，以修复后新结果核对实际入口；沿用 A 的未变化浏览器 / 服务结论，C 再验证真实 Vue、无 UI、完整交付与新会话。普通 `pnpm check`、受影响 Node 回归和真实安装验收均保留命令 / 输出 / 限制，不执行正式 Delivery Full Test。

## Risks / Trade-offs

- [只支持已生成的目标目录与单一基线] → README 写明准备方式；缺项明确失败，多布局与版本升级留待真实需求。
- [generatedBy 被误作完整性认证] → 输出只声明生成基线和实际内容来源，本地修改不能称为未修改官方方法，不添加 hash gate。
- [旧测试目标没有方法，新前置影响多个接收入口] → 统一受控目标准备，覆盖 start / continue / resolve / Archive；查询与旧 Run 兼容单独回归。
- [根与 UI 环境混用造成误判] → 正常根构建与目标严格预检分开；入口不同用真实命令核对，失败保存实际原因，不静默关闭检查。
- [方法正在并发变化] → 写入前和锁内复核必要方法 / 当前对象，失败保留实际现场；不扩大为历史扫描或通用事务恢复。

## Migration Plan

Apply 在当前版本实现窄接线与 tests，再以新构建包进行独立安装验收。既有 Run、manual-bootstrap、编号和 verdict 不改；旧 continuing 使用当前目标准备好的方法，查询不补写。若后续回退实现，保留已保存的正式 Run，通过明确受审修订安排兼容，不自动覆盖记录。本轮不执行实际 Archive、工具升级、Git 或下一 Change。
