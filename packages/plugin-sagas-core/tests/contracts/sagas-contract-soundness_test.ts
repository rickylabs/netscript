import { assertEquals } from '@std/assert';
import type {
  PublishMessageInput,
  PublishMessageResponse,
  SagaDefinitionResponse,
  SagaInstanceResponse,
} from '../../src/contracts/v1/mod.ts';
import { sagasContractV1 } from '../../src/contracts/v1/mod.ts';
import type { SagaDurabilityTier, SagaInstanceStatus } from '../../src/domain/constants.ts';

// ============================================================================
// Type-level soundness assertions for the precise sagas contract.
//
// These compile-time checks lock in the Task C/172a-2-SOUND invariant: the
// sagas contract carries PRECISE input/output types, not loosened
// `any`/`string`/`Record<string, unknown>` stand-ins. Each `@ts-expect-error`
// below MUST stay an error — deleting one (i.e. re-loosening the type) breaks
// the build, which is exactly the regression guard we want. This mirrors
// `plugin-workers-core/tests/contracts/workers-contract-soundness_test.ts`.
// ============================================================================

// --- publish input is precisely typed ----------------------------------------

// Positive: a well-formed publish input conforms.
const _validPublish = {
  type: 'order.created',
  payload: { orderId: 'o-1' },
  correlationKey: 'cust-42',
} satisfies PublishMessageInput;

// Negative: `type` is a string, not a number. Re-loosening to `any` would
// silence this and remove the @ts-expect-error error.
const _badPublishType: PublishMessageInput = {
  // @ts-expect-error - `type` must be a string
  type: 123,
};

// --- publish output keeps `published: boolean` --------------------------------

// Negative: `published` is a boolean; a string must not satisfy the output.
const _badPublishOut: PublishMessageResponse = {
  messageType: 'order.created',
  // @ts-expect-error - `published` must be a boolean
  published: 'yes',
};

// --- SagaInstanceResponse always carries the required `correlationId` ----------

// Negative: omitting the required `correlationId` must fail.
// @ts-expect-error - `correlationId` is required on SagaInstanceResponse
const _badInstance: SagaInstanceResponse = {
  sagaName: 'checkout',
  state: {},
  status: 'running',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  messageCount: 1,
};

// --- instance `status` is the enum, not a bare `string` -----------------------

// Positive: a canonical enum value conforms.
const _validStatus: SagaInstanceStatus = 'running';

// Negative: an arbitrary string is not a valid instance `status` enum member.
// 'active' was the old connector-local value and is intentionally NOT a member.
// @ts-expect-error - 'active' is not a SagaInstanceStatus
const _badStatus: SagaInstanceResponse['status'] = 'active';

// --- definition `durabilityTier` is the tier enum, not a bare `string` --------

// Positive: a canonical durability tier conforms.
const _validTier: SagaDurabilityTier = 't1';

// Negative: an arbitrary string is not a valid `durabilityTier` enum member.
// @ts-expect-error - 't9' is not a SagaDurabilityTier
const _badTier: SagaDefinitionResponse['durabilityTier'] = 't9';

Deno.test('sagas contract exposes a precise, non-loosened type surface', () => {
  // Reference the type-level bindings at runtime so they are not unused, and
  // confirm the implementer value (precise oRPC contract) is present.
  assertEquals(typeof sagasContractV1.publish, 'object');
  assertEquals(_validPublish.type, 'order.created');
  assertEquals(_badPublishType.type as unknown, 123);
  assertEquals(_badPublishOut.published as unknown, 'yes');
  assertEquals(_badInstance.sagaName, 'checkout');
  assertEquals(_validStatus, 'running');
  assertEquals(_badStatus as unknown, 'active');
  assertEquals(_validTier, 't1');
  assertEquals(_badTier as unknown, 't9');
});
