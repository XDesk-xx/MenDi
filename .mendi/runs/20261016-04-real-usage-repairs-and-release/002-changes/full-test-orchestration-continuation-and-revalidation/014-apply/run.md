---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: full-test-orchestration-continuation-and-revalidation
planningSlot: MVP-D04-B
batchId: 002-changes
actionId: full-test-orchestration-continuation-and-revalidation-apply-01
actionType: apply
role: author
actor: codex-author
run: "014"
status: completed
actionStatus: completed
outcome: complete
result: implementation-ready-for-review
nextAction: review-apply
nextRole: reviewer
completedOn: 2026-10-17
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/apply/SKILL.md
reviewProposeRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/013-review-propose/run.md
---

# MVP-D04-B Apply

013 独立 review-propose approved，固定 Author012。Owner 已指示 Apply，保持 Author，完成停独立 review-apply。按28项任务增量实施，不修改 DreMo 或稳定安装，不执行 Git 写入。

## 实施

新增 core 的 group-plan / group-report / group-records 与 repair-record，分开计划、实际组完成、typed 记录与兼容解析；adapters 的 group-store / group-events 负责本次直接事实和增量读取；application 的 group-admission / group-attempt / candidate-verification 分开准入、真实执行 / 持久化和候选构造。原 project 入口只接当前类型，原 full-test 保留 command 分支，不把新语义堆回其长流程。

显式 `mendi-group-tests/1 / groups-v1` 使用已有 full package script。持有原项目锁先固定父子意图、计划 / 候选 / 选择与受管请求，再通过两个受控环境路径启动真实 pnpm。原 command outcome 保持；valid / invalid / unconfirmed 和 durable finished 分开。必需 skip / TODO / 零业务执行、晚退出、取消、矛盾报告、未知资源及保存失败都不能成为通过来源。安全完成的协议错误释放自有锁，真实未确认保留现场。

initial / continue / retest 保存新的 delivery-test-attempt，完整扁平 progress 保留最近观察和未解决直接失败。尾项通过后仍可固定原中段修复；复验消费当前完整独立批准，逐组核对影响 / 沿用。公共 / 未知影响须扩大。当前组后来失败时，不能任选旧成功；协议 invalid 的选中组全部不可沿用。取消与普通断言失败分开，已安全结束的取消允许显式 initial 全量重跑，部分事实仍不可复用。

候选结论是独立 delivery-verification，不执行测试。构造时核对唯一明确直接来源、实际 child / 报告 / 日志、当前进展与必要独立批准，保存有限来源 / 影响 / 基线快照。缺口为 incomplete，可显式补齐来源再构造，不强迫重跑已经确认的事实。查询与 Close 只消费当前结论和自身快照，不递归旧失败 / Review 正文或日志。Close 恰选旧 fullTestRunRef 或新 verificationRunRef；新进展替代后不能退回旧 verified，Reopen 的新轮不继承旧结果。

目标继续拥有实际业务与资源，参考 Node runner 和同次只读复用 / 独立 Worker 消费者放在受控 fixtures，不建设通用调度 / 缓存平台。新增协议指导、修复 / 独立修复审核 / Close 方法与 CLI / README 接线。正常人读执行可观察当前增量组活动，但明确等待最终回执、实际进程结束和持久确认；JSON 不混入进度输出。时间保留单调基准、UTC、父子包含与缺测说明，不推算百分比、ETA 或无依据提速。

## 验证与已发现问题

本次受测材料为当前 delivery 分支、HEAD `168a4cb54f0c9028eaf9c271b43d9ee14c3ae904` 加本次未提交工作区实现 / 测试 / 方法差异；该 HEAD 是 A checkpoint，不声称单独的旧提交已包含 B。新组模式只在隔离 product 目标实测，根 manual-bootstrap 没有被迁移或冒充正式验收。

使用目标 openspec-apply-change 与本项目 apply 方法、增量实施和故障定位方法。实际任务 instructions 为 repo-local / spec-driven，初始0/28；013 批准的固定输入和六份规划已读取。正常推进逐项更新实际 tasks 并重新读取 instructions，不新建逐条 Action / Run。

定向场景及直接输入见 [验证映射](artifacts/verification-map.md)。首批组真实执行4/4、资源 / 持久边界6/6、排除 / 构建 / 同次复用3/3、真实 CLI恢复与新轮1/1已通过；后续扩展的来源 / 公共输入和取消负例随新完整集合核对。夹具中的 Author / Reviewer 只验证产品准入，不能批准本仓库。

真实刺激发现两个 Node 层级问题并保留原失败：空文件根容器也被计为一次通过；文件内 cancelled 在根摘要又折成容器 failed。参考接线现以文件业务摘要记计数，根另核结束 / 错误，空文件没有业务执行，取消不被业务失败或成功吞掉。首次原报告和原事件及补验入口均在验证映射中。

工程检查的实际类型 / 格式失败均保留，工程候选 pnpm check 已通过（[输出](artifacts/check-final-candidate.log)）。old command status 的返回值现在是明确类型 union；原测试和三个受影响旧 Explore 程序仅补真实命令类型收窄，未扩展 / 重放完整 proof 或修改旧输出。根第一次集合因 Author 补充取消消费修正而显式中止，保留 [中止说明](artifacts/root-test-first-interruption.md)，不能作为完整结果。后续根集合 [root-test-final.log](artifacts/root-test-final.log) 也保留原件；不把之前片段拼接成 PASS。

