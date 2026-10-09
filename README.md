# MenDi

MenDi 是以 OpenSpec 为规格底座，通过 Delivery、Author / Reviewer、Action 编排与 Runs 交接组织开发的项目交付工具。

当前已实现项目入口、首次 Delivery Open、首个已有 Change 关联、Action / Run 记录命令及只读查询。阶段语义工作由 Agent 完成，独立 Reviewer 给出结论。唯一产品总规划见 [基础与交付路线图](mendi-foundation-and-delivery-roadmap.md)，协作方式见 [AGENTS.md](AGENTS.md)。

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

`status` 与 `next` 使用同一只读状态解释，JSON 给出 `local`、`upstream`、`next`，存在当前产品 Run 时增加 `run`（含 Action 身份与状态）。上游 proposal ready / planning complete 只是产物事实；人工 next 标明来源。阶段提示 `executable:false` 表示语义工作不由 CLI 自动执行，显式记录命令仍可使用。成功退出 0，用法错误 2，目标 / 工具 / 记录 / 写入失败 1；`--json` 的 stdout 只输出一份结果。

查询要求本地配置、工具、项目入口、当前 manifest，以及当前活动 binding 的活动路径和 status；有 product latestRunRef 时再解析其当前 Run 头部。历史 Run、固定 Author 的正文、方法文件、旧方案、说明链接和未知 `Ref` 扩展不作为查询存在性前提，也不读取这些目标。manifestRef、binding changeRef 与产品 Run 路径仍校验身份和受管路径安全。

人工归档交接使用 `state: archived`、`archiveOrdinal: N`、`changeRef: openspec/changes/archive/YYYY-MM-DD-NNN-<changeId>`（NNN 至少三位；旧无编号格式仍兼容），并清空该 Change 的 `activeChangeId`；查询显示本地交接且 `upstream:null`，不调用旧 Change 的活动 status、不补建目录。归档路径只是记录定位，不读取 / 要求其内容存在，也不认证归档已执行；矛盾身份和状态仍拒绝。CLI 没有 Archive 写命令。

## Action / Run 记录

已有活动 binding、尚无产品 Run 时，从 Explore 开始。下例目标仍为 `D:\work\target`，`example-change` 必须是当前 Change；需先构建 CLI。start 返回实际读取的阶段方法及显式请求的工具指导，Agent 按方法完成工作后，把正文写到明确的 Markdown 输入文件。

```powershell
$draft = node dist/drivers/cli.js action start --project D:\work\target --change example-change --type explore --role author --actor author-session-1 --tool openspec --json | ConvertFrom-Json
node dist/drivers/cli.js run save --project D:\work\target --run $draft.run.ref --role author --actor author-session-1 --body D:\work\notes\explore.md --json
node dist/drivers/cli.js run submit --project D:\work\target --run $draft.run.ref --role author --actor author-session-1 --outcome continuing --result "关键 proof 已完成，继续分析" --json
$continued = node dist/drivers/cli.js action continue --project D:\work\target --action $draft.run.actionId --role author --actor author-session-1 --json | ConvertFrom-Json
node dist/drivers/cli.js run save --project D:\work\target --run $continued.run.ref --role author --actor author-session-1 --body D:\work\notes\explore-complete.md --json
node dist/drivers/cli.js run submit --project D:\work\target --run $continued.run.ref --role author --actor author-session-1 --outcome complete --result "Explore 已完成，等待独立审核" --json
```

Reviewer 在独立会话使用自己的稳定 actor 标签，固定审核明确的 Author 提交。下例 `$authorRef` 由已完成 Author 的 `run.ref` 填入，不使用当前 Reviewer 的引用替代它。

```powershell
$review = node dist/drivers/cli.js action start --project D:\work\target --change example-change --type review-explore --role reviewer --actor reviewer-session-1 --author-run $authorRef --json | ConvertFrom-Json
node dist/drivers/cli.js run save --project D:\work\target --run $review.run.ref --role reviewer --actor reviewer-session-1 --body D:\work\notes\review.md --json
node dist/drivers/cli.js run submit --project D:\work\target --run $review.run.ref --role reviewer --actor reviewer-session-1 --outcome complete --result "审核结论与限制见正文" --verdict approved --json
```

Reviewer 可先提交 `continuing`，此时不填 verdict；再以同 actionId 执行 continue，新 Run 保留固定 authorRunRef。complete 必须给出 `approved`、`changes-requested` 或 `rejected`。Author 禁止 verdict；actor 标签仅用于明显自签检查，不能认证真实身份。Review continue / submit 会重新读取固定 Author，缺失时拒绝；普通查询仍能解释当前 Reviewer 头部。

