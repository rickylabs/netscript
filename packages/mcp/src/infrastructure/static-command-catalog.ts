import {
  type CommandCatalogPort,
  type CommandDescriptor,
  MAX_COMMAND_DESCRIPTOR_LENGTH,
} from '../domain/command-catalog-port.ts';

/** Informational descriptor used until the CLI injects its live registry in S7. */
export const UNWIRED_COMMAND_DESCRIPTOR: CommandDescriptor = Object.freeze({
  path: 'catalog not wired',
  description: 'The standalone MCP server has no live CLI command registry.',
  usage: 'Run through the NetScript CLI integration after S7 wires the command catalog.',
});

function bounded(value: string): string {
  return value.slice(0, MAX_COMMAND_DESCRIPTOR_LENGTH);
}

/** Static catalog adapter for tests and explicitly supplied descriptor sets. */
export class StaticCommandCatalog implements CommandCatalogPort {
  readonly #commands: readonly CommandDescriptor[];

  /** Create a bounded static catalog, defaulting to an explicit unwired notice. */
  constructor(commands: readonly CommandDescriptor[] = [UNWIRED_COMMAND_DESCRIPTOR]) {
    this.#commands = Object.freeze(commands.map((command) =>
      Object.freeze({
        path: bounded(command.path),
        description: bounded(command.description),
        usage: bounded(command.usage),
      })
    ));
  }

  /** Return the immutable static descriptors. */
  listCommands(): Promise<readonly CommandDescriptor[]> {
    return Promise.resolve(this.#commands);
  }
}
