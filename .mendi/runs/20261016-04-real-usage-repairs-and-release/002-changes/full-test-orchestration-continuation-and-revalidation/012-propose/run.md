---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: full-test-orchestration-continuation-and-revalidation
planningSlot: MVP-D04-B
batchId: 002-changes
actionId: full-test-orchestration-continuation-and-revalidation-propose-01
actionType: propose
role: author
actor: codex-author
run: "012"
status: completed
actionStatus: completed
outcome: complete
result: planning-ready
nextAction: review-propose
nextRole: reviewer
recordingMode: manual-bootstrap
date: 2026-10-17
authorExploreRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/009-explore/run.md
reviewExploreRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/full-test-orchestration-continuation-and-revalidation/011-review-explore/run.md
stageSkillRef: skills/actions/propose/SKILL.md
upstreamSkillRef: .agents/skills/openspec-propose/SKILL.md
---

# MVP-D04-B Author Propose

Owner 指令 propose。固定 [009 Author Explore](../009-explore/run.md)及最新 [011 独立对抗补审](../011-review-explore/run.md)，其 verdict=approved 且固定 Author009；[010 原审核](../010-review-explore/run.md)保持。本会话继续 Author，不执行 Reviewer 或 Apply。当前阶段首个 Run 为012，沿原002-changes批次，根 manual-bootstrap 按既有人工方式记录，不伪报产品 action start / submit。

## 方法与直接输入

读取稳定安装自有 propose 方法和目标 openspec-propose（1.14.1）。固定 context / list 解析 repo-local 根，当前 Change 已绑定，跳过 new；按实际 proposal → design / specs → tasks 指令及依赖编写六份文件，条件性 design 因跨模块、数据模型、兼容和执行复杂性明确适用，没有跳过产物。实际指令 / rules 保存在 artifacts/start-commands.json 和各 instructions 文件；rules 均为空。

根路线图 D04-B、完整失败收集反馈、009 / 011 直接证据、三个现有能力和当前消费者提供事实依据。context 中中文、目标业务执行责任、必要直接输入、不自动安装、旧历史 / 人工格式、独立审核和各授权边界落实到协议、负例与任务，未复制模板或 context 为正文。反馈的 DreMo 历史只引用既有原件，本次没有访问或修改 DreMo，也没有继续 Explore 重跑。

## Owner 决定

009 中两项决定直接承接，不重问：采用可选结构化协议，旧入口保持命令级；候选以提交 / 必要差异或明确材料指认，由 Author 逐组说明适用性和必要独立 Review 核对，工具不认证任意源码、不建全库 hash。

本阶段基于011 E1 / E5只补问必需覆盖：必需范围内 skip / TODO、取消、零业务执行不能算完成；非必需项须在执行前明确身份及排除理由，不能失败后删范围；构建等非测试组按真实命令 / 产物条件验收。Owner 实际答复“好的”，见 artifacts/owner-coverage-decision.json。其余字段 / 命令与内部模块取舍由 Author 在已确认范围内收敛，没有把技术细节都转为 Owner 前置。

## 正式产物与方案

当前 Change 为 openspec/changes/full-test-orchestration-continuation-and-revalidation，六份正式文件：proposal.md、design.md、tasks.md 及 specs/test-execution/spec.md、specs/delivery-verification/spec.md、specs/delivery-lifecycle/spec.md。主规格未改。

