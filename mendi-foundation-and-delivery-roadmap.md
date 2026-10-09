# MENDI 基础与交付路线图：最简手动版

规划日期：2026-10-09

目标版本：v0.1.0

规格底座：OpenSpec 1.14.1

首版规模：**3 个 Delivery、10 个 Change，其中前 7 个 Change 完成核心手动交付链。**

本文是 MenDi 重新开始后的唯一产品总设计与开发规划。它描述待开发目标，不代表能力已经实现或通过验收。Owner 已明确决定清除旧代码、Git 历史与旧流程材料，按本稿重新建立工程。

## 1. 核心思想

**MENDI 在 OpenSpec 上增加 Delivery、Author / Reviewer 协作、以 Action 编排 Skills 的工作流程和 Runs 交接，让真实开发有范围、有审核、有验收、有收口。**

OpenSpec 继续管理 proposal、design、specs、tasks 与 Archive。MENDI 不另建一套规格，不复制整个 OpenSpec 工作流。先完成可手动使用的核心能力，再根据实际需要扩展。

首版保留：

- Delivery 的 Open、Changes、Full Test、Close、Reopen。
- Action 明确本次工作、角色、所需 Skills、产出和停止边界。
- Author 实施、独立 Reviewer 审核；Runs 传递必要信息。
- Explore 必须有核心 proof，验证最重要的疑点。
- Propose、Apply、Review、Revise 与 Archive 的手动闭环。
- focused / fast / full 三类测试。
- 同阶段继续、Owner 反馈及必要回退。
- Storybook 的轻量接入。

首版不要求通用工具平台、复杂执行包、证据图、所有工具的专用 adapter、自动驱动或旧 Flowkit 完整迁移。设计复杂度以真实使用需要为依据，不以继承全部旧能力为目标。

## 2. 最简流程与职责

### 2.1 Delivery 与 Change

```text
Delivery Open
  → 激活 Change
  → Explore + 核心 proof → Review Explore
  → Propose → Review Propose
  → Apply + 必要验证 → Review Apply
  → OpenSpec Archive
  → 按需激活后续 Change
  → Delivery Full Test
  → Delivery Close

Close 后需要新增工作：
  Reopen → 新增或修复工作 → 本轮 Full Test → 新 Close
```

每个指定边界都可以停下。查询下一步不等于执行下一步；Change 完成不自动启动下一 Change，Archive 不自动触发 Full Test 或 Git。

Author 分析、写方案、实现和验证。Reviewer 独立核对相关材料与实现，给出 approved、changes-requested 或 rejected；Reviewer 不修改实现后替自己批准。Owner 决定目标、范围、重要取舍、授权与停止边界。

### 2.2 Action 与 Skill 编排

Action 是流程中的工作单元，例如 explore、propose、apply、review-explore、review-propose、review-apply、archive，以及 Delivery Open / Full Test / Close / Reopen。它负责确定本次目标、执行角色、必要输入、Skill 组合、应交结果和停止边界。

| 对象 | 职责 |
|---|---|
| Delivery | 交付目标、Change 范围、整体验收与收口 |
| Change | 一项可规划、实施和独立审核的变更 |
| Action | 组织当前工作，编排相关 Skills，判断可开始、可继续或应停止 |
| Skill | 指导 Agent 怎样分析、做 proof、实施、审查和使用工具 |
| Run | 保存一次 Action 执行的进展、结果与交接信息 |

Action 选择当前角色的阶段 Skill，再按实际需要引入 OpenSpec、项目指导、测试或 Storybook 的使用方法。只载入相关内容，不把所有 Skills 依次执行一遍。例如 Explore Action 组织问题分析与核心 proof；Apply Action 组织实施、必要测试及 UI 预览；Review Apply Action 组织独立核对并输出 verdict。

程序负责目标定位、基本前置与角色检查、记录和状态更新；Agent 按 Skills 完成语义工作。Skill 或工具报告不能替代 Reviewer 的结论，也不能扩大 Owner 授权。手动触发一个 Action 后停在其指定边界，不因具备 Skill 编排能力就自动推进下一 Action。

同一次 Action 工作可以有多个 Run。同目标、同范围的继续沿用该 Action；阶段完成或实质修订后，用新的 Action 执行记录承接。只需轻量 Action 标识、类型、角色、状态及相关 Run 引用，不要求单独的复杂 ActionInstance 平台、深层父链或大执行包。具体存储可与现有 Delivery / Run 记录合并，避免重复事实。

