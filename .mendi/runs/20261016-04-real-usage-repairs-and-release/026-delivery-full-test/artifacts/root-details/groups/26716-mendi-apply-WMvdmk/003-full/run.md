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
    id: c2
    basis:
      materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
      changes: middle 断言修复；prefix / tail 的材料与配置保持
  purpose: retest
  selection:
    - middle
  progress:
    - &a3
      id: prefix
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/015-delivery-test-attempt/run.md
      candidate: &a2
        id: c2
        basis:
          materials: 隔离目标实际 Node 断言、目标 runner 与执行配置；阶段记录为受控夹具
          changes: middle 断言修复；prefix / tail 的材料与配置保持
    - id: middle
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/019-delivery-test-attempt/run.md
      candidate: *a1
    - &a4
      id: tail
      state: passed
      reason: ""
      sourceRunRef: .mendi/runs/d01/016-delivery-test-attempt/run.md
      candidate: *a2
  phase: finished
  executionId: 003-full
  timing:
    - id: mendi
      clock: mendi
      utc: 2026-10-17T10:06:42.901Z
      startMs: 0
      durationMs: 5312.321400000001
      phase: 保存前包络
    - id: mendi-1
      clock: mendi
      utc: 2026-10-17T10:06:42.901Z
      startMs: 0
      durationMs: 318.78250000000116
      phase: 准入 / 直接事实与方法
      parent: mendi
    - id: mendi-2
      clock: mendi
      utc: 2026-10-17T10:06:42.901Z
      startMs: 318.78250000000116
      durationMs: 351.60109999999986
      phase: 锁内复核
      parent: mendi
    - id: mendi-3
      clock: mendi
      utc: 2026-10-17T10:06:42.901Z
      startMs: 670.383600000001
      durationMs: 1328.7507999999943
      phase: 真实工具 / 依赖准备前
      parent: mendi
    - id: mendi-4
      clock: mendi
      utc: 2026-10-17T10:06:42.901Z
      startMs: 1999.1343999999954
      durationMs: 3224.246299999999
      phase: 真实 pnpm / 目标准备执行等待清理与子日志保存
      parent: mendi
    - id: mendi-5
      clock: mendi
      utc: 2026-10-17T10:06:42.901Z
      startMs: 5223.380699999994
      durationMs: 88.91720000001078
      phase: 最终报告 / 协议解释
      parent: mendi
  fromRunRef: .mendi/runs/d01/018-review-delivery-repair/run.md
  repairApproval:
    reviewRunRef: .mendi/runs/d01/018-review-delivery-repair/run.md
    authorRunRef: .mendi/runs/d01/017-delivery-repair/run.md
    authorActor: delivery-author
    reviewerActor: independent-fixture-reviewer
  request:
    protocol: mendi-group-tests/1
    projectRoot: D:\Projects\MenDi\.tmp\mendi-apply-WMvdmk\project
    deliveryId: d01
    roundId: r001
    runRef: .mendi/runs/d01/019-delivery-test-attempt/run.md
    executionId: 003-full
    candidate: *a2
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
      - middle
    prerequisites:
      - *a3
      - *a4
    reportRef: .mendi/delivery-groups/d01/tests/003-full/group-report.json
    eventsRef: .mendi/delivery-groups/d01/tests/003-full/group-events.jsonl
  observation:
    protocolState: valid
    groups:
      - id: middle
        state: passed
        reason: ""
    reasons: []
    timing:
      - id: target
        clock: target
        utc: 2026-10-17T10:06:47.829Z
        startMs: 0
        durationMs: 207.4502
        phase: 目标执行 / 清理
runNumber: 19
actionId: d01-019-delivery-test-attempt
outcome: complete
result: passed
---
