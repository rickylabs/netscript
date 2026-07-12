import type { Command } from '@cliffy/command';

/**
 * A Cliffy command at the composition boundary.
 *
 * Command builders retain their inferred option and argument types while they
 * are assembled. Registries and command factories use this default public
 * Cliffy instance type when the concrete builder parameters are irrelevant.
 */
export type CliffyCommand = Command['cmd'];
