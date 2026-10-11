---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-apply-01
actionType: apply
role: author
run: "023"
status: submitted
actionStatus: in-progress
outcome: continuing
result: preparation-partial
nextAction: continue
nextRole: author
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/022-review-propose/run.md
---

# MVP-D03-C Author Apply · 第一段工程准备

依据固定 [022 Review Propose](../022-review-propose/run.md)：Reviewer / completed / approved，固定 021，D03C-RP-001 只在方案层关闭。已读取真实 Apply instructions、当前 proposal / design / tasks、自有 Apply 方法和 Vue 指引。Owner 本轮明确分段实施，完成一部分后等待确认；当前保持 Author，本段结束提交 **continuing**，同一 Action 尚未完成，不交 Review Apply、不自签。

根仍为 manual-bootstrap；按现有人工记录方式组织本次 Run，不调用产品写命令迁移根历史。后续 Owner 确认后，以 continue 新建 Run、保留 actionId，不再修改已提交 023 或其 artifacts。本段没有创建下一 Run。

## 实际完成与待做

唯一目标 [d03-c-vue-project](../../../../../../tests/fixtures/d03-c-vue-project/README.md) 从此前不存在的目录调用官方 create-vue@3.24.0 --ts --bare --eslint --prettier 生成，保留官方空壳，没有复制探针或旧夹具。

- **1.1 完成**：官方生成命令、独立 workspace、空壳来源与目标路径已核对，目标 README 保存实际入口；没有 CounterPanel、计数器或 stories。
- **1.3 完成**：固定 OpenSpec 1.14.1 init codex/core，目标 AGENTS / context / rules 与方法已准备；三份实际生成方法为 1.14.1，与当前已读取的选定方法正文一致，见 [方法核对](artifacts/target-methods-readback.json)。从稳定安装 cwd 显式 --project 读取目标 status / next，nearest 根是该目标，local=null、next=delivery-open，证明目标定位，不证明开启或阶段实施。
- **1.2 部分完成，未勾选**：依赖 / Chromium、锁文件、目标格式 / ESLint / vue-tsc、最小无 stories 的 Storybook 框架配置与必要基础验证已完成。但真正的超时 / Ctrl+C / 停止确认负例未执行；准备调用的跨进程续程也不能当作同一单调时钟的完整实现认证，后续当前范围补验。因此保留待做，不靠正常退出提前关项。
- 2.x–6.x 均待做。目标 Delivery / Change 尚未建立，真实角色、组件、stories、有限执行脚本与业务验收未实施。初始 Author 留待的新会话完整 stories / browser 集合尚未执行。

当前 [Apply 进度](artifacts/apply-instructions-progress.json)：**2/23，remaining=21**。六组 23 项及受审方案保持；只更新 1.1 / 1.3 的 checkbox，没有把准备、取消或 Reviewer 工作记成业务通过。

## 维护文件与范围

- 新目标目录：官方空壳源码、目标依赖 / 锁 / 独立 workspace、检查与最小 Storybook 配置、目标 OpenSpec / 生成方法、AGENTS / README。目标 typecheck 真正覆盖 SFC、根 TS 配置及后续 .storybook / scripts / tests，格式 / lint 排除历史 Run、生成方法与生成物。
- 唯一必要根工程配置：[tsconfig.tests.json](../../../../../../tsconfig.tests.json) 排除这个独立 Vue 项目，由目标自身的 vue-tsc 检查，不借根 tsc 认证 Vue。
- 根当前 Change tasks、README、OpenSpec context、manifest 仅更新本段进度与当前继续入口。
- 本 023 Run / artifacts 保存当次调用源码和结果。宿主 TS 源只用于记录本段固定准备调用，不导出通用接口、不改产品 CLI / 自有方法，不作为后续 continue 向旧 Run 写入的入口。

没有写入其他 Change、旧 proof、已提交 Run / artifacts / verdict；没有删除、移动、重编号或批量格式化历史。官方脚手架中生成的 ESLint 配置在当前新目标内使用 TS；这是新工程准备，不是历史迁移。未复制旧证据树或建立 hash 清单。

## 命令、结果与修正

完整实际命令 / cwd / 退出码 / 日志只保存于各对应 JSON，索引见 [commands-summary](artifacts/commands-summary.json)，不把输出复制多份。摘要如下：

| 实际检查 | 结果与用途 |
| --- | --- |
| pnpm --version；官方 create-vue | exit 0；pnpm 11.22.0，直接生成此前不存在的唯一工程 |
| 目标 install；playwright install chromium | exit 0；显式准备，不在运行命令中隐式下载；不认证冷安装 |
| OpenSpec init / list；稳定 MenDi status / next | exit 0；目标根与方法正确，目标没有 Delivery / Change |
| 目标 check | exit 0；只读 Prettier、基础 ESLint、真实 vue-tsc；最小 Storybook 配置和纯 ESLint 修正后再次通过 |
| SFC 类型负例 / 恢复 | 临时给当前 App.vue 加入 string=1，exit 2 / App.vue TS2322；finally 恢复该当前文件字节，恢复后 exit 0。不是业务实现或正式失败 |
| 空应用 build | exit 0；只说明当前空壳可构建 |
| Storybook --version / tools --help | 10.6.1；最初无 .storybook/main.ts 退出 1，新增无业务最小配置后退出 0。未启动预览、未 attach 其他项目服务，不认证交互或所有 CLI 能力 |
| 根普通 pnpm check | exit 0；137 文件格式与基础 lint、原有三个真正 tsc 检查通过。workspace 指纹变更警告保留，不代替实际检查，不重装根依赖 |
| OpenSpec strict validate / Apply instructions | exit 0；skip_specs INFO，进度 2/23，只读结构结果 |
| 当次四份宿主 TS 调用源 | 各使用现有 TypeScript 编译器的 strict / noEmit / nodenext / node types / erasableSyntaxOnly 真正检查，exit 0；不以 node 跑通代替类型检查 |

