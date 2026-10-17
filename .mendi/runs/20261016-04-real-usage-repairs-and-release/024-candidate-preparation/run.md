---
deliveryId: 20261016-04-real-usage-repairs-and-release
actionId: d04-candidate-preparation-01
actionType: candidate-preparation
role: author
actor: codex-author
run: "024"
status: completed
actionStatus: completed
outcome: complete
result: candidate-prepared-for-targeted-review
nextAction: review-candidate-preparation
nextRole: reviewer
completedOn: 2026-10-17
recordingMode: manual-bootstrap
date: 2026-10-17
---

# D04 0.2.0 候选准备

Owner明确授权按acceptance-and-release-plan准备候选源码、必要安装接线与依赖环境，保持Author，完成停独立定向审核。此为人工候选准备记录，不是正式Full Test / delivery-repair或新增产品Action类型；不改旧Run / verdict，不迁移根记录。不执行Git、正式Full Test / Close、DreMo或稳定安装操作，不push。

## 实施范围与结果

按已确认方案与Owner原始授权实施，未激活纯发布Change。package版本0.1.0→0.2.0，其余包声明 / 依赖深比较相同；README补候选说明、当前兼容和发布变化及显式包复用入口。原协议 / 项目formatVersion不随包版本机械改变。

prepare-installation-tests不再写死旧包名：省略第三参数时只接受本次新目录pack生成的唯一当前版本tgz；显式第三参数是本地绝对tgz，跳过build / pack，安装前读取真实archive package.json核对name / version，并保存实际包路径与SHA256。安装后核对版本和包指纹。实际包检查由29行installation-package.ts负责，保留旧Session可选字段兼容，不引入新产品状态或格式。

新增installation-package两项真实tar负例 / 身份核对：文件名伪装的新包内是旧版本、错包名均拒绝；显式错包在安装 / 证据目录创建前拒绝，不回退旧目录。测试原输出见package-admission-tests.log（2/2）。

## 依赖环境及保留失败

原严格pnpm check以ERR_PNPM_VERIFY_DEPS_BEFORE_RUN拒绝，单纯正常离线frozen安装后仍报workspace结构变化；dependency-precheck-before.log、root-install.log、root-install-versioned.log及check-package-wiring.log保留。

读取固定本地pnpm11.22.0实现：checkDepsStatus在回读workspace manifest时直接用packages字段重新发现，原根yaml缺packages，而正常安装记录只有根项目（workspacePackagePatterns=[.]）。根项目是单包，fixture各有独立workspace / 锁；将根packages显式声明为[.]使范围一致，而非放宽预检。root-install-explicit-scope.log的离线frozen / ignore-scripts准备及check-explicit-scope.log随后成功。未改pnpm工具或全局配置，也未手补node_modules状态文件。

UI fixture沿其原锁离线安装，ui-install.log成功；verifyUITarget实际类型 / browser readiness通过，且pnpm严格typecheck通过（ui-readiness与ui-strict-typecheck.log）。没有运行完整UI场景、下载浏览器或重建D03唯一Vue目标。

## 实际包与安装接线

受审包：D:\Projects\MenDi\.mendi\runs\20261016-04-real-usage-repairs-and-release\024-candidate-preparation\artifacts\candidate-01\mendi-0.2.0.tgz，SHA256 5ac71756bc9a1e6bfc813ca5ab75da8f43ecc1ffdbfeea8ec580a47fa9629cde。安装为D:/tools/mendi/acceptance/d04-0.2.0-candidate-01；第二新目录d04-0.2.0-reuse-01显式复用同一包，prepare日志无build / pack（frozen-reuse-readback.json）。所有安装父目录实际位于仓库外，未覆盖已有目录或稳定current。candidate.json保存基准和明确工作区差异，不以旧提交单独冒称包含0.2.0；没有Git操作 / 新提交。

候选安装定向集合installed-tests-first.log为4/4、exit0：旧活动draft只读查询 / 预览 / 显式迁移且原draft字节保留；旧pending拒绝；真实middle失败、独立tail续测、原失败修复及独立actor记录夹具、局部retest、多来源verified与隔离目标Close / Reopen；六份随包方法正文与当前来源相同、Reviewer无Author上游；原双目标 / 跨cwd / 缺项恢复 / Propose方法交接也通过。实际本轮请求 / 报告 / 事件 / child与日志分别保留于candidate-01/d04-groups，命令原输出单份在commands.jsonl，未搬历史树。

Author额外读回时误期待内部legacy-recovery-required，实际公开入口先返回delivery-commit-pending及具体pending身份，符合旧版先恢复要求；该额外断言错误见installed-readback-first-note.md，产品拒绝优先级未改。安装测试已补精确公开code / pendingRef断言，并在复用同包的新session复验installed-tests-reuse.log为3/3、exit0；原未受影响的双目标交接1项沿用首集合，不把两个集合拼称最后一次4项全部重跑。

夹具的Author / Reviewer只验证隔离产品准入，不批准根工作；隔离目标的Full Test / Close / 迁移不等于D04根正式操作。所有可重建输入留在维护tests，.tmp不承载唯一输入；直接当前输出受控保存。包目录检查没有.mendi / tests / node_modules / 目标官方方法等开发历史混入。

## 检查及维护规模

最终严格pnpm check（check-final-assertion.log）exit0，含格式 / lint和src / scripts / tests真正类型检查。preparation-tests.log为4/4、exit0（包输入负例及原UI准备检查）；只做本次受影响验证，不执行根行为全集或正式Full Test。

按rg --files维护TS物理行与本次修改前同口径比较，排除依赖 / 生成物；详情code-baseline.json / code-counts.json，不设硬行数或hash清单。

| 目录 | 当前前三名 | 修改前→当前 |
| --- | --- | --- |
| src | application/project.ts；core/delivery-runs.ts；application/delivery-lifecycle.ts | 374→374；372→372；371→371 |
| tests | action-write.test.ts；planning-cli.test.ts；delivery-repair.test.ts | 467→467；444→444；394→394 |
| scripts | proofs/mvp-d01-c-explore.ts；proofs/mvp-d01-d-explore.ts；proofs/mvp-d01-a-explore.ts | 678→678；487→487；463→463 |

src无改动。prepare-installation-tests由177→196（+19），新增29行package读取 / 身份 / 指纹职责，未堆入安装主体；新增安装D04行为240行、真实已安装CLI / 直接输出助手76行及包准入43行。安装准备、包身份与测试执行分别承担真实职责，没有纯转发层。新D04文件围绕同一已安装入口分组，不复制全部旧矩阵；后续若继续增加能力场景再按迁移 / 验收消费拆分，不扩展旧长Explore proof。

## 独立定向审核与停止

固定本024为Author准备对象，尚无verdict或独立审核结论。重点审核实际包选择 / 复用 / 版本、根workspace范围修复、安装后新能力的真实入口与限制、同一tgz及候选材料适用性。已有A / B / C范围批准沿用，不回改旧Run / verdict / 归档，不把候选准备命名成正式delivery-repair或新产品Action协议。

稳定current仍0.1.0，package.json时间戳2026-10-10T16:37:05.661Z；未写稳定安装、未访问DreMo、未执行Git或push。根manual-bootstrap / open、累计13、无活动Change保持。本次运行时业务代码与六份方法未改，只有版本 / 接线 / 环境及新定向验收输入变化。

后续正式F04须用同包再准备新的证据 / session和新候选安装目录，不能在本次已消费session重跑覆盖旧结果；正式Full Test / Close及Git、稳定切换另等授权。本次停止在review-candidate-preparation / awaiting-review / reviewer，不启动Reviewer。
