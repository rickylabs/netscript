/**
 * Host port: what differs between "UI inside a webview" and "UI in the same
 * process as a GPU renderer". Everything above this port is shared.
 *
 * | Concern       | Webview (browser rules)                  | GPUIX (Deno process)                      |
 * | ------------- | ---------------------------------------- | ----------------------------------------- |
 * | Cookies       | Browser cookie jar, HttpOnly, same-origin | Jar in `@netscript/kv`, sent as Bearer    |
 * | Settings      | `localStorage`                            | `@netscript/kv` (Deno KV file)            |
 * | Native chrome | Deno Desktop bindings / fresh-ui desktop  | GPUIX renderer methods (in-process)       |
 */
export interface NativeCapabilities {
  setTitle(title: string): void;
  notify(title: string, body: string): void;
  copy(text: string): void;
  /** Resolves to a directory path, or null when cancelled. */
  pickDirectory(): Promise<string | null>;
  writeTextFile(path: string, text: string): Promise<void>;
  frameStats(): Record<string, number> | null;
}

export interface RuntimeInfo {
  readonly renderer: string;
  /** `native`: GPUIX-first variant (virtualized lists, live-update budget, adaptive frame pump). */
  readonly ui?: 'portable' | 'native';
  readonly runtime: string;
  readonly platform: string;
  memoryMb(): number | null;
}

export interface HostServices {
  /** Origin of the workspace service (embedded loopback or remote). */
  readonly baseUrl: string;
  /** Fetch that applies the host's cookie policy. */
  readonly fetch: typeof fetch;
  /**
   * Credentials for transports the host does not own (SDK client, stream).
   * Browsers own cookies, so a webview host returns `{}`. A native host bridges
   * its session cookie to `Authorization: Bearer`, because the NetScript SDK
   * reserves the `cookie` header (browser forbidden-header semantics).
   */
  authHeaders(): Record<string, string>;
  readonly settings: {
    get<T>(key: string): Promise<T | undefined>;
    set(key: string, value: unknown): Promise<void>;
  };
  readonly native: NativeCapabilities | null;
  readonly runtime: RuntimeInfo;
  /** Called once when the first data-backed frame is on screen. */
  onReady(): void;
}

let current: HostServices | undefined;

export function installHost(host: HostServices): void {
  current = host;
}

export function host(): HostServices {
  if (!current) throw new Error('Host services are not installed.');
  return current;
}
