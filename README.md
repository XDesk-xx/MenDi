# MenDi

MenDi 是以 OpenSpec 为规格底座，通过 Delivery、Author / Reviewer、Action 编排与 Runs 交接组织开发的项目交付工具。

当前已实现 MVP-D01-A 的项目入口、首次 Delivery Open、首个已有 Change 关联及只读查询；阶段执行和 Run 写入随后续 Change 实现。唯一产品总规划见 [基础与交付路线图](mendi-foundation-and-delivery-roadmap.md)，协作方式见 [AGENTS.md](AGENTS.md)。

## 工程命令

使用 Node.js 22.23.2、pnpm 11.22.0：

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
pnpm build
pnpm test
pnpm start
```

`start` 无参数时显示帮助，不写项目。`pnpm typecheck` 同时检查 `src/**/*.ts`、`scripts/**/*.ts` 与 `tests/**/*.ts`，脚本也可单独执行 `pnpm typecheck:scripts`。`build` 仅把 src 编译到 dist；源码以 `.ts` 导入，TypeScript 构建时将相对扩展名重写为 `.js`，测试由 Node 原生运行 `.ts`。`test` 构建后执行本 Change 的定向与集成测试，不代表 Delivery 正式 Full Test。

`check` 聚合 `format:check`、`lint` 和现有 `typecheck`；`pnpm format` 修正维护中 TypeScript 格式。固定开发依赖 Biome 2.5.15 的检查仅覆盖 `src/**/*.ts`、`scripts/**/*.ts` 和 `tests/**/*.ts`，排除整个受控 `tests/fixtures/`、历史 Run 及生成物；不设置行数门槛、hash gate 或额外补证流程。

## 当前产品命令

以下命令在 MenDi 仓库根运行。目标须已准备有效 repo-local OpenSpec 配置；执行写操作前仍需对应 Owner 授权。`--project` 相对于调用目录解析，`--scope` 相对于目标项目根解析；scope 也可显式指定绝对路径。

```powershell
node dist/drivers/cli.js --help
node dist/drivers/cli.js status --project D:\work\target --json
node dist/drivers/cli.js delivery open --project D:\work\target --id d01 --title "最小 Delivery" --scope D:\Projects\MenDi\tests\fixtures\delivery-scope.json --json
node dist/drivers/cli.js change bind --project D:\work\target --change example-change --slot A --json
node dist/drivers/cli.js next --project D:\work\target --json
```

范围示例见 [delivery-scope.json](tests/fixtures/delivery-scope.json)：包含目标、唯一计划槽位及槽位依赖，保存到 manifest 后查询不再依赖原输入文件。关联要求 `example-change` 已经存在于目标 OpenSpec；CLI 不创建 Change。Open 也可成对传入 `--change example-change --slot A`，同时保存首个关联。

首次 Open 要求 `.mendi/` 不存在；重复 Open、追加 Delivery 和切换已有关联会拒绝。并发写使用独占锁；缺入口 / manifest、坏记录、残留锁或部分写入失败会报告路径，保留现场，不自动抢占、清理或恢复。人工 `manual-bootstrap` 记录只支持查询，产品 bind 不改写历史。

`status` 与 `next` 使用同一只读状态解释，JSON 分别给出 `local`、`upstream` 和 `next`。本地 Explore 与上游 proposal ready / planning complete 分别展示；人工 next 标明来源。阶段提示 `executable:false` 表示当前 CLI 尚未实现该 Action，不代表审核批准。成功退出 0，用法错误 2，目标 / 工具 / 记录 / 写入失败 1；`--json` 的 stdout 只输出一份结果。

查询只要求本地配置、工具、项目入口、当前 manifest，以及当前活动 binding 的活动路径和 status。历史 Run、旧方案、说明链接、批次目录与未知 `Ref` 扩展不作为存在性前提，也不读取这些目标。manifestRef 与 binding changeRef 仍校验身份和受管路径安全。

人工归档交接使用 `state: archived`、`archiveOrdinal: N`、`changeRef: openspec/changes/archive/YYYY-MM-DD-NNN-<changeId>`（NNN 至少三位；旧无编号格式仍兼容），并清空该 Change 的 `activeChangeId`；查询显示本地交接且 `upstream:null`，不调用旧 Change 的活动 status、不补建目录。归档路径只是记录定位，不读取 / 要求其内容存在，也不认证归档已执行；矛盾身份和状态仍拒绝。CLI 没有 Archive 写命令。

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

项目使用 repo-local `openspec/`、schema 缺省或 `spec-driven`；固定工具通过公开 CLI 接入并核对版本和实际 root。可用 `--openspec-bin <绝对入口>` 指定另一个稳定安装的 1.14.1，实际入口会显示在输出中；不从 PATH 切换、不自动安装或初始化。OpenSpec 配置、AGENTS、README 和既有 Change 文件不被接入命令改写。Action 复用上游指引及 Reviewer 交接能力属于后续 Change。

Storybook 在 UI 目标项目中接入，首版验收项目位置预留在 `tests/fixtures/ui-project/`。当前未安装 Storybook、Impeccable 或 DBX，未配置或启用 MCP 服务。

当前协作记录：MVP-D01 已由 Author 按 Owner 授权人工 Open，见 [Delivery group manifest](.mendi/delivery-groups/20261009-01-single-change-manual-collaboration/manifest.json)、[Open Run 001](.mendi/runs/20261009-01-single-change-manual-collaboration/001-delivery-open/run.md) 与 [目录修订 Run 002](.mendi/runs/20261009-01-single-change-manual-collaboration/002-revise-delivery-open/run.md)。这些人工记录保留原身份；产品写命令不自动迁移它们，初始化或启动记录不代表 Change 完成。

`.mendi/delivery-groups/<delivery-id>/manifest.json` 保存每个已 Open Delivery 的记录。Run 按路线图 §4.1 组织：Delivery 操作直接位于 `.mendi/runs/<delivery-id>/<序号>-<操作名称>/`；Change Run 位于 `.mendi/runs/<delivery-id>/<批次首个Run序号>-changes/<change-id>/<序号>-<操作名称>/`。Changes 批次与 Open、Full Test、Close、Reopen 操作目录同级；Reopen 后的新 Change 工作建立新批次。整个 Delivery 的实际 Run 连续编号，批次目录不占用额外编号。当前已建立 `003-changes` 批次，包含 MVP-D01-A 的实际 Change。

后续 Delivery 的规划保留在路线图，实际 Open 时再创建 group。当前范围内的正常修复按实际需要更新现有材料，不为每次修复新增 Action、Run 或 `run.md`。

Owner 已授权激活 MVP-D01-A：`project-entry-and-minimal-delivery-open`。[Explore Run 003](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/003-explore/run.md) 已获 [独立 Review Explore Run 004](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/004-review-explore/run.md) 批准；按 Owner 指令完成 [TypeScript proof 修订 Run 005](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/005-revise-explore/run.md) 与 [Author Propose Run 006](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/006-propose/run.md)，[007-review-explore](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/007-review-explore/run.md) 已独立补审批准 005；[008-review-propose](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/008-review-propose/run.md) 已批准原 006，方案无需修订，可作为实施基准。编号保留实际发生顺序；Owner 随后指令 `apply`，已完成 [Author Apply Run 009](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/009-apply/run.md) 的 16 项任务，类型检查、构建和 27 项测试通过；[Review Apply Run 010](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/010-review-apply/run.md) 结论为 changes-requested，需修复配置自引用导致错误输出崩溃的 P2；Owner 指令 `revise-apply` 后，[Author Revise Apply Run 011](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/011-revise-apply/run.md) 已局部修订 RA-A-001，类型检查、构建和 13 项相关测试通过；[Review Apply Run 012](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/012-review-apply/run.md) 已独立复核批准 011，关闭 RA-A-001，类型检查、构建及 9 项定向检查通过；Owner 随后要求 [013-revise-apply](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/013-revise-apply/run.md) 的归档前局部修订：必要输入边界、人工归档查询及基础工程检查已调整，check 与 34 项回归通过；[014-review-apply](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/014-review-apply/run.md) 已独立补审批准 013，check、构建及 34 项回归通过，保留一项非阻断人读提示问题；Owner 随后授权 [015-archive](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/015-archive/run.md)，已原生同步两份主规格并归档到 [2026-10-09-001-project-entry-and-minimal-delivery-open](openspec/changes/archive/2026-10-09-001-project-entry-and-minimal-delivery-open/proposal.md)。累计完成 Change 为 1，目录 ID 跨 Delivery 连续增长（下次为 002），与 Run 分开；当前无活动 Change，停在 Archive，等待 Owner 明确后续激活目标与范围。首个批次为 `003-changes`；Delivery Open checkpoint 为 `8cea0c9`，本次未执行 Git checkpoint / push 或正式 Delivery Full Test。D02、D03 仅为计划分组。
