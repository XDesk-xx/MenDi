# Tasks

## 1. 版本化正式 Run 与单次完整结果

- [x] 1.1 复核当前 Run、group、manifest 指针及直接读回边界，定义可区分 v1 历史与新 v2 完整正式验收的类型 / 持久结果；验证 parser 能读取合法旧 command、v1 attempt、verification 和新 v2，而错类型/未知版本拒绝。
- [x] 1.2 将新 `delivery full-test run` 收敛为 groups-v1 和全部必需组 initial，删除新 command、continue、retest 与新 verification-create 写入准入；在 `tests/group-cli.test.ts` 等加入对应正负例，验证拒绝不占 Run 号、不回退模式。
- [x] 1.3 让本次 v2 Run 从真实子结果、最终报告、逐组计数/完成、清理与稳定读回产生持久正式 `passed` 或真实非通过，保留 failed/blocked/not-run/interrupted/unknown；在 `tests/group-completion.test.ts` 等测试全部通过、双失败、构建依赖、零业务/skip/TODO、协议矛盾与未知清理。

## 2. 当前失败、修复审核与全量重跑

- [x] 2.1 在 `group-admission` 中支持本轮旧 command failed → 当前 Author Repair / Reviewer approved → 首次新完整 v2 group Run，核对直接失败、当轮批准与范围，不要求旧 testAttemptRunRef；增加隔离迁移路径 P03 和旧 failed 原字节不变的回归测试。
- [x] 2.2 延用实质修复的 `delivery-repair`、`review-delivery-repair` 和 `revise-delivery-repair` 交接；批准后只允许新完整必需组重跑，不沿用旧 PASS / 局部 retest；扩充 `tests/group-verification.test.ts` / `delivery-repair.test.ts` 对当前 Review、修订陈旧、拒绝/自签、缺口和真实新全量执行的测试。
- [x] 2.3 为确认的普通环境准备失败/blocked 加窄处置准入，保存真实失败、资源身份、恢复/清理事实与当前材料一致性，不创建空 Repair/Review Runs；实现对应 known blocked/failed、测试合同实变、unknown/外部资源/锁的负例，核对重新执行仍覆盖全部必需组。
- [x] 2.4 同步 `skills/actions/delivery-full-test`、`delivery-repair`、`review-delivery-repair` 与 `skills/group-tests.md` 的新正式规则和历史只读边界；从文档实际入口验证全量与失败交接方法，不留下旧“复验拼接”作为新的默认正式步骤。

## 3. 当前查询与正式 Close 消费

- [x] 3.1 调整 typed 新 Run 的 `full-test status`、`status/next` 共享正式观察：本次稳定 passed 直接提示 Owner 另授权 Close，known failed 导向 Repair，安全环境处置导向整轮新执行，unknown 停 Owner；加入新进程读回及状态更新的场景测试。
- [x] 3.2 将新版 `delivery close --input` 唯一选择器明确为 `testAttemptRunRef`（不别名 `fullTestRunRef`），要求输入等于 `manifest.testAttemptRunRef` 与当前 `manifest.deliveryRunRef`、同轮 v2 Run 正式 passed/覆盖/批准/基线/材料与直接快照一致；在 Close 自身保存 typed v2 acceptance，而旧 `fullTestRunRef`/`verificationRunRef` 不可作为新 Close 写入；以 `tests/delivery-boundaries.test.ts` / `group-cli.test.ts` 验证 v2 合法 Close 与旧类型拒绝。
- [x] 3.3 同步 `src/core/rounds.ts`、`src/adapters/delivery-runs.ts`、`src/core/delivery-lifecycle.ts`、`src/application/delivery-lifecycle.ts` 的 typed 指针、轮次 closed 完整性与读回：新 v2 closed 可只有当前 `testAttemptRunRef`（不得挪用旧 fullTestRunRef），旧 completed Close / command / verification 保持只读；验证旧字段同时留存时 v2 Close 仍安全、旧 command passed/v1 verified 不能新 Close、新 attempt 替代后的陈旧选择、多 selector、unknown/锁/缺日志/读回错均 fail-closed，普通 query/完整测试均不自动 Close/Git。

## 4. 综合回归与阶段交接

- [x] 4.1 在隔离 v2 product 目标端到端重现 D05-A Explore P01～P04：完整组失败汇总、环境重跑、旧 failed → Review → 新全量、旧部分复验不能再新 verified；使用真实 node:test 及协议回执，保存可核对的最小结果，确保未触碰根人工历史或 DreMo。
- [x] 4.2 运行 `pnpm check`、`pnpm build` 与实际影响的群组/修复/生命周期测试集，记录执行范围、真实结果与未知限制；对新源码 / 测试 / 脚本做严格 TypeScript 检查，修复后按实际影响复验，不用旧 Explore proof 作为本次业务 PASS。
- [x] 4.3 复核本次实现与 `proposal.md` / specs / `design.md` 一致，列出 `src/`、`tests/`、`scripts/` 最大维护代码文件及当前有证据的职责增长，完成 Apply Run 的实际结果和交接；进入独立 Review Apply 前不自签批准。

## Workflow follow-up

- Propose 完成后，先由独立 Reviewer 执行 `review-propose`，approved 后再依当前授权进入 Apply。
- Archive 在独立 Review Apply 通过且实际原生效果获授权后执行；D05 正式 Full Test、Delivery Close、Git checkpoint 和稳定安装另行授权。
