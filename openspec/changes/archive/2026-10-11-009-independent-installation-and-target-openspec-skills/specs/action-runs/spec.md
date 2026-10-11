# Spec Delta

## MODIFIED Requirements

### Requirement: Stage skill and requested guidance

系统 SHALL 按 Action 类型和角色从安装包选择固定产品阶段 Skill，修订使用相应 Author 方法；可选工具指导 SHALL 仅按明确请求读取。Change 新交接还 MUST 读取该阶段实际必需的当前目标 OpenSpec 方法，不受可选指导选择影响。开始 / 继续时 MUST 返回实际文件位置与内容，必要方法缺失、不可读或身份不符时写入前失败。Storybook 选择 SHALL 持久读回，未选择时不读取。方法交接不表示执行、完成或批准，不自动安装 / 启动工具或认证能力。

#### Scenario: Author and reviewer use different methods
- **WHEN** 用户分别开始 explore 与 review-explore，并明确请求 openspec 工具指导
- **THEN** 返回各自角色对应的产品阶段 Skill 及实际 OpenSpec 指导，Run 保存所选自有方法标识；Author 另取得目标 Explore 方法，Reviewer 不使用 Author 方法代替独立检查

#### Scenario: Required method is missing
- **WHEN** 当前操作选择的阶段 Skill、明确请求的工具指导或阶段必需的目标方法不存在、不可读或身份不符
- **THEN** 操作失败且未分配新 Run；普通 status / next 不因不读取的方法文件失效而失败

#### Scenario: Explicitly select Storybook guidance
- **WHEN** Change Action 明确选择 Storybook 工具指导，所需方法有效
- **THEN** 返回固定角色阶段方法、Storybook 指导及该阶段实际需要的目标方法的文件 / 内容，Apply 仍取得目标 Apply 方法；Run 持久保存指导选择，继续与读回保持一致，不因此执行 CLI、启动服务或给出审核批准

#### Scenario: Existing runs and unselected guidance remain usable
- **WHEN** 旧 Run 的指导为空或 openspec，或当前操作未选择 Storybook 且其指导文件不存在
- **THEN** 读取对应必要方法及旧 Run，不强制补字段 / 文件；未使用的 Storybook 或 MCP 不成为查询依赖

#### Scenario: Reject invalid guidance before writing
- **WHEN** 请求未知 / 重复的指导或所选 Storybook 指导的身份与正文无效
- **THEN** 在分配 Run / 更新交接前拒绝，并保留旧记录及 verdict，不放宽受管路径和角色检查

## ADDED Requirements

### Requirement: Target-local upstream method source

系统 SHALL 从显式当前目标根下的 `.agents/skills/openspec-*/SKILL.md` 读取所需官方方法，核对方法名称、非空正文与 `metadata.generatedBy: "1.14.1"`。`metadata.version` MUST 不被当成 CLI 版本，生成标记不证明正文未修改。系统 MUST 拒绝经 symlink / junction 越出目标的来源，不回退开发仓库、其他目标、共享目录、PATH 或最新版本。安装根只提供 MenDi 自有方法，外部 OpenSpec 入口仍按既有约定选定。

#### Scenario: Installed package operates on two targets from another cwd
- **WHEN** 从开发仓库外的真实安装在另一 cwd 显式选择 alpha 或 beta，两个目标各自具有适配方法
- **THEN** 自有方法来自该安装，官方方法来自被选目标；返回正文与实际来源，目标 Run / 产物只写入被选目标，未选目标与安装根不接收目标产物

#### Scenario: Metadata identifies the supported generation baseline
- **WHEN** 方法名称正确、正文非空，metadata.version 为 1.0 且 generatedBy 为 1.14.1
- **THEN** 接受当前生成基线；generatedBy 缺失 / 不符、错名称、空正文或不可读则明确失败，报告具体方法和实际问题，不自动准备或切换来源

