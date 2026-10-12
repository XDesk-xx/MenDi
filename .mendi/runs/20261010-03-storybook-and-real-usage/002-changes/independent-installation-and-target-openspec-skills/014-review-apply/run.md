---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-review-apply-01
actionType: review-apply
role: reviewer
run: "014"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: archive
nextRole: author
date: 2026-10-11
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/013-apply/run.md
---

# MVP-D03-B Review Apply

**verdict：approved，无阻断发现。** 固定审核 [013 Apply](../013-apply/run.md)、012 已批准的当前 Change 合同、实际实现和直接证据。借助 Open Code Review delegate 选文件和规则，由本 Reviewer 独立判断；未修改实现后自签。当前实现可进入显式 Archive，尚未实际归档。

## 重点结论

| 重点 | 独立核对结果 |
| --- | --- |
| 来源与阶段映射 | 自有方法来自安装包；目标方法只从当前目标受管路径读取。普通文件、非空正文、name、generatedBy 1.14.1 与 junction 边界有实现和测试；version 1.0 不作 CLI 版本，生成标记不认证正文未修改。Explore / Apply 及修订使用对应方法；首次 Propose 复用已有 Change 的 propose 片段，revise-propose 使用 update-change；Review 不强制 Author 方法，Delivery 保持原入口。 |
| 新交接写入前失败 | start、continue、Owner resolve、Archive prepare 四处均先加载必要方法，再在锁内 createRun 前重读。目标方法不写成 Run 必填字段。独立补验 continue / handoff 的锁内删除与正文更新：缺方法拒绝、原状态字节不变、无新占号，正常结果返回锁内当前正文。无写入的失败释放本次锁，未增加额外恢复流程。 |
| 旧记录及引用边界 | query、instructions、save / submit、diagnose、Archive execute / finish 未增加目标方法读取。旧 continuing 新交接重新读取当前目标；历史说明、未知 Ref 和未选择的方法不成为前置。Reviewer、直接批准、身份、安全路径及冲突检查保持；Archive 仍只有原生一次同步。 |
| 独立安装 | 用新目录 D:/tools/mendi/acceptance/d03-b-014-review 构建 / pack / 离线安装；真实 OpenSpec 生成双目标方法。安装 tests 1/1 通过：跨 cwd 选择目标、安装根自有方法、真实目标正文、缺方法 start / continue 拒绝、恢复读取新正文和 Storybook 并用。源码及 AGENTS 与受控输入相同。 |
| 方法实际使用 | 核对 013 保存的真实 propose 交接、逐项 instructions、四类产物及 strict validate / list：离线笔记、目标内 data/note.json、无联网依赖落实到方案和场景；仅一个 Change，0/5 任务实施。沿用这项有效工作，不要求 Reviewer 重写产物。014 新安装 tests 只证明交接，summary 的 awaiting-agent-planning 不冒充再次完成语义规划。 |
| pnpm 与 UI | results.test.ts 复用 pnpmEntry，根构建与目标依赖预检保持各自环境。新 UI 沙箱通过另一实际 pnpm 11.22.0 入口完成 baseline PASS → 真实缺陷 FAIL → 修复后新 PASS；旧结果不变，浏览器确认计数 2 → 3、禁用状态、无页面错误。只收尾本次 child，管道关闭且监听消失。缺入口 / 实际 11.9.0 入口均拒绝。 |
| 文档与验证范围 | README / context 收敛为准备、方法、操作和当前状态入口，operation guidance 保留；自有 Skills 明确已有 Change、不重复 new、不重复 sync 及各角色边界。没有增加 hash 清单、递归 Ref、行数 gate、历史补齐或产品查询前置。安装准备明确执行，根 check 不引入 UI 依赖。 |

## 验证及失败证据限制

