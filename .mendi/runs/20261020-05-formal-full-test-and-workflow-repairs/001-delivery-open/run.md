---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: null
planningSlot: MVP-D05
actionId: delivery-open-001
actionType: delivery-open
role: author
actor: codex-author
run: "001"
status: completed
actionStatus: completed
result: recorded
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/delivery-open/SKILL.md
---
# Delivery Open：MVP-D05

Owner 原始指令：好的，按照上述处理，owner 授权 open D05。本轮保持 Author，止于 Delivery checkpoint。

## 范围与依赖

以唯一长期路线图 §7 MVP-D05 为当前规划。D05-A 统一正式 groups-v1 Full Test；D05-B 新增未 Close 追加 Change CLI；D05-C 精简 proof/inputs/artifacts（依赖 A）；D05-D 最新 Run supplement/amend（依赖 C）。D05-A 与 B 可独立实施。

## 实际前置

D04 已 Closed，最终 Run028 记录稳定安装 0.2.0，归档总计 13，当前 OpenSpec 无活动 Change。
先前 external-full-test WIP 六个文件已存 Git stash，D05 已创建独立 Git 分支；本轮不将旧实验当成被批准的 D05 代码。
项目仍采用 manual-bootstrap，产品 CLI 对已有人工历史只读；故按之前 D04 已使用的人工 Open 记录方式登记，不虚称产品 CLI 成功写入。
project.json 仅追加 D05 索引并切换 activeDeliveryId；D01-D04 manifest 原字节不变。当前变更槽位已登记，changeBindings/changeBatches 为空、activeChangeId=null，不创建 Change、不开正式 Full Test，也不更改 Archive 计数。
前置与本次直接材料见 artifacts/preflight.json。

## 停止边界

完成仅表示 D05 state=open 和交接已记录，next 为 delivery-checkpoint/awaiting-owner-instruction/author。下一 Change 需要 Owner 原始消息明确包含 owner 授权 及目标和范围；不自动激活 D05-A，不执行 Git commit/push、Full Test、Close、安装或部署。