- 复用三个既有 capability，不另造近似能力。delta共14个 MODIFIED及11个 ADDED requirement，修改块保留所有原场景名称并显式区分旧 / 新模式，没有删场景消除冲突。
- 协议 mendi-group-tests/1 与 groups-v1 显式接入已有 full script；目标执行有序业务清单并负责资源 / 清理，MenDi 固定请求和实际身份，消费最终回执，不解析 stdout 猜组，不建立通用调度平台。
- command 原始 outcome、组终态、协议 valid / invalid / unconfirmed 和持久状态分别解释；只有完整覆盖、晚期结束、双通道一致、资源及持久完成均确认才有可消费事实。已安全持久完成的协议 invalid 可转修复，E6未知现场仍保留锁 / 占号，不自动处理旧锁。
- 新 delivery-test-attempt 保存 initial / continue / retest及扁平当前 progress，支持尾项通过后仍修复原中段未解决的直接失败；current progress 不认证候选完整，也不递归 fromRunRef 或扫描全历史。
- 新 delivery-verification 只构造候选 verified / incomplete，不执行测试、修改原失败或增加汇总专门 Reviewer。显式来源、影响 / 沿用及必要当前批准共同核对，跨候选不凭同名脚本复用，公共变化据影响扩大。
- Full Test / verification查询、repair / review、status / next、round投影 / Reopen和Close共同消费；Close恰选旧fullTestRunRef或新verificationRunRef，保存对应直接快照，不回退旧PASS / verified、不递归来源历史。
- 旧单次、旧Close和普通command保留原合同，不追补协议 / 计时 / 候选字段；新类型 / 版本必须显式识别，旧读者不能忽略新字段后当作单次passed。真实目标接线和安装仍在D04出口独立授权。
- 阶段时间采用单调持续时间 / UTC / 包含关系；受控参考目标验证只读准备复用及确有隔离的有限并发，不承诺提速比例、放宽业务预算或优化DreMo。

## 011 对抗证据的落点

| 直接反例 | 具体合同及实施验证 |
| --- | --- |
| E1 skip / TODO也发pass；E5声明完整但实际零业务覆盖 | test-execution必需覆盖与执行前排除，tasks3.1；同候选不代替完整实测 |
| E2同文件成功失败可相交 | 最终组失败优先，不采用文件成功集合，tasks3.2 |
| E3 pass后exit7 / aborted失败事件 | 容器 / 根结束、取消和资源分别解释，tasks3.2及4.2 / 4.3 |
| E4事件失败却包装器exit0 | 原命令事实不改，显式新协议矛盾不得通过或复用，tasks3.3 |
| E6 child完成后终态写入失败 | unknown / 不完整保留现场，不挑内存成功、不分配后续执行，tasks3.4及7.2 |

不使用未来实现自证方案。可行性和现状沿用009 / 010 / 011有效观察；完整新合同的验收留给Apply / 独立Review，不能援引Explore approved自动放行。

## Tasks 与验证

任务为10组28项，全未勾，按模型 / 兼容、真实请求执行、覆盖与结束、收集资源、续测、修复影响、候选结论、Close、计时及集成安排。每组随实现落地测试与方法，不将所有测试拖到末组；后续Archive / Git / 正式出口为非tracked workflow follow-up。

固定OpenSpec1.14.1 strict校验首次及最终均通过，valid=true / issues=[]，见 artifacts/validate-final.json；status四类产物均done。实际 Apply instructions 为0/28（artifacts/apply-readiness.json），这里只核对计划齐备，不是实施或批准。逐块核对14个旧requirement及全部原场景保留、三个路径、六文件、无模板占位和全未勾，见 artifacts/planning-consistency.json。git diff --check通过。

本阶段只有规划及012 / 当前交接变化，不跑工程回归或根正式Full Test，不改 src / tests / scripts / 产品skills / 主规格 / A归档 / 原Run及verdict / 路线图 / 反馈 / 包与锁。边界观察见 artifacts/boundary-check.json；HEAD仍168a4cb，稳定安装0.1.0保持，根project累计11 / manual-bootstrap不变。没有Git写入、push、DreMo操作、迁移、安装切换或C激活。

## 交接

Author结果planning-ready，无verdict。固定本012和六份规划产物为独立review-propose输入；Reviewer应核对Owner三项决定、E1–E6、旧消费者兼容、尾项续测后的未解决失败修复、必要直接来源 / 快照及28项任务是否覆盖同一合同。

next为review-propose / awaiting-review / reviewer，authorRunRef指本012。保持Author，停独立审核，不自动Apply。
