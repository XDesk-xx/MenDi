---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-apply-01
actionType: apply
role: author
run: "013"
status: completed
actionStatus: completed
result: implemented-with-regression-limitation
nextAction: review-apply
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/012-review-propose/run.md
---

# MVP-D03-B Author Apply

Owner 指令 apply；承接 [012 独立 Review Propose](../012-review-propose/run.md) 批准的 011。保持 Author，按当前 instructions 返回的 sourcePath / line 逐项核对、勾选并重新读取进度。本轮正常检查和修复均记录于 013，完成停在独立 Review Apply，没有 Reviewer verdict。

## 实施

- `src/adapters/methods.ts` 共用普通文件 / YAML / 非空正文读取，新增当前目标固定路径、name / metadata.generatedBy 1.14.1 和受管路径 / junction 检查。保留安装根 stage / guidance；即时 upstream 返回真实目标、文件、正文，不写 Run 新必填字段或缓存快照，不回退别处。metadata.version 1.0 与生成基线区分，不宣称正文未修改认证。
- start / continue、Owner resolve 的实际接收阶段、Archive 准备共用组合入口，在锁前及锁内 createRun 前读取必要方法。缺方法写前拒绝、恢复后新进程取得新正文；锁内变化按既有失败规则处理。Reviewer 不依赖 Author 方法，Delivery、查询、instructions、save / submit、diagnose 和 Archive execute / finish 的方法前置保持原规则。
- 自有 Explore / Propose / Apply、OpenSpec 工具、Review 和 Archive 指导明确目标来源、修订条件、实际产物工作与停止边界。首次 Propose 对已绑定 Change 跳过 new；Archive 只执行既有一次 native 同步，finish 本地观察。Storybook 可选指导与阶段 OpenSpec 方法并用，不成为无 UI 目标前置。
- 新增受控 TypeScript `prepare-installation-tests.ts` 和 `tests/installation/handoff.test.ts`，显式新目录 build / pack / 仓库外离线安装、双目标准备；测试入口只消费 session，缺项拒绝，不安装或跳过。普通 `pnpm check` 真正覆盖新 scripts / tests；旧 Explore proof 不扩写。
- UI results 复用既有 pnpmEntry，正常根构建与目标严格预检分工保留。README 收敛稳定安装、目标准备、CLI / Skills、支持范围与开发状态入口；OpenSpec context 保留必要背景和原 operations guidance。升级仅路线图后续预留，B / C 与依赖不变。

## 实际验证与必要材料

| 检查 | 实际结果 | 材料 |
| --- | --- | --- |
| `pnpm check` | exit 0；格式 / lint 136 个维护文件，src / scripts / tests 三个 tsc 配置通过 | [check.log](artifacts/check.log) |
| 方法 / 写前失败 / 角色边界定向测试 | 11/11 passed，0 skipped | [focused.log](artifacts/focused.log) |
| `pnpm test` | exit 1；203/204 passed、1 failed、0 skipped；唯一失败为夹具提交，组复验 3/3 passed。未将首轮声明为全通过 | [regression.log](artifacts/regression.log) |
| Archive 查询组复验 | 3/3 passed，0 skipped | [archive-query-recheck.log](artifacts/archive-query-recheck.log) |
| 同类 Archive 夹具连续创建与提交 | 15 次正常；新目标，不操作失败现场 | [archive-fixture-write-recheck.log](artifacts/archive-fixture-write-recheck.log) |
| 显式新安装准备 + `pnpm test:installation` | 安装在 D:/tools/mendi/acceptance/d03-b-013-03；实际构建 / 打包 / 离线安装与 OpenSpec 初始化 / 双目标 bind 成功，1/1 安装场景 passed | [prepare](artifacts/installation-prepare-final.log)、[test](artifacts/installation-test.log)、[session](artifacts/installation-03/session.json) |
| 缺安装准备 | 明确拒绝，没有安装、跳过或测试结果成功 | [installation-unprepared.log](artifacts/installation-unprepared.log) |
| 另一真实稳定 pnpm 入口的 UI 有限结果场景 | 1/1 passed；严格目标类型 / Chromium 先核对，实际命令来自 Corepack 缓存 11.22.0 入口 | [ui-prepare.log](artifacts/ui-prepare.log)、[ui-results.log](artifacts/ui-results.log)、[commands](artifacts/ui/finite-results/commands-8004.jsonl) |
| 缺 pnpm 入口 / 实际错版本 | 缺文件拒绝；11.9.0 实际输出被 test-tool-version 拒绝，未执行目标脚本 | [missing](artifacts/pnpm-invalid-entries.log)、[wrong-version](artifacts/pnpm-wrong-version-verified.log) |
| 固定 OpenSpec strict validate 当前 Change | exit 0、valid=true、issues=[] | [change-validation.json](artifacts/change-validation.json) |

安装验收实际使用编译包与随包方法，从 beta cwd / 安装 cwd 指向不同目标，核对未选目标和安装根无写入；实际缺方法 start / continue 拒绝并保护 manifest / 旧 Run，恢复重新读取新正文。Reviewer 数据明确为接收路径夹具，不构成根 Change 的独立批准。[handoff commands](artifacts/installation-03/handoff/commands.jsonl) 与 [Apply + Storybook](artifacts/installation-03/handoff/apply-storybook.json) 保存实际输出。

