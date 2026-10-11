# Spec Delta

## Purpose

为当前目标项目的离线笔记提供只依赖本地文件的摘要约定，明确输入位于目标内 notes/、不需要网络服务，也不向管理工具安装位置写入；无网络时保持同样行为，路径缺失按实际缺项报告。

## ADDED Requirements

### Requirement: Offline local note summary

目标 SHALL 从自己的 notes/ 读取笔记摘要，不联网，不读取其他项目或 MenDi 安装目录；输入缺失 SHALL 报告具体位置，不伪造成功。

#### Scenario: Network is unavailable
- **WHEN** 用户在无网络环境读取已有本地笔记
- **THEN** 仅从当前目标的 notes/ 读取并输出摘要，不要求 UI、联网依赖或 MCP

#### Scenario: Local input is absent
- **WHEN** notes/ 不存在
- **THEN** 报告当前目标的缺失目录，不回退其他项目
