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

D04 的 026 正式 Full Test、027 Close 和 028 Stable Install 均已记录完成，稳定 current 已切换为 0.2.0。以下构建 / 打包命令为未来再次发布的操作示例，不应误认为 D05 已发布或需要重复安装同一旧包。

在开发仓库构建和打包，然后在仓库外的固定安装目录安装本地包。下面的离线安装要求已有依赖 store；依赖不足时由维护者明确准备，不认证冷安装。

```powershell
pnpm build
pnpm pack --pack-destination D:\work\packages
# 在一个明确的新安装目录中创建 private package.json 后执行：
pnpm --dir D:\tools\mendi\current add --offline --ignore-scripts D:\work\packages\mendi-0.2.0.tgz
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

`--help` 列出 delivery open / change add / full-test / verification / repair / close / reopen、change bind、action start / continue / instructions / resolve / archive、run save / submit、test list / run / status 和 workspace diagnose。Delivery 范围文件包含 goal、plannedChanges 和依赖；目标已有 Change 才能 bind，首次 Open 不创建 Change。新 Change 激活及 Git、正式 Full Test / Close 等操作仍各守 Owner 授权。

稳定安装 0.2.0 的旧 command / 分组与多来源历史继续按旧合同可读。当前 D05-A 源码候选将新正式执行统一为 groups-v1 完整 initial，所有必需组本次真实执行并稳定读回才由该 Run 自身 passed；修复审核后重新全量，不再新建 continue/retest/verification。新 Close 唯一输入 testAttemptRunRef；方法、计划与恢复声明见[组级协议](skills/group-tests.md)。D05-A/B/C 已经独立审核并原生归档 014/015/016；D05-C 的有限 opt-in Proof 单源采集保持真实 0B 日志实体与正式 groups-v1 证据合同不变，两份新主规格已经同步。D05 整体尚未正式 Full Test、Close 或单独发布，稳定安装仍为 0.2.0，不能把代码审核和局部测试冒充发布验收。

start / continue / Owner 接收交接 / Archive 准备返回自有 `methods.stage`、明确选择的 `methods.guidance` 及当前阶段必需的 `methods.upstream`：上游每项含 name / projectRoot / ref / file / generatedBy / content。即时正文供宿主实际读取，不新增旧 Run 必填字段；query / save / submit / diagnose 不因新增方法扩大前置。

Explore / 修订使用目标 explore；首次 Propose 对已绑定 Change 复用 propose 的产物片段与真实 instructions，跳过 new；修订按 update-change 的适用已有产物规则；Apply / 修订使用 apply-change。选择 Storybook 不取消阶段 OpenSpec 方法。Review 使用自有独立方法，Archive 准备复用 archive-change 指引；原生归档负责一次同步，execute / local-only finish 不新增方法检查。详细步骤与停止边界见对应自有 Skill。

Run 按 `.mendi/runs/<delivery-id>/<操作序号>-<操作名称>/` 或同级 `<序号>-changes/<change-id>/<操作序号>-<操作名称>/` 保存；Delivery Run 连续编号，新 Delivery 从 001 开始，归档 ID 按项目累计成功数独立增长。submitted 历史与 verdict 不改；查询只消费当前必要输入，说明链接和未知 Ref 不成为运行前提。

并发写使用独占锁，错误保留实际现场；诊断不解除锁。Windows 测试结果替换遇到 EPERM / EBUSY 时仅对同一暂存文件有限重试，等待预算 500ms；持续失败或直接输入改变仍停止，不重跑业务命令、不删除原结果或清锁。人工 manual-bootstrap 只支持查询，产品写命令不迁移开发历史。Owner 标签不认证真实身份，工具成功与 ready / all_done 不表示实际完成或批准。

## 当前候选的轮次与兼容入口

D04-A 已交付 version 2 项目入口及 manifest；0.2.0 稳定安装已有记录，以下命令可使用本仓库构建后的 `node dist/drivers/cli.js`。`rounds[]` 保存每次范围及收口，`currentRoundId` 只选择最新轮。顶层目标、计划、状态、批次和结果指针是当前轮投影；矛盾拒绝，不自动修复。Reopen 追加 rNNN，不预建批次，旧 PASS / Close 留在旧轮。省略身份的首次 Open 同样创建 r001，但没有虚构 Open Run。

```powershell
node dist/drivers/cli.js status --project D:\work\target --round r001 --json
node dist/drivers/cli.js delivery migrate preview --project D:\work\target --json |
  Set-Content -LiteralPath D:\work\target\migration-preview.json -Encoding utf8
