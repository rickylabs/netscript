/** RED-first stable resource-command gate vocabulary. */
export interface ResourceCommandContract {
  readonly id: string;
  readonly typedDatabase: readonly string[];
  readonly background: readonly (readonly string[])[];
  readonly describe: readonly string[];
  readonly skipWhenStartReceiptAbsent: boolean;
}

/** Placeholder contract for the RED-first S10 resource-command slice. */
export function resourceCommandContract(): ResourceCommandContract {
  throw new Error('S10 resource-command gate is not implemented');
}
