/** Evidence that a diagnostic command actually ran for a resource. */
export interface DiagnosticEvidenceReceipt {
  /** Resource name the diagnostic inspected. */
  readonly resource: string;
  /** Exact diagnostic command or MCP tool that ran. */
  readonly command: string;
  /** ISO-8601 completion timestamp. */
  readonly timestamp: string;
  /** Process-style status where zero means success. */
  readonly exitStatus: number;
}

/** Persistent diagnostic evidence used by the drift gate. */
export interface DiagnosticEvidencePort {
  /** Read the newest receipt for one resource. */
  read(resource: string): Promise<DiagnosticEvidenceReceipt | undefined>;
  /** Persist the newest receipt for one resource. */
  write(receipt: DiagnosticEvidenceReceipt): Promise<void>;
  /** Append one serialized entry to the project drift log. */
  appendDrift(entry: string): Promise<void>;
}
