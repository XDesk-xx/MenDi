---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-explore-01
actionType: explore
role: author
run: "013"
status: completed
actionStatus: completed
result: proof-supported
date: 2026-10-10
---

# MVP-D02-B Explore

Owner 原始指令：owner 授权激活 MVP-D02-B，开始 explore，核心功能 proof 认证。

保持 Author；范围为路线图 MVP-D02-B 的正式 Full Test 与范围内小修复，完成后停在独立 Review Explore。本轮只增加 TypeScript proof 和受控夹具，不修改 `src/`、主规格、产品阶段方法或路线图范围，不提前编写正式方案。

## 激活与实际背景

固定 OpenSpec 1.14.1 的 `list --json` 确认 nearest root 为 MenDi、无活动原生 Change；`list --specs --json` 返回四项主规格。实际执行 `new change formal-full-test-and-scoped-repair --json`、该 Change 的 `status` 与 `instructions proposal`，并读取 test-execution、delivery-workspace、action-runs 的概要及含全部场景的正文。调用原始响应见 [activation-commands](artifacts/activation-commands/)。Change 仅有原生 `.openspec.yaml`，proposal ready 表示可写，其他产物 blocked；没有 proposal、design、delta specs、tasks 或 Change 级 explore.md。

使用上游 `openspec-explore` 及项目 `skills/actions/explore/SKILL.md`。实际 instructions 的 context 要求中文正文、必要输入按操作区分、人工记录只读兼容、不继承 D01 验收；没有该 artifact 的额外 rules。Owner 原始激活与核心 proof 请求，以及项目约定，授权本轮人工激活记录和可重建实验，不构成产品实施授权。首次读取的 context 仍描述 A 归档后等待指令；本轮同步 README / context 为 B 当前背景，保留实际原始响应。

A 的 011 独立批准、012 实际归档与当前 checkpoint 构成依赖已完成事实；归档位置为 `openspec/changes/archive/2026-10-10-005-sequential-changes-and-test-entrypoints`。B 复用 D02 当前 `002-changes` 批次，Run 连续取 013，不新建批次或增加归档数。MenDi 自身仍是 manual-bootstrap，本轮不调用产品写命令迁移人工历史。

## 会改变方案的事实与候选

1. 现有 `test run --kind full` 只执行目标已有 script。`src/core/test-execution.ts` 强制 `scope:command / formalDeliveryTest:false`；`src/application/tests.ts` 不更新阶段、审核、关联或 Delivery。集合名 full 和退出 0 均不能产生正式验收。正式 Full Test 必须有独立的 Delivery 操作 / Run，声明范围、必要审核、受测材料和完整集合，再消费本次真实执行事实；普通结果继续保留原语义，不回填成正式结果。
2. 现有 `src/application/action-context.ts` 的 `checkWorkspace` 要求活动 Change。两个 Change 实际归档后，旧 `revise-apply` 即使指定真实直接 Apply Author，仍拒绝 `invalid-action`。不能用补建活动目录、重开归档 Change 或改旧 Run 来承接验收小修复。候选采用 Delivery 范围的 Author 修复记录及独立定向 Review，直接绑定当前修复材料；范围 / 方案实质变化回 Owner 重新规划。它应复用角色、不可改历史、写入锁与读回原则，不扩展为通用状态机。
3. 开始正式验收时只消费本轮明确声明的目标 / 范围、必需槽位的完成事实与相关直接审核，以及现有 full 入口的完整集合声明和受测基准。不可只用“当前最后一个 Archive”代替整个交付范围，也不把所有旧 Explore、旧方案、说明 Ref 或失败父链变成必要输入。不同操作分别决定读哪些字段；当前实际输入缺失、错误身份、路径越界、未决修订 / 审核和写入冲突仍拒绝。
4. 修复改变受测源码，前次受测基准不再适用；focused 只认证已运行的局部。修复经独立定向 Review 后，应显式执行新的整个声明集合，保存一个新的正式结果，旧失败 / 日志保持原样。后续 Close 消费直接当前适用结果，不把旧 full 中通过的组与新 focused 拼成 PASS，也不沿多次失败逐层补证。
5. 受测提交与必要未提交差异，或无 Git 基准时的实际材料说明，承担适用性解释。说明 / 日志整理不会自动使全部旧批准失效；源码、测试、命令 / 依赖配置变化要判断实际影响并补验证。实验只比较已知必要材料的字节，没有新增 hash 清单、scriptSha256 或全库 gate。生产中的材料描述、影响判断与当前结果失效方式须在 Propose 收敛，不能把本实验的固定四文件比较直接推广为任意项目的完整性协议。

