---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: full-test-orchestration-continuation-and-revalidation
planningSlot: MVP-D04-B
batchId: 002-changes
actionId: full-test-orchestration-continuation-and-revalidation-explore-01
actionType: explore
role: author
actor: codex-author
run: "009"
status: completed
actionStatus: completed
outcome: complete
result: exploration-ready
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
---

# MVP-D04-B Author Explore

Owner 原始消息明确 owner 授权激活 MVP-D04-B「Full Test 编排、续测与复验」，开始 explore；保持 Author，只针对必要疑点做真实 proof，不提前实现、不修改 DreMo 或稳定安装、不 push，完成停独立 review-explore。本 009 沿既有 002-changes 批次；A 保持 011 archived，基准提交为 168a4cb54f0c9028eaf9c271b43d9ee14c3ae904。根继续 manual-bootstrap，人工登记本次探索，不伪报产品 action start / submit 成功。

## 输入与方法

读取根路线图 §7 / D04-B、[完整收集反馈原件](../../../../../../mendi-full-test-continuation-improvement.md)、A 已同步的 test-execution / delivery-verification / delivery-lifecycle 相关规格及当前实现。反馈记载的 DreMo Run057 / Run060 只作为已交付原件中的来源事实，不在本阶段访问 DreMo、复制其证据树或重跑长测。

读取目标 openspec-explore 和自有 explore 方法；Owner 明确激活和真实 proof 指令覆盖本次 scaffold、Run / artifacts、当前交接及必要受控 proof。固定 OpenSpec 1.14.1 list 确认 repo-local 根后由 new change 创建元数据，未手工造 Change。status 和 proposal 背景指令 / context / rules 在 artifacts/activation-commands.json；proposal rules 为空。本阶段只消费背景，不填 proposal 模板、不提前生成 design / specs / tasks，不新建 Change 级 explore.md。

项目要求落实为：总规划和反馈原件不改；范围、未知材料与必要直接输入分开；不增加全库 hash / 引用链、证据数量或性能门槛；当前取消、锁、角色、归档和正式收口边界继续有效。详细证据仅保留本次直接输出，隔离目标可由维护的 TypeScript 脚本和既有受控夹具重建。

## 当前实现的关键事实

| 落点 | 观察及其影响 |
| --- | --- |
| core/test-execution.ts、application/test-execution.ts、adapters/test-process.ts | 实际子结果是 command 范围，保存单一 pnpm script 的退出 / 信号 / 日志；没有内部组覆盖、依赖或资源回执。流式日志可以保留，但不能据输出猜执行粒度。 |
| core/delivery-verification.ts、core/full-test-record.ts | collection 是完整集合说明，basis 保存材料 / 差异及可选提交；不是已观测的组级执行清单，也不自动认证任意源码。 |
| application/full-test-admission.ts、adapters/delivery-verification.ts | 正式失败须当前修复 / 独立 Review；核对原范围和完整 collection，缩减集合拒绝。原 outcome、轮次 / 范围 / 命令匹配与材料语义适用性分别解释。 |
| application/delivery-lifecycle.ts、core/delivery-lifecycle.ts | Close 消费当前轮正式 Full Test 的实际 passed 与直接保存快照，不能直接消费普通 focused 或多个尝试汇总。B 需要连同正式查询、repair / review、status / next 和 Close 一起调整。 |
| A 的轮次 / 基线能力 | 当前轮与历史来源已经分开，B 可复用所属轮及基线事实边界；不能跨轮借旧 PASS，也不需要重开 A 或再次迁移根人工历史。 |

## 必要 proof

入口为 [scripts/mvp-d04-b-explore.ts](../../../../../../scripts/mvp-d04-b-explore.ts)，直接调用当前应用 / adapter，在新隔离目标内使用真实 pnpm、Node 测试、生产执行器及持久记录。准备复用现有 verificationTarget / producer-consumer 夹具：阶段批准为明确标注的隔离记录，准备中的原生归档发生在夹具目标，不能当成本仓库独立审核或根归档。本会话实际角色一直是 Author。

