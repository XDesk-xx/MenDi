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
    id: c1
    basis:
      materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
      changes: ""
  purpose: initial
  selection:
    - prefix
    - middle
    - tail
  progress:
    - id: prefix
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/016-delivery-test-attempt/run.md
      candidate: *a1
    - id: middle
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/016-delivery-test-attempt/run.md
      candidate: *a1
    - id: tail
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/016-delivery-test-attempt/run.md
      candidate: *a1
  phase: finished
  executionId: 002-full
  timing:
    - id: mendi
      clock: mendi
      utc: 2026-10-17T06:39:21.259Z
      startMs: 0
      durationMs: 4959.451500000003
      phase: 保存前包络
    - id: mendi-1
      clock: mendi
      utc: 2026-10-17T06:39:21.259Z
      startMs: 0
      durationMs: 133.54850000000442
      phase: 准入 / 直接事实与方法
      parent: mendi
    - id: mendi-2
      clock: mendi
      utc: 2026-10-17T06:39:21.259Z
      startMs: 133.54850000000442
      durationMs: 132.2592999999979
      phase: 锁内复核
      parent: mendi
    - id: mendi-3
      clock: mendi
      utc: 2026-10-17T06:39:21.259Z
      startMs: 265.8078000000023
      durationMs: 1418.3021000000008
      phase: 真实工具 / 依赖准备前
      parent: mendi
    - id: mendi-4
      clock: mendi
      utc: 2026-10-17T06:39:21.259Z
      startMs: 1684.109900000003
      durationMs: 3211.875699999997
      phase: 真实 pnpm / 目标准备执行等待清理与子日志保存
      parent: mendi
    - id: mendi-5
      clock: mendi
      utc: 2026-10-17T06:39:21.259Z
      startMs: 4895.9856
      durationMs: 63.44640000000072
      phase: 最终报告 / 协议解释
      parent: mendi
  fromRunRef: .mendi/runs/d01/015-delivery-test-attempt/run.md
  request:
    protocol: mendi-group-tests/1
    projectRoot: D:\Projects\MenDi\.tmp\mendi-apply-cyw8wJ\project
    deliveryId: d01
    roundId: r001
    runRef: .mendi/runs/d01/016-delivery-test-attempt/run.md
    executionId: 002-full
    candidate:
      id: c1
      basis:
        materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
        changes: ""
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
        utc: 2026-10-17T06:39:25.449Z
        startMs: 0
        durationMs: 631.3851
        phase: 目标执行 / 清理
runNumber: 16
actionId: d01-016-delivery-test-attempt
outcome: complete
result: passed
---
