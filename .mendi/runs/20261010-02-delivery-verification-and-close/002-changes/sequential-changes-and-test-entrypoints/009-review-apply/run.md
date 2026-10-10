---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-review-apply-01
actionType: review-apply
role: reviewer
run: "009"
status: completed
actionStatus: completed
result: changes-requested
verdict: changes-requested
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/008-apply/run.md
---

# MVP-D02-A Review Apply

Owner 指令：`review-apply`，借助 Open Code Review，使用 delegate 模式。独立 Reviewer 固定审核 [008 Apply](../008-apply/run.md) 与 007 批准的方案；OCR 只提供文件选择和规则，不调用外部 LLM，也不代替语义结论。

**verdict：changes-requested。** 两项 P2 均已独立复现，集中于新增测试执行的日志完整性与 unknown 查询语义。现有方案足够支持局部修复，无需重新 Explore / Propose；本次不批准 Archive。

## 必须修订

### RA-A-001 · P2 · 日志短写仍报告 passed

`src/adapters/test-process.ts:116` 对每个输出 chunk 仅调用一次 `fs.writeSync`，忽略其实际写入字节数。短写不必抛异常，当前逻辑会丢弃剩余字节，随后仍按 child exit 0 保存并报告 passed，违反必要原始日志完整保存的合同。

独立探针仅拦截受控脚本的 stdout chunk：请求 16 字节，实际写入并返回 5 字节；真实脚本正常退出，日志仅为 `foreg`，遗漏 `round:pass\n`，产品仍返回 `ok=true / outcome=passed`。原始结果和输出见 [short-write-probe.json](artifacts/short-write-probe.json)。这是合法短写返回值的受控故障注入，不声称本机自然出现了磁盘故障；未修改产品实现。

Author 应按实际返回值完成剩余字节写入；零进展或写入失败须进入既有 unknown / 现场保留路径。补覆盖连续短写最终完整保存，以及零进展 / 抛错不能报告 passed。无需新增日志 hash、大小阈值或额外证据协议。

### RA-A-002 · P2 · 已保存 unknown 在锁处置后返回成功退出码

`src/adapters/test-store.ts:103` 仅凭无锁、字节稳定和 `executionState=finished` 判定 stable；`testStatus` 直接将其作为 ok，遗漏持久 `outcome=unknown`。异常退出已经保存 finished / unknown 后，显式处置残留锁会使新进程 `test status` 返回 `ok=true / exit 0`，虽然原执行仍未确认。锁消失不能改变该执行的 unknown 语义。

独立探针在真实执行子进程 spawn 后发送 SIGTERM，得到并保存 unknown；确认该受控子进程已退出后，仅在隔离夹具中显式处置本探针持有的锁，保持结果文件字节不变。持锁查询 ok=false，处置后真实新 CLI 查询变为 ok=true / exit 0，outcome 仍为 unknown。见 [unknown-status-probe.json](artifacts/unknown-status-probe.json)。此处置只用于验证后续只读语义，不新增产品自动清锁能力。

Author 应区分文件观察稳定与执行结论已知：仍可返回原观察，但 unknown 必须保留未确认反馈与非零退出；已知 failed / interrupted / not-run 的可读查询保持现有成功语义。补 finished / unknown 无锁的新进程只读回归，不重写终态或依靠旧 pid 猜结果。

## 已核对且仍有效的部分

- 当前关联选择、共享 Changes 批次和定向归档更新使用一致的当前对象；非当前旧 Run 正文、说明 Ref 和未知扩展未成为查询前置。保留身份、受管路径、锁与角色检查，无全历史或全量 hash gate。
- 两次真实 Archive、第二项的有限恢复 / 幂等及写入冲突在定向回归中通过；只更新对应 binding，归档累计编号与 Run / 测试编号分开。
- RP-A-001 的 error 依赖预检 / warn 执行策略、Windows 环境键归一和明确脚本自身安装边界已有真实测试通过；不把 Corepack 禁网当作 pnpm 无安装保证。
- 测试执行持有同一锁，prepared / running 意图先于执行，保存与读回失败保留现场；取消只处理本次持有的前台 Windows 进程树。场景测试覆盖真实后代停止、异常退出和新进程查询，以上两项是其未覆盖的边界。
- 普通测试结果保持 scope=command / formalDeliveryTest=false，不更新阶段 verdict、next 或归档计数，不成为普通 status / next 的历史读取链。

## OCR delegate 与独立验证

