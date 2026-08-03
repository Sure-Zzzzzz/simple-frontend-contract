import { execFileSync } from 'node:child_process';
import { access, copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageDirectory = resolve(root, process.argv[2] || '');
const metadata = JSON.parse(await readFile(resolve(packageDirectory, 'package.json'), 'utf8'));
const tempDirectory = await mkdtemp(join(tmpdir(), 'simple-frontend-contract-consumer-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options
  });
  return typeof output === 'string' ? output.trim() : '';
}

function fail(message) {
  throw new Error(`npm 制品校验失败：${message}`);
}

function normalizeTarget(target) {
  if (typeof target !== 'string' || !target.startsWith('./')) {
    fail(`公开入口必须使用包内相对路径：${String(target)}。`);
  }
  const normalized = target.slice(2).replaceAll('\\', '/');
  if (!normalized || normalized.includes('*') || normalized.includes('..') || normalized.startsWith('/') || normalized.includes('/src/') || normalized.includes('.test.')) {
    fail(`公开入口包含不安全或未构建路径：${target}。`);
  }
  return normalized;
}

function collectExportTargets(value, targets) {
  if (typeof value === 'string') {
    targets.add(normalizeTarget(value));
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('exports 只能由字符串目标或条件对象组成。');
  }
  for (const [condition, target] of Object.entries(value)) {
    if (!condition || condition.startsWith('#')) {
      fail(`exports 条件无效：${condition}。`);
    }
    collectExportTargets(target, targets);
  }
}

function collectEntryTargets(exportsField) {
  if (!exportsField || typeof exportsField !== 'object' || Array.isArray(exportsField)) {
    fail('必须声明对象形式的 exports。');
  }
  const entries = new Map();
  for (const [entry, conditions] of Object.entries(exportsField)) {
    if ((entry !== '.' && !entry.startsWith('./')) || entry.includes('*')) {
      fail(`exports 入口无效：${entry}。`);
    }
    const targets = new Set();
    collectExportTargets(conditions, targets);
    entries.set(entry, targets);
  }
  if (!entries.has('.')) {
    fail('exports 缺少根入口。');
  }
  return entries;
}

function exportTarget(value, condition) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const target = value[condition];
  return typeof target === 'string' ? normalizeTarget(target) : undefined;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const entries = collectEntryTargets(metadata.exports);
const rootExport = metadata.exports['.'];
const main = normalizeTarget(metadata.main);
const types = normalizeTarget(metadata.types);
if (exportTarget(rootExport, 'import') !== main) {
  fail('main 必须与根 exports.import 指向同一构建文件。');
}
if (exportTarget(rootExport, 'types') !== types) {
  fail('types 必须与根 exports.types 指向同一声明文件。');
}
const targets = new Set([main, types]);
for (const entryTargets of entries.values()) {
  for (const target of entryTargets) {
    targets.add(target);
  }
}

const fixtureType = resolve(packageDirectory, 'consumer.ts');
const fixtureRuntime = resolve(packageDirectory, 'consumer.mjs');
if (!await exists(fixtureType) || !await exists(fixtureRuntime)) {
  fail('缺少包内 consumer.ts 或 consumer.mjs 消费者夹具。');
}

let tarball;
try {
  const packages = JSON.parse(run(npm, ['pack', '--json'], {
    cwd: packageDirectory,
    shell: process.platform === 'win32'
  }));
  if (!Array.isArray(packages) || packages.length !== 1 || typeof packages[0].filename !== 'string') {
    fail('无法生成 npm 压缩包。');
  }
  tarball = resolve(packageDirectory, packages[0].filename);

  const files = Array.isArray(packages[0].files) ? packages[0].files.map(file => file.path) : [];
  const allowed = new Set(['README.md', 'LICENSE', 'NOTICE', 'package.json', ...targets]);
  for (const target of targets) {
    if (!files.includes(target)) {
      fail(`npm 制品缺少公开入口目标 ${target}。`);
    }
  }
  const invalid = files.filter(path => !allowed.has(path));
  if (invalid.length > 0) {
    fail(`npm 制品包含未声明文件：${invalid.join('、')}。`);
  }

  await writeFile(join(tempDirectory, 'package.json'), JSON.stringify({ type: 'module' }));
  run(npm, ['install', '--ignore-scripts', '--no-package-lock', tarball], {
    cwd: tempDirectory,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  const typeImports = [...entries.keys()]
    .map((entry, index) => `import type * as Entry${index} from '${metadata.name}${entry === '.' ? '' : entry.slice(1)}';`)
    .join('\n');
  const typeReferences = [...entries.keys()].map((_, index) => `void (undefined as typeof Entry${index} | undefined);`).join('\n');
  await writeFile(join(tempDirectory, 'exports.ts'), `${typeImports}\n${typeReferences}\n`);
  await copyFile(fixtureType, join(tempDirectory, 'consumer.ts'));
  run(process.execPath, [
    resolve(root, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--module', 'NodeNext',
    '--moduleResolution', 'NodeNext',
    '--target', 'ES2022',
    'exports.ts',
    'consumer.ts'
  ], { cwd: tempDirectory, stdio: 'inherit' });

  const runtimeEntries = [...entries.entries()]
    .filter(([, entryTargets]) => [...entryTargets].some(target => !target.endsWith('.d.ts')))
    .map(([entry]) => `${metadata.name}${entry === '.' ? '' : entry.slice(1)}`);
  await writeFile(join(tempDirectory, 'exports.mjs'), `await Promise.all(${JSON.stringify(runtimeEntries)}.map(entry => import(entry)));\n`);
  await copyFile(fixtureRuntime, join(tempDirectory, 'consumer.mjs'));
  run(process.execPath, ['exports.mjs'], { cwd: tempDirectory, stdio: 'inherit' });
  run(process.execPath, ['consumer.mjs'], { cwd: tempDirectory, stdio: 'inherit' });
} finally {
  if (tarball) {
    await rm(tarball, { force: true });
  }
  await rm(tempDirectory, { recursive: true, force: true });
}
