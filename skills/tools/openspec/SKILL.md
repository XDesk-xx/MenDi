---
name: mendi-openspec
tool: openspec
---

# OpenSpec 工具指导

使用项目选定的稳定 OpenSpec 1.14.1 公开 CLI，以明确目标根执行并核对实际 root、来源与 Change。不要自动安装、初始化或改用 PATH 上的另一版本。

按实际工作读取 status、instructions 与当前规划材料，应用项目 context / rules。保留非零退出、坏输出与具体原因，工具成功不代表审核批准。Archive、Git、Delivery 正式测试和收口保持独立边界。

`action instructions --project <root> --action <当前 ID> --artifact <artifact> --json` 返回真实 instruction / template / outputPath / resolvedOutputPath / dependencies 及可选 context / rules。Explore / Review Explore 只读 proposal 背景；Propose / Review Propose 按需读四类 artifact；Apply 不支持此接口。校对当前身份，读取 done 依赖的实际内容并应用对应规则，未完成依赖先补必要工作。保留 specs/**/*.md 模式；读取不写文件、不分配 Run、不批准。

`run save` 只依赖本地必要输入，不启动 OpenSpec，旧 --openspec-bin 被忽略；结果 local-only / openspec:null / upstreamAccess:not-required。Reviewer 可存固定输入缺失说明，正式 submit / continue 仍校验上游和固定完整 Author。替换前拒绝保持旧正文；替换后读回失败保留实际正文、锁与错误，不回滚或重提。

Owner 原始授权后才执行 `action resolve --run <当前 ref> --role owner --actor <声明> --resolution handoff|revise --to-role <角色> --to-actor <接收者> --reason <原因>`。handoff 仅同角色、不同 actor 的未完成 Explore / Propose，同 Action / 固定 Author 和待继续笔记；rejected 的 revise 才新建同阶段 Author 修订。新 draft 未完成语义工作，ownerDecision 只是直接决策声明，不认证身份。

`workspace diagnose --project <root> [--run <同 Change 占号 Run>] --json` 仅本地只读；不接受工具参数、不自动关联现场，manual-bootstrap 不解析人工 Run。pid alive / not-found / unknown 都不证明写者身份或无占用，普通操作仍拒绝锁。

人工解除另需 Owner 对该目标的明确授权。先核对规范绝对路径、token / operation、实际 manifest / Run 和已写路径；停止或协调该目标全部写者并确认任务与文件无占用。pid 复用 / 存活未知、无法确认或文件变化时停止。排除写者期间再次核对同 token 与正式文件，仅处理确认的残留锁；不删 Run / 临时文件 / 占号、不改指针、不重提。解除后只读查询真实 next，结果记当前工作记录。CLI 没有 unlock、kill、ignore-lock 或自动恢复入口。
