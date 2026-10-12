---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: real-target-delivery-acceptance
planningSlot: MVP-D03-C
batchId: 002-changes
actionId: real-target-delivery-acceptance-revise-propose-03
actionType: revise-propose
role: author
run: "025"
status: completed
actionStatus: completed
outcome: complete
result: planning-complete
nextAction: review-propose
nextRole: reviewer
date: 2026-10-11
stageSkillRef: .agents/skills/openspec-update-change/SKILL.md
previousRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/real-target-delivery-acceptance/024-apply/run.md
---

# MVP-D03-C Author Revise Propose · 最小真实使用

**本次 Author 方案修订完成，停独立 Review Propose；没有 Reviewer verdict。** Owner 已确认按讨论的最简范围收敛当前 design / tasks，必要时同步路线图，明确取消项、保护历史，不实现代码或启动子智能体。

承接 [024 Apply continuing](../024-apply/run.md)，根仍 manual-bootstrap，按既有人工方式另建本次实质修订 Action / Run，不调用产品写命令迁移根历史。022 的旧方案批准、023 / 024 的实际进度、结果和限制保持原样；旧批准不自动覆盖这次范围变化。根原 Apply 尚未完成，不将本次 planning-complete 记为实施完成。

## 方法与必要输入

已读取当前目标 OpenSpec 1.14.1 生成的 openspec-update-change，以及自有 skills/actions/propose/SKILL.md 的 revise-propose 分支。固定 OpenSpec list / status 核对 root=D:/Projects/MenDi、spec-driven、proposal / design / tasks 的 existingOutputPaths；specs=skipped，不新增 delta、Change 或 Explore。

逐项读取 proposal / design / tasks 的真实 instructions、template、依赖和 context。Owner 已明确授权此次范围修订，按已确认方向同步现有产物，未要求重复确认。实际规则落实为中文说明、目标角色分离、目标独立记录、按影响复用旧结果、禁止历史改写与额外 gate。此前 proposal / design 仍写“目标尚未创建 / 0/23”，本次按 023 / 024 的实际准备事实纠正当前规划，未回写历史。

## 收敛结果

保留三个实际结果：

- 稳定 MenDi 正确定位目标，实际读取目标 OpenSpec 方法 / instructions / 任务并组织合法交接。
- 目标自己的计数器方案与实施经过流程要求的真实独立审核；默认 0 / 初值 5、加一、重置到 0、禁用，App / Storybook 共用一个 CounterPanel。
- Storybook 三个状态、有限交互、官方 CLI 预览与宿主浏览器实际可用，至少一次稳定 MenDi 普通 focused 运行目标脚本，必要工程检查与本次服务收尾有结果。

根 tasks 从六组 23 项合并为四组 10 项，**3/10，remaining=7**。已有 1.1–1.3 直接沿用，未新增完成项；其余均待做。合并按结果组织，不逐阶段 / 命令拆根 Run，不新增 proof 或 Owner 确认。目标仍按合法 Explore / Review Explore / Propose / Review Propose / Apply / Review Apply 顺序实际发生，不因根任务合并跳过审核，根最终另停独立 Review Apply。

**明确取消**：额外新 Author 恢复和刻意留待、目标 Archive、正式业务失败 / 注入、delivery-repair、专为正式修复的定向补审、原五项完整重跑、首轮目标 Close、verify:fast / full 和多模式 runner、额外预算负例矩阵。实际问题正常修订补审，取消强制演示不禁止处理真实缺陷。原 23 项对应 / 保留 / 合并 / 取消集中在 tasks 处置表，没有将取消项勾为通过或另建 Change。

目标 Apply 独立批准及合法 next 可满足本轮最小流程验收，目标可停在待 Archive；本次不宣称已认证目标全生命周期、正式失败修复或新会话恢复。根 C Archive、根 D03 正式 Full Test / Close、Git 和清理仍另守授权。

## 目标归属和必要限制

目标仍为 tests/fixtures/d03-c-vue-project，Delivery d03-c-vue-counter / VUE-COUNTER，Change implement-naive-counter，稳定安装和版本不变。目标阶段与测试记录只在目标 openspec/ / .mendi/，根仅汇总进展和少量直接引用，不复制日志 / 项目 / 证据树，不将目标 Action 转为根 Action。

