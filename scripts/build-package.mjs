import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageDirectory = resolve(root, process.argv[2] || '');

// 清理旧制品，避免已删除的入口或 source map 被 npm pack 意外带入。
await rm(resolve(packageDirectory, 'dist'), { recursive: true, force: true });
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'], {
  cwd: packageDirectory,
  stdio: 'inherit'
});
