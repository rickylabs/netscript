import type { ProcessPort } from '../../ports/process-port.ts';
import type {
  DenoDeployCliPort,
  DenoDeployCliResult,
  DenoDeployInvocation,
} from '../../domain/deploy/deno-deploy-cli-port.ts';

/**
 * `deno deploy` CLI process wrapper (Arch-2 named-adapter-behind-port; mirrors
 * the Servy CLI adapter). All `Deno.Command` shelling for Deno Deploy is
 * confined here via an injected {@link ProcessPort} (F-CLI-16 / A11), so the
 * domain target stays pure and the argv is unit-testable with a fake port.
 *
 * Note: the `delete`/`show` subcommand surface of `deno deploy` is still
 * stabilizing; the argv builders below isolate that so a platform change is a
 * one-file edit (see run drift).
 */
export class DenoDeployCliAdapter implements DenoDeployCliPort {
  readonly #process: ProcessPort;

  constructor(process: ProcessPort) {
    this.#process = process;
  }

  deploy(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult> {
    return this.#run(buildDeployArgs(invocation), invocation.projectRoot);
  }

  logs(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult> {
    return this.#run(buildLogsArgs(invocation), invocation.projectRoot);
  }

  remove(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult> {
    return this.#run(buildDeleteArgs(invocation), invocation.projectRoot);
  }

  status(invocation: DenoDeployInvocation): Promise<DenoDeployCliResult> {
    return this.#run(buildStatusArgs(invocation), invocation.projectRoot);
  }

  async #run(args: readonly string[], cwd: string): Promise<DenoDeployCliResult> {
    const result = await this.#process.exec('deno', args, { cwd });
    return { code: result.code, stdout: result.stdout, stderr: result.stderr };
  }
}

/** Shared `--org`/`--app` flag suffix used by every subcommand. */
function targetFlags(invocation: DenoDeployInvocation): string[] {
  const args: string[] = [];
  if (invocation.org) args.push('--org', invocation.org);
  if (invocation.app) args.push('--app', invocation.app);
  return args;
}

/** Build argv for `deno deploy [--prod] [--org] [--app] [--env-file] [entrypoint]`. */
export function buildDeployArgs(invocation: DenoDeployInvocation): string[] {
  const args = ['deploy'];
  if (invocation.prod) args.push('--prod');
  args.push(...targetFlags(invocation));
  if (invocation.envFile) args.push('--env-file', invocation.envFile);
  if (invocation.entrypoint) args.push(invocation.entrypoint);
  return args;
}

/** Build argv for `deno deploy logs [--org] [--app]`. */
export function buildLogsArgs(invocation: DenoDeployInvocation): string[] {
  return ['deploy', 'logs', ...targetFlags(invocation)];
}

/** Build argv for `deno deploy delete [--org] [--app]`. */
export function buildDeleteArgs(invocation: DenoDeployInvocation): string[] {
  return ['deploy', 'delete', ...targetFlags(invocation)];
}

/** Build argv for `deno deploy show [--org] [--app]`. */
export function buildStatusArgs(invocation: DenoDeployInvocation): string[] {
  return ['deploy', 'show', ...targetFlags(invocation)];
}
