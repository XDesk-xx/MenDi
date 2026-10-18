# D04 正式验收集合与 0.2.0 候选方案

日期：2026-10-17。角色：Author。状态：Owner已授权的0.2.0候选准备已完成，见024；等待独立定向审核。未执行D04正式Full Test / Close或稳定切换。

## 已确认决定与当前基准

- Owner 已确认新候选版本为 **0.2.0**；024获Owner进一步授权后源码和独立候选为0.2.0；稳定安装仍0.1.0，尚未获准发布或切换。
- Owner 已确认 D04 自身沿用 **manual-bootstrap 人工整次正式验收**：独立组尽量继续收集，整体有缺口即不通过；修复和独立定向审核后重新执行完整集合。B 的 groups-v1 / 续测 / 多来源消费在隔离 product 目标验收，不迁移 MenDi 根，不新增根协议接线。
- 当前源码基准为 C checkpoint `572b94f65555b71d792a056ac18921495b2bc8a4`，分支 `delivery/20261016-04-real-usage-repairs-and-release`；工作区在本次方案编写前干净。实际受测基准须在版本与接线准备完成后重新固定，不能冒称这个旧提交已经包含0.2.0。
- A / B / C均归档、无活动Change，累计13；Delivery仍open/manual-bootstrap。普通UI调整不新建Change，原Run / verdict不改。

| 范围 | 当前直接 Author / 独立 Review / Archive | 实际归档 |
| --- | --- | --- |
| A：范围轮次、旧格式和基线 | 006 / 007 / 008，Change为reopen-incremental-scope-and-compatibility | 2026-10-17-011-reopen-incremental-scope-and-compatibility |
| B：收集、续测、复验与候选消费 | 014 / 015 / 016，Change为full-test-orchestration-continuation-and-revalidation | 2026-10-17-012-full-test-orchestration-continuation-and-revalidation |
| C：业务 / UI与主动澄清方法 | 021 / 022 / 023，Change为business-contract-ui-design-and-proactive-clarification | 2026-10-17-013-business-contract-ui-design-and-proactive-clarification |

上述Run均在本Delivery的002-changes下对应Change目录。正式执行前读取各直接Author / Review的完整当前批准及归档任务，不递归追查全部历史。旧工程PASS / 审核仅支持范围与适用性判断，不代替D04本次正式结果。

## 正式执行前的有限准备

以下为候选准备范围，已由Owner授权在024实施并取得定向结果，独立审核仍待完成。不另开纯发布Change，不回写A / B / C的实施或审核Run。

1. **准备0.2.0源码候选。** 修改package.json版本，更新当前README安装示例和发布说明；锁文件仅按真实工具行为维护，不为版本号手工制造依赖变化。保持Node / pnpm / OpenSpec及依赖基线，包仍private，不做npm上架。
2. **修正实际包接线。** `scripts/prepare-installation-tests.ts`目前写死`mendi-0.1.0.tgz`；改为根据实际package / pack结果消费唯一新包，不能退回旧包或从历史目录猜。允许明确复用同一候选包，避免正式验收时又构建另一个未绑定包；旧Explore proof中的0.1.0记录保持。
3. **补安装包必要行为核对。** 现有`tests/installation/handoff.test.ts`主要验证双目标 / 跨cwd、方法缺项 / 恢复与Propose交接，不能声称完整覆盖A / B新能力。补限定的已安装CLI入口场景，见下文F04；复用现有受控输入，不重建整套历史项目或通用发布平台。
4. **依赖环境准备。** 022的`verify_deps_before_run=error`曾以workspace结构不一致拒绝；直接Biome / TypeScript通过不表示预检恢复。后续在明确范围内正常离线、frozen-lockfile准备根依赖并重核严格预检；UI fixture按其锁文件准备。本次不运行安装，不放宽预检、不修改全局设置、不从DreMo取环境。store不足时报告具体缺项，不自动联网下载替代版本。
5. **定向检查与独立核对。** 对版本 / 包路径 / 候选安装输入的实际改动运行check和对应定向检查，取得独立定向审核并保存当前直接记录；沿用已归档能力的适用批准。此项准备不伪称新的C实施，也不以Owner确认版本代替审核。完成后由另行授权的本地checkpoint固定发布源码，或如实声明必要工作区差异；不自动commit / push。
6. **冻结可追溯候选。** 从明确候选源码构建、pack并装到仓库外的新候选目录，稳定current不动。建议安装位置为`D:/tools/mendi/acceptance/d04-0.2.0-candidate-01`，使用前检查绝对路径 / 实际父目录及未占用；实际证据与包保存在本Delivery受控位置，不以.tmp作为唯一材料。保留源码基准、构建 / pack命令、实际tgz、包指纹及安装来源，包指纹只用于这份实际发布物，不建全库hash清单。

