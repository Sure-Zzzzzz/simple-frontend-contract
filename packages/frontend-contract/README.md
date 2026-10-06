# simple-frontend-contract

面向前端应用和宿主运行时的中性、版本化 TypeScript 契约。

本包只定义通用结果、错误、事件、配置、可释放订阅与宿主能力接口；不定义身份、会话、权限、Cookie、CSRF、OAuth、AKSK、业务接口、固定地址、Portal 或具体微前端框架。

## 当前状态

当前是 Git `1.0.0` 基线，已通过本地 workspace 和实际 tarball 消费验证，尚未发布到 npm Registry。本次仅提交 Git；在 npm Registry 发布后，消费者才可安装：

```bash
pnpm add @sure-zzzzzz/simple-frontend-contract
```

## 使用

```ts
import {
  isVersionedEvent,
  success,
  type RuntimeContext,
  type VersionedEvent
} from '@sure-zzzzzz/simple-frontend-contract';

const result = success({ id: 'resource-1' });

function receive(event: unknown, context: RuntimeContext) {
  if (!isVersionedEvent(event)) {
    return;
  }
  const typedEvent: VersionedEvent = event;
  context.notification?.notify({ level: 'info', message: typedEvent.name });
}
```

## 契约边界

- `RuntimeContext` 由宿主显式实现和注入。缺少某项能力时，调用方自行决定降级、提示或拒绝继续；基础包不会读取浏览器全局对象。
- `RuntimeRequest` 只描述请求调用形态，不默认承担鉴权、重试、错误转换或响应 schema 校验。输入包含 `method`、`path` 以及可选的 `body`、`headers`、`signal`；`headers` 是只读字符串记录，可表达 `If-Match` 等请求条件。不传请求头的旧调用和旧宿主实现保持类型兼容；需要请求头的业务必须接入明确支持该请求头的宿主，不能依赖旧宿主自动转发。允许哪些请求头、如何合并及如何保护宿主控制的认证等请求头，由宿主决定。
- `isVersionedEvent` 只验证完整的中性事件信封：名称、来源、可选接收方、正整数版本和非 `undefined` 的 payload。它不解析 payload，未知名称或版本由消费者或领域包处理。
- `isRuntimeConfiguration` 只验证普通记录对象或无原型记录对象；其中业务字段的类型、默认值和兼容性由领域包或应用独立解析。
- `Subscription.subscribe` 返回的释放函数由订阅方负责调用；不要依赖基础包替应用管理订阅生命周期。

## 兼容性

公开类型、事件字段和运行时能力接口均遵循 SemVer。消费者只能依赖 `package.json.exports` 声明的入口，不得深层导入源码或构建内部文件。

## 许可证

[Apache License 2.0](LICENSE)。
