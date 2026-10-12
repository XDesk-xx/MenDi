# Proposal

## Why

MenDi 已能交接随包自有方法与 OpenSpec 动态 instructions，但独立安装后尚不读取当前目标的官方方法；009 Explore 与 010 独立审核确认，缺少目标 Explore 方法时产品仍会分配 Run。当前需要完成这一窄接入，并收敛安装指导和执行入口，让 MenDi 在已验证基线上稳定使用。

## What Changes

- 从显式当前目标的 `.agents/skills/openspec-*/SKILL.md` 读取阶段必需方法，核对身份、非空正文和 `metadata.generatedBy: "1.14.1"`；自有方法仍随包提供，外部 CLI 仍使用选定稳定入口。
- 在 Change start / continue、实际创建 Author 交接的 Owner resolve 和 Archive 准备写入前组合必要方法，返回来源、目标、生成基线及真实内容；选择 Storybook 不取消必需上游方法。
- 明确 Explore、首次 Propose、Propose 修订、Apply、Review 与 Archive 的方法分工；围绕已绑定 Change 编写产物，保留独立审核和原生一次规格同步。
- 保留旧 Run 格式，必要方法失败不分配新号或覆盖已有交接；查询、本地保存、普通提交、诊断与本地 Archive finish 不增加方法前置。
- 验证开发仓库外安装、跨 cwd / 双目标隔离，统一现有 UI pnpm 入口使用，明确根工程环境与目标严格依赖预检的分工；将 README / context 收敛为短入口与当前背景。

当前不实现外接升级机制、未来支持清单、多版本 / 多布局平台、MCP 连接或 C 的真实 Vue / 无 UI 完整验收。优先稳定与应用 MenDi；工具升级仅保留在路线图 §9.1，不新增 Change、槽位或依赖。

## Capabilities

### New Capabilities

无独立新 capability；新增目标方法行为属于现有 Action 方法交接能力。

### Modified Capabilities

- `action-runs`：扩展阶段方法交接为随包自有方法、可选指导与阶段必需目标 OpenSpec 方法，规定来源、阶段映射、写入前失败及旧记录兼容。

## Impact

涉及 `src/adapters/methods.ts` 的方法解析、`src/application/actions.ts` / `action-resolution.ts` / `archive-prepare.ts` 的新交接接线、自有 `skills/actions/` 与 OpenSpec 指导、相关 tests 与稳定安装验收准备。现有 `methods.stage` / `methods.guidance` 保留，新增当前输出的 `methods.upstream`；不增加持久 Run 必填字段或公有命令。

`tests/ui/results.test.ts` 复用已选 `pnpmEntry`；必要的根与目标环境区分进入测试与指导。package 已包含 dist / skills / README，继续现有 TypeScript 编译和 pnpm pack，不新增运行依赖或替换锁文件。主规格在后续授权 Archive 同步，本次只生成 delta 和未勾选任务，停在独立 Review Propose。
