# 修复前复现

命令：node --test --test-name-pattern='正常 execute|prepared 调用' tests/archive-retirement.test.ts tests/archive-attempts.test.ts

实际 exit 1：2 项均失败（0 pass / 2 fail）。旧产品正常退役与 prepared 占号中断后的新 execute 均返回 exit 1，断言期望 0；和 037 的原始复现一致。此处简记本轮结果，完整缺陷来历仍在 037 artifacts/recovery-probes.ts 与 recovery-probes.log，不改历史。

修复后两组 6/6 通过，见 revision-tests.log；真实调用 / 当前 Run / attempt 有限快照见 product-test-evidence。