- `pnpm check`：exit 0，136 个维护文件格式 / lint 通过，src / scripts / tests 三个真实 TypeScript 检查通过，见 [check](artifacts/check.log)。
- `pnpm test`：exit 0，**204/204 通过，0 失败、0 跳过**，约 22 分 41 秒，见 [完整工程回归](artifacts/regression.log)。本轮共享入口及统一目标夹具变化、013 已有失败值得整次复验；这不是正式 Delivery Full Test，也不推广为后续小改动的必跑集合。
- 显式 `pnpm prepare:installation-tests <本 Run artifacts/installation> D:/tools/mendi/acceptance/d03-b-014-review`，再设置 MENDI_INSTALLATION_SESSION 执行 `pnpm test:installation`：prepare exit 0，tests 1/1；见 [准备](artifacts/installation-prepare.log)、[测试](artifacts/installation-test.log)、[目标保护](artifacts/installation/target-preservation.json)。
- 设置 MENDI_UI_PNPM_BIN 为 `C:/Users/xuser/AppData/Local/node/corepack/v1/pnpm/11.22.0/bin/pnpm.cjs`，使用新 `.tmp/d03-b-014-review-ui` 与当前 artifacts/ui；`node scripts/prepare-ui-tests.ts <新目标>` 先通过严格目标 typecheck / 浏览器预检，再 `node --test tests/ui/results.test.ts`：1/1。见 [UI 准备](artifacts/ui-prepare.log)、[场景](artifacts/ui-results.log)、[新旧结果](artifacts/ui/finite-results/results.json)、[浏览器](artifacts/ui/finite-results/browser/browser.json) 及 [本次服务收尾](artifacts/ui/finite-results/preview-stop.json)。
- 直接调用现有测试夹具和应用入口，分别在 continue / handoff 的 lock-acquired 注入方法删除，再恢复并注入正文变化：两组断言通过，见 [锁内补验](artifacts/lock-probe.log)。这只是本次缺口的有限补验，不增加生产测试门槛。
- pnpm 负例在无项目 packageManager 自动切换的 D:/tools 执行：缺入口 ENOENT、真实 11.9.0 返回 test-tool-version。首个 Reviewer probe 错把底层缺文件错误预期成产品包装码，导致 probe exit 1；修正该预期后 exit 0，未改产品，保留 [原尝试](artifacts/pnpm-negative.log) 与 [正确预期](artifacts/pnpm-negative-corrected.log)。
- 固定 OpenSpec 1.14.1 `validate independent-installation-and-target-openspec-skills --strict --json`：exit 0，1 passed、0 failed、issues 空，见 [validate](artifacts/change-validation.json)。

013 的完整回归实际为 203/204，失败发生在 Archive 查询测试的 fixture submit，尚未执行该用例查询断言。原 draft / 临时提交文件 / 锁已保留，但底层原始错误没有捕获，不能据此归因 Windows、声称根因修复或把局部 3/3 当作全量通过。014 独立整次 204/204（包括原第 54 项）支持当前候选批准；旧失败仍是一次原因未证实的非阻断波动。若后续同写入位置复现，再保留具体 error details 定向定位，无需追补全部旧材料或重开本轮修订。

支持范围为当前 Windows、Node 22.23.2、pnpm 11.22.0、OpenSpec 1.14.1 及已有 store 的离线准备；未认证冷安装、其他平台 / 宿主、多布局 / 多版本、Vue、MCP 或 C 的完整真实交付。沿用未受影响的 A 与既有 Archive 结论。README / context 末尾 CRLF / 空白的 diff --check 提示不影响语义或 pnpm check，不为格式提示另开修订。

## OCR 与代码规模

preview 前排除 `.mendi/**,openspec/**,scripts/proofs/**,mendi-foundation-and-delivery-roadmap.md`，避免引入旧材料链。选入的 `(path,status)` 全部已审：total_files 10、reviewed_files 10、skipped_files 0、coverage_rate 100%，见 [coverage](artifacts/ocr-coverage.json)、[preview](artifacts/ocr-preview.json)、[rules](artifacts/ocr-rules.json)。默认未选中的目标方法 / 交接 / 安装 / UI 行为测试、当前合同、README / context 和自有 Skills 已补人工核对。该比例只代表 OCR 选择集，不代表全仓库或测试覆盖率；OCR 未调用外部 LLM。

维护 TypeScript 物理行数（含空行、注释，排除生成物），见 [统计](artifacts/line-counts.json)：

| 范围 | 第一 | 第二 | 第三 |
| --- | --- | --- | --- |
| src | application/delivery-full-test.ts：401 | adapters/openspec.ts：346 | adapters/lifecycle-store.ts：336 |
| tests | action-write.test.ts：467 | planning-cli.test.ts：444 | delivery-repair.test.ts：394 |
| scripts | proofs/mvp-d01-c-explore.ts：678 | proofs/mvp-d01-d-explore.ts：487 | proofs/mvp-d01-a-explore.ts：463 |

可比 Git HEAD 基准：methods.ts 45 → 107、actions.ts 265 → 273、action-resolution.ts 220 → 221、archive-prepare.ts 144 → 145；前三名文件本轮未扩展。新增安装准备 177 行、安装场景 196 行、方法交接测试 174 行、解析 / 映射测试 67 行，职责分别清楚；窄方法组合复用真实解析逻辑，没有纯转发拆分。旧 C / D 长 proof 沿用限定用途，只有将来实际扩展它们时才按 AGENTS 分开职责，不因当前行数追改历史。

本次交接只保留本 Reviewer Run 入口，authorRunRef 在本 Run 直接指向 013。D03 保持 open / manual-bootstrap，A archived、B active、C 未激活、累计归档 8。下一步显式 Archive；未执行实际归档、Git、正式 Full Test / Close、升级或下一 Change。