当前直接依赖版本见 [versions-readback](artifacts/versions-readback.json)：Vue 3.5.43、Naive UI 2.45.3、Storybook / vue3-vite / addon-vitest 10.6.1、Vite 8.3.0、vue-tsc 3.3.13、TypeScript 5.9.3、Vitest / browser-playwright 4.1.11、Playwright 1.60.0；基础 ESLint 10.12.0 / Prettier 3.9.6 由本次官方脚手架和目标锁文件固定。

正常修正均在当前未提交 Run 内进行，原失败保留：

1. tools help 的项目配置加载失败，补最小 main.ts 后重试。工具只读发现外部 LP 服务，不把它归为本次服务，不连接、停止或修改它。
2. 官方 --eslint 模板默认带 Oxlint / eslint-plugin-oxlint，首次安装确实包含它们；没有执行 Oxlint。为只维护方案需要的基础 ESLint，当前目标已移除这些直接依赖与禁用 ESLint 规则的插件。移除后 CI 的 install 因冻结锁不匹配退出 1，显式 --no-frozen-lockfile 更新该新目标锁后通过，保留原失败。
3. 初次根 check 被错误套用目标 CI=1，严格预检报 enableGlobalVirtualStore；去掉该目标环境后严格预检又报新增目标的 workspace 结构指纹。根 package / lock 未改、依赖不重装；按根普通 warn 模式执行真实 check，实际通过并保留指纹警告。不以该环境适配引入新 gate 或重验历史。

## 预算与进程限制

首次宿主准备在同一 Node 上用 performance.now() 建立一次 10 分钟 deadline，各步取 min(5 分钟, remaining)，保持活跃 child、日志、取消状态与有限停止路径。它在 tools help 失败处结束，不伪装成整个准备已一次通过。

后续修正调用据原首命令日志时间 / 耗时保守扣减（额外扣 1000ms，计入诊断间隔）剩余预算，没有每步重新取得 10 分钟；该跨进程办法**不是原单调时钟的继承证明**。各续程实际余量保存于 resume-budget*.json，末次普通根检查启动时约剩 124 秒，12.6 秒关闭。当前没有发生预算到期或主动取消，不能据此认证这些分支。

所有实际命令收到 close，必要日志保存；当前 [目标 / 准备 Node 进程核对](artifacts/processes-readback.json) 为空。本段只下载 / 核对 Chromium，没有启动浏览器或持续预览，不宣称已完成浏览器子树停止验证。短时正常 / 超时 / 取消 / 未确认停止仍按受审 §5 在后续必要部分补验；未变化的 D02 / A / B 结果直接沿用，不机械重跑。

## 维护代码行数与职责

[当次统计](artifacts/maintenance-size.json) 不含依赖、生成物与历史 Run，直接基准为只读 HEAD 中这些维护文件；没有补造全量增长或独立台账。

| 类别 | 行数前三 |
| --- | --- |
| src | application/delivery-full-test.ts 401；adapters/openspec.ts 346；adapters/lifecycle-store.ts 336 |
| tests | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 |
| scripts | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 |

前三文件行数与直接 HEAD 基准相同，本轮没有扩展这些文件。新增目标维护代码共 59 行：App 空壳、挂载、类型声明、Vite / ESLint / Storybook 配置，职责分开，没有阶段执行 / 审核 / 归档混入 UI 脚本。根 Full Test 文件承担同一操作的准入 / 执行 / 收口；当前未扩展它或旧完整流程 proof，不为行数无关重构。若后续确需扩展混合职责，按 AGENTS 先整理相关职责，旧 proof 需扩展时先分 Apply 记录与 Archive 效果组；没有硬行数门槛或纯转发层。

## 当前 continuing 交接

本段按 Owner 请求停止，保留 [后续操作说明](artifacts/next-operations.md)；本次没有申请或执行目标 Open / 新 Change，也没有提前指定 / 启动新 Author 或 Reviewer。后续最先承接当前进度与 1.2 必要补验，具体目标生命周期只有明确授权后才执行；当前 next 只引用本 023，不累积所有旧 Run。

根 Action 保持 real-target-delivery-acceptance-apply-01 / in-progress，Run 提交 submitted / continuing。Owner 确认后 continue 新建 Run，承接本次；当前不提交 complete 或触发中途 Review。根 C 完整实施后才交独立 Review Apply；目标方案批准、目标 Archive 前 Review Apply、正式修复后重跑前定向审核仍必须真实成立。

本段没有目标或根 Archive / 正式 Full Test / Close、Git 写入、目录清理、角色切换、子智能体启动或跨会话消息。根 manifest / README / OpenSpec context 及稳定入口读回保存当前 continuing 边界，manual-bootstrap / executable=false 保持。
