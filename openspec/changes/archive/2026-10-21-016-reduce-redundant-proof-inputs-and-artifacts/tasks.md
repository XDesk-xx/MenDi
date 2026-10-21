# Tasks

## 1. 受控输入与单源原件的最小采集合同

- [x] 1.1 在 tests/helpers.ts、tests/test-support.ts、tests/group-support.ts 中核对实际 opt-in 场景采集路径、直接原件与可重建输入，基于 tests/fixtures 的确定性数据记录一项同源多次引用和一项临时唯一原件的对照；以可重复 TypeScript 场景测试确认观察，不创建全量历史文件计数 gate。
- [x] 1.2 建立受限于当前测试/Proof 采集会话的 TypeScript 单源证据辅助，明确来源身份、当前 Run/可重建源/临时源、真实命令、原件和引用状态；测试相同真实原件只留一个直接副本、不同执行即使输出一致也分别保留，不新增全库 hash/数据库。
- [x] 1.3 验证来源不可持久读取时只保存受管唯一原件一次或明确标记 incomplete，禁止把即将清理的 .tmp/runtime 当成唯一长期来源；测试路径越界、缺失、无写入权限、源文件读中变化/中断均 fail-closed 并保留当前实际现场。

## 2. 现有 opt-in 场景记录去重与阶段方法

- [x] 2.1 在 tests/helpers.ts 的可选命令证据采集接入单源辅助，保存真实 args/cwd/exit、stdout/stderr 的必要原始来源而非每条命令无条件再复制；完成开启/关闭证据模式与相同命令真实不同执行的测试，并确保失败可定位。
- [x] 2.2 在 tests/test-support.ts 的 execute 场景记录复用真实执行的受管 result 与双日志（包含零字节实体），避免二次完整嵌入相同 stdout/stderr；真实 passed、failed、unknown 场景及跨进程 test status 仍与直接记录一致，运行相应 tests。
- [x] 2.3 在 tests/group-support.ts 的 groupRun / recordApplyScene 的可选保存路径统一受控原件与复用引用，不降低真实 request、report、events/cleanup、stdout/stderr 以及失败/unknown 的定位能力；用隔离 groups-v1 中段失败/缺报告场景测试，同时保证未启用 opt-in 无多余写入。
- [x] 2.4 更新实际 Explore/Apply/Review 用到的 Skills 指引，准确区分稳定可复建输入、唯一必要输入、临时派生物和受管必要失败原件；README 仅记录现有证据模式入口与边界。检查文档示例命令在本仓库的现行 CLI 下可用，不自动安装工具或修改旧 Run。

## 3. 正式 TestExecution、groups-v1 与旧历史安全兼容

- [x] 3.1 保持现有 TestExecution formatVersion=1、stdoutRef/stderrRef 两个物理文件的真正生成与读取合同（包括真实 0B）；针对已完成的安静 passed 测试，验证缺失零字节 stdout 仍 unknown/ENOENT、恢复原件后 passed，且不新增推断 empty 的兼容分支。
- [x] 3.2 运行并根据实际影响补充 test-log-integrity 的短写/零进展/异常回归，以及 test-execution 的 prepared/running/finished/取消/unknown 与锁边界；明确记录必要 stdout/stderr/result 永不由去重辅助改写，写失败不被假报 complete。
- [x] 3.3 验证 groups-v1 必需组的真实 request、child result、protocol report、日志和资源清理、failed/blocked/not-run/interrupted/unknown 不因 opt-in 证据减少而缺失；对 026/027 的历史 114/107 样本只作只读事实引用，新场景真实失败不被“没有报告文件”冒充正常 PASS。
- [x] 3.4 定向只读校验旧 D01-D04 已提交 Run/日志与新代码加载兼容，D05-A/B archive/verdict/正式结果无字节改写；新 Run 的证据采集不可扫描删除其它目标、清理根历史或引用权限外文件。

## 4. 集成实证和独立交接

- [x] 4.1 以明确可复现 fixture 对比当前 opt-in 证据采集开启/关闭与新单源方式，列出实际文件、副本/来源引用和失败覆盖；减量量化仅为观察，不设文件/字节硬阈值，不将初始状态虚称为新功能完成。
- [x] 4.2 对受影响的 tests 及 pnpm check / pnpm build / OpenSpec strict 执行真实验证，保存必要原始输出一份与 Run 直接证据；失败修复后只重跑受影响集合，未知中断保留现场。
- [x] 4.3 对照 proposal.md、两份 delta specs、design.md、代码及 Skills 的最终一致性；当次 Author Apply 摘要列 src/tests/scripts 各物理行数前三名并说明增长/责任划分后，记录真实结果并移交独立 review-apply，不自签 verdict。

## Workflow follow-up

- 先由独立 Reviewer review-propose，批准后才能开始上述 Apply。
- 独立 Review Apply 通过后由 Owner 单独命令进行原生 Archive 和后续 Git checkpoint；D05 正式 Full Test、Close、版本/安装及 D05-D 激活继续分别授权。
