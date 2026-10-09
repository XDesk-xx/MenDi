# MenDi 项目协作约定

## 开发入口

- 产品总设计与开发规划只维护根目录 `mendi-foundation-and-delivery-roadmap.md`；README 提供工程入口，OpenSpec Change 材料细化当前任务。
- 本项目直接使用 OpenSpec，不使用 Flowkit。选定工具为 `@fission-ai/openspec@1.14.1`，稳定入口为 `D:\tools\openspec\1.14.1\node_modules\@fission-ai\openspec\bin\openspec.js`。
- 当前是全新 TypeScript CLI 骨架，任何 Delivery / Change 均须单独明确后才开始；不把初始化当作 MVP-D01-A 已完成。
- 实际角色由当前会话或 Owner 明确指定。Author 不因下一步需要 Review 就自动切换角色；Reviewer 独立审核，不改实现后自签批准。

## 工作方式

- 与 Owner 沟通及面向人阅读的文档使用中文。代码标识符、命令、机器字段和必要专业术语保持原样。
- 新 Change 激活须由 Owner 原始消息包含连续字样 `owner 授权`，并明确目标与范围。范围内后续短指令无需逐阶段重复授权，停在指定边界。
- Action 组织阶段与 Skills；Run 保存实际进展和交接。同阶段可继续，不为每条命令新建 Action / Run。正式审核交接后保留原记录，修订另建记录。
- Explore 需要针对关键疑点的真实 proof，简记目的、方法、结果与限制。按实际风险补必要验证，不提前完成全部产品验收。
- 方案、实现、审核与验证以真实材料为依据；已有可靠且仍适用的结果可引用。发生范围、方案或关键事实变化时明确修订，不机械重跑全部历史。
- Git、Delivery Open / Reopen、正式 Full Test / Close、部署和生产数据写入保持各自授权边界。暂停、撤回与收缩范围立即生效。

## 文件与工具

- `src/` 放实现，`skills/` 放产品工作方法，`scripts/` 放构建与验收准备程序，`tests/fixtures/` 放受控输入与示例项目。
- OpenSpec 配置、规格和 Change 材料保留在项目 `openspec/`；上游生成的 Agent Skills 与 MENDI 产品自有 `skills/` 分工明确。
- Storybook 安装、配置和 stories 属于 UI 目标项目；首版通过项目脚本、浏览器和按需启用的官方 MCP 使用，不给 MenDi CLI 增加前端。
- `.tmp/` 和生成的 `runtime/` 不承载唯一必要输入或正式证据。长期脚本、夹具、配置和必要 proof 使用受控位置；临时环境由这些输入重建。
- 固定工具使用稳定安装，不从旧临时目录继承环境。引用直接指向必要材料，不强制全量 hash、任意容量门槛或深层证据链。
- 不自动安装 Impeccable、DBX 或其他可选工具。清理目录前核对任务占用与绝对路径，只操作明确批准的目标。
