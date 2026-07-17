import { inspectAspire, type InspectionReport } from '@netscript/aspire';
import type { DoctorCheckContext, DoctorCheckFamily } from '../domain/doctor-check-family.ts';
import type { DoctorCheck } from '../domain/tool-contracts.ts';

/** Injectable Aspire inspection dependencies. */
export interface AspireDoctorDependencies {
  /** Test whether a project path exists. */
  readonly exists: (path: string) => Promise<boolean>;
  /** Inspect an Aspire marker through the upstream package. */
  readonly inspect: (target: string) => InspectionReport;
}

const DEFAULT_ASPIRE_MARKERS = [
  'aspire/apphost.ts',
  'aspire/apphost.cs',
  'apphost.ts',
  'apphost.cs',
];

/** Inspect NetScript-generated Aspire graph markers when present. */
export class AspireDoctorFamily implements DoctorCheckFamily {
  readonly name = 'aspire' as const;

  constructor(
    private readonly dependencies: AspireDoctorDependencies = {
      exists: async (path: string): Promise<boolean> => {
        try {
          await Deno.stat(path);
          return true;
        } catch (error) {
          if (error instanceof Deno.errors.NotFound) return false;
          throw error;
        }
      },
      inspect: inspectAspire,
    },
  ) {}

  /** Inspect the first recognized Aspire marker in the project. */
  async check(context: DoctorCheckContext): Promise<readonly DoctorCheck[]> {
    for (const relative of DEFAULT_ASPIRE_MARKERS) {
      const target = `${context.projectRoot}/${relative}`;
      if (!await this.dependencies.exists(target)) continue;
      const report = this.dependencies.inspect(target);
      return [{
        name: 'aspire_graph',
        status: 'pass',
        summary: `${report.summary}: ${report.target}`,
      }];
    }
    return [{
      name: 'aspire_graph',
      status: 'warn',
      summary: 'No NetScript Aspire apphost marker was found; graph inspection was skipped.',
      fix: 'Add or generate the project Aspire apphost when Aspire orchestration is expected.',
    }];
  }
}
