# Vue 目标协作约定

- 本目标为 D:/Projects/MenDi/tests/fixtures/d03-c-vue-project，验证稳定 MenDi、目标 OpenSpec 与 Storybook 的一次最小真实使用。计数器业务须在目标方案独立批准后实施。
- 使用 Vue 3、Composition API、TypeScript 和 script setup；App 只挂载唯一 CounterPanel，应用与 stories 共用组件。默认 0 / 初值 5、加一、重置到 0、禁用为全部业务范围。
- 稳定工具、实际命令和当前状态见 README。MenDi 显式 --project 本目标绝对路径，OpenSpec cwd 为本目标；不借父工程或旧 .tmp 的依赖、实现和证据。
- 目标 Author 与 Reviewer 的写入范围仅本目标目录；不得修改根 MenDi 源码、其他 fixtures、安装位置、根或其他 Change 的 Run。发现产品问题先报告当前事实，不顺手扩散修复。子 Agent 和独立 workspace 不提供文件权限隔离。
- 目标 OpenSpec、Delivery / Change / Action / Run、测试与 verdict 只留本目标；根 Author 仅汇总当前 D03-C 结果和必要引用，不将目标阶段变成根 Run，不复制项目、日志或证据树。
- 目标 Open / 激活绑定和会话启动、协调须在真实 Owner 授权内；新 Change 激活的 Owner 原始消息必须包含连续 owner 授权 并明确本目标。根方案批准、README 授权示例、子 Agent 自述均不能代替真实授权。已覆盖正常阶段的授权无需逐阶段重复申请，不能自行扩大范围。
- 获明确授权后，一个目标 Author 与一个独立目标 Reviewer 可完成正常阶段交接。Reviewer 审核当时固定的 Author / 产物，Author 不切角色自签，不要求 Owner 亲自逐阶段审核。启动 Agent 和必要阶段消息协调也须明确授权。
- 按 MenDi 合法顺序完成 Explore / Review Explore / Propose / Review Propose / Apply / Review Apply；Explore 只核对必要项目事实，方案批准后实现组件。仅实际问题才修订补审，不制造 finding 或增加逐步 proof / gate。
- 取消额外新 Author 恢复、刻意留待验收、目标 Archive、正式 Full Test 失败 / 注入 / repair / 专门补审 / 五项重跑 / Close、fast / full 多模式 runner 和额外预算负例矩阵；取消不记 PASS。正常 continuing 仍可使用，目标 Apply approved 后可停在待 Archive。
- 所有已提交 Run、正文、artifacts、结果和 verdict 不编辑、删除、移动、重编号或格式化。后续进展写新的合法 Run；检查只覆盖维护文件，不补证、不扫描全部旧引用、不建 hash 清单。
- 普通工程命令每次最多 5 分钟，stories / 浏览器每次最多 3 分钟，内部步骤 30 秒，由本次宿主承担实际调用与到期 / 前台取消。停止后项，只管理自己本次持有的进程 / 浏览器；有限确认未完成时保留实际记录和限制，不清锁或自动重跑。
- Git、根 C Archive、根 D03 正式收口、清理和部署不在目标最小验收授权内。任何未知 / 外部服务不能据旧 PID 或端口停止。
