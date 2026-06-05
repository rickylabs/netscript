import type { DbAddRequest } from '../../../domain/db-add-plan.ts';

/** Parsed options accepted by the public `db add` command. */
export interface AddDbCommandInput {
  readonly name?: string;
  readonly projectRoot?: string;
  readonly force?: boolean;
}

/** User request handled by the public add-db use case. */
export type AddDbInput = DbAddRequest;
