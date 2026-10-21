# Spec Delta

## ADDED Requirements

### Requirement: Closing after an appended scope requires a new full result
Delivery Close SHALL 检查当前轮最新有效的所有计划槽位已独立归档且新 groups-v1 Full Test 本次完整通过。先前保存的历史 passed、旧 Close、旧 verification 或旧范围的完成快照仅可按原历史读取，不能在当前轮 scope 扩大后提供新 Close 资格。

#### Scenario: Old passed result is supplied after appending scope
- **WHEN** Delivery 尚 open、曾完整通过，但之后追加了尚未归档或尚未重新正式测试的槽位，Author 请求 Close
- **THEN** 写前拒绝，不生成 Close Run、不开新轮、不改旧 passed/verdict；报告当前缺少的新范围完成与验收事实

#### Scenario: New complete acceptance permits separately authorized Close
- **WHEN** 新槽位均已按独立授权绑定、实施、审核及归档，Owner 另行授权新的当前完整 groups-v1 pass 的 Close
- **THEN** 按最新实际范围及其当前正式 Run 执行原有 typed Close 准入；追加收据不是正式验收，也不自动授权 Close

### Requirement: Append is not a reopen operation
同一 open Delivery 的计划追加 SHALL 保留原 currentRoundId、openedOn、原历史轮及 Close；不能借追加调用 Reopen、生成新的轮次或复用历史轮槽位。已 closed 的 Delivery 需要 Owner 单独授权 Reopen 才能建立新的轮次范围。

#### Scenario: Add before close
- **WHEN** Owner 授权对 open 当前轮新增计划
- **THEN** 当前轮保持 open 和原身份，历史 Close（若存在于其他轮）不变，本轮只扩充计划

#### Scenario: Add after close
- **WHEN** 同轮已经稳定 closed 或正在执行 Close，用户调用 change add
- **THEN** 追加拒绝，不能删除/修改 Close、不能偷偷把 closed 改回 open；需要真实独立 Reopen
