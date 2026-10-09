---
formatVersion: 1
recordingMode: product
deliveryId: d01
changeId: proof-entry
actionType: revise-propose
role: author
actorId: fixture-author-three
status: submitted
stageSkill: propose
toolGuidance:
  - openspec
revisesRunRef: .mendi/runs/d01/001-changes/proof-entry/007-propose/run.md
ownerDecision:
  resolution: revise
  role: owner
  actorId: fixture-owner
  reason: 同阶段补路径场景
  sourceRunRef: .mendi/runs/d01/001-changes/proof-entry/008-review-propose/run.md
  targetRole: author
  targetActorId: fixture-author-three
  phase: propose
runNumber: 9
actionId: proof-entry-009-revise-propose
outcome: complete
result: 受控语义材料见正文
---
夹具修订：增加路径越界拒绝设计与测试；约束保持不自动安装，待新的独立审核。