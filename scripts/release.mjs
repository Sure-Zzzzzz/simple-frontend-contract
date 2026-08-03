import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageDirectory = resolve(root, process.argv[2] || '');
const metadata = JSON.parse(await readFile(resolve(packageDirectory, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const tag = `${metadata.name}@${metadata.version}`;

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options
  });
}

run(process.execPath, [resolve(root, 'scripts/release-verify.mjs'), packageDirectory]);
try {
  run(npm, ['whoami', '--registry', 'https://registry.npmjs.org'], { shell: process.platform === 'win32' });
} catch {
  throw new Error('尚未登录 npm，请先在本机执行 npm login --registry=https://registry.npmjs.org 后重试。');
}
run(npm, ['publish', '--access', 'public', '--registry', 'https://registry.npmjs.org'], {
  cwd: packageDirectory,
  shell: process.platform === 'win32'
});
try {
  run('git', ['tag', '-a', tag, '-m', `发布 ${metadata.name}@${metadata.version}`]);
  console.log(`npm 已发布并创建本地标签 ${tag}。请确认后手动执行 git push origin ${tag}。`);
} catch {
  // npm 发布不可覆盖；标签失败后只能修复 Git 并补建/推送标签，绝不能重复发布该版本。
  console.error(`npm 已成功发布 ${metadata.name}@${metadata.version}，但本地标签 ${tag} 创建失败。请修复 Git 状态后补建标签；不要重复执行 npm publish。`);
  process.exitCode = 1;
}
