---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: null
planningSlot: MVP-D03
actionId: delivery-open-001
actionType: delivery-open
role: author
run: "001"
status: completed
actionStatus: completed
result: recorded
recordingMode: manual-bootstrap
date: 2026-10-10
---
# Delivery Open：MVP-D03

Owner 原始指令：owner 授权 delivery open，开启 MVP-D03。保持 Author，按唯一路线图 §6.2 / §7 开启“Storybook 与实际使用”，本次仅建立 Delivery 范围与规划槽位，停在 delivery-checkpoint。

| 槽位 | 目标 | 依赖 |
|---|---|---|
| MVP-D03-A | Storybook 轻量接入 | 已归档 MVP-D02-C |
| MVP-D03-B | 独立安装与简短项目指导 | MVP-D03-A |
| MVP-D03-C | 最小真实交付验收 | MVP-D03-B |

范围、验收和验证直接读取根路线图对应章节，不在本轮生成 Change 方案或 tasks。A 使用目标项目自己的配置、组件、stories 和脚本，真实验证预览 / 交互与服务启动、复用、停止；项目启用官方 MCP 时再核对实际版本和能力，不新增 MENDI 前端或自有 MCP adapter。B 形成稳定独立安装和简短项目入口，落实路线图文档职责收敛；C 在 UI / 非 UI 实际最小目标验证完整接线、复审、失败修复与新会话继续，最终 Full Test / Close 保持独立授权。

新 Delivery ID 为 20261010-03-storybook-and-real-usage，manifest 位于 .mendi/delivery-groups/20261010-03-storybook-and-real-usage/manifest.json；本记录为新 Delivery 的 001-delivery-open。project.json 追加独立索引并选择 D03，累计归档数保持 7；D01 / D02 的 closed manifest、D02 最近 032 Close 和已有 Run / verdict 原样保留。当前 main 基准为 3ac54cddc4c65fac12f126fde1662e38f4490b54；本轮不创建 Git 分支或提交。

依赖在 D03 内自包含：B → A、C → B。A 的已完成 MVP-D02-C 单列 externalDependsOn，不把旧槽位引入新范围。D03 的 changeBindings / changeBatches 为空，activeChangeId=null，不提前建 Changes 批次或 Change 身份，不继承 D02 的 Full Test / Close 为 D03 已验收。

继续沿用根项目 manual-bootstrap；现有 product 新 Open 拒绝人工记录，本次按 Owner 授权直接保存人工可查询记录，不迁移或重放历史，不伪造 product 命令成功。使用项目 delivery-open 方法核对实际前置、身份、受管路径与写入冲突，取得本次自有锁并在锁内复核候选；成功后正常释放，错误现场不自动清理。

必要前置及候选解析见 [preflight](artifacts/preflight.json)，本次项目入口修改前内容仅保存一份 [project-before](artifacts/project-before.json)。固定 OpenSpec 1.14.1 已核对，当前无活动 Change。只修改记录与背景说明，不新增实现测试或重跑旧验收；未安装 Storybook、MCP、Impeccable、DBX 或其他工具，未启动服务、执行 Explore / Review、Git、下一阶段、Full Test / Close、部署或临时清理。

Open 完成后 next=delivery-checkpoint / awaiting-owner-instruction / author。候选 checkpoint 标题：delivery: checkpoint MVP-D03 Storybook 与实际使用范围与分组。下一 Change 激活仍须 Owner 明确目标与范围；当前授权不自动触发 MVP-D03-A。

实际新进程 status / next（JSON 与人读）、固定 OpenSpec list、选择与累计数及前一 closed Delivery 保留情况见 [readback](artifacts/readback.json)。
