---
deliveryId: 20261009-01-single-change-manual-collaboration
changeId: project-entry-and-minimal-delivery-open
actionId: review-apply-project-entry-010
actionType: review-apply
role: reviewer
run: "010"
status: completed
result: changes-requested
date: 2026-10-09
authorRunRef: .mendi/runs/20261009-01-single-change-manual-collaboration/003-changes/project-entry-and-minimal-delivery-open/009-apply/run.md
---

# MVP-D01-A Review Apply

审核 [009-apply](../009-apply/run.md) 的实现，对照现有两份 specs、design 和 16 项 tasks。Owner 指定使用 Open Code Review 辅助，Reviewer 不修改实现后自签。

## 独立核对

- 完整阅读 9 个 src 实现文件、测试及相关夹具、工程配置、依赖变化和 README。重点核对目标 / 配置来源、运行时输入检查、首次创建与并发锁、部分提交诊断、人工记录只读及本地阶段与上游 readiness 分离。
- `pnpm typecheck` 通过，见 [typecheck.txt](artifacts/typecheck.txt)。
- `pnpm test` 包含构建，27 项全部通过，无跳过，见 [tests.txt](artifacts/tests.txt)。
- 固定 OpenSpec 1.14.1 `validate project-entry-and-minimal-delivery-open --strict` 通过。
- 实际产品 `next --project D:\Projects\MenDi --json` 成功显示人工 `review-apply`，来源为 manual-bootstrap、executable=false；未以 planning complete 推进阶段。
- `git diff --check` 通过。未修改实现、旧 Run 或规划材料，不新增文件 hash 清单。

## 插件辅助

使用 [Open Code Review Skill](C:/Users/xuser/.codex/plugins/cache/open-code-review/open-code-review-codex/1.0.0/skills/open-code-review/SKILL.md) 的 `ocr review --audience agent`，传入本 Change 范围与关键风险。排除历史 `.mendi/`、Explore proof 和规划目录；测试及规格仍由 Reviewer 独立阅读全文。

首轮 14 个选中文件均因 HTTP 429 未完成核心审核，[输出](artifacts/ocr-review.txt) 的零发现不代表通过。按插件指引降低为单并发重试后退出 0，14 个文件完成、输出 25 条原始建议，见 [完整输出](artifacts/ocr-review-single.txt)。保留限制：`src/application/project.ts` 第二轮仍有 HTTP 429 警告，不能描述为所有轮次无错误。

对已返回建议进行实质核对：scope 是调用者显式提供的只读输入，design 明确允许目标外绝对路径；它不是 Change ID，也不是受管写入引用，相关越界写入建议不成立。当前人工格式没有定义 `formatVersion:null`，拒绝该格式不构成兼容缺陷。错误码风格、增加原始 value 详情、隐藏已约定范围字段等建议没有实质修订依据，未转成开发任务。

其余建议也已核对：固定外部安装路径属于本次明确环境；选定 OpenSpec 的 `dist/core/global-config.js:20–25,44–51` 在所有平台优先采用显式 XDG 变量，因此 Windows 隔离误报不成立。测试助手抛错会使测试失败并显示原因，并非静默忽略；增强失败命令日志、临时目录回收和变量命名等属于非阻断改进，不扩展本次修订。全部原始建议经取舍后，没有新增必须修订项。下列发现来自 Reviewer 的独立实测，不冒称由 OCR 检出。

## 已确认发现

### RA-A-001 / P2：配置拒绝路径可能破坏 JSON 错误协议

位置：`src/adapters/project.ts:24`（同类问题也在第 27 行），`src/drivers/cli.ts:34–35`。

YAML 可解析为带循环引用的对象；当前将未经规范化的 `settings.store` / `settings.schema` 直接放入错误 details。CLI 在 catch 中再次 JSON.stringify，循环值使错误处理本身抛出未捕获异常。

已用实际构建 CLI 复现：fresh target 的 `openspec/config.yaml` 为 `schema: spec-driven` 加 `store: &loop`、缩进的 `self: *loop`。执行 `node dist/drivers/cli.js status --project <target> --json`，退出 1、stdout 为空，stderr 为 `TypeError: Converting circular structure to JSON`。目标未创建 `.mendi`。完整最小输入、命令与输出见 [yaml-cycle.json](artifacts/yaml-cycle.json)。

预期应返回一份包含 `ok:false`、`unsupported-store-declaration`、配置路径及提示的 JSON；当前行为违反 project-entry 的 Honest command results。修订应将不受信任的 YAML 错误详情规范化为可序列化值，或仅保留字段类型 / 路径等必要说明，并对 store、schema 的自引用及人读 / JSON 输出补定向回归。无需改变生命周期或重做 Explore / Propose。

## 结论

**verdict：changes-requested。** 保留 1 项 P2（RA-A-001）；其余已核对的实现和验证可继续引用。下一步由 Author 对错误详情输出做局部 revise-apply，并补受影响分支的定向回归；无需重做 Explore / Propose 或修协作管理工具。

本轮仅保存 Reviewer 记录、必要证据和当前交接状态，不修改实现或旧 Run。停在 Review Apply，未执行 Archive、正式 Delivery Full Test、Git 提交 / push 或下一 Change。
