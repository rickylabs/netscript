import type {
  DeployTargetOperation,
  DeployTargetPort,
  DeployTargetRequest,
  DeployTargetResult,
} from './deploy-target-port.ts';
import type {
  DenoDeployCliPort,
  DenoDeployInvocation,
  DenoDeployPreflightPort,
} from './deno-deploy-cli-port.ts';
import { scanUnstableApis, type UnstableApiViolation } from './unstable-api-guard.ts';

/** Default deploy options baked into a {@link DenoDeployTarget} instance. */
export interface DenoDeployTargetDefaults {
  /** Deno Deploy organization slug. */
  readonly org?: string;
  /** Deno Deploy application/project name. */
  readonly app?: string;
  /** Whether pushes target production by default. */
  readonly prod?: boolean;
  /** Entrypoint module passed to `deno deploy`. */
  readonly entrypoint?: string;
  /** Path to an env file loaded via `deno deploy env load`. */
  readonly envFile?: string;
}

/** Dependencies injected into a {@link DenoDeployTarget}. */
export interface DenoDeployTargetDeps {
  /** CLI port that shells `deno deploy`. */
  readonly cli: DenoDeployCliPort;
  /** Preflight port that reads project sources for the unstable-API guard. */
  readonly preflight: DenoDeployPreflightPort;
  /** Optional resolved defaults (org/app/prod/entrypoint/envFile). */
  readonly defaults?: DenoDeployTargetDefaults;
}

/**
 * Deno Deploy cloud deploy target (Archetype 7 — the tier-1 MARQUEE adapter).
 *
 * Implements the subset of the canonical 7-op {@link DeployTargetPort} that the
 * hosted platform supports today: `plan` (preflight + unstable-API guard, no
 * platform mutation), `up` (`deno deploy [--prod]` — the one-click push),
 * `down` (delete the deployment), `status`, and `logs`. Host `install`/
 * `uninstall` are N/A for a hosted platform.
 *
 * `rollback` and `secrets` are intentionally omitted: per R-DEPLOY-3 they route
 * through the deploy **core** conventions, which are not yet on `main` (owned by
 * the #341/#364 hardening slice). Per the port docstring, an adapter declares
 * such ops unsupported by omission rather than shipping a silent no-op or a
 * forked per-target implementation — they slot in by delegation when the core
 * seam lands. See run drift D-IMPL-1.
 */
export class DenoDeployTarget implements DeployTargetPort {
  readonly key = 'deno-deploy';
  readonly label = 'Deno Deploy';
  readonly operations: readonly DeployTargetOperation[] = [
    'plan',
    'up',
    'down',
    'status',
    'logs',
  ];

  readonly #cli: DenoDeployCliPort;
  readonly #preflight: DenoDeployPreflightPort;
  readonly #defaults: DenoDeployTargetDefaults;

  constructor(deps: DenoDeployTargetDeps) {
    this.#cli = deps.cli;
    this.#preflight = deps.preflight;
    this.#defaults = deps.defaults ?? {};
  }

  /**
   * Preflight: run the unstable-API guard against the project. Never mutates the
   * platform. Reports whether the project is Deploy-safe.
   */
  plan = async (request: DeployTargetRequest): Promise<DeployTargetResult> => {
    const violations = await this.#scan(request.projectRoot);
    const message = violations.length === 0
      ? `${this.label} plan: no unstable-API violations; project is Deploy-ready.`
      : `${this.label} plan: ${violations.length} unstable-API violation(s) — ${
        this.#describe(violations)
      }. Deno Deploy rejects these flags; resolve before \`up --prod\`.`;
    return this.#result('plan', message);
  };

  /**
   * The marquee one-click push: `deno deploy` (preview) / `deno deploy --prod`.
   * Runs the unstable-API guard first: refuses on production pushes with
   * violations, warns (but proceeds) on preview pushes.
   */
  up = async (request: DeployTargetRequest): Promise<DeployTargetResult> => {
    const invocation = this.#invocation(request);
    const violations = await this.#scan(request.projectRoot);

    if (violations.length > 0 && invocation.prod) {
      throw new Error(
        `${this.label} up refused: production push blocked by ${violations.length} unstable-API ` +
          `violation(s) — ${this.#describe(violations)}. Deno Deploy rejects --unstable-* flags.`,
      );
    }

    const warning = violations.length > 0
      ? ` (warning: ${violations.length} unstable-API violation(s) — ${this.#describe(violations)})`
      : '';
    const result = await this.#cli.deploy(invocation);
    this.#assertOk('up', result.code, result.stderr);
    return this.#result(
      'up',
      `${this.label} up: ${invocation.prod ? 'production' : 'preview'} ` +
        `deployment pushed for ${request.projectRoot}${warning}.`,
    );
  };

  /** Bring the deployment down (platform-native delete). */
  down = async (request: DeployTargetRequest): Promise<DeployTargetResult> => {
    const result = await this.#cli.remove(this.#invocation(request));
    this.#assertOk('down', result.code, result.stderr);
    return this.#result(
      'down',
      `${this.label} down: deployment deleted for ${request.projectRoot}.`,
    );
  };

  /** Report deployment status. */
  status = async (request: DeployTargetRequest): Promise<DeployTargetResult> => {
    const result = await this.#cli.status(this.#invocation(request));
    this.#assertOk('status', result.code, result.stderr);
    return this.#result('status', result.stdout.trim() || `${this.label} status: no deployments.`);
  };

  /** Tail deployment logs. */
  logs = async (request: DeployTargetRequest): Promise<DeployTargetResult> => {
    const result = await this.#cli.logs(this.#invocation(request));
    this.#assertOk('logs', result.code, result.stderr);
    return this.#result('logs', result.stdout.trim() || `${this.label} logs: no output.`);
  };

  #invocation(request: DeployTargetRequest): DenoDeployInvocation {
    return {
      projectRoot: request.projectRoot,
      org: this.#defaults.org,
      app: this.#defaults.app,
      prod: this.#defaults.prod,
      entrypoint: this.#defaults.entrypoint,
      envFile: this.#defaults.envFile,
    };
  }

  async #scan(projectRoot: string): Promise<readonly UnstableApiViolation[]> {
    const input = await this.#preflight.readGuardInputs(projectRoot, this.#defaults.entrypoint);
    return scanUnstableApis(input).violations;
  }

  #describe(violations: readonly UnstableApiViolation[]): string {
    return violations.map((v) => `${v.api} (${v.requiresFlag})`).join(', ');
  }

  #assertOk(operation: DeployTargetOperation, code: number, stderr: string): void {
    if (code !== 0) {
      throw new Error(
        `${this.label} ${operation} failed (deno deploy exit ${code})${
          stderr.trim() ? `: ${stderr.trim()}` : ''
        }`,
      );
    }
  }

  #result(operation: DeployTargetOperation, message: string): DeployTargetResult {
    return { target: this.key, operation, message };
  }
}
