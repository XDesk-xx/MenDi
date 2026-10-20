---
deliveryId: 20261020-05-formal-full-test-and-workflow-repairs
changeId: unified-groups-full-test-and-repair-flow
planningSlot: MVP-D05-A
batchId: 002-changes
actionId: unified-groups-full-test-and-repair-flow-revise-explore-01
actionType: revise-explore
role: author
actor: codex-author
run: "004"
status: completed
actionStatus: completed
outcome: complete
result: revised-proof-supported
nextAction: review-explore
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-20
stageSkillRef: skills/actions/explore/SKILL.md
upstreamSkillRef: .agents/skills/openspec-explore/SKILL.md
revisesRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/002-explore/run.md
previousRunRef: .mendi/runs/20261020-05-formal-full-test-and-workflow-repairs/002-changes/unified-groups-full-test-and-repair-flow/003-review-explore/run.md
---

# MVP-D05-A Author Revise Explore

依据 003 独立 Review 的 changes-requested 执行修订，固定对象为 002 Author Explore。

## 目标

- F1：证明 proof 资源释放仅触及本次明确持有的夹具路径；外部同前缀目录绝不扫描删除，未知/持锁不删。
- F2：新 proof 入口接受 TypeScript strict 类型检查和真实执行检查；不修改旧 002 proof/results。
- 沿用仍可靠的 P01～P04 现状结论；重复实验只在新的独立夹具发生，不代表 D05-A 已实现。

## Reviewer F1：清理权限收敛

新增可重放的 [004 proof.ts](artifacts/proof.ts)，不执行也不修改已有 002 proof。原脚本误按“启动后新出现的所有 `.tmp/mendi-apply-*` 目录”寻找清理对象，可能删除并发会话创建的无锁目录。修订改为：

1. 仅记录本次 `groupTarget()` 确实返回的 `project` 根路径，计算其准确父路径；要求真实路径在本仓库 canonical `.tmp` 直接子目录且 `project` 身份、路径名符合夹具约定。
2. 在**本次明确返回的每个父目录**写入带随机 nonce 的 `.d05-a-004-owner.json`，清理前逐项验证父目录 realpath、本次标记原字节、真实 `project` 与没有 `.mendi/write.lock`；任何不明、标记冲突或锁存在则 fail-closed，不删除该目录。
3. 清理**只遍历这份创建列表**，不扫描 `.tmp` 下其他新增对象，不根据前缀匹配删除。额外创建一个同样以 `mendi-apply-` 开头的“非夹具所有者列表”模拟目录，确认四个合法夹具清理完后仍保留，最后仅凭该模拟目录自身专属标记显式清理它。
4. 仅在全部四项实验成功、运行资源已结束后执行清理；如果执行异常，则保留现场便于核查，不把未知结果声称为成功。

[实际运行结果](artifacts/proof-results.json)：`fixturePathsVerifiedAndDeleted=4`，`eachUsedExplicitOwnerMarker=true`，`unrelatedSamePrefixDirectoryPreserved=true`，脚本退出 0。**这证明受控场景中的归属边界，不能据此断言所有并发竞态都已覆盖；本次没有修改产品清理器。**

## Reviewer F2：严格 TypeScript 验证

新 `proof.ts` 不是把旧脚本改名或规避 TypeScript。改为有类型的静态 TS 引用、显式夹具与结果类型、带 `unknown` 缩窄的异常处理、正确 `net.listen` 和 Promise 完成签名；避免无类型动态 import 与隐式 any。

[独立 strict 检查](artifacts/typecheck.json)运行：

`node node_modules/typescript/bin/tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck --allowImportingTsExtensions <004 artifacts/proof.ts>`

实际 **exitCode=0、stdout/stderr 均为空**。此处明确单独指定当前 `.mendi` proof，而不是错误地声称根 `pnpm check` 的 `tsconfig.scripts.json` 默认覆盖 Run 中的 TS。随后使用 `node --experimental-strip-types <004 artifacts/proof.ts>` 实际执行，exit 0，四个场景均有真实隔离 runner 结果。

## 业务 proof 与适用范围

004 的 P01～P04 在**新建的四个独立隔离 product-v2 夹具**内重新观察，结果与 002 的有效结论一致：

- **P01**：三个真实组为 passed / failed / failed，证实普通失败后的独立错误收集。
- **P02**：自己持有的真实服务端口阻断 middle，得到 passed / blocked / passed；安全释放端口后全量 initial 三组通过，没有多余 Repair/Review Run。仅证明 known blocked，不推广到所有 `failed`。
- **P03**：旧 command failed 经夹具 Author Repair / Reviewer approved 后，首次切换 groups-v1 仍因缺少 `testAttemptRunRef` 被拒绝；历史 failed 不变。这是 D05-A 后续要解决的功能缺口。
- **P04**：现行局部 retest middle 后，旧 prefix/tail + 新 middle 仍可形成 verified，证明 D04 的多来源验收合同和 D05-A 新全量政策不同。

夹具中的 Reviewer label / verdict 并非 MenDi 当前 Change 的真实独立审核；这四项在 Explore 阶段仅证明**当前产品行为**，不表示 D05-A 新功能已经实施。Owner 已确认新完整 groups-v1 Full Test 全部必需组通过时由该次正式 Run 直接 passed，Close 另行授权；实质修复仍保留 `delivery-repair` 和 `review-delivery-repair`，确认的环境准备例外免无意义 Repair/Review Run。

## 保留和交接

本次只新增 004 修订 Run 与 `artifacts/proof.ts`、`proof-results.json`、`typecheck.json`。原 002 Explore 的正文、旧不安全 proof 与结果保留为历史证据，003 Reviewer 的 changes-requested 和原 verdict 不改；没有清理历史文件或将旧证据冒充修订后的输出。

修订已完成，交由**独立 `review-explore`** 检查 F1/F2 和 P01～P04 的适用性。未写 Proposal / design / specs / tasks，不修改产品实现、DreMo 或稳定安装，不做 Git / 正式 Full Test / Close。

