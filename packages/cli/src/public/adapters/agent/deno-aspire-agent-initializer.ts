import { resolveAspireExecutable } from '../../../kernel/adapters/runtime/process/resolve-aspire-executable.ts';
import { NETSCRIPT_ASPIRE_CLI_ENV } from '../../../kernel/constants/scaffold/scaffold-aspire.ts';
import type {
  AspireAgentInitializationResult,
  AspireAgentInitializer,
} from '../../features/agent/init/aspire-agent-initializer.ts';
import { ASPIRE_WORKFLOW_SKILLS } from '../../features/agent/init/aspire-agent-initializer.ts';

/** Exact non-interactive upstream workflow-skill selection used by agent init. */
export function aspireAgentInitArgs(projectRoot: string): string[] {
  return [
    'agent',
    'init',
    '--non-interactive',
    '--nologo',
    '--workspace-root',
    projectRoot,
    '--skill-locations',
    'standard,claudecode',
    '--skills',
    ASPIRE_WORKFLOW_SKILLS.join(','),
  ];
}

/** Runs the Aspire CLI agent initializer with caller-owned cancellation. */
export class DenoAspireAgentInitializer implements AspireAgentInitializer {
  async initialize(
    projectRoot: string,
    signal: AbortSignal,
  ): Promise<AspireAgentInitializationResult> {
    try {
      const output = await new Deno.Command(resolveAspireExecutable(), {
        args: aspireAgentInitArgs(projectRoot),
        signal,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      if (output.success) return { ok: true };
      const stderr = new TextDecoder().decode(output.stderr).trim();
      return {
        ok: false,
        reason: stderr || `aspire agent init exited with code ${output.code}`,
      };
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {
          ok: false,
          reason: `the Aspire executable was not found; check ${NETSCRIPT_ASPIRE_CLI_ENV} or PATH`,
        };
      }
      throw error;
    }
  }
}
