---
deliveryId: 20261010-03-storybook-and-real-usage
planningSlot: MVP-D03
actionId: mvp-d03-delivery-repair-01
actionType: delivery-repair
role: author
run: "032"
status: submitted
actionStatus: completed
date: 2026-10-11
scope: delivery
baselineCommit: ba3b9926bb4ec329dfdf05077e3ec22d77e2de28
failedFullTestRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/031-delivery-full-test/run.md
collectionRef: .mendi/runs/20261010-03-storybook-and-real-usage/031-delivery-full-test/artifacts/plan.json
stageSkillRef: skills/actions/delivery-repair/SKILL.md
finishedAt: 2026-10-11T15:54:56.824Z
result: scoped-repair-ready-for-independent-review
outcome: complete
---
# MVP-D03 EPERM 范围内修复与定向交接

Owner 指令：先定位 031 的 EPERM 原因，按实际原因做范围内修复和必要补验，保留失败现场及历史 Run，完成后停在独立定向审核，不直接重跑 Full Test。保持 Author，本Run承载同阶段诊断、修复和检查，完成只表示 Author 材料可交接，未产生独立批准。

## 诊断事实与确定性

031唯一失败为根回归 #122 的 Reopen 中断恢复用例；错误实际发生在 passedTarget 准备其测试结果时。prepared 到 running 的 result.json 原子替换返回 EPERM，业务子进程尚未启动（pid null、两份日志0字节），未进入 Reopen 被测中断点。没有业务断言失败或 Reopen 实现缺陷的直接证据。

本次只读检查：原写者 PID31980 已停止；结果/暂存文件为普通 Archive 属性，父目录不是重解析链接，所查结果ACL允许Modify且未见Deny。四个直接现场文件与031已保存短名副本逐字节相同，mtime仍为原失败时间；原lock与暂存文件都保留。详情见 [diagnosis](artifacts/diagnosis.json)，旧现场副本直接引用 [031 observation](../031-delivery-full-test/artifacts/failure-site/observation.json)，不再复制。

