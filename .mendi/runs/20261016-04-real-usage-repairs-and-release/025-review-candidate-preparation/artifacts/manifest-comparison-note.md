# Reviewer比较断言修正

首次只读比较错误地要求发行package.json与源码原字节一致，出现 AssertionError [ERR_ASSERTION]: package.json，退出1；没有改包或实现。

本机 C:/Users/xuser/AppData/Local/node/corepack/v1/pnpm/11.22.0/dist/pnpm.mjs:284201 的createExportableManifest默认省略scripts / packageManager / pnpm，随后恢复可发布scripts。实际清单只少packageManager并改变字段顺序。重核tgz清单与安装清单深相等；源码仅去除packageManager后深相等。其余221个发行文件与当前dist / skills / README逐字节一致，见independent-readback.json。

这是Reviewer检查假设过强，保留失败说明，不表示安装失败或实现修复，不把首次断言记成通过。
