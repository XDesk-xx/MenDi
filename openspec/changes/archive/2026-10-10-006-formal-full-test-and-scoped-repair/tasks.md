# Tasks

## 1. Delivery 记录、范围与必要输入

- [x] 1.1 实现 collection / basis、范围 / 已核对批准事实快照的结构校验；用独立 admission 场景验证空输入、漏槽位、未归档、错身份 / verdict、必要直接输入缺失、越界，以及未知 Ref 不成为前置。
- [x] 1.2 增加 delivery scope 的四种 Run 类型、头部 / 方法 / actionId 校验和两个用途明确的 manifest 指针；记录测试验证旧无 scope Change / manual-bootstrap 仍可解释，错误 scope / 指针矛盾拒绝。
- [x] 1.3 实现同级 Delivery Run 的安全读写，复用连续编号、独占占号和 draft 替换；验证跨 Changes 连续、空占号不复用、重复号 / 写入冲突、父 Run / manifest 部分写入保留现场。
- [x] 1.4 为实际新的阶段身份整理方法读取，并提供正式 Full Test 方法的声明 / 覆盖 / 材料限制说明；方法测试验证真实内容、缺失 / 错身份拒绝，查询不因不读取的方法缺失而失败。

## 2. 复用底层执行与正式 Full Test

- [x] 2.1 从 tests.ts 整理具备实际职责的持锁内部执行服务，普通 runTest 保留原合同；运行现有 test-entries、test-dependencies、test-execution、test-log-integrity 回归，验证普通 full 仍为 command / formalDeliveryTest=false、预检不自动安装，并覆盖共享取消无法确认 close 的有界 unknown。
- [x] 2.2 实现正式 run 的锁内 admission、范围 / 声明快照、父子意图、实际 full 执行与两层完整读回；分组测试验证一个操作只持一把锁、启动前父子身份已保存、从另一 cwd 真实启动、普通旧 PASS 不能被认领。
- [x] 2.3 实现正式 passed / failed / not-run / interrupted / unknown 的真实映射；测试覆盖依赖 / 工具拒绝、选定启动失败、实际非零、启动即取消与确认中断；停止命令成功但 close 未到须有界 unknown，保留现场，验证 not-run 子执行可空及原始输出保存，不从日志文字推导结果。
- [x] 2.4 添加正式操作的写入 / 并发故障场景，验证声明 / 必要输入 / full 入口变化、第二写者、日志 / 父 Run / 指针 / 读回 / 锁释放失败均不发布已确认通过；保留现场，不自动重跑、finish 或清锁。
- [x] 2.5 就近补正式结果格式和执行方法说明，明确命令事实、材料声明与实际适用性判断；核对文档字段与真实保存 / 读回结果一致，不新增 hash 清单或源码自动认证承诺。

## 3. 范围内修复与独立定向审核

- [x] 3.1 实现 current failed 的 repair start，固定直接失败 / scope / collection / reason；独立测试验证无活动 Change 可记录、普通 / 旧失败 / unknown 拒绝、原归档关联 / 完成数 / 失败结果保持。
- [x] 3.2 接通 Delivery 修复 / Review 的本地 save、正式 submit 和同 Action continue；验证 draft / submitted / current / role / actor / 正文规则、相同 actionId 继续、已提交不可覆盖，以及 Full Test 普通 submit / continue 拒绝。
- [x] 3.3 实现固定新 Author 的 Review start / continue / submit 与三类 verdict；验证不同 actor、完整 Author / 直接失败校验、审核继续固定对象、旧 Author / 自签 / 缺输入拒绝，不通过夹具 verdict 认证真实独立身份。
- [x] 3.4 实现 changes-requested 与当前 Author 主动范围内修订，保存直接 revisesRunRef 并另建修订记录；测试验证旧 verdict / Run 不变、旧 approved 失效、新 Author 须再审，rejected / 范围扩大停 Owner。
- [x] 3.5 接通 approved 修复后的新正式完整执行，首次和后续重跑都核对当前必要 Review 正文，沿用仍适用的批准事实快照并核对原完整 collection；验证空正文 / 缩减集合 / 旧批准拒绝、经审核的范围内配置修复、新失败只消费本次当前对象而非更旧父链；query / draft save 不倒查正文。
- [x] 3.6 编写 Author 修复 / Reviewer 定向审核方法，记录实际材料、差异、验证及范围判断；方法 / 场景测试核对不同方法、无旧 Change 上游调用和未完成输入边界，说明真实审核与自动化声明夹具的区别。

## 4. 当前查询、适用性与诊断

