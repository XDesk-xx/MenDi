# Tasks

019 重新 Propose 保留六个工作分组，按可分别确认完成的工作拆为 **23 项，0/23**。分组用于组织范围，不等于一项任务。每项取得所述实际结果后才勾选；等待授权、会话或独立审核的项保持待做，已完成项可以先记录。同阶段准备、检查和修复继续当前 Run，不按任务或命令分别建 Run。详细入口、预算与角色边界见 `design.md`。

## 1. 空工程与稳定入口

- [ ] 1.1 在尚不存在的 `tests/fixtures/d03-c-vue-project/` 用官方 create-vue 建立 Vue / TS 空壳及独立 pnpm workspace。核对来源、目标根和生成配置，无计数器，不复制探针或旧实现；将创建命令和空工程事实记入目标 README / 当前 Run。
- [ ] 1.2 显式准备目标 Naive UI、Storybook、有限测试依赖和 Chromium，保存锁文件与目标格式 / lint / 真正 vue-tsc 检查配置。用实际安装和空工程 `check` 核对版本、独立 workspace、一致 CI 环境与依赖，记录未验证的能力和准备限制。
- [ ] 1.3 初始化目标 OpenSpec 1.14.1 方法，编写目标 AGENTS / context / rules 和稳定入口说明。通过目标 OpenSpec list、实际方法正文及跨 cwd 的稳定 MenDi 读取，核对安装根 / 目标根 / 入口定位正确，不误写根工程或安装位置。

## 2. 真实目标方案与必要审核

- [ ] 2.1 取得具体目标授权后，开启唯一 `d03-c-vue-counter` / VUE-COUNTER，创建并绑定一次 `implement-naive-counter`。以 Owner 原始授权、实际 Open / bind 结果和 list / status 核对唯一 Delivery、槽位和 Change，不重复创建已绑定 Change。
- [ ] 2.2 真实执行目标 Explore，读取 MenDi 返回的目标方法、context / rules 及必要项目事实；仅核对计数器方案的疑点。保存真实 Author Run 与有限结论，核对没有提前实现业务。
- [ ] 2.3 交给实际独立 Reviewer 完成目标 Review Explore。引用其固定 2.2 Author 的真实 Run / verdict；只有批准后继续目标 Propose，Author 不自签或自动派 Reviewer。
- [ ] 2.4 用实际方法和逐项 artifact instructions 形成目标 proposal、计数器业务规格、design 和 tasks。原生 validate 检查结构，并核对目标规则、组件行为、测试入口与新 Author 留待任务进入实际产物；不以文件齐备代替批准。
- [ ] 2.5 交给实际独立 Reviewer 完成目标 Review Propose。核对其审核固定 2.4 的真实方案及 verdict；获批准后才能实施计数器，真实发现问题才修订补审。

## 3. 计数器、Storybook 与目标检查

- [ ] 3.1 按目标受审方案实现 App 挂载的唯一 CounterPanel，覆盖加一、重置到 0、初值和禁用。用必要开发 focused 核对业务行为及 App / stories 共用组件，保存实际结果，不增加无关功能。
- [ ] 3.2 为同一组件编写默认、已有数值、禁用 stories 及交互断言，接入 Storybook Vitest、官方 CLI / browser-check 和设计约定的五项完整集合。用配置、实际 CLI help 和必要开发定向检查核对入口，更新目标使用说明；完整 `verify:stories` 与首次完整 `verify:browser` 留给第 4 组的新 Author。
- [ ] 3.3 完成目标 `check`、应用 build、Storybook build 和实施所需 focused，落实目标维护 TS / .vue 的真正检查归属；必要时只调整根检查配置。记录命令、实际结果与限制，核对根 tsc 没有冒充 Vue 检查，留待的完整验收仍未执行。

## 4. 真实新 Author 恢复与 Apply 审核