focused / fast 检查通常是 Explore 或 Apply Action 内的工具工作，不为每项检查、每次预览或每条命令创建独立 Action。正式 Delivery Full Test 则有独立的授权和 Action 边界。

### 2.3 继续、修订与回退

- 同一 Action、同一批准范围内尚未完成的工作，继续即可；可用后续 Run 保存进展，不因多跑一次命令或多改一次页面就要求 revise。
- Reviewer 要求修改时，Author 修正对应内容，再交 Reviewer；已经可靠验证且仍适用的部分可引用，不重复准备全部材料。
- 实现问题通常在 Apply 内修复；需求或方案实质变化才回 Propose；关键事实或可行性前提变化才回 Explore。
- Owner 可以授权主动回退。回到 Explore 时，对变化的关键问题补 proof，不重复证明无关部分。
- 正常错误记录原因并允许修复；效果不明的写操作先查看实际状态，避免重复归档或重复写入。
- 实质扩大范围需要新的明确许可。流程允许调整，但不能把范围变化伪装成原方案已经批准。

Review 重点是当前提交是否成立。approved 支持进入下一步，changes-requested 进入对应修订，rejected 停在 Owner 决策边界。相关实现或方案在批准后实质变化，补审变化部分；不把一个无关文档修改认定为全部历史批准失效。

### 2.4 授权

新 Change 激活仍需要真实 Owner 消息包含连续字样 `owner 授权`，并明确目标与范围。一次 Change 授权可覆盖范围内 Explore、Review、Propose、Apply、普通 Revise、必要检查和 Archive；后续短指令触发当前步骤，不必逐阶段重复授权。

Delivery Open / Reopen、正式 Full Test / Close、Git checkpoint / push / merge、部署和生产数据写入保持独立边界。可在一次消息中明确授权多个步骤与终点；没有覆盖的权限不能从 Change 授权推得。暂停、撤回和收缩范围立即生效。

## 3. Explore：必须有 proof，但只做核心验证

Explore 回答三个问题：

1. 当前问题和目标是什么？
2. 推荐方案是什么，最可能失败的关键点在哪里？
3. 核心 proof 实际验证了什么，还没有验证什么？

proof 围绕当前 Change 的关键疑点选择最小真实实验。例如：一次真实 OpenSpec 操作、一个最小文件读写样例、一项边界条件测试、一个真实组件状态，或一段验证关键算法的可执行样例。仅阅读资料、列出设想或声称“应该可行”，不算 proof。

proof 的规模按问题决定，不固定数量。简单 Change 可以只做一项直接验证；风险相互独立时才补必要的其他验证。每项留下：

| 内容 | 最小记录 |
|---|---|
| 验证目的 | 想确认哪一个关键判断 |
| 输入与方法 | 必要环境、输入、命令或操作步骤 |
| 实际结果 | 观察到的结果及必要输出引用 |
| 结论与限制 | 支持什么决定、哪些仍待实施或验收 |

这些内容直接写在 Explore Run 中即可。必要脚本、输入与原始输出放在该 Run 的 artifacts，或引用项目受控文件。需要大输出时保存文件，摘要只写结论；不把全部输出反复塞进 JSON。

Review Explore 检查问题、关键 proof 和结论是否匹配。proof 失败也有价值：调整方案或补实验，不能写成成功。Explore proof 证明关键方案有依据，不要求提前完成产品或完整验收，也不承诺以后没有新问题。

## 4. Action / Runs、文件和验证结果

### 4.1 最小记录与布局

Run 是一次 Action 执行中需要交接或保存进展的工作记录，不是每条工具命令。一次 Action 可以有多个 Run；Owner 的一条反馈本身不产生空 Action 或空 Run。

建议布局：

```text
target/
├─ openspec/
│  ├─ config.yaml
│  ├─ specs/
│  └─ changes/
├─ .mendi/
│  ├─ project.json
│  ├─ delivery-groups/<delivery-id>/manifest.json
│  └─ runs/<delivery-id>/
│     ├─ 001-delivery-open/
│     │  ├─ run.md
│     │  └─ artifacts/          # 有必要材料时才创建
│     ├─ 003-changes/
│     │  ├─ <change-a-id>/
│     │  │  ├─ 003-explore/run.md
│     │  │  ├─ 004-explore/run.md
│     │  │  └─ 005-review-explore/run.md
│     │  └─ <change-b-id>/      # 按实际执行保存后续 Run
│     ├─ 015-delivery-full-test/run.md
│     ├─ 016-delivery-close/run.md
│     ├─ 017-delivery-reopen/run.md
│     ├─ 018-changes/
│     │  └─ <new-change-id>/
│     │     └─ 018-explore/run.md
│     ├─ 025-delivery-full-test/run.md
│     └─ 026-delivery-close/run.md
├─ AGENTS.md
└─ 项目源码、stories、测试和夹具
```

