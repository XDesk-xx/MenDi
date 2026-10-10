---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: archive-project-entry-015
actionType: archive
role: author
run: "015"
status: completed
actionStatus: completed
result: archived
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-archive-change/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/014-review-apply/run.md
---

# MVP-D01-A Author Archive

Owner 本次授权归档，并要求名称含项目累计完成 Change 的递增 ID。本次采用 `YYYY-MM-DD-NNN-<changeId>`，首个 ID 为 001。编号按完成归档增长，跨 Delivery 延续，与 Run / 批次 / 激活序号分开；项目入口保存 archivedChangeCount，已完成归档的 binding 保存 archiveOrdinal，失败不增加完成计数。

014 已批准 013；20/20 任务完成。两份 delta 只有 ADDED requirements，尚无对应主规格。按本项目原生 OpenSpec 接入要求，由 archive CLI 一次完成 specs 同步和归档，不再让 Skill 重复应用 delta。工具无自定义归档名选项，原生归档后对同一 archive 父目录执行一次授权的编号改名；Change 身份和旧 Run 保留。

Owner 新指定的命名格式需要最小查询兼容：人工 archived binding 可显式提供 archiveOrdinal，匹配编号归档路径，同时保留无编号旧格式。本次只补此格式兼容与定向验证，不实现 Archive Action 引擎、不自行给新变更签 Reviewer verdict。014 的批准保持其原输入语义。

不执行 Git、正式 Delivery Full Test / Close 或下一 Change；015 记录本次归档与命名衔接，不为每个检查新建 Run。

## 执行与读回

- 固定 OpenSpec 1.14.1 执行 `archive project-entry-and-minimal-delivery-open --json --yes`；未使用 skip-specs / no-validate。原生结果 exit 0、specsUpdated=true，13 added、0 modified / removed / renamed；见 [native-archive](artifacts/native-archive.json) 与 [真实命令输出](artifacts/native-archive-command.json)。
- 原生目录 `2026-10-09-project-entry-and-minimal-delivery-open` 在核对源、目标绝对路径都直接位于同一 archive 父目录且目标不存在后，改名为 `2026-10-09-001-project-entry-and-minimal-delivery-open`。旧活动目录不存在，`.openspec.yaml` 随归档保留。
- 两份主规格的 Purpose、完整 requirement / scenario 正文与 delta 对应内容一致，无 delta 操作标题；delivery-workspace 为 8 requirements / 21 scenarios，project-entry 为 5 / 14，合计 13 / 35；见 [archive-readback](artifacts/archive-readback.json)。只由原生 archive 同步一次。
- manifest binding 已记录真实归档路径、archiveOrdinal=1、state=archived，并清空 activeChangeId；项目入口 archivedChangeCount=1。下次成功归档使用 002，跨 Delivery 延续。交接指向 015，下一步仅提示等待 Owner 明确下一 Change 的激活目标与范围。

编号兼容及旧格式、错误编号、路径一致性、归档后查询的 9 项相关回归通过，见 [numbered-archive-tests](artifacts/numbered-archive-tests.txt)。格式 / lint / typecheck / build 通过；原 014 的其余可靠验证继续引用。新命名属于 Owner 本次直接指定的归档衔接，未创建新 Reviewer verdict。

最终规格验证、真实 CLI 查询及历史字节核对见 [summary](artifacts/summary.json)。001–014 保留原编号、内容和 verdict；没有新增 hash 清单。RA-A-002 的非阻断人读提示问题仍保留，没有借归档自动修复或声称已关闭。停止于本 Change Archive，Delivery 仍 open，不启动下一 Change、Git checkpoint / push 或正式 Delivery Full Test。
