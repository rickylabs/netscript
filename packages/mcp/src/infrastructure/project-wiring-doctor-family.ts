import type { DoctorCheckContext, DoctorCheckFamily } from '../domain/doctor-check-family.ts';
import type { DoctorCheck } from '../domain/tool-contracts.ts';

/** Injectable filesystem reads used by project wiring diagnostics. */
export interface ProjectWiringDependencies {
  /** Test whether a path exists. */
  readonly exists: (path: string) => Promise<boolean>;
  /** Read UTF-8 project metadata. */
  readonly readText: (path: string) => Promise<string>;
}

const defaultDependencies: ProjectWiringDependencies = {
  exists: async (path: string): Promise<boolean> => {
    try {
      await Deno.stat(path);
      return true;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return false;
      throw error;
    }
  },
  readText: Deno.readTextFile,
};

/** Check NetScript project metadata and generated plugin wiring. */
export class ProjectWiringDoctorFamily implements DoctorCheckFamily {
  readonly name = 'project' as const;

  constructor(private readonly dependencies: ProjectWiringDependencies = defaultDependencies) {}

  /** Inspect project configuration without loading or executing user source. */
  async check(context: DoctorCheckContext): Promise<readonly DoctorCheck[]> {
    const root = context.projectRoot;
    const checks: DoctorCheck[] = [];
    const denoPath = `${root}/deno.json`;
    if (!await this.dependencies.exists(denoPath)) {
      checks.push({
        name: 'deno_config',
        status: 'fail',
        summary: 'deno.json is missing.',
        fix: 'Run doctor from a NetScript project root containing deno.json.',
      });
    } else {
      try {
        const config = JSON.parse(await this.dependencies.readText(denoPath)) as Record<
          string,
          unknown
        >;
        const workspace = config.workspace;
        const sane = workspace === undefined ||
          (Array.isArray(workspace) && workspace.every((v) => typeof v === 'string'));
        checks.push({
          name: 'deno_workspace',
          status: sane ? 'pass' : 'fail',
          summary: sane
            ? 'deno.json workspace metadata is valid.'
            : 'deno.json workspace must be an array of paths.',
          ...(sane ? {} : { fix: 'Set workspace to an array of project-relative member paths.' }),
        });
      } catch (error) {
        checks.push({
          name: 'deno_config',
          status: 'fail',
          summary: `deno.json could not be parsed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          fix: 'Correct deno.json syntax and run doctor again.',
        });
      }
    }

    const configPath = `${root}/netscript.config.ts`;
    if (await this.dependencies.exists(configPath)) {
      const configured = /\bplugins\s*:/.test(await this.dependencies.readText(configPath));
      if (configured) {
        const registry = `${root}/.netscript/generated/plugins.ts`;
        const present = await this.dependencies.exists(registry);
        checks.push({
          name: 'plugin_registry',
          status: present ? 'pass' : 'fail',
          summary: present
            ? 'Generated plugin registry is present.'
            : 'Plugins are configured but the generated registry is missing.',
          ...(present ? {} : { fix: 'Run `netscript generate plugins` from the project root.' }),
        });
      }
    }

    const docsPresent = await this.dependencies.exists(`${root}/docs/site`);
    checks.push({
      name: 'docs_root',
      status: 'pass',
      summary: docsPresent
        ? 'Public documentation root is present.'
        : 'Public documentation root is not present (informational).',
    });
    return checks;
  }
}
