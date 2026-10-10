export {};

const mode = process.argv[2];
if (mode === 'pass') console.log('受控检查实际完成');
else if (mode === 'fail') {
  console.error('受控检查实际失败');
  process.exitCode = 7;
} else if (mode === 'wait') {
  console.log('TEST_READY');
  setInterval(() => {}, 1_000);
} else throw new Error('unknown fixture mode');
