## 身份、直接输入与阶段边界

目标 Author / actor=`vue-target-author`。先真实读取 `003-review-explore/run.md`：独立 actor=`vue-target-reviewer`、submitted / complete / verdict=approved、固定 Author=`002-explore/run.md`，阻断 0；MenDi next 实际为 author / propose / awaiting-instruction。已授权的唯一目标、Change / slot 与正常阶段保持，不另建 Open / Change，不重做 Explore。本次只形成规划，未实施业务或自签。

`action start --type propose --role author --actor vue-target-author --tool openspec` 实际创建本 `004-propose`，返回安装包 propose / OpenSpec 工具方法和目标 `.agents/skills/openspec-propose/SKILL.md`，root 真实本目标、generatedBy=1.14.1；已读实际正文，按已绑定 Change 复用产物片段，跳过 new。OpenSpec context 的权威 root 仍是本目标。阶段规划边界与独立 Review 要求均保留。

## 实际 instructions 与产物

依次真实调用 MenDi `action instructions --action implement-naive-counter-004-propose --artifact proposal|specs|design|tasks`，读取每个 instruction / template / outputPath / context / rules；按依赖写 proposal → specs / design → tasks，每步 status 确认直接前置 done，写下游前从磁盘重新读取直接依赖。不是先写 tasks 再以文件存在冒充完整规划。

目标实际 context / rules 将方案收敛到一个组件和必要实际验证；不自动安装、目标内结果、独立审核及取消范围已落实到设计 / 任务，不抄配置全文。design 处理 App / stories 共用、Vitest / 预览接线和预算 / 服务归属的技术决策，符合需要设计的条件，未跳过。

当前正式产物为 `openspec/changes/implement-naive-counter/` 下 proposal.md、specs/naive-counter/spec.md、design.md、tasks.md。唯一 capability 为 naive-counter，4 个行为 requirements / 7 个 scenarios：初次默认0 / 初值5、加一、reset0和禁用不变；规格只写可观察行为。App只组合 CounterPanel；组件使用 typed props、首次初值和局部 ref、Naive UI 按钮，不添加运行时初值同步 / Router / Pinia / 后台或额外抽象。

三个 stories 直接复用产品组件，Default=0→1→0，ExistingValue=5→6→0，Disabled=按钮禁用且保持5；使用现有 Storybook Vitest / Playwright Chromium，verify:stories固定vitest run --project storybook，映射MenDi普通focused。五个tracked tasks均未勾：组件与stories、接线与focused / 使用说明、check / build / build-storybook、官方tools preview / 宿主浏览器 / 收尾、实际结果交接。独立审核及后续待Archive写为workflow信息，不由Author勾为自签。

## Storybook CLI 入口误执行与处置

核对官方CLI时曾误猜一次路径及把package.bin字符串当对象，均报路径不存在 / MODULE_NOT_FOUND，不是目标产品缺项。随后实际读取package.bin并调用目标官方dispatcher的顶层`--help`，该公开入口意外分派到远程@storybook/cli；实际输出downloaded2、Packages+211并退出0。这违反本次“不自动下载”的限制；不是准备PASS，也不认证冷安装。必要原始输出摘录与实际命令单份存`artifacts/cli-help-incident.txt`。

立即停止这条入口并报告根协调者，未清缓存、改安装、启动预览或继续远程调用。只读dispatcher源码确认：dev / build / index / ai / tools / skills加载本地core；顶层help在未找到本地同版@storybook/cli时useRemotePkg=true。根协调者明确继续已有本地tools范围，要求读取真实产品指导；没有申请新Owner授权或扩展范围。

已完整读根`skills/tools/storybook/SKILL.md`（只读）；其明确禁止无子命令--help / npx / dlx，并要求真实tools stories preview / browser。在目标实际调用本地`tools --help`和`tools stories preview --help`，退出0、宿主合计2.580秒；目标配置真实指向本目标.storybook，preview要求运行中Storybook，支持--attach / --port / --input / --json，成功数据含previewUrl。本次只取帮助，不运行preview或页面验收。

后续环境增加COREPACK_ENABLE_NETWORK=0、pnpm_config_offline=true，继续CI=1 / verify_deps_before_run=error；这些策略不称全面网络gate。design明确先确认本次自持dev，再真正tools stories preview --attach取得三个URL，熟悉story文件时用absoluteStoryPath / exportName，否则由实际发现工具取得ID；不以dev stdout / 静态build / 截图代替交互，不用MCP，不遍历多余能力。需要安装或功能缺项时停止报告。

## 结构检查、预算与限制

本次真实OpenSpec status / strict validate按每次spawnSync timeout=30000ms、单调performance.now()执行；status 414ms/剩余29586ms、validate401ms/剩余29599ms，均退出0。status四类规划均done、isPlanningComplete=true；strict validate valid=true / issues=[]。原始stdout / stderr / command / elapsed单份存`artifacts/planning-checks.json`。这些只证明结构 / 文件状态，不证明方案语义、实施或审核批准。

Apply将使用每次普通工程5min、stories / browser3min、内部30s的实际deadline、剩余时间与取消，普通MenDi保留前台Ctrl+C / 持久化机会；不强杀MenDi或未知服务。收尾只限当前持有child / browser，有限taskkill5s / close5s / 监听2s，未确认停止后项如实记录。没有新增通用runner。当前无本次活跃预览或浏览器，因此没有宣称已认证浏览器收尾。

保留既有空壳 / 依赖准备的限定用途，不把023已有文件算本轮新增。冷安装、渲染、交互及真实退出仍待Apply；意外下载事实不消除这些限制。取消的新Author恢复、目标Archive、正式FullTest failure / repair / Close、五项runner、预算负例、Git和清理不计PASS。

## 本轮实际写入与固定交接

- 维护工程：本Propose没有修改src、配置、package、lock或README；业务仍是官方空壳。
- 当前规划：新增本Change的proposal.md、specs/naive-counter/spec.md、design.md、tasks.md（当前draft内收敛过preview入口）。
- 目标新增记录 / artifacts：本004-propose/run.md及artifacts/body.md、cli-help-incident.txt、planning-checks.json；产品为start / save / submit更新当前Action与Delivery / binding交接元数据。
- 历史：001 / 002 / 003及其正文 / artifacts / verdict未改；根MenDi、其他fixture和稳定安装未主动修改；顶层CLI意外远程runner的缓存副作用如上保留，未清理。

固定审核输入为本Run、上述四类当前规划、直接已批准Explore/ReviewExplore、目标AGENTS / README / OpenSpec config和必要当前package / TS / Storybook配置；原始结果只在目标。完成提交后停独立ReviewPropose，不启动Apply，不由Author填verdict。
