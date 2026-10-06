import type * as Contract from '@sure-zzzzzz/simple-frontend-contract';

const contract: typeof Contract | undefined = undefined;
void contract;

type RequestInput = Parameters<Contract.RuntimeRequest['request']>[0];

// 已有宿主可以保留原有输入形态；新增请求头不迫使旧实现增加必填字段。
const legacyRequest: Contract.RuntimeRequest = {
  request<TResponse>(input: { method: string; path: string; body?: unknown; signal?: AbortSignal }): Promise<TResponse> {
    void input;
    return Promise.resolve(undefined as TResponse);
  }
};

function verifyRequest(request: Contract.RuntimeRequest) {
  void request.request<unknown>({ method: 'GET', path: '/resources' });
  void request.request<unknown>({
    method: 'PUT',
    path: '/resources/item-1',
    body: { name: 'resource' },
    headers: { 'If-Match': '"7"' },
    signal: new AbortController().signal
  });
}

function verifyReadonlyHeaders(input: RequestInput) {
  if (input.headers) {
    // @ts-expect-error 请求头为只读，宿主不能原地改写调用方输入。
    input.headers['If-Match'] = '"8"';
  }
}

void legacyRequest;
void verifyRequest;
void verifyReadonlyHeaders;
