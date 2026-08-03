# Vue/Vite 应用模板

该模板提供 Vue、Vite、TypeScript、Vitest、真实 ESLint、覆盖率、production build 和 Chromium 浏览器质量门。浏览器测试启动生产构建后的本地 preview，验证实际入口、核心交互、错误反馈、ARIA 关联和焦点恢复；它不调用外部服务。

复制后，业务应用自行定义路由、端口、后端代理、认证、主题、领域 API 与微前端运行时。不得将临时后端协议、客户数据、固定服务地址或认证材料写回模板。

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

`src/main.ts` 不参与 jsdom 覆盖率统计，因为浏览器质量门通过 production build 和 preview 实际启动它；其他生产源码仍由覆盖率统计。浏览器测试失败时产生的 trace 和截图仅用于本地诊断，不得提交或打入制品。
