/** One structured Aspire doctor finding. */
export interface DoctorFinding {
  readonly name: string;
  readonly status: string;
  readonly message: string;
}

/** RED-first return contract for the S10 doctor receipt. */
export interface AspireDoctorEvaluation {
  readonly summary: { readonly passed: number; readonly warnings: number; readonly failed: number };
  readonly warnings: readonly DoctorFinding[];
}

/** Placeholder contract for the RED-first S10 doctor receipt slice. */
export function evaluateAspireDoctor(_value: unknown): AspireDoctorEvaluation {
  throw new Error('S10 doctor receipt is not implemented');
}
