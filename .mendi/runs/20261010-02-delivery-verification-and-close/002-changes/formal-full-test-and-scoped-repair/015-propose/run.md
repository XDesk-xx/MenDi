---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: formal-full-test-and-scoped-repair
planningSlot: MVP-D02-B
batchId: 002-changes
actionId: formal-full-test-and-scoped-repair-propose-01
actionType: propose
role: author
run: "015"
status: completed
actionStatus: completed
result: proposed
date: 2026-10-10
---

# MVP-D02-B Propose

Owner 指令：propose。保持 Author；实际 status / next 和 [014 Review Explore](../014-review-explore/run.md) 确认合法交接为 Author Propose，014 已批准其固定的 013 Explore。Owner 先前对 MVP-D02-B 的原始范围继续有效；本阶段只形成方案，停在独立 Review Propose。

## 实际指引与依据

使用已安装 `openspec-propose` 及项目 `skills/actions/propose/SKILL.md`。固定 OpenSpec 1.14.1 的 list / context 确认 nearest repo root 为 MenDi，复用原生已有 Change，不再次 scaffold 或创建 explore.md。实际读取 config、proposal / specs / design / tasks instructions 和已完成依赖，按 proposal → specs / design → tasks 编写并逐步 status 读回；原始输入 / 输出见 [instructions](artifacts/instructions/)。各 artifact 无附加 rules，中文、实际角色、人工兼容、必要引用及单独授权约束均进入方案。

沿用 013 / 014 的四组可靠限定实验，不重新认证为正式验收。按本次方案实际查阅执行协议、tests.ts 持锁、action-context / action-store、Run 路径 / 编号、workspace / query / diagnosis、方法加载、CLI 参数 / 分派和就近测试。确认公开 runTest 不能被持同锁外层嵌套，归档后修复须有 Delivery 记录，旧 Change draft 规则不能直接作为豁免使用。

## 产物与关键决定

| 产物 | 当前内容 |
| --- | --- |
| [proposal.md](../../../../../../openspec/changes/formal-full-test-and-scoped-repair/proposal.md) | 问题、能力和影响；普通 command 公开合同不变 |
| [design.md](../../../../../../openspec/changes/formal-full-test-and-scoped-repair/design.md) | 四个入口、声明格式、直接输入、同级 Run / 两个指针、同锁执行、修复审核、完整重跑及适用性边界 |
| [delivery-verification delta](../../../../../../openspec/changes/formal-full-test-and-scoped-repair/specs/delivery-verification/spec.md) | 新正式验收 / 范围内修复能力的可观察要求与场景 |
| [delivery-workspace delta](../../../../../../openspec/changes/formal-full-test-and-scoped-repair/specs/delivery-workspace/spec.md) | 当前 Delivery 操作优先、必要查询输入和关联冲突；旧场景保持 |
| [action-runs delta](../../../../../../openspec/changes/formal-full-test-and-scoped-repair/specs/action-runs/spec.md) | scope、同级 Run、固定 Author / 继续 / 修订；正式 Full Test 不可普通 submit 自填 passed |
| [tasks.md](../../../../../../openspec/changes/formal-full-test-and-scoped-repair/tasks.md) | 六组 30 项未勾任务，就近验证 / 文档，最终组为跨 Change 集成与工程收敛 |

首次正式 admission 读取本轮必要 Archive / Review Apply / 固定 Apply Author，完整集合与实际 full 入口从声明和目标真实配置确定；普通子结果仍为 command / formalDeliveryTest=false。后续在已核对事实仍适用时沿用当前正式 Run 的范围 / 批准快照，另读当前定向 Review / 新 Author，不追读全部旧批准或失败父链。

选择 `delivery full-test run / status`、`delivery repair start / review` 四入口；修复复用 save / submit / continue，Review 固定新 Author，不复活归档 Change。修订使旧 approved 失效，changes-requested / rejected 保留 verdict 和不同边界。修复后的新正式结果来自整次相同 collection，不拼接旧 full 与新 focused。

`deliveryRunRef` 表达当前 Delivery 进展，`fullTestRunRef` 定位最近正式结果，两者用途不同；新意图固定后不回退旧 PASS。普通查询只读当前实际需要的 Run / 子结果 / 日志，不追读 Archive / 审核正文 / Ref 扩展。身份、受管路径、写入冲突和未完现场检查保留，无工程、行数、证据数量、全库 hash、引用注册或通用恢复 gate。

材料与事实分别呈现：保存实际提交 / 必要差异，或无 Git 时明确受测材料；CLI 不自动扫描 Git 或认证任意源码。已知范围 / 入口不匹配如实报告，materialApplicability 要求实际语义核对；持久 passed 只说明声明下完整执行通过，不能宣传当前源码已认证。说明整理可沿用，代码 / 测试 / 配置变化判断影响，正式修复仍整次重跑；不增加材料批准阶段或改写完成 Run。

执行生命周期提取实际复用职责，一个 lease 内完成父子意图、真实启动及日志 / 结果读回。unknown / 写入失败不发布已确认通过，保留现场停 Owner，无自动 finish / retry / unlock。driver 先整理深层分派，新增验收独立分组，不扩展旧 C / D proof 或 planning-cli 长流程。

## 验证与限制

最终固定工具 strict validate exit 0、1/1 valid、issues=[]；status 的 proposal / specs / design / tasks 均 done、planningComplete=true；apply instructions 为 ready、0/30 complete。原始响应保存于 artifacts。材料可供审核，全部任务未实施，文件齐备或结构成功不生成方案批准。

本阶段没有 src / tests / scripts / 产品方法 / 主规格修改。014 的 check、构建与 proof 沿用原限定用途，不为仅规划材料重复全量行为测试，也不宣称旧结果认证了正式能力。根依赖同步警告的正常准备列在 Apply；本轮没有安装根依赖或可选工具。未来 Close 仅预留直接消费本轮范围 / 当前适用结果的边界，实际 C 能力不在本轮实施。

## 交接

Author Propose 完成，没有 Reviewer verdict。当前唯一审核输入为本 Run，由独立 Reviewer 核对方案、三份 delta 和 30 项任务及与 014 的一致性，再决定是否允许 Apply。旧 013 / 014 和以前编号、正文、verdict 保持，常规规划检查不另建 Run。

D02 open，D01 closed，A archived，B 当前且 proposed，累计归档数 5；当前为独立 `review-propose`。本轮未执行 Apply、根正式 Full Test、Archive、Git 写操作、Close / Reopen 或下一 Change 激活。

交接后的最终验证见 [validate-final.json](artifacts/validate-final.json)、[native-status-final.json](artifacts/native-status-final.json)、[apply-readiness-final.json](artifacts/apply-readiness-final.json)。新进程 [status](artifacts/status-readback.json) / [next](artifacts/next-readback.json) 均 exit 0，读取 next=review-propose / role=reviewer / authorRunRef=本 Run，source=manual-bootstrap、executable=false。30 项仍全未勾，下一可用 Run 为 016，根无写入锁，没有新建 Reviewer Run。
