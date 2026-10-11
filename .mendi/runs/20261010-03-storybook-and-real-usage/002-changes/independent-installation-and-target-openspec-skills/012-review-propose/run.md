---
deliveryId: 20261010-03-storybook-and-real-usage
changeId: independent-installation-and-target-openspec-skills
planningSlot: MVP-D03-B
batchId: 002-changes
actionId: independent-installation-and-target-openspec-skills-review-propose-01
actionType: review-propose
role: reviewer
run: "012"
status: completed
actionStatus: completed
result: approved
verdict: approved
nextAction: apply
nextRole: author
date: 2026-10-11
authorRunRef: .mendi/runs/20261010-03-storybook-and-real-usage/002-changes/independent-installation-and-target-openspec-skills/011-propose/run.md
---

# MVP-D03-B Review Propose

**verdict：approved，无阻断发现。** 按项目 Review Propose 方法，固定独立审核 [011 Propose](../011-propose/run.md) 与当前 proposal、design、action-runs delta、tasks；沿用 010 的适用探索结论。方案可进入 Author Apply，15 项任务尚未实施。未修改方案或实现后自行批准，工具校验成功不代替本次语义审核。

## 重点结论

| 重点 | 审核结论 |
| --- | --- |
| 目标方法与阶段映射 | design §1–3 与 delta 一致：当前目标单一来源，安全路径、普通文件、name、非空正文和 generatedBy 1.14.1；version 1.0 不作为 CLI 版本，生成标记不认证正文完整性。Explore / Apply 及修订使用对应目标方法；首次 Propose 使用已有 Change 的产物片段，revise-propose 使用适用 update-change 规则。Review 不强制 Author 方法，Delivery 不要求 Change 方法；Archive 准备只读归档指导，保持一次 native 同步。 |
| 新交接入口完整性 | 核对当前全部 Change createRun 调用：start、continue、Owner resolve、Archive 准备均在 design §4 / tasks 2.1–2.2 覆盖。Owner 接收按实际目标阶段决定方法，不以来源阶段或角色绕过。锁前检查必要方法，锁内在占号前重新核对阶段、直接对象及方法，并返回本次读取内容；不是新增持久方法状态机。 |
| 写入前失败与兼容 | 必要方法缺失只拒绝实际依赖的新交接；tasks 要求检查 Run / manifest 与占号不变，并验证恢复后跨进程读取新正文。旧 Run 不增加必填字段或正文快照，stage / guidance 保持；即时 upstream 不变成查询依赖。查询、instructions、save / submit、diagnose、Archive execute / finish 不新增方法读取，旧 prepared Archive 仍可按既有协议收口。 |
| 稳定安装和实际使用 | 继续现有 dist / skills / README 包清单，真实编译打包后在开发仓库外安装；tests/installation 用双目标、不同 cwd / 新进程检查安装根、目标根与 CLI 定位，以及实际产品 start / continue 的拒绝行为。task 3.3 要求宿主实际使用返回正文及逐项 instructions 生成目标规划，不用候选或模拟正文代替产品验收。 |
| pnpm 一致性 | task 4.1 明确 UI results 复用已有 pnpmEntry，并以另一个真实稳定入口核对实际命令与新结果。根正常构建环境和目标严格预检分开；缺入口 / 错版本仍失败，禁止通过关闭产品依赖预检换取 PASS。009 的环境差异作为依据保留，未被包装成功掩盖。 |
| 文档与按影响验证 | README / context 收敛为当前入口与必要背景，方法留 Skills，过程从 Run 定位；保留既有规则和 operation guidance，不改历史。安装准备显式执行，测试只消费已准备环境，普通 pnpm test 不自动安装。UI 只补受影响结果场景，其他 A / Archive 结论沿用，C 负责真实组合交付；升级仅后续预留。 |

## 核对依据与验证

- 读取 011 正文、四类当前产物及其保存的 artifact instructions，核对 proposal → specs / design → tasks 的真实依赖与当前范围。当前 delta 完整保留原 Stage skill and requested guidance 的五个场景名称，并扩展三项具体要求；没有无关主规格改写。
- 对照实际 methods loader、actions、Owner resolve、Archive prepare、writeAction / lockedWrite / createRun 及 Delivery 方法入口，确认接线位置与排除范围可实施。核对当前官方 update-change 对已有产物、部分 glob 新增及缺失产物的边界，方案未把它当成首次 Propose 的替代。
- 固定 OpenSpec 1.14.1 `validate independent-installation-and-target-openspec-skills --strict --json`：exit 0，1 passed、0 failed、issues 空，见 [validate](artifacts/validate.json)。[status](artifacts/status.json) 的四类产物均 done；仅表示规划文件齐备。
- 独立核对 15 项任务全部未勾选、旧五个场景保留与 instructions 依赖，见 [assessment](artifacts/assessment.json)。011 的方案工作未改产品实现，沿用 010 根检查与有限 proof，不因文档审核重新安装或重跑全部实现回归。

## 实施注意点（非阻断）

锁内方法失败按现有 lockedWrite 行为处理：尚无实际写入时释放本次锁，已有提交或释放失败时才保留相应现场；不能把“锁内复核”实现为每次缺方法都遗留锁的额外流程。task 2.1 的写前与占号回归应核对这一既有边界，无需另加恢复器或审批。

task 5.1 的完整根 pnpm test 用于本次共享方法入口和统一目标夹具变动的回归，不推广为后续所有小改动的强制集合。新增安装场景进入现有 TypeScript / Biome 检查范围即可；显式安装验收、所选 UI 场景与普通工程检查按影响使用，不增加产品 status / next gate、hash 清单、历史补证或独立维护台账。

本次批准不认证目标方法接线已完成、冷安装、多布局 / 多版本、WebCodex、Vue、MCP 或 C 的真实完整交付。生成标记只说明支持基线，旧正式 Run / verdict 保持，不要求逐轮字节比对历史材料。

下一步 Author Apply；本轮不实施、不归档、不执行 Git、正式 Full Test / Close 或下一 Change。D03 保持 open / manual-bootstrap，A archived、B active、C 未激活、累计归档 8；当前 next 仅指向本审核 Run。