- [ ] 4.1 初始 Author 将完整 stories / browser 验收保留未执行、目标对应任务未完成，合法提交当前 Apply continuing。当前交接明确稳定入口、目标、Action / Run 和尚未完成的任务；以真实提交结果及未执行事实核对，不预先做完再演示恢复。
- [ ] 4.2 获明确 Owner handoff / 会话启动授权后，由不继承旧对话的新 Author 从当前记录、真实 methods / Apply instructions 恢复，首次完成留待的完整 `verify:stories` 和 `verify:browser`。实际使用官方 CLI 预览和浏览器核对三个状态、交互与页面错误，保存本次输出、任务变化、真实会话事实和服务收尾，完成目标 Author Apply 交接；不以 Node 进程或换 actor 代替新会话。
- [ ] 4.3 交给实际独立 Reviewer 完成目标 Review Apply，审核固定的实际 Author 工作和当前必要输入。引用真实审核 Run / verdict；只有批准后才进入目标收口，实际问题才修订补审。

## 5. 获授权的一次目标收口

- [ ] 5.1 目标 Apply 独立批准且具体授权成立后执行一次原生 Archive，核对规格同步、活动目录移除、实际归档位置 / 累计数和 status / next。保存直接效果，不重复同步、不复活归档 Change；此处是目标归档，不是根 C 归档。
- [ ] 5.2 在具体授权下用明确受控 reset 故障或已出现的自然业务失败，真实执行正式五项 Full Test。保存正式 failed、业务断言和已执行 / 未执行集合事实；受控注入保留正确基线与实际差异，不冒称自然问题、Reviewer 漏检或普通测试结果。
- [ ] 5.3 从实际 failed 正式 Run 启动目标 delivery-repair，范围内修复 reset=0 并完成所需 focused。保存修复 Author Run、实际差异和 focused 结果；不改归档 Change 的历史记录或 verdict。
- [ ] 5.4 由实际独立 Reviewer 对 5.3 修复执行 delivery-repair 定向补审。核对实际 `--author-run`、修复范围与真实 verdict，批准后才完整重跑；不为每个检查另设审核。
- [ ] 5.5 经定向批准后新整次执行原 `typecheck / build / build-storybook / stories / browser` 正式完整集合。以本次正式 PASS、修复后新浏览器 / 测试结果、整组预算和进程收尾核对，不拼接不同次结果或删减集合。
- [ ] 5.6 按具体授权以 5.5 的新正式 PASS 和实际适用性说明执行首次 Close。核对 closed 查询和旧结果保留；不执行第二轮交付或根 D03 Close。

## 6. 根 C 汇总与独立交接

- [ ] 6.1 汇总 A / B / D02-C 可沿用结论及本次实际接入影响；无 UI 仅引用 / 补验工程结果。按本次变化执行必要根 check / 相关回归并核对目标、安装根和开发根未误写；记录命令、结果和具体适用限制，不机械重跑未变化测试。
- [ ] 6.2 整合上述真实工程、角色与收口结果，在根 C 摘要列出 AGENTS 要求的 `src/`、`tests/`、`scripts/` 维护代码行数前三、可靠增长依据及职责处理时机。核对必要材料受控保存、原始输出只存一份，未完成 / 取消范围如实区分，不追补旧历史或建立台账。
- [ ] 6.3 完成当前根 Author Apply Run，整理当前必要交接材料，逐项报告实际进度并停在根 C 独立 Review Apply。用当前 manifest / status / next 核对交接固定本次 Author，未自签批准、未执行根归档或后续收口。

## 合并 / 取消的子范围

- 无 UI 的 Open、Change 阶段、Archive、正式 Full Test、Close：**方案调整后取消完整生命周期**，仅沿用 / 补验工程结果，不记执行通过。
- 必须出现 changes-requested 或实质修订的演示：**取消**，真实问题才修订补审。
- 两目标的第二轮 Change / 完整审核 / 归档 / Full Test / Close：**取消**。Reopen / 新 Open / 旧 PASS / unknown 的选择边界**合并为旧结论与自动化复用**，实际接入变化才补验。
- 新 Author 恢复、源码修复后的新预览 / 测试和最终汇总：**合并进第 4 / 5 / 6 组**，不是新增项目或开发任务。

## Workflow follow-up

- 根 C 独立 Review Apply 批准后，由 Owner 另行决定根 C Archive；上述第 5 组属于根 C 归档前的目标验收，不是本 Change 的归档步骤。
- 根 D03 的正式 Full Test / Close、Git checkpoint / push / PR / merge 均保持后续独立授权边界。