Agent 实际读取产品返回的 openspec-propose 全文、自有指导及逐项 instructions，核对目标 context / rules、源码与已有规格后，按依赖编写 proposal、local-notes delta、design、tasks。无网络、本地 data/note.json、错误保护和路径边界进入实际内容。固定 strict validate 通过，list 仍只有 local-note-work、0/5；源码及 AGENTS 直接字节比较与受控输入相同。规划未实施，必要产物副本在受控证据目录，见 [真实使用摘要](artifacts/installation-03/handoff/agent-use.md)、[规划副本](artifacts/installation-03/handoff/planning-artifacts/proposal.md)、[validation](artifacts/installation-03/handoff/planning-validation.json)、[list](artifacts/installation-03/handoff/planning-list.json)。

UI 有限测试基线 passed，注入实际增量缺陷 failed，修复并更新文字取得新 execution passed；旧结果文件字节保持原样。真实浏览器显示确认次数 2 → 3、disabled=true、pageErrors=[]；已查看截图，只证明本次渲染与交互。预览由测试自身 child 收尾，child / pipes 关闭且监听不可用。见 [results](artifacts/ui/finite-results/results.json)、[browser](artifacts/ui/finite-results/browser/browser.json)、[截图](artifacts/ui/finite-results/browser/counter.png)、[stop](artifacts/ui/finite-results/preview-stop.json)。

## 失败、修正与限制

第一安装准备将 OpenSpec 隔离 XDG_DATA_HOME 也传给 pnpm，导致离线 add 使用空 store 而失败。修正为正常 pnpm store 环境，仅 OpenSpec / 产品命令使用隔离配置，后续新目录安装通过；失败日志和现场保留于 installation-01，未放宽产品依赖预检。安装 02 通过，随后更新简短文档重新打包得到最终 03；format 仅整理准备脚本一处，没有行为变化。

首轮快速回归中一个既有 Archive 查询用例在准备夹具的 run-submit 失败，尚未执行用例查询断言；现场有草稿、已写提交临时文件和锁，见 [失败现场副本](artifacts/failed-fixture/manifest.json)。该组新目标复验 3/3 和 15 次同类提交均通过。没有确认原始底层错误码，不能断言具体 Windows 原因；生产提交协议与保留现场规则未改，失败不抹除，也不据重复通过证明不存在偶发写入失败。

错版本负例最初在带 packageManager 的目标调用 pnpm 11.9.0 入口，实际自动选择已准备的 11.22.0，因此不是实际错版本；不以目录名代替真实输出。改在无项目版本声明的只读 D:/tools cwd 取得 11.9.0，真实预检拒绝。初次负例和命令包装错误输出保留，不作为最终证据，不修改产品预检。

实际支持仅 Windows x64、Node 22.23.2、pnpm 11.22.0、OpenSpec 1.14.1、已有 store 的明确离线准备；声明的 Node engines 范围不认证所有组合。不认证冷安装、多布局 / 版本、WebCodex、MCP、Vue、C 的完整实际交付。旧 Archive 和 A 的未变化结论限定沿用。

## 维护观察

本次读取维护 TypeScript 的物理行数，不含 node_modules / 生成物。修改前现场与修改后 [counts](artifacts/line-counts-after.json) 的三个目录前三均相同：

| 目录 | 文件 | 行数 |
| --- | --- | --- |
| src | src/application/delivery-full-test.ts | 401 |
| src | src/adapters/openspec.ts | 346 |
| src | src/adapters/lifecycle-store.ts | 336 |
| tests | tests/action-write.test.ts | 467 |
| tests | tests/planning-cli.test.ts | 444 |
| tests | tests/delivery-repair.test.ts | 394 |
| scripts | scripts/proofs/mvp-d01-c-explore.ts | 678 |
| scripts | scripts/proofs/mvp-d01-d-explore.ts | 487 |
| scripts | scripts/proofs/mvp-d01-a-explore.ts | 463 |

受控修改前现场与本轮未变的 HEAD 代码可核对 methods.ts 45 → 107、actions.ts 265 → 273、action-resolution.ts 220 → 221、archive-prepare.ts 144 → 145。方法 adapter 的增长来自共用文件解析、目标安全读取、固定映射和输出组合，职责仍为方法读取，没有协议执行混入；原接收模块仅增加实际接线，未增加纯转发层。新增安装准备 / 安装 tests 各管环境准备与验收，实际 Agent 规划单独保存实际材料而非把 Agent 工作模拟为脚本 PASS。

最大的 delivery-full-test.ts、openspec.ts、lifecycle-store.ts 本轮未增长；各自有流程协调 / 外部工具 / 生命周期持久化职责，若后续扩展时出现混杂先整理。旧 C / D 长 proof 仍限定历史 Explore，用途不扩大，本轮未扩写；将来确需扩展先拆 Apply 记录与 Archive 效果组。本轮没有硬行数、hash 或证据数量 gate，也不建立独立台账。

## 独立 Review Apply 交接

当前必要 Author 输入为本 013。独立 Reviewer 核对实际目标方法与锁内占号前接线、Owner 接收和 Reviewer 角色、旧记录 / 必要输入边界、安装包真实来源与 Agent 规划、Storybook 并用及实际 pnpm 新结果；特别读取首轮夹具失败及定向复验，判断当前实现与保留现场行为。

D03 保持 open / manual-bootstrap，A archived、B active、C 未激活、累计归档 8；012 及以前 Run / verdict 保留。不执行根实际 Archive、Git 操作、正式 Delivery Full Test / Close、下一 Change 或清理 `.tmp` / 安装现场。

