---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-propose-01
actionType: propose
role: author
run: "004"
status: completed
actionStatus: completed
result: planning-ready
date: 2026-10-10
---

# MVP-D02-A Propose

Owner 指令：propose。承接 [003 独立 Review Explore](../003-review-explore/run.md) 的 approved 与固定 002 Explore，编写正式方案、设计、delta specs 和任务，完成后停在独立 Review Propose。

## 实际背景与承接

保持 Author，依据 Owner 已激活的 MVP-D02-A 范围继续，不因进入审核边界切换角色。使用上游 `openspec-propose` 与 `skills/actions/propose/SKILL.md`；固定 OpenSpec 1.14.1 的 list / context 确認 nearest root 为 MenDi，读取真实 status 和各 artifact instructions，按 proposal → specs / design → tasks 依赖顺序编写。所有原始调用输出各保存一份，见 [openspec-commands](artifacts/openspec-commands/)。当前仍为人工协作记录，没有调用产品 Action 写命令迁移 manual-bootstrap。

已重新读取 003 与其固定 002、根配置、路线图范围、相关源码 / 测试接线及三个主规格（包括场景）。003 的 approved 批准探索依据，不认证产品已完成；本轮沿用其可靠 proof 与工程检查，不重跑全部实验。实际 context 的 TypeScript、本地工具、不自动安装、必要输入和独立审核边界进入方案与验收任务，没有复制 context 原文到产物。

## 正式产物

| 产物 | 作用 |
| --- | --- |
| [proposal.md](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/proposal.md) | 问题、范围、一个新能力与三个修改能力 |
| [design.md](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/design.md) | 顺序 / 当前对象 / 批次协议、二次归档收口、脚本与执行记录、异步持锁及取消边界 |
| [delivery-workspace delta](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/specs/delivery-workspace/spec.md) | 显式追加与批次，当前必要读取和累计归档；完整保留被修改需求的旧场景 |
| [action-runs delta](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/specs/action-runs/spec.md) | 当前 Run 与跨 Change 批次复用，独立审核 / submitted 不可变约束不变 |
| [project-entry delta](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/specs/project-entry/spec.md) | 明确本地测试目标与执行模式，上游生命周期操作仍校验固定 OpenSpec |
| [test-execution delta](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/specs/test-execution/spec.md) | 三类入口、最小记录、真实结果、只读未完成解释和支持的前台取消 |
| [tasks.md](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/tasks.md) | 七组 28 项实施 / 验证任务，当前全部未勾选；审核、Archive 与 Git 等后续作为非勾选流程说明 |

## 收敛决策与审核重点

1. **关联 / 批次。** bindings 明确按追加顺序，唯一当前为活动末项或无活动时最后 archived 项；先整理真实结构 / 选择规则，再统一消费方。第二 bind 加入已有批次并保存 batchId，允许无 latestRunRef，不回退旧 Run、不替换成员，不新增 current 指针或历史注册表。
2. **二次归档。** 只读当前必要 Archive Run，旧绑定保留身份 / 编号 / 定位检查，不要求它们的旧正文存在。Archive 仅更新本项；第二次计数 / 终态 / manifest 部分提交继续由现有有限 finish 收口，当前重复 finish 幂等、旧对象请求拒绝。Apply 管线验证两个 Change 的实际归档及编号到 2，不以选择投影代替产品验收。
3. **测试命令。** 默认现有 `test:focused / test:fast / test:full`，可用 `package.json mendi.tests` 仅覆盖直接 script 名；不存在就显示未运行。`test list / run / status` 仅本地，run 明确既有 pnpm JS 入口、Windows / Node 22 / pnpm 11.22.0，关闭自动下载。宿主 proof 的硬编码工具路径不进入产品默认。
4. **结果 / 生命周期。** Delivery 下 `tests/NNN-kind` 独立序号，每次执行不创建阶段 Run、不改当前 next。spawn 前保存 running 意图，日志和终态完整后才通过；not-run / failed / interrupted / unknown 不混成 passed，full 仍是 command scope。再次显式执行保留旧结果；status 只读指定结果，不根据 pid 失踪猜退出，不执行恢复或解除锁。
5. **异步和维护。** 现有同步 `lockedWrite` 不能接 Promise；先整理实际锁持有 / token release 职责，执行者持锁跨 await。正常行为失败且持久化成功要释放自身锁，实际写入 / 停止不确定保留现场。先分开要继续扩展的 CLI 呈现与关联验证职责，按真实场景组织新增 tests，不扩写旧 C / D proof，不靠转发层压行数。

## 验证与限制

- 固定 OpenSpec `validate sequential-changes-and-test-entrypoints --strict --json` 实际 exit 0，1/1 valid、issues=[]；原始结果见 [validation.jsonl](artifacts/openspec-commands/validation.jsonl)。status 的四类规划 artifacts 均 done，isPlanningComplete / isComplete 为 true，仅表示文件齐备，不表示 28 项实施完成或独立审核已批准。
- Author 一致性检查核对四份 capability delta、9 个 MODIFIED 需求头与旧场景保留、28 项任务未勾选、未新增 explore.md；见 [planning-check.json](artifacts/planning-check.json)。这不是独立语义审核。
- 本轮只写规划产物和当前人工交接 / 文档，未改 src / tests / scripts 或主规格，未执行产品回归、根项目 Archive、正式 Full Test、Git 或下一 Change 激活。003 已执行的 build / check 与 proof 保持原限定用途；实现后执行当前 tasks 中的真实回归与验收。
- 首版执行支持范围为 Windows 前台树和明确既有 pnpm；后台脱离进程、其他平台和正式 Full Test 授权 / 收口不在本 Change。停止 / 结果保存失败必须 unknown，不能靠夹具 actor 标签或一条输出认证真人 / 完整结果。

## 交接

004 Author Propose 完成，result=planning-ready，无 verdict。下一步为独立 `review-propose`，唯一当前审核输入是本 Run；详细 Explore 来历由直接 003 入口定位，不把历史链重复塞入 next。D02 保持 open，D01 保持 closed，项目累计归档数 4；停在审核，未开始 Apply。

更新后在新进程执行根项目 status / next 及固定 OpenSpec status，全部 exit 0，读回 `next=review-propose / role=reviewer / authorRunRef=004`、当前 Change 正确且规划齐备；原始输出见 [readback-commands](artifacts/readback-commands/)。同时核对 Author 无 verdict、003 approved 保留、28 项实施未完成、下一可用 Run 为 005、D01 closed 与累计 4。没有创建 Reviewer Run。
