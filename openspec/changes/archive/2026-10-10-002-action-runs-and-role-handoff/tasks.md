# Tasks

以下为实施与验证任务，当前均已完成。合同见两份 delta specs，具体输入、命令与写入顺序见 design.md；016 / 017 已可靠验证的可行性结果可以沿用，原型不是产品实现。

## 1. 当前记录与阶段规则

- [x] 1.1 定义 product Run YAML 头部、Action 类型 / 角色 / 状态、当前 latestRunRef 与单批次扩展，保留无 Run 的 product v1 和人工只读格式；通过合法 / 坏头部、身份与路径不符、旧格式及未知说明字段的记录测试验证。
- [x] 1.2 实现当前 Run 的直接读取和状态解释，不解析无关历史头部；用缺当前输入失败、坏旧 Run / 失效历史链接 / 未知 Ref 仍可查询的测试验证，并同步字段说明。
- [x] 1.3 实现初始、continuing、完成、Review verdict 与局部 revise 的最小规则表；用错角色、draft 不可继续、完成不追加、陈旧输入、rejected 停 Owner 和修订新 actionId 的测试验证，记录与语义完成的区别同步到帮助说明。

## 2. 方法与占号准备

- [x] 2.1 编写六个最小产品阶段 Skills 及 OpenSpec 工具指导，修订复用 Author 方法，接入安装包路径解析与按需读取；测试实际内容 / 角色 / 阶段、明确工具请求、缺方法和不匹配在占号前失败，并逐份核对停止边界不自动推进。
- [x] 2.2 实现约定层级内的全 Delivery 占号扫描和批次建立；用跨操作 / Change 连续号、批次不占号、artifacts 数字目录不参与、超过三位、空占号保留 / 报告和重复号拒绝的文件测试验证，同时给出目录样例。

## 3. 安全保存与提交

- [x] 3.1 实现 Action start / continue 的独占写入、新 Run 独占落盘、manifest 指针替换和完整读回；以真实子进程竞争及 Run 落盘后 manifest 失败 / 读回失败的故障注入验证，断言原文件完整、修改后失败保留锁与已写路径，不自动清理。
- [x] 3.2 实现当前 draft 的正文 save 与 submit，用临时文件替换、不更换当前指针；验证非空正文 / result、错误 actor / role、陈旧 Run、已提交 save / 重提拒绝、替换前后失败与锁释放失败，并用字节比较确认相关旧提交未改。
- [x] 3.3 接入同 Action 多 Run 继续，继承必要方法与固定 Author 输入；用独立进程保存 / 提交 continuing、continue、新 Run complete 和再次 continue 拒绝的测试验证，覆盖 Author 与 Reviewer，并同步继续用法。

## 4. 独立审核交接

- [x] 4.1 实现初次 Review 固定当前完成 Author，校验相同身份 / 阶段 / 完成状态与不同操作者；测试缺失、未完成、旧 Author、错误阶段 / Change、明显自签和真实 Reviewer 跨进程继续，明确标签不认证真实会话。
- [x] 4.2 实现 Review continuing 无 verdict、complete 必有合法 verdict、Author 禁止 verdict，以及 approved / changes-requested / rejected 最小 next；测试三类结论、修订后当前批准不沿用、旧 verdict 保留，以及固定 Author 丢失只阻止 Review continue / submit 而不阻止普通查询。

## 5. CLI 与兼容查询

- [x] 5.1 接入四类记录命令、参数白名单 / 互斥、退出码与中文 / JSON 输出；用实际 CLI 测试必填、错类型 / 角色、未知参数、目标外 body 输入与受管 Run 越界，并验证 help / 未支持 Archive、Delivery 命令无写入；在 README 落地可执行记录示例。
- [x] 5.2 status / next 展示当前产品 Action / Run 和简短交接，人工记录不新增 Run 存在性要求；回归 product 无 Run、manual 写命令拒绝、归档后人读“已归档、当前无活动 Change”与 JSON 原身份 / upstream:null，验证查询不写文件或读取旧活动 Change。

## 6. 集成收口

- [x] 6.1 在受控目标实际串联产品 Open / bind、方法选择、Author 两 Run、Reviewer 两 Run 和明确 verdict，退出进程后逐步读回；包括一次范围内修订与独立补审记录，验证直接对象 / 连续号 / 提交不可覆盖，所有结果按实际成功或失败留痕。
- [x] 6.2 执行普通 `pnpm check`、构建、当前相关测试和既有行为回归，保留 A 的必要输入、路径 / junction、配置错误及写入回归；使用受控输入新建 fresh sandbox 验证不依赖旧临时状态，简记具体命令 / 结果 / 限制，不触发全历史 hash 或补证流程。

## Workflow follow-up

- Author 完成后停在独立 Review Apply；工具通过、任务全勾或上游 readiness 不替代批准。
- 独立 Review 与本 Change 授权边界满足后，Archive 另按实际指令执行并更新真实路径 / 累计号；不预先勾成实施任务。
- Git、正式 Delivery Full Test / Close / Reopen、下一 Change 激活均保持各自授权边界。
