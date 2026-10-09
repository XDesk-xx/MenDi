---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: action-runs-and-role-handoff
planningSlot: MVP-D01-B
actionId: action-runs-and-role-handoff-apply-01
actionType: apply
role: author
run: "020"
status: completed
result: implementation-ready-for-review
date: 2026-10-09
completedOn: 2026-10-10
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
proposalReviewRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/action-runs-and-role-handoff/019-review-propose/run.md
nextAction: review-apply
nextRole: reviewer
---

# MVP-D01-B Apply

Owner 指令 `apply`，实施 019 独立批准的当前方案。本会话保持 Author，14 / 14 项实施与验证任务已完成，结果可交独立 Review Apply；本记录没有 Reviewer verdict。

## 实际实现

- `src/core/actions.ts` 定义产品 Run 头部、九种 Action 类型与当前交接规则；`records.ts` 扩展单当前指针 / 单批次，兼容无 Run 的 product v1 与人工格式。未知说明不递归成为输入。
- `src/adapters/runs.ts` 读取当前必要 Run、渲染 YAML / Markdown，按 Delivery 操作与 Changes 批次两种约定层级占号。批次不占号，artifacts 不参与，空占号保留并报告，重复号 / 越界 junction 拒绝。
- `src/adapters/methods.ts` 从安装包位置读取六个产品阶段方法，修订复用 Author 方法；只按 `--tool openspec` 明确选择读取工具指导。start / continue 返回实际文件与正文，缺失或元数据不匹配在占号前拒绝。save / submit 与普通查询不重新加载方法。
- `src/application/actions.ts` 接入 start / continue、save / submit。当前 draft 绑定 role / actor；提交需要正文、outcome、result，提交后拒绝保存 / 重提。continuing 新建同 Action Run，complete 拒绝继续。修订新建 Action，替换当前批准入口，保留旧 verdict。
- Review 首次固定当前完整 Author 提交，验证直接身份、阶段、完成状态与不同 actor；多 Run 继续 / 提交沿用该固定对象。固定 Author 丢失只阻断实际消费它的 Review continue / submit，普通查询仍可解释 Reviewer 头部。三类 verdict 形成最小 next，rejected 停 Owner。
- `src/adapters/action-store.ts` 复用独占锁，先写新 Run，再替换 manifest 并读回；save / submit 临时文件替换当前 draft，不改指针。修改后失败保留锁、临时文件和已写路径，读回内容漂移也失败；不抢锁、自动重提或回滚。原 Open / bind 默认错误行为保留。
- CLI 参数、中文 / JSON 输出、帮助与 README 示例已同步。人读查询区分“尚未关联”和“已归档、当前无活动 Change”；人工四类写命令统一拒绝。

当前受审 proposal、design 与两份 delta 的合同保持一致，无实质方案变更；tasks 逐项依据固定 OpenSpec 的 sourcePath / line 更新并读回。主规格未提前同步。MenDi 自身继续人工 bootstrap，本轮产品操作仅发生在受控测试目标，未迁移现有人工记录。

## 验证与直接证据

| 检查 | 实际结果 / 覆盖 | 材料 |
|---|---|---|
| `pnpm check` | 格式检查、基础 lint、源码 / 脚本 / 测试 typecheck 通过 | `artifacts/check.log` |
| `pnpm test` | 内含 `pnpm build`，构建通过；64 / 64 测试通过，0 失败 / 跳过 | `artifacts/regression.log` |
| 新文件与状态定向检查 | Run 必填与身份、失效说明 / 未知 Ref、坏旧 Run、缺当前输入、规则 / 方法 / 占号均通过 | `tests/actions.test.ts`、`tests/methods-and-numbers.test.ts` |
| Action 写入回归 | 18 项，通过；保存 / 提交、固定 Author、三个 verdict、修订、空占号、未知说明与逐点故障 | `tests/action-write.test.ts` |
| 真实 CLI / 子进程 | 3 项，通过；真实稳定 OpenSpec，Open 后 bind，Author 两 Run、Reviewer 两 Run、修订补审与显式阶段推进，持续进程退出后查询读回 | `tests/action-cli.test.ts`、`artifacts/commands/` |
| A 既有行为 | 配置 / root / 版本、路径 / junction、Open / bind 与锁 / rename 错误、人工查询和归档交接回归通过 | 同一 64 项完整回归日志 |
| 固定 OpenSpec 收口 | strict validate 有效；apply instructions 为 all_done，14 / 14；当前只读 status / next 指向 020、review-apply / reviewer | `artifacts/validation.json`、`apply-instructions.json`、`workspace-status.json`、`workspace-next.json` |

真实 CLI 集成在 fresh sandbox 从受控 fixture 创建目标，正文也由测试显式生成，不继承旧临时环境。第一次连续流程保存 001 / 002 Author 与 003 / 004 Reviewer；005 修订和 006 补审保留原提交与 verdict；继续显式验证 Propose / Apply 的记录规则至 010。每步通过独立 CLI 进程读回，测试直接比较原提交与外部 body 的字节未改变。另一真实持锁子进程与 CLI 竞争，竞争者失败且原锁未删除，只有一个新编号。

故障覆盖新 Run 落盘后、manifest 替换前、Run 替换前、读回与锁释放；原文件在替换前失败时完整，替换后失败保留实际新状态与锁。另注入实际 rename 失败、有效头部下的正文漂移；查询与再次写入不自动认领或清理现场。普通 `check` 仍排除历史 Run、生成物和受控 fixtures；没有新增 hash 清单 / gate、文件行数门槛或历史补证流程。

开发期间修正了测试联合返回类型的 narrowing，以及 CLI 测试把工具指导文件 ref 错认成方法标识的断言。初次 check 的失败输出保留在 `artifacts/check-initial.log`，原始 CLI 调用也保留；修正后完整 check 与 64 项回归通过，没有删除旧正式证据或以失败结果声称通过。016 / 017 的可靠可行性结果可沿用；本轮补的是实际产品与失败路径验证。

## 限制与独立交接

actor 是责任标签，不认证真实身份；测试中的 Reviewer 标签只证明记录规则，不构成本 Change 的独立审核。阶段方法读取、工具 PASS、任务全勾及上游 readiness 均不证明完整阶段语义验收或 Reviewer 批准。

锁与最终读回提供可诊断的多文件写入，不宣称跨文件崩溃原子性。失败现场须 Owner 核对，本轮没有恢复命令；可信本地协作也不阻止产品外直接编辑文件。第二 Change 产品激活、完整阶段工具接线、Archive 与 Delivery 收口仍按受审范围留给后续 Change。

独立 Reviewer 的直接对象为本 020 Author Run 与当前受审合同 / 实现 / 测试，重点核对当前输入边界、修改后失败留锁、Reviewer 多 Run 的固定 Author、修订后当前批准失效，以及旧格式查询兼容性。当前 next 为 review-apply / reviewer，停止在此边界，不自签批准。

020 复用 `003-changes`；依据 `artifacts/allocation.json` 连续分配，001–019 的编号、文件及 verdict 未改写，没有为每个检查新增 Run。累计已归档 Change 仍为 1，当前 Change 保持活动。未执行 Git、Archive、正式 Delivery Full Test / Close / Reopen 或下一 Change 激活。
