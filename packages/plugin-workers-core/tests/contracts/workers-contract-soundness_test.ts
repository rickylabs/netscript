import { assertEquals } from '@std/assert';
import type {
  ExecutionRecordResponse,
  JobTriggerInput,
  JobTriggerOutput,
} from '../../src/contracts/v1/mod.ts';
import { workersContractV1 } from '../../src/contracts/v1/mod.ts';
import type { ExecutionRecord } from '../../src/state/mod.ts';
import type { TriggerType } from '../../src/domain/constants.ts';

// ============================================================================
// Type-level soundness assertions for the precise workers contract.
//
// These compile-time checks lock in the Task C/172a-2-SOUND invariant: the
// contract and the connector-facing record types carry PRECISE input/output
// types, not loosened `any`/`string` stand-ins. Each `@ts-expect-error` below
// MUST stay an error — deleting one (i.e. re-loosening the type) breaks the
// build, which is exactly the regression guard we want.
// ============================================================================

// --- triggerJob input is precisely typed --------------------------------------

// Positive: a well-formed trigger input conforms.
const _validTrigger = {
  id: 'job-1',
  payload: { email: 'a@example.com' },
} satisfies JobTriggerInput;

// Negative: `id` is a string, not a number. Re-loosening to `any` would silence
// this and remove the @ts-expect-error error.
const _badTriggerId: JobTriggerInput = {
  // @ts-expect-error - `id` must be a string
  id: 123,
};

// --- triggerJob output keeps `triggered: boolean` -----------------------------

// Negative: `triggered` is a boolean; a string must not satisfy the output.
const _badTriggerOut: JobTriggerOutput = {
  jobId: 'job-1',
  // @ts-expect-error - `triggered` must be a boolean
  triggered: 'yes',
};

// --- ExecutionRecordResponse always carries the `executionId` discriminator ---

// Negative: omitting the required `executionId` must fail.
// @ts-expect-error - `executionId` is required on ExecutionRecordResponse
const _badExecResponse: ExecutionRecordResponse = { id: 'exec-1' };

// --- state ExecutionRecord status/triggeredBy are enums, not bare `string` ----

// Positive: a canonical enum value conforms.
const _validTriggeredBy: TriggerType = 'manual';

// Negative: an arbitrary string is not a valid `triggeredBy` enum member.
// @ts-expect-error - 'totally-made-up' is not a TriggerType
const _badTriggeredBy: ExecutionRecord['triggeredBy'] = 'totally-made-up';

// Negative: an arbitrary string is not a valid execution `status` enum member.
// @ts-expect-error - 'in-progress' is not an ExecutionStatus
const _badStatus: ExecutionRecord['status'] = 'in-progress';

Deno.test('workers contract exposes a precise, non-loosened type surface', () => {
  // Reference the type-level bindings at runtime so they are not unused, and
  // confirm the implementer value (precise oRPC contract) is present.
  assertEquals(typeof workersContractV1.triggerJob, 'object');
  assertEquals(_validTrigger.id, 'job-1');
  assertEquals(_badTriggerId.id as unknown, 123);
  assertEquals(_badTriggerOut.triggered as unknown, 'yes');
  assertEquals(_badExecResponse.executionId, undefined);
  assertEquals(_validTriggeredBy, 'manual');
  assertEquals(_badTriggeredBy as unknown, 'totally-made-up');
  assertEquals(_badStatus as unknown, 'in-progress');
});
