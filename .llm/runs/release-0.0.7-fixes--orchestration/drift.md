# Drift — release 0.0.7 fixes topic

No implementation or scope drift is accepted.

## Observed metadata inconsistency (non-blocking for this lane)

The frozen dependency DAG node for #1360 still says `lane: fixes`, while the approved plan, topic
issue allocation, leaf contract, and grouped `app-service-client-wiring` leaf assign #1360 to
`features`. The fixes authority list excludes #1360, so this topic leaves it untouched and does not
mutate central state. The coordinator should reconcile the generated DAG metadata when it next owns
a central state transition.
