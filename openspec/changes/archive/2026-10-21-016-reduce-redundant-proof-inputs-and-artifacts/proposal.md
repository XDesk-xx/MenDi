# Proposal

## Why

D05-C 的 026 Author/027 独立 Reviewer 已确认历史 proof 中存在重复快照和空文件：测量时五个 Delivery 共 5,623 个文件、353 个零字节，D04-B 单个已提交 014-apply 有 1,015 个文件。大量文件并不等同于可以删除；当前 TestExecution 的零字节 stdout 文件一旦缺失，会让真实 passed 的 status 变为 unknown。需要优先减少**未来新 Run 的无价值重复证据**，而不降低正式验收与故障可追溯性。

## What Changes

- **定稿首版选型：保留物理 stdout/stderr 日志，包括 0B。** 不改变 `TestExecution` 的结果格式、双日志身份、读取/恢复、正式 groups-v1 报告合同；不把缺失文件解释为合法 empty。027 Reviewer 已给出这条可审的最小方案，当前没有足够数据证明重做空日志存储协议的收益大于风险。
- 新增一项 **stage-scoped single-source evidence** 约定，约束 Explore、Apply 与 Review 的**未来**证据收集：Run 保留目的、可重复执行的受控源/命令、最小直接结果及必要失败/unknown 原件；同一原始材料只保留一份，重复展示改为受管可核实引用。证据来源不得只指向预计会被删除的 `.tmp/runtime`，不存在或越界的引用不能充当唯一证据。
- 定向整合当前测试/Proof 的可选证据采集工具：`tests/helpers.ts`、`tests/test-support.ts`、`tests/group-support.ts` 等既有 fixture 和 opt-in 环境入口不再无条件将相同的 `result/log/report/command` 正文多次嵌入各份场景 JSON/JSONL；保留确属唯一的失败/异常、直接请求与原始结果，并以运行可复现的测试验证证据仍可定位。仅修改新产出路径，不逆向压缩已提交 Run。
- 区分“受控可重建输入”“当前唯一必要输入”“临时派生物”与“正式受管执行事实”：不复制临时完整工程树作为重复 proof；长期 fixtures/scripts 的受控输入保留，临时目标自有产物不作为未来唯一证据。任何不允许保留或无法继续受管的外部源不能靠仅存链接冒充可追溯。
- **保留全部正式 groups-v1 必需证据**（实际 group-request、child result、必要 report/events、logs、真实清理/资源/身份、失败/blocked/not-run/interrupted/unknown 的现场）。正式完整执行、Reviewer 直接验证、legacy 双日志读取及已提交历史均不得减损。无全局文件数量/字节门槛、无自动清理 submitted 历史、无新全量 hash 链或证据数据库。

## Capabilities

### New Capabilities

无。复用现有 Action/Run 证据归属和测试执行规格，不增加泛化证据管理平台。

### Modified Capabilities

- `action-runs`：明确未来阶段证据的可重建单源、必要原件保留、直接受管引用与只读历史边界；针对当前已有操作方法和测试证据采集入口。
- `test-execution`：明确现行双日志持久化（包括 0B）及正式 group 报告/失败现场必须保存，证据采集减量不能改变测试执行结果或 readback。

## Impact

- 受影响的产出/方法：`tests/helpers.ts`、`tests/test-support.ts`、`tests/group-support.ts` 与实际使用的其他指定 scene recorder，现有 `skills/actions/{explore,apply,review-explore,review-apply}/SKILL.md` / 必要测试记录指引和 README 简要说明。
- 明确**不改**的核心执行：`src/application/test-execution.ts`、`src/adapters/{test-process,test-store,group-store}.ts` 的日志/报告语义，`src/core/test-execution.ts` 的当前 formatVersion=1 合同；只有受影响测试发现当前输入/读取缺口才按已批准规格小修，不通过文案掩盖。
- 产品/代码变化以可复用的有限证据采集辅助和场景测试为主；无 UI、D05-D amend/supplement、D01–D05-B 历史改写、根 D05 正式 Full Test/Close、自动 Git/发布/安装。