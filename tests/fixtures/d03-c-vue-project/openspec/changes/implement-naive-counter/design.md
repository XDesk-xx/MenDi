# Design

## Context

动机见 proposal。已批准 Explore 确认目标仍为官方空壳；现有 Vite 已接 Vue plugin，`.storybook/main.ts` 已配置 vue3-vite 和 `src/**/*.stories.ts`，暂无业务 / stories。安装依赖可导入 NButton、storybookTest 与 Playwright provider，Chromium executable 存在；这些结论尚不认证渲染或浏览器收尾。

本设计处理 App / stories 共用状态组件、测试接线与有限预览归属的技术决策，因此创建 design。业务合同见 `specs/naive-counter/spec.md`，不重新创建或复制目标。

## Goals / Non-Goals

**Goals:** 一个有明确输入的组件同时服务 App 与三个 stories；测试直接操作产品控件；目标真实 Vue 类型检查覆盖维护配置和 stories；每次执行使用实际预算并确认自己持有服务的退出。

**Non-Goals:** 无共享状态系统、受控双向绑定、运行时初值同步、额外 composable / 转发层、独立前端 CLI、通用进程 runner 或测试负例矩阵。保留范围与取消项见 proposal。

## Decisions

### 1. 单一组件与明确初值

| 文件 | 职责与合同 |
| --- | --- |
| `src/App.vue` | 只挂载 CounterPanel，不复制状态或处理函数 |
| `src/components/CounterPanel.vue` | `initialCount?: number` 默认 0；`disabled?: boolean` 默认 false；局部 count 保存首次初值；无 emits / v-model |
| `src/components/CounterPanel.stories.ts` | 复用同一组件，定义三个状态和可观察断言 |

CounterPanel 使用 `<script setup lang="ts">`、typed props 和 `ref`，不修改 props。提供清晰当前数值以及“加一”/“重置”两个 Naive UI NButton。未禁用时 +1，每次重置到 0；禁用时按钮 disabled 且事件处理保持值。初值只用于首次初始化，不增加 watch 同步；无需调用方控制每次更新。组件单一计数职责无需额外 composable；把实现放 App 会阻碍 stories 共用，因此不选。

### 2. 三个 stories 覆盖规格

| Story | 参数 | play 断言 |
| --- | --- | --- |
| Default | 无 | 0 → 点击加一 → 1 → 点击重置 → 0 |
| ExistingValue | initialCount=5 | 5 → 加一 → 6 → 重置 → 0 |
| Disabled | initialCount=5, disabled=true | 两按钮禁用；尝试控件操作后仍为 5 |

使用 `@storybook/vue3-vite` typed Meta / StoryObj 和 `storybook/test` 的 canvas / userEvent / expect；断言读可观察 DOM，不镜像内部实现。已有 `.storybook/main.ts` 继续使用同一 stories glob；新增所需 preview annotations 与 Storybook Vitest setup，不初始化、安装或自动迁移。

`vitest.config.ts` 使用实际已安装 `storybookTest` plugin 与 browser-playwright Chromium provider，project 名 `storybook`，headless，test / hook 内部步骤最多 30 秒。`verify:stories` 固定 `vitest run --project storybook`；package.json 的 `mendi.tests.focused` 选择该脚本，不补其他 suite 或 full runner。目标 `tsconfig.json` 已覆盖 src / `.storybook` / 根 TS 配置，保留 `check` 中只读格式 / 基础 lint / 真正 vue-tsc；新增配置也由真实类型检查承担。

### 3. 普通验证和实际预览

按受影响范围完成目标 check、build、build-storybook，至少一次通过固定 MenDi 的普通 focused `test run` 调用 verify:stories，保留实际 command / exit / 持久化结果。普通 focused 不代替正式 Full Test。无需重复直接 pnpm 整套 stories 运行；确有修改或失败时仅做必要修复及相关重跑。

已完整读取根产品 `skills/tools/storybook/SKILL.md`（只读），并在本目标实际取得官方 `tools --help` 与 `tools stories preview --help`。用目标本地 bin 的 `dev` 启动并确认本次预览服务，再通过 `tools stories preview --attach --port <本次端口> --input <实际 stories JSON> --json` 取得 URL，不用 dev stdout 代替 preview 调用。已有实际 story 文件上下文时可传 absoluteStoryPath / exportName，否则从实际发现工具取得 storyId，不猜 ID；不要求遍历其他 CLI 能力。

只读分派源码确认 dev / build / index / tools 走现有 core；顶层 `--help` 会走 @storybook/cli 远程 runner，本次发现该行为后停止这条入口，后续只请求本地子命令 help。使用 `COREPACK_ENABLE_NETWORK=0`、`pnpm_config_offline=true`、既有 CI / verify-deps 策略，但这些设置不宣称全面网络 gate。顶层帮助意外下载属于本次实际限制，不能计成准备通过或冷安装认证；不清理缓存，不修改安装。

候选端口 6115 先核对归属，冲突报告或选空闲端口，不停止未知服务。宿主真实浏览器打开 Default / ExistingValue / Disabled，核对计数、加一 / 重置、禁用和 pageerror / console error。CLI URL、截图或静态 build 单独都不证明行为；需要实际交互结果。

### 4. 预算与服务收尾

每次普通工程命令最多 5 分钟，stories / 浏览器每次最多 3 分钟，内部步骤最多 30 秒。宿主对本次调用记录单调开始时间 / deadline / 实际时长 / 剩余时间，真正到期或前台取消时停止后项；普通 MenDi test 使用前台 Ctrl+C 给本次 child 取消和结果持久化机会，不虚构 timeout 参数或直接强杀 MenDi。普通 command 的总边界不冒充产品所有同步预检和持久化的端到端上限认证。

只管理本次启动且仍持有的预览 child / 浏览器。正常关闭后核对实际进程退出及端口监听结束；必要本次 child 树强制收尾最多 taskkill 5 秒、close / 管道 5 秒、监听 2 秒，未确认则保留现场和限制，不自动清锁或重跑。脚本若确有必要使用 TypeScript 并纳入类型检查；不为预算再建通用执行器。

## Risks / Trade-offs

- props 初值被误当实时控制 → 明确首次初始化，三个状态分别挂载；不追加运行时同步需求。
- Storybook 接线与浏览器存在实际兼容问题 → 目标内按影响修复，记录非零和新的必要结果，不以 Explore 导出检查代替验收。
- 官方 dispatcher 顶层帮助触发远程 runner → 后续限定源码确认的本地 dev / build / index / tools 分支；缺项停止报告，不自动下载；本次意外行为如实保留。
- 预览残留或端口归属不明 → 只收尾当前持有服务，有限确认不成功则停止并记录限制。
- submitted 历史或根目录误写 → 只维护本目标当前方案 / Run / 实现，旧 Run 和 artifacts 不变，产品问题报告根协调者。

## Migration Plan

独立 Review Propose approved 后 Author 按当前 tasks 实施、有限验证并提交 Apply complete；独立 Reviewer 审核固定 Apply 与实际结果。Review Apply approved 后停待 Archive，不执行部署或 Delivery Close。当前空壳无生产数据迁移，恢复或撤回遵循另行 Owner 指令，不自动删除结果。
