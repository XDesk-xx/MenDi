---
deliveryId: 20261010-02-delivery-verification-and-close
changeId: sequential-changes-and-test-entrypoints
planningSlot: MVP-D02-A
batchId: 002-changes
actionId: sequential-changes-and-test-entrypoints-archive-01
actionType: archive
role: author
run: "012"
status: completed
actionStatus: completed
result: archived
archiveOrdinal: 5
archiveRef: openspec/changes/archive/2026-10-10-005-sequential-changes-and-test-entrypoints
date: 2026-10-10
stageSkillRef: .agents/skills/openspec-archive-change/SKILL.md
previousRunRef: .mendi/runs/20261010-02-delivery-verification-and-close/002-changes/sequential-changes-and-test-entrypoints/011-review-apply/run.md
---

# MVP-D02-A Author Archive

Owner 指令 archive，依据 [011 独立 Review Apply](../011-review-apply/run.md) 对 010 的批准。28/28 项任务、全部产物完成。沿用路线图 §6.1 与项目 Archive 方法，固定 OpenSpec 原生 Archive 同步一次并归档，不另执行通用 Skill 的语义合并。人工记录不调用 product writer；累计编号预定 005，与 Run 012 分开。

归档前已读取当前 archive context / guidance、specs instructions（无附加 rules），核对 root nearest、固定完整 Author 与 Reviewer、实际 apply all_done 和 strict validation。同步评估新增 9 / 修改 9 / 删除 0 / 重命名 0，跨四份 capability；全部 MODIFIED 需求有实际主规格，test-execution 只含 ADDED 且 Purpose 有效，不存在同步阻断。直接材料见 artifacts，before.json 仅保存本次受影响主规格和被移走的当前 Change 材料，无 hash 清单或历史树复制。

本次原生 Archive 已在自身独占锁内开始调用；失败时保留当前锁与实际输出，不自动重试。

## 实际效果

固定 OpenSpec archive --json --yes exit 0、specsUpdated=true；新增 9 / 修改 9 / 删除 0 / 重命名 0。四份主规格的全部 18 项 delta 需求正文与场景逐项匹配；既有标题、Purpose 与未涉及需求保持，新 test-execution 的标题与 Purpose 正文直接核对，未残留 delta 操作标题。原生归档只执行一次，没有 skip-specs / no-validate 或另做同步。

本地首次校验将新 Purpose 标题后分隔空行规范化误判为正文变化，停在编号 / 计数提交前。已保留原生成功输出和原锁；确认本次实际原生调用 exit 0、原调用者已退出、同一 token / operation 及当前输入未变，修正只读比较并继续同一人工 Archive 操作。本地继续没有重调上游，没有另开 Run 或提前清锁；完成后按相同 owner 字节释放自身锁。差异和修正见 [verification-recovery.json](artifacts/verification-recovery.json)。这不提供产品通用恢复 / 解锁能力。

核对规范绝对路径、真实 archive 父目录、实际原生日期和目标未占用后，安全改名为 openspec/changes/archive/2026-10-10-005-sequential-changes-and-test-entrypoints。活动源与原生中间名称均不存在，全部当前 Change 材料与调用前字节相同。计数 4→5，Run 012 与跨 Delivery 归档号 005 分开。

## 验证与证据

归档前 root nearest、当前完整 Author / 独立批准、28/28 任务与全部产物、strict validation 均有效；材料入口见 artifacts/pre-*.json。specs instructions 已读取，无附加 rules；归档方法按路线图 §6.1 与项目 Archive 方法采用原生一次同步。

归档后主规格 strict validate exit 0、4/4 valid、无 issues，见 [specs-validation.json](artifacts/specs-validation.json)。实际正文 / 场景与必要字节读回见 [archive-readback.json](artifacts/archive-readback.json)，原生响应与退出 / 信号见 native-archive.json、native-invocation.json。before.json 只保存本次被同步的主规格和被移走的当前 Change，不保存 hash 清单或历史证据树。

010 / 011 的实现、工程检查、20/20 Author 与 10/10 独立回归继续适用；未改 src / tests / scripts，不机械重跑既有行为验证，不声称正式 Delivery Full Test。旧 Reviewer 的 changes-requested / approved 与旧 Run 保持。

## 交接边界

D02 保持 open，当前 binding archived / archiveOrdinal=5、activeChangeId=null；最新交接指向本 Run。README / OpenSpec context 更新当前背景。归档后新进程 list / status / next 读回见 artifacts；查询无需旧活动目录，upstream:null，不调用已归档 Change 的活动 status。

本次只建 012，不为各检查分配 Run。下一步 change checkpoint，等待单独 Owner 指令；未执行 Git、正式 Full Test / Close / Reopen、下一 Change 激活或 .tmp 清理。
