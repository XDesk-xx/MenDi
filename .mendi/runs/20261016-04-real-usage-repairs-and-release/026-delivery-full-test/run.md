---
deliveryId: 20261016-04-real-usage-repairs-and-release
planningSlot: MVP-D04
run: "026"
actionType: delivery-full-test
role: author
actor: codex-author
recordingMode: manual-bootstrap
scope: delivery
formalDeliveryTest: true
status: completed
actionStatus: completed
phase: finished
result: passed
testMode: owner-authorized-manual-full-test
executionId: d04-full-test-026
stageSkillRef: skills/actions/delivery-full-test/SKILL.md
finishedAt: 2026-10-17T10:28:31.700Z
outcome: passed
date: 2026-10-17
---

# D04 正式 Full Test（含 0.2.0 候选）

Owner原始授权：“owner 授权 full test，包含审核 0.2.0”。本会话保持Author；025已独立批准024候选准备，沿用其适用审核，不自签新的Reviewer verdict。本Run只执行正式验收，不执行根Close、Git、push、稳定切换或DreMo操作。

按当前acceptance-and-release-plan.md声明一次完整F01–F05集合；根继续manual-bootstrap，不接groups-v1。A / B / C直接实施与批准为006/007、014/015、021/022；归档011/012/013。当前候选基于已确认checkpoint 572b94f65555b71d792a056ac18921495b2bc8a4加024明确八项工作区差异；不执行Git或声称新核对HEAD。声明和当前直接批准核对见artifacts/declaration.json。

固定包为024/artifacts/candidate-01/mendi-0.2.0.tgz，SHA256 5ac71756bc9a1e6bfc813ca5ab75da8f43ecc1ffdbfeea8ec580a47fa9629cde。F04使用该同包、新安装与session，不build / pack另一个包。

F01严格pnpm check；F02 pnpm test全部根行为；F03新UI现场prepare后pnpm test:ui；F04新独立安装session下pnpm test:installation；F05固定OpenSpec对七份主规格逐项strict和候选status / next读回。全部必需，不因失败、skip、TODO或未执行缩范围。独立安全组继续收集，任何必要缺口整次不通过，不拼接旧PASS。

操作预算：整体90分钟，F02根60分钟，F01五分钟，UI准备十分钟、UI场景十分钟，安装准备十分钟、安装场景十分钟，规格及读回每命令两分钟；实际均受整体剩余预算约束。保留各子命令起止、pid、退出 / 信号和原始输出；超时有界停止并保留不确定性，不从入口退出推导整树安全。

执行时使用以下全新现场。新UI位置为D:/Projects/MenDi/.tmp/d04-full-test-026-ui；新安装位置为D:/tools/mendi/acceptance/d04-0.2.0-full-test-026。原Run和verdict保持。


## 正式结果与证据

本次完整F01–F05全部通过，正式outcome为passed。全部结果来自026的新执行，没有借用024/025的定向PASS替代业务组，没有重试或修复实现。直接声明见artifacts/declaration.json，汇总与每项起止/退出见artifacts/summary.json；各原始输出只保存一份。

| 必需组 | 实际结果 | 原始输出 |
| --- | --- | --- |
| F01工程检查 | exit0；严格依赖预检、格式、lint、src/scripts/tests三套真实类型检查通过 | artifacts/F01-check.log |
| F02根行为全集 | 278/278，exit0，0失败/取消/skip/TODO；命令约37分钟 | artifacts/F02-root.log；子命令及组原件见artifacts/root-details |
| F03 UI | 新五沙箱离线准备exit0；完整5/5，exit0，0失败/取消/skip/TODO；含真实浏览器、服务归属与停止、失败后新观察 | artifacts/F03-ui-prepare.log、F03-ui.log；直接子记录见ui-prepare和ui |
| F04安装 | 显式复用固定同包准备exit0；新session下完整4/4，exit0，0失败/取消/skip/TODO | artifacts/F04-installation-prepare.log、F04-installation.log；直接请求、回执与CLI日志见installation |
| F05规格/状态 | 七份主规格strict逐项exit0且valid=true；安装后CLI status/next exit0 | artifacts/F05-spec-*.log、F05-status.log、F05-next.log |

F04真实覆盖旧活动draft查询/预览/显式迁移和字节保留、旧pending公开拒绝；中段失败、尾项续测、固定原失败修复及独立审核夹具、局部retest、多来源verified、隔离Close/Reopen；六阶段正文/角色/按需方法与双目标跨cwd交接。受控Reviewer标签仅测试准入，不是根审核。旧失败仍保留，不被尾项通过擦除。

## 候选审核、适用性与限制

025已独立批准024的0.2.0候选准备；A/B/C实施批准分别为007/015/022。本Author核对批准与本轮包适用性，不产生Reviewer verdict。版本/安装接线、严格预检修复和方法的必要批准已具备，正式集合没有发现新的需修复实现。

固定tgz的SHA256与声明一致。新安装的221个非清单发行文件与当前dist/skills/README逐字节一致；安装清单结构与源码相同（pnpm正常省略packageManager），版本0.2.0。024声明八项直接工作区输入的大小/mtime未变；没有全库hash清单或递归旧证据链，也没有声称新核对Git HEAD/全工作树干净。当前受测基准仍是572b94f完整checkpoint加024明确差异。

最初汇总读回误把实际15个子命令预设为16，脚本退出1；未产生正式汇总或重跑任何验收。按明确入口修正统计后通过，见artifacts/summary-readback-note.md；这是Author汇总错误，不改写原始执行结果。

本次仅认证当前Windows/Node22.23.2/pnpm11.22.0/OpenSpec1.14.1及已准备浏览器环境，不认证冷安装、MCP、其他平台或任意UI业务语义。整次约44.4分钟，在90分钟上限内；未触发超时/终止。各顶层child实际close、exit0、signal=null；不以入口退出认证任意未知后代，必要服务/资源由真实场景断言。测试故障注入留存的隔离沙箱/锁不作通用清理。

## 当前停止边界

根保持open/manual-bootstrap、无活动Change、累计归档13；026保存正式passed，下一步delivery-close / author / awaiting-instruction，等待Owner另行授权。固定原Run/verdict不变；不自动Close、checkpoint、Git/push或切换稳定版本。稳定current仍0.1.0，package.json的原mtime保持2026-10-10T16:37:05.661Z；未访问/修改DreMo。

仅本次Run/artifacts与当前manifest交接更新；受测维护源码、八项准备差异及固定包保持。根未迁移、不新增groups-v1接线。完成后停止。

交接后候选CLI公开status / next再次读回exit0：当前正式结果passed指向026，下一步delivery-close / author / awaiting-instruction；根open/manual-bootstrap无活动Change，自有收尾锁已按原token释放。原始读回见artifacts/handoff-status.log与handoff-next.log。
