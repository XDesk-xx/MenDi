## 对象、方法与实施结果

Author=`vue-target-author`，固定目标 `D:/Projects/MenDi/tests/fixtures/d03-c-vue-project`，唯一 Delivery=`d03-c-vue-counter` / Change=`implement-naive-counter` / slot=`VUE-COUNTER`。已实际核对 005 Review Propose 为 submitted / complete / approved，固定004，next 为 author / apply / awaiting-instruction；正常阶段在真实 Owner 最简授权内继续，未切 Reviewer 角色。

稳定 MenDi `action start --type apply --role author --actor vue-target-author --tool storybook` 创建当前006。已完整读实际返回的随包 Apply 方法、目标 OpenSpec 1.14.1 apply skill、实际 operation apply instructions 的 contextFiles / tasks，以及已批准 proposal / specs / design；读取 Vue Composition API / SFC / 数据流指导、Vue testing、增量实施、目标产品 Storybook 指导与 Playwright 指导。现有本地 Playwright 入口是根协调按 Owner 已授权验收范围明确指定，优先于 skill 的 npx wrapper 安装示例；没有安装 wrapper 或新 CLI。实际项目操作始终显式本目标 --project，OpenSpec cwd 本目标。

实现唯一 `CounterPanel.vue`：typed props 的初值默认0、disabled默认false；首次取初值到局部ref，加一+1、reset总是0，disabled按钮与处理守卫均保持值。App只挂载同一组件，三个typed stories复用产品组件，以实际DOM断言0→1→0、5→6→0和禁用5不变。组件保持独立计数职责，轻量绿底面板、可辨数值和两个Naive UI NButton；无共享状态系统或额外业务。

接入 `.storybook/preview.ts`、`vitest.config.ts`、storybook / build-storybook / verify:stories scripts 和 mendi.tests.focused。Storybook 10.6.1 plugin 自动应用 annotations，无需重复手写 setup。沿用已有 Vite / TS / lint / 格式基础配置，不改依赖或lock。任务完成时更新当前 tasks；最后实际 instructions 为5/5 all_done，该结构状态不代替行为或审核。

## 真实有限验证及修正

先实际 vue-tsc --noEmit 退出0（4.575s / 300s），受影响维护文件定向格式化退出0，原始结果为 component-typecheck.json / current-format.json。

三次稳定 MenDi 普通 `test run --kind focused --actor vue-target-author --pnpm-bin C:/nvm4w/nodejs/node_modules/corepack/dist/pnpm.js`：

| execution | 实际结果与处置 | 宿主时长 / 180s剩余 |
| --- | --- | --- |
| 001-focused | 退出1、0tests；pretty-format@27 的浏览器 AsymmetricMatcher 读取 global。停止后项，在当前 `.storybook/main.ts` 用 Vite define 将 global 指向 globalThis，仅适配本锁定组合。 | 10.038s / 约169.962s |
| 002-focused | 退出1；Vitest 的 .vue importanalysis 缺少 Vue plugin。停止后项，Vitest mergeConfig 复用现有目标 vite.config.ts。 | 8.759s / 171.241s |
| 003-focused | finished / passed / 退出0，真实 Chromium 中1文件、3tests通过；第三次结果用于当前代码交接。 | 10.292s / 169.708s |

原始输出仅在 `.mendi/delivery-groups/d03-c-vue-counter/tests/001-focused`、`002-focused`、`003-focused` 各自 stdout.log / stderr.log / result.json；本Run的 focused-host-budget*.json 只存实际宿主预算，不复制输出。实际设置 CI=1、verify_deps_before_run=error、COREPACK_ENABLE_NETWORK=0、pnpm_config_offline=true。结果显示 dependencyCheck policy=error / exit0，command policy=warn；日志无下载，不能据此宣称执行全程error policy、冷安装或全面网络阻断。

工程检查在此后的同一当前段完成，spawnSync 有真实单次300000ms timeout、performance.now()时长与剩余时间，失败停止后项。原始命令 / stdout / stderr 单份见 engineering-checks.json：

| script | exit | 实际时长 | 剩余 |
| --- | --- | --- | --- |
| check | 0 | 9.987s | 290.013s |
| build | 0 | 1.575s | 298.425s |
| build-storybook | 0 | 4.838s | 295.162s |

check 实际执行 Prettier只读检查、ESLint --no-fix、vue-tsc --noEmit；现有 include 覆盖 src / stories / 根TS / .storybook。最后只新增交接文字和任务勾选，定向格式 / strict检查结果见 handoff-checks.json，不重复无变化的整套行为测试。

## 官方预览、宿主浏览器与收尾

候选6115查询无监听才启动本次自持官方本地 dispatcher dev（cwd本目标、host127.0.0.1、6115、--ci --no-open --exact-port --disable-telemetry --no-version-updates）。官方 `tools stories preview --attach --port 6115 --input <实际absoluteStoryPath/exportName三stories> --json` 实际退出0；输入来自当前正在维护的story文件，不猜ID，不从server stdout替代tools输出。

官方返回如下，预览已停止，需先启动本目标服务后访问：

