---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
planningSlot: MVP-D05
actionId: 20261020-05-formal-full-test-and-workflow-repairs-review-delivery-repair-01
actionType: review-delivery-repair
role: reviewer
actor: codex-independent-reviewer
run: "049"
status: completed
actionStatus: completed
outcome: complete
verdict: approved
result: focused-storybook-port-repair-approved-for-full-rerun
nextAction: delivery-full-test
nextRole: author
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/review-delivery-repair/SKILL.md
authorRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/048-delivery-repair/run.md
failedFullTestRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/047-delivery-full-test/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/048-delivery-repair/run.md
---

# D05 · 049 独立 Review Delivery Repair

**verdict：approved。** 固定 [048 Author Delivery Repair](../048-delivery-repair/run.md) 和其唯一直接 [047 正式 Full Test failed](../047-delivery-full-test/run.md)，另核 [046 首次 failed](../046-delivery-full-test/run.md) 只读历史。本次仅批准局部 F03 Storybook 内层 Vitest browser.api 绑定修复、进入**下一次全套正式 Full Test** 准备；不签发整个 D05 passed、Close、Git、安装或对 DreMo 的操作资格。当前仓库仍为 manual-bootstrap：047 的原 F01–F05 是独立 Owner 授权的人工完整正式执行，不能冒充 product-v2 `delivery-test-attempt/groups-v1` 原生父子 Run。

## 独立事实与范围

047 Full Test 固定 HEAD `7445a9f765e91c5574dd649667bee5349dd6a413`，实得 F01 `pnpm check` passed；F02 根测试 **336/336 passed**；F03 UI **4/5**、1 failed；F04 安装 **4/4 passed**；F05 主 Specs/status/next **10/10 exit0**。整个 047 保留 **failed**。真实子过程 [EACCES 原始日志](../047-delivery-full-test/artifacts/ui-port-failure-original.log) 显示内层 Vitest 监听 `::1:63315` 被 Windows 拒绝，Storybook 故障项的内部用例尚未枚举；[原端口诊断](../047-delivery-full-test/artifacts/ui-port-diagnosis.json) 记录本机排除 `63290–63389` 包含 63315。046 的另一轮准备故障仍是独立历史，不能复用原通过结果拼接 047 或将局部 048/049 焦点测试升级为正式 PASS。

Reviewer 对真实 HEAD 与工作树独立重查：`git diff --name-only` 除 manual-bootstrap D05 manifest 阶段指针外，**唯一被修改的 tracked 项是 `tests/fixtures/storybook-project/vitest.config.ts`**。与实际 `git show HEAD:<fixture>` 及 048 自有 `vitest-config-before.ts` 原字节逐一核对：只新增
```ts
api: { host: '127.0.0.1', port: 64115, strictPort: true },
```
位于嵌套 Storybook `test.projects[].test.browser`；未更动业务断言、官方 UI 入口、依赖/锁定、根包脚本或 `src/` 产品代码；没有改 Windows 端口排除表或劫持外部服务。独立 [scope-proof.json](artifacts/scope-proof.json) 和 [reviewer-scope.ts](artifacts/reviewer-scope.ts) 记录了当前 Git HEAD、补丁字节、047 实际错误、当前 Open manifest 四项已归档及下一步骤。指定端口的可用性仅为**本次 Windows 环境的观察**，若未来实际被占用，`strictPort` 应真实失败而不得自动退回旧端口或跳过测试。

## Reviewer 真实独立复测（不复用 048 Author 成功日志）

Reviewer 新建 [reviewer-ui.ts](artifacts/reviewer-ui.ts)，使用全新未存在的 `.tmp/d05-049-independent-review-ui` 调用现行官方根入口，重建**全部五个 UI 目标隔离子目录**并执行 UI 五项完整业务测试。真实命令/环境、开始结束时刻及每步退出和计数存于 [independent-ui-results.json](artifacts/independent-ui-results.json)；原始 [准备 stdout](artifacts/prepare-ui.stdout.log) 与 [UI TAP](artifacts/test-ui.stdout.log) 分别保留唯一直接副本。

