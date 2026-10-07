/** Routing selection is the pinned Harness document's mechanism, shared with its viewer.
 * INTERIM #270: NetScript still pins shipped JSON; configurable fleet-source admission
 * belongs to the replaceable document/discovery boundary in Harness.
 */
export {
  assertEvaluatorIndependence,
  CANONICAL_COORDINATOR_POLICY,
  CANONICAL_ROUTE_POLICY,
  type CanonicalCoordinatorPolicy,
  type CanonicalRoutePolicy,
  type CoordinatorRouteRequest,
  resolveCoordinatorRoute,
  type ResolvedDelegationRoute,
  resolveLegacyRouteForNewSelection,
  resolveWorkloadRoute,
  type RouteAvailability,
  type WorkloadRouteRequest,
} from '@harness/routing-policy';
export {
  type CoordinatorTier,
  DELEGATION_MATRIX,
  type DelegationRole,
  type LegacyRoutingLane,
  type LogicalModelId,
  MODEL_CATALOG,
  type ModelTransport,
  type OwnerMatrixOverride,
  type WorkloadTier,
} from '@harness/matrix';
