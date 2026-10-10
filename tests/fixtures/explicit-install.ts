import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.dependencies = { 'controlled-local-dep': 'file:./dependency' };
fs.writeFileSync('package.json', JSON.stringify(pkg));
const result = spawnSync(process.execPath, [process.argv[2], 'install', '--offline', '--ignore-scripts', '--store-dir', './store'], { stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
