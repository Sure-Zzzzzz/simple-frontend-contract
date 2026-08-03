import {
  failure,
  isRuntimeConfiguration,
  isVersionedEvent,
  success
} from '@sure-zzzzzz/simple-frontend-contract';

const result = success({ id: 'resource-1' });
const error = failure({ code: 'INVALID_INPUT', message: '输入无效' });
const event = { name: 'resource.updated', version: 1, source: 'consumer', payload: result };
const configuration = { featureEnabled: true };
if (!result.ok || error.ok || !isVersionedEvent(event) || !isRuntimeConfiguration(configuration)) {
  throw new Error('公开契约消费者验证失败。');
}
