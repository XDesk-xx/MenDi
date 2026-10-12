# D03-A Storybook 受控目标

真实 HTML 组件与两份交互 story 属于本目标。旧 Explore proof 保留其限定用途，新的分组 UI 回归使用本目标的隔离副本；这不代表真实 Vue 或完整交付已验收。未启用 MCP，不声明组件文档或 MCP testing 能力。

使用现有 Node 22 / pnpm 11.22.0，先在此目标显式准备锁定依赖，再执行 typecheck、preview:components、verify:stories 或 inspect:browser。根 MenDi 不添加 Storybook 依赖。

在 MenDi 根目录重建：

```powershell
pnpm --dir tests/fixtures/storybook-project install --frozen-lockfile --ignore-scripts
pnpm build
node scripts/proofs/mvp-d03-a-explore.ts <新的绝对证据目录>
pnpm check
```

proof 从受控输入创建全新隔离目标，使用已准备的 pnpm store 离线安装；不复用旧 `.tmp` 输入。父证据目录需要已经存在，指定的新目录不能存在。端口 6113 须可用；实验只结束自己启动的服务。根工程 typecheck 排除此独立目标；本目标的严格 typecheck 检查 src、`.storybook`、Vitest 与浏览器脚本，须先准备目标依赖。

新的产品场景使用根 `prepare:ui-tests <新的绝对 .tmp 子目录>` 显式离线准备，再设置 `MENDI_UI_TARGETS_DIR` / 当前 Run 的 `MENDI_UI_EVIDENCE_DIR` 并执行 `test:ui`。后者先执行本目标严格类型与真实浏览器准备检查，再运行 `tests/ui/` 分组场景，不自动安装。真实缺陷、类型错误、缺浏览器与工具缺配置均按失败记录，不能由旧 PASS 或 CLI exit 0 掩盖逐项 error；具体命令见根 README。

`vitest.config.ts` 使用官方 Storybook Vitest addon 与真实 Chromium browser mode；测试项目根来自本目标文件，已有异名 `verify:stories` 通过 `mendi.tests.focused` 接入 MenDi。Explore 的旧 Test Runner 0.26 尝试未通过，原日志保存在 Run；最终配置按目标 Vite 框架选择官方 Vitest addon，不沿用旧 runner 或跳过失败。

固定 Playwright 1.60.0 使用本机已经存在的 Chromium 1223。重建时浏览器须已准备；本 proof 不自动下载浏览器或其他可选工具。
