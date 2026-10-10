---
deliveryId: 20261009-01-single-change-manual-collaboration
planningSlot: MVP-D01
actionId: mvp-d01-delivery-full-test-01
actionType: delivery-full-test
role: author
run: "041"
status: completed
actionStatus: completed
result: passed
date: 2026-10-10
testMode: owner-authorized-manual-full-test
testedCommit: 7c473bef3a76c44ced406f1f23690bdfb0be52ce
previousRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/apply-revision-and-native-archive/040-archive/run.md
---

# MVP-D01 Full Test（人工执行）

**结论：passed。** Owner 原始指令为 owner 授权 full test；保持 Author。本次针对当前 D01 A / B / C / D 的交付范围完整重新执行工程检查、全部现行产品测试、主规格校验和交付读回。完整结果来自本次单次 pnpm test，没有拼接旧 PASS。

## 本次验证

| 检查 | 实际结果 | 材料 |
|---|---|---|
| pnpm check | exit 0；60 个文件格式与 lint 通过，src / scripts / tests 真正类型检查通过，无修改 | [日志](artifacts/check.log) |
| pnpm test（含 build） | exit 0；27 个测试文件，117/117 通过，失败 / 取消 / 跳过 / todo 均 0；测试耗时 192.396 秒 | [完整日志](artifacts/test.log) |
| 固定 OpenSpec 1.14.1 validate --specs --strict --json | exit 0；三份主规格全部 valid，issues 均为空 | [结果](artifacts/specs-validation.json) |
| 初始目标 .tmp 不存在 | minimal-project 与 existing-openspec-project 两个全新目标，真实 new change / Open / bind / status / next 跨进程成功；目标 .tmp 结束时仍不存在 | [结果](artifacts/fresh-project-smoke.json) |
| 当前 Delivery 归档交接 | 四个 binding 均 archived，001–004 与项目累计数 4 一致；实际归档目录存在、活动目录不存在；20 / 14 / 16 / 24 项任务完成；直接独立 Review 均 approved、Author 均完成 | [读回](artifacts/delivery-readback.json) |
| 当前查询 | 新进程 status / next 成功；upstream:null，activeChangeId:null，Delivery open；固定 OpenSpec list 的 changes 为空 | [读回](artifacts/delivery-readback.json) |

完整范围和各 Change 的测试映射见 [plan](artifacts/plan.json)，版本入口见 [tools](artifacts/tools.json)，汇总见 [summary](artifacts/summary.json)。测试中的原始命令 / Archive 有限现场输出保存于 artifacts/product-test-evidence；全新目标与本项目查询另有独立命令输出。所有材料属于本 Run，不为各检查另建 Run。

## 范围与限制

- 本次为 Owner 授权的 D01 人工 Full Test，产品 Full Test / Close / Reopen 命令仍是 D02 计划，不因此宣称其产品能力已实现。测试结论由当前 Author 记录，不新增或代签 Reviewer verdict；既有可靠语义审核和真实归档记录继续适用。
- 产品测试覆盖必要输入缺失、历史说明失效、未知 Ref、越界、角色与跨进程交接，以及 Apply 修订 / 回退、原生归档、有限 finish、竞争和累计查询。测试中的批准是明确夹具，不能认证真人身份；未知写者、缺退出见证和任意掉电恢复仍不在保证范围。
- 两个新目标不依赖旧临时状态；宿主 .tmp 仅创建本次独立沙箱，不读取旧沙箱内容。本轮没有执行全局 .tmp 清理，也没有重跑限定用途的旧 Explore proof。
- 先前默认 Git 状态受 Windows 长路径限制漏报 038 修改前保存的两份 036 / 037 Run 历史副本；与正式原文的字节比较一致，无实现漂移。两份副本仍未纳入 checkpoint，路径见 plan / summary；本轮不执行 Git 修复或提交，也不声称工作区干净。

## 交接

manifest 的最近 Run 指向本 041，记录本次人工 Full Test passed；[最终读回](artifacts/final-readback.json) 确认查询成功且 next 为等待 Owner Close。两处临时读回辅助断言错误已纠正并记入该材料（误认公开字段、预期路径拼接错误）；CLI 查询本身成功，没有实现修订或完整测试重跑。Delivery 仍 open，四个 Change 保持 archived，当前没有活动 Change；下一步为 delivery-close / awaiting-owner-instruction，由 Owner 另行授权。未执行 Close、Reopen、Git、下一 Change 激活或实际归档。
