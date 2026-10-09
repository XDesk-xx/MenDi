---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
planningSlot: MVP-D01-A
batchId: 003-changes
actionId: revise-apply-project-entry-013
actionType: revise-apply
role: author
run: "013"
status: completed
actionStatus: completed
result: revision-verified
date: 2026-10-09
stageSkillRef: .agents/skills/openspec-apply-change/SKILL.md
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/012-review-apply/run.md
---

# MVP-D01-A 归档前 Author 局部修订

Owner 明确要求本 Change 局部 revise-apply：收窄引用检查、人工归档后的只读衔接、基础格式 / lint / check、控制 hash 用途，并同步设计 / 规格 / 任务。012 的批准仅覆盖其当时输入；本轮新变化需独立 Reviewer 补审。

保留 012 及以前 Run、编号和 verdict；本轮仅此一个 Author 修订 Run。停在独立 review-apply，不执行当前 Change Archive、Git 操作、正式 Delivery Full Test 或下一 Change。历史和排除夹具用文件字节比较核对，不新增 hash 清单或 gate。

## 修订

- [workspace.ts](../../../../../../src/adapters/workspace.ts) 移除递归 `*Ref` 存在性扫描。实际读取 project 和当前 manifest；binding 仍核对受管路径安全，只有当前活动 Change 要求活动路径存在。历史 Run、旧方案、说明链接、批次目录和未知扩展不解析为运行输入。独占创建、锁、写前 / 锁内校验和部分失败诊断保留。
- [records.ts](../../../../../../src/core/records.ts) 只读兼容人工 `archived` binding 的 `openspec/changes/archive/YYYY-MM-DD-<changeId>`，校验日期、身份并拒绝 archived 仍作为当前 Change。人工交接清空 activeChangeId 后 query 不调用旧 Change status，upstream 为 null；不通过旧目录补建或伪装活动状态维持查询。归档材料仅作为本地定位，不以目录存在性 / 内容替代归档效果验证。
- [query.test.ts](../../../../../../tests/query.test.ts) 覆盖历史说明缺失、旧 Delivery manifest 缺失、未知嵌套 Ref、必要输入缺失、越界 / 外部 junction、归档后查询和矛盾归档记录。归档场景为 fresh fixture 中的人工数据，不执行当前 Change 的实际 Archive；spy 明确核对只调用 version / list、没有活动 status，真实 CLI 另外验证 status / next 只读。
- [biome.json](../../../../../../biome.json) 与 [package.json](../../../../../../package.json) 引入固定 Biome 2.5.15；`check` 聚合 format:check、基础 lint、原 typecheck。格式整理 20 个维护中 TypeScript 文件，lint 发现并移除一个无用 import，未拆转发层或设置行数硬限制。排除整个 tests/fixtures、历史 Run、生成物；配置依据 [Biome 官方配置](https://biomejs.dev/reference/configuration/)。
- [proof 脚本](../../../../../../scripts/proofs/mvp-d01-a-explore.ts) 停止在新报告输出无消费者的 scriptSha256；测试及实验验证目标未修改的字节比较保留。没有新增文件 hash 清单或 hash gate。

受影响的 proposal、design、两份 specs 和 tasks 已同步；原 16 项完成记录保留，第 6 部分四项按固定 OpenSpec 返回的位置核对、完成并读回 20/20。没有重做完整 Explore / Propose，012 的旧 verdict 保留且不自动覆盖本次变化。

## 验证

| 实际检查 | 结果与证据 |
|---|---|
| `pnpm install --frozen-lockfile` | 通过；Biome 精确版本及锁文件一致 |
| `pnpm check` | 格式 20 文件、基础 lint、src / scripts / tests typecheck 均通过；[check.txt](artifacts/check.txt) |
| `pnpm test`（含 build） | 34/34 通过，无失败、无跳过；[tests.txt](artifacts/tests.txt)，原始 CLI 输出在 `artifacts/regression-commands/` |
| proof 脚本 fresh 重放 | 8/8 通过；[新 report](artifacts/proof-001/report.json) 未含 scriptSha256，原证据不变；此实验仍不作为产品归档验收 |
| 固定 OpenSpec strict validate | 通过；最终任务为 all_done、20/20；[apply-status](artifacts/apply-status.json) |
| 历史和排除夹具 | 001–012 的 71 个文件、13 个受控夹具文件与修订前逐字节一致，不生成 hash 清单 |

最终只读 next / status 与材料核对见 [summary](artifacts/summary.json)。真实工具、并发写 / 替换失败回归在本轮现有测试内保留；可靠历史结果不被重标为新审核批准。未执行 Git 命令，包括 diff / checkpoint / push。

## 交接

当前 manifest / README / OpenSpec context 指向本 Author 修订 013，停在独立 review-apply。Reviewer 补审必要输入边界、人工 archived 身份 / 状态、格式与基础 lint 配置、新规格与任务及新测试；旧 012 继续是其当时输入的 approved，不存在本轮新 Reviewer verdict。

本次仅记录 / 查询兼容，不实现 Archive Action、不执行当前 Change 归档、正式 Delivery Full Test 或下一 Change。人工归档后的本地查询明确不认证归档效果；实际归档必须在后续独立审核后另按 Owner 指令执行。
