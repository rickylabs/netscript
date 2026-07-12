import type { CommandCatalogPort, CommandDescriptor } from '../../domain/command-catalog-port.ts';
import { isRecord } from '../../domain/schema.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

/** Create the bounded command catalog flow. */
export function createListCommandsFlow(catalog: CommandCatalogPort): ToolFlow {
  return async (input: unknown): Promise<ToolExecutionResult> => {
    const filter = isRecord(input) && typeof input.filter === 'string'
      ? input.filter.trim().toLowerCase()
      : '';
    const requested = isRecord(input) && typeof input.limit === 'number' ? input.limit : 100;
    const limit = Math.max(1, Math.min(100, Math.trunc(requested)));
    const all = await catalog.listCommands();
    const commands: readonly CommandDescriptor[] = all.filter((command) =>
      !filter ||
      `${command.path} ${command.description} ${command.usage}`.toLowerCase().includes(filter)
    ).slice(0, limit);
    return { ok: true, value: { count: commands.length, commands } };
  };
}
