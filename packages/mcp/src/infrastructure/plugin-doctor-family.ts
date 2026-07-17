import type { DoctorCheckContext, DoctorCheckFamily } from '../domain/doctor-check-family.ts';
import type { ProjectDoctorPort } from '../domain/project-doctor-port.ts';
import type { DoctorCheck } from '../domain/tool-contracts.ts';

/** Default plugin doctor boundary until the CLI injects its typed use case in S7. */
export class UnwiredProjectDoctor implements ProjectDoctorPort {
  /** Report the intentionally deferred CLI composition seam. */
  diagnose(_projectRoot: string): Promise<readonly DoctorCheck[]> {
    return Promise.resolve([{
      name: 'plugin_doctor_injection',
      status: 'warn',
      summary: 'Plugin diagnostics are not wired in this standalone MCP process.',
      fix: 'Run through the NetScript CLI integration after S7 wires the plugin doctor adapter.',
    }]);
  }
}

/** Adapt project/plugin diagnostics into the doctor family contract. */
export class PluginDoctorFamily implements DoctorCheckFamily {
  /** Stable family name. */
  readonly name = 'plugins' as const;

  /** Create a plugin family backed by an injected project doctor. */
  constructor(private readonly doctor: ProjectDoctorPort) {}

  /** Run injected plugin diagnostics for the current project. */
  check(context: DoctorCheckContext): Promise<readonly DoctorCheck[]> {
    return this.doctor.diagnose(context.projectRoot);
  }
}
