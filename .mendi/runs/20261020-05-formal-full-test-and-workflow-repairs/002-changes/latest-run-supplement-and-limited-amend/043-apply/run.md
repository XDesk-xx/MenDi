---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: latest-run-supplement-and-limited-amend
planningSlot: MVP-D05-D
batchId: 002-changes
actionId: latest-run-supplement-and-limited-amend-apply-01
actionType: apply
role: author
actor: codex-author
run: "043"
status: completed
actionStatus: completed
outcome: complete
result: implemented-for-independent-review
nextAction: review-apply
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/latest-run-supplement-and-limited-amend/042-review-propose/run.md
---

# D05-D Author Apply

固定 041 规划与 042 独立 approved，按 16 项任务实施。根目录 manual-bootstrap，仅隔离 product-v2 接受产品写入。完成后停独立 Review Apply；不操作 DreMo、Archive、正式 Full Test/Close、Git 或稳定安装。

## 实施结果

16/16 Tasks 完成，交独立 Review Apply，不自签 verdict。使用仓库 `openspec-apply-change`、`incremental-implementation` 和输入/受管路径安全约束；OpenSpec 1.14.1 返回 spec-driven/ready。固定当前实际 `next` 的 042 与其 `authorRunRef=041`，不沿用 D05-C 的旧交接；开工 list 确认本根且只有 D05-D 活动项。旧 config 中“D05-D 未激活/C 未 checkpoint”的提示以实际 manifest、042 和 HEAD 9c818e6 纠正，无需新增授权或改历史。

- `run supplement`：项目内 JSON 明确 requestId、来源、原因、证据列表与 additional/conflicting/uncertain（默认 uncertain）；typed receipt 保存本次 recordedAt，来源自述日期始终 unverified。无可信旧批准时间锚点，不认证采集先后；冲突提示 Owner 与正式独立 Review，不改原审批。
- `run amend`：必填 requestId/kind，presentation-only 仅 body、unreviewed-comment 仅 comment；缺/错/混用写前拒绝。前者仅普通段落机械安全空白，代码/标题/列表/链接/表格/引用/hard-break 等不变；错字、URL、事实和结构修改拒绝。后者始终 authoritative=false、事后未审核，旁路保存/展示，不进入正式摘要、被审核正文、证据依据、PASS/verdict/next。单 Run 唯一 amend，同 ID/模式/直接输入才幂等；第二 ID、换模式/内容拒绝。
- 准入分离在 `aftercare-target.ts`：product-v2/open/currentRound，Change 活动 binding.latestRunRef 与批次、Delivery 已完成 Repair/Review 的 deliveryRunRef 各自核对；全 Delivery scanRunNumbers 拒绝后续 draft/空占号、错误对象及未知占位。原 role/actor/submitted 必须匹配，归档/旧轮/manual/legacy/正式执行和生命周期均不获得新写权限。
- 事务在 `aftercare-store.ts`：真实共享 write.lock，锁内重新核当前入口/manifest/Run/槽位及直接来源身份和字节；独占 intent、必要原件、原文基线，最后原子发布 confirmed 并直接读回，原 run.md/manifest/project 不改。SHA256 仅用于本次直接文件与意图的一致性，不是全库证据台账。附属文件拒绝项目外及内部 junction/symlink 重定向。
- 中断/部分文件保留实际现场及锁；不自动清理。Owner 核对停止写者并处置残锁后，同请求带原完整输入 `--resume finish`，再验证原 lease、停止状态、当前基线和实际子文件；未知或不符停止，不覆盖部分原件。已确认请求可只读幂等返回，不能借历史回读获得新写权限。ordinary 新写会核当前必要 aftercare 已完整确认。
- 查询由独立 `aftercare-reader.ts` 读完整有效 confirmed；已保存原件可脱离临时来源读取，缺/坏原件、收据和 pending 不伪造成功。原结果与 next 不受评论宣称影响。更新真实 CLI 帮助、README、四份相关 Skills 和根唯一长期设计；没有增加第二套长期计划。

## 实际验证与证据

命令、真实退出结果及唯一原始日志入口见 [verification.json](artifacts/verification.json)。

| 集合 | 实际结果 | 原始输出 |
|---|---|---|
| 四份新增 aftercare 测试，concurrency=2 | 20/20 PASS，exit0 | [aftercare-tests.log](artifacts/aftercare-tests.log) |
| action-write/query/delivery-query/workspace 回归，concurrency=2 | 36/36 PASS，exit0 | [regression-tests.log](artifacts/regression-tests.log) |
| pnpm check | format/lint 与三份真正 TypeScript 检查均 exit0，229 文件 | verification.json；实际命令输出见本会话 |
| pnpm build | exit0 | [build.log](artifacts/build.log) |
| OpenSpec strict | 1/1 valid，0 issues，exit0 | [openspec-validation.json](artifacts/openspec-validation.json) |
| git diff --check、真实 CLI --help | exit0，三条补证/双模式示例与实际 CLI 参数匹配 | 本会话只读检查 |