每个 Delivery 的 Run 序号从 001 开始；同一 Delivery 跨 Change 和 Reopen 连续编号。编号由程序分配，恢复会话不能猜编号或覆盖旧记录。

`delivery-groups/` 下每个已 Open Delivery 使用独立子目录，其 `manifest.json` 保存该 Delivery 的目标、计划槽位、实际 Change 关联与状态，不再另存重复的 Delivery manifest 或全项目 groups 汇总。未 Open 的后续 Delivery 只保留路线图规划，实际 Open 时再创建 group。

以上展示布局示例，省略部分 Run；编号不是预分配，当前未激活 Change 时不提前创建 Changes 批次。

归档目录采用 `openspec/changes/archive/YYYY-MM-DD-NNN-<change-id>/`。NNN 是项目累计完成归档的 Change ID，从 001 开始，至少三位、超过 999 继续增长；跨 Delivery / 日期 / Reopen 连续，不复用。成功归档并读回后才增加 `.mendi/project.json` 的 `archivedChangeCount`，binding 保存 `archiveOrdinal` 和真实位置；失败不计完成。该编号与激活顺序、Run 及批次前缀分开，旧记录不重编号。

Run 目录名采用 `<序号>-<操作名称>`。Delivery Open、Full Test、Close、Reopen 等操作的 Run 直接放在 `runs/<delivery-id>/` 下，彼此同级；一段 Change 工作放在同级的 `<批次首个Run序号>-changes/` 中，批次内按实际 `<change-id>` 保存该 Change 的多个 Run。OpenSpec Change 产物仍放在 `openspec/changes/`，这里仅组织执行记录。

一个 Changes 批次可包含多个 Change；批次前缀复用其第一个实际 Run 的序号，例如 `003-changes/<change-id>/003-explore/`。批次目录不是 Run，不创建自己的 `run.md`，也不额外消耗序号。后续实际 Run 在整个 Delivery 内连续编号，不因进入另一个 Change 或 Reopen 而重新计数；分配编号时核对整个 Delivery 的实际 Run，不能把批次前缀当成额外 Run。

Reopen 保留原 Close 和旧批次，新 Change 工作建立新批次，例如 `017-delivery-reopen/` 后的 `018-changes/`。manifest 记录已建立批次及实际 Change 关联；本轮范围与收口引用保存在相关记录中，不增加 Open / Reopen 轮次目录。分组只在实际进入新的 Change 工作批次时建立，不为每条命令或同阶段继续拆分目录；旧已归档 Change 与 Run 保持原归属。

同一 Action 的多个 Run 通过记录中的 `actionId` 关联，不再增加 Action 目录。当前范围内的正常修复可更新现有工作材料，不因一次目录、引用或实现修复就新增 Action、Run 或 `run.md`。正式审核交接后的实质修订仍按实际阶段建立修订记录并保留原提交；正常修复不能用于改写旧 verdict 或执行结果。

Run 最少包含：所属 Delivery / Change、Action 标识与类型、Role、使用的阶段 Skill 及必要工具指导引用、相关前序或 Author Run、工作摘要、结果、必要材料引用、未决问题和下一步。Review Run 增加 verdict 与必要 findings。机器需要的字段可放在 `run.md` 的结构化头部，正文供人阅读；具体字段在实施 Change 中确定。

工作中允许更新当前 Run，提交交接后保留原记录。同一 Action 尚未完成时可以用新 Run 继续；Run 结束不代表 Action 已完成，只有阶段产出成立才进入后续工作。Action 完成后不追加新的实施 Run，修订建立新的 Action 执行及 Run。OpenSpec 当前文档允许正常修改，Git 与旧 Run 留下历史，不为每次修改复制整个项目。

### 4.2 材料规则

