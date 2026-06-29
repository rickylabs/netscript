import { assertEquals } from '@std/assert';
import type {
  TriggerDefinitionResponse,
  TriggerEventResponse,
  TriggerFireInput,
  TriggerFireResponse,
} from '../../src/contracts/v1/mod.ts';
import { triggersContractV1 } from '../../src/contracts/v1/mod.ts';
import type {
  TriggerDurabilityTier,
  TriggerEventStatus,
} from '../../src/domain/constants.ts';

// ============================================================================
// Type-level soundness assertions for the precise triggers contract.
//
// These compile-time checks lock in the Task C/172a-2-SOUND invariant: the
// triggers contract carries PRECISE input/output types, not loosened
// `any`/`string`/`Record<string, unknown>` stand-ins. Each `@ts-expect-error`
// below MUST stay an error — deleting one (i.e. re-loosening the type) breaks
// the build, which is exactly the regression guard we want. This mirrors
// `plugin-sagas-core/tests/contracts/sagas-contract-soundness_test.ts`.
// ============================================================================

// --- fire input is precisely typed -------------------------------------------

// Positive: a well-formed fire input conforms.
const _validFire = {
  payload: { orderId: 'o-1' },
  idempotencyKey: 'idem-1',
  reason: 'manual replay',
} satisfies TriggerFireInput;

// Negative: `idempotencyKey` is a string, not a number. Re-loosening to `any`
// would silence this and remove the @ts-expect-error error.
const _badFireInput: TriggerFireInput = {
  // @ts-expect-error - `idempotencyKey` must be a string
  idempotencyKey: 123,
};

// --- fire output keeps `accepted: boolean` -----------------------------------

// Negative: `accepted` is a boolean; a string must not satisfy the output.
const _badFireOut: TriggerFireResponse = {
  eventId: 'e-1',
  triggerId: 't-1',
  status: 'pending',
  // @ts-expect-error - `accepted` must be a boolean
  accepted: 'yes',
};

// --- TriggerDefinitionResponse always carries the required `enabled` ----------

// Negative: omitting the required `enabled` must fail.
// @ts-expect-error - `enabled` is required on TriggerDefinitionResponse
const _badDefinition: TriggerDefinitionResponse = {
  id: 't-1',
  kind: 'webhook',
  durabilityTier: 't1',
};

// --- event `status` is the enum, not a bare `string` --------------------------

// Positive: a canonical enum value conforms.
const _validStatus: TriggerEventStatus = 'in-flight';

// Negative: an arbitrary string is not a valid event `status` enum member.
// @ts-expect-error - 'running' is not a TriggerEventStatus
const _badStatus: TriggerEventResponse['status'] = 'running';

// --- definition `durabilityTier` is the tier enum, not a bare `string` --------

// Positive: a canonical durability tier conforms.
const _validTier: TriggerDurabilityTier = 't1';

// Negative: an arbitrary string is not a valid `durabilityTier` enum member.
// @ts-expect-error - 't9' is not a TriggerDurabilityTier
const _badTier: TriggerDefinitionResponse['durabilityTier'] = 't9';

// --- definition `kind` is the kind enum, not a bare `string` ------------------

// Negative: an arbitrary string is not a valid `kind` enum member.
// @ts-expect-error - 'cron' is not a TriggerContractKind
const _badKind: TriggerDefinitionResponse['kind'] = 'cron';

Deno.test('triggers contract exposes a precise, non-loosened type surface', () => {
  // Reference the type-level bindings at runtime so they are not unused, and
  // confirm the implementer value (precise oRPC contract) is present.
  assertEquals(typeof triggersContractV1.fireTrigger, 'object');
  assertEquals(_validFire.idempotencyKey, 'idem-1');
  assertEquals(_badFireInput.idempotencyKey as unknown, 123);
  assertEquals(_badFireOut.accepted as unknown, 'yes');
  assertEquals(_badDefinition.id, 't-1');
  assertEquals(_validStatus, 'in-flight');
  assertEquals(_badStatus as unknown, 'running');
  assertEquals(_validTier, 't1');
  assertEquals(_badTier as unknown, 't9');
  assertEquals(_badKind as unknown, 'cron');
});