| 疑点 / 方法 | 实际结果 | 证据与限制 |
| --- | --- | --- |
| 既有 full 入口是 unit && integration && tail，producer 的真实契约错误使 integration 失败 | 正式执行 failed，只运行 unit / integration，独立 tail 未执行；外层记录只有整条命令粒度 | proof-02/opaque-full-*；证明当前观察边界，不证明新协议已实现 |
| 改用目标现有 Node 完整收集能力执行同三个文件 | 中间失败和两份独立 unit / tail 都运行，目标非零，MenDi 仍如实 failed / command，不会自行得到三份组级产品记录 | proof-02/target-collects-*；Node 的真实测试文件顺序不能当成未来计划顺序 |
| 普通 focused 只续跑未执行 tail | tail 真实 passed，原正式 failed 不变；直接请求正式重试在新占号前因缺修复审核被拒绝 | tail-continuation-*、retry-before-review.json |
| 在隔离副本修复 producer，建立受控 repair / reviewer 记录后缩减原完整 collection | 当前准入仍拒绝缩减。修复后的 focused 通过，原正式结果仍 failed；按现行合同再做 fresh whole 才产生新的正式 passed，长前缀确实重跑 | approved-but-reduced-collection.json、repaired-focused-*、focused-does-not-promote-failure.json、fresh-whole-*；这些 fixture verdict 不认证独立性 |
| 新正式 passed 后再次改变 producer，保持同一 full script 文本 | 历史查询保留 passed / commandMatch=match / requires-semantic-check；当前 focused 真实 failed。原 failed Run 与日志字节保持 | source-changed-old-result.json、changed-candidate-focused-*；这符合当前历史与材料适用性分离合同，不能据同名入口自动认证当前候选 |

上述文件均位于 artifacts/proof-02；结论和限制见 conclusions.json。原始 stdout / stderr 各保留一份，准备命令在 preparation-commands-02，CLI / pnpm 均未触发自动下载或目标运行前自动安装；准备空依赖夹具使用既有显式离线准备方法。临时目录不是唯一输入或正式证据。

新增确认的可选协议方向，还用 [scripts/mvp-d04-b-event-proof.ts](../../../../../../scripts/mvp-d04-b-event-proof.ts) 做单一可行性检查：当前 Node 22 run() / TestsStream 真实产生 test:pass / test:fail，得到 unit、tail 两个通过文件及 integration 一个失败文件，无需解析 stdout。原始事件为 artifacts/structured-events/events.jsonl，结果为 result.json。本例仅说明目标侧能产生机器事实；文件与显式输入一一核对，不是通用 runner、MenDi 最终 schema、Python / 浏览器适配器或新验收准入实现。

首次 proof-01 因 Author 对 Node 参数顺序的假设断言失败：实际 integration、unit、unit，与预期 unit、integration、unit 不同。原输出、部分结果和已执行日志保持在 proof-01-command.log / proof-01；修正为核对实际结果集合后，proof-02 独立完成，不把两次拼成一条成功执行。首次编写脚本的 TS2339 联合类型访问已在执行前修正为真实 guard / error.code，说明见 artifacts/authoring-typecheck-note.json。

当前全局取消及停止未确认不放行的实现未改变，沿用 A 006 test-final-02.log 中 ok84、ok213、ok225 的真实启动取消、未收到 close 仍 unknown、停止本次 pnpm / 脚本 / 后代场景；已复核对应 source / tests。本阶段未重新宣称证明未来逻辑组的资源隔离、依赖阻断或共享服务复用，这些仍须在受审方案后的实施中验证。

## 时间事实与限制

proof-02 的新隔离准备为 49.916 秒，含真实受控阶段 / 原生归档和显式空依赖准备，不是某个产品测试组的断言时间。调用持续时长使用 performance.now，UTC 仅追溯；完整事件在各 observation.json 及 timeline.json。下表单位秒，显示时四舍五入。

| 实际调用 | 整体墙钟 | 到 after-launch | launch 到终态保存前 | 终态保存前到返回 |
| --- | ---: | ---: | ---: | ---: |
| opaque-full | 6.428 | 3.827 | 2.437 | 0.164 |
| target-collects | 6.236 | 3.964 | 2.249 | 0.023 |
| tail-continuation | 6.330 | 4.393 | 1.913 | 0.024 |
| repaired-focused | 8.579 | 5.884 | 2.672 | 0.023 |
| fresh-whole | 9.223 | 5.099 | 3.972 | 0.152 |
| changed-candidate-focused | 8.500 | 5.873 | 2.606 | 0.021 |

启动前包含现有准入 / 工具核对 / 无安装依赖检查、记录准备；没有逐项分解，不能把这一段全算浪费。launch 后包含 pnpm / Node 启动、断言与退出；末段包含保存 / 读回 / 释放。没有独立服务清理阶段，不能从本例推导其成本。事件采集小例另为约 0.799 秒，执行边界与 pnpm 正式调用不同，不是优化前后对照。部分工程检查与观测并行，系统负载未受控；不算百分比、ETA、关键路径节省量或性能回归，不外推 DreMo，更不放宽任何原业务预算。后续先分解实际昂贵组的准备 / 构建 / 等待 / 清理，再用同口径样本判断少量改动。

## 本阶段 Owner 决定

通过当前会话逐项提问并等待实际答复；原路线图已确定的完整收集、保留失败、按影响复验及边界不重复索取批准。原答复摘要保存在 artifacts/owner-decisions.json。