在新隔离目录用真实Windows只读句柄（FileShare.Read，不含Delete）复现：覆盖现有文件得到同样EPERM，原结果和暂存文件完整；释放该句柄后同一rename立即成功。输入为 [sharing-proof.ts](artifacts/sharing-proof.ts)，实际输出见 [sharing-proof.stdout.log](artifacts/sharing-proof.stdout.log)。当前Node的libuv1.51.0源码中，rename调用MoveFileExW，AccessDenied映射EPERM，普通Node文件打开允许delete sharing；参考 [libuv Windows FS](https://raw.githubusercontent.com/libuv/libuv/v1.51.0/src/win/fs.c)、[错误映射](https://raw.githubusercontent.com/libuv/libuv/v1.51.0/src/win/error.c) 和 [Microsoft FileShare](https://learn.microsoft.com/en-us/dotnet/api/system.io.fileshare?view=net-9.0)。

**已确认的是失败位置、Windows共享拒绝机制及原实现一次拒绝即中断的行为。031当时的具体占用者没有句柄跟踪，无法事后确认；短时共享/过滤干扰最符合现有材料，但这是推断，不能宣称已证明杀毒、索引或某进程造成031。** 当前权限与属性也只说明保留现场现状，不能还原所有瞬时系统状态。

## 实际修复与写入范围

- src/adapters/test-store.ts：仅Windows EPERM / EBUSY，对同一已写暂存文件的rename给予500ms内部等待预算，每次间隔至多25ms；每次等待后重核受管路径和本次直接原结果/暂存内容，变化即停止。其他错误立即传播，终态和身份检查继续在暂存写入前执行。持续失败保留原结果、唯一暂存文件及调用者锁，不删原文件、不改权限、不重新分配执行或重启业务命令。操作系统I/O本身耗时不由这500ms等待预算认证为硬实时上限。
- tests/test-store.test.ts：新增上述Windows故障机制、持续失败与内容冲突、原始错误传播、实际启动次数及终态/身份保护的定向测试；没有改tests/fixtures或旧proof。
- 当前032及其artifacts保存本次材料；manifest只更新当前latestRunRef/next/stopBoundary，031 fullTest failed及其引用保持；README补必要行为说明和当前入口，openspec/config.yaml只同步当前背景。

完整本轮写入清单见 [verification](artifacts/verification.json)，已有源码差异见 [implementation.patch](artifacts/implementation.patch)，新增测试直接读当前文件。没有修改其他Change、任何历史Run/正文/artifacts/verdict、依赖声明或路线图；未复制历史证据树，也未建立hash清单、新gate或通用文件执行平台。

## 必要补验

| 实际入口 | 结果与覆盖 |
| --- | --- |
| sharing-proof.ts及两个当前TypeScript准备脚本的严格noEmit检查 | 均exit0；真实句柄拒绝/释放复现，两个脚本类型检查不只依赖Node执行成功 |
| node --test tests/test-store.test.ts | 最终7/7，0 skip；真实短时与持续占用、其他错误、原/暂存变化、最多一个业务child、持续拒绝不启动child且保留锁、终态/身份拒绝 |
| pnpm build | exit0，实际当前src编译到dist |
| node --test --test-name-pattern="reopen 各提交边界" tests/lifecycle-writes.test.ts | 1/1；031原失败用例在新隔离目标通过，覆盖其九个原有提交边界 |
| node --test tests/test-execution.test.ts | 7/7；实际结果/日志、取消与停止、unknown保留、身份/路径/输入检查及查询 |
| node --test --test-name-pattern="正式运行新子执行|真正非零|选定启动失败" tests/delivery-full-test.test.ts | 3/3；父子意图、实际非零、启动失败及取消结果；属于隔离协议回归，未执行根D03正式FullTest |
| pnpm check | 初次及最终exit0，实际format/lint和src/scripts/tests三组tsc通过 |

总计18个相关行为用例通过；原始日志只各保存一份，实际命令/退出/close/时间见 [verification](artifacts/verification.json) 与 [focused-summary](artifacts/focused-summary.json)。focused命令采用既有前台进程与有界收尾适配器，整组10分钟，实际每项取剩余时间，全部child/pipes关闭，未超时；准备输入为 [focused.ts](artifacts/focused.ts)，不是产品正式执行记录。

新增测试首轮6/7失败为测试把覆盖目标误写成移动被占用源（EBUSY）；第二轮6/7失败为短时句柄自行关闭后测试仍写stdin产生EPIPE。均只改当前新增测试，原始test-store及test-store-2日志保留；test-store-3为最终7/7。当前Run创建脚本另有一次读回后的一次性变量笔误，finally已释放自己的根锁，随后读回确认；未改失败沙箱或历史，不用新Run追记普通准备错误。

最终check显示node_modules/workspace结构不同的warn；其格式、lint、全部tsc实际通过，未为提示扩展重装或验收。无关UI、独立安装、Vue组件/stories和已批准A/B/C结论不机械重跑。已有稳定安装未被覆写，验证对象为当前源码和新dist；031安装候选仍属于旧失败尝试，不充当本修复的已安装证据。

## 维护代码行数与职责

按受控维护代码物理行统计，排除依赖、生成物和Run材料，见 [line-counts](artifacts/line-counts.json)：

- src前三：application/delivery-full-test.ts 401；adapters/openspec.ts 346；adapters/lifecycle-store.ts 336。
- tests前三：action-write.test.ts 467；planning-cli.test.ts 444；delivery-repair.test.ts 394。
- scripts前三：proofs/mvp-d01-c-explore.ts 678；proofs/mvp-d01-d-explore.ts 487；proofs/mvp-d01-a-explore.ts 463。

可靠基准ba3b992：test-store.ts从126增至150（+24）；新增test-store.test.ts263行，只负责该适配器及必要Windows句柄准备。上述前三未扩展；当前源仍为执行记录存储职责，不需要拆纯转发层。旧C/D proof已有记录流与归档效果混合职责，本轮不扩展，继续保持限定用途；将来确需扩展时按AGENTS先整理。本轮没有行数门槛或独立台账。

## 独立定向审核交接

当前直接Author为032。Reviewer读取本Run、当前src/adapters/test-store.ts与tests/test-store.test.ts差异、当前验证，再由本Run定位031实际失败与原完整集合；核对诊断确定性、有限等待是否适合、持续失败/终态/写入安全/启动次数保护及补验范围。只针对这些变化给独立结论，不复审或补写旧A/B/C历史，不以夹具中的Reviewer声明作为真实批准。

下一步review-delivery-repair / reviewer / awaiting-independent-review。D03仍open/manual-bootstrap、累计10、无活动根Change；031正式结果仍failed，原集合其余未执行组保持未执行。未重跑根正式FullTest、执行Close/Git/清理、激活Change或启动子智能体。正式新整次原集合只能在独立批准及相应授权边界后执行；focused通过不替代它。
