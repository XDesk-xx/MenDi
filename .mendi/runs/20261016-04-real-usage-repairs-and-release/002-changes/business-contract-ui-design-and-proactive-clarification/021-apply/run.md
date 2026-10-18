---
deliveryId: 20261016-04-real-usage-repairs-and-release
changeId: business-contract-ui-design-and-proactive-clarification
planningSlot: MVP-D04-C
batchId: 002-changes
actionId: business-contract-ui-design-and-proactive-clarification-apply-01
actionType: apply
role: author
actor: codex-author
run: "021"
status: completed
actionStatus: completed
outcome: complete
result: implementation-ready-for-review
nextAction: review-apply
nextRole: reviewer
completedOn: 2026-10-17
recordingMode: manual-bootstrap
date: 2026-10-17
stageSkillRef: skills/actions/apply/SKILL.md
upstreamSkillRef: .agents/skills/openspec-apply-change/SKILL.md
reviewProposeRunRef: .mendi/runs/20261016-04-real-usage-repairs-and-release/002-changes/business-contract-ui-design-and-proactive-clarification/020-review-propose/run.md
---

# MVP-D04-C Author Apply

已核实020 approved固定019，Owner明确Apply指令。保持Author，普通UI调整不新建Change；不修改DreMo / 稳定安装、不push，完成停独立review-apply。使用openspec-apply-change与增量实施方法；后者的逐增量commit不适用当前独立Git授权边界，本次不执行。

## 增量一：Author方法

Explore / Propose已加入业务 / UI / 未知的分工、普通UI不新建Change、事实先查与关键提问、等待不批准。人工核对：侧栏替代顶部菜单且角色 / 对象 / 操作不变，仅设计 / 定位更新；非UI保留期限尚无决定则不能默认30天，只暂停依赖；默认截止不能由模型选值，须落实显示 / 时区 / 请求 / 服务端；草稿改发布即使handler同一也须看理解 / 确认，Owner明确验收文案不能被降格。以上是方法语义推演，不是目标UI运行PASS。

已有target-methods测试通过，直接来源 / 正文 / 角色与修订映射可沿用，无需补关键词或镜像测试；原结果见artifacts/author-methods.log。

## 增量二 / 三：独立Review与定位修复

Review Explore / Propose各自加入业务 / 设计 / 未知的共同尺度和重要假设来源，Reviewer无需Author上游；不以旧词面机械否决、不以工具绿豁免业务。已有target-method-handoff / methods-and-numbers测试8/8通过，见artifacts/reviewer-handoff.log，未伪造本仓库Reviewer批准。

Apply / Review Apply补入真实正常入口、可观察结果 / 语义角色 / 正确对象、保留原场景与必要技术断言 / 原失败 / 清理；明确直达不代正常入口、历史访问、目标所需键盘 / 移动及PDF明确功能。README只留简短使用说明，未复制通用长规则到Storybook、官方上游或CLI。

## 当前正文的Author语义核对

以下是对交付方法的人工具体情形推演，输入是受审design的受控假设，不是对DreMo实测、浏览器PASS或模型自动评分。独立Reviewer仍须核对。

| 输入事实 / 未知 | 处理与理由，以及对应正文 |
| --- | --- |
| 教师入口由顶部“课程”移到侧栏；角色、对象、可发现 / 可操作与结果不变 | Explore / Propose明确正常设计 / 定位更新，不新建Change或Action / Run。旧“顶部”词面不是单独业务失败，Review同尺度核对；不追改旧Run / verdict。 |
| 页面合并后当前资料可读，历史正常入口消失；旧URL仍可用 | Apply / Review Apply要求说明正常入口和历史访问缺口，补真实正常路径验证，直达测试仅证明直达；已知缺口不能以“后台还在”豁免。 |
| 滚动加载鼠标通过但目标必要键盘操作失败；或另有PDF逐页承诺 | 按真实功能 / 可用性补受影响验证，不能借“通常为设计”删除承诺；也不对没有该需求的目标加全设备矩阵。Apply两方正文均覆盖。 |
| “保存草稿”改“发布”，handler同一，发布含义未确认；或Owner明确要求某确认文案 | Propose核对真实状态 / 用户理解，必要时问“此操作仍保存草稿还是要实际发布”；不能自行选择或降格Owner明确验收。Review Propose检查来源，不因handler和测试相同就认等价，也不机械开新Change。 |
| 截止默认从空值拟改当天，但预期和时区未知 | 先查已有产品决定；仍未知问Owner期望默认结果及后果，依答案核对显示 / 时区 / 请求 / 服务端；不能模型先选当天。依赖该决定的定稿暂停，其他独立事实继续查。 |
| 非UI历史保留期限未知，模型建议30天但Owner没答 | Explore / Propose与Review都要求真正提问和承接答案，未答不能默认30天或等一分钟视为同意；低影响可逆内部细节不跟随升级为问卷。 |
| 已确认学生只能读获准材料，却观察到教师材料泄漏或未确认即提交，测试仍绿 | 这是对已知业务约束的缺口，不需要重复问Owner“是否允许泄漏”；不能用后端未改 / 设计备注 / 工程PASS放行。六阶段相应业务与验证职责可区分。 |
| 旧按钮选择器失效，候选修复用force点击并删确认 / 无刷新断言 | Apply / Review Apply拒绝弱化场景，改用当前真实语义入口，保留正确对象 / 业务结果、必要DOM / 布局 / 无刷新断言、失败与清理，重新取得受影响结果。 |
| Owner已明确普通UI不新建Change，技术栈可查，仅余可逆布局细节 | Explore / Propose承接回答、先查事实并自行判断该细节，不重复要求新Change或问卷；重要未知仍按实际影响提问，没有新增问题数量 / 等待时长gate。 |

