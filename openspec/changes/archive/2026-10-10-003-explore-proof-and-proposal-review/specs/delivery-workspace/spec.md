## MODIFIED Requirements

### Requirement: Operation-specific input checks

系统 SHALL 按当前操作要求实际必要输入。status / next MUST 读取入口、manifest、当前活动 Change 的路径 / 上游 status，以及指定的当前 product Run。Action 开始 / 继续 / Owner 处置和正式 submit SHALL 保留上游与相应方法 / 固定 Author 校验；draft save 仅依赖本地配置、活动路径、当前 draft、身份、正文和安全写入。只读诊断 SHALL 不启动上游、不扩大为历史读取；人工历史与未知 Ref 不自动成为依赖。

#### Scenario: Historical links and unknown extensions are unavailable
- **WHEN** 人工记录的历史 Run、旧方案、说明链接或未知 Ref 扩展缺失、非路径或指向不可用位置，但必要输入有效
- **THEN** 查询保留这些说明字段并成功返回，不读取说明目标、不补证、不重写记录

#### Scenario: Required current input is unavailable
- **WHEN** project.json、当前 manifest、当前活动 Change 或实际需要的当前 product Run 缺失或损坏
- **THEN** 查询返回失败并指出实际输入问题，不因历史说明被放宽而静默忽略必要输入

#### Scenario: A review-only input is missing
- **WHEN** 当前 Reviewer Run 有效，但固定 authorRunRef 指向缺失文件或阶段 Skill 已不可用
- **THEN** 普通 status / next 展示当前记录而不读取这些目标；开始 / 继续需要的方法缺失、Review continue / submit 需要的 Author 缺失分别只阻止对应操作，本地保存不读取其正文

#### Scenario: Managed input escapes the project
- **WHEN** 操作实际读取的 latestRunRef、authorRunRef 或写入位置越界、经 junction 指向外部或与身份不一致
- **THEN** 该操作拒绝使用此输入并指出问题，不因为说明 Ref 放宽而放宽实际读写安全

#### Scenario: The upstream process is unavailable for local work
- **WHEN** 上游不可用，但只读诊断或保存 draft 的本地必要输入有效
- **THEN** 本地操作不调用上游且明确未验证上游；status / next、正式 submit 和需要上游的 Action 操作仍按实际工具错误拒绝

## ADDED Requirements

### Requirement: Read-only interrupted workspace diagnosis

系统 SHALL 提供不依赖上游的显式本地诊断，在锁存在时只读检查入口、manifest、当前直接 product Run、锁元数据和调用者明确指定的同 Delivery / 当前 Change 残留 Run。诊断 MUST 保留受管路径 / 身份检查，不改文件或扫描历史正文。锁缺失 / 损坏、文件缺失、写者存活或观察中变化 SHALL 如实报告，不能从诊断成功推断操作已提交或可解除锁。

#### Scenario: A writer is still running
- **WHEN** 诊断观察到锁的 pid 对应进程仍存在或存活状态无法确认
- **THEN** 报告存活 / unknown 与锁 token、operation 和当前观察，普通操作仍被锁阻断；不把存活当作真实身份认证，不删除锁、不停止进程

#### Scenario: The pointer did not commit
- **WHEN** manifest 仍指向旧 Run 或无当前 Run，显式指定的新 Run 已落盘但未被关联
- **THEN** 区分当前记录与未关联占号，展示各自实际头部 / 路径及必要错误，不将残留判为成功、自动关联或删除

#### Scenario: Submission committed before the reported failure
- **WHEN** 当前指针可读且当前 Run 实际为 submitted，锁仍存在
- **THEN** 报告观察到的 submitted / outcome 和锁现场，不因原命令非零而称其 draft，不自动重提或回滚，普通 query 保持锁错误

#### Scenario: The scene changes or required local input is damaged
- **WHEN** 前后读回的锁 / 当前 manifest / Run 不同，或必要记录损坏、身份矛盾、实际输入越界
- **THEN** 报告 changed-during-read 或当前输入错误，不能判断的字段标明 unknown / unavailable，退出失败并保留全部现场；不拼接稳定状态或使用无关历史推断

#### Scenario: The diagnostic runs on manual bootstrap records
- **WHEN** 目标为合法 manual-bootstrap 入口和 manifest
- **THEN** 只报告人工格式与锁观察，不把人工 Run 当 product submitted 验证；显式指定残留 product Run 的诊断请求拒绝，不迁移或改写人工历史

#### Scenario: Explicit reservation is also the current run
- **WHEN** 显式 reservation 与 current 指向同一文件，且两次读取之间内容改变
- **THEN** 保留首次快照并报告 changed-during-read，不因后一次读取覆盖首次观察而漏报，不生成稳定成功

### Requirement: Explicit manual lock disposition boundary

本轮系统 SHALL 仅提供只读锁诊断，不提供解除锁或自动恢复命令。方法 MUST 要求人工处置另有 Owner 明确授权、停止该目标所有写者并确认无占用、核对同一 token 与当前实际文件；无法确认或观察改变 SHALL 保留锁并停止处置。人工解除 SHALL 仅针对确认的残留锁，不改 Run / 指针 / 临时文件、不重提或关联占号，处置结果留在当前工作进展或授权记录。

#### Scenario: A stopped writer left an interpretable scene
- **WHEN** Owner 已单独明确授权人工处置，写者与任务占用均已核对停止，目标绝对路径和同一锁 token / 实际文件再次确认一致
- **THEN** 人工仅解除确认的残留锁并读回；已提交 Run 与未关联占号保留，随后重新查询并按当前真实状态决定显式后续工作，不把诊断输出当解除授权

#### Scenario: Writer ownership or state is uncertain
- **WHEN** 缺 Owner 授权、原写者可能仍活跃、pid 被复用 / 存活未知、存在其他写者，或 token / 文件变化
- **THEN** 不执行人工解除、抢锁、重提或回滚，报告需 Owner 核对的具体原因，保留现场
