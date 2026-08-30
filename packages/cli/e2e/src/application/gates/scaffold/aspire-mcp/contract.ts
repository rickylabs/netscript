/** Process exit evidence retained by the Aspire MCP smoke. */
export interface AspireMcpExit {
  readonly code: number | null;
  readonly signal: string | null;
  readonly graceful: boolean;
}

/** Generated MCP entry point proved by the smoke. */
export interface AspireMcpEntryPoint {
  readonly source: '.mcp.json';
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
}

/** One transport session used by the smoke orchestration. */
export interface AspireMcpTransport {
  initialize(): Promise<{ readonly name: string; readonly version: string }>;
  listTools(): Promise<readonly string[]>;
  callTool(name: string, args?: Readonly<Record<string, unknown>>): Promise<unknown>;
  close(): Promise<AspireMcpExit>;
  transcript(): readonly unknown[];
}

/** Time limits for each locked Aspire MCP lifecycle stage. */
export interface AspireMcpTimeouts {
  initializeMs: number;
  toolsListMs: number;
  toolCallMs: number;
  wholeGateMs: number;
}

/** Runtime facts supplied by the gate edge. */
export interface AspireMcpSmokeInput {
  readonly cliVersion: string;
  readonly scaffoldPin: string;
  readonly entryPoint: AspireMcpEntryPoint;
  readonly appHostPath: string;
  readonly dashboardUrl: string;
  readonly database: string;
  readonly appResource: string;
  readonly serviceResource: string;
  readonly secretValues: readonly string[];
  readonly transcript: string;
}

/** Injectable IO seams used by unit tests and the gate entry point. */
export interface AspireMcpSmokeDependencies {
  readonly createTransport: (entryPoint: AspireMcpEntryPoint) => Promise<AspireMcpTransport>;
  readonly describeResources: () => Promise<readonly string[]>;
  readonly persist: (
    receipt: AspireMcpSmokeReceipt,
    transcript: readonly unknown[],
  ) => Promise<void>;
  readonly realPath?: (path: string) => Promise<string>;
  readonly now: () => Date;
  timeouts: AspireMcpTimeouts;
}

/** Exact semantic receipt retained beside the durable lifecycle receipt. */
export interface AspireMcpSmokeReceipt {
  readonly receipt: 'aspire-mcp-smoke';
  readonly capturedAt: string;
  readonly cliVersion: string;
  readonly scaffoldPin: string;
  readonly entryPoint: AspireMcpEntryPoint;
  readonly serverInfo: { readonly name: string; readonly version: string };
  readonly appHost: {
    readonly path: string;
    readonly inScope: boolean;
    readonly selected: boolean;
  };
  readonly toolsExpected: readonly string[];
  readonly toolsObserved: readonly string[];
  readonly toolsMissing: readonly string[];
  readonly toolsExtra: readonly string[];
  readonly documentedUnobserved: readonly string[];
  readonly documentedUnobservedObserved: readonly string[];
  readonly baselineDiff: { readonly added: readonly string[]; readonly removed: readonly string[] };
  readonly doctor: {
    readonly cliVersion: string;
    readonly currentVersion: string;
    readonly summary: {
      readonly passed: number;
      readonly warnings: number;
      readonly failed: number;
    };
  };
  readonly visibility: {
    readonly expectedVisible: readonly string[];
    readonly expectedMcpExcluded: readonly string[];
    readonly observedMcpVisible: readonly string[];
    readonly observedMcpExcluded: readonly string[];
    readonly describeListsExcluded: boolean;
    readonly ok: boolean;
  };
  readonly redaction: { readonly secretParamsNull: boolean; readonly plaintextLeak: boolean };
  readonly structuredLogs: { readonly entryCount: number | null; readonly isError: boolean };
  readonly lifecycle: {
    readonly initializeMs: number;
    readonly toolsListMs: number;
    readonly exit: AspireMcpExit;
  };
  readonly dashboardOnlyTools: readonly string[];
  readonly transcript: string;
}
