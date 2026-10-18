---
deliveryId: 20261016-04-real-usage-repairs-and-release
actionType: stable-install
role: author
actor: codex-author
run: "028"
recordingMode: manual-bootstrap
status: completed
actionStatus: completed
result: installed-0.2.0
completedAt: 2026-10-17T14:03:16.882Z
outcome: complete
date: 2026-10-17
---

# D04 0.2.0稳定安装切换

Owner原始授权及直接计划见artifacts/plan.json。保持Author，固定026已验收并在027 Close的同一tgz，源码checkpoint为2d0a0e0；不build/pack，不push、不修改DreMo。先保留完整0.1.0安装、旧tgz及恢复说明，再在原current路径离线ignore-scripts安装同包；实际命令、核对及恢复位置在本Run记录。

## 实际安装与恢复材料

原稳定current确认为普通目录，切换前未发现以该入口运行的Node进程。先核对0.1.0真实包内版本及SHA256，保留旧tgz原位置与副本，并将完整旧current原样移到D:/tools/mendi/backups/d04-before-0.2.0-028/current，包含原package/lock/installation.json/node_modules。旧CLI从备份路径执行help退出0；恢复说明和原身份在同层README.md/recovery.json。没有删除或修改原0.1.0包。未实际演练回切，不伪称回滚测试通过。

在原D:/tools/mendi/current路径，以固定Node/pnpm11.22.0执行offline/ignore-scripts安装D:/tools/mendi/packages/d04-0.2.0-2d0a0e0/mendi-0.2.0.tgz，exit0，无信号。该文件只是024已验收包的逐字节副本，SHA256仍5ac71756bc9a1e6bfc813ca5ab75da8f43ecc1ffdbfeea8ec580a47fa9629cde；不build/pack。完整旧安装先保留，再创建新current；原CMD启动器包含安装位置，故直接在最终路径生成新启动器，不将另一安装目录简单改名当完成。

## 验证与读回

- 当前installed package为0.2.0；221个非清单发行文件与026正式受测安装逐字节一致，package清单结构也一致。
- 实际稳定CLI help/status/next均exit0；.bin/mendi.cmd --help退出0。根仍closed/manual-bootstrap，正式026 passed、Close027保持。
- 新stable-smoke session明确指向current的真实CLI；node --test tests/installation/d04.test.ts为3/3、exit0，失败/取消/skip/TODO均0：旧活动draft查询/预览/显式迁移与保留、旧pending拒绝；失败/尾项续测/原失败修复审核夹具/局部复验/多来源/隔离Close及Reopen；六阶段方法正文、Reviewer无Author上游、按需Storybook。所有写操作仅在新隔离目标，未迁移根或修改DreMo。
- 安装后定向验证不是新的根正式Full Test，不重新批准原独立Review；026及027和所有历史Run/verdict不改写。

直接证据见artifacts/verification.json、install-command.json/install.log、package-readback.json、backup-confirmed.json、stable-smoke-command.json/stable-smoke.log；实际CLI请求和回执在stable-smoke，原始输出各一份。稳定current/installation.json记录实际包、checkpoint、验证位置与恢复位置。

## 停止

本028按manual-bootstrap记录Owner授权的安装动作，保持Author，无Reviewer verdict。仅更新当前manifest最新Run/next及OpenSpec context的稳定身份说明；根Close/正式结果/归档绑定/累计13保持。next仍owner-decision / author / awaiting-owner-instruction。

未执行Git写入或push，未访问或修改DreMo；未自动清理旧环境、原故障现场或启动下一阶段。README保持已验收包正文，不因说明过期另重打包；当前事实以manifest、028和稳定installation.json为准。验证限当前Windows/Node22.23.2/pnpm11.22.0/OpenSpec1.14.1，未声称冷安装或其他平台认证。完成最终公开读回后停下。
