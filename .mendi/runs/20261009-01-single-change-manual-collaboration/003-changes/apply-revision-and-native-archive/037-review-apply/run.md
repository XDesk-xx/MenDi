---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: apply-revision-and-native-archive
planningSlot: MVP-D01-D
actionId: apply-revision-and-native-archive-review-apply-01
actionType: review-apply
role: reviewer
run: "037"
status: completed
result: changes-requested
date: 2026-10-10
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/036-apply/run.md
---

# MVP-D01-D Review Apply

**verdict：changes-requested。** 独立审核 [036 Apply](../036-apply/run.md)，以 035 批准后的当前方案、三份 delta 和任务为合同。现有 111 项测试全部通过，但新增两项定向复现发现归档效果识别与尝试分配的缺口；修复后再独立补审，当前不能进入 Archive。

## RA-D-001 / P1：原生合法退役能力后无法完成本地交接

位置：`src/adapters/archive-effects.ts:224–237`，特别是第 227 行无条件读取受影响主规格。

当 `.openspec.yaml` 声明 `retire_capabilities: true`，REMOVED delta 删除某能力最后一条需求时，固定 OpenSpec 1.14.1 会合法删除该能力的主规格并归档 Change。当前 prepare / execute 前置接受这个输入，原生命令真实 exit 0、响应报告 removed=1 和 capability retired；活动 Change 与主规格都已消失。但效果检查仍读取主规格，抛 ENOENT，Run 留在 invoking、计数未提交。原写者退出并按测试约定处置锁后，新进程 local-only finish 再次遇到同一 ENOENT；execute / rollback 又不接受 invoking，无法通过当前接口完成交接。

**修订要求：**在本次有限输入和退役声明下识别合法“主规格应不存在”的效果，仍拒绝意外丢失、未删除完的需求和不一致元数据；若本版明确不支持退役，则必须在原生调用前拒绝并明确边界，不能先产生不可回退效果再停止。优先补齐受审原生 REMOVED 的效果读回，不引入新的同步引擎、历史依赖或恢复框架。

补入分组产品测试：真实原生退役、成功本地收口、新进程 finish 与重复 finish；普通意外缺失仍拒绝。复现源和原始结果见下文。

## RA-D-002 / P2：调用阶段提交失败后，attempt 目录永久与下一尝试重号

位置：`src/application/archive.ts:233–251`，特别是第 241 行独占创建 attempt 目录。

execute 先按 `archive.attempt + 1` 创建目录、写 inputs / invocation，然后才替换 Run 的 invoking 信息。在既有 `before-run-commit` 提交点真实退出后，attempt-001 已存在，但持久 Run 仍是 prepared / attempt=0，原生尚未调用。原进程退出、测试锁按约定处置后，再次显式 execute 仍分配 attempt-001，立即 EEXIST；每次重试相同。finish 拒绝 prepared，next 却继续提示 execute。合法 Owner rollback 虽能另建修订，但会为一个没有实施变化的存储中断重新走 Author / Review。

**修订要求：**让尝试占号与持久阶段在这个明确的调用前失败窗口可继续，例如保留旧目录并为新显式执行安全分配未用尝试号；不能覆盖旧证据或据目录存在猜测原生已执行。处理范围限当前 Archive 的尝试，不要求任意掉电恢复或全历史扫描。补 prepared 首次尝试以及已保存 none 的重试在同一提交点失败的用例，证明新进程显式执行可达、旧目录保留、原生调用和归档计数仅在实际执行后增长。

## 独立检查与证据

| 检查 | 实际结果 |
|---|---|
| `pnpm check` | exit 0；格式、基础 lint、src / scripts / tests 真正 TypeScript 检查通过；[日志](artifacts/check.log) |
| `pnpm test` | exit 0，内含 build；111/111 通过，无跳过；[日志](artifacts/test.log) |
| 固定 OpenSpec `validate apply-revision-and-native-archive --strict --json` | exit 0，valid=true、issues=[]；[结果](artifacts/strict-validate.json) |
| `node <本 Run>/artifacts/recovery-probes.ts` | exit 0，两项缺陷断言均复现；[TS 源码](artifacts/recovery-probes.ts)、[原始结果](artifacts/recovery-probes.log) |
| 对上述 TS 源码运行 `pnpm exec tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --allowImportingTsExtensions --esModuleInterop --strict --skipLibCheck <文件>` | exit 0；[日志](artifacts/probe-typecheck.log) |

复现从仓库根运行，复用受控测试夹具，在 `.tmp` 新建隔离项目；没有归档本项目 Change。源码包含重建输入，正式结果已存本 Run，临时目录不承担唯一证据。第一次复现已确认退役问题，随后因测试 worker 只输出外层错误而使 Reviewer 的 EEXIST 文本断言失败；已将该处改为读取真实 CLI JSON，再完整运行两项复现成功；[初次日志](artifacts/probe-initial.log)保留。未改产品实现。

