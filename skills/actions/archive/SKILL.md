---
name: mendi-archive
phase: archive
role: author
---

# Archive 方法

仅在 Owner 明确授权后执行。Author 先用 `action start --type archive --role author --actor <标识>` 准备当前 Archive draft：直接独立 Review Apply approved、其完整 Author 提交及真实 Apply all_done 均须有效。准备不调用原生归档、不增长计数。普通 save 只保存笔记；不使用 submit / continue，也不存在 Archive Review 或 revise。

显式 `action archive --run <当前 Archive Run> --role author --actor <同一标识> --mode execute` 才调用固定 OpenSpec 1.14.1 的 `archive <change> --json --yes`。在锁内复核并保存本次有限输入与 invoking 标记。原生工具负责规格同步；产品只定向读回实际效果，不另做一次语义合并。保留真实包装 JSON、退出、信号、stdout / stderr 和失败尝试。

本次布尔值 `retire_capabilities: true` 和完整 REMOVED 输入删除调用前全部需求且没有其他需求操作时，主规格应被原生退役删除；按本次副本与实际归档元数据核对，不把任意缺失当成成功。调用标记提交前遗留的 attempt 目录保持原样；锁与必要前置再次成立后的另一次显式 execute 只在当前 Run 分配新尝试号，不从占号推断原生已调用。

异常后停止，不自动重试或处理锁。Owner 按既有现场处置约定核对原写者及可能的原生进程已经停止，再处置原锁。显式 `--mode finish` 完全 local-only，不构造或调用 OpenSpec；完整现场证明无效果时，仅保存 invoking → none，返回 observed-none / pending。none 不代表完成、批准或再次执行。后续 execute 或 prepared / none 的 Owner rollback 各自需要显式命令。活跃 / unknown 写者、缺必要输入、源与目标并存、候选不唯一或输入变化均须停止，不能以重新取得锁作为写者停止证据。

实际效果确认后，按实际日期安全改为 `YYYY-MM-DD-NNN-change-id`，NNN 为项目累计 archivedChangeCount + 1；依次提交计数、终态 Run、manifest 并完整读回。finish 只补当前确定序号的缺失提交，不改已提交 Run，不再次同步或原生调用。完整收口后重复 finish 返回 already-completed，无新 Run、计数或笔记变更。归档后没有活动 Change；后续 Change、checkpoint、Delivery Full Test / Close / Reopen 均保持各自授权边界。