#### Scenario: A method resolves outside the target
- **WHEN** 必需方法或其父目录通过 symlink / junction 指向目标根外
- **THEN** 按不安全来源拒绝，不读取外部正文或创建新交接，不把同名前缀目录误判为目标内部

### Requirement: Current method handoff without historical migration

Change start / continue、Owner resolve 实际创建的接收交接及 Archive 准备 SHALL 在分配 Run / 写入交接前检查其阶段必需方法，返回标识、目标根、目标内引用、实际文件、生成基线及真实内容，供宿主按当前 Change 使用。缺项 MUST 保留既有有效 Run、状态及 verdict。普通查询、历史读取、本地保存、提交、诊断与 Archive 本地 finish MUST 不新增方法前置。旧 Run 不增加必填字段或批量补写，继续时按当前目标重新读取方法。

#### Scenario: Continue fails while the existing submission remains usable
- **WHEN** 当前 submitted / continuing Author Run 有效，但本阶段目标方法后来缺失、不可读、错身份或错基线
- **THEN** continue 在新占号前失败，原 Run / manifest 保持，普通查询与合法本地说明操作仍按各自必要输入处理；恢复方法后新进程可显式继续并取得当前正文

#### Scenario: Owner handoff cannot bypass required methods
- **WHEN** 合法 Owner resolve 将工作交给需要目标方法的 Author，但该方法不可用
- **THEN** 在接收 Run / 当前指针写入前拒绝，原直接对象与 Owner 边界保持；Reviewer 接收交接不因此新增 Author 方法前置

#### Scenario: Unrelated files and old optional fields are absent
- **WHEN** 当前必要输入有效，未使用的 sync / Storybook 方法缺失，旧 Run 没有上游方法字段，历史说明链接失效或未知 Ref 指向不存在文件
- **THEN** 当前方法交接及只读查询不递归检查这些来源，不补写旧 Run；身份、角色、必要当前输入、路径与冲突检查仍生效

### Requirement: Stage-specific upstream method composition

Author Explore / revise-explore SHALL 使用目标 openspec-explore；首次 Propose 使用 openspec-propose 的已有 Change 产物工作片段与真实 artifact instructions；revise-propose 使用 openspec-update-change 的适用修订规则；Apply / revise-apply 使用 openspec-apply-change 与真实 Apply instructions；Archive 准备使用 openspec-archive-change，保留既有原生一次同步路径。Review SHALL 使用自有独立方法，Delivery 操作不强制加载 Change 上游方法。

#### Scenario: First proposal retains the already bound change
- **WHEN** 当前 Change 已绑定但正式规划产物缺失，Author 开始或继续首次 Propose
- **THEN** 宿主取得目标 propose 正文，按实际 instructions、依赖及 context / rules 编写该 Change 产物，跳过另建 Change，不以 update-change 替代首次创建；list 不增加另一个 Change，任务不自动勾选

#### Scenario: Revision applies only the relevant update rules
- **WHEN** 正式 Propose 提交后的实质修订使用目标 update-change 方法
- **THEN** 围绕已有产物和适用 glob 新增规则协调修订，不把该方法解释为通用缺失产物生成；新修订另留记录并停独立 Review Propose，旧 verdict 保持

#### Scenario: Review and archive keep their responsibilities
- **WHEN** Reviewer 审核固定 Author，或 Author 在当前批准之后准备并另行授权执行 Archive
- **THEN** Review 不执行 Author 写入流程；Archive 指引不先同步再调用原生重复同步，本地 finish 不重新加载方法或执行原生，保留既有批准、任务与效果读回边界

#### Scenario: Methods inform actual work without certifying it
- **WHEN** 方法内容与动态 instructions 已返回或 OpenSpec 状态显示 ready / all_done
- **THEN** 宿主仍须按实际产物、调用和证据完成阶段工作，返回内容不产生完成或批准；未使用的 MCP、未验证宿主 / 平台和未来升级机制不成为本轮前置