- [x] 4.1 接通显式当前 Delivery 进展选择及 workspace 读回，保留无 Delivery 操作的旧 binding 规则；验证新进程选择 Full Test / 修复 / Review、旧 Archive 正文失效不影响当前 Delivery 查询，活动项与 Delivery 指针矛盾拒绝。
- [x] 4.2 实现当前及显式指定正式 Run 的只读查询与最小 next；验证旧 failed 稳定可读、新 passed 为当前、修复 Author complete / Review continuing / 三类 verdict 交接，不把查询 ok 当 passed；竞争锁 / 日志变化下 next 使用本次 unknown 观察停 Owner，原持久记录不改。
- [x] 4.3 验证当前正式 Run / 直接结果 / 必要日志缺失、坏身份和越界拒绝；删除无关旧失败、说明或未知 Ref 后查询仍成功，当前 Reviewer Author 缺失只阻止对应正式审核操作而非查询 / draft save。
- [x] 4.4 实现 scope / command 的已知匹配信息和 materialApplicability 声明边界；测试验证配置变化 / 无法读取的匹配提示、说明整理不自动失效，以及不输出未经验证的 applicable:true 或全库 hash gate。
- [x] 4.5 扩展只读 diagnose 解释当前 Delivery 头部、锁和明确同 Delivery 占号；验证前后观察改变 / 当前记录损坏如实报告，不靠 pid 消失认证终态、不解除锁或自动关联。
- [x] 4.6 为 bind 添加未解决验收 / 修复交接冲突检查，合法后续工作退出当前 Delivery 选择并保留历史结果；测试覆盖 failed、draft / continuing、未批准 / rejected、unknown 和既有顺序关联 / Archive 行为。
- [x] 4.7 补当前结果 / 指针及未来 Close 直接消费边界说明；核对只涉及本轮 scope、必要审核、正式结果和实际候选影响，不实现 C 或递归历史链。

## 5. CLI 接线与用户说明

- [x] 5.1 在新增命令前把 dispatch.ts 深层三元分支整理为直观分派；现有 CLI / 参数回归验证操作、退出码和 JSON stdout 保持，不新增通用注册框架或纯转发层。
- [x] 5.2 接入 full-test run / status、repair start / review 的精确参数和 scope 路由；CLI 测试验证四个入口、缺参 / 错角色 / 陈旧引用 / 不支持类型的明确失败及正确 cwd。
- [x] 5.3 更新人读 / JSON 输出与 help，区分普通命令、正式 outcome、材料声明和 Reviewer verdict；新进程测试验证已知 failed status 读取成功、unknown 非零、Author 不代签批准、结果不自动 Close。
- [x] 5.4 更新 README 的声明示例、修复 / 定向 Review / 新完整运行命令与依赖准备说明；在受控项目执行示例核对实际输出，明确 Owner 授权、manual-bootstrap 只读和根正式 Full Test 的单独边界。

## 6. 跨 Change 集成与工程收敛

- [x] 6.1 用受控源码与真实产品接口完成两项原生归档 → 正式接线失败 → Author 范围内修复 / focused → 不同 actor 的定向 Review 记录 → 新完整 Full Test → 新进程查询；验证真实断言 / 退出、两组各次完整运行、旧失败及归档绑定字节不变，审核声明夹具明确限定用途。
- [x] 6.2 从新隔离目录重建场景，沿用固定工具和正常依赖准备，验证不读取旧 .tmp 作为唯一输入 / 证据；保存本次实际命令、结果、必要日志与限制，不复制历史树、不扩展旧 C / D proof。
- [x] 6.3 按正常工程依赖准备处理现有 workspace / node_modules 不同步警告，再执行 pnpm check、pnpm build 和适当完整 pnpm test 回归；验证三配置真实类型检查及共享记录 / 查询 / 归档 / 执行行为，工程测试不冒充根正式 Delivery Full Test，不自动安装可选工具。
- [x] 6.4 执行固定 OpenSpec strict validate 与实际 apply instructions，核对规格 / 任务及完成状态；保存本次 Author 摘要、相关结果与 src / tests / scripts 各前三物理行数、可靠增长依据和职责结论，不设硬门槛或独立台账。

## Workflow follow-up

- Apply 完成后停在独立 Review Apply；真实阶段审核、其后 Archive、change checkpoint 由对应指令推进，不把测试夹具 verdict 或全勾任务视为批准。
- B 的实际归档、C 激活、根正式 Full Test、Close / Reopen、Git checkpoint / push / PR / merge 各保持自己的授权边界，不纳入本次实施 checkbox。
