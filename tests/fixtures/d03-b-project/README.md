# D03-B 方法接入的受控目标

`package-input.json` 是包定义输入，显式 prepare 时才在新沙箱内生成 `package.json`，不把夹具作为开发仓库的另一 workspace package。`openspec/config.yaml` 保留实际离线 / 本地文件约束，官方 Skills 由固定 OpenSpec 1.14.1 `init --tools codex --profile core` 在沙箱生成；不手写假官方文件。

从 MenDi 根运行 `node scripts/proofs/mvp-d03-b-explore.ts <新的绝对证据目录> prepare`。该步骤真实编译、打包，使用已有 store 离线安装到 `D:/tools/mendi/proofs/d03-b-009/<证据目录名>`，准备两个目标，取得官方方法与 proposal instructions。目录占用则拒绝，不覆盖旧环境；pnpm 入口沿用现有 `MENDI_UI_PNPM_BIN` 配置与默认值。

随后由 Agent 读取实际方法 / instructions，在 session 指定的第一个目标内，围绕已有 `local-note-work` 按 proposal → specs / design → tasks 依赖形成有限实验产物。可参照 009 的 proof-006 `planning-inputs`；读取每项当时的 instructions 并保留实际项目约束，未实施任务保持未勾选。必要产物副本存证据目录，不另建 Change 或 Reviewer 记录。

运行 `node scripts/proofs/mvp-d03-b-explore.ts <同一证据目录> verify` 验证候选读取失败、自有方法失败与状态保留、当前产品缺口及规划衔接。第一次完整运行后不要在原现场重复 verify；新实验使用新的 prepare 目录。所有临时目标可重建，正式输出保存到 Run，不能只留在沙箱或安装目录。

这是 Explore 实验，不是产品目标方法加载器。不可读负例为文件位置变成目录的 EISDIR；不认证 Windows ACL、冷安装、其他宿主 / 平台、Vue、MCP 或完整交付。根工程普通 `pnpm check` 与产品测试环境的 `verifyDepsBeforeRun=error` 分开报告，不用准备 / 加载成功推导实施或审核批准。
