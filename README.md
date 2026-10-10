# MenDi

MenDi 是以 OpenSpec 为规格底座，通过 Delivery、Author / Reviewer、Action 编排与 Runs 交接组织开发的项目交付工具。

当前已实现项目入口、首次 Delivery Open、顺序已有 Change 关联、Action / Run、Apply 处置 / 显式回退、原生 Archive 与有限 finish，以及目标已有脚本的 focused / fast / full 前台执行和持久结果查询。阶段语义工作由 Agent 完成，独立 Reviewer 给出结论。唯一产品总规划见 [基础与交付路线图](mendi-foundation-and-delivery-roadmap.md)，协作方式见 [AGENTS.md](AGENTS.md)。

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

`start` 无参数时显示帮助，不写项目。`pnpm typecheck` 同时检查 `src/**/*.ts`、`scripts/**/*.ts` 与 `tests/**/*.ts`，脚本也可单独执行 `pnpm typecheck:scripts`。`build` 仅把 src 编译到 dist；源码以 `.ts` 导入，TypeScript 构建时将相对扩展名重写为 `.js`，测试由 Node 原生运行 `.ts`。`test` 构建后执行工程回归，限制两个测试文件同时执行，避免大量真实工具子进程争用影响夹具闸门；单项竞争测试仍启动真实并发写者，不代表 Delivery 正式 Full Test。

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

范围示例见 [delivery-scope.json](tests/fixtures/delivery-scope.json)：包含目标、互不重复的计划槽位及槽位依赖，保存到 manifest 后查询不再依赖原输入文件。关联要求 `example-change` 已经存在于目标 OpenSpec；CLI 不创建 Change。Open 也可成对传入 `--change example-change --slot A`，同时保存首个关联。

首次 Open 要求 `.mendi/` 不存在；重复 Open、追加 Delivery 和替换已有关联会拒绝。前项完整归档后，Owner 可明确激活范围内下一已有 Change，以 `change bind --change second-change --slot B` 追加。要求 open product Delivery、当前无活动项 / 未完成归档、槽位及 Change 未占用，而且槽位依赖均有 archived binding。首次 Open 的可选关联也检查依赖。旧绑定保持，新项尚无 Run 时 next=explore，查询不回退旧项；bind / next 不分配 Run、批准或自动激活下一项。

并发写使用独占锁；缺入口 / manifest、坏记录、残留锁或部分写入失败会报告路径，保留现场，不自动抢占、清理或恢复。人工 `manual-bootstrap` 记录只支持查询，产品写命令不改写或迁移历史。

`status` 与 `next` 使用同一只读状态解释，JSON 给出 `local`、`upstream`、`next`，存在当前产品 Run 时增加 `run`（含 Action 身份与状态）。上游 proposal ready / planning complete 只是产物事实；人工 next 标明来源。阶段提示 `executable:false` 表示语义工作不由 CLI 自动执行，显式记录命令仍可使用。成功退出 0，用法错误 2，目标 / 工具 / 记录 / 写入失败 1；`--json` 的 stdout 只输出一份结果。

查询要求本地配置、工具、项目入口、当前 manifest，以及当前活动 binding 的活动路径和 status；有 product latestRunRef 时再解析其当前 Run 头部。唯一当前对象为活动项，全部归档后为最后一项；旧 binding 仍校验身份、顺序、归档编号和受管路径结构，但不读旧 Run / 归档内容。历史正文、方法文件、旧方案、说明链接和未知 `Ref` 扩展不作为查询存在性前提，也不读取这些目标。当前必要输入缺失或损坏仍拒绝，不回退历史。

人工归档交接使用 `state: archived`、`archiveOrdinal: N`、`changeRef: openspec/changes/archive/YYYY-MM-DD-NNN-<changeId>`（NNN 至少三位；旧无编号格式仍兼容），并清空该 Change 的 `activeChangeId`；查询显示本地交接且 `upstream:null`，不调用旧 Change 的活动 status、不补建目录。归档路径只是记录定位，不读取 / 要求其内容存在，也不认证人工归档已执行；矛盾身份和状态仍拒绝。产品归档查询另外核对当前必要 Archive Run、编号与计数；两种格式均不迁移历史记录。

## Action / Run 记录

已有活动 binding、尚无产品 Run 时，从 Explore 开始。下例目标仍为 `D:\work\target`，`example-change` 必须是当前 Change；需先构建 CLI。start 返回实际读取的阶段方法及显式请求的工具指导，Agent 按方法完成工作后，把正文写到明确的 Markdown 输入文件。

