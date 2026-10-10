---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-review-propose-02
actionType: review-propose
role: reviewer
run: "007"
status: completed
actionStatus: completed
result: approved
verdict: approved
date: 2026-10-10
authorRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/006-revise-propose/run.md
---

# MVP-D02-A Review Propose 补审

Owner 指令：`review-propose`。独立 Reviewer 按 `skills/actions/review-propose/SKILL.md` 固定审核 [006 Revise Propose](../006-revise-propose/run.md)，聚焦 RP-A-001 与四份变动产物，其余仍适用结论沿用 [005](../005-review-propose/run.md)。不修改 Author 方案或实现。

**verdict：approved。** RP-A-001 在方案层面关闭；没有新增阻断项。批准当前 006 修订后的方案进入 Apply，不认证尚未实现的产品执行能力。005 的原 verdict 保持，003 Explore 与 005 其余有效结论沿用。

## 局部审核结论

- 已对照 006 保存的四份修改前副本，核对 proposal、design、test-execution delta 与 tasks 的实际差异。变化集中于 pnpm 无安装策略、预检与执行的结果区分，以及相应验收；任务仍为 28 项。没有扩大多 Change / Archive 协议或增加历史引用、hash / 容量 gate。
- Decision 4 明确区分 Corepack 网络与 pnpm 自身安装行为：锁内无 script 的 `pnpm run` 强制 error，非零为 not-run、executionId=null，未启动脚本、未占执行号时正常释放自身锁；通过后，显式执行调用强制 warn，继续禁止自动安装。策略覆盖调用者 / 目标配置，不修改目标文件或宿主环境。
- 独立核对本机 pnpm 11.22.0 的公开 CLI 对应实现：依赖检查先于 script 选择，无 script 时列出命令；error 拒绝与 warn 不安装分支支持当前决策。产品仍使用公开 CLI，不导入上游内部代码或解析错误文本判断测试是否启动。
- 两次调用间可能有外部变动的限制已写清楚：执行调用仍禁止自动安装，结果按实际选定命令解释，不宣称依赖始终同步。依赖预检的成功不能替代测试 passed，脚本伪造依赖错误文字也不能反推 not-run。
- 规格补齐缺依赖、已安装后不同步、目标 install / 调用者环境覆盖、执行阶段不自动安装、脚本自身显式安装的场景。tasks 4.2 / 4.4 / 5.2 / 6.1 同步落实环境键归一、未运行反馈、正常释放自身锁、记录两段命令策略及真实文件比较，未遗漏实施入口。

## 独立验证

按 006 正式证据保存的夹具全文在新隔离目录重建，不依赖其原临时目录。全部使用真实固定 pnpm、offline 和本地 file 依赖；唯一 install 是同步夹具的明确准备步骤，与被验证调用分开记录。

| 实验 | 实际结果 |
| --- | --- |
| 缺依赖且目标明确设置 install | 版本查询成功，error 无 script 预检非零；全部夹具文件保持，没有脚本效果、依赖或 lockfile 创建 |
| 已同步依赖且目标设置 install | error 预检 exit 0、不执行 script；warn 执行 exit 0，仅产生选定 script 明确写入的标记，其余文件保持 |
| 已同步后追加未安装的本地依赖 | error 预检非零，全部文件保持，包括原 lockfile；无新依赖安装和 script 效果 |
| 执行 warn 分支单独遇到缺依赖 | script 实际执行，仅产生其标记；没有依赖安装或 lockfile 创建。这只认证无安装分支，不冒充整段预检已通过 |

四组断言通过，7 次真实命令及输出集中保存于 [pnpm-replay.json](artifacts/pnpm-replay.json)；输入直接引用 006 的正式 proof，不复制历史证据树。比较使用当次文件字节及链接目标，不生成持久 hash 清单。

- 固定 OpenSpec `validate sequential-changes-and-test-entrypoints --strict --json` exit 0，1/1 valid、issues=[]，见 [validate.json](artifacts/validate.json)。
- 固定 `instructions apply --change sequential-changes-and-test-entrypoints --json` exit 0，state=ready，progress=0/28，见 [apply-instructions.json](artifacts/apply-instructions.json)。这是规划 readiness，独立批准由本 Run 给出。
- 当前维护源码、测试与 proof 未由本 Reviewer 修改；没有重跑无关产品全量回归、旧 Explore 或正式 Full Test。Windows 环境大小写归一、锁与真实 MenDi 执行 / 结果保存尚须 Apply 按既定任务验证，不以本轮 pnpm 局部实验代替产品验收。

## 交接

转交 Author `apply`，当前输入仅指向本 Run，由固定 authorRunRef 定位 006 方案。保留 004 / 005 / 006 原编号、正文和结果，不重做 Explore 或追加无关修订。

完成后新进程 status / next 的读回保存于 [readback.json](artifacts/readback.json)。D02 保持 open，D01 保持 closed，累计归档数为 4。停在 Apply 边界，本轮未实施任务、执行根项目 Archive、Git、正式 Full Test / Close / Reopen 或激活下一 Change。