准备脚本 / 安装场景的有限接线要先完成，才能冻结正式集合的确切命令和输入；本方案不把尚未存在的新入口写成可执行事实。准备中新出现范围 / 行为变化，按影响澄清与审核，不能借发布准备默改已批准合同。

## 正式验收集合

所有F组均为必需。整体范围固定后，不因失败、skip或环境不足移出组。准备日志与业务验收分开；每组是否实际启动、结束、退出、业务覆盖及资源收尾分别记录。

| 组 | 实际入口或待落地接线 | 本轮验证目的与完成条件 | 依赖 / 资源 |
| --- | --- | --- | --- |
| F01 工程检查 | `pnpm check` | 格式、lint、src / scripts / tests真实类型检查；严格依赖预检及检查正文均完成，不能用直接工具成功掩盖pnpm拒绝 | 根依赖已准备；读取维护源码 |
| F02 根行为全集 | `pnpm test`，现为build后`node --test --test-concurrency=2 tests/*.test.ts` | 执行当前全部根行为测试；覆盖A轮次 / v1只读与显式迁移 / 活动draft / pending拒绝 / product基线，B真实收集 / skip / TODO / 零执行 / 晚退出 / 取消 / 持久化 / 续测 / 修复审核 / 多来源及Close / Reopen，C方法来源 / 角色 / 指导等既有回归。保留所有真实失败；不能将仅有targeted PASS当此全集结果 | 根依赖与固定源码；会写dist和各自.tmp沙箱 |
| F03 UI工具与方法接入回归 | 显式`prepare:ui-tests`后设置`MENDI_UI_TARGETS_DIR`、受控证据目录，再执行`pnpm test:ui` | 现有四份UI测试文件验证真实官方CLI / 预览、目标类型与浏览器前置、服务归属 / 停止、有限结果与修正后新观察；按目标真实断言及资源收尾判断，不以URL或端口代替。C业务 / UI尺度另由已获批准的方法语义结果及F04包正文核对承接，不把此工具测试当任意UI语义认证 | UI fixture依赖、已准备浏览器和本轮新沙箱；串行使用dist，外部 / 未知服务不取得停止权 |
| F04 独立候选包接线 | 消费已冻结0.2.0包的独立安装session，执行现有`test:installation`及准备阶段新增的有限安装行为入口 | 双目标 / 跨cwd / 方法来源、缺项恢复、Storybook按需保持；实际安装版本 / CLI与六份自有Skills对应候选。通过安装后的CLI验证A / B关键入口，不只读help或版本：见下文场景。所有目标为受控新目标 | 冻结tgz、新仓库外安装、必要隔离目标；不得重写稳定安装或复用旧session充当本轮结果 |
| F05 规格与当前状态读回 | 固定OpenSpec1.14.1对当前七份主规格逐项`validate <id> --type spec --strict`；候选CLI显式`status / next --project D:/Projects/MenDi --json` | 核对声明与实际归档的规格结构、A / B / C完成 / 无活动项、根人工记录及等待边界；状态查询成功不是正式PASS，只有F01–F04及本组全部有效才形成结论 | 归档记录 / 主规格及已准备候选CLI；只读根业务状态 |

F04的最小行为接线：

- **旧product兼容：**至少一个具有活动Change / draft的完整旧open受控输入，实际只读查询 / migration preview，再显式迁移，核对范围及draft / actor保留；加旧pending拒绝，不能借测试准备在新版恢复旧中断。完整旧closed / 跨Delivery基线矩阵由F02执行，不重复搬历史树。
- **新验收消费：**复用B真实受控target及业务刺激，通过安装后CLI执行初次失败、独立尾项continue、固定原失败的修复 / 独立记录夹具、局部retest、多来源verification及隔离目标Close / Reopen，核对真实产物和入口身份；夹具Reviewer仅测试产品准入，不批准根工作。F02保留完整负例矩阵，安装组不再复制全部故障组合。
- **方法随包：**六阶段实际文件与获准候选正文对应，Author上游来自当前目标、Reviewer不继承Author上游、未选Storybook不强制加载；普通UI不新建Change的语义采用021 / 022已批准正文判断，不追加关键词评分器或完整UI开发生命周期。

