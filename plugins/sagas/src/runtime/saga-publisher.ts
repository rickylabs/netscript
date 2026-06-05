import type {
  SagaCorrelationKey,
  SagaMessage,
  SagaMessageId,
} from '@netscript/plugin-sagas-core/domain';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import type {
  SagaPublisherPort,
  SagaPublisherPublishManyOptions,
  SagaPublisherPublishOptions,
  SagaPublisherRejected,
  SagaPublisherResult,
} from '@netscript/plugin-sagas-core/integration/publisher';

import { SAGAS_API_DEFAULT_PORT, SAGAS_API_SERVICE_NAME } from '../constants.ts';

/** JSON primitive accepted by the saga HTTP publisher. */
export type SagaPublisherJsonPrimitive = string | number | boolean | null;

/** JSON value accepted by the saga HTTP publisher. */
export type SagaPublisherJsonValue =
  | SagaPublisherJsonPrimitive
  | readonly SagaPublisherJsonValue[]
  | { readonly [key: string]: SagaPublisherJsonValue };

/** JSON object sent as a saga message payload. */
export type SagaPublisherJsonObject = Readonly<Record<string, SagaPublisherJsonValue>>;

/** Fetch boundary used by the HTTP saga publisher. */
export type SagaPublisherFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Environment lookup boundary used for Aspire service discovery. */
export type SagaPublisherEnvReader = (name: string) => string | undefined;

/** Options for the plugin-layer HTTP saga publisher. */
export type HttpSagaPublisherOptions = Readonly<{
  id?: string;
  serviceName?: string;
  baseUrl?: string;
  publishPath?: string;
  headers?: Readonly<Record<string, string>>;
  fetcher?: SagaPublisherFetch;
  readEnv?: SagaPublisherEnvReader;
  retryableStatusCodes?: readonly number[];
}>;

type PublishHttpInput = Readonly<{
  type: string;
  payload?: SagaPublisherJsonObject;
  correlationId?: string;
  correlationKey?: string;
  idempotencyKey?: string;
  concurrencyKey?: string;
  topic?: string;
  traceparent?: string;
  tracestate?: string;
}>;

type PublishHttpResponse = Readonly<{
  published: boolean;
  messageType: string;
  correlationId?: string;
  correlationKey?: string;
  messageId?: string;
}>;

const DEFAULT_PUBLISH_PATH = '/api/v1/sagas/publish' as const;
const DEFAULT_PUBLISHER_ID = 'http-saga-publisher' as const;
const DEFAULT_RETRYABLE_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504] as const;

/** Create a plugin-layer HTTP publisher for sagas API publish endpoints. */
export function createSagaPublisher<TMessage extends SagaMessage = SagaMessage>(
  options: HttpSagaPublisherOptions = {},
): SagaPublisherPort<TMessage> {
  return new HttpSagaPublisher<TMessage>(options);
}

/** HTTP implementation of the saga publisher port. */
export class HttpSagaPublisher<TMessage extends SagaMessage = SagaMessage>
  implements SagaPublisherPort<TMessage> {
  readonly id: string;

  private readonly serviceName: string;
  private readonly baseUrl?: string;
  private readonly publishPath: string;
  private readonly headers: Readonly<Record<string, string>>;
  private readonly fetcher: SagaPublisherFetch;
  private readonly readEnv: SagaPublisherEnvReader;
  private readonly retryableStatusCodes: readonly number[];

  constructor(options: HttpSagaPublisherOptions = {}) {
    this.id = options.id ?? DEFAULT_PUBLISHER_ID;
    this.serviceName = options.serviceName ?? SAGAS_API_SERVICE_NAME;
    this.baseUrl = options.baseUrl;
    this.publishPath = normalizePath(options.publishPath ?? DEFAULT_PUBLISH_PATH);
    this.headers = Object.freeze(options.headers ?? {});
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
    this.readEnv = options.readEnv ?? ((name: string): string | undefined => Deno.env.get(name));
    this.retryableStatusCodes = options.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
  }

  /** Publish one saga message to the configured sagas API endpoint. */
  async publish<TNextMessage extends TMessage>(
    message: TNextMessage,
    options: SagaPublisherPublishOptions = {},
  ): Promise<SagaPublisherResult<TNextMessage['type']>> {
    try {
      const input = createPublishHttpInput(message, options);
      const response = await this.fetcher(this.publishUrl(), {
        body: JSON.stringify(input),
        headers: createPublishHeaders(this.headers, message, options),
        method: 'POST',
      });

      if (!response.ok) {
        return rejectedResult(
          message,
          options,
          `Saga publish failed with ${response.status} ${response.statusText}`,
          this.retryableStatusCodes.includes(response.status),
        );
      }

      return acceptedResult(message, parsePublishResponse(await response.text()));
    } catch (cause) {
      return rejectedResult(
        message,
        options,
        cause instanceof Error ? cause.message : 'Saga publish failed.',
        isRetryable(cause),
      );
    }
  }

  /** Publish multiple messages sequentially by default or concurrently when requested. */
  publishMany<TNextMessage extends TMessage>(
    messages: readonly TNextMessage[],
    options: SagaPublisherPublishManyOptions = {},
  ): Promise<readonly SagaPublisherResult<TNextMessage['type']>[]> {
    const publishOptions = {
      topic: options.topic,
      traceparent: options.traceparent,
      tracestate: options.tracestate,
    } satisfies SagaPublisherPublishOptions;

    if (options.mode === 'parallel') {
      return Promise.all(messages.map((message) => this.publish(message, publishOptions)));
    }

    return messages.reduce<Promise<readonly SagaPublisherResult<TNextMessage['type']>[]>>(
      async (previous, message) => [...await previous, await this.publish(message, publishOptions)],
      Promise.resolve([]),
    );
  }

  private publishUrl(): string {
    return joinUrl(
      resolveServiceUrl(this.serviceName, this.baseUrl, this.readEnv),
      this.publishPath,
    );
  }
}

