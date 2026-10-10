# Proposal

## Why

既有 Action 已能记录 Apply 的继续与修订，但尚未消费操作级指引、接受 Apply 的 Owner 处置或完成产品 Archive。030 / 031 的真实实验还表明：原生归档可成功移走未勾任务的 Change，归档后本地写入失败也不代表原生效果未发生；需要把当前独立批准、实际效果和本地交接共同收敛。

## What Changes

- 为当前 Apply / Review Apply / Revise Apply 和 Archive 提供只读操作级 instructions，分别保留真实输出协议、项目 context / guidance 与必要路径检查。
- 扩展 Owner 的 Apply handoff、rejected 后同阶段 revise，以及显式退回较早 Explore / Propose 的新 Author 修订；目标阶段重新独立审核，旧批准和实现不自动回滚。
- 接入 Author Archive Action：先核对当前有效 Review Apply、直接 Author 与完成任务，再由固定 OpenSpec 原生同步一次并归档；按实际原生日期与项目累计编号保存位置。
- 保存当前归档尝试的直接输入和实际结果，提供只处理该操作的显式本地收口；未知效果停止，不凭非零退出重跑同步，计数与提交读回幂等。
- 让 product 记录及 status / next 解释归档处理中和已归档状态，保留 manual-bootstrap 只读兼容，查询不依赖移走的活动目录。
- 在扩展前分离现有 Action 的输入指引与 Owner 处置职责，按场景组织新增测试；落实 Review Apply 的维护观察要求，保留 C / D 的既有 proof 与 verdict。

## Capabilities

### New Capabilities

无；沿用既有能力边界。

### Modified Capabilities

- `action-runs`: 操作级指引、Apply Owner 处置 / 主动回退、Archive Action 的直接批准与有限收口、Review Apply 维护观察。
- `delivery-workspace`: product 归档处理中 / 完成态、累计编号提交与幂等读回、归档后的只读查询与必要输入。
- `project-entry`: 固定工具的 Apply / Archive 操作协议及真实 Archive 结果 / 错误读取。

## Impact

影响 CLI 参数 / 展示、OpenSpec adapter、Action / Run / workspace 记录与读写、产品 Apply / Review Apply / Archive 方法、OpenSpec 使用指导、AGENTS 和定向测试。不增加第三方依赖；保持 version 1 既有记录可读，旧 Run / verdict 不迁移。

本轮只形成受审方案；不实现第二 Change 的产品激活、Delivery Close / Reopen / 正式 Full Test、锁解除命令或通用恢复引擎，不执行当前 Change Archive、Git 或 `.tmp` 清理。
