---
formatVersion: 1
recordingMode: product
deliveryId: d01
changeId: proof-entry
actionType: explore
role: author
actorId: fixture-author-one
status: draft
stageSkill: explore
toolGuidance:
  - openspec
runNumber: 1
actionId: proof-entry-001-explore
---
目的：验证阶段输入只读及缺工具可保存。方法：真实 CLI 错 artifact / 陈旧 Action 拒绝、读前后字节比较。结果：均拒绝且不写入。约束“不自动安装”使工具不可用定义为正式操作失败，不新增自动安装任务。限制：未证明全部产品验收；actor / verdict 均为夹具。