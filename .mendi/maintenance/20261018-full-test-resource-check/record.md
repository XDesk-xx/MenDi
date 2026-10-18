# Full Test端口与资源检查：直接方法维护

Owner授权直接更新skill、必要验证后同步稳定安装和当前分发包；保留原已验收tgz，不新建Change、不重跑正式Full Test，保持Author、不修改DreMo、不push。

仅修改skills/actions/delivery-full-test/SKILL.md：启动前查看目标full入口和实际资源；固定端口核对占用身份，不自动终止陌生进程；动态端口实际绑定并传递，启动时确认就绪/归属；未准备资源与业务失败分开，保留原结果及必需范围。无端口目标不加无关检查，目标负责实际准备，不宣称CLI新增通用自动检查。

人工逐情形核对：固定端口陌生占用先停止受影响项；动态端口不得探测后关闭再认领；纯单元测试不增加端口门槛；已启动命令非零仍保留原失败，不被环境说明覆盖。这是正文语义核对，不是新端口扫描实现或真实目标Full Test的PASS。

既有methods-and-numbers测试4/4通过；实际源码loader及实际稳定安装loader均返回与源码相等的新正文。新的0.2.0修订包中该skill字节相同，稳定221个发行文件与当前源码/构建逐字节一致，其他发行材料未变。旧正式包与024源包SHA256均保持5ac71756bc9a1e6bfc813ca5ab75da8f43ecc1ffdbfeea8ec580a47fa9629cde；新版修订包及SHA256见package.json。

同步前发现PID31404正在使用稳定入口执行DreMo Full Test，首次重装预检查停止，未调用pnpm add。改为仅原子替换目标skill，避免原地写入潜在共享文件；不重装/移除运行时或依赖，不中断进程、不修改DreMo。现有Run使用已经读取的方法，后续读取获得新正文。原方法及安装元数据/锁的必要副本在本目录。

稳定installation.json保留archive作为pnpm基包来源，currentDistribution标明新方法修订分发包，synchronization说明仅同步skill；稳定package.json/pnpm-lock保持，不冒称全量重装。当前分发包位于D:/tools/mendi/packages/0.2.0-skill-20261018-resource-check/mendi-0.2.0.tgz，内部版本仍0.2.0，修订身份独立；不再称为原已验收同包。后续新安装可直接用此分发包。

status/next均exit0、ok=true，根closed、等待Owner。未新建Action/Run/Change，未重跑整套Full Test、未改原Run/verdict或既有tgz；路线图及反馈等既有未提交修改不动，无Git写入或push。必要原始输出各一份，见本目录测试/打包日志及readback.json。
