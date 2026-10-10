import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import {
  uiTarget,
  tool,
  launchPreview,
  useKnownPreview,
  ready,
  stopPreview,
  browser,
} from './support.ts';

test('官方预览 URL、真实状态 / 交互、同 child 复用与自身停止', async () => {
  const { target, output } = uiTarget('preview');
  const probe = createServer();
  probe.listen(6113, '127.0.0.1');
  await once(probe, 'listening');
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  const service = launchPreview(target, output);
  try {
    const index = await ready(service);
    fs.writeFileSync(path.join(output, 'story-index.json'), JSON.stringify(index, null, 2));
    assert.equal(useKnownPreview(target, service).child, service.child);
    assert.throws(() => useKnownPreview(path.join(target, 'other'), service), /另一目标/);
    const preview = tool(target, output, [
      'tools',
      'stories',
      'preview',
      '--attach',
      '--port',
      '6113',
      '--input',
      JSON.stringify({ stories: [{ storyId: 'proof-counter--basic' }] }),
      '--json',
    ]);
    const url = JSON.parse(preview.stdout).stories[0].previewUrl;
    assert.ok(url && new URL(url).port === '6113');
    browser(target, output, '次数：', url);
    const missing = tool(target, output, [
      'tools',
      'stories',
      'preview',
      '--attach',
      '--port',
      '6113',
      '--input',
      JSON.stringify({ stories: [{ storyId: 'missing--story' }] }),
      '--json',
    ]);
    assert.ok(JSON.parse(missing.stdout).stories[0].error);
  } finally {
    if (service.child.exitCode === null && service.child.signalCode === null)
      await stopPreview(service, output);
  }
  assert.throws(() => useKnownPreview(target, service), /活跃 child/);
  assert.equal(service.child.exitCode === null && service.child.signalCode === null, false);
});

test('未知端口 / 空索引 / 同 ID 异目标不赋予复用和停止；外部服务仍存活', async () => {
  const { target, output } = uiTarget('unknown-service');
  let index: object = { entries: {} };
  const external = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(index));
  });
  external.listen(6113, '127.0.0.1');
  await once(external, 'listening');
  try {
    for (const entries of [
      {},
      {
        'proof-counter--basic': { type: 'story' },
        'proof-counter--disabled': { type: 'story' },
      },
    ]) {
      index = { entries };
      assert.equal((await fetch('http://127.0.0.1:6113/index.json')).status, 200);
      assert.throws(() => useKnownPreview(target), /未知服务/);
      assert.ok(external.listening);
    }
    // 该外部服务的真实启动来源是本场景的 HTTP server，未授予目标 child 身份。
    fs.writeFileSync(
      path.join(output, 'external-service.json'),
      JSON.stringify({
        source: 'controlled-http-server',
        target: 'another-target',
        sameStoryIds: true,
        automaticReuse: false,
        automaticStop: false,
        stillListening: external.listening,
      }),
    );
    assert.equal((await fetch('http://127.0.0.1:6113/index.json')).status, 200);
  } finally {
    await new Promise<void>((resolve) => external.close(() => resolve()));
  }
  // 外部 owner 已明确提供真实目标与活跃 child，客户端只复用，不取得停止权。
  const ownedByExternal = launchPreview(target, output);
  try {
    await ready(ownedByExternal);
    const clientTarget = path.join(path.dirname(target), 'preview');
    assert.throws(() => useKnownPreview(clientTarget, ownedByExternal), /另一目标/);
    browser(target, output, '次数：');
    assert.equal(ownedByExternal.child.exitCode, null);
    assert.equal((await fetch('http://127.0.0.1:6113/index.json')).status, 200);
    fs.writeFileSync(
      path.join(output, 'confirmed-external-reuse.json'),
      JSON.stringify(
        {
          target,
          config: '.storybook/main.ts',
          script: 'preview:components',
          ownerChildPid: ownedByExternal.child.pid,
          clientTarget,
          clientStoppedService: false,
          stillAvailableAfterClientBrowserClosed: true,
        },
        null,
        2,
      ),
    );
  } finally {
    // 测试 owner 收尾自己的 child；此处不是客户端自动停止外部服务。
    if (ownedByExternal.child.exitCode === null && ownedByExternal.child.signalCode === null)
      await stopPreview(ownedByExternal, output);
  }
});
