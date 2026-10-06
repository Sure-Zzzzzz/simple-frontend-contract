# 1.0.1

- `RuntimeRequest` 新增可选 `headers` 字段：子应用可向宿主请求桥传入 `If-Match`、`If-None-Match` 等条件头，是否透传及如何合并由宿主实现决定，不覆盖宿主身份、Cookie、CSRF 等安全策略。
- 既有宿主与子应用不需要任何改动；不传 `headers` 时行为与 1.0.0 完全一致。
- 模板默认浏览器通道支持 `PLAYWRIGHT_CHANNEL=chrome/msedge` 指定本机浏览器，指定通道不额外下载 Chromium；制品验证脚本启用严格模式并使用独立临时 npm 缓存。
