import type { ContractVersion } from '../../../../kernel/adapters/contracts/types.ts';

/** Parsed options for `contract version add`. */
export interface AddContractVersionInput {
  readonly from: string;
  readonly to: string;
  readonly path?: string;
  readonly force?: boolean;
}

/** Application request for promoting one contract to a new version. */
export interface AddContractVersionRequest {
  readonly name: string;
  readonly projectRoot: string;
  readonly from: ContractVersion;
  readonly to: ContractVersion;
  readonly force: boolean;
}
