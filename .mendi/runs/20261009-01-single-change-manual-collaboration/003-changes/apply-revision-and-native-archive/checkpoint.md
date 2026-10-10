# MVP-D01-D 本地 Change checkpoint

Owner 指令：change checkpoint，并检查 .tmp 是否可完全删除。

提交信息：change: checkpoint MVP-D01-D Apply、修订与原生 Archive

范围为 D 的实现、分组测试、方法、正式 Explore / Propose / Apply / Review / Archive 记录、004 归档与三份主规格同步，以及当前交接说明。沿用 039 独立 check / build / 30 项受影响回归和 040 归档后的 3/3 主规格 strict validation；未修改实现后机械重跑验证。保留既有 Run、编号与 verdict，不为此次 Git / 状态检查另建 Run。

## .tmp 删除可行性

实际规范目标 D:\Projects\MenDi\.tmp：791 个直接项，762 个产品测试沙盒、3 个 Explore proof 沙盒、24 个审核临时输出、1 个审核 proof 输出目录、1 个受 Git 管理的 .gitkeep。物理普通文件 12,673 个，合计 3,945,073 字节；25 个测试 junction 的目标均位于 .tmp 内，本次枚举不跟随链接。

30 份审核临时输出均有字节相同的本 Change 正式 Run 副本；tests/helpers.ts、tests/fixtures 与 scripts/proofs 中受控输入可重建临时环境，稳定 OpenSpec 工具不在 .tmp。逐个普通文件以 FileShare.None 只读打开均成功；125 个夹具残留锁的 44 个不同 PID 均不在当前进程表，无项目任务进程，检查时无最近写入。

结论：临时内容可以全部清理，保留受 Git 管理的 .gitkeep 即可。整个目录也是可重建的，但删除 .gitkeep 会额外形成 tracked-file deletion；本次指令只要求检查，所以未删除任何 .tmp 内容。后续清理须使用明确绝对路径，处理 junction 时只删链接本身，不遍历目标。

## 停止点

仅本地 checkpoint，无 push。当前累计归档 4，所有 D01 Change 已归档、无活动 Change，Delivery 仍 open；等待 Owner 下一指令，不执行 Full Test / Close / Reopen 或激活下一 Change。具体提交 ID 以 Git 提交记录和当次回复为准，避免把提交自己的 ID 写入同一提交。