使用 Open Code Review delegate：`ocr delegate preview --format json --exclude '.mendi/**,openspec/changes/archive/**,dist/**,.tmp/**,runtime/**' --background <本轮范围摘要>`，再对 preview 文件与补充文件分别执行 `ocr delegate rule --format json <paths>`。三次均 exit 0；OCR 只提供选择与规则，未调用外部 LLM，语义审核由本 Reviewer 完成。

preview 扫描 211 项，筛选后 `total_files=26`、`reviewed_files=23`、`skipped_files=3`、`coverage_rate=88.46%`。跳过项为 `scripts/proofs/d02-a/selection.ts`、`scripts/proofs/d02-a/test-entry.ts`、`scripts/proofs/mvp-d02-a-explore.ts`：均为既有 Explore 限定 proof，不属于 008 新实施，保留已审结论。默认排除的相关测试、夹具、README 与合同另补审 17 项，逐项结果见 [coverage.json](artifacts/coverage.json)。此比例是文件审核覆盖，不是测试覆盖。preview 与规则原始结果保存在同目录。

| 验证 | 实际结果 |
| --- | --- |
| `pnpm check` | exit 0；78 文件格式 / lint、src / scripts / tests 三配置真正类型检查通过，见 [check.log](artifacts/check.log) |
| `pnpm build` | exit 0，见 [build.log](artifacts/build.log) |
| `node --test --test-concurrency=2 tests/associations.test.ts tests/sequential-changes.test.ts tests/test-entries.test.ts tests/test-execution.test.ts tests/test-dependencies.test.ts tests/archive-concurrency.test.ts` | 24/24 passed，0 fail / skip，约 211 秒；见 [focused.log](artifacts/focused.log)，受控场景输出在 artifacts/scenes |
| 固定 OpenSpec `validate sequential-changes-and-test-entrypoints --strict --json` | exit 0，无 issues，见 [validate.json](artifacts/validate.json) |
| 固定 OpenSpec `instructions apply --change sequential-changes-and-test-entrypoints --json` | exit 0，all_done、28/28；任务勾选不替代本轮 verdict，见 [apply-instructions.json](artifacts/apply-instructions.json) |
| 两个独立故障探针 | 均复现上述 P2，原始输出在对应 JSON |

工程命令设置 `COREPACK_ENABLE_NETWORK=0`、`pnpm_config_verify_deps_before_run=warn`，未运行自动安装；根工程仍出现既有 node_modules / workspace 不同步警告。该环境仅用于本仓库检查，不改变产品 error 预检合同。008 的全量 139/139 回归日志已核对并沿用，本轮只独立重跑受影响集合，不重跑旧 Explore 全流程或正式 Delivery Full Test。两个故障探针的必要方法 / 输入行为和实际结果已保存，临时目录不是唯一证据。

## 维护规模与职责

物理行数独立统计，受控夹具、生成物及历史排除；增长基准为 008 的 `maintenance-before.json`，见 [maintenance.json](artifacts/maintenance.json)。

| 目录 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | `adapters/openspec.ts` 346（+0） | `application/archive.ts` 333（+2） | `core/actions.ts` 320（+0） |
| tests | `action-write.test.ts` 467（+0） | `planning-cli.test.ts` 444（+0） | `query.test.ts` 335（+0） |
| scripts | `proofs/mvp-d01-c-explore.ts` 678（+0） | `proofs/mvp-d01-d-explore.ts` 487（+0） | `proofs/mvp-d01-a-explore.ts` 463（+0） |

本轮 records 264→136、CLI 156→36；提取的 associations、dispatch / output 承担实际校验和呈现职责，未以纯转发压行数。workspace +19、project +13、arguments +21 属于既定接入；新增测试执行按入口解析、进程、存储和应用编排分工，当前未见需先拆分的混杂职责。新增执行测试按场景组织，后续修复在对应组补用例即可。

旧 C / D proof 仍有较长完整流程，但本轮未扩展，仅保留历史限定用途；若以后确需扩展，先分离 Apply 记录流与 Archive 效果组。当前不为行数开独立修订、台账或硬 gate。

## 交接

转交 Author `revise-apply`，只处理 RA-A-001 / RA-A-002 与直接回归，完成后再独立 Review Apply。当前输入仅指向本 Run，008 由固定 authorRunRef 定位；保留全部旧编号及 verdict。

完成后的新进程 status / next 读回见 [readback.json](artifacts/readback.json)。D02 保持 open，D01 保持 closed，累计归档数仍为 4；本 Reviewer 未修改实现、执行根项目 Archive、Git、正式 Full Test / Close / Reopen 或激活下一 Change。