function createPublishHttpInput<TMessage extends SagaMessage>(
  message: TMessage,
  options: SagaPublisherPublishOptions,
): PublishHttpInput {
  return Object.freeze({
    type: message.type,
    payload: normalizePayload(message.payload),
    correlationId: options.correlationKey ?? message.correlationKey,
    correlationKey: options.correlationKey ?? message.correlationKey,
    idempotencyKey: options.idempotencyKey ?? message.idempotencyKey,
    concurrencyKey: options.concurrencyKey,
    topic: options.topic,
    traceparent: options.traceparent ?? message.traceparent,
    tracestate: options.tracestate ?? message.tracestate,
  });
}

function normalizePayload(payload: unknown): SagaPublisherJsonObject | undefined {
  if (payload === undefined) {
    return undefined;
  }
  const value = toJsonValue(payload, 'payload');
  if (isJsonObject(value)) {
    return value;
  }
  return Object.freeze({ value });
}

function toJsonValue(value: unknown, path: string): SagaPublisherJsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw SagasError.validationFailed(`${path} must contain only finite JSON numbers.`);
    }
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item, index) => toJsonValue(item, `${path}[${index}]`)));
  }
  if (isRecord(value)) {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toJsonValue(item, `${path}.${key}`)]),
    )) as SagaPublisherJsonObject;
  }
  throw SagasError.validationFailed(`${path} contains a value that cannot be serialized as JSON.`);
}

function parsePublishResponse(body: string): PublishHttpResponse {
  const parsed = body.length === 0 ? {} : JSON.parse(body) as unknown;
  if (!isRecord(parsed)) {
    throw SagasError.validationFailed('Saga publish response must be a JSON object.');
  }
  const messageType = parsed.messageType;
  if (typeof messageType !== 'string' || messageType.length === 0) {
    throw SagasError.validationFailed('Saga publish response must include messageType.');
  }
  return Object.freeze({
    published: parsed.published === true,
    messageType,
    correlationId: optionalString(parsed.correlationId),
    correlationKey: optionalString(parsed.correlationKey),
    messageId: optionalString(parsed.messageId),
  });
}

function acceptedResult<TMessage extends SagaMessage>(
  message: TMessage,
  response: PublishHttpResponse,
): SagaPublisherResult<TMessage['type']> {
  if (!response.published) {
    return rejectedResult(message, {}, 'Saga API rejected the publish request.', false);
  }
  return Object.freeze({
    published: true,
    messageType: response.messageType as TMessage['type'],
    messageId: (response.messageId ?? message.id) as SagaMessageId | undefined,
    correlationKey: (response.correlationKey ?? response.correlationId ?? message.correlationKey) as
      | SagaCorrelationKey
      | undefined,
    acceptedAt: new Date(),
  });
}

function rejectedResult<TMessage extends SagaMessage>(
  message: TMessage,
  options: SagaPublisherPublishOptions,
  reason: string,
  retryable: boolean,
): SagaPublisherRejected<TMessage['type']> {
  return Object.freeze({
    published: false,
    messageType: message.type,
    messageId: message.id,
    correlationKey: options.correlationKey ?? message.correlationKey,
    reason,
    retryable,
  });
}

function createPublishHeaders<TMessage extends SagaMessage>(
  headers: Readonly<Record<string, string>>,
  message: TMessage,
  options: SagaPublisherPublishOptions,
): HeadersInit {
  return {
    ...headers,
    'content-type': headers['content-type'] ?? 'application/json',
    ...optionalHeader('traceparent', options.traceparent ?? message.traceparent),
    ...optionalHeader('tracestate', options.tracestate ?? message.tracestate),
  };
}

function optionalHeader(name: string, value: string | undefined): Readonly<Record<string, string>> {
  return value === undefined ? Object.freeze({}) : Object.freeze({ [name]: value });
}

function resolveServiceUrl(
  serviceName: string,
  baseUrl: string | undefined,
  readEnv: SagaPublisherEnvReader,
): string {
  return normalizeBaseUrl(
    baseUrl ??
      readEnv(`services__${serviceName}__https__0`) ??
      readEnv(`services__${serviceName}__http__0`) ??
      readEnv('SAGAS_API_URL') ??
      readEnv('NETSCRIPT_SAGAS_URL') ??
      `http://127.0.0.1:${SAGAS_API_DEFAULT_PORT}`,
  );
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}${normalizePath(path)}`;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}

function normalizePath(value: string): string {
  return value.startsWith('/') ? value : `/${value}`;
}

function isRetryable(cause: unknown): boolean {
  return cause instanceof SagasError ? cause.retryable : true;
}

function isJsonObject(value: SagaPublisherJsonValue): value is SagaPublisherJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
