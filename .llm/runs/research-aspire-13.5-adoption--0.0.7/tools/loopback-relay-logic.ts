/**
 * Pure decision logic for `loopback-relay.ts`, split out so it can be unit-tested without
 * executing the CLI script's top-level argument parsing / process side effects.
 */

/**
 * Decide whether a candidate source container should be relayed this cycle: its `Created`
 * timestamp must parse and fall at/after `since` (ownership), and it must not be `Paused` (a
 * paused container still completes new inbound TCP handshakes at the kernel level, so it is not
 * a safe proxy for "this backing service is actually reachable" — D-100).
 */
export function shouldRelayContainer(
  createdIso: string,
  paused: boolean,
  since: Date,
): boolean {
  if (paused) return false;
  const created = new Date(createdIso);
  if (!Number.isFinite(created.getTime())) return false;
  return created >= since;
}