1. Owner 采用可选结构化协议：需要组级收集 / 续测 / 复验的目标明确提供逻辑组、必要依赖 / 资源与结果回执，MenDi 消费。旧单命令入口继续命令级，不解析 stdout 猜项，不强制所有旧目标马上拆分。
2. Owner 沿用材料可信边界：以提交及必要差异或无 Git 的明确材料指认候选，Author 逐组说明沿用、失效和影响，独立 Review 核对。工具核对轮次、来源、完整覆盖、必要批准及声明一致性；未知阻断汇总和 Close，不自动推断任意源码影响，不建全库 hash。

## 候选方向与 Propose 需收敛的内容

建议采用目标负责实际执行与资源的轻量协议：从现有有序清单和少量真实前置关系开始，目标保留业务依赖、端口、构建、数据和清理责任；MenDi 固定授权选择、计划 / 尝试身份、当前轮事实和正式消费，不接管目标全部内部测试或建设通用调度平台。目标可利用现有 runner 的机器事件，但必须转成明确逻辑组，不能把本例 Node 文件排序或 stdout 文案当协议。

- 计划明确稳定组身份、必要依赖、实际资源复用边界和不可用原因。普通失败继续独立组；依赖失败只阻断相关项；全局取消停止本轮；清理 / 资源归属未知阻断共享后项，无法界定时停止相关执行并说明。真实退出、必需项缺口和未确认不能被最后一项通过覆盖。
- 每次尝试保持原命令 outcome、退出和日志；新建明确可区分的当前候选验证结论，直接列出来源尝试、所覆盖组、仍适用 / 失效依据、必要修复批准及剩余缺口。建议不把该结论伪装为某次失败命令的 PASS，也不增加专门的汇总 Reviewer 阶段，沿用实际需要的修复 / 独立 Review。具体记录形式与命令留待 Propose。
- 旧单次正式成功按原合同继续读；新协议必须有明确识别 / 兼容边界，缺计划、部分 / 陈旧回执、身份矛盾、输入变化未说明、缺批准或跨轮来源均不能形成新结论。普通 focused 不自动升级；结构化 opt-in 也不能授权从不透明命令内部猜测续测位置。
- 汇总、Full Test 查询、repair / review、status / next 与 Close 必须共同消费同一当前轮候选事实，Close 保存必要直接快照，不沿失败父链或来源基线递归扫历史。公共权限、构建 / 依赖 / 配置 / 数据 / 环境变化按影响扩大，无法可靠界定时保留必要整轮重跑。
- 时间事件区分排队、准备 / 构建、启动、断言 / 等待、清理与证据整理，明确父子包含关系和各进程单调时钟基准；整轮墙钟、工作量和关键路径分别解释。只读构建复用和有限并发须有输入 / 资源隔离证据，不能并发写同一 dist，不能把本例短样本当成提速成果。

Propose 仍需确定最小载体 / 版本、组回执与执行父子身份、续测选择、适用性及失效声明、新结论和旧消费者区分、必要阶段事件。字段 / 命令 / 包版本与分钟指标尚未承诺；若取舍改变已确认范围、语义或兼容再问 Owner。新的普通失败 / 依赖阻断、取消 / 清理未知、跨尝试完整结论、影响扩大与 Close 负例是后续 Apply 的真实验收，不在 Explore 提前做完。

## 工程检查、边界与交接

两个新 proof 脚本均为 TypeScript，并纳入真实 scripts 类型检查。最终 pnpm check exit0（format / lint / src / scripts / tests 类型检查），见 artifacts/check-final.log；proof-02 和机器事件检查均完成，原失败保留，汇总见 artifacts/verification-summary.json。产品实现未变，因此不重跑根 250 项、旧完整 Explore、根正式 Full Test / Close 或安装 / UI 集合。

artifacts/boundary-observation.json 核对：HEAD / 分支仍为 168a4cb / 原 Delivery 分支；src、tests、skills、主规格、A 归档与 binding、根 project、包 / 锁、路线图、三份反馈及 AGENTS 未改，累计归档仍为11；稳定安装0.1.0身份 / 时间保持。未修改 DreMo、未 push / commit、未真实目标迁移、未激活 C。只新增 B scaffold、009 / 原始证据、两个 proof 脚本和必要当前交接。

Author 结果 exploration-ready，无 verdict。固定独立审核对象为本 009、两项 Owner 决定、受控脚本 / 原始观察与当前候选方向；旧 A 结论只在明确限定用途沿用。next 为 review-explore / awaiting-review / reviewer，authorRunRef 指向本 Run；本会话保持 Author，不自签、不自动 Propose。
