# storybook-integration Specification

## Purpose
定义 MenDi 在有 UI 的目标项目中使用既有 Storybook 工具的交付方法，明确目标配置与资产归属、执行环境、预览服务与有限测试的分工及结果交接。可选 MCP 能力按项目与真实调用认定，无 UI 或未启用 MCP 的目标仍保持原有工作路径。

## Requirements

### Requirement: Target owned UI tools and execution context

UI 工作方法 SHALL 使用目标项目的配置、scripts、stories 与锁定工具，执行前明确目标绝对路径、cwd、配置目录、实际版本、平台及必要依赖 / 浏览器状态。MenDi MUST 不因提供指导而自动安装依赖、升级工具或为无 UI 目标要求 Storybook。缺少当前操作必要输入时 SHALL 说明缺项及未执行事实，不回退其他项目或把准备状态记作成功结果。

#### Scenario: A configured target provides differently named scripts
- **WHEN** 目标有自己的预览脚本与已映射的有限测试脚本，名称与默认示例不同
- **THEN** 按实际配置在目标 cwd 使用这些入口，保留项目身份和环境；不强制重命名，不以命令文本冒充实际执行

#### Scenario: Required target inputs are unavailable
- **WHEN** 所选 UI 操作缺目标配置、锁定 CLI、测试依赖或浏览器
- **THEN** 报告具体缺项且不执行该操作、不生成 PASS、不自动下载工具；不以 MenDi 所在目录的同名安装代替目标

#### Scenario: A target has no UI tools
- **WHEN** 非 UI 目标未选择 UI 指导且没有 Storybook、MCP 或 UI 依赖
- **THEN** 继续原有交付和查询路径，不把可选 UI 材料作为 status / next 的必要输入

### Requirement: Official CLI and browser paths

UI 工作方法 SHALL 提供目标已安装版本的官方 CLI 与浏览器入口，明确工具的本地执行与运行服务要求；工具名称、参数和可用性 MUST 由实际版本帮助 / 配置确认，不推断全部能力已可用。需要服务的调用 SHALL 在确认目标服务归属后执行；返回 URL 或读取官方 Skill 不等于渲染正确、测试通过或独立审核批准。

#### Scenario: Local official tools are selected
- **WHEN** 使用目标版本提供的 CLI tools 或 skills 本地入口
- **THEN** 指明目标 cwd / 配置并按该版本帮助执行；记录实际结果与限制，不为本地工具强行启动预览服务

#### Scenario: A preview URL is returned
- **WHEN** 官方工具返回所选 story 的预览 URL
- **THEN** 通过实际浏览器核对渲染、相关状态 / 交互和错误；URL 本身不证明结果，修改后需要新观察

#### Scenario: A tool is not supported by the target
- **WHEN** 帮助或真实调用表明所需能力不支持、缺配置或失败
- **THEN** 准确记录失败 / 未验证范围，使用适用的脚本和浏览器路径，不自动安装替代工具或伪造工具结果

### Requirement: Preview service ownership

UI 工作方法 SHALL 区分本次启动、已确认归属的既有服务与未知服务，启动 / 复用前核对实际目标、入口、进程来源和访问位置。本次启动服务 MUST 保存活跃进程及日志等直接事实；HTTP 成功、端口或 story ID 不能单独证明归属。自动停止 SHALL 仅作用于本次拥有且仍可确认的服务；未知归属或失去活跃身份时停止处置并说明限制。

#### Scenario: Start reuse and stop an owned preview
- **WHEN** 本次在明确目标启动预览并保留活跃 child，随后复用和收尾
- **THEN** 复用同一已知服务，不重复启动；停止仅针对该活跃服务及其所属进程树，读回实际结束和监听 / 访问结果，不把主动终止退出当作 story 测试结论

#### Scenario: An unknown service occupies the requested port
- **WHEN** 端口返回 HTTP 200 或相同 story ID，但无足够目标与进程来源证据
- **THEN** 不自动复用、不结束该服务；报告冲突，等待明确服务归属或使用目标允许的其他端口

#### Scenario: Reuse an externally owned service
- **WHEN** 操作者已核对既有服务的目标、配置、启动来源及访问位置并选择复用
- **THEN** 记录复用依据和外部归属，本次收尾不自动停止该服务；不能凭历史 PID 在新会话恢复停止权

### Requirement: Finite UI tests and fresh results

UI 工作方法 SHALL 将持续预览与有限测试分别交接。有限测试通过既有目标 script / 结果协议真实执行，记录选择范围、实际退出和日志；预览可用不能代替测试。修改组件 / story 后 MUST 获取适用的新测试与浏览器观察，明确旧结果用途；必要身份、版本、范围和直接输出足够，不新增全量 hash、证据依赖图或必填 UI Run 字段。

#### Scenario: An interaction defect fails the selected test
- **WHEN** 目标有限测试覆盖组件交互且实际断言失败
- **THEN** 记录真实失败及受测范围，不用服务存活、旧 PASS 或未选测试解释为通过

#### Scenario: Updated code requires a new result
- **WHEN** 修复交互或修改显示内容后再次确认
- **THEN** 实际执行所需测试并在浏览器查看更新结果，保存新直接输出；旧结果仍可显式查询且不被覆盖，不充当新代码确认

### Requirement: Conditional MCP capabilities

MCP SHALL 由目标项目按需启用官方实现，Agent 宿主负责连接；使用前核对框架、addon、toolsets、必要 manifest 及宿主实际工具列表，并通过所需能力的真实调用认定支持范围。未启用、未连接、未调用或条件不满足的能力 MUST 标记未验证 / 不可用，不成为普通 UI / 非 UI 交付前置，也不代替 MenDi 的独立 Reviewer verdict。

#### Scenario: MCP is absent
- **WHEN** 目标或宿主未启用 / 连接 MCP
- **THEN** 使用适用的项目脚本、官方 CLI 与浏览器；不阻断这些路径，不宣称 MCP 认证

#### Scenario: Advertised defaults do not satisfy capability conditions
- **WHEN** toolsets 开关开启但框架 manifest 或测试 addon 等必要条件不满足
- **THEN** 按实际工具发现及调用结果说明可用范围；默认开关和安装包不能单独证明 docs / test 能力

#### Scenario: A host connects to the configured target
- **WHEN** 宿主确认目标服务身份、发现工具并真实调用所选 MCP 能力
- **THEN** 仅声明实际成功能力及目标环境，记录失败与限制；Storybook 自身 review 链接不产生 MenDi 批准
