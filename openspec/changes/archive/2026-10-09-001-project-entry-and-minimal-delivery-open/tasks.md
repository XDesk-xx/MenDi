# Tasks

原 1–5 部分为已实施基准，proof TypeScript 迁移见 Run 005；012 已独立批准 011。第 6 部分跟踪 Owner 授权的归档前局部修订，完成后仅交给独立 review-apply，旧批准不自动覆盖新变化。

## 1. 工程与外部接入

- [x] 1.1 添加直接运行时依赖 `yaml@2.9.1`，更新锁文件，并增加 TypeScript 测试的 noEmit 检查入口；验证固定依赖安装及 `pnpm typecheck`，产品 build 不编译脚本 / 测试到 dist。
- [x] 1.2 实现显式目标规范化、本地 YAML 选择与支持范围检查；用新项目、已有 context / rules、config.yml、坏主配置、store 声明、其他 schema、子目录和裸 openspec 夹具验证写前拒绝及原文件保留。
- [x] 1.3 实现公开 OpenSpec 进程适配器与必要 JSON 运行时校验；实际固定 1.14.1 验证 version / list / status / instructions 与目标 root，受控替身验证超时、信号 / 非零退出、坏 JSON、缺字段、版本不符和 root 不符均返回真实错误。
- [x] 1.4 接入 CLI 帮助、参数组合、`--project` / `--scope` 路径基准和 `--json` 输出；验证无项目的帮助、未知 / 重复参数、从其他 cwd 调用及含空格路径，补 README 工程入口与固定工具说明并实际执行示例。

## 2. 持久记录与首次 Open

- [x] 2.1 定义 version 1 项目 / manifest / binding 类型及运行时校验、范围依赖检查与受管路径检查；验证合法范围、空目标、重复槽位、悬空 / 循环依赖、非法 ID、版本错误、越界引用及外部 junction / symlink 拒绝。
- [x] 2.2 实现首次 Open 的独占目录创建、锁、manifest 先写及 project 最后提交；真实 CLI 在最小 / 已有配置项目保存范围，独立进程读回；重复相同 / 不同 ID Open 均拒绝并验证已有文件字节不变。
- [x] 2.3 实现同目录临时写入、正式记录读回、锁归属及部分失败诊断；通过定向故障注入验证 manifest 后 / project 前失败、读回失败、锁释放失败、残留锁与两个写者竞争，旧记录不截断、现场不自动清理、失败不输出完整成功。
- [x] 2.4 为范围输入增加受控 JSON 示例，在 README 写出首次 Open 参数与冲突 / 不完整状态处理；由独立进程按示例执行，确认查询不再依赖原 scope 文件且目标文档、配置、Change 文件未变。

## 3. 首个 Change 关联

- [x] 3.1 实现 Open 可选成对 `--change` / `--slot`，验证真实既有 Change、schema、槽位后持久关联；真实上游验证关联成功，缺 Change、缺槽位、错误槽位与不支持 schema 在写前拒绝。
- [x] 3.2 实现产品 open Delivery 的首次 `change bind`，取得锁后重新验证本地前置，同目录替换 manifest；独立进程验证正确关联、重复 / 替换关联拒绝、并发 bind 冲突及替换失败保留旧文件。
- [x] 3.3 补 README 关联入口及首个 Change 的限制；实际按示例执行 Open 无 Change → bind → query，确认没有创建上游 Change、Run 或虚构批准。

## 4. 查询与人工记录兼容

- [x] 4.1 实现 status / next 共享的只读查询，分别展示本地阶段、目标 / 工具、Delivery 范围和上游 readiness；验证未 Open、Open 无关联、Explore 关联、上游 planning complete 和绑定 Change 消失，不自动推进阶段或写入文件。
- [x] 4.2 实现当前 manual-bootstrap 的只读解析与来源标识，保留 Run / Reviewer / checkpoint 引用；使用受控人工记录夹具验证正常查询、未知未版本化格式和必要记录损坏拒绝，产品 bind 不修改人工历史。历史说明引用不构成查询运行依赖，见第 6 部分。
- [x] 4.3 验证缺 project / manifest、坏 JSON、身份不一致及残留锁返回诊断；用查询前后快照证明 status / next 不修复、初始化、分配 Run 或改写任何记录，README 明确本地 next 与上游 ready 的区别。

## 5. 跨模块集成收敛

- [x] 5.1 在 fresh sandbox 从受控输入构建并运行真实最小项目和已有配置项目的 Open / bind / status / next，记录实际命令、退出与限制，核对路径、跨进程范围读回及原文档 / 配置保留；结果不依赖旧 `.tmp` 或 proof 原型。
- [x] 5.2 执行 `pnpm typecheck`、`pnpm build`、本 Change 的集成测试与 `git diff --check`，按两份 specs 核对覆盖及边界，将必要结果与未决事项提交新的 Author Apply Run；不以全部任务完成替代独立审核。

## 6. 归档前局部修订（013）

- [x] 6.1 移除递归 `*Ref` 存在性要求，按实际读取收窄引用检查；验证必要 project / manifest / 当前 Change 缺失仍报错，历史说明失效和未知 Ref 字段可查询，受管路径越界 / junction 与身份不一致仍拒绝。
- [x] 6.2 只读兼容人工 archived binding 的日期归档路径与清空当前 Change 的交接；验证归档后 status / next、无活动 status 调用、缺旧目录、不完整或矛盾记录拒绝；不执行当前 Change Archive 或修改旧 Run。
- [x] 6.3 安装固定 Biome 开发依赖，统一维护中源码 / 测试 / 脚本格式，增加 format:check、lint 与聚合 check；排除历史 / 生成物 / 字节敏感夹具，无行数门槛，并通过 check。
- [x] 6.4 停止 proof 新结果无用途的 scriptSha256，保留测试字节比较与旧证据；格式整理后构建并执行现有相关回归和必要 proof，核对排除输入未变，保存新的 Author 修订交接，停在独立 review-apply。

## Workflow follow-up

- 原 Propose / Apply 的交接和 012 的批准保留；013 的设计、规格与任务变化由独立 Reviewer 补审。
- 后续 Apply / Review Apply / 原生 Archive 按当前角色与 Owner 指令分别执行，保留旧 Run。
- Git checkpoint / push、更多 Change、Delivery 正式 Full Test / Close / Reopen 均保持各自边界，本清单不授权执行。
