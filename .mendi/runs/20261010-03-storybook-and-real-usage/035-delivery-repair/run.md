---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-delivery-repair-02
actionType: delivery-repair
role: author
run: "035"
status: submitted
actionStatus: completed
date: 2026-10-12
scope: delivery
finishedAt: 2026-10-11T17:03:42.224Z
result: scoped-repair-ready-for-independent-review
outcome: complete
failedFullTestRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/034-delivery-full-test/run.md
collectionRef: .mendi/runs/20261010-03-storybook-and-real-usage/034-delivery-full-test/artifacts/plan.json
stageSkillRef: skills/actions/delivery-repair/SKILL.md
---
# MVP-D03 第二次 EPERM 诊断与范围内修复

Owner 授权定位034、按实际原因局部修复和必要补验。保持Author；本Run内继续准备、诊断和验证，停在独立定向审核，不重跑根正式Full Test，不执行Close、Git、清理或子智能体。034及以前Run、verdict和031/034失败现场保持。

## 诊断与确定性

034 根回归211项中只有新增测试 `Windows 短时删除共享拒绝后替换同一 staged 结果` 失败。实际错误是其 `saveExecution` 在 prepared → running 替换结果时返回 EPERM，位于 tests/test-store.test.ts 原110/117行及 src/adapters/test-store.ts 87行。原031的 Reopen 用例在034通过；没有计数器、Storybook、OpenSpec或业务架构缺陷的证据。原始错误直接引用 [034 TAP](../034-delivery-full-test/artifacts/root-regression.stdout.log)，不补写034。

该测试主动启动 PowerShell，以 FileShare.Read、不含 Delete 的句柄占用目的 result.json；在持有句柄后先打印 ready，再调用 Start-Sleep 150ms。父进程读到 ready 后立即执行产品500ms有限替换。**150ms只指定睡眠时长，不能保证从ready到句柄Dispose的总耗时为150ms或小于500ms**；其间还包括PowerShell命令准备与进程调度。这是旧测试依赖的不可靠同步假定，不能用产品等待预算给外部进程释放作保证。

在本Run新建的36个隔离现场记录实际持有/释放和每次rename拒绝时序：12个串行、4个并行进程各6个；全部PowerShell正常退出且管道关闭。请求150ms，ready到释放实际334.882–517.636ms。一例在约511.173ms仍被拒绝，最后一次EPERM约511.164ms，句柄约517.636ms才释放；原文件和同一暂存文件字节均完整。见 [timing-summary](artifacts/timing-summary.json)、[输入](artifacts/holder-timing.ts) 和其列出的原始日志；未插入人为延迟、重跑完整测试或增加产品预算。四进程是定向诊断，不声称重建034的原并发负载。

**已确认：故障点、主动持有的删除共享拒绝机制、旧同步假定错误及新现场同机制的超预算失败。限制：034没有记录原当次的句柄释放时间，不能事后确认其精确时序或排除所有外部干扰；没有依据将失败归因杀毒、索引、权限配置或其他具体进程。** 不把新现场的517.636ms写成034当次数据，也不改034 verdict。

只读核对034原现场 `.tmp/mendi-apply-YshgYU/.mendi/delivery-groups/d01/tests/001-focused/`：普通Archive属性，当前ACL未见Deny。原结果1063字节、prepared/not-run；暂存1062字节、running/unknown，均pid null。本用例直接调用存储适配器，没有建立产品项目写锁或启动业务命令。两个直接输入的短名副本及来源/mtime在 [failure-site](artifacts/failure-site/observation.json)；这是本次必需对照，不复制历史证据树。观察中的rootLockPresent=true是035创建时本Author自己的根记录锁，不是034失败占用者。现场、031保留锁与历史均未清理、释放或替换。

## 修复范围

- 仅修改 `tests/test-store.test.ts`：真实Windows共享测试用明确的输入释放信号；收到子进程正常close后才确认句柄释放，再替换同一个暂存文件，检查占用期间原/暂存字节及释放后结果。删除150ms自动释放假定；准备失败和正常结束都关闭当前holder，收尾等待5秒，超时仅终止本次持有的helper并判失败。
- 保留产品级瞬时重试测试：两个受控EPERM后同一staged写入成功，业务只启动一次；持续拒绝不启动业务、保留锁与unknown。真实Windows持续占用仍直接覆盖 `saveExecution` 的有界失败和原/暂存保护。真实OS共享机制与可控有限重试各自验证，不把mock称真实系统故障。
- `src/adapters/test-store.ts` 未修改：500ms、25ms间隔、直接输入冲突保护、原始错误传播、终态/身份和启动次数规则仍适用；没有扩大时间、加整例自动重试、删原结果、放宽失败或跳过Windows。
- 035当前记录和artifacts保存新事实；manifest、README、OpenSpec context只更新当前交接。其他Change、fixtures、旧proof、依赖声明、稳定安装和历史Run/verdict不改。