本次没有出现需Owner决定的新产品取舍；上表的问题是方法验收的受控例子，不向Owner重复发送假想业务问题。六份正文未用关键词数量宣称语义通过，真实传递与人工推演分别留痕。

## 真实当前交接

新增受控TypeScript入口scripts/mvp-d04-c-apply.ts，不扩展017旧proof。首次用actionTarget后真实new change拒绝：夹具已预建同名空目录；保留handoff-first.log及handoff-01原命令，不当产品缺陷或PASS。改为最小fixture → 真实OpenSpec scaffold → 当前product记录准备，未放宽断言，也未删除首次现场。修正后真实类型检查与handoff-repaired.log均exit0，原始输出在handoff-02/commands-*.jsonl，其余直接读取在methods.json。

实际候选CLI Explore start返回更新后的完整自有正文，字节文本等于当前来源；proposal instructions返回本目标context / rules。六阶段及三种修订映射共九次loader来源 / 正文 / optional选择核对通过，未选Storybook无可选指导，Reviewer无Author上游前置。只真实启动Explore，其余是loader核对；目标没有proposal，未伪造阶段完成或批准，不代表已测试九个完整CLI阶段或任意宿主语义。

## 维护代码规模与职责

按rg --files -g *.ts统计src / tests / scripts维护代码物理行，排除被忽略的依赖和生成物；与本次修改前现场同口径基准比较，见artifacts/code-baseline.json / code-counts.json，不补造增长、不设行数gate。

| 目录 | 前三名 | 修改前 → 当前 |
| --- | --- | --- |
| src | application/project.ts；core/delivery-runs.ts；application/delivery-lifecycle.ts | 374→374；372→372；371→371 |
| tests | action-write.test.ts；planning-cli.test.ts；delivery-repair.test.ts | 467→467；444→444；394→394 |
| scripts | proofs/mvp-d01-c-explore.ts；proofs/mvp-d01-d-explore.ts；proofs/mvp-d01-a-explore.ts | 678→678；487→487；463→463 |

src / tests没有增长或修改；唯一新增维护代码为159行mvp-d04-c-apply.ts，职责限本次可重建目标准备、真实交接与直接来源核对，不解析业务语义、不承担分类 / 评分 / 发布；没有纯转发层。旧Explore和长proof没有继续扩展，原用途保持。本次无需先拆旧混杂职责；后续若继续扩展该入口为完整Apply / Archive流程，应先分开记录流与Archive效果，不在本次无需求拆层。六份方法各补阶段必要职责，没有复制整套通用长文到工具指导或context。

## 最终验证、适用范围与交接

按真实Apply instructions的sourcePath / line逐项检查、勾选并重新读回任务；最终11/11。工程check-final.log exit0，包含格式 / lint和src / scripts / tests真实类型检查；methods-final.log完整11/11通过、exit0。该集合在六份最终方法及新程序完成后运行，不拼接早前增量测试作完整结果。strict validation通过、issues=[]，git diff --check通过。

新增程序初次失败、具体上游拒绝及修正后新执行均保留；这是夹具准备错误，不倒改为产品协议问题，也不把最初类型检查通过冒充运行通过。交接实测只证明实际返回内容 / 目标约束 / 来源与选择，语义核对由本Author说明并留独立Review检查，未认证任意宿主或UI浏览器行为。

本次未改变运行时代码 / 记录消费，按已批准方案只验证受影响方法和真实交接，不重跑根行为全集、旧UI工程或历史proof树；没有执行根正式Full Test / Close。根仍manual-bootstrap、累计12，HEAD仍1cb4080；稳定0.1.0包及原时间戳保持，未访问或修改DreMo。边界见artifacts/boundary-readback.json。旧归档 / Run / verdict、受审019 / 020及规划正文保持（仅当前tasks按实际实施勾选），未修改主规格或官方上游。

固定本021为独立Review Apply对象，next为review-apply / awaiting-review / reviewer。本会话保持Author、无verdict，不启动Reviewer、不归档、不改版本 / 发布 / 安装，不执行Git写入或push。普通UI调整不新建Change的Owner边界已落实，后续阶段按各自授权。
