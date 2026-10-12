# 本段停止与后续目标操作

## 当前继续入口

本段根 Action 为 `real-target-delivery-acceptance-apply-01`，023 提交 continuing。
Owner 确认后通过 continue 新建下一 Run，保持同一 Action / Author；不编辑已提交 023。
优先完成准备预算、真实终端取消及停止确认的必要短时验证，范围仍是当前目标。
工程准备与业务实施分开，不能提前执行完整 stories / browser 再声称留待新 Author。

## 目标与范围

- 唯一目标：`D:/Projects/MenDi/tests/fixtures/d03-c-vue-project`，已有官方空壳 / 依赖 / OpenSpec 方法 / 检查；尚无计数器或 stories。
- 拟 Open：`d03-c-vue-counter`，唯一槽位 `VUE-COUNTER`，dependsOn 为空。
- 拟激活并绑定的唯一目标 Change：`implement-naive-counter`。
- 目标业务只实现默认初值 0、已有初值 5、加一、重置到 0、禁用；App / Storybook 共用一个 CounterPanel。
- 真实顺序：Explore → 独立 Review Explore → Propose → 独立 Review Propose → Apply / 真正新 Author 留待恢复 → 独立 Review Apply；批准后才 Archive。

具体目标授权须覆盖上述路径 / ID，且新 Change 激活的 Owner 原始消息须包含连续 `owner 授权`。当前指令授权本段根 Apply 和工程准备，不将方案批准或旧撤回目标的授权自动套用为新目标生命周期授权。已明确覆盖的授权不重复申请。

## 已定方案中的后续边界

获各自明确授权且前置批准成立后，目标执行一次 Archive；正式五项 Full Test 的受控业务失败或自然业务失败、范围内修复 / focused、独立 repair 定向补审、原五项新整次执行和首次 Close。

固定集合为 `typecheck / build / build-storybook / stories / browser`。未来 `verify:full` 为 `node scripts/verify-vue.ts full`，通过稳定 `mendi delivery full-test run --project <本目标> --input <实际声明> --role author --actor <实际 Author> --pnpm-bin <固定 pnpm JS>` 调用。预算是五项共享 10 分钟，不能逐步重置；当前该有限脚本及业务入口尚未创建，不可执行或认证通过。

真正新 Author 从合法 continuing 恢复；独立 Reviewer、handoff / 会话启动和消息发送按实际明确授权安排。当前不自动启动任何会话或派 Reviewer，也不由 Author 自签。

根 C Archive、根 D03 正式 Full Test / Close、Git、目录清理均不包含在当前段或上述目标流程中。根 C 全部保留任务实际完成后才交独立 Review Apply。
