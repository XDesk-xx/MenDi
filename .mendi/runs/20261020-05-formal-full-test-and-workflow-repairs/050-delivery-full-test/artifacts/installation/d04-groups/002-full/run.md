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
  version: 2
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
    id: c2
    basis:
      materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
      changes: 只修复middle真实断言，prefix / tail材料与依赖未变
  purpose: initial
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
      utc: 2026-10-21T10:12:53.843Z
      startMs: 0
      durationMs: 3283.7702
      phase: 保存前包络
    - id: mendi-1
      clock: mendi
      utc: 2026-10-21T10:12:53.843Z
      startMs: 0
      durationMs: 130.3268
      phase: 准入 / 直接事实与方法
      parent: mendi
    - id: mendi-2
      clock: mendi
      utc: 2026-10-21T10:12:53.843Z
      startMs: 130.3268
      durationMs: 87.99360000000001
      phase: 锁内复核
      parent: mendi
    - id: mendi-3
      clock: mendi
      utc: 2026-10-21T10:12:53.843Z
      startMs: 218.3204
      durationMs: 812.0278000000001
      phase: 真实工具 / 依赖准备前
      parent: mendi
    - id: mendi-4
      clock: mendi
      utc: 2026-10-21T10:12:53.843Z
      startMs: 1030.3482
      durationMs: 2231.8142
      phase: 真实 pnpm / 目标准备执行等待清理与子日志保存
      parent: mendi
    - id: mendi-5
      clock: mendi
      utc: 2026-10-21T10:12:53.843Z
      startMs: 3262.1623999999997
      durationMs: 21.57439999999997
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
    projectRoot: D:\Projects\MenDi\.tmp\mendi-apply-GQQf4R\project
    deliveryId: d01
    roundId: r001
    runRef: .mendi/runs/d01/018-delivery-test-attempt/run.md
    executionId: 002-full
    candidate:
      id: c2
      basis:
        materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
        changes: 只修复middle真实断言，prefix / tail材料与依赖未变
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
        utc: 2026-10-21T10:12:56.600Z
        startMs: 0
        durationMs: 459.6514
        phase: 目标执行 / 清理
  formalOutcome: passed
runNumber: 18
actionId: d01-018-delivery-test-attempt
outcome: complete
result: passed
---