未来获明确范围 / 会话授权后，可由目标 Author 和独立 Reviewer 独立完成保留阶段，无需 Owner 亲自逐阶段审核；当前没有启动或指定 Agent，不由 Author 自签、自己充当 Owner 或伪造授权。目标在 MenDi 仓库内，不宣称子 Agent / workspace 提供文件权限隔离；其写入范围仅目标目录，产品问题先报告，不能扩散到根源码、其他 fixtures、安装或历史。

目标当前 AGENTS、OpenSpec rules / guidance、README 仍有旧新 Author 留待 / full 说明。本次不写目标文件；下一次获批准 Apply 在目标操作前同步这些当前说明，已纳入当前 2.1，不补写任何历史。本轮业务尚未实施，目标 local=null / next=delivery-open。

023 的安装、方法、空工程检查与 024 准备短验继续有效，保留冷安装、原跨进程准备组预算及真实 Chromium / Storybook 收尾未认证等限制。取消正式五项集合的共享 deadline 与额外负例后，仍保留普通命令 / 有限测试时限、前台取消、仅处理本次持有进程和有限停止确认；不新建通用执行器或虚构 MenDi timeout 参数。

A / B 的工具归属、稳定安装 / 方法与无 UI 工程，以及 D02-C 的生命周期结果选择在未变范围复用，不拿它们认证本 Vue 的实际业务 / 审核。本轮没有重做 Explore、回放旧 tests 或追补旧证据。

## 实际修改文件

[scope-summary](artifacts/scope-summary.json) 依据本次实际写调用，仅包含：

- 当前 Change 的 design.md / tasks.md，以及为范围一致性同步的 proposal.md / .openspec.yaml 目标描述；身份、created 和 skip_specs 保持。
- roadmap 仅 MVP-D03-C 对应节，取消旧留待 / 正式收口要求，明确目标单份记录与最小结论边界。
- 当前 D03 manifest 的 C 目标 / 出口及最新交接，根 README / OpenSpec context 的当前范围和入口；A / B 绑定、归档编号和状态不改。
- 新 025 Run / artifacts，before 仅本次确需对照的当前规划文件短名与 roadmap C 节选，没有复制历史 Run 或嵌套证据树。

没有修改产品实现、目标工程文件、旧 fixtures / proof、历史 Run / artifacts / verdict，没有 Git 写入、目录清理、阶段执行、角色切换或跨会话消息。工作区仍有此前阶段已有差异，不将所有 Git 未提交内容归为 025。

## 检查与交接

| 实际只读检查 | 结果与用途 |
| --- | --- |
| 固定 OpenSpec list / status，proposal / design / tasks instructions | exit 0，当前 root / 产物 / 依赖有效；原始输出各一份 |
| OpenSpec validate real-target-delivery-acceptance --strict | exit 0，skip_specs INFO；结构有效，不等于独立批准 |
| OpenSpec instructions apply | exit 0，ready，3/10、remaining=7；只是任务读回，没有实施 |
| 稳定 MenDi next --project 根 | exit 0，review-propose / awaiting-review / reviewer，唯一当前 authorRunRef 指向 025；manual-bootstrap / executable=false 保持 |
| 稳定 MenDi status --project Vue 目标 | exit 0，目标 local=null、next=delivery-open；无目标操作写入 |
| 当前 root / Change YAML | 可解析，schema=spec-driven、skip_specs=true；没有产品规格变更 |

必要汇总见 [readback-summary](artifacts/readback-summary.json)，各命令原始输出只在对应 JSON。仅规划 / 当前交接变化，不运行源码回归或普通 / 正式 Full Test，不以结构成功宣称业务通过。

独立 Reviewer 本次只需审查最小范围、旧项处置、角色 / 记录归属和必要执行限制：当前 proposal / design / tasks、roadmap C 节与本 Run / 直接 before 可对照。无需重审全部历史或追补材料；023 / 024 的有效准备事实可直接沿用。根 next 只指向本次 Author，不累积所有历史链。

当前 Action 以 complete / planning-complete 收口，交独立 review-propose；批准后才回 Apply，本次没有实现计数器或提前启动目标阶段。
