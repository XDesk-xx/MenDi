# Proposal

## Why

MenDi 初始 CLI 只输出骨架说明，人工 Delivery 记录无法由产品创建或查询。MVP-D01-A 需要把已验证的固定 OpenSpec 接入和目标根检查变成可运行入口，让真实项目能够保存 Delivery 范围、关联已有 Change 并读回协作状态。

## What Changes

- 建立 TypeScript CLI：显式指定目标项目，提供 `delivery open`、`change bind`、`status`、`next` 与简短帮助，支持面向人的中文输出和 `--json`。
- 使用选定的外部 OpenSpec 1.14.1 公开 CLI。独立校验目标本地配置，并核对上游实际 root；缺配置、store 声明、其他 schema、祖先根、版本或机器输出错误明确拒绝。
- 首次 Open 保存 `.mendi/project.json` 与 `delivery-groups/<delivery-id>/manifest.json`，保存本次范围；允许 Open 时关联一个已有 Change，或之后在该 Delivery 内绑定首个 Change。
- 冲突不覆盖；项目入口最后提交，单文件更新使用同目录临时文件和替换。部分写入失败如实报告路径，后续查询识别不完整状态，不自动清理或伪报成功。
- 查询区分 MenDi 协作阶段与 OpenSpec 产物事实；支持读取当前人工 bootstrap 记录，保留 Run 引用和独立审核状态。
- 查询只要求操作真正读取的必要输入；历史说明和未知 `Ref` 字段不形成运行依赖。只读兼容人工归档 binding，不调用已归档 Change 的活动 status，不实现 Archive Action。
- 维护中源码、测试、脚本统一格式并接入基础 lint，普通 `check` 聚合格式检查、lint 和现有 typecheck；历史、生成物和字节敏感夹具排除。
- 项目维护的脚本使用 `.ts` 并进入严格类型检查。原 proof 迁移与产品实现已完成，012 批准原局部修订；013 进一步收窄引用、兼容归档交接并整理工程检查，完成后等待独立补审。

## Capabilities

### New Capabilities

- `project-entry`: 显式目标选择、固定外部 OpenSpec 接入、配置来源与项目规则保留、真实机器结果和错误报告。
- `delivery-workspace`: 最小 Delivery 范围与首个 Change 关联的持久化、冲突与不完整状态诊断、只读 status / next。

### Modified Capabilities

无。固定 OpenSpec `list --specs --json` 确认当前没有主规格。

## Impact

- 在 `src/drivers/`、`src/application/`、`src/adapters/`、`src/core/` 增加必要 CLI 接线和最小领域结构，沿用现有 Node 22、TypeScript 5.9、pnpm 工程。
- Apply 时新增直接运行时依赖 `yaml@2.9.1` 并更新锁文件；不依赖外部 OpenSpec 安装的内部模块，也不安装另一份 OpenSpec 或额外 runner。
- 013 局部修订新增开发依赖 `@biomejs/biome@2.5.15`，用于基础工程检查，不新增行数门槛或 hash gate；proof 新结果不再输出无消费者的 scriptSha256，旧证据保留。
- 增加 TypeScript 集成测试，使用受控夹具和真实固定 OpenSpec；README 记录命令及边界。目标已有 AGENTS、README、OpenSpec 配置和 Change 文件保持原字节。
- 首版限 Windows、repo-local、`spec-driven`、首次 Delivery 与首个 Change。Action / Run 写入和编号、阶段推进与 Reviewer 批准规则、更多 Change、Close / Reopen、Archive、正式 Full Test、发行安装和 Git 操作继续属于后续范围。
