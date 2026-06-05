/** Evidence category captured by a gate. */
export type EvidenceKind = 'command' | 'filesystem' | 'http' | 'aspire' | 'docker' | 'summary';

/** Structured evidence item emitted by gates and reports. */
export interface Evidence {
  readonly kind: EvidenceKind;
  readonly label: string;
  readonly data?: unknown;
}
