import type { TriggerEvent, TriggerEventStatus } from '@netscript/plugin-triggers-core/domain';

/** Persisted event filters accepted by the triggers service. */
export type TriggerEventQuery = Readonly<{
  triggerId?: string;
  status?: TriggerEventStatus;
  limit?: number;
}>;

/** Persisted trigger event page returned by the triggers service. */
export type TriggerEventPage = Readonly<{
  events: readonly TriggerEvent[];
  total: number;
  limit: number;
  offset: number;
}>;

/** Authoritative trigger state returned by enable/disable procedures. */
export type TriggerEnabledResponse = Readonly<{
  id: string;
  enabled: boolean;
}>;

/** Runtime definition state returned by the service list procedure. */
export type TriggerRuntimeState = Readonly<{
  id: string;
  enabled: boolean;
}>;

/** Running triggers-service operations consumed by the local CLI backend. */
export interface TriggersServiceClient {
  /** List runtime trigger state from the authoritative service. */
  listTriggers(enabled?: boolean): Promise<readonly TriggerRuntimeState[]>;
  /** List persisted events from the service event ledger. */
  listEvents(query?: TriggerEventQuery): Promise<TriggerEventPage>;
  /** Set authoritative enabled state through the service procedure. */
  setEnabled(id: string, enabled: boolean): Promise<TriggerEnabledResponse>;
}

/** Fetch-compatible function injected for tests and alternate HTTP runtimes. */
export type TriggersFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

/** Options for the HTTP triggers service adapter. */
export type HttpTriggersServiceOptions = Readonly<{
  baseUrl?: string;
  fetch?: TriggersFetch;
}>;

/** HTTP adapter for the running triggers service contract. */
export class HttpTriggersService implements TriggersServiceClient {
  readonly #baseUrl?: string;
  readonly #fetch: TriggersFetch;

  /** Create a service adapter targeting an explicit or Aspire-discovered triggers API. */
  constructor(options: HttpTriggersServiceOptions = {}) {
    const discoveredUrl = options.baseUrl ??
      Deno.env.get('services__triggers-api__https__0') ??
      Deno.env.get('services__triggers-api__http__0') ??
      Deno.env.get('TRIGGERS_API_URL') ??
      Deno.env.get('NETSCRIPT_TRIGGERS_URL');
    this.#baseUrl = discoveredUrl === undefined
      ? undefined
      : `${discoveredUrl.replace(/\/$/, '')}/api/v1`.replace('/api/v1/api/v1', '/api/v1');
    this.#fetch = options.fetch ?? fetch;
  }

  async listTriggers(enabled?: boolean): Promise<readonly TriggerRuntimeState[]> {
    const url = this.#apiUrl('/triggers/triggers');
    if (enabled !== undefined) url.searchParams.set('enabled', String(enabled));
    const page = await this.#request<Readonly<{ triggers: readonly TriggerRuntimeState[] }>>(url);
    return page.triggers;
  }

  async listEvents(query: TriggerEventQuery = {}): Promise<TriggerEventPage> {
    const url = this.#apiUrl('/events');
    if (query.triggerId !== undefined) url.searchParams.set('triggerId', query.triggerId);
    if (query.status !== undefined) url.searchParams.set('status', query.status);
    if (query.limit !== undefined) url.searchParams.set('limit', String(query.limit));
    return await this.#request<TriggerEventPage>(url);
  }

  async setEnabled(id: string, enabled: boolean): Promise<TriggerEnabledResponse> {
    const verb = enabled ? 'enable' : 'disable';
    return await this.#request<TriggerEnabledResponse>(
      this.#apiUrl(`/triggers/triggers/${encodeURIComponent(id)}/${verb}`),
      { method: 'POST' },
    );
  }

  #apiUrl(path: string): URL {
    if (this.#baseUrl === undefined) {
      throw new Error(
        'Triggers API endpoint was not discovered. Configure an Aspire service reference or TRIGGERS_API_URL.',
      );
    }
    return new URL(`${this.#baseUrl}${path}`);
  }

  async #request<T>(url: URL, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await this.#fetch(url, init);
    } catch (cause) {
      throw new Error(`Unable to reach triggers service at ${url.origin}.`, { cause });
    }
    const body = await readResponseBody(response);
    if (!response.ok) {
      throw new Error(
        `Triggers service ${response.status}: ${responseMessage(body) ?? response.statusText}`,
      );
    }
    return body as T;
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function responseMessage(body: unknown): string | undefined {
  if (typeof body === 'string') return body;
  if (typeof body !== 'object' || body === null) return undefined;
  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}