以上隔离目标的生命周期测试是验收输入，不是对MenDi根或DreMo执行Full Test / Close / 迁移。本轮不重新执行D03唯一Vue目标的开发 / 归档链或取消项，不认证MCP、冷安装、其他平台 / Node版本；当前支持环境以Windows、Node22、pnpm11.22.0、OpenSpec1.14.1及实际浏览器组合如实记录。

## 整次组织、失败与耗时

- 建议顺序F01 → F02 → F03 → F04 → F05，先完成候选 / 环境准备。根测试、UI入口、打包准备可能写同一dist，保持串行；不额外并行同dist构建。没有必要为此改造根测试框架。
- F01或F02出现已确认的普通失败，后续独立且前置 / 资源仍安全的组继续收集；共用构建或环境已坏时相关项记blocked / not-run并说明，不伪造已测失败。未知进程、清理、写入、取消或超时则停止受影响执行，不能从PID消失推导整树安全。
- 一组通过不等于整体通过；必需业务skip / TODO / 取消 / 零执行 / 未完成、协议或材料矛盾、必要批准缺口均不得算完整。原始输出各保存一份，记录真实child退出 / 信号 / 结束和证据位置；不将命令、协议与整轮结论混淆。
- 本D04根沿用Owner确认的人工整次规则：失败保留，范围内小修复与独立定向审核后，另获授权重新执行全声明集合；不拼接旧成功组或focused PASS成新的整次通过。不会因本计划列出逻辑组而自动具有groups-v1多来源复用资格。
- 预算须在正式执行前按机器与集合固定。B的一次根工程收集实测约39分钟，D03旧30分钟根预算 / 45分钟整体不宜直接照搬。建议根命令60分钟、整体90分钟，普通项按已有执行边界设置；这是操作上限建议，未执行、不承诺提速，也不放宽原业务到期 / 取消 / 清理断言。原生长步骤必须可观察进度与有界停止，不用盲重试消除失败。
- 执行前后核对本次直接材料 / 候选适用性，不建全量hash或递归证据图。源码、测试、依赖、方法或执行配置实变按影响取得新结果；单纯交接说明变化不机械推翻有效结论。

## 包、收口与后续授权顺序

1. 后续授权完成有限版本 / 接线准备、独立定向审核和明确源码基准，再构建及独立安装候选；候选包必须在正式验收前可用。
2. 后续单独授权正式D04 Full Test，按最终声明执行；人工父Run / 直接子执行保存完整本轮结果，不迁移根或追改旧历史。
3. 取得明确适用的完整本轮正式结论后，另行授权Close；Close不自动提交Git或发布。
4. 后续授权收口checkpoint / 发布与稳定安装切换时，优先直接使用已验收的同一tgz，不在Close后换源码重打一个未验包。若包或受测材料变了，先按影响核对并补必要验证。
5. 稳定切换前保留旧0.1.0可恢复材料，核实现有安装布局再决定切换 / 恢复操作；不预先删除或移动current。切换后读回实际包版本、CLI、Skills与必要兼容入口；只读查询成功不冒充整个生命周期验收。
6. DreMo的迁移与恢复推进另行授权，先兼容预览；MenDi本次方案、后续候选准备与稳定切换均不代授该权限。不自动npm上架、升级外部工具、生产写入或push。

## 当前准备结果与正式入口

实际源码 / 接线 / 环境和包证据在024-candidate-preparation。当前包及SHA256见该Run的artifacts/candidate.json；0.2.0独立安装已定向验证，等待独立审核，不等同正式PASS。

F04入口已落地：prepare:installation-tests现在接受第三参数“已冻结tgz绝对路径”；显式输入同包跳过build / pack。未来正式执行须使用全新证据目录、新安装目录和session，再设置MENDI_INSTALLATION_SESSION并运行pnpm test:installation（现含d04与handoff两个测试文件）。不得复用已产生结果目录的session制造新正式结果。

F01仍按严格pnpm check，根workspace已明确packages=[.]并正常离线准备；F03 fixture依赖 / 浏览器已核对，但正式场景及其新沙箱仍须在获准执行时产生。原受控0.1.0 proof与历史Run保持，包版本不改变协议版本。

当前停独立定向审核，固定Author024；不预占正式Full Test Run、不执行Close、Git / push、稳定切换或DreMo操作。
