import type { McpToolRegistry, McpTransportPort } from '../../ports/mcp-transport.ts';

/** Handle returned by {@linkcode registerMcpTools}. */
export interface McpToolRegistration {
  /** Names currently surfaced into the registry. */
  readonly toolNames: readonly string[];
  /** Remove all surfaced tools and detach state listeners. */
  stop(): Promise<void>;
}

/**
 * Surface remote MCP tools into a {@linkcode McpToolRegistry}.
 */
export async function registerMcpTools(
  registry: McpToolRegistry,
  transport: McpTransportPort,
): Promise<McpToolRegistration> {
  const registered = new Set<string>();
  let syncing: Promise<void> | undefined;

  const removeRegistered = (): void => {
    for (const name of registered) {
      registry.unregister(name);
    }
    registered.clear();
  };

  const addCurrent = async (): Promise<void> => {
    removeRegistered();
    const tools = await transport.listTools();
    for (const tool of tools) {
      registry.register(
        tool,
        async (call) =>
          await transport.callTool(tool.name, parseArguments(call.arguments), {
            signal: undefined,
          }),
      );
      registered.add(tool.name);
    }
  };

  const syncCurrent = (): Promise<void> => {
    if (syncing === undefined) {
      syncing = addCurrent().finally(() => {
        syncing = undefined;
      });
    }
    return syncing;
  };

  const unsubscribe = transport.onStateChange((state) => {
    if (state === 'disconnected' || state === 'reconnecting' || state === 'closed') {
      removeRegistered();
    }
    if (state === 'connected') {
      syncCurrent();
    }
  });

  await syncCurrent();

  return {
    get toolNames(): readonly string[] {
      return [...registered];
    },
    async stop(): Promise<void> {
      unsubscribe();
      removeRegistered();
      await transport.stop();
    },
  };
}

function parseArguments(serialized: string): Readonly<Record<string, unknown>> {
  if (serialized.trim() === '') {
    return {};
  }
  const value = JSON.parse(serialized);
  return typeof value === 'object' && value !== null ? Object.freeze({ ...value }) : {};
}
