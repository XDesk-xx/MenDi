## MODIFIED Requirements

### Requirement: Finite UI tests and fresh results

UI 工作方法 SHALL 将持续预览与有限测试分别交接。有限测试通过既有目标 script / 结果协议真实执行，记录选择范围、实际退出和日志；预览可用不能代替测试。修改组件 / story 后 MUST 获取适用的新测试与浏览器观察，明确旧结果用途。Apply / Review Apply SHALL 按用户可观察结果、语义角色、正确目标和真实操作核对定位修复，保留原场景、必要技术断言、失败及清理；正常入口与直达 / 刷新 / 授权分别覆盖。必要身份、版本、范围和直接输出足够，不新增全量 hash、证据依赖图或必填 UI Run 字段。

#### Scenario: An interaction defect fails the selected test
- **WHEN** 目标有限测试覆盖组件交互且实际断言失败
- **THEN** 记录真实失败及受测范围，不用服务存活、旧 PASS 或未选测试解释为通过

#### Scenario: Updated code requires a new result
- **WHEN** 修复交互或修改显示内容后再次确认
- **THEN** 实际执行所需测试并在浏览器查看更新结果，保存新直接输出；旧结果仍可显式查询且不被覆盖，不充当新代码确认

#### Scenario: A normal UI iteration invalidates an old locator
- **WHEN** 普通 UI 调整使旧按钮名称、DOM 定位或导航路径失效
- **THEN** 按当前真实入口更新定位而不新建 Change，保留原用户场景、业务与必要技术断言及清理；不靠强制点击、吞错、删用例或放宽结果断言制造通过，独立审核核对实际差异

#### Scenario: Direct access works but the normal entry is lost
- **WHEN** 接口或直达 URL 可用，而正常用户无法发现或操作关键能力，或页面合并丢失必要历史入口
- **THEN** 如实说明用户影响，不能用直达成功或后端未改认定等价；正常入口与直达 / 刷新 / 授权分别核对

#### Scenario: Visual reorganization affects accessibility or a functional promise
- **WHEN** 滚动加载等调整在鼠标操作中通过，但影响目标所需键盘 / 移动可用性，或 PDF 逐页阅读等明确功能
- **THEN** 按实际承诺补相应验证；不把“通常是设计选择”当豁免，不为无关目标强加全设备矩阵，DOM 保持 / 布局稳定 / 无整页刷新等必要技术断言继续保留
