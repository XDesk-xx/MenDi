# 006 Apply 独立语义核对

固定输入：006 Author Apply、005 对 004 的批准、当前 proposal / design / tasks / 三份 delta，以及当前实现与测试。基准 HEAD 为 982159b42d7b6ce88dea0ebf178e13d75514adae。Reviewer 不修改 Author 实现。

| 范围 | 核对结果 |
| --- | --- |
| v2 模型 | rounds 权威、当前投影、唯一槽位 / batch 归属集中校验；首次 Open 与 Reopen 保存明确范围，旧指针保留原轮。recordRound 同时核对范围、completed 及新 roundId；仅明确迁移编号以前允许缺新字段。 |
| 读写边界 | requireWritable 与共享锁内 guard 覆盖 Action / Run、Archive、普通及正式测试、repair、生命周期；旧格式 resume / finish 没有例外。历史摘要不切换选择、不执行历史 next。 |
| 迁移来源 | preview 收集实际直接范围、前态、Close 和当前交接；无 Open 时保留 legacy-baseline，不伪造历史。完整活动 draft 与 prepared / none Archive 可保留；未知效果、pending、未完成测试及最新产品半提交拒绝。旧空占号与未知说明目录不自动成为恢复前置。 |
| 转换与提交 | convertLegacy 纯转换，intent 重建校验，提交存储与应用接线分开。apply 重算预览并锁内核对；迁移收据不替换业务指针。resume 限原 actor、同一 intent、允许的前后态与原编号，后续实际工作使旧恢复陈旧。 |
| 直接基线 | 来源须同项目登记 product，直接 archived binding 与指定 Close 完成项一致；同 Delivery 必须更早已关闭轮。来源后来 Reopen、旧 ordinal、v1 均可解释，不读取来源活动 Change / 旧审核正文 / 测试日志。 |
| 正式结果 | baselineFacts 和 roundId 固定本轮事实；Close 使用本次正式快照。新轮不继承旧 PASS / repair 批准，同轮原修复规则保持。原生隔离目标测试与根正式 Full Test 授权分开。 |
| 方法与验证 | README、新迁移方法及各受影响阶段方法与 CLI 合同一致；旧夹具显式转成 v1 后才记录待保留字节，没有改写实际历史。测试覆盖正例、拒绝、锁内变化、故障注入和原 actor 继续，不仅验证字段存在。 |

OCR preview 共 321 项，43 项可审核，278 项被规则排除。43 项均已人工审核，无选入项跳过；另补读默认忽略的相关 .test.ts、Markdown 和 JSON 示例，清单见 review-coverage.json。历史 artifacts / 生成物与前阶段未扩展 Explore proof 不作为本次代码候选。100% 仅表示选入文件已处理，不表示正确性证明。

维护物理行数独立复核见 maintained-lines.json；与 006 的 before / after 直接对照一致。src 前三：application/project.ts 354、adapters/openspec.ts 346、adapters/lifecycle-store.ts 336；tests 前三：action-write.test.ts 467、planning-cli.test.ts 444、delivery-repair.test.ts 394；scripts 前三：proofs/mvp-d01-c-explore.ts 678、proofs/mvp-d01-d-explore.ts 487、proofs/mvp-d01-a-explore.ts 463。排除 fixtures / 依赖 / 生成物。

project.ts 302→354，增加状态、历史查询与 bind 基线准入接线，仍是项目应用入口；转换、模型与持久化未混入该文件。delivery-full-test.ts 401→255，准入和实际直接输入复核拆到 full-test-admission.ts 181 行，属于实际职责拆分。其余上述前列文件未增长。旧大型 proof 保持原限定用途，若未来继续扩展则按 AGENTS 先拆 Apply 记录与 Archive 效果组；本次不据行数追改历史或设 gate。

截至语义核对结束，未发现需要 Author 修订的阻断项。最终 verdict 以同目录上级 run.md 中的实际独立执行结果为准。
