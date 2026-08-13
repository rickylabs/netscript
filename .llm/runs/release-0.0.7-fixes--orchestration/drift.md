# Drift — release 0.0.7 fixes topic

No implementation or scope drift is accepted.

## Observed metadata inconsistency (non-blocking for this lane)

The frozen dependency DAG node for #1360 still says `lane: fixes`, while the approved plan, topic
issue allocation, leaf contract, and grouped `app-service-client-wiring` leaf assign #1360 to
`features`. The fixes authority list excludes #1360, so this topic leaves it untouched and does not
mutate central state. The coordinator should reconcile the generated DAG metadata when it next owns
a central state transition.

## Significant — #1243 contract is stale on current main

The approved `legacy-port-pin-sweep` surface says the manifest and official-copy fixture pins are
dead/mechanically removable. The first focused structured test proved the shared manifest schema
still requires `backgroundPort`, atomically validates the service triple, and official-copy
compatibility consumes the values. The viable fail-loud CLI change also requires
`auth-plugin-command_test.ts`, which is outside the contract. No product change was committed;
draft PR #1643 is clean/paused at `f3cf40909`. Coordinator replacement-contract or disposition
authority is required before the same thread resumes.
