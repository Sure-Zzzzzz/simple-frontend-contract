/** 订阅方调用后释放监听关系，避免宿主或应用保留失效监听器。 */
export type Release = () => void;

/** 统一表达可判别的成功或失败结果，不携带领域错误模型。 */
export type ContractResult<T, E = ContractError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/** 中性错误信封；`details` 的字段含义由领域包或应用自行定义。 */
export interface ContractError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 跨运行时传递的中性事件信封。
 *
 * `payload` 保持未知类型，避免基础层提前固定领域数据；消费者应根据事件名称和版本解析它。
 */
export interface VersionedEvent<TPayload = unknown> {
  name: string;
  version: number;
  source: string;
  recipient?: string;
  payload: TPayload;
}

/** 仅表示普通键值容器，不代表其中的业务配置已经完成校验。 */
export interface RuntimeConfiguration {
  [key: string]: unknown;
}

/** 宿主显式注入的请求能力；鉴权、重试、错误转换和响应解析不属于基础契约默认职责。 */
export interface RuntimeRequest {
  request<TResponse>(input: {
    method: string;
    path: string;
    body?: unknown;
    signal?: AbortSignal;
  }): Promise<TResponse>;
}

/** 宿主显式注入的导航能力。 */
export interface RuntimeNavigation {
  navigate(path: string): void;
}

/** 宿主显式注入的用户反馈能力。 */
export interface RuntimeNotification {
  notify(input: {
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
  }): void;
}

/**
 * 应用可选使用的宿主能力集合。
 *
 * 基础包不读取浏览器全局对象；能力缺失时由调用方显式决定降级、提示或拒绝继续。
 */
export interface RuntimeContext {
  request?: RuntimeRequest;
  navigation?: RuntimeNavigation;
  notification?: RuntimeNotification;
  configuration?: RuntimeConfiguration;
}

/**
 * 可读取、可订阅的值来源。
 *
 * 每次 `subscribe` 后由订阅方负责调用返回的 `Release`，基础包不隐式管理订阅生命周期。
 */
export interface Subscription<TValue> {
  current(): TValue;
  subscribe(listener: (value: TValue) => void): Release;
}

/** 创建成功分支，供调用方通过 `ok` 完成类型收窄。 */
export function success<T>(value: T): ContractResult<T> {
  return { ok: true, value };
}

/** 创建失败分支，保留调用方提供的中性错误类型。 */
export function failure<E extends ContractError>(error: E): ContractResult<never, E> {
  return { ok: false, error };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 仅接受完整的中性事件信封。
 *
 * 它验证信封字段与版本边界，不解析领域 payload；未知事件名称或版本由消费者或领域包处理。
 */
export function isVersionedEvent(value: unknown): value is VersionedEvent {
  if (!isPlainRecord(value)) {
    return false;
  }
  return hasOwn(value, 'name')
    && isNonBlankString(value.name)
    && hasOwn(value, 'version')
    && typeof value.version === 'number'
    && Number.isInteger(value.version)
    && value.version > 0
    && hasOwn(value, 'source')
    && isNonBlankString(value.source)
    && (!hasOwn(value, 'recipient') || isNonBlankString(value.recipient))
    && hasOwn(value, 'payload')
    && value.payload !== undefined;
}

/**
 * 仅接受普通记录或无原型记录作为运行时配置容器。
 *
 * 拒绝内建对象和类实例，避免把携带行为或原型状态的对象误当作可跨边界传递的配置。
 */
export function isRuntimeConfiguration(value: unknown): value is RuntimeConfiguration {
  return isPlainRecord(value);
}