暂定职责划分如下，操作名称和具体字段留给 Propose：

```text
declared Delivery scope + direct necessary reviews + tested candidate
                                  |
                                  v
                      Delivery Full Test record
                                  |
                         existing test executor
                                  |
               passed <----------+----------> failed
                 |                              |
        applicable current result        scoped Author repair
                 |                              |
       future Close (D02-C)              independent targeted Review
                                                |
                                  new whole declared Full Test
```

正式验收编排应单独承担范围、审核与结果适用性；底层复用现有入口解析、依赖预检、前台执行、日志 / 结果保存，不把新增职责继续堆入 `src/application/tests.ts`。现有 `src/drivers/dispatch.ts` 深层三元分支若本轮新增命令则先整理为直观分派，不引入通用注册框架。受测对象与必要审核读入、执行锁内复核及结果落盘之间的并发变化需在实施验证，不将本轮单进程实验当成并发保证。

另一个接线风险是 `runTest` 自己获取并跨 await 持有项目写锁。正式操作不能在外层持锁后直接嵌套调用它，也不能在无保护的预检之后自动把别次普通结果认领为正式。Propose 应确定同一个操作锁内的范围 / 审核 / 入口复核、真实执行和正式落盘方式；如需整理现有执行编排，应提取真实复用职责，保留普通命令合同，不新增纯转发层。本 proof 未认证这一尚不存在的接线。

## 核心 proof

入口为 [mvp-d02-b-explore.ts](../../../../../../scripts/proofs/mvp-d02-b-explore.ts)，接线输入为 `tests/fixtures/full-test-project/` 的 producer / consumer 和 integration / unit 两组真实断言。复用已有 sequential / Archive / test helper，从受控源码和正常离线依赖准备重建项目，不依赖旧 `.tmp`。未扩展旧 D01 C / D proof。

```powershell
node scripts/proofs/mvp-d02-b-explore.ts <新的证据输出目录>
```

本次最终执行输出到 `artifacts/proof-002`，exit 0，四组全部通过，见 [report.json](artifacts/proof-002/report.json) 与 [proof-002.log](artifacts/proof-002.log)。实际子命令响应与执行结果 / stdout / stderr 只保存于其 [commands](artifacts/proof-002/commands/)，两次原生归档响应单独保存；摘要不重复日志。完整集合实际运行两组的记录见 [executed-groups.jsonl](artifacts/proof-002/executed-groups.jsonl)。修复前后必要输入保存在 before-repair / after-repair，不保存全临时目录或复制历史树。

| 组 | 疑点与真实方法 | 实际结果 | 限制 |
| --- | --- | --- | --- |
| P01 | 受控项目两项经过阶段声明夹具和真实原生 Archive；归档后用现有执行器运行普通 full，并在新进程读回 | 累计 2、无活动 Change；001-full passed、Change 快照 null、formalDeliveryTest=false；入口、manifest 和两项 Archive Run 字节不变 | 阶段 / 审核前置是夹具声明；普通成功不认证正式验收 |
| P02 | 将 producer / consumer 接线夹具置于隔离副本，完整运行 integration 与 unit 两组 | 002-full exit 1、failed；两组均实际执行；新进程读取仍为 failed | 两模块模拟已完成工作之间的接口，不能认证真实 Change 的代码归属或交付覆盖 |
| P03 | 只修 producer 的事件种类，不改测试断言；运行 focused；指定归档项真实 Apply Author 尝试 revise-apply；比较已知受测材料 | 003-focused passed，只运行 integration；旧受测基准变化；旧 Change Action 为 invalid-action；说明变动不改变已知材料，full 命令变动使基准不匹配；必要材料缺失与路径越界拒绝 | review-fixture.json 仅模拟不同 Author / Reviewer 的审核声明及材料适用性，未实际执行独立 Review，也未实现正式修复协议 |
| P04 | 使用修复后的材料，重新运行相同完整集合；新进程分别读旧失败与新成功，比较旧失败结果 / 两份日志 | 004-full exit 0、passed，integration 与 unit 均重新运行；旧失败仍 failed、三文件字节不变；协作记录不变 | 新成功仍为 command / 非正式验收；证明完整重跑与留存能力，未产生正式 PASS 或 Close 授权 |

