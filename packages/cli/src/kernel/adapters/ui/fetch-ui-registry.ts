import type { UiRegistryTransportPort } from '../../ports/ui-registry-port.ts';
import { uiRegistryUrl } from '../../domain/ui/ui-config.ts';

/** Resolve credentials only when issuing a request, with no secret-bearing diagnostics. */
export class FetchUiRegistry implements UiRegistryTransportPort {
  constructor(
    private readonly environment: (name: string) => string | undefined = (name) =>
      Deno.env.get(name),
    private readonly request: typeof fetch = fetch,
  ) {}

  async read(
    url: string,
    templates: Readonly<Record<string, string>>,
    signal?: AbortSignal,
  ): Promise<string> {
    const target = uiRegistryUrl(url);
    const headers = new Headers();
    for (const [name, template] of Object.entries(templates)) {
      const value = template.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, key: string) => {
        const resolved = this.environment(key);
        if (resolved === undefined) {
          throw new Error(`Missing registry environment variable: ${key}`);
        }
        return resolved;
      });
      try {
        headers.set(name, value);
      } catch {
        throw new Error('Invalid registry header template');
      }
    }
    let response: Response;
    try {
      response = await this.request(target, { headers, redirect: 'error', signal });
    } catch {
      signal?.throwIfAborted();
      throw new Error('Registry request failed');
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Registry request failed with HTTP ${response.status}`);
    }
    return await response.text();
  }
}
