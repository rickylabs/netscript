import type { ServiceAddRequest } from '../../../domain/service-add-plan.ts';

/** Parsed options accepted by the public `service add` command. */
export interface AddServiceCommandInput {
  readonly name?: string;
  readonly port?: number;
  readonly refs?: string;
  readonly projectRoot?: string;
  readonly force?: boolean;
}

/** User request handled by the public add-service use case. */
export type AddServiceInput = ServiceAddRequest;