新增集合包含真实新进程 CLI 的 Change Author/Reviewer 和 Delivery Repair/Review 两个命令正例、安全排版、同文不同 kind（原“审核未批准”与评论“审核已批准”）、缺/冲突输入、唯一 amend 与幂等、相反/不确定补证、虚假 verified 时间拒绝；原 Run/project/manifest 逐字节比较，next/verdict 跨查询不变。覆盖真实 Closed/Reopen、后续 draft/空占号、旧/错误对象、外部与内部 junction、来源读中变化及别名重复，真实 0B 附件缺失不推断为空。

六个真实子进程断点（intent、复制、提交前、confirmed 后、读回、释放锁前），以及并发、锁前/复制中源漂移、部分复制、坏收据均执行；只对已经结束的本测试自有 writer 的精确锁做显式测试处置，代表 Owner 处置步骤，不扫描或删除未知锁。中断必要原文、锁、intent/原件/confirmed 的有限副本与实际命令输出通过 C 的单源采集保存在 [collection](artifacts/collection)，不复制整棵临时工程。测试入口及受控 fixture 可重放；unknown/partial 现场仍保留，无批量临时目录清理。

前期调整如实保留：Node/TS 检查发现测试 Query 联合类型需收窄，已修正；PowerShell glob 交给 Biome 时未展开，改用明确文件路径后通过。恢复集合首次为 9/10，部分复制注入器误把相对 intent 路径用于宿主 cwd，实际未注入部分文件（根 `.mendi/runs/d01` 不存在）；修正为目标 root 后 [定向重跑](artifacts/partial-copy-recheck.log) 1/1，通过最终完整 20/20。该首次诊断在本会话实际输出中，不伪造独立失败日志。行数首次误纳入 node_modules 声明，已只取 rg 维护代码；路线图换行曾造成 diff whitespace 失败，仅还原本次文件 LF，最终 diff --check 通过。

限制：这些是受影响行为验证，不是 D05 根正式 Full Test。阶段 Author/Reviewer 标签与 approved 是隔离机器记录夹具，不能认证真实独立审核；Delivery 场景使用已有受控归档/旧正式记录构造合法 Repair 与 Closed，未把旧 command 当作新的 groups-v1 验收。未做实际 OS ACL 改写、外部目标修改、稳定安装或发布；原件发布/恢复在本机同盘 Windows/Node 22.23.2 环境验证。

## 维护代码规模与职责

本次维护 `.ts` 物理行数，排除 node_modules/派生物/上游声明；可靠基准为开工时已有 HEAD 9c818e6（D05-C checkpoint），完整数据见 [line-counts.json](artifacts/line-counts.json)。

| 区域 | 第一 | 第二 | 第三 |
|---|---|---|---|
| src | application/delivery-lifecycle.ts 368（+0） | application/group-attempt.ts 361（+0） | adapters/workspace.ts 354（346→354，+8） |
| tests | action-write.test.ts 467（+0） | planning-cli.test.ts 444（+0） | delivery-repair.test.ts 395（+0） |
| scripts | proofs/mvp-d01-c-explore.ts 678（+0） | proofs/mvp-d01-d-explore.ts 487（+0） | proofs/mvp-d01-a-explore.ts 463（+0） |

本次新职责在扩展前独立分开：纯输入/排版合同 108 行、当前目标与源核对 113 行、收据读取 143 行、事务/恢复 214 行、应用组装 152 行；workspace 只增加必要当前 aftercare 的写入准入桥接，不把完整新事务塞入已有混合读写模块。新恢复测试 228 行，按模式/准入/Delivery/恢复场景分组，其余长测试未扩展。旧 Explore proof 未扩展，仍仅限原 proof；未来真需扩展再先分 Apply 记录流与 Archive 效果组，保留简单 TS 入口和旧输出。没有行数门槛、纯转发层或独立台账；本轮未见需要扩大整理范围的可靠增长。

## 历史与交接

定向核对 033/034/035/036 原 Run、A/B/C Archive 实际 Run012/025/032（归档序号 014/015/016）的直接字节，见 [history-inputs.json](artifacts/history-inputs.json) 与 [history-check.json](artifacts/history-check.json)；本轮无旧 Run 或 archive specs 的 Git diff，不扩展全历史 hash 清单。历史授权 rejected 与后续新授权 approved 均保留。

下一步：**review-apply / reviewer / awaiting-instruction**，固定本 043。没有自签 approved，没有 Archive、Git 写入、根正式 Full Test/Close、稳定安装或 DreMo 035 实际补证。