第一次 proof-001 同样四组通过，但其旧 Change 试探传入了 Archive Ref，不能充分排除修订对象误用。本阶段修正为真实直接 Apply Author，并明确断言错误为 invalid-action 后重跑完整局部 proof；保留 001 及输出，最终依据为 002。不为这次正常修正另建 Run。

## 工程结果、沿用与后续验证

`pnpm check` 最终 exit 0，格式 / lint 各检查 80 文件，src / scripts / tests 三套 TypeScript 检查全部通过，见 [check-002.log](artifacts/check-002.log)。只格式化新增 proof；字节敏感夹具不批量格式化，但纳入真正测试类型检查。第一次检查发现 proof 的未知头部属性及 union narrowing 错误，已改用解析后的 typed record 和显式必要对象检查，再运行通过；不是产品缺陷或额外生命周期流程。`pnpm build` exit 0，见 [build.log](artifacts/build.log)；此后产品源码未改，真实 CLI 子进程使用该构建。

工程调用设置 `COREPACK_ENABLE_NETWORK=0`、`pnpm_config_verify_deps_before_run=warn`，保留既有 workspace / node_modules 不同步警告。隔离项目经明确正常 install 准备空依赖，产品执行仍使用既有禁止自动安装的预检合同。根项目实际正式 Full Test 前需按路线图正常准备依赖；本轮未安装根依赖、放宽产品预检或执行根正式 Full Test。

A 的 011 独立 Review Apply 已记录执行 / 日志 / 查询相关 10/10 回归，009 / 010 留存关联及依赖方面有效证据。产品源码未变，这些结果沿用原限定用途，本轮不机械重跑 139 项或历史 proof，也不宣称沿用旧结果已认证新增正式验收。

Propose / Apply 尚需落实：正式启动的直接 scope / 完成 / 审核输入及缺失、错身份、越界拒绝；声明完整集合和当前材料的适用性；新进程 status / next 选择当前正式 Run 而非最后 Archive / 普通 full；局部修复后固定新 Author 的独立定向审核、拒绝旧批准和明显自签；新完整执行、历史失败留存、unknown / 中断及持久化失败不发布正式通过；新修订或受测配置变化对当前结果的影响、文档整理与失效说明 / 未知 Ref 不扩大成历史 gate。新增验收按场景独立测试，复用仍适用的底层执行回归，不继续扩充 planning-cli 长流程。

Close / Reopen 和新 Open 属于 C。本轮只为它们预留直接消费“当前范围及当前适用正式结果”的衔接，不实现或执行这些操作，不激活 C。

## 交接

Author Explore 完成，result=proof-supported，没有 Reviewer verdict。当前唯一审核入口为本 Run，独立 Reviewer 检查上述关键事实、实验限定用途和候选边界，再决定是否进入 Propose。README / context 只说明当前背景；详细分析、命令、结果与限制在本 Run / artifacts，不另建 Explore 文档或引用注册中心。

下一步：独立 `review-explore`。D02 保持 open，D01 closed，根项目累计归档数 5，A 旧 binding / Run / verdict 原样保留。本轮未执行 Git 写操作、根项目 Archive、Propose / Apply、正式 Full Test、Close / Reopen 或下一 Change 激活。

交接后实际在新进程调用根项目 `status / next --json`、原生 Change `status` 与 proposal 背景，均 exit 0；当前 next=review-explore、role=reviewer、authorRunRef=本 Run，source=manual-bootstrap、executable=false。上游 planningComplete=false，Change 仅有 `.openspec.yaml`，D02 下一可用 Run 为 014。原始读回见 [readback-commands](artifacts/readback-commands/)，没有新建 Reviewer Run。