```powershell
$draft = node dist/drivers/cli.js action start --project D:\work\target --change example-change --type explore --role author --actor author-session-1 --tool openspec --json | ConvertFrom-Json
node dist/drivers/cli.js run save --project D:\work\target --run $draft.run.ref --role author --actor author-session-1 --body D:\work\notes\work-notes.md --json
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

draft 可以反复 save，不分配新编号；submit 要求正文和 result 非空。submitted 永远不允许 save / 重提，只有 continuing 可 continue。body 相对于目标根或使用绝对路径，可在目标外，输入文件不被改写。写入仅支持 product；manual-bootstrap 的所有 Action / Run 写命令均拒绝。

save 只读取本地必要输入，不启动上游。`--openspec-bin` 仍接受但忽略，JSON 明确 `executionMode:local-only`、`openspec:null`、`upstreamAccess:not-required`；人读输出明确上游未访问。固定入口缺失、版本错误或 status 故障时可存 draft 说明，正式 submit / continue 仍拒绝。Reviewer 的固定 Author 缺失时也能存说明，不能提交审核结论。校验拒绝或替换前失败保持原正文；替换后读回失败可能已改变 draft，保留实际正文、锁和错误，不回滚，任何情况均不改旧 submitted Run。

| 操作 | 必要输入 |
|---|---|
| save | 有效本地配置、入口 / manifest、活动路径、当前 draft / ref / role / actor、明确正文、独占写入和读回 |
| start / continue / resolve | 实际上游 / status、当前工作和所选方法；Review / revise 另读固定完整 Author |
| submit | 上游 / status、当前 draft、正文 / result / outcome；Review 另读固定 Author 与合法 verdict |
| instructions | 上游、当前 Action / phase、artifact 或 operation 二选一；不读取历史 Owner 来源正文 |
| diagnose | 本地配置 / 入口 / manifest、锁、当前 product Run、可选显式同 Change 占号 |
| archive execute | 当前 prepared / 已保存 none、直接独立批准 / Author、真实 all_done、本次 Change / 主规格输入、无效果现场、锁内复核 |
| archive finish | 本地当前 Archive / binding / count、必要 attempt 和直接输入、停止写者及实际效果；已完成交接仅读回当前记录，无上游调用 |

## 阶段指引与 Owner 处置

```powershell
node dist/drivers/cli.js action instructions --project D:\work\target --action $draft.run.actionId --artifact proposal --json
```

Explore（含 revise / review）只请求 proposal 背景，Propose 支持 proposal / specs / design / tasks；Apply / Archive 使用 --operation apply|archive；分别返回实际任务协议和 Archive context / guidance。返回真实 instruction、template、输出位置、直接 dependencies 及可选 context / rules；specs/**/*.md 是模式，不是单个文件。先读 done 依赖实际内容，按 false 的必要依赖补输入，说明当前约束如何影响范围与产物。指引不要求所有 artifact ready，也不生成文件、Run 或 verdict。Explore 摘要进 Run，原始输出进 artifacts / 受控位置，不新建 explore.md；旧受审文件保持原样。

以下仅在 Owner 原始消息明确授权相应处置后执行，actor / role 参数只是声明，没有真人身份认证。

```powershell
node dist/drivers/cli.js action resolve --project D:\work\target --run $draft.run.ref --role owner --actor owner-session --resolution handoff --to-role author --to-actor author-session-2 --reason "未完成工作交给接收者" --json
node dist/drivers/cli.js action resolve --project D:\work\target --run $rejectedReviewRef --role owner --actor owner-session --resolution revise --to-role author --to-actor author-session-2 --reason "要求同阶段修订" --json
node dist/drivers/cli.js action resolve --project D:\work\target --run $currentRunRef --role owner --actor owner-session --resolution rollback --phase propose --revises $completedProposeAuthorRef --to-role author --to-actor author-session-2 --reason "显式回到较早方案" --json
```

handoff 仅允许未完成 Explore / Propose / Apply Author 或 Reviewer，必须同角色、不同 actor。新 draft 保持 Action / 方法 / 工具与固定对象，复制待继续笔记，不继承 verdict / result / outcome；Reviewer 重新独立检查，不要求 Author 重做。相同 actor 普通继续无需交接。revise 仅处理当前 rejected 的同阶段 Author，新 Action / 空 draft 直接关联被拒绝 Author；旧 verdict 保留，完成后仍须独立 Review。完整工作 handoff 或非 rejected resolve revise 拒绝。显式 rollback 须 --phase <较早阶段> --revises <完整直接 Author Run>，接收角色只能 author；建立新 revise / Review 路径，不删旧产物，也不沿用旧批准跳段。ownerDecision 内嵌接收 Run，仅保存最新直接决策，普通查询不读历史来源正文。

## 原生 Archive 与有限 finish

仅在 Owner 明确授权后操作目标项目。start 准备要求当前独立 Review Apply approved、其完整直接 Author 和真实 Apply all_done；不调用原生归档、不增长计数。

```powershell
$archive = node dist/drivers/cli.js action start --project D:\work\target --change example-change --type archive --role author --actor author-session-1 --json | ConvertFrom-Json
node dist/drivers/cli.js action instructions --project D:\work\target --action $archive.run.actionId --operation archive --json
node dist/drivers/cli.js action archive --project D:\work\target --run $archive.run.ref --role author --actor author-session-1 --mode execute --json
# 异常后核对现场、停止写者，并按既有 Owner 授权处置残留锁；finish 不是 unlock。
node dist/drivers/cli.js action archive --project D:\work\target --run $archive.run.ref --role author --actor author-session-1 --mode finish --json
```

execute 在同一锁内保存有限输入和 invoking，再调用固定 `archive <change> --json --yes`；OpenSpec 负责规格同步。产品保存原始包装响应 / 退出 / 信号 / stdout / stderr，定向核对源消失、唯一实际候选、元数据 / delta 与主规格效果。不是另做一次规格合并，也不以非零退出推断无效果。旧失败 attempt 保留。

本次声明 `retire_capabilities: true` 且 REMOVED 输入完整删除调用前全部需求、没有其他需求操作时，以主规格不存在核对预期退役，仍检查归档元数据与直接输入。其他主规格缺失继续拒绝。调用标记提交前已有的 attempt 目录也保留；在既有锁及必要前置成立后，另一次显式 execute 从当前 Run 的规范占号继续编号，不从目录存在猜测已调用原生。

finish 为 `executionMode:local-only / openspec:null / upstreamAccess:not-required`，工具不可用时仍可工作。原写者及可能的原生进程未确认停止、必要输入缺失 / 改变、候选不唯一 / 越界或现场矛盾时停止。invoking 后原生尚未启动或已经无效果结束时，完整现场可支持保存 none，返回 `observed-none / archiveStatus:pending`：当前 draft、正文、binding、activeChangeId、计数与 Run 编号均保持未完成，只新增观察。再次 finish 不建立 attempt、不重试；另一次显式 execute 或 Owner rollback 才是后续操作。rollback 只接受 prepared / 已保存 none，再次核对无效果，创建较早阶段新的 Author 修订并重新审核。invoking 不允许直接 execute / rollback。

确认实际原生效果后，目录使用真实日期和累计 `archivedChangeCount + 1`：`YYYY-MM-DD-NNN-change-id`，至少三位、不随 Delivery / Run 重置，旧缺省计数按零解释而不由查询补写。依次提交安全编号、计数、终态 Archive Run、manifest，再完整读回；存在部分提交时 finish 只补缺失交接，不另配编号或修改已提交 Run。完整收口返回 `archived / completed`；重复 finish 返回 `already-completed`，不增长计数、不新建 Run、不调用原生。

例如项目初始计数为 0，两项顺序归档产生 `YYYY-MM-DD-001-example-change`、`YYYY-MM-DD-002-second-change`，计数到 2。第二项操作只更新本项 binding；第一项 ordinal=1、小于项目总数仍合法。第二项计数 / 终态 Run / manifest 部分提交时，只以当前 Archive 的 countBasis / ordinal 定向 finish；已完成交接仅读当前记录。激活第二项后，再执行第一项 Archive execute / finish 会作为陈旧对象拒绝。当前第二 Archive Run 缺失仍拒绝，第一项旧正文和归档文件失效不要求补建。

archiving 的 status / next 只解释当前 typed Archive Run，upstream:null，不调用消失源的 status，也不重新判断或重试。prepared / none 指向 archive-execute；invoking / confirmed 及计数 / Run 已写而 manifest 未提交时仍 pending，指向 archive-finish。archived 要求当前终态 / 编号 / 计数一致，显示无活动 Change，next=delivery-next / awaiting-owner-instruction；不读取归档目录、历史批准正文或说明 / 未知 Ref。普通活动源缺失仍失败；普通阶段写入在归档过渡期拒绝。正式 Archive 不产生 Reviewer verdict，后续 Change / checkpoint / Full Test / Close / Reopen 保持独立授权。

## 只读故障现场诊断

```powershell
node dist/drivers/cli.js workspace diagnose --project D:\work\target --json
node dist/drivers/cli.js workspace diagnose --project D:\work\target --run $explicitReservationRef --json
```

诊断不访问上游、不接受工具参数，也不开放普通 query / writer 的忽略锁模式。报告锁 token / pid / operation、进程 alive / not-found / unknown、实际 current / 显式 reservation、相关临时路径、必要错误和读中变化。manual-bootstrap 只报告入口 / manifest / 锁，不解析人工 Run，不支持 --run。错误或变化退出 1；成功只是可读观察，pid 存在不证明原写者身份，pid 不存在不证明无任务占用。没有 unlock、kill、ignore-lock 或自动恢复命令。

人工处置另需 Owner 对该规范绝对目标的明确授权。核对同一 token / operation、实际 manifest / Run 和已写路径，停止或协调全部目标写者并确认任务与文件无占用；存活、复用、unknown、无法确认或读中变化时停止。排除并发期间再次核对同 token 与正式文件，仅可解除确认的残留锁；保留 Run、临时文件和占号，不修指针、不重提、不自动关联。之后只读查询：已提交按真实 next 后续，未关联占号由下次合法分配跳过，处置记当前工作记录。

所有分配在同项目锁下，扫描同 Delivery 约定层级的实际 Run 目录，不读历史头部。批次复用首个 Run 编号，批次本身不占号；跨操作和 Change 连续增长、至少三位，超过 999 继续为 1000。空 Run 目录仍占号并报告，重复实际号拒绝，artifacts 内数字目录不参与。首个 Run 可以是：

```text
.mendi/runs/d01/
  001-changes/
    example-change/
      001-explore/run.md
      002-explore/run.md       # 同 Action 的继续
      003-review-explore/run.md
    second-change/            # 前项归档后显式 bind，复用 001-changes
      008-explore/run.md       # 示例：此前最大实际号为 007
