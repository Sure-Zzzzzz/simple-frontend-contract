import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageDirectory = resolve(root, process.argv[2] || '');
const metadata = JSON.parse(await readFile(resolve(packageDirectory, 'package.json'), 'utf8'));
const changelog = resolve(packageDirectory, `CHANGELOG.${metadata.version}.md`);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tag = `${metadata.name}@${metadata.version}`;

function fail(message) {
  throw new Error(`发布校验失败：${message}`);
}

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
  return typeof output === 'string' ? output.trim() : '';
}

function formalSemver(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function versionExistsInRegistry() {
  try {
    run(npm, ['view', `${metadata.name}@${metadata.version}`, 'version', '--registry', 'https://registry.npmjs.org'], {
      shell: process.platform === 'win32'
    });
    return true;
  } catch (error) {
    const stderr = typeof error.stderr === 'string' ? error.stderr : '';
    if (/E404|404 Not Found/i.test(stderr)) {
      return false;
    }
    fail('无法确认 npm Registry 中的版本状态，请检查网络和 npm Registry。');
  }
}

if (typeof metadata.name !== 'string' || !metadata.name.startsWith('@sure-zzzzzz/') || !formalSemver(metadata.version)) {
  fail('正式发布只接受 @sure-zzzzzz 域下无预发布标识的 SemVer 版本。');
}
if (metadata.version !== '1.0.0' && !await exists(changelog)) {
  fail(`缺少 CHANGELOG.${metadata.version}.md。`);
}
if (run('git', ['branch', '--show-current']) !== 'main') {
  fail('只能从 main 分支发布。');
}
if (run('git', ['status', '--porcelain'])) {
  fail('工作区或暂存区不干净，请先提交或处理当前变更。');
}
try {
  run('git', ['fetch', 'origin', 'main', '--tags']);
} catch {
  fail('无法读取 origin/main 或远端标签，请先确认远端和网络连接。');
}
if (run('git', ['rev-parse', 'HEAD']) !== run('git', ['rev-parse', 'origin/main'])) {
  fail('本地 main 必须与 origin/main 完全一致。');
}
if (run('git', ['tag', '--list', tag])) {
  fail(`本地已存在标签 ${tag}。`);
}
if (run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])) {
  fail(`远端已存在标签 ${tag}。`);
}
if (versionExistsInRegistry()) {
  fail(`npm Registry 已存在 ${metadata.name}@${metadata.version}，禁止覆盖发布。`);
}
try {
  run(process.platform === 'win32' ? 'corepack.cmd' : 'corepack', ['pnpm', '--dir', root, 'check'], {
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });
  run(process.execPath, [resolve(root, 'scripts/verify-package.mjs'), packageDirectory], { stdio: 'inherit' });
} catch {
  fail('质量门或 npm 消费者验证未通过。');
}
console.log(`发布预检通过：${metadata.name}@${metadata.version}`);
