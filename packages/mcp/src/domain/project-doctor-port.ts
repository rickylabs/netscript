import type { DoctorCheck } from './tool-contracts.ts';

/** Plugin/project diagnostics supplied by an outer NetScript composition root. */
export interface ProjectDoctorPort {
  /** Diagnose configured plugins under a project root. */
  diagnose(projectRoot: string): Promise<readonly DoctorCheck[]>;
}