# 核对预览并取得该目标本次迁移的 Owner 授权后：
node dist/drivers/cli.js delivery migrate apply --project D:\work\target --input migration-preview.json --role author --actor author-id --json
```

历史轮查询仅展示已保存摘要，没有历史执行 next，不改变 Delivery / 轮次选择、不访问旧 Change status。旧 product 保留普通 status / next、instructions 及指定结果读取；普通写入（包括 save / submit、test、Archive finish 和旧 resume）拒绝，先显式迁移。v2 项目可登记其他 v1 manifest，旧来源不强制迁移。manual-bootstrap 继续只读。

迁移仅转换当前选定 manifest 和必要入口，保留原 Action、actor、draft、固定 Author、业务进展指针和累计编号；收据 migrationRunRef 不成为当前进展。预览不建文件或占号、不执行 OpenSpec。输入须在项目内，apply 重算实际计划并锁内复核；陈旧 / 手改预览拒绝。缺首次 Open 但范围 / Close 充分时标明 legacy-baseline，不补未知历史；真实缺口拒绝。完整活动 draft 可迁移；旧 pending、未确认原生效果或运行 / 不完整测试须先兼容旧版恢复，再重新预览。新版没有旧格式恢复例外。

迁移中断保存原 intent、编号及锁。Owner 另行核对写者与锁处置后，原 actor 显式 `delivery migrate resume --project <root> --run <同次 NNN-delivery-migrate/run.md> --role author --actor <原标识>`；只补原提交，不自动清锁、降级或改终态。重复 apply 返回 already-migrated，同次完整 resume 返回 already-completed；后续工作改变则拒绝旧恢复。详细边界见 `skills/actions/delivery-migrate/SKILL.md`。

本轮 `dependsOn` 仍是本轮 DAG；已交付前置放 `baselineDependencies:[{deliveryId,planningSlot,closeRunRef}]`，示例见 `tests/fixtures/delivery-scope-baseline.json`，引用必须换成目标实际记录。仅核对同项目登记 product 的 archived binding 与指定 Close 完成快照；支持同 Delivery 更早关闭轮和跨 Delivery，来源可后来 Reopen、ordinal 可小于当前累计数、v1 来源无需迁移。manual 来源只能说明。准入只读直接来源，不递归其依赖、旧审核、日志或活动状态；普通 query 不展开来源。新正式结果固定 roundId 和 baselineFacts，Close 消费本轮实际结果及保存快照。现行失败 → 修复 → 独立审核 → 新整次执行规则保持。

## 当前候选的计划追加

Owner 明确授权当前 product-v2 open 轮新增范围后，Author 可使用源码构建后的命令：

```powershell
node dist/drivers/cli.js delivery change add --project D:\work\target --input change-add.json --role author --actor author-id --json
```

项目内 `change-add.json` 示例（槽位和授权来源须换成该目标实际值）：

```json
{
  "requestId": "append-owner-approved-01",
  "ownerDecision": "Owner 本次原始范围决定的实际位置及说明",
  "reason": "增加后续用户场景",
  "additions": [{"slot": "C", "title": "后续能力", "dependsOn": ["B"]}]
}
```

追加只扩充本轮计划，不 bind、激活 Change 或 Reopen。独立 `delivery-change-add` 收据使用共享编号；`scopeAddRunRef` 与有限 `scopeAdditions` 保存前后范围，活动 Change 的最新 Run 与阶段保持。无活动项时，新增未绑定槽位使 `next=change-bind`；仍须独立授权。旧正式 passed/failed 必须已稳定结束并确认清理，未决 Repair/Review、pending、锁和 unknown 阻断。

旧正式 Run 和日志按原范围可查，但不再提供扩大后范围的验收资格。新增项归档后须另行授权新的全量 groups-v1 和 Close。相同 requestId、原 Author、相同输入路径/字节只返回原收据，冲突输入拒绝。

中断保留现场。Owner 核对原写者停止并处置锁后，原 Author 执行 `delivery change add --project <root> --resume <同次 receipt run.md> --role author --actor <原标识>`；只恢复本次已保存的确定前后提交，材料漂移或后续工作使旧恢复失效。方法见 [delivery-change-add](skills/actions/delivery-change-add/SKILL.md)。D05-B 已独立审核并归档，仍待整个 D05 正式验收与发布，稳定安装是 0.2.0。

## 未来测试 / Proof 的可选证据采集

`MENDI_TEST_EVIDENCE_DIR` 继续选择当前尚未提交 Run 的证据目录或明确受控的新验证目录；`MENDI_APPLY_EVIDENCE` 继续选择少量指定组场景摘要。当前源码的 `tests/helpers.ts` command、`tests/test-support.ts` execute 和 `tests/group-support.ts` groupRun / recordApplyScene 使用有界单源辅助：同一直接原件保存一次，其它场景使用 `{root, ref, source}` 引用；不同真实执行即使输出相同仍分别保存。若两入口同时启用，组原件使用前者目录，Apply 摘要引用同一份原件。其它专项 recorder 未在本 Change 全面重写。

```powershell
$env:MENDI_TEST_EVIDENCE_DIR = 'D:\work\current-author-run\artifacts\evidence'
node --test tests/evidence-recorder.test.ts tests/evidence-groups.test.ts
Remove-Item Env:\MENDI_TEST_EVIDENCE_DIR
```

未启用时没有额外采集写入。临时唯一原件必须先保存必要字节，缺失则明确 incomplete，写入/读取漂移或权限失败停止并保留现场；已提交 Run 目录不接受新采集。可复建输入记受控入口和参数，不能只留下临时目标死链，也不复制历史树。`captured` 只表示该次额外证据已保存，不代表业务测试通过；实际 failed/unknown/取消仍按原结果解释。生产 formatVersion=1、双物理日志（含 0B）及正式 groups-v1 文件保持，不将缺失日志解释为空。方法约定适用于未来阶段，软件仅接入上述 opt-in 路径，不自动清理历史或建立全库 hash/数量门槛。源码候选仍须独立审核及 D05 后续正式验收，稳定安装不由此切换。

## 显式安装验收

准备入口可增加第三个参数：已冻结的本地tgz绝对路径；此时只核对并安装该包，跳过build / pack。包名及版本须匹配当前候选，session保存实际路径和包指纹。省略时只消费本次pack产生的唯一当前版本包，不回退旧目录。

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

当前源码候选的方法明确：普通 UI 调整不新建 Change；业务契约、当前 UI 设计和关键未决决定按实际用户影响区分。Explore / Propose 主动澄清关键产品未知，独立 Review 使用相同尺度；UI 定位修复保留原场景、必要断言、失败及清理。完整工作方法随阶段从 `skills/actions/` 返回，交接成功不等于宿主语义判断已获批准。

## 0.2.0 已交付能力与兼容边界

- Reopen保留历轮范围；新项目采用v2记录，旧product可只读查询，写入前须预览并显式迁移。充分旧来源保留真实旧格式基线，活动Change / draft保留；旧pending先使用旧版恢复，不由新版接管。
- 可选groups-v1支持完整失败收集、同轮续测、独立修复审核后的影响复验及多来源候选；旧command合同继续保留，必需skip / TODO / 取消 / 零执行不能覆盖。
- 六阶段方法统一业务契约、当前 UI 方案和主动澄清尺度；普通 UI 调整不新建 Change。D04 已按记录完成正式验收与安装；D05-A 正式 Full Test、D05-B 未 Close 追加 Change CLI 和 D05-C 有限 opt-in 证据去重均已实现、独立审核并归档；D05-D 尚未实现，D05 整体尚未正式验收或发布。

## 开发交接

当前活动 Delivery 与阶段读取 [D05 manifest](.mendi/delivery-groups/20261020-05-formal-full-test-and-workflow-repairs/manifest.json) 及其最近 Run；初始人工 Open 见 [001](.mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/001-delivery-open/run.md)。D05-A 在 012 Archive 归档 014、D05-B 在 025 Archive 归档 015、D05-C 在 032 Archive 归档 016；当前 activeChangeId=null，下一步为 change-checkpoint；D05-D 尚未激活，须按 Owner 授权。长期规划统一查看根路线图 §7 D05。

[D04 记录](.mendi/delivery-groups/20261016-04-real-usage-repairs-and-release/manifest.json)已完成 026 正式 Full Test、027 Close、028 稳定安装，D04 归档截止为 013；D05-A/B/C 分别登记 014/015/016，项目累计归档 16；旧归档和 verdict 保留。外部 Full Test 实验代码单独存入 Git stash；D05-A/B 已有本地 Git checkpoint，D05-C 尚未 commit/push，未执行 D05 整体正式验收或发布。manual-bootstrap 产品写入限制不变；新的 Change 激活、Git、正式 Full Test/Close 与其他目标项目操作继续独立授权。