- `prepare:ui-tests <049 新沙箱>`：**exit0**，五个目标从当前受审 fixture 重新生成/离线准备；已确认隔离 `finite-results/vitest.config.ts` 与源候选字节完全一致，未直接使用 048 沙箱。
- `test:ui`（实际设置 `MENDI_UI_TARGETS_DIR` 与本 049 自有 `MENDI_UI_EVIDENCE_DIR`）：**exit0、5/5 passed、0 failed/cancelled/skipped/todo**。TAP 的五个业务场景覆盖官方 CLI/Skill、目标严格 typecheck 与真实浏览器、官方 preview URL 与交互/受控停止、未知端口与外部服务不被冒用、没有 dev server 的有限测试及缺陷修复后新浏览器结果。与 047 中实际未能枚举的 Storybook 断言不同，本次真实用例容器完整结束。
- 本次 [浏览器交互回执](artifacts/ui-evidence/preview/browser/browser.json) 显示 counter 由“次数：2”至“次数：3”、disabled 状态生效、页面错误为空，原截图存 [counter.png](artifacts/ui-evidence/preview/browser/counter.png)；[preview-stop.json](artifacts/ui-evidence/preview/preview-stop.json) 实际 `confirmed=true`、`childAndPipesClosed=true`、`listenerUnavailable=true`，没有靠复用已残留服务宣布业务 PASS。
- 独立运行受控 `node <corepack pnpm> check` **exit0**；原始 [stdout](artifacts/check.stdout.log)、[stderr](artifacts/check.stderr.log) 和 [check-result.json](artifacts/check-result.json) 保存。Biome format/lint 与三个 `tsc` 类型检查真实执行；不将此当作根全套 F01–F05 正式 Check 收据。三份 Reviewer `.ts` proof 受 `tsconfig.json` 严格类型检查 **exit0、零诊断**，并由 [final-proof-results.json](artifacts/final-proof-results.json) 对独立 F03、预览关闭、单行修复和 Reviewer 证明进行读回。
- 成功后仅按此 Reviewer 的唯一标记、真实路径、无目标写锁且确认预览服务关闭的条件，清理自己的 `.tmp/d05-049-independent-review-ui`；不枚举或删除其他历史 `.tmp` 夹具、未知 pid、锁或失败证据。完整运行回执、TAP、预览浏览器原件都保存在本 049 的受控 artifacts，复现所需 `tests/fixtures/storybook-project` 和官方脚本仍受管。

## 判断与限制

失败复现/修复方向由 047 原始 EACCES 与 048 修改前/后配置和独立 049 完整 F03 复测形成一致因果链：**问题是本机嵌套 Vitest API 监听端口被拒，并非删掉 Storybook 断言后人为通过**。目前 048 修改为执行配置单行修复且目标语义真实回归通过，属于 Owner 已限定的 Delivery Repair 范围，无需重新设计新的 Change 或替换历史审查。Reviewer 未认证其他主机端口可用，也未认证长期服务/未知并发环境；如未来端口冲突须停止诊断，不能复用本轮 UI 通过结论。

**通过之后仍必须新起一次完整 F01–F05 正式尝试：所有必需组重新实际执行并按目标相应合法协议保存同轮结果。** 不能仅执行 F03，也不能把 047 的 F01/F02/F04/F05 passed 与 049 的 F03 通过拼接。下一次 candidate 材料应如实包含本次未提交的 Storybook fixture 配置变更；根仍 manual-bootstrap，不虚构 product-v2 groups-v1 结构。Owner 对新的正式 Full Test、Close、Git、安装与其它项目继续保有各自授权边界。

**交接：`delivery-full-test / author / awaiting-instruction`。** 本 Reviewer 只新增自身 049 Review Run/独立证据并更新 D05 manifest 当前交接，不执行新正式 Full Test、Close、Git/Push、稳定安装或任何 DreMo 操作，也不修改 046/047 旧 failed、048 Author 或 D05-A/B/C/D Archive。
