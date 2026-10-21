# Spec Delta

## MODIFIED Requirements

### Requirement: Minimal durable test execution identity

每次实际执行 SHALL 在 `.mendi/delivery-groups/<delivery-id>/tests/<序号>-<集合>/` 独占建立结果及 stdout / stderr 日志，执行序号独立于 Run 和 archiveOrdinal，保留旧占号与结果。结果 MUST 保存格式、项目 / Delivery / 执行身份、可空 Change 快照、actor、集合、实际命令 / cwd、执行状态、结果、退出 / 信号和日志定位；actor 不认证真人身份。

#### Scenario: Run a second test without replacing the first
- **WHEN** 前次执行完成且调用者再次显式执行同一集合
- **THEN** 新目录保存本次结果，原结果和日志保持；不新增阶段 Run、不重置或占用 Run / 归档编号

#### Scenario: No active change exists after archive
- **WHEN** open product Delivery 当前无活动 Change，且不存在归档过渡或写入冲突，显式执行测试
- **THEN** 记录该 Delivery 与空 Change 快照，不伪装活动 Change，不重开旧 Change 或改 archived binding

#### Scenario: Execution location is inconsistent or unsafe
- **WHEN** 执行引用、日志位置或写入目录越界、经链接指向外部、与当前 Delivery / 集合 / 执行身份矛盾或存在重复占号
- **THEN** 拒绝相关读写并报告实际位置，不覆盖旧结果、回退其他 Delivery 或读取说明 Ref 目标

#### Scenario: Existing test execution continues to allocate physical zero-byte logs
- **WHEN** 新普通测试准备启动时实际无任何 stdout/stderr 输出
- **THEN** 仍按现行结构创建并保存物理 stdout.log 和 stderr.log，读回不能将缺失文件默认为合法空输出

### Requirement: Agreement of receipts and raw execution

新结构化正式执行 SHALL 保留真实子命令原 outcome，并独立核对本次全部必需组的最终回执、根结束、退出事实和清理的一致性。包装器 exit0 与组失败 / 必需缺口矛盾、非零却声称无原因的全部成功等 MUST 阻止本次正式 PASS；安全已结束的 known invalid 与 unknown 执行/清理分别处理。

#### Scenario: The wrapper exits zero while events contain a failure
- **WHEN** 实际命令退出 0，但最终报告含必需失败、未执行或不一致
- **THEN** 保留命令真实退出，组协议记录 invalid / failed，正式结果不得 passed；不根据 stdout 重写旧 command

#### Scenario: A final receipt is missing or stale
- **WHEN** 仅有增量事件，或最终回执缺失、组重复、身份/候选/范围错配
- **THEN** 不确认正式完整通过，不从最后事件、旧报告或另一个执行结果推断成功

#### Scenario: Run summary references formal group evidence without replacing it
- **WHEN** 新阶段额外的 proof/Review 摘要想复用同一次正式 groups-v1 request、report 和子日志
- **THEN** 只能引用已保存的原始来源，不减少本次正式组所需的实际回执、失败记录或清理核验，旧 PASS 不被重复摘要授权用于新 Close

## ADDED Requirements

### Requirement: Existing empty logs are retained as real files
本 Change SHALL 继续要求每次新普通 TestExecution 预留并保存真实 stdout.log 和 stderr.log 文件，即使本次实际内容为零字节；旧 formatVersion=1 执行的日志路径、结果、读回及写失败处理保持有效。空文件与缺失文件必须保持区别，本 Change 不引入新的虚拟 empty 或推断通过的状态。

#### Scenario: Successful run has a zero-byte stdout file
- **WHEN** 实际子命令结束、stdout 确实没有产生任何字节而 stderr 存在，且记录/双日志安全写入读回
- **THEN** 物理 stdout.log 为零字节仍真实存在，status 可以在其它必要条件满足时显示原 passed；单纯缺失该文件不得被解释为合法空输出

#### Scenario: Empty required log is unexpectedly missing
- **WHEN** 一个旧或新执行结果的 stdoutRef/stderrRef 指向实际缺失、越界、读取失败的文件，即使其上一终态保存为 passed
- **THEN** 必要直接读回失败或显示 unknown/不稳定，不能因为该日志预计为空而恢复 passed，也不补建或删除其它受管日志

#### Scenario: Log output is partial or lifecycle is uncertain
- **WHEN** 本次执行 running、停止/资源清理未确认，或日志只有部分字节/发生写入失败
- **THEN** 保留实际已写输出、未完成状态、相关锁和现场，不能将尚无更多字节的情况认作真实终态 empty；继续遵守既有失败/unknown 合同

### Requirement: Formal group evidence is exempt from deduplication loss
新 groups-v1 的每次正式完整执行 SHALL 保留直接核对必要组计划/请求、子结果与日志、最终报告/事件中确有语义的事实、资源清理和失败/unknown 的证据。阶段 proof 的重复摘要不得代替这些受管源，也不得按历史缺失的 sibling 文件推出未来可合法省略报告。

#### Scenario: Historical request is missing its final report
- **WHEN** 历史已提交某组 request 存在但它对应 not-run、interrupted 或 unknown 而没有 group-report
- **THEN** 仍按实际执行和清理记录解释缺失，不能把它作为后续新正式执行可省略最终报告的许可证或拼接 PASS

#### Scenario: Formal report and stdout are cited by review
- **WHEN** 正式 groups-v1 结果有必要的 request、report、真实子日志、失败或 cleanup 证据，Review 或 Explore 需要复用它们
- **THEN** 审核可链接同一实际受管原件，但原件与必要直接校验继续存在，不能靠在摘要中复写通过文字取代正式报告

#### Scenario: Failed and unknown evidence is not coalesced into success
- **WHEN** 某项真实 failed、blocked、not-run、interrupted、unknown 或清理未确认
- **THEN** 保留原 outcome 与可定位错误及必要文件，轻量化只影响额外重复副本，仍按本次完整必需组核正式结论，不允许利用旧通过填补缺口

