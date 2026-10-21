---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: append-planned-changes-to-open-delivery
planningSlot: MVP-D05-B
batchId: 002-changes
actionId: append-planned-changes-to-open-delivery-revise-apply-02
actionType: revise-apply
role: author
actor: codex-author
run: "023"
status: completed
actionStatus: completed
outcome: complete
result: digest-coverage-f3-repaired
nextAction: review-apply
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-21
stageSkillRef: skills/actions/apply/SKILL.md
upstreamSkillRef: .agents/skills/openspec-apply-change/SKILL.md
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/021-revise-apply/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/append-planned-changes-to-open-delivery/022-review-apply/run.md
---

# D05-B Author Revise Apply：022 新 F3 引用集合完整性

022 独立 review-apply 为 changes-requested，固定 021 Author；旧 F1/F2 已确认修复，新 F3 是历史摘要列表可被删除仍读回。

当前按 F3 有界修订已补引用集合完整性：基于 before Workspace.scopeAdditions 的受管旧 Run/intent 计算必需路径，direct/raw 或 directDigests 须恰好覆盖；兼容旧 inline bytes，对历史字节核验，重复/缺失/冲突/非历史摘要 fail-closed。

## F3：强制完整历史引用集合并保持旧格式兼容

022 独立 Reviewer 的真实负例为两次追加后删除第二次 intent 的 `directDigests`，之后读取与更改旧 intent 均被错误接受。先前 F1/F2 已在 022 独立 Proof 中验证有效，本次**不回退紧凑摘要设计，也不另建通用证据库**。

修订仅针对当前受管追加历史：
- `src/core/scope-addition.ts` 增加纯 `additionEvidenceRefs / requireAdditionEvidence`：从每个 `before` workspace 已提交的 `scopeAdditions` 列出**所有必须引用的**旧 `run.md` 和对应 `artifacts/intent.json`；实际新旧存储中的 `direct` 或 `directDigests` 必须恰好覆盖这些身份，重复、缺少、冲突及附加非历史 digest 均 fail-closed。不会为全部旧 Run 生成哈希台账。
- `src/adapters/change-add-store.ts` 的 `confirmBasis` 在提交、resume 和 terminal 读回路径对照上述集合，之后继续逐项核真实直接字节或 SHA-256 摘要；不让删除 `directDigests` 冒充合法旧意图。
- `src/adapters/scope-additions.ts` 在历史读回中先从该 intent 保存的原 manifest 解析 `before`，检查引用格式与**完整性**，随后对摘要引用核 SHA-256；对真正旧版仅保存 `direct` 的必需历史项核原始 Base64 解码字节与当前受管文件完全相同。旧合法 inline 记录仍能读取，不需要迁移旧历史。所有文件引用仍走 `managedPath` 受管边界。
- `tests/change-add-review-repair.test.ts` 新增受控两次真实追加的 F3 正反例：删全部 digest、删一项、重复、跨 direct/digest 冲突、非历史引用及越界路径均拒绝；后续修改旧 intent 不可遮蔽；模拟完整旧 `direct` 字节方式可读取，旧字节改动拒绝；恢复入口遇到缺引用亦拒绝。所有篡改只在隔离 fixture，结束时还原。

## 真正执行与结果

| 实际检查 | 结果 / 证据 |
| --- | --- |
| `node --test tests/change-add-review-repair.test.ts` | **2/2 passed，exit 0**；包括 F1 七次连续真实追加和 F3 两次追加的正反例。原始输出 [f3-integrity-and-seven-add.tap.log](artifacts/f3-integrity-and-seven-add.tap.log) 与 [JSON](artifacts/f3-integrity-and-seven-add.json) |
| 七次追加大小 | 4,075 → 6,323 → 8,732 → 11,519 → 14,684 → 18,227 → **22,148 bytes**；新 intent 只保存有限受管路径和摘要，没有递归复制旧正文。这是有限真实观测，不是性能门槛 |
| `node --test --test-concurrency=2 tests/change-add-recovery.test.ts tests/change-add.test.ts tests/rounds.test.ts` | **13/13 passed，exit 0**；七个真实断点/原号恢复、锁竞争、重复/漂移、原轮与历史范围时序均通过。见 [recovery-and-chronology.tap.log](artifacts/recovery-and-chronology.tap.log)、[JSON](artifacts/recovery-and-chronology.json) |
| `pnpm check` | exit 0；格式、lint、src/scripts/tests TypeScript；真实结果 [pnpm-check.json](artifacts/pnpm-check.json) |
| `pnpm build` | exit 0；真实结果 [pnpm-build.json](artifacts/pnpm-build.json) |
| OpenSpec 1.14.1 strict | `validate append-planned-changes-to-open-delivery --strict --json` **1/1 valid、0 issues、exit 0**；[openspec-strict.json](artifacts/openspec-strict.json) |
| `git diff --check` | exit 0；15/15 OpenSpec 任务保持完成；未执行 Git 提交或推送 |

以上是 Author 有界复验，并非 D05 Delivery 的正式 Full Test，也不是独立 Reviewer 已批准。022 Reviewer 已执行的生命周期与兼容范围独立检查维持其原有效证据；本次没有再次重复所有无影响测试。

## 维护性与边界

当前可维护 `.ts` 源文件物理行数、排除 fixture 内 node_modules 与生成依赖，见 [line-counts.json](artifacts/line-counts.json)。`src/` 最长三名为 delivery-lifecycle 368、group-attempt 361、openspec/workspace 并列 346；`tests/` 为 action-write 467、planning-cli 444、delivery-repair 395；`scripts/` 为 d01-c proof 678、d01-d 487、d01-a 463。F3 涉及的 core scope-addition 173、adapters scope-additions 115、change-add-store 320；新文件无 HEAD 同名基线，不伪造增长率。这些逻辑分别承担纯引用集合、历史读取核对、受管提交/恢复，没有为压行数增加薄转发模块。

保留原 019/020/021/022 Run、其 verdict 与失败/proof 原样；没有修订已批准 Proposal/Design、其他 Change、历史 D01–D04、D05-A Archive 014 或 Git stash。MenDi 根仍为 manual-bootstrap，只登记实际 Author 023 阶段；未在根项目执行产品写命令、Archive、正式 Full Test/Close、Git Commit/Push、发布或部署。

**本次 023 Author revise-apply 完成，交独立 `review-apply` 再审 F3；不得自行签署 approved。**