后续该集合观察到两项旧入口兼容失败：mode 分流在 try / 范围准入之前读文件，破坏原返回值和拒绝优先级。保留原失败及[停止说明](artifacts/root-test-final-interruption.md)，没有放宽原测试。公共 formalWorkspace 准入现先于 mode 读取，读文件位于原异常处理内，分流期间实际字节也受复核。旧准入和新增查询 / 快照 / 诊断等定向集合 [repair-focused.log](artifacts/repair-focused.log) 23/23通过；额外真实启动失败 [launch-focused.log](artifacts/launch-focused.log) 1/1通过，确认不是协议失败且显式 initial 使用新 child 身份。最新 [check-final-repaired.log](artifacts/check-final-repaired.log) 通过。

重新从头执行的根 `pnpm test` [root-test-repaired.log](artifacts/root-test-repaired.log) 已273/273通过、exit0，耗时2328890ms；其直接原件位于 regression-repaired。之前两次中止 / 失败集合不参与本次完整结论。组的未启动预检保留实际 stderr / stdout 诊断；陌生端口阻断未启动业务，不伪造失败测试计数；当前与历史候选明确展示轮次 / 当前性，verified 等待 Owner 指令，不自动 Close。

完整根集合后额外做了一个直接输入读中变化的真实 proof：多个组共用同一报告时，后读可能覆盖首次字节快照，导致变化未被发现；同时真实 typed Author 记录未拒绝不适用的 verdict / Owner / Archive 字段。[原失败](artifacts/consistency-before.log)2/2失败及直接原件保留，修正后 [复验](artifacts/consistency-after.log)2/2通过。新模式现在保留首次直接快照，重复输入变化即拒绝；typed 记录核对自身提交状态和结果，不承认自签审核字段。补测真实 Node 取消加 wrapper exit0 的矛盾应为 invalid，并释放已安全结束的自有锁。

上述收尾修改限新 typed / group 分支；旧单命令分支未再改变。按实际影响复跑全部 group 测试及旧 delivery-admission，沿用273项完整根集合中未受影响的旧分支结果，不把两个集合拼称新的全根测试。最终全部受影响 group 场景及旧 delivery-admission [final-focused.log](artifacts/final-focused.log)31/31通过、exit0，耗时377245ms；[check-final.log](artifacts/check-final.log)通过（格式 / lint / 三套真实 TypeScript 检查），[OpenSpec strict](artifacts/openspec-final.log)通过。

## 维护代码规模与职责

按 `rg --files -g *.ts src tests scripts` 的维护文件统计物理行，排除被忽略的依赖 / 生成物；与修改前同口径现场基准比较，[详细结果](artifacts/code-counts.json)。新文件记为新增，不补造旧基准或行数 gate。

| 目录 | 物理行数前三名 | 修改前 → 当前 |
| --- | --- | --- |
| src | application/project.ts；core/delivery-runs.ts；application/delivery-lifecycle.ts | 354→374（+20）；272→372（+100）；334→371（+37） |
| tests | action-write.test.ts；planning-cli.test.ts；delivery-repair.test.ts | 467→467；444→444；394→394 |
| scripts | proofs/mvp-d01-c-explore.ts；proofs/mvp-d01-d-explore.ts；proofs/mvp-d01-a-explore.ts | 678→678；487→487；463→463 |

当前明显增长来自新协议与 typed 候选路径：实际准入 / 报告 / 执行保存 / 来源核对已按职责分开；新增367行的 group-attempt 负责同一次真实操作的父子意图、执行、提交与故障包络，不解析计划 / 业务覆盖或构造候选。若继续增加执行子路径，先分开提交收尾与计时诊断，避免扩成第二个通用执行器；本次没有加纯转发层。project 的增长限当前类型查询接入；delivery-runs 的增长是两种新 typed 终态与非法组合准入，具体协议 / 影响 / 候选字段解析已交给 group-records / repair-record；若继续扩充记录类型，先按记录族分离准入，不继续堆入主分流。delivery-lifecycle 的增长是新 selector、直接候选快照和旧分支共用提交边界。没有向 openspec adapter 或旧大 proof 扩展新平台职责。后续若再扩大生命周期入口，应先继续分开其 selector / 验收准入，不靠转发层压行数。旧 C / D 全流程 proof 保持原用途，本次业务场景在分组 tests 中。

## 授权与边界

保持 Author，无 verdict。根记录仍 manual-bootstrap；A 的011归档及旧 Run / verdict、路线图和三份反馈原件、主规格、包版本 / 依赖锁与稳定安装保持；C未激活、累计归档11。Git HEAD仍168a4cb，未 commit / push，未修改 DreMo，未进行根正式 Full Test / Close、Archive、真实迁移或安装切换。最终完成后交独立 review-apply，不自动继续。

## 独立审核交接

本014是固定 Author Apply 审核对象，28项任务按实际 instructions 逐项完成。next 为 review-apply / awaiting-review / reviewer，authorRunRef 指向本 Run；本会话保持 Author、没有 verdict。独立审核需核对本次实现、组协议 / 来源 / 修复 / 兼容消费及直接测试证据，不能以任务全勾或工程 PASS 替代独立结论。

[边界读回](artifacts/boundary-readback.json)确认根 manual-bootstrap、历史与受保护规划无 Git 差异、累计归档11、HEAD / branch 及稳定包版本 / 时间戳保持。没有接触 DreMo。根没有执行正式 Delivery Full Test / Close；隔离目标的测试生命周期只用于验证实现。未 commit / push、未修改稳定安装。
