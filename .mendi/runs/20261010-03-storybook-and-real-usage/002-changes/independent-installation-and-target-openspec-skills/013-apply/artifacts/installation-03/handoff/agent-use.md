# 实际方法使用摘要

Agent 读取安装 CLI 在 005-propose 返回的自有 Propose、目标真实 openspec-propose 全文和 proposal instructions；按已绑定 Change 规则跳过 new。核对目标 list / context、无已有主规格及 src/note.ts / package / README / AGENTS，确认实际只有固定笔记输出。

随后按 proposal → specs / design → tasks 依赖，从产品 action instructions 逐项取得真实输出位置、依赖、模板与规则，重读依赖并撰写四类产物。本地存储 data/note.json、无联网依赖、断网往返、错误保护与目标外路径拒绝进入具体方案。design 因新增持久数据 / 链接安全决策保留。没有把 context 原文贴入材料。

固定 OpenSpec 1.14.1 strict validate valid=true / issues=[]；list 只有 local-note-work，0/5。必要产物副本保存在 planning-artifacts，不以沙箱作为唯一证据。目标源码与 AGENTS 直接字节比较仍与受控输入相同；未实施这些笔记任务。

随后 fixture-review-* 仅为验证产品接收路径的显式 Reviewer 数据，不能视作真人独立审核或根 Change 批准；安装 CLI 返回的 Apply + Storybook 同时包含目标 openspec-apply-change 及随包工具指导。仅核对交接，没有实施隔离笔记功能。根 Author 仍停独立 Review Apply。

支持范围仅当前 Windows / Node 22.23.2 / pnpm 11.22.0 / OpenSpec 1.14.1 与已有 store 的离线显式准备；不认证冷安装、其他平台、MCP、Vue 或完整交付。