## 必要补验及一次非本调用的文件复原

初轮7/7加载了修正版，但测试文件在16:55:30.321Z被写回035前的263行原版。该写入不在本Author实际工具调用中，写者未确认；读回与本Run开始副本逐字节相同、nlink=1。后两个重复命令因此各只选中持续占用1项，不能声称复验了两个新用例。初轮日志保留，事实见 [unexpected-restoration](artifacts/unexpected-restoration.json)；不将其用作最终候选的完整验证。

确认无其他文件内容混入后，重新应用相同范围的修正。最终补验持有本Author根记录锁，按每项读回测试文件字节，确认实际候选未变；使用既有前台适配器与有限收尾，不增加产品gate或新的执行平台。最终结果只采用 [verified/focused-summary](artifacts/verified/focused-summary.json)，原始输出每次各保存一份：

| 命令/场景 | 实际结果 |
| --- | --- |
| 两个035 TypeScript脚本严格noEmit检查 | exit0，见preparation-verified输出；不是以Node能运行代替类型检查 |
| `node --test tests/test-store.test.ts` | 7/7，0 skip，12.701秒；共享拒绝/明确释放、持续占用、内容冲突、其他错误、启动次数和终态/身份 |
| 两个并行进程，各运行Windows共享/持续占用子集 | 各2/2，0 skip，3.031/2.970秒；明确读到两个新场景名，没有整例失败自动重试 |
| `pnpm check` | exit0，10.365秒；格式、lint、src/scripts/tests三组tsc实际通过 |

最终11个相关用例通过；普通补验整组预算5分钟、每项取剩余时间且最多60秒，实际约26.1秒，全部child/pipes关闭、无超时、每项testedInputUnchanged=true。源码没有变化，032/033其余有效存储/正式适配器结果沿用；没有机械重跑UI、安装、原生命周期边界或根正式FullTest。check仍有node_modules/workspace配置同步提示，实际检查通过，不为此扩展重装或修改依赖。

## 测试成本处理线

只读解析034已有TAP并查当前准备入口，见 [test-cost-observation](artifacts/test-cost-observation.json)。最慢三组：Close提交边界140.562秒、第二Archive跨进程边界133.482秒、Reopen提交边界113.549秒；这些是包含准备的整用例时间，不能据此直接分配每次安装耗时。`lifecycleTarget`已复用一个completed seed，但每个clone仍执行一次pnpm install；`passedTarget`在每个边界重做formal准备，`closedTarget`再做Close。第二Archive三个故障点分别重建首个归档及第二Change前置。

后续优先测这几组的重复安装和不属于被测边界的前置成本，规则组合可以用较轻的受控状态；实际CLI、跨进程恢复及关键写入故障边界继续保留。复用前置不代表复用正式验收PASS，不能搬移场景唯一状态或去掉身份/目标路径核对。本Run先完成034稳定性修复，**尚未改这些成本组或宣称获得全量提速**；不在本修复中改业务架构、建测试平台/gate或补历史。

## 维护代码与增长

见 [line-counts](artifacts/line-counts.json)，排除依赖、生成物及Run材料：

- src前三：application/delivery-full-test.ts 401、adapters/openspec.ts 346、adapters/lifecycle-store.ts 336。
- tests前三：action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394。
- scripts前三：proofs/mvp-d01-c-explore.ts 678、proofs/mvp-d01-d-explore.ts 487、proofs/mvp-d01-a-explore.ts 463。

直接035前副本为可靠基准：test-store.test.ts 263 → 267（+4），仍负责该存储适配器与Windows共享准备，不混入其他流程。产品test-store.ts仍150；上述前三未扩展。旧C/D proof保持限定用途，本轮不扩展，不用转发层压行数，无硬门槛或独立台账。

## 独立定向审核交接

直接Author为035。Reviewer读取本Run、当前tests/test-store.test.ts与短名before副本、实际timing和verified结果，审核诊断确定性、同步是否真实释放、真实共享与mock有限重试的分工、持续失败保护及补验充分性。产品032/033批准部分继续有效；仅在实际需要时由本Run定位034原失败，不累积旧输入链，不复审其他Change。

完成后下一步仅 `review-delivery-repair / reviewer / awaiting-independent-review`。D03仍open/manual-bootstrap，A/B/C归档绑定、累计10、无活动根Change保持；最新正式fullTest仍为034 failed、完整声明与11个未执行项保持。035是普通focused修复交接，不是新正式FullTest或独立批准。未执行Close、Git、目录清理、激活或子智能体；未自动重跑FullTest。