```

start / continue 先独占写新 Run，再替换 manifest 指针并读回；save / submit 在原目录写临时文件、rename 替换当前 draft，指针不变。发生修改后失败，保留锁、临时文件及已写路径，后续操作只诊断，不抢锁、不重试、不回滚；成功读回后才释放自身锁。这是可诊断的多文件写入，不是跨文件事务。

后续 bind 在新 binding 保存既有 batchId 并追加批次成员；不新建批次、覆盖前项成员或为 bind 占号。新项无 latestRunRef 是合法起点，第一次 Action 才使用全 Delivery 下一实际号。

## 目标项目测试

目标需有效 repo-local OpenSpec 配置，已有 package scripts。`test list` 无需 Open；run 要求 open product Delivery、无 archiving / 锁冲突，可在普通阶段或无活动 Change 时执行。status 只读明确 execution，三条命令均 local-only，不接受 `--openspec-bin`。

```powershell
node dist/drivers/cli.js test list --project D:\work\target --json
node dist/drivers/cli.js test run --project D:\work\target --kind focused --actor author-session-1 --pnpm-bin C:\tools\pnpm\bin\pnpm.cjs --json
node dist/drivers/cli.js test status --project D:\work\target --execution 001-focused --json
```

`--pnpm-bin` 填写实际已安装的绝对 JS 入口；上例路径须替换为本机实际安装。首版支持 Windows、Node 22、pnpm 11.22.0；若目标声明 packageManager，必须匹配该版本。允许已缓存的 Corepack shim，强制 `COREPACK_ENABLE_NETWORK=0`、`COREPACK_ENABLE_AUTO_PIN=0`，入口 / 版本 / 缓存不符就拒绝，不切换工具、下载或自动给目标追加 packageManager。不同调用目录仍使用明确目标的规范根作为 cwd。

默认 focused / fast / full 对应 `test:focused` / `test:fast` / `test:full`。可在现有 package.json 用 `"mendi":{"tests":{"full":"test"}}` 指向已有 script；名称以字母数字开头，只含字母数字、冒号、下划线、连字符，不接受参数或命令文本。list 返回实际文本和可用性；run 只校验选中项，不因另一项不可用而拒绝，不猜测 / 新建脚本或改配置。

MenDi 持锁核对实际工具版本，再以 Node 参数数组 `[pnpm入口, 'run']` 预检依赖，强制 `pnpm_config_verify_deps_before_run=error`。预检失败为 not-run、executionId=null，返回实际退出和输出，不启动脚本、不占号、不安装 / 修复依赖，正常释放自身锁。依赖由项目维护者明确准备，例如在该目标执行其正常 `pnpm install --frozen-lockfile`；这属于准备工作。

预检通过后，选定命令使用 `[pnpm入口, 'run', script名]`，强制 `warn`；即使目标 / 调用者设置 install 或依赖在两次调用间变动，也不触发 pnpm 运行前自动安装。宿主环境与目标配置不被修改。script 自身明确包含 install / 其他写入时，按其实际行为执行；记录不把这些写入称为 MenDi 自动安装。脚本非零是 failed，即便日志含依赖错误文字，也不反推 not-run。

执行跨 await 持有同一项目锁，原始 stdout / stderr 保存到 `.mendi/delivery-groups/<delivery-id>/tests/001-focused/`，另有 `result.json`。编号独立于 Run / Archive，空占号保留，重复号及目录 / 日志链接越界拒绝。结果包含实际命令 / cwd、两段依赖策略、成功预检摘要、script 文本、身份与可空 Change 快照、时间、pid / exit / signal 和日志定位；终态不可重写，再次显式执行建立新目录。

spawn 前保存 prepared / not-run，再持久保存 running / unknown 意图。日志按实际写入字节数续写，零进展或写入异常为 unknown；完整日志、正常 exit 0、终态保存读回及自身锁释放都成功才报告 passed；正常非零为 failed。前台 Ctrl+C 或调用者取消只停止本次实际持有的 Windows 子进程树，实际停止与 close 确认才为 interrupted。启动明确失败为 not-run；停止、日志、终态、读回或锁释放无法确认为 unknown，报告已观察现场并保留锁，不自动重试或清理。

`test status` 成功表示指定已知终态和必要日志完整且读取稳定，outcome 可以是 failed / interrupted / not-run；不依赖原 pnpm / script 仍存在或原 Change 的 Run 正文。持锁、读中变化、必要输入损坏及未完成意图返回 unknown / 非零，同时可显示 observed 内容；即使 observed 为 passed，也不表示完整成功。stable 仅表示文件观察稳定；已保存的 finished / unknown 即使锁被人工处置，仍保留原记录、ok:false 并非零退出。旧 pid 仅供说明，不据其失踪补写终态，不 kill 或解除锁。故障时先读明确 execution 和 `workspace diagnose`，后续处置仍遵守授权边界。

三类结果都标记 `scope:command`、`formalDeliveryTest:false`。将 run 的 kind 改为 full 只是普通 full 脚本执行，成功也不创建正式 Delivery Full Test、不改 Run / next / binding / verdict / 计数，不执行 Close 或激活下一项。普通 status / next 不读取旧测试结果或日志。

## 目录

产品 Run 使用 YAML 头部与 Markdown 正文。binding 的 `latestRunRef` 是当前进展的直接入口；头部保存 Delivery / Change / Run 身份、actionId、类型、声明角色 / actorId、draft / submitted、进展结果及所选方法，Review 固定直接 authorRunRef。状态查询只解析当前产品头部，人工 Run 仍作为说明保留；旧 Run、正文说明链接和未知 Ref 不递归读取。操作者标签用于明显自签 / 冲突检查，不是身份认证。

- `src/core/`：基本领域规则。
- `src/application/`：产品操作与 Skill 编排。
- `src/adapters/`：必要的文件与外部工具接线。
- `src/drivers/`：CLI 入口。
- `skills/actions/`：六个 Explore / Propose / Apply 方法及 Archive，revise 复用对应 Author 方法；`skills/tools/openspec/`：显式选用的工具指导。
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

当前协作记录：MVP-D02“Delivery 验收与收口”保持 open；MVP-D02-A `sequential-changes-and-test-entrypoints` 已独立批准并在 012 完成实际归档与主规格同步，归档目录为 `openspec/changes/archive/2026-10-10-005-sequential-changes-and-test-entrypoints`，累计完成 Change 为 5，当前无活动 Change。本次 change checkpoint 保存当前归档材料，后续等待 Owner 明确下一 Change 与范围。B 正式 Full Test / 小修复与 C Close / Reopen 尚未激活，D01 保持 closed，旧 Run 与 verdict 保留。当前交接见 [D02 manifest](.mendi/delivery-groups/20261010-02-delivery-verification-and-close/manifest.json)。

Run 按路线图 §4.1 组织：Delivery 操作位于 `.mendi/runs/<delivery-id>/<序号>-<操作名称>/`；Change Run 位于同级 Changes 批次的 `<change-id>/<序号>-<操作名称>/`。新 Delivery 从 `001` 开始，Changes 批次在实际进入 Change 工作时建立；D01 的 `003-changes` 保留原归属，Reopen 沿原 Delivery 连续编号并建立新批次。归档 ID 按项目累计完成数独立增长，不随 Run 或 Delivery 重置。