approved 后显式开始对应下一阶段，apply approved 只提示 Archive 边界。changes-requested 后用 `revise-<phase> --revises <明确 Author Run>`；Owner 范围内主动局部修订也可针对当前完成 Author 或当前 Review 固定的 Author。修订生成新 actionId，取代当前批准入口，再交独立 Review；旧 verdict 不改。rejected 停 Owner 决策，CLI 不自行续开。

draft 可以反复 save，不分配新编号；submit 要求正文和 result 非空。submitted 永远不允许 save / 重提，只有 continuing 可 continue。body 相对于目标根或使用绝对路径，可在目标外，输入文件不被改写。写入仅支持 product；manual-bootstrap 的四类命令全部拒绝。

所有分配在同项目锁下，扫描同 Delivery 约定层级的实际 Run 目录，不读历史头部。批次复用首个 Run 编号，批次本身不占号；跨操作和 Change 连续增长、至少三位，超过 999 继续为 1000。空 Run 目录仍占号并报告，重复实际号拒绝，artifacts 内数字目录不参与。首个 Run 可以是：

```text
.mendi/runs/d01/
  001-changes/
    example-change/
      001-explore/run.md
      002-explore/run.md       # 同 Action 的继续
      003-review-explore/run.md
```

start / continue 先独占写新 Run，再替换 manifest 指针并读回；save / submit 在原目录写临时文件、rename 替换当前 draft，指针不变。发生修改后失败，保留锁、临时文件及已写路径，后续操作只诊断，不抢锁、不重试、不回滚；成功读回后才释放自身锁。这是可诊断的多文件写入，不是跨文件事务。

## 目录

产品 Run 使用 YAML 头部与 Markdown 正文。binding 的 `latestRunRef` 是当前进展的直接入口；头部保存 Delivery / Change / Run 身份、actionId、类型、声明角色 / actorId、draft / submitted、进展结果及所选方法，Review 固定直接 authorRunRef。状态查询只解析当前产品头部，人工 Run 仍作为说明保留；旧 Run、正文说明链接和未知 Ref 不递归读取。操作者标签用于明显自签 / 冲突检查，不是身份认证。

- `src/core/`：基本领域规则。
- `src/application/`：产品操作与 Skill 编排。
- `src/adapters/`：必要的文件与外部工具接线。
- `src/drivers/`：CLI 入口。
- `skills/actions/`：六个产品阶段方法，revise 复用对应 Author 方法；`skills/tools/openspec/`：显式选用的工具指导。
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

项目使用 repo-local `openspec/`、schema 缺省或 `spec-driven`；固定工具通过公开 CLI 接入并核对版本和实际 root。可用 `--openspec-bin <绝对入口>` 指定另一个稳定安装的 1.14.1，实际入口会显示在输出中；不从 PATH 切换、不自动安装或初始化。OpenSpec 配置、AGENTS、README 和既有 Change 文件不被接入命令改写。start / continue 从 MenDi 安装包位置加载实际方法，保存方法标识；仅 `--tool openspec` 明确选择时读取工具指导。save / submit 不重新读取方法正文，query 也不读取方法。

Storybook 在 UI 目标项目中接入，首版验收项目位置预留在 `tests/fixtures/ui-project/`。当前未安装 Storybook、Impeccable 或 DBX，未配置或启用 MCP 服务。

当前协作记录：MVP-D01 保持 open；MVP-D01-A、MVP-D01-B 均已归档，累计完成 Change 为 2，当前无活动 Change。B 位于 [2026-10-10-002-action-runs-and-role-handoff](openspec/changes/archive/2026-10-10-002-action-runs-and-role-handoff/proposal.md)，[022 Author Archive](.mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/action-runs-and-role-handoff/022-archive/run.md) 保存原生同步、实际归档和查询读回；020 / 021 的实施与独立批准保持原记录。独立 check、构建和 64 项回归仍适用，三份主规格 strict validate 通过。A 的本地 Change checkpoint 仍为 `8a702ff`，本次归档未执行 Git。等待 Owner 明确下一 Change 的目标与范围；当前交接见 [Delivery manifest](.mendi/delivery-groups/20261009-01-single-change-manual-collaboration/manifest.json)。

Run 按路线图 §4.1 组织：Delivery 操作位于 `.mendi/runs/<delivery-id>/<序号>-<操作名称>/`；Change Run 位于同级 Changes 批次的 `<change-id>/<序号>-<操作名称>/`。本次复用 `003-changes`，整个 Delivery 连续编号；批次不占号，Reopen 后再建立新批次。归档 ID 按项目累计完成数独立增长，不随 Run 或 Delivery 重置。
