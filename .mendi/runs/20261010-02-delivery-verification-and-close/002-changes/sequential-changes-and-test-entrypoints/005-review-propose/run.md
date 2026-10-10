---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-review-propose-01
actionType: review-propose
role: reviewer
run: "005"
status: completed
actionStatus: completed
result: changes-requested
verdict: changes-requested
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/004-propose/run.md
---

# MVP-D02-A Review Propose

Owner 指令：`review-propose`。独立 Reviewer 按 `skills/actions/review-propose/SKILL.md` 固定审核 [004 Propose](../004-propose/run.md) 及其 proposal、design、四份 delta specs 和 tasks；不修改 Author 方案或实现。

**verdict：changes-requested。** 发现一项需要在实施前修正的工具调用设计问题；其余方案可保留，003 Review Explore 的 approved 不受影响。只修订下述具体范围，不重做 Explore、不新增通用工具框架或证据 gate。

## 阻断项

### RP-A-001 / P2：只关闭 Corepack 网络不能保证 pnpm run 不自动安装依赖

位置：`openspec/changes/sequential-changes-and-test-entrypoints/design.md:79`（Decision 4），关联 `tasks.md:28` 的 4.2 和 test-execution 的 Explicit local test execution。

设计明确使用 pnpm 11.22.0、`COREPACK_ENABLE_NETWORK=0` 与 `[pnpmEntry, 'run', scriptName]`，同时承诺不自动安装依赖。实际已安装的 pnpm 11.22.0 默认 `verifyDepsBeforeRun=install`；run 在启动选定 script 前调用依赖检查，不满足时会自行运行 install。Corepack 的网络开关不关闭 pnpm 的这个行为，也不能证明 pnpm 自身不会访问依赖源。

独立实验在新的隔离目录中只使用 `file:./dependency` 本地包和一个输出文字的 script，明确 offline 且独立 workspace，不接触产品目标或下载外部包。按方案参数运行，退出 0，实际出现 `node_modules/review-local-dep/package.json` 与 `pnpm-lock.yaml`，随后 script 才执行。因此正常测试请求可能先改变目标依赖与锁文件，违反当前规格和设计约束；这不是选定 script 自身主动执行 install。

同样夹具显式使用 `pnpm_config_verify_deps_before_run=error` 后，退出 1，script 未启动、依赖未安装、lockfile 未生成。这只证明一个可行的局部修正方向，不替 Author 决定或实现最终协议。

**需要修订：**在设计中明确强制禁用 pnpm 运行前自动安装的策略，不能仅依赖目标默认或 Corepack 网络开关；说明依赖缺失 / 不同步时的未运行反馈。tasks 和规格增加真实目标缺依赖、目标显式配置 `verifyDepsBeforeRun: install` 时仍不安装的验收，检查 script 未启动、依赖 / lockfile 保持。保留目标文件不改写和既有脚本自身行为的边界。工具预检已通过但 script 尚未开始的这种失败，不应误称实际测试 failed / passed。

证据：[pnpm-install-probe.json](artifacts/pnpm-install-probe.json) 保存两个分支的命令、实际环境覆盖、完整 stdout / stderr、退出、文件观察及全部夹具输入；同时定位本机已安装 pnpm 的默认值、runDepsStatusCheck 和环境覆盖代码。可据此重建，不依赖原 `.tmp` 唯一内容。原 002 / 003 无依赖夹具只证明脚本结果，不认证此项无安装属性，无需改写它们。

## 可保留的审核结论

- 004、proposal、design、四份 delta specs、28 项任务覆盖同一 D02-A 范围。正式 Full Test / Close / Reopen 留在 B / C，不迁移人工历史；当前上游 planning ready 不代表获得 Apply 批准。
- 显式追加、活动末项 / 最后 archived 选择、无新 Run 不回退、bind 时加入已有批次及全 Delivery 占号已一致；归档定向更新第二项，计数部分提交和陈旧 finish 有明确场景及测试，不再把所有旧 ordinal 与当前总数逐项相等比较。
- 当前必要 Run / Archive 交接保留，未选中旧项只校验身份和结构；不读取全部旧正文或未知 Ref。新的指定 test status 不依赖旧工具、原 script 或原 Change 的正文；普通 next 不增加测试结果链。
- 每次执行使用独立目录，记录实际命令和结果，不创建阶段 Run、不改 verdict / next。spawn 前意图、终态不可变、保存失败与只读 unknown、正常 failed / interrupted 释放自身锁均已区分；不要求历史全量 hash 或证据数量门槛。
- 同一项目锁跨 await 的风险已有明确整理任务和并发 / 写失败验证；取消仅针对本次持有的 Windows 前台树，旧 pid 不用于跨进程 kill。长测试期间普通查询被锁阻止是已声明的首版取舍，不要求在本次增设调度器或自动锁恢复。
- 已检查 9 个 MODIFIED 需求均保留原场景，新增场景覆盖两次真实归档、依赖 / 冲突、当前选择、真实执行及持久读回。继续扩展的关联和 CLI 职责先整理，新增 tests 按场景分组，不扩写旧 C / D proof。

## 验证

| 本轮独立检查 | 实际结果 |
| --- | --- |
| 固定 OpenSpec 1.14.1 `validate sequential-changes-and-test-entrypoints --strict --json` | exit 0，1/1 valid、issues=[]；[结果](artifacts/validate.json) |
| 固定 OpenSpec `instructions apply --change sequential-changes-and-test-entrypoints --json` | exit 0，state=ready，28 项全部未完成；[完整指引](artifacts/apply-instructions.json) |
| MODIFIED 需求 / 场景和任务检查 | 9 个修改需求的旧场景保留，28 项未勾选；[检查](artifacts/planning-check.json)，仅结构佐证 |
| 两分支 pnpm 本地依赖实验 | 方案调用发生自动安装；显式 error 策略拒绝且无依赖写入；[证据](artifacts/pnpm-install-probe.json) |

本轮没有实现改动，不重跑产品全量测试、旧 proof 或正式 Delivery Full Test；003 的已核对依据沿用。当前方案与受影响源码已阅读，结构通过不替代上述语义发现。没有修改 Author 产物、旧 Run 或主规格，也没有执行根项目归档、Git、下一 Change 激活。

## 交接

转交 Author `revise-propose`，当前输入仅指向本审核 Run；固定修订对象由头部定位 004。Author 新建范围明确的修订 Run，保留 004 与本 verdict；随后独立补审 RP-A-001 及其实际影响，其余仍适用结论沿用。未获批准前不进入 Apply。

本轮完成后新进程 status / next 读回结果保存于 [readback](artifacts/readback.json)。D02 保持 open，D01 保持 closed，累计归档数仍为 4。
