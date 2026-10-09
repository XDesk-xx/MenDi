# MenDi

MenDi 是以 OpenSpec 为规格底座，通过 Delivery、Author / Reviewer、Action 编排与 Runs 交接组织开发的项目交付工具。

当前仅建立重新开发的工程骨架，尚未实现产品操作。唯一产品总规划见 [基础与交付路线图](mendi-foundation-and-delivery-roadmap.md)，协作方式见 [AGENTS.md](AGENTS.md)。

## 工程命令

使用 Node.js 22.23.2、pnpm 11.22.0：

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm start
```

`start` 仅显示骨架说明，不创建 Delivery、Change、Action 或 Run。测试与产品命令随相应 Change 实现。

## 目录

- `src/core/`：基本领域规则。
- `src/application/`：产品操作与 Skill 编排。
- `src/adapters/`：必要的文件与外部工具接线。
- `src/drivers/`：CLI 入口。
- `skills/actions/`、`skills/tools/`：随产品交付的工作方法，当前仅保留位置。
- `scripts/`：构建与验收准备程序。
- `tests/fixtures/minimal-project/`、`tests/fixtures/ui-project/`：后续真实验收项目。
- `openspec/`：新初始化的项目配置、规格与 Change 材料。
- `config/`：按需增加的项目配置。
- `dist/`、`runtime/`、`.tmp/`：生成输出与临时工作区，不作为唯一证据或输入存放处。

## 工具接入

OpenSpec 1.14.1 使用稳定外部安装：

```powershell
node D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js --version
```

项目使用 repo-local `openspec/`。Action 复用上游指引并增加角色、Review 和交接要求；具体实现尚未开始。

Storybook 在 UI 目标项目中接入，首版验收项目位置预留在 `tests/fixtures/ui-project/`。当前未安装 Storybook、Impeccable 或 DBX，未配置或启用 MCP 服务。

当前协作记录：MVP-D01 已由 Author 按 Owner 授权人工 Open，见 [Delivery group manifest](.mendi/delivery-groups/20261009-01-single-change-manual-collaboration/manifest.json)、[Open Run 001](.mendi/runs/20261009-01-single-change-manual-collaboration/001-delivery-open/run.md) 与 [目录修订 Run 002](.mendi/runs/20261009-01-single-change-manual-collaboration/002-revise-delivery-open/run.md)。CLI 的产品操作尚未实现，启动记录不代表 MVP-D01-A 完成。

`.mendi/delivery-groups/<delivery-id>/manifest.json` 保存每个已 Open Delivery 的记录。Run 按路线图 §4.1 组织：Delivery 操作直接位于 `.mendi/runs/<delivery-id>/<序号>-<操作名称>/`；Change Run 位于 `.mendi/runs/<delivery-id>/<批次首个Run序号>-changes/<change-id>/<序号>-<操作名称>/`。Changes 批次与 Open、Full Test、Close、Reopen 操作目录同级；Reopen 后的新 Change 工作建立新批次。整个 Delivery 的实际 Run 连续编号，批次目录不占用额外编号。当前没有激活 Change，尚未建立批次目录。

后续 Delivery 的规划保留在路线图，实际 Open 时再创建 group。当前范围内的正常修复按实际需要更新现有材料，不为每次修复新增 Action、Run 或 `run.md`。

当前停在 delivery checkpoint，Git 提交尚未执行；没有激活 Change。下一项开发计划为 MVP-D01-A，需明确 Owner 授权后开始 Explore 与核心 proof。D02、D03 仅为计划分组。
