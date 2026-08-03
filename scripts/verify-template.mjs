import { cp, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const template = resolve(root, 'templates/vue-vite');
const target = await mkdtemp(join(tmpdir(), 'simple-frontend-template-'));
const browserCache = await mkdtemp(join(tmpdir(), 'simple-frontend-playwright-'));
const corepack = process.platform === 'win32' ? 'corepack.cmd' : 'corepack';

function run(args) {
  execFileSync(corepack, ['pnpm', ...args], {
    cwd: target,
    env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browserCache },
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
}

try {
  await cp(template, target, {
    recursive: true,
    filter: source => !['node_modules', 'dist', 'coverage', 'playwright-report', 'test-results'].includes(source.split(/[\\/]/).at(-1))
  });
  run(['install', '--ignore-workspace', '--frozen-lockfile']);
  // 浏览器运行时也置于隔离目录，避免质量门依赖开发机已有的 Playwright 缓存。
  run(['exec', 'playwright', 'install', 'chromium']);
  run(['check']);
} finally {
  await rm(target, { recursive: true, force: true });
  await rm(browserCache, { recursive: true, force: true });
}
