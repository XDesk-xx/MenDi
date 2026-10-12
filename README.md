# MenDi

MenDi 用 OpenSpec 规格、Delivery、Author / Reviewer、Action 和 Runs 组织项目交付。Agent 完成实际阶段工作，独立 Reviewer 给出结论，CLI 保存当前交接和明确操作结果。

开发规划只维护 [路线图](mendi-foundation-and-delivery-roadmap.md)，协作约定见 [AGENTS.md](AGENTS.md)。安装包中的方法入口是 `skills/actions/` 与 `skills/tools/`；总规划、项目协作约定和开发 Run 属于仓库，不随包复制。

## 开发与检查

当前验证环境为 Windows x64、Node 22.23.2、pnpm 11.22.0、OpenSpec 1.14.1。package 声明 Node `>=22.20.0 <23`，不表示其他 Node 版本、平台或包管理器已验证。

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test
pnpm start
```

`check` 聚合格式、基础 lint 与 src / scripts / tests 的真实 TypeScript 检查；`format` 修正维护代码。`build` 只编译 src 到 dist，`test` 构建后运行根 tests，`start` 无参数显示帮助。历史 Run、生成物和字节敏感夹具不参加批量格式化；工程回归不代替正式 Delivery Full Test。

## 稳定安装与目标准备

在开发仓库构建和打包，然后在仓库外的固定安装目录安装本地包。下面的离线安装要求已有依赖 store；依赖不足时由维护者明确准备，不认证冷安装。

```powershell
pnpm build
pnpm pack --pack-destination D:\work\packages
# 在一个明确的新安装目录中创建 private package.json 后执行：
pnpm --dir D:\tools\mendi\current add --offline --ignore-scripts D:\work\packages\mendi-0.1.0.tgz
node D:\tools\mendi\current\node_modules\mendi\dist\drivers\cli.js --help
```

三处位置分别使用：安装根提供 dist 和 MenDi 自有 Skills；显式目标根提供规则、配置、源码、OpenSpec 材料及目标上游方法；稳定外部 CLI 执行 cwd 为该目标。目标 Run / 产物写入目标，不写安装根。相对输入按目标根解释，跨 cwd 使用明确 `--project`。

目标采用 repo-local OpenSpec / spec-driven。选定外部入口为 `D:/tools/openspec/1.14.1/node_modules/@fission-ai/openspec/bin/openspec.js`，可用 `--openspec-bin <绝对入口>` 选择另一稳定安装的同基线；不回退 PATH 或自动安装。目标上游方法需要明确准备，例如在目标已有配置与规则核对后运行：

```powershell
node D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js init --tools codex --profile core --no-animation
```

所需方法位于目标 `.agents/skills/openspec-*/SKILL.md`，核对 name、非空正文及 `metadata.generatedBy: "1.14.1"`；`metadata.version: "1.0"` 不是 CLI 版本，生成标记不证明正文未修改。只要求当前阶段实际需要的方法，不覆盖项目已有 AGENTS 或规则，不借其他项目 / 开发仓库兜底。准备冲突或基线错误明确报告，Action 不自动 init / update。

## 当前目标操作入口

```powershell
node D:\tools\mendi\current\node_modules\mendi\dist\drivers\cli.js status --project D:\work\target --json
node D:\tools\mendi\current\node_modules\mendi\dist\drivers\cli.js next --project D:\work\target --json
```

`--help` 列出 delivery open / full-test / repair / close / reopen、change bind、action start / continue / instructions / resolve / archive、run save / submit、test list / run / status 和 workspace diagnose。Delivery 范围文件包含 goal、plannedChanges 和依赖；目标已有 Change 才能 bind，首次 Open 不创建 Change。新 Change 激活及 Git、正式 Full Test / Close 等操作仍各守 Owner 授权。

start / continue / Owner 接收交接 / Archive 准备返回自有 `methods.stage`、明确选择的 `methods.guidance` 及当前阶段必需的 `methods.upstream`：上游每项含 name / projectRoot / ref / file / generatedBy / content。即时正文供宿主实际读取，不新增旧 Run 必填字段；query / save / submit / diagnose 不因新增方法扩大前置。

Explore / 修订使用目标 explore；首次 Propose 对已绑定 Change 复用 propose 的产物片段与真实 instructions，跳过 new；修订按 update-change 的适用已有产物规则；Apply / 修订使用 apply-change。选择 Storybook 不取消阶段 OpenSpec 方法。Review 使用自有独立方法，Archive 准备复用 archive-change 指引；原生归档负责一次同步，execute / local-only finish 不新增方法检查。详细步骤与停止边界见对应自有 Skill。

Run 按 `.mendi/runs/<delivery-id>/<操作序号>-<操作名称>/` 或同级 `<序号>-changes/<change-id>/<操作序号>-<操作名称>/` 保存；Delivery Run 连续编号，新 Delivery 从 001 开始，归档 ID 按项目累计成功数独立增长。submitted 历史与 verdict 不改；查询只消费当前必要输入，说明链接和未知 Ref 不成为运行前提。

并发写使用独占锁，错误保留实际现场；诊断不解除锁。Windows 测试结果替换遇到 EPERM / EBUSY 时仅对同一暂存文件有限重试，等待预算 500ms；持续失败或直接输入改变仍停止，不重跑业务命令、不删除原结果或清锁。人工 manual-bootstrap 只支持查询，产品写命令不迁移开发历史。Owner 标签不认证真实身份，工具成功与 ready / all_done 不表示实际完成或批准。

## 显式安装验收

```powershell
pnpm prepare:installation-tests D:\work\current-run\artifacts\installation D:\tools\mendi\acceptance\new-attempt
$env:MENDI_INSTALLATION_SESSION = 'D:\work\current-run\artifacts\installation\session.json'
pnpm test:installation
```

准备程序只使用明确的新目录，正常根构建 / pack 与 pnpm store 环境保留；OpenSpec 的隔离配置不改变 pnpm store。安装 tests 消费已准备环境，缺项拒绝、不自动安装或跳过。正文与原始输出保存在指定证据目录，临时目标可由受控夹具重建，不能作为唯一材料。

## UI 验证入口

Storybook 的依赖、配置、组件、stories 与服务归 UI 目标，宿主连接工具；MenDi 根无需 UI 依赖。使用目标 scripts / 官方 CLI / 浏览器，MCP 按需启用并按实际能力声明，不为无 UI 项目增加前置。完整用法见 `skills/tools/storybook/SKILL.md`。

```powershell
pnpm --dir tests/fixtures/storybook-project install --frozen-lockfile
# 浏览器缺失时由维护者在目标明确准备 Chromium。
$env:MENDI_UI_TARGETS_DIR = Join-Path $PWD '.tmp/ui-new-attempt'
$env:MENDI_UI_EVIDENCE_DIR = 'D:\work\current-run\artifacts\ui'
# 可用 MENDI_UI_PNPM_BIN 显式选择稳定 pnpm 11.22.0 入口。
pnpm prepare:ui-tests $env:MENDI_UI_TARGETS_DIR
pnpm test:ui
```

准备按 fixture 锁文件显式离线安装，要求已有 store；UI 入口检查目标自己的严格类型和实际浏览器。根工程构建用正常环境，目标执行保留严格依赖预检与禁止自动安装。持续预览与有限测试分别记录，修改后取得新结果；未知端口不授予服务停止权。

当前 HTML-Vite / Storybook 10.6.1 实验有明确边界，不要求所有目标统一版本。D03-C 在唯一从空目录建立的 Vue + Naive UI 工程中验证最小真实使用，无 UI 复用工程结果；取消额外新会话恢复和目标正式收口演示，MCP 未认证。旧 PASS 不覆盖新修改，有限测试不代替正式 Full Test。

## 开发交接

当前状态读取[D03 manifest](.mendi/delivery-groups/20261010-03-storybook-and-real-usage/manifest.json)与[045 Delivery Close](.mendi/runs/20261010-03-storybook-and-real-usage/045-delivery-close/run.md)。Owner授权后基于044新整次正式Full Test的passed结果完成收口，当前修复及038优化仍适用；A/B/C已归档、累计10、无活动根Change，D03为closed/manual-bootstrap。历史Run与verdict保持，取消的目标收口不恢复；等待Owner下一指令，本次未执行Git或清理。
