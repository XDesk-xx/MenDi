# Tasks

## 1. 唯一组件与可执行 stories

- [x] 1.1 实施唯一 CounterPanel 与 App 挂载，编写 Default / ExistingValue / Disabled 三个 stories；断言分别核对 0→1→0、5→6→0、禁用按钮且值保持 5，以真实组件 DOM 行为验证规格。
- [x] 1.2 接入所需 Storybook preview / Vitest project / setup，增加 verify:stories 与 mendi.tests.focused 映射，并在 README 说明 props 初值、reset0 和实际入口；通过稳定 MenDi 普通 focused test run 取得三个 stories 的实际 Chromium 结果和目标内持久化入口，确认无自动下载。

## 2. 工程集成与实际预览

- [x] 2.1 完成目标 check、build、build-storybook；check 验证只读格式、基础 lint、真实 vue-tsc 覆盖源码 / stories / 配置，保存各命令实际退出、单次预算 / 时长 / 限制。确有范围内失败先保留结果、局部修复，再取得必要的新结果。
- [x] 2.2 核对候选 6115 归属，启动自己持有的官方本地 Storybook dev；实际调用 tools stories preview --attach 取得三个真实 URL，宿主浏览器核对渲染、交互、禁用和页面错误，正常关闭本次浏览器 / 预览并确认退出与监听结束；记录实际 URL、有限预算、收尾和未确认项，不停止未知服务。
- [x] 2.3 将实际结果和当前限制同步 README / 当前 Apply Run，列本轮实际写入文件分组及 src / tests / scripts 维护代码物理行数前三和职责判断；核对现有目标方法 / 当前任务后提交 Apply complete，供独立固定输入 Review Apply，不自签。

## Workflow follow-up

- 本方案先经独立 Review Propose approved，再进入 Apply。独立 Review Apply approved 后停待 Archive；该审核不是 Author 可自签的 tracked task。
- 新 Author 恢复、目标 Archive、正式 Full Test failure / repair / Close、五项 runner、额外预算负例、Git、清理均取消或未授权，不计 PASS，不恢复为任务。
- 普通工程每次最多 5 分钟，stories / 浏览器每次最多 3 分钟，内部步骤最多 30 秒；使用实际单调 deadline / 剩余时间与取消，收尾未确认停止后项并如实保留限制。只管理本次持有的进程 / 浏览器。
