---
formatVersion: 1
recordingMode: product
scope: delivery
deliveryId: d01
changeId: null
actionType: delivery-test-attempt
role: author
actorId: delivery-author
status: submitted
stageSkill: delivery-full-test
toolGuidance: []
attempt:
  version: 1
  roundId: r001
  scope:
    goal: 验证目标项目的最小 Delivery Open 与首个 Change 关联
    plannedChanges:
      - slot: A
        title: 项目入口
        dependsOn: []
      - slot: B
        title: 后续工作
        dependsOn:
          - A
    completed:
      - slot: A
        changeId: proof-entry
        archiveOrdinal: 1
      - slot: B
        changeId: second-entry
        archiveOrdinal: 2
  approvals:
    - changeId: proof-entry
      archiveRunRef: .mendi/runs/d01/001-changes/proof-entry/007-archive/run.md
      reviewRunRef: .mendi/runs/d01/001-changes/proof-entry/006-review-apply/run.md
      authorRunRef: .mendi/runs/d01/001-changes/proof-entry/005-apply/run.md
      authorActor: author-one
      reviewerActor: reviewer-one
    - changeId: second-entry
      archiveRunRef: .mendi/runs/d01/001-changes/second-entry/014-archive/run.md
      reviewRunRef: .mendi/runs/d01/001-changes/second-entry/013-review-apply/run.md
      authorRunRef: .mendi/runs/d01/001-changes/second-entry/012-apply/run.md
      authorActor: author-one
      reviewerActor: reviewer-one
  baselineFacts: []
  entry:
    scriptName: test:full
    scriptText: node group-runner.ts
    packageManager: pnpm@11.22.0
    pnpmBin: C:\Users\xuser\AppData\Local\nvm\v22.23.2\node_modules\corepack\dist\pnpm.js
  plan:
    protocol: mendi-group-tests/1
    groups:
      - id: prefix
        title: prefix
        kind: tests
        required: true
        dependsOn: []
        resources: []
        selection:
          - prefix.test.ts
        completion: 业务断言、Node容器及根汇总均完成
        preparation: 隔离本次目标，无共享服务
        exclusions: []
      - id: middle
        title: middle
        kind: tests
        required: true
        dependsOn: []
        resources: []
        selection:
          - middle.test.ts
        completion: 业务断言、Node容器及根汇总均完成
        preparation: 隔离本次目标，无共享服务
        exclusions: []
      - id: tail
        title: tail
        kind: tests
        required: true
        dependsOn: []
        resources: []
        selection:
          - tail.test.ts
        completion: 业务断言、Node容器及根汇总均完成
        preparation: 隔离本次目标，无共享服务
        exclusions: []
  candidate: &a1
    id: common-2
    basis:
      materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
      changes: 全部测试接到新的共同契约输入 common.ts
  purpose: retest
  selection:
    - prefix
    - middle
    - tail
  progress:
    - id: prefix
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/018-delivery-test-attempt/run.md
      candidate: *a1
    - id: middle
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/018-delivery-test-attempt/run.md
      candidate: *a1
    - id: tail
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/018-delivery-test-attempt/run.md
      candidate: *a1
  phase: finished
  executionId: 002-full
  timing:
    - id: mendi
      clock: mendi
      utc: 2026-10-17T07:31:23.580Z
      startMs: 0
      durationMs: 5631.739699999998
      phase: 保存前包络
    - id: mendi-1
      clock: mendi
      utc: 2026-10-17T07:31:23.580Z
      startMs: 0
      durationMs: 377.99269999999524
      phase: 准入 / 直接事实与方法
      parent: mendi
    - id: mendi-2
      clock: mendi
      utc: 2026-10-17T07:31:23.580Z
      startMs: 377.99269999999524
      durationMs: 373.07940000000235
      phase: 锁内复核
      parent: mendi
    - id: mendi-3
      clock: mendi
      utc: 2026-10-17T07:31:23.580Z
      startMs: 751.0720999999976
      durationMs: 1331.6319000000003
      phase: 真实工具 / 依赖准备前
      parent: mendi
    - id: mendi-4
      clock: mendi
      utc: 2026-10-17T07:31:23.580Z
      startMs: 2082.703999999998
      durationMs: 3475.515900000006
      phase: 真实 pnpm / 目标准备执行等待清理与子日志保存
      parent: mendi
    - id: mendi-5
      clock: mendi
      utc: 2026-10-17T07:31:23.580Z
      startMs: 5558.219900000004
      durationMs: 73.4890999999916
      phase: 最终报告 / 协议解释
      parent: mendi
  fromRunRef: .mendi/runs/d01/017-review-delivery-repair/run.md
  repairApproval:
    reviewRunRef: .mendi/runs/d01/017-review-delivery-repair/run.md
    authorRunRef: .mendi/runs/d01/016-delivery-repair/run.md
    authorActor: delivery-author
    reviewerActor: independent-fixture-reviewer
  request:
    protocol: mendi-group-tests/1
    projectRoot: D:\Projects\MenDi\.tmp\mendi-apply-nBpx4O\project
    deliveryId: d01
    roundId: r001
    runRef: .mendi/runs/d01/018-delivery-test-attempt/run.md
    executionId: 002-full
    candidate:
      id: common-2
      basis:
        materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
        changes: 全部测试接到新的共同契约输入 common.ts
    plan:
      protocol: mendi-group-tests/1
      groups:
        - id: prefix
          title: prefix
          kind: tests
          required: true
          dependsOn: []
          resources: []
          selection:
            - prefix.test.ts
          completion: 业务断言、Node容器及根汇总均完成
          preparation: 隔离本次目标，无共享服务
          exclusions: []
        - id: middle
          title: middle
          kind: tests
          required: true
          dependsOn: []
          resources: []
          selection:
            - middle.test.ts
          completion: 业务断言、Node容器及根汇总均完成
          preparation: 隔离本次目标，无共享服务
          exclusions: []
        - id: tail
          title: tail
          kind: tests
          required: true
          dependsOn: []
          resources: []
          selection:
            - tail.test.ts
          completion: 业务断言、Node容器及根汇总均完成
          preparation: 隔离本次目标，无共享服务
          exclusions: []
    selection:
      - prefix
      - middle
      - tail
    prerequisites: []
    reportRef: .mendi/delivery-groups/d01/tests/002-full/group-report.json
    eventsRef: .mendi/delivery-groups/d01/tests/002-full/group-events.jsonl
  observation:
    protocolState: valid
    groups:
      - id: prefix
        state: passed
        reason: ""
      - id: middle
        state: passed
        reason: ""
      - id: tail
        state: passed
        reason: ""
    reasons: []
    timing:
      - id: target
        clock: target
        utc: 2026-10-17T07:31:28.400Z
        startMs: 0
        durationMs: 661.2883
        phase: 目标执行 / 清理
runNumber: 18
actionId: d01-018-delivery-test-attempt
outcome: complete
result: passed
---
