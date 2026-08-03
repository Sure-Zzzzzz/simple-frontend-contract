import { describe, expect, it } from 'vitest';
import {
  failure,
  isRuntimeConfiguration,
  isVersionedEvent,
  success
} from './index.js';

describe('通用前端契约', () => {
  it('创建可判别的成功和失败结果', () => {
    const result = success({ id: 'item-1' });
    const error = failure({ code: 'INVALID_INPUT', message: '输入无效', details: { field: 'name' } });

    expect(result).toEqual({ ok: true, value: { id: 'item-1' } });
    expect(error).toEqual({
      ok: false,
      error: { code: 'INVALID_INPUT', message: '输入无效', details: { field: 'name' } }
    });
  });

  it.each([null, 'text', 0, [], new Date(), /event/])('拒绝非普通对象事件信封：%s', value => {
    expect(isVersionedEvent(value)).toBe(false);
  });

  it.each([null, false, 0, '', [], { id: 'item-1' }])('接受不预设领域结构的 payload：%s', payload => {
    expect(isVersionedEvent({
      name: 'resource.updated',
      version: 1,
      source: 'app-a',
      payload
    })).toBe(true);
  });

  it('只接受字段完整且值有效的版本化事件信封', () => {
    expect(isVersionedEvent({
      name: 'resource.updated',
      version: 1,
      source: 'app-a',
      recipient: 'app-b',
      payload: {}
    })).toBe(true);
    expect(isVersionedEvent({ name: 'resource.updated', version: 1, source: 'app-a' })).toBe(false);
    expect(isVersionedEvent({ name: 'resource.updated', version: 1, source: 'app-a', payload: undefined })).toBe(false);
    expect(isVersionedEvent({ name: ' ', version: 1, source: 'app-a', payload: {} })).toBe(false);
    expect(isVersionedEvent({ name: 'resource.updated', version: 1, source: '\t', payload: {} })).toBe(false);
    expect(isVersionedEvent({ name: 'resource.updated', version: 1, source: 'app-a', recipient: ' ', payload: {} })).toBe(false);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '1'])('拒绝非法事件版本：%s', version => {
    expect(isVersionedEvent({ name: 'resource.updated', version, source: 'app-a', payload: {} })).toBe(false);
  });

  it('拒绝通过原型链继承关键字段的事件', () => {
    const inherited = Object.create({
      name: 'resource.updated',
      version: 1,
      source: 'app-a',
      payload: {}
    }) as Record<string, unknown>;

    expect(isVersionedEvent(inherited)).toBe(false);
  });

  it('仅接受普通对象或无原型对象作为运行时配置', () => {
    expect(isRuntimeConfiguration({ featureEnabled: true })).toBe(true);
    expect(isRuntimeConfiguration(Object.assign(Object.create(null), { featureEnabled: true }))).toBe(true);
  });

  it.each([
    [],
    'configuration',
    null,
    new Date(),
    /configuration/,
    new Map(),
    new Set(),
    new (class Configuration {})()
  ])('拒绝非普通配置对象：%s', value => {
    expect(isRuntimeConfiguration(value)).toBe(false);
  });
});
