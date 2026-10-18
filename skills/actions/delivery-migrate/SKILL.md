---
name: mendi-delivery-migrate
phase: delivery-migrate
role: author
---

# 显式旧 product 迁移

先确认实际 Owner 对目标与本次格式转换的授权。普通旧 product 仅查询；manual-bootstrap 不转换。迁移不安装工具、不访问 OpenSpec、不执行业务命令或原生归档。稳定切换和真实目标迁移各依授权，不因拿到预览自动 apply。

`delivery migrate preview --project <root> --json` 只输出当前选定 Delivery 的计划，不写文件、不保留编号。明确保存输出到该项目内 JSON，检查真实来源、已知各轮目标、当前交接和限制；缺首次 Open 但直接范围 / Close 充分时明示 legacy-baseline，不补造 Open 或未知旧轮。真实缺口、矛盾或未归属成果停止；未知说明 Ref 不递归展开。

获授权的 Author 用 `delivery migrate apply --project <root> --input <项目内预览.json> --role author --actor <标识>`。工具重新计算实际计划、锁内复核直接输入与预计占号，只转换项目入口及当前选定 manifest，保留其他 Delivery 和旧 Run / verdict / 日志 / 归档。收据为同级 NNN-delivery-migrate，migrationRunRef 仅标记转换与旧编号边界，不替代原 deliveryRunRef、binding.latestRunRef 或原 Action / actor / draft 正文。原交接须按原角色与 actor 继续；迁移不是新阶段或新验收。

完整 open / closed、普通 Author / Reviewer / repair draft，以及无未确认效果的 Archive prepared / none 可以预览。旧 pending、运行 / prepared 测试、不完整提交或原生效果未知时，必须先在另行授权下使用兼容旧版恢复完成，再重新预览；新版没有恢复旧格式的例外。写锁存在时核对现场，不删锁绕过。

迁移提交中断后保留原编号、锁与直接现场。Owner 另行核对原写者停止及锁处置后，由原 actor 显式 `delivery migrate resume --project <root> --run <本次迁移 Run> --role author --actor <原标识>`。intent 已写但 pending 未发布时也只补明确该次提交；原输入、角色、编号或对象变化拒绝，不从最大号猜对象，不重新算一套范围，不改终态，不自动清锁 / 回滚 / 降级。没有完整原 intent 仅诊断，不补造。

普通重复 apply 返回 already-migrated；同次完整 resume 在目标仍匹配时返回 already-completed。后续工作改变后旧恢复陈旧。成功后读取原协作交接，停在实际 Owner 指定边界；不自动执行 Git、下一 Change、Full Test 或 Close。