- 引用直接指向实际文件、Run 或 story，避免多层转引。
- 引用是否属于必要输入，由具体操作明确决定，不按字段名以 `Ref` 结尾就自动要求存在。程序实际读取或写入受管路径时仍检查边界与身份；必要输入缺失只阻止依赖它的操作。
- 历史 Run、旧方案和说明性链接用于追溯，不作为普通 status / next 的全部前置。当前交接只保存下一操作需要的输入及相关结论，详细来历留在对应 Run；不复制整条历史引用链，不建设引用注册中心。
- `next` 表达下一动作、状态、角色、原因及实际需要的当前输入；进入下一阶段或 Change 时不继承上一轮全部审核来历。已有 `latestRunRef` 可定位详细历史时，不再把旧 Explore、方案、修订等逐项重复加入 `next`。调整当前交接不改写历史 Run。
- README 保留工程入口与简短当前状态，OpenSpec context 保留技术背景和当前工作所需信息；完整执行过程留在 Run，不要求每个阶段在多份文档重述整段历史。AGENTS 维护稳定协作约定，不保存进度快照。
- 不要求每个文件、目录或字段都有 hash，不递归核验全部历史。
- 保留历史不等于每轮重验历史；仅在本次操作可能影响旧材料时核对相关文件，不把全部旧 Run 的字节比对当作固定交接手续。测试中的文件未变断言和必要包完整性校验仍可使用。
- 必要时使用 Git 提交、相关差异或单独材料摘要确认审查对象；hash 用于确有字节身份需求的包或材料。
- 不设置随意的读取字节数、JSON 节点数、目录深度或 proof 文件数门槛。
- 大材料通过文件引用或流式读取处理；真实资源耗尽时报告原因与继续方法，不削掉必要事实换取通过。
- 只记录本次关键工具的入口与版本，不要求把其全部安装文件重新登记到每个 Run。

### 4.3 极简验证结果

每项检查只需保存：检查名称、输入或候选的必要说明、命令、实际结果、关键摘要和必要日志路径。运行过但失败、尚未执行、运行效果未知分别如实说明，不写成通过。

Reviewer 按风险独立查看相关代码、规格与结果；必要时重跑关键检查，不机械重跑全部测试。验证对象变化时重验受影响部分，不能直接把旧结果套到新实现。

普通状态复查、文档整理和非阶段性检查不另建 Action / Run。非阻断问题保留简短说明，随相关工作处理；不为清空提示反复启动修订。若后续操作确实依赖该问题的解决，在该操作前做局部修订和必要补审。

### 4.4 临时目录

`.tmp/` 只放可丢弃、可重建的内容。源码、长期脚本、必要夹具、配置与唯一证据放在受控文件或正式 Run 中；固定工具使用稳定安装目录。

证明材料需要复现时，保留其实际读取的必要输入，不能只保存一个依赖旧临时目录的脚本。新执行产生自己的结果，不修改旧 proof 或追认旧 PASS。

首版验证一次初始为空或不存在的 `.tmp` 场景，确认准备与验收不依赖旧临时状态。实际清理仍先核对任务占用、必要材料和本项目绝对路径；本规划不执行清理。

## 5. 三类测试与 Delivery 收口

| 类型 | 用途 | 何时执行 |
|---|---|---|
| focused | 当前任务、关键 proof 或缺陷的定向检查 | 开发与修复过程中按需执行 |
| fast | 项目定义的常用回归集合 | 阶段收敛、共享功能变化时执行 |
| full | 当前 Delivery 的正式完整验收集合 | 正式 Delivery Test，及 Reopen 后再次收口 |

项目配置已有命令即可；首版不建设自动选择器、通用预算系统或结果缓存。测试集合按交付目标和影响范围确定，full 不等于每次遍历全部历史实验。

格式、基础 lint 与 TypeScript 类型检查可由普通工程 `check` 命令聚合，行为测试按影响范围执行；失败报告具体文件与规则，修复后重跑即可。检查不接入产品 status / next 的运行前置，不因一次失败新增 Action / Run 或要求补齐历史证据。文件行数与复杂度用于提示职责是否需要整理，不设置任意硬门槛，不为压行数拆出转发层；历史 Run、生成物和字节敏感夹具不纳入批量格式化。

Full Test 失败后先说明问题。在当前批准范围内的小修复可以直接由 Author 修复、Reviewer 定向审核，不强制另建完整 Change 或重走 Explore / Propose；范围或方案实质变化时才重新规划。修复后执行新的正式 Full Test，保留旧失败结果，不拼接多次结果宣称整体通过。

Close 检查本轮约定工作已完成并经过相关审核，交付目标及跨 Change 场景已验证，当前实现的正式 Full Test 通过，没有影响收口的未决问题。Close 留一份简短收口记录，不额外创建一个复杂审查阶段。

