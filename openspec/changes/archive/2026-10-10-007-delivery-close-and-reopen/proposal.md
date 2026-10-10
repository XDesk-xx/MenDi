# Proposal

## Why

正式 Full Test 已能保存真实结果，但产品记录仍只接受 open、单 Delivery 和一个 Changes 批次，closed 查询与后续工作无法成立。MVP-D02-C 将收口、重开和新交付接到既有执行事实，并保留历史与明确的 Owner 边界。

## What Changes

- 新增显式 Delivery Close / Reopen：Close 消费本轮适用的正式结果和已核对直接批准事实；Reopen 指定新的工作范围，保存旧 Close、旧 PASS、binding 和批次，不继承通过。
- closed 下读取当前收口记录和指定正式 / 普通结果；显式定位历史 Delivery，默认查询只解释当前选择，不扫描历史猜对象。
- closed 后显式 Open 新 Delivery，追加独立 manifest / 索引，从 001 编号；原 Delivery Reopen 沿原号增长，首次新 Change Run 才建新的 NNN-changes。
- 将本轮范围与历史 bindings 分开校验，支持多个历史批次及唯一当前工作批次；项目累计归档数继续增长。
- 仅对当前生命周期写入提供显式有限继续，保留锁、占号和实际已写路径；不自动恢复、不改已提交记录。补实际生命周期场景与相关回归，不扩大旧 Explore proof。

## Capabilities

### New Capabilities

- `delivery-lifecycle`：显式 Close / Reopen、收口适用性声明、当前生命周期记录及写入失败后的有限继续。

### Modified Capabilities

- `delivery-workspace`：closed 后追加 Delivery、选择与只读查询、本轮范围和旧 binding / 批次共存，以及按操作区分的必要输入。
- `delivery-verification`：closed / 历史正式结果读取与 Reopen 后首次新验收的准入，保留当前整次执行与修复规则。
- `test-execution`：以明确所属 Delivery 读取历史 execution，不放宽测试执行准入。
- `action-runs`：生命周期 Run 与新批次连续编号、两个当前指针的语义、对应方法和禁止普通提交伪造收口。

## Impact

涉及 core 记录 / 关联 / Delivery Run，workspace / result adapters，project / 正式结果查询与验收准入，CLI 参数 / 分派 / 输出及产品方法。生命周期编排和场景测试独立组织，实际扩展的混杂职责先整理；无需新依赖、hash 清单、引用注册中心或通用恢复框架。

保留 version 1 首次 Open 与单批次记录的读取兼容，不迁移人工 bootstrap；新字段随实际操作写入。新增 Open 的记录选项与历史查询选项在 design 明确，已有命令语义不静默改变。023 已独立批准 022 的依据；本次仅形成方案，完成后交独立 Review Propose，不执行产品生命周期、实现、Archive、正式根 Full Test 或 Git。
