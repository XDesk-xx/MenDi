---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
planningSlot: MVP-D05
run: "047"
actionType: delivery-full-test
role: author
actor: codex-author
recordingMode: manual-bootstrap
scope: delivery
formalDeliveryTest: true
testMode: owner-authorized-manual-full-test
executionId: d05-full-test-047
testedCommit: 7445a9f765e91c5574dd649667bee5349dd6a413
status: completed
actionStatus: completed
phase: finished
outcome: failed
result: failed
date: 2026-10-21
finishedAt: 2026-10-21T08:32:40.693Z
stageSkillRef: skills/actions/delivery-full-test/SKILL.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/046-delivery-full-test/run.md
nextAction: delivery-repair
nextRole: author
---

# D05 047 正式 Full Test：failed

本次按 Owner full test + 继续在 manual-bootstrap 根项目上独立执行 F01–F05 完整必需组；未使用产品 v2 groups-v1 原生父 Run。固定受测 Git 7445a9f765e91c5574dd649667bee5349dd6a413。046 历史环境失败保持原样，本 047 不复用或拼接 046 任何 PASS。

## 完整执行结果

F01 check：passed，exit0。F02 pnpm test：passed 336/336，fail/skip/todo 均 0，exit0。F03 UI：准备成功，正式 UI 测试 4/5，1 failed，exit1。F04 离线隔离安装：准备成功，4/4 passed，exit0。F05 八份主规格 strict 与源码 status/next：10/10 个实际命令 exit0。

**本轮总体 outcome=failed**。F03 第五个测试是 Storybook 集成 CLI 的业务断言，但失败发生在被测 Vitest 服务初始化，子进程根本没有枚举故事测试；原错误是 listen EACCES: permission denied ::1:63315。Windows IPv4/IPv6 TCP excluded range 63290–63389 包含默认端口 63315。原子进程日志 artifacts/ui-port-failure-original.log、端口表和判断 artifacts/ui-port-diagnosis.json 均已保留。

## 后续独立诊断（不代替本轮 F03）

仅在 .tmp/d05-047-vitest-port-diagnostic 复制目录中的 vitest.config.ts 内给嵌套 Storybook 项目 browser.api 明确回环 127.0.0.1:64115 和 strictPort，真实 Chromium stories 2/2 passed、exit0。普通 Vitest CLI 参数并未改变嵌套 project 的默认 63315，失败与成功的各自证据见 artifacts/diag-vitest-*.json。诊断未修改本仓库候选源码、依赖锁、Windows 排除表和原 F03 结果。该诊断是修复方向 Proof，不是正式验收 PASS。

## 阶段停止

下一步是 Owner 授权的受控 Delivery Repair（仅修复 Storybook fixture 的浏览器 API 绑定设置），独立 Review 后重新完整 F01–F05 正式验收。当前没有 Close 资格；不 Git commit/push、安装或发布稳定版本、不触碰 DreMo。原 046/047 文件、直接命令与证据保留。
