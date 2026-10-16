---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: null
planningSlot: MVP-D04
actionId: delivery-open-001
actionType: delivery-open
role: author
actor: codex-author
run: "001"
status: completed
actionStatus: completed
result: recorded
recordingMode: manual-bootstrap
date: 2026-10-16
stageSkillRef: skills/actions/delivery-open/SKILL.md
---
# Delivery Open：MVP-D04

Owner 原始指令：

> role：author
> owner 授权 delivery open，开启 MVP-D04，按路线图的三个 Change 安排，保持 Author，停在 delivery checkpoint。

## 范围与安排

以根路线图 §7 MVP-D04 为唯一总规划，建立新的“真实使用修复与再次发布”Delivery，保留 D03 已完成事实。本次只 Open、登记三个规划槽位和交接，不创建或激活 OpenSpec Change。

| 槽位 | 完整修复目标 | 依赖与顺序 |
| --- | --- | --- |
| MVP-D04-A | Reopen 增量范围与兼容 | 基于既有 D02 / D03；先解决当前轮次边界 |
| MVP-D04-B | Full Test 编排、续测与复验 | 依赖 A；执行准备可独立调查；执行与 Close 消费在同一 Change 内交付 |
| MVP-D04-C | 业务契约、UI 方案与主动澄清 | 可独立于 A / B，不成为前两项的隐含准入 |

验收和具体约束读取路线图对应章节。先核对现有方法与编排，再补必要实现；A 的格式 / 轮次 / 兼容迁移、B 的实际结果粒度 / 资源阻断 / 候选表示及消费兼容、性能取舍和修复版版本号在对应 Explore / Propose 收敛。关键未决产品选择向 Owner 提问，不把候选字段或分钟指标提前定为合同。

三份根目录反馈文件仅作为问题来源，保留原件；不复制 DreMo 历史证据、不重放长测凑统计、不修改 DreMo 或稳定安装。本次不把新 Full Test 规划视为已生效规则。

## 记录方式与实际前置

固定 OpenSpec 1.14.1 已核对，活动 Change 列表为空。此前 D03 为 closed/manual-bootstrap，当前无活动 Change、累计成功归档 10。产品 delivery open 明确拒绝人工历史；沿用既有人工 Open 方式，不执行不受支持的产品写命令，不迁移或伪装 product。使用当前稳定安装的 Delivery Open 方法和记录解析器，核对身份、受管路径、重复目录、直接输入与独占写入冲突；锁内复核后提交，成功释放本次锁，失败保留现场。

新身份为 20261016-04-real-usage-repairs-and-release；新 Delivery 从 001-delivery-open 开始，project.json 追加独立索引并选择 D04。changeBindings / changeBatches 为空、activeChangeId=null，不预建批次或分配 Change ID，不继承 D03 Full Test / Close 为 D04 结论。旧 Delivery manifest 保持本次直接输入原字节，累计归档数仍为 10；不扫描旧 Run 证据树。

本次基准：main / 21226a8655dad2af89573cea3b1369ee26f56abd。开始前路线图已有未提交修订，三份反馈为未跟踪文件，均保留；不把工作树描述为干净。输入和前置见 [preflight](artifacts/preflight.json)，项目入口修改前副本见 [project-before](artifacts/project-before.json)。README 与 OpenSpec context 只更新当前入口和必要背景，不另存完整历史。

## 停止边界与验证

完成后 next=delivery-checkpoint / awaiting-owner-instruction / author。这里停在 checkpoint 节点，未创建分支、暂存或提交；Git 另按明确指令执行。候选标题：delivery: checkpoint MVP-D04 真实使用修复范围与三项安排。

本次未实施、审核或归档 Change，未修改实现 / 产品 Skills / 主规格 / 包版本，未执行行为测试、正式 Full Test / Close、迁移、部署或安装切换。仅对记录与背景说明进行查询读回和差异检查，不以这些检查代替验收。

实际新进程 status / next（JSON 与人读）、固定 OpenSpec list、历史 Delivery 选择及差异检查见 [readback](artifacts/readback.json)；原始输出仅保存于同目录 commands.log。
