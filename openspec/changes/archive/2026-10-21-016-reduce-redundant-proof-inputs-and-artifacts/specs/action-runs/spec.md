# Spec Delta

## MODIFIED Requirements

### Requirement: Review apply maintainability observations

Review Apply 方法 SHALL 报告 src / tests / scripts 中维护代码物理行数最多的前三名、不足三个全部列出，并说明当前明显增长 / 职责混杂及维护结论。无可靠历史基准 MUST 不补造增长。观察 SHALL 只进入当次审核摘要，不建立硬行数门槛、独立台账、hash 清单或产品查询依赖；本轮继续扩展的混杂职责须先整理再扩展。

#### Scenario: A mixed responsibility file will grow in the current change
- **WHEN** 当前修改继续增加一个已经混合操作、指引和处置职责的文件
- **THEN** Author 按受审任务先整理实际职责，Reviewer 核对整理 / 覆盖和增长，不能只留给下次处理或为压行数增加转发层

#### Scenario: A bounded historical experiment is retained
- **WHEN** 已受审旧 proof 不再扩展，新产品验收进入独立测试，当前仍有较长完整流程
- **THEN** 保留旧材料与结果，并说明适用范围及下次整理触发条件，不仅因行数要求重写历史或重跑全部旧实验

#### Scenario: Current review cites one canonical proof source
- **WHEN** 独立 Reviewer 核对某实际受控 Proof，其原日志或唯一必要输入已保存在可定位的当前 Run，且同一结果被多份摘要使用
- **THEN** 审核摘要保留真实来源与可验证结果而不强制为同一事实再复制整套成功日志或 fixture；仍必须说明代码增长和本次失败事实

## ADDED Requirements

### Requirement: Single-source stage evidence in future runs
新 Explore、Apply、Review 阶段 SHALL 以当前 Run 的必要结果和明确原件来源为准，避免在同一阶段重复嵌入同一 stdout、报告、请求和派生输出。相同原件的第二次使用 SHALL 使用可定位的受管引用；不存在、越界或预计被清理的来源不得充当唯一证据。

#### Scenario: Two summaries reuse one original test result
- **WHEN** 当前阶段多份摘要引用同一次已保存真实执行的 stdout 或最终报告，且原件可从本次受管 Run 或明确持久受控来源直接读取
- **THEN** 保存必要唯一原件一份，其余使用有效的明确来源引用，不再保存第二份重复原始字节；不据摘要的 success 字样改变真实结果

#### Scenario: Only source is disposable temporary target
- **WHEN** 原始证据只在此次可能被删除的 .tmp/runtime 夹具、外部不可控目录或暂不可定位的来源
- **THEN** 不能只留下看似可用的链接后宣称证据保存完毕；在结束前保存必要唯一原件于本次受管证据目录，或报告不完整并保留现场，不凭旧摘要制造 PASS

#### Scenario: Real failure and unknown observations require source
- **WHEN** 本次执行、清理或审核发现 failed、blocked、not-run、interrupted 或 unknown，包含部分日志、未确认的报告或锁
- **THEN** 保留可直接核对的失败/未完成理由、实际必要日志与受管现场；不得用重复消除省略唯一原件、将 unknown 解释为空输出或以历史通过覆盖当前失败

### Requirement: Reconstructible proof inputs and bounded references
新阶段 Proof 输入 SHALL 优先使用当前项目中受控且可重建的脚本、测试夹具与明确参数。只在需要保存不可重建的唯一输入时将副本置于当前 Run 的受管证据；引用 SHALL 记录可判断的来源及用于复现的必要调用，不要求扫描全部历史 Run 或保存无关的临时工程树。

#### Scenario: Repeatable proof uses controlled fixture
- **WHEN** 本次调查输入可由已有维护脚本、fixture 与明确的选定命令重新建立
- **THEN** Run 保存真实方法、源位置、命令/参数与实测结果，额外临时工程不作为唯一长期输入，也不复制其全部派生目录

#### Scenario: Unique input cannot be reconstructed
- **WHEN** 源头不可稳定取得且该输入实际参与独立 Reviewer 结论
- **THEN** 在当前受管 Run 内保留必要原件与来源，不能只保存一个指向已清理路径的 Ref；实际无权取得原件时报告限制，不伪造取证完成

### Requirement: Submitted evidence remains immutable across optimization
历史 submitted Run 的原始正文、verdict、执行日志、失败与 unknown 现场及归档原件 SHALL 保持只读。新证据轻量化只能作用于尚未产生的受控采集路径，不能遍历清理旧 Run、替换既有审核证明或以文件数量自动决定删除。

#### Scenario: Old approved run contains duplicate proof copies
- **WHEN** 历史 D01–D05-B 已经提交且其 artifacts 中存在相同 stdout、空文件或可由旧脚本重建的目录
- **THEN** 旧原始材料与来源仍可读取，不修改其原文、verdict 和身份、不自动迁移/删除、不分配补证 Run

#### Scenario: Compact future collection faces unknown write
- **WHEN** 新阶段采集原件或其受管引用的写入中断、锁状态未知或最终读回不一致
- **THEN** 保留实际必要现场并报告不完整，不以文件数量减少视为提交成功，不清理属于其他写者的锁或临时文件

