# 025 — 0.2.0 候选准备独立审核

- 日期：2026-10-17
- 角色：Reviewer
- 固定 Author：[024](../024-candidate-preparation/run.md)
- action：review-candidate-preparation（manual-bootstrap 人工记录）
- verdict：approved（仅候选准备范围）
- outcome：complete

## 结论与固定对象

024 的版本与包接线、根依赖预检修复和隔离安装准备可接受，未发现阻断问题。此批准不是正式 Full Test、Close、发布或稳定切换。源码基准引用024声明的572b94f65555b71d792a056ac18921495b2bc8a4及其八项工作区差异；本次不执行Git，不声称核实HEAD或工作区整体干净。

固定包：../024-candidate-preparation/artifacts/candidate-01/mendi-0.2.0.tgz。SHA256：5ac71756bc9a1e6bfc813ca5ab75da8f43ecc1ffdbfeea8ec580a47fa9629cde。

Reviewer新安装：D:/tools/mendi/acceptance/d04-0.2.0-review-025；新session与原始命令记录在本Run artifacts/installation。未复用或覆盖Author session。

## 独立核查与复验

1. 对照024的before直接副本及当前脚本：package.json仅版本变化；准备程序去掉固定0.1.0路径，默认build / pack后只接收唯一当前版本tgz；显式包在创建输出前检查真实包内name/version，不按文件名猜测、不回退旧包。既有仓库外路径、父目录真实路径和占用拒绝保持；安装后复核版本和同包指纹。新29行包读取模块纳入真实类型检查。
2. 设置 pnpm_config_verify_deps_before_run=error 后运行 pnpm check，退出0：格式 / lint检查190文件，src、scripts、tests三份真实类型检查通过。原失败仍在024/dependency-precheck-before.log，不用直接工具PASS代替预检。核对本机pnpm11.22.0的dist/pnpm.mjs:168757安装默认packages=[.]与:217887预检直接读取workspaceManifest.packages，支持024根因解释。显式packages=[.]与单根工程相符，UI fixture保有独立workspace / lock。
3. node --test tests/installation-package.test.ts：2/2。真实tgz内部错误版本 / 包名拒绝；显式旧包未创建证据和安装目录。日志artifacts/package-admission.log。
4. 严格预检环境下执行prepare-installation-tests.ts，参数为新证据目录、新仓库外安装目录和固定tgz，退出0。prepare-commands.jsonl确认实际pnpm11.22.0及offline / ignore-scripts安装，所有子命令退出0、无信号；未build或pack，指纹未变。初始化与绑定只作用于隔离目标。
5. 新session执行 node --test --test-name-pattern='旧活动draft|候选包六阶段|真实安装、双目标' tests/installation/d04.test.ts tests/installation/handoff.test.ts：3/3，0失败 / skip / TODO。实际安装CLI的旧draft查询、预览、显式迁移及字节保留、pending公开code与身份、双目标 / 跨cwd / 缺项拒绝恢复 / Propose交接均通过。六阶段随包正文与当前来源一致，Reviewer无Author上游，未选Storybook无强制指导。阶段actor只是夹具，本会话保持Reviewer。
6. 发行包只包含dist、skills、README和package.json；221个非清单发行文件与新安装和当前构建产物 / 方法 / README逐字节一致。安装清单与tgz内部JSON相等；对照源码仅有pnpm省略packageManager及序列化顺序差异。首次错误地要求清单与源码字节相同，检查退出1；核实后改用结构核对，未改包或实现。详见manifest-comparison-note.md和independent-readback.json。
7. 设置 pnpm_config_verify_deps_before_run=error 后运行 pnpm --dir tests/fixtures/storybook-project typecheck，退出0。024的UI readiness原命令为tsc及browser-ready均退出0；本次未运行完整UI测试或重新准备浏览器。

新原始输出各仅保存一份：strict-check.log、package-admission.log、prepare.log、installed-focused.log、ui-strict-typecheck.log及installation下命令记录。本次定向验证不等于正式集合。

## 旧安装证据与限制

独立阅读024安装测试源码、candidate-reuse-01/d04-groups原始命令和三份group-report。实际CLI来自reuse-01：初次退出1，prefix passed / middle failed / tail not-run；续测只选tail退出0；复验只选middle退出0；多来源最终verified。旧失败仍保留，尾项成功未擦除middle失败。修复审核夹具及Close / Reopen记录保留。本次只读核查这些原证据，未重新运行包含Full Test / Close的场景；不能说成025实测了该场景。

024最初安装4/4后，额外读回曾误期望pending内部错误码，原说明保留；补强公开delivery-commit-pending和pendingRef断言后新session为3/3，旧handoff单独沿用。本次自己的新session再次验证公开拒绝和handoff，不改写旧4/4为最新版全套结论。

范围限定本地可信候选和当前Windows / Node22.23.2 / pnpm11.22.0；未认证冷store、其他平台、任意不可信归档或正式F01–F05整次结果。正式验收须消费同tgz、新session、新安装目录，不覆盖024或025现场。原始日志只引用，不复制历史树。

## 维护代码规模与职责

当前维护TypeScript物理行数实算，见independent-readback.json：

| 目录 | 前三名 |
| --- | --- |
| src/ | application/project.ts 374；core/delivery-runs.ts 372；application/delivery-lifecycle.ts 371 |
| tests/ | action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394 |
| scripts/ | proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463 |

当前前三与024统计一致，本次无实现增长。直接before副本支持prepare-installation-tests.ts 177→196（+19）；新包检查29行、安装场景240行、support76行、准入负例43行。其他变化仅沿用024声明，不制造Git基准。准备、发行包准入与断言已分工，无需增加转发层。D04安装场景混合兼容、组消费和方法三类，但各有独立test且本轮范围有限；后续继续扩展组消费矩阵时应先按场景拆分。旧大型proof未扩展，保持限定Explore用途。

## 交接与停止

保留024和所有旧Run / verdict；仅新增本Reviewer记录及更新当前manifest交接。next为delivery-full-test / awaiting-instruction / author，表示等待另行授权和对应角色执行，不是本会话切换角色或开始验收。根仍manual-bootstrap / open，无活动Change，累计归档13。

未修改实现、DreMo或稳定current，未执行Git、正式Full Test / Close、部署或发布。完成后停止。