Reopen 保留原 Close，明确新工作范围，新增记录；旧已归档 Change 和旧 Run 不复活。新一轮验证覆盖新增工作、受影响旧功能和项目收口必跑集合，产生新的 Full Test 与 Close。Git checkpoint 可单独保存安全边界的进展；Close 与 Git 成功互不替代。

## 6. OpenSpec、Storybook 与其他工具

### 6.1 OpenSpec

**接入方式：选定的外部 OpenSpec CLI + Action 编排的阶段 / 上游 Skills + 目标项目原生配置与文件。** 首版按 `@fission-ai/openspec@1.14.1` 设计，宿主或 MENDI 安装管理在稳定目录选定工具入口；目标项目保留 repo-local `openspec/` 和默认 `spec-driven` schema。不复制 OpenSpec 实现，也不要求把管理工具加入目标项目的业务依赖。

| 接入层 | 具体职责 |
|---|---|
| MENDI 的轻量 CLI 接线 | 传递目标根、Change 和参数，读取 status / instructions 等机器输出，报告实际执行结果与错误 |
| Action / 阶段 Skill | 按需复用选定版本的 OpenSpec 工作方法；Agent 依据模板、任务和相关输入完成分析、写作、实施与语义同步 |
| `openspec/config.yaml` | `context` 声明项目技术栈、UI / 测试入口；`rules` 约束相关产物；`operations.apply.guidance` / `operations.archive.guidance` 表达操作指引 |
| `openspec/` 与 `.mendi/` | 前者保存规格、方案、任务和归档；后者保存 Delivery、Action、Run 和 Reviewer 结论 |

