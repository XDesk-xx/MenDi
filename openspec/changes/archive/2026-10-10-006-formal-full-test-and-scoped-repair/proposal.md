# Proposal

## Why

当前普通 `test run --kind full` 能保存真实命令结果，却没有声明整轮交付范围、相关审核和受测材料，不能作为正式 Delivery 验收。全部 Change 归档后，现有 Change Action 又无法承接验收发现的小修复；需要 Delivery 层的正式执行与独立定向审核交接。

## What Changes

- 增加显式 `delivery full-test`：读取当前 Delivery 的必要完成 / 审核输入和本次声明，记录完整集合、实际命令、受测基准及本次真实结果。复用已有执行器，普通 command 结果保持非正式语义，不认领旧 PASS。
- 增加 Delivery 范围内的修复与独立审核记录：Author 修复当前正式失败，Reviewer 固定新 Author，审核完成后显式运行新的整个声明集合。旧失败、Run、verdict 与 archived binding 保留；范围 / 方案实质变化回 Owner。
- 查询优先解释当前 Delivery 操作及直接结果，不误选最后一个 Archive；声明材料与结果事实分别展示，不声称工具能认证任意源码的适用性。历史说明、未知 Ref 和失败父链不成为查询依赖。
- 整理现有执行编排，使正式操作在同一个项目写锁内复核输入、运行与保存，保留普通命令合同；新增 CLI 接线前整理深层分派。新增验收按场景分组，不扩充旧完整流程 proof。

## Capabilities

### New Capabilities

- `delivery-verification`：正式 Full Test 的范围 / 审核 / 材料声明、真实执行结果、局部修复及定向 Review、重新执行完整集合与适用性说明。

### Modified Capabilities

- `delivery-workspace`：当前 Delivery 操作的只读状态选择、必要输入与交接，以及当前验收 / 修复未结束时的关联冲突。
- `action-runs`：与 Changes 批次同级的 Delivery Run、角色 / 固定 Author、draft / submitted 与最小 next；保持旧 Change 记录协议。

## Impact

主要涉及 `src/application/tests.ts` 的真实执行编排整理、新 Delivery 验收 / 修复应用操作、`src/core/` 的范围与记录协议、`src/adapters/` 的 Delivery Run 读写、workspace / query / diagnosis、CLI 参数与分派，以及三份 Delivery 阶段方法。现有 `test-entries`、`test-process`、`test-store` 和普通测试结果格式复用，`test-execution` 的公开要求不变，不为内部整理创建重复 delta。

产品仅扩展 open product Delivery；MenDi 自身人工记录保持只读兼容。本 Change 不实现 Close / Reopen、新 Delivery Open、通用恢复、引用注册中心、依赖图、全库 hash gate 或自动依赖安装；不执行根正式 Full Test、Archive、Git 或激活 C。实施以真实产品接口验证两项归档后的集成失败、范围内修复 / 独立审核记录和新完整执行，探索 proof 仅沿用已受审的限定结论。