035 所要求的 RP-D-001 两处中断恢复、none 后显式 execute / Owner rollback、已确认效果的本地提交中断、原生响应异常、真实进程竞争和只读查询均在本次完整回归中通过。上面两项属于新增边界复现，现有测试通过不能覆盖它们。全部任务已勾选只代表 Author 状态；本次为 Change 工程审核，不是正式 Delivery Full Test。

## OCR delegate 覆盖

使用 `open-code-review-delegate` Skill，OCR 仅做确定性的选文件与规则解析，由当前独立 Reviewer 给出结论，没有调用 OCR 的外部模型。

- `ocr delegate preview --format json`：workspace 共 198 项；可审核列表 `total_files=136`、`reviewed_files=24`、`skipped_files=112`、`coverage_rate=17.65%`。每个 `(path,status)` 已列明处理，accounted_rate=100%。
- 大量新增文件实际属于本 Change 早先 030–035 的历史证据及 Author 原始输出；按具体原因跳过逐文件重审，沿用有效 Explore / Propose 结论，不重复全量历史审计。旧 D proof 保留限定 Explore 用途。
- OCR 默认排除的测试、Markdown 方法、当前方案及直接交接另行人工补查 28 项，其他 34 项保留跳过原因。本次产品代码和修改 / 新增测试均已核对；不将较低的全工作区历史材料重审比例伪称为全文件审核通过。
- 对 preview 可审核路径执行 `ocr delegate rule --format json <paths...>`，按适用的 TS / JSON / YAML 规则核对。文件清单、规则、逐项处理及结构化 findings 分别见 [preview](artifacts/ocr-preview.json)、[rules](artifacts/ocr-rules.json)、[coverage](artifacts/ocr-coverage.json)、[findings](artifacts/findings.json)。

## 行数与维护观察

按维护的 `.ts` 物理行数计，含空行；每类前三名如下。基准为当前 HEAD 中已有文件，D proof 已在本 Change Explore 阶段形成，不算本次 Apply 新增验收代码。

| 类别 | 文件 | 当前行数 | 可靠基准 / 判断 |
|---|---|---:|---|
| src | `src/adapters/openspec.ts` | 346 | 317 → 346；新增公开操作入口，协议解析已独立 |
| src | `src/application/archive.ts` | 338 | 新增；负责 execute / finish 编排，准备、效果检查与提交已分离 |
| src | `src/core/actions.ts` | 320 | 282 → 320；阶段、Run 和 next 规则，Archive 字段解析已独立 |
| tests | `tests/action-write.test.ts` | 467 | 基准同值；原写入领域测试，未追加 D 大流程 |
| tests | `tests/planning-cli.test.ts` | 444 | 基准同值；C 规划流程限定保留 |
| tests | `tests/query.test.ts` | 335 | 基准同值；新增归档查询单独分组 |
| scripts | `scripts/proofs/mvp-d01-c-explore.ts` | 678 | 基准同值；限定旧 C Explore，不继续扩展 |
| scripts | `scripts/proofs/mvp-d01-d-explore.ts` | 487 | 030 Explore 已形成；本次不承载新产品验收 |
| scripts | `scripts/proofs/mvp-d01-a-explore.ts` | 463 | 基准同值；限定旧 A Explore |

`application/actions.ts` 已由 466 降到 243，指引、Owner 处置与共享直接输入检查按职责拆开，CLI 直接接线，没有纯转发层。新的回退、协议、归档效果 / 执行 / 故障 / 并发 / 查询测试按场景分组。当前不因数值要求额外拆文件；修复上述问题时优先落在所属模块和对应场景组，若继续给 archive 编排增加独立职责再整理。旧 proof 如确需扩展，先按既定规则拆开 Apply 记录流与 Archive 效果组。

引用仍限当前必要 Run / 直接批准 / 当前 attempt；查询不读取历史批准、归档内容或未知 Ref。有限输入副本用于本次效果判断，没有新增全量 hash、历史链、行数 gate 或独立维护台账。无需为格式或提示再开一轮修订。

## 交接

下一步 Author `revise-apply`，直接修订 036，处理 RA-D-001 / RA-D-002 后提交新的独立 Review Apply。本轮不要求重做 Explore 或重新生成全部方案；如选择改变退役支持范围，则同步说明受影响的方案边界。旧 Run、035 批准与 036 原结果保留。Delivery 仍 open，当前 Change 活动、未归档，累计归档数仍 3；本轮止于审核交接。