上游工作流由 Agent 驱动，CLI 提供脚手架、状态和产物指引；项目 context 与操作 guidance 是提示输入，不是强制检查。[官方工作流](https://github.com/Fission-AI/OpenSpec/blob/v1.14.1/docs/workflows.md)、[配置说明](https://github.com/Fission-AI/OpenSpec/blob/v1.14.1/docs/customization.md)。因此 MENDI 保留角色、审核与收口的基本前置，不用文件齐备、任务全勾或 CLI 成功代替独立批准。

接入时保留已有配置和项目规则；需要初始化或更新上游生成的 Skills 时明确目标与写入范围，不在每个 Action 中重新安装或调用 `@latest`。默认先支持上述本地模式；其他 store、schema 或不同配置来源遇到时明确报告并由实际需求决定接入，不静默换根或扩大写入范围。上游 `/opsx:*` 方法可由 Action 复用，执行仍遵守当前 MENDI 的角色、授权和 Review 边界。

Archive Action 读取上游归档指引，按经验证的上游路径完成规格同步与实际归档，并读回结果。同一 delta 只同步一次，不让 Skill 与 CLI 重复应用；具体路径在 MVP-D01-D 实测。失败或部分完成时保存错误，观察 specs 与归档目录后再决定后续，不建设通用恢复引擎。

### 6.2 Storybook

**接入方式：目标项目自己的 Storybook 安装与配置 + 已声明的项目脚本 / 预览入口；启用时由 Agent 连接官方 MCP。** 配置、组件、stories、fixtures、样式和依赖锁都属于目标项目。MENDI 只保存必要入口引用与使用结果，不复制设计系统或另建组件目录。

| 入口 | 使用方式 |
|---|---|
| `.storybook/`、真实组件和 stories | 按项目实际文件组织；stories 展示真实组件状态，fixture 数据明确标记 |
| 项目 `package.json` 中的现有脚本 | 使用已声明的启动、构建和测试命令；需要新增时在本次接入范围内合入，不假定所有项目命令同名 |
| 浏览器 / 预览地址 | 查看实际渲染与交互；记录相关 story 和 Owner 反馈 |
| 官方 `@storybook/addon-mcp` | 启用后将当前服务的 MCP 端点接入 Agent 宿主，由 Action Skill 指导查询组件、编写 stories、获取预览和运行已配置测试 |

官方 MCP 的常见端点为 `http://localhost:6006/mcp`，实际以项目端口为准。组件文档能力取决于框架的 manifest 支持，测试能力需要项目已经配置相应测试；接入时核对实际版本与能力，不预先宣称全部可用。当前官方 AI 能力仍处于预览阶段。[官方 MCP 文档](https://storybook.js.org/docs/ai/mcp/overview/)。没有 MCP 时，项目脚本与浏览器路径仍可使用；MENDI 不重写 MCP 协议或另建服务调度平台。

UI 接入形成一条直接工作链：OpenSpec specs / tasks 描述关键状态和验收 → Apply Action 复用真实组件、维护 stories → 预览并接收 Owner 反馈 → 验证相关交互 → Reviewer 独立审核。同一批准范围内的视觉调整继续当前 Apply，不要求每次预览都正式 Review；业务或验收含义变化才回方案阶段。

启动前确认使用哪个项目、配置与端口；复用服务时确认它对应本次目标，启动新服务时记下停止方式，只结束本次启动的服务。Run 简记相关 story、必要源码 / fixture 引用、预览结果与反馈；重要结果按需留截图或日志，不为每次预览建立全量 hash 清单。

Storybook 只在已启用且本次 UI 工作适用时加载，纯后端 Action 不调用。服务运行、HTTP 成功、真实渲染、交互测试、Owner 视觉反馈和生产接线分别按实际结果说明；预览不能替代测试或批准，mock story 不能证明生产功能完成。源码更新后的旧视觉确认不自动覆盖新结果。首版不强制截图基线服务；没有 Storybook 的项目仍使用自身预览与测试完成交付。已经纳入本次验收的检查失败时如实处理，不能用“工具可选”静默跳过。

### 6.3 其他工具

Impeccable 作为按需设计辅助，可用于 critique / polish；不作为核心依赖、独立审核的替代或发行前置。OpenCodeReview 同样可辅助 Reviewer，但不要求首版实现专用 adapter。

DBX 暂不安排。SQLite 场景使用目标项目自身的迁移、SQL 检查和集成测试。MENDI 不因此新增自己的数据库服务或存储平台。

## 7. 首版 Delivery 与 Change 安排

以下使用 **MVP-D01 / MVP-D02 / MVP-D03** 标识首版规划槽位。正式 Delivery / Change 身份在实际开始时建立，规划编号不代表已经激活或完成。

| 规划 Delivery | Change 数 | 可使用的出口 |
|---|---:|---|
| MVP-D01：单 Change 手动协作 | 4 | Action 编排 Skills，通过 Runs 完成 Explore proof、方案、实现、独立审核及归档 |
| MVP-D02：Delivery 验收与收口 | 3 | 多 Change 交付、三类测试、Full Test 修复、Close / Reopen |
| MVP-D03：Storybook 与实际使用 | 3 | UI 预览、固定安装、短入口指导和真实最小项目验收 |
| **合计** | **10** | **最简手动版 v0.1.0** |

前两项完成后，核心手动交付链即可验证和试用；第三项让 UI 开发及独立安装真正可用。数量是当前估计，不是固定配额；只有实际复杂度需要时才拆分，不为凑数量新增接口、存储和验收 Change。

### MVP-D01-A：项目入口与最小 Delivery Open

**范围：**建立可运行 CLI，按 §6.1 接入选定的外部 OpenSpec 1.14.1 与目标 repo-local 配置；读取上游机器状态、保留项目规则，保存最小项目、Delivery 范围及 Change 关联，提供 status / next 的简短查询。

**依赖：**无。

**验收：**真实最小项目可由 MENDI Open 并读回 Delivery 范围，由选定 OpenSpec 入口读取 Change 事实；已有文档与配置不被覆盖；目标或配置来源不明确时报告，不静默换根写入。

**验证：**使用新项目与已有配置夹具执行真实接入、查询和错误目标检查。

### MVP-D01-B：Action 编排、Runs 与角色交接

**范围：**实现轻量 Action 标识、类型、角色与状态，按 Action 选择阶段 Skill 和必要工具指导；实现 Run 连续编号、保存与提交、直接材料引用和 Author / Reviewer 交接。同一 Action 可多 Run 继续，完成与修订有明确区分；不引入通用编排平台、证据图或专门请求 DSL。

**依赖：**MVP-D01-A。

**Explore 重点：**先确认各操作真正消费哪些输入，哪些字段只用于说明或追溯，以及缺失分别影响什么操作。用最小 proof 区分“当前必要输入缺失”和“历史说明链接失效”；Propose 再确定具体字段与错误行为。以 D01-A 收口时实际获批的实现为基准，不扩展成通用引用校验、全量 hash 或跨历史依赖图。

**验收：**Action 选对角色与 Skills，跨进程可读回状态及 Run；同一 Action 多 Run 继续且旧提交不被覆盖；Reviewer 结论关联明确 Author 提交，不能由 Author 自签。交接只带当前必要输入，不逐轮累积历史引用；本次涉及查询展示时，顺带区分“尚未关联”和“已归档、当前无活动 Change”，无需为旧人读提示单独开修订流程。

**验证：**实际执行一次 Skill 选择与多 Run 交接，退出进程后重新读取，并验证错阶段 Skill、错角色、重复编号和当前必要输入缺失。历史说明链接失效或新增未知说明字段不应阻断普通状态查询；新增字段不能仅因命名为 `*Ref` 就变成硬依赖。

### MVP-D01-C：Explore proof 与方案审核

**范围：**通过对应 Action 编排完成 Explore、核心 proof、Review Explore、Propose、Review Propose；按 §6.1 消费 OpenSpec instructions、项目 context / rules 与相关上游工作方法，形成当前方案产物和最简阶段 Skill 指导。

**依赖：**MVP-D01-B。

**验收：**真实关键实验支持方案选择；失败与未验证限制如实记录；Reviewer 可请求修改，必要回退只补受影响内容。

**验证：**在小型 Change 中完成一个真实 proof，包含一次失败或修改要求，再形成可实施方案。

### MVP-D01-D：Apply、修订与原生 Archive

**范围：**通过 Apply / Review / Revise / Archive Action 的对应 Skills 按批准方案实施；支持同 Action 继续、必要验证、普通 revise 和 Owner 主动回退，最后调用原生 OpenSpec Archive。

**依赖：**MVP-D01-C。

**验收：**多次 Apply 进展不强制新规划；实现经独立审核后能真实归档；归档错误不重复执行或伪报完成。归档后更新当前活动状态与实际材料位置，status / next 能解释已归档状态，不再要求旧活动目录存在或继续向上游查询该活动 Change；旧 Run 和原判定保持历史语义。

**验证：**完成一个有继续和修订的小型 Change，按 §6.1 检查实际 specs 与归档位置、确认 delta 未重复同步，退出进程后核对归档状态与查询结果，另验证一次可解释的归档失败。复用前序已获批且仍适用的查询行为；不以重写历史链接或补建旧目录维持查询成功。

**Delivery 出口：**一个真实 Change 完成手动协作闭环。开发检查随各 Change 执行；此阶段不因尚未实现 Delivery Test 就声称产品已通过正式交付验收。

### MVP-D02-A：三类测试入口与简洁结果

**范围：**读取项目已有 focused / fast / full 命令，显式选择并执行，保存极简结果与必要日志。基础执行能力随首次调用提供，不另拆通用进程平台。

**依赖：**MVP-D01-D。

**验收：**实际执行选定集合；失败、未运行和未知结果有清楚区别；focused / fast 不能冒充正式 full。

**验证：**使用成功、失败和中断的检查夹具，读回真实结果。

### MVP-D02-B：正式 Full Test 与小修复

**范围：**从多个已完成 Change 的交付范围形成正式验收；失败后允许范围内小修复、独立定向审核，再执行新的正式 Full Test。

**依赖：**MVP-D02-A。

**验收：**跨 Change 接线真实验证；旧失败保留，新一轮真实执行；范围扩大时回 Owner，不用修改断言掩盖缺陷。

**验证：**构造一次集成失败，修复并复审，再运行完整声明集合。

### MVP-D02-C：Close 与 Reopen

**范围：**依据本轮范围、审核和当前 Full Test 收口；Reopen 明确新范围、保留旧 Close，并再次验证、收口。

**依赖：**MVP-D02-B。

**验收：**缺必要审核或当前 Full Test 时不能 Close；Reopen 不改旧记录、不直接继承旧 PASS；Close 不自动 Git 或激活后续工作。

**验证：**真实完成 Open → 多 Change → Full Test → Close → Reopen → 新工作 → Full Test → Close。

**Delivery 出口：**核心手动版可在最小项目完成一次交付及重开；正式测试、Close 与 Git 仍在各自授权节点执行。

### MVP-D03-A：Storybook 轻量接入

**范围：**按 §6.2 接入目标项目本地 Storybook 配置、脚本与 stories，提供 Action 使用指导、服务启动 / 复用 / 停止及预览引用；接入已配置的组件测试。项目启用官方 MCP 时配置 Agent 连接并核对实际能力，无需实现自有 MCP adapter。

**依赖：**MVP-D02-C。

**验收：**项目脚本可预览真实组件并记录反馈、正确管理本次服务；交互测试实际执行，启用 MCP 时工具调用也真实验证；无 Storybook 或无 MCP 的项目不被额外依赖阻断。

**验证：**在真实 UI 夹具中查看关键状态、修改组件并验证交互，测试已有服务复用与本次服务退出；若声明支持某 MCP 组合，实际调用组件查询 / 预览 / 已配置测试，不仅检查 HTTP 或 story 索引。

### MVP-D03-B：独立安装与简短项目指导

**范围：**形成可安装包与最小 README / Skills；记录实际工具版本，合入中文、角色、授权、材料位置与临时目录的短项目入口。

**依赖：**MVP-D03-A。

**验收：**从稳定安装入口使用 CLI；保留已有 AGENTS 规则，冲突明确报告；长期材料不依赖某次临时安装。

**验证：**独立安装到稳定目录，在新进程读取项目入口并操作隔离目标，不依赖开发仓库内部模块。

### MVP-D03-C：最小真实交付验收

**范围：**验证前述能力共同成立，补必要接线问题。首版平台先限定实际验证的 Windows 环境，其他平台出现需求后扩展。

**依赖：**MVP-D03-B。

**验收：**固定安装在真实目标完成核心闭环与 Reopen；UI 场景能预览和测试，无 UI 场景无额外依赖；初始空 .tmp 下可准备并验收，新结果独立保存。

**验证：**运行一个小型非 UI 项目和一个 UI 项目，覆盖一次复审、一次 Full Test 失败修复及一次新会话继续；按独立授权进行最终正式 Full Test / Close。

**Delivery 出口：**首版可安装、可手动使用、可供 Reviewer 独立核对。未实际验证的版本和平台不列为已支持。

## 8. 从干净工程开始

项目名保持 MenDi，产品包名保持 mendi，路线图文件名保持不变。Owner 明确选择重新开始：旧源码、Flowkit 管理目录、旧 OpenSpec 规格与变更、Run / proof、临时安装和本地 / 远程 Git 历史均不承接。

开发采用直接 OpenSpec、简短 AGENTS、手动 Author / Reviewer 与独立 Git checkpoint。OpenSpec 项目配置及上游 Skills 为新初始化内容；MENDI 自有 Action / 工具 Skills 随相应 Change 实现，不将旧复杂合同带回。

本仓库保持单个 TypeScript CLI 工程：src 保存实现，skills 保存随产品交付的工作方法，scripts 保存构建和验收准备程序，tests 保存测试与受控 fixtures。dist 与按需生成的 runtime 是派生目录；正式必要材料不能仅保留在 runtime 或 .tmp。当前无需独立 control 仓库，长期外部工具使用宿主稳定安装目录。

路线图负责总设计与规划；后续 OpenSpec specs / Change 材料负责具体规格、方案和任务，AGENTS 负责协作与授权，Skills 负责操作方法。README 仅作为工程入口，不另起一份产品设计。必要时通过新 Change 修订具体规格与路线图，避免多份当前设计相互冲突。

初始工程只建立必要配置、目录与可构建的 CLI 骨架，不声称任何 MVP Change 已完成。按新规划激活 MVP-D01-A 时仍需明确的 owner 授权；工程初始化与初始 Git 提交不自动触发 Delivery、Change 或正式 Full Test。

## 9. 可扩展方向

后续有真实需求时，可增加自动派发 Review、单 Change 自动协作、更多宿主和平台、更多数据库工具、并行工作、结果复用或旧项目迁移。

这里只保留扩展方向，不分配后续 Delivery / Change，不写自动化状态机、调度器、预算和恢复平台的实施细节。扩展复用已有 Delivery、角色、Action / Skills 和 Runs，不能成为首版前置条件。

## 10. 资料与本次修改边界

- [OpenSpec 1.14.1 发布说明](https://github.com/Fission-AI/OpenSpec/releases/tag/v1.14.1)。
- [OpenSpec 1.14.1 工作流](https://github.com/Fission-AI/OpenSpec/blob/v1.14.1/docs/workflows.md)：MENDI 的 Explore proof 与独立 Review 是本项目协作约定。
- [OpenSpec 项目配置](https://github.com/Fission-AI/OpenSpec/blob/v1.14.1/docs/customization.md)。
- [Storybook 交互测试](https://storybook.js.org/docs/writing-tests/interaction-testing)与[官方 MCP](https://storybook.js.org/docs/ai/mcp/overview/)。
- [Impeccable 官方项目](https://github.com/pbakaus/impeccable)。

首版采用 3 个 Delivery、10 个 Change 的开发估计；原 7 个 Delivery、40 个基础规划槽位及追加修复不再构成实施义务。

本文是开发目标，不是产品验收声明。工程初始化、工具准备与 Git 重建的实际状态以当前工程及 README 为准；尚未激活的 Delivery / Change 不写成已完成。
