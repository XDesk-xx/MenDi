---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-revise-propose-01
actionType: revise-propose
role: author
run: "006"
status: completed
actionStatus: completed
result: planning-ready
revisesRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/004-propose/run.md
date: 2026-10-10
---

# MVP-D02-A Revise Propose

Owner 指令：revise-propose。保持 Author，按 [005 Review Propose](../005-review-propose/run.md) 的 RP-A-001 局部修订固定 004 方案；保留 004 及以前的编号 / 结果和 005 changes-requested，不自签批准。使用 `openspec-update-change` 和项目 propose 方法；本指令授权当前明确范围的修订，不逐份重复请求确认。

## 修订对象与变化

固定 OpenSpec 1.14.1 的实际 list / context / status 确认 nearest root 为本项目、当前 Change 为 repo-local spec-driven；读取四类 artifact instructions 与现有直接依赖、context / rules。调用原始输出各保存一份，见 [openspec-commands](artifacts/openspec-commands/)。不创建新 Change 或 explore.md，不重做完整 Explore / Propose。

| 当前产物 | RP-A-001 的局部修订 |
| --- | --- |
| [proposal.md](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/proposal.md) | 明确强制禁止 pnpm 运行前自动安装，依赖预检失败为 not-run |
| [design.md](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/design.md) | Decision 4 的 error / warn 两段调用、Decision 5 的真实预检摘要、Decision 6 的未运行 / 分配边界及风险说明 |
| [test-execution delta](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/specs/test-execution/spec.md) | 缺失 / 不同步、目标 install 覆盖、执行阶段无安装、脚本自身显式安装及错误文字不冒充预检场景 |
| [tasks.md](../../../../../../openspec/changes/sequential-changes-and-test-entrypoints/tasks.md) | 更新 4.2 / 4.4 / 5.2 / 6.1 的实施与验收要求；仍为 28 项、全部未勾选 |

修改前四份实际内容分别保存为 [before](artifacts/before/) 中的 proposal.md、design.md、tasks.md、test-execution-spec.md；来源即上表当前产物，短名保存，不复制历史 Run 树。其他三个 capability delta、关联 / 当前选择 / 批次 / Archive 协议和有效审核结论保持。本轮只改规划与人工交接 / 当前背景说明，未改 src / tests / scripts、主规格或旧 proof。

核心方法：Corepack 的网络开关不能禁止 pnpm 自身安装。锁内独立执行 `[pnpmEntry, 'run']`（无 script 名），覆盖子进程 `pnpm_config_verify_deps_before_run=error`；它检查依赖并列命令，不执行脚本。非零即 not-run、executionId=null，输出实际原因，不占执行号或启动测试，正常释放自身锁。通过后才写执行意图，再用 `[pnpmEntry, 'run', scriptName]`、强制 warn 执行选定命令；该分支同样不能自动安装。记录两段不同策略，不能把工具预检非零当成测试 failed。Windows 同名环境键的归一与不修改宿主环境进入任务。

两次之间的外部依赖变动不被假装成始终同步；执行调用仍禁止自动安装，实际脚本失败则 failed。无需依赖错误文字、脚本 sentinel、pnpm 内部模块或新 reporter 协议推断启动。用户明确选定脚本自己的 install / 写入属于实际脚本行为，单独覆盖其边界。

## 局部 proof 与验证

沿用 [005 的本地安装反例及固定版本源位置](../005-review-propose/artifacts/pnpm-install-probe.json)：目标 verifyDepsBeforeRun: install 在原调用下会安装本地依赖并创建锁文件；error 覆盖可拒绝。已核对实际安装源码的 `runDepsStatusCheck`、`handler41` 与环境覆盖位置：依赖检查先于 script 选择，error 抛出，warn 不进入安装分支。产品只使用公开 CLI，源位置是本轮决策依据。

新 [pnpm-no-install-proof.json](artifacts/pnpm-no-install-proof.json) 在新建隔离目标，用真实 Node 22.23.2 / pnpm 11.22.0 和纯本地 file 依赖、离线模式验证选定协议；必要输入全文、实际命令 / 环境 / 输出 / 退出、逐字节未变比较结果均保存于此，不新增 hash 清单。结论如下：

| 情形 | 实际结果 |
| --- | --- |
| 目标显式 install，依赖未安装，版本预检 exit 0 | 无 script 预检 exit 1，脚本未启动；目标文件未变，未安装依赖、未创建锁文件 |
| 同一类目标已同步 | 无 script 预检 exit 0，warn 执行 exit 0，脚本实际写入标记；除该显式脚本效果外文件未变 |
| 已安装后增加本地依赖，声明不同步，目标仍为 install | 预检 exit 1，脚本未启动，新依赖未安装；包括既有锁文件在内的目标文件保持 |
| 执行阶段遇到缺依赖，直接验证 warn 分支 | 选定脚本实际 exit 0、写入标记，但 pnpm 没有自动安装或建锁文件；只认证无安装分支，不冒充整个预检成功 |

同步夹具的依赖由**独立准备命令** `install --offline --ignore-scripts` 建立，实际调用单列，不混入产品预检或测试执行。首次比较程序遇到 pnpm 正常链接而中止，局部改为只比较链接目标、不跟随链接后，以新夹具重跑，上述五项断言全部通过；首次问题和临时路径也在 proof 中说明。本轮没有维护新的实现 / proof 入口；临时 `.ts` 为受控目标脚本输入，其全文已在正式证据保存，未把运行成功宣称为类型检查。

- 固定 `validate sequential-changes-and-test-entrypoints --strict --json` 实际 exit 0，1/1 valid、issues=[]，见 [validation.jsonl](artifacts/openspec-commands/validation.jsonl)。后续 status 与只读 apply instructions 也 exit 0；planning complete / apply ready 仅表示规划输入齐备，实际 progress=0/28。
- [planning-check.json](artifacts/planning-check.json) 核对四份当前产物已修订、28 项未完成、无 explore.md、004 / 005 头部和原结果保留、局部 proof 通过。Author 一致性与原生执行不是独立语义批准。
- 002 / 003 的无依赖脚本结果保留其原用途；005 的其他仍适用结论沿用。本轮未改维护代码，未重跑无关 check / 产品回归。Apply 按修订任务通过真实产品接口覆盖依赖拒绝、配置 / 环境覆盖、持锁 / 读回、脚本失败及自身显式安装，执行 pnpm check / test。
- 新 proof 仅验证固定 pnpm 行为，不认证尚未实施的 MenDi test run、锁 / 结果协议或产品验收；没有执行根项目 Archive、正式 Full Test、Git、Delivery Close / Reopen 或下一 Change 激活，也未删除临时目录。

## 交接

006 Author Revise Propose 完成，result=planning-ready，无 verdict。D02 open、当前 Change proposed；D01 closed、累计归档数 4。唯一当前审核输入为本 Run，独立 Reviewer 补审 RP-A-001 与受影响方案 / 场景，其余仍适用结论沿用。下一合法边界为独立 `review-propose`，未开始 Apply，未创建 Reviewer Run。

交接后的新进程 status / next 与编号 / 记录一致性验读保存于 [readback-commands](artifacts/readback-commands/) 和 [handoff-check.json](artifacts/handoff-check.json)；这些只读检查不分配 Run 或推进阶段。
