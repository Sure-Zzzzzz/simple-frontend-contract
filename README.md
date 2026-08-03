# simple-frontend-contract

前端工程基座仓库，统一维护可发布 npm 包的开发规范、通用 TypeScript 契约、Vue/Vite 应用模板和质量验证脚手架。

## 内容边界

| 内容 | 位置 | 用途 |
| --- | --- | --- |
| 通用前端契约 | `packages/frontend-contract` | 结果、错误、事件、运行时能力与可释放订阅的中性类型 |
| Vue/Vite 模板 | `templates/vue-vite` | 新建业务前端的工程起点 |
| 开发规范 | `npm开发规范.md` | 所有本仓前端 npm 模块与模板的强制规则 |

本仓不定义 IAM、AKSK、Cookie、CSRF、OAuth、用户、权限、菜单、业务 API、固定后端地址或特定微前端框架。相关领域能力在协议稳定后建立独立包，应用按需引用。

## 当前版本

当前是 Git `1.0.0` 基线，已完成本地 workspace 与实际 tarball 消费验证，但尚未发布到 npm Registry。本次仅提交 Git；npm 发布能力保留给后续明确的发布操作。以下安装方式仅适用于 npm Registry 发布后：

```bash
pnpm add @sure-zzzzzz/simple-frontend-contract
```

## 使用 Vue/Vite 模板

复制 `templates/vue-vite` 到新应用目录后执行：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

模板只提供中性工程配置和示例页面。业务应用自行确定端口、后端代理、身份认证、领域 API、主题与微前端运行时，不得把暂定实现反向写入模板。

## 本地验证

```bash
pnpm install
pnpm check
```

## 许可证

[Apache License 2.0](LICENSE)。