- [Default](http://localhost:6115/?path=/story/counter-counterpanel--default)
- [Existing Value](http://localhost:6115/?path=/story/counter-counterpanel--existing-value)
- [Disabled](http://localhost:6115/?path=/story/counter-counterpanel--disabled)

CUA getState 返回 apps=[] / browsers=[]，iab不可用。根协调明确现有目标 Playwright/Chromium 执行方式；使用目标 installed playwright 1.60.0 实际启动 headless Chromium 148.0.7778.96，打开上述真实管理页并进入实际 `storybook-preview-iframe`，不是模拟DOM，也不认证CUA或MCP。

第一轮宿主等待自动play轨迹的内部 waitForFunction 30s超时，pages=[]；browser.close确认disconnected（134ms），自持PTY Ctrl+C退出1（118ms），随后6115查询无监听。第二轮初值观察器没有取得值，而实际iframe已可见0且无页面错误；该观察假设失败，不把未核对其他stories算通过。browser.close 148ms、PTY Ctrl+C111ms退出1，listener-after-preview-002.json确认ECONNREFUSED。两个失败的 browser-observations*.json / official-preview*.json / preview-service*.json 保留，未覆盖，先收尾再修正宿主观察，没有改业务或增加Run。

第三轮先读安装源码 `storybook/dist/preview/runtime.js:36017` 的 shouldEmbed / shouldAutoplay，使用真实iframe URL支持的 `embed=true` 关闭自动play并重新渲染。保留官方管理URL不变，只在实际发现的iframe URL增加受支持参数；避免ExistingValue被自动play重置后误称初值5。直接可见DOM与实际按钮操作结果：Default初值0→加一1→重置0，Existing Value初值5→加一6→重置0；Disabled初值5、两button均disabled，真实HTMLElement.click尝试后仍5。pageErrors=[]、consoleErrors=[]，退出0。截图分别显示手动操作后的默认0、Existing Value重置0、Disabled5；已实际查看默认/禁用截图，数值和按钮完整可见。

原始成功返回 official-preview-003.json、观察 browser-observations-003.json、截图 preview-003-*.png、服务 preview-service-003.json 和监听 listener-after-preview-003.json。browser组内实际 performance.now() deadline170s、各内部步骤min(30s,remaining)，外层真实180s相对计时器到期会向当前持有session发送Ctrl+C；外层报告elapsed为宿主墙钟差，内部报告为单调时长。成功浏览器8.244s / 170s余161.756s，含服务启动/关闭宿主段19.407s / 180s余160.593s，未到期。browser.close有5s上限，实际147.6ms且isConnected=false。当前自持PTY Ctrl+C112ms退出1，是主动停止预览，未冒充有限断言失败；监听核对有2s限，2ms取得ECONNREFUSED，未强杀MenDi或未知PID，未使用taskkill。没有认证未触发的预算负例、全面取消恢复或正式FullTest。

## 实际写入与职责

本Apply主动维护写入仅本目标：

- 工程：新增 src/components/CounterPanel.vue、src/components/CounterPanel.stories.ts、.storybook/preview.ts、vitest.config.ts；修改已有 src/App.vue、.storybook/main.ts、package.json、README.md。已有 .storybook/main.ts / Vite / TS基础配置属于此前准备，不将其算本轮新增。依赖和lock未改。
- 当前规划背景：tasks.md按真实完成勾选；openspec/config.yaml只移除已过时“当前只完成准备”，保留授权/方法背景，不维护重复Run历史。proposal/spec/design未实质修订。
- 当前新增记录：006-apply/run.md 与当前 artifacts 中 body、类型/格式/工程输出、三次focused宿主预算、三轮官方预览/浏览器/服务、两次有限监听及第三轮截图/最后交接检查；MenDi普通tests/001-focused～003-focused各有唯一raw输出。
- 当前交接：MenDi action / delivery当前索引由合法start/save/submit维护；不手改产品状态，不复制目标证据到根。

src维护代码物理行数前三为 CounterPanel.vue 62、CounterPanel.stories.ts 50、App.vue 7（main.ts同为7，排序择App；未维护main）。tests/ 与 scripts/ 不存在，无维护代码可列。增长可靠依据是本次实际新增组件62行与story50行；不补造旧App精确基准或全仓增长。组件内状态/按钮/样式为一个计数面板职责，stories为其3个可观察状态，App只有挂载；当前无继续扩展的混杂职责，无需为压行数创建转发层或独立台账。一次性宿主调用未增维护 browser-check 或通用runner。

## 限制与准确边界

004曾误执行顶层help触发dlx，实际downloaded2 / Packages+211；这是已有真实偏离，缓存/包准备副作用不能归入“所有写入仅目标”或“全过程无下载”。缓存具体位置未逐列，未扫描/清理或改写004。本006只说明已经安装的本地dev/build/tools与实际测试可工作，没有新增安装意图，也不认证冷安装。保留vue-docgen弃用、Vite将来config loader和Storybook chunk警告，无额外任务。

续跑中三次误用MenDi帮助语法只返回invalid-arguments（operation --help、run --help、--project ... --help；前两次亦漏project），没有阶段或文件写入；之后只读实际arguments源码核对真实用法，所有实际项目操作显式project。rg查询不存在的tests/scripts或错误glob仅为只读路径查询失败，不是产品验收通过。

本段实现与有限验收完成，结果供独立Reviewer固定006及实际代码/规划判断；Author无verdict，结构检查不代替语义审核。提交complete后仅交review-apply。ReviewApply approved后待Archive；Archive、正式FullTest/Close、额外恢复Author/runner/负例矩阵、Git、清理、部署均未执行或取消，不计PASS。
