# Research resource hygiene

Commands: maint:leak-check and maint:teardown preview against this run and worktree. Reporter raw output retained privately. Four active research backend containers (plus one earlier owned Garnet startup replacement) positively identified by recorded immutable IDs and matching test-owner label; all removed by exact ID after preview. Subsequent scan of that exact owner set: zero containers. All five anonymous volumes removed only after native mount events proved association with the five run-created container identities and a reference scan proved no other container used them. The earlier Garnet startup replacement was included. No owned volume remains. Foreign/unknown-owner resources untouched. No process or container pattern kill.

## Active implementation resources

Three run-created Redis/Garnet/Postgres backend containers are intentionally retained for S2/S3 validation. Immutable IDs and native mount identities recorded privately at creation, with the dedicated implementation test-owner label. No AppHost or foreign container/process started or stopped. Final cleanup will preview the repo teardown tool and remove only those exact proven identities/mounts; the research zero-survivor result above is historical, not a claim that these active implementation resources are absent.

AMQP validation adds one positively owned RabbitMQ backend; active implementation set is four containers with recorded immutable IDs/mounts. No foreign resources touched.


## Final implementation cleanup

After independent evaluation, maint:leak-check and maint:teardown preview completed read-only. Native immutable creation receipts, exact test-owner label and current native mount identity verified for each of the four implementation backends. Reporter classifies plain test fixtures as unproven; no broad teardown was applied. Every other foreign/unproven entry was reviewed and retained. Removed only the four positively proven container identities, then their four recorded anonymous volumes after a full reference scan proved no other container used them. Final exact-owner scan: zero implementation containers; recorded-volume scan: zero survivors. Maint final leak report captured privately and scrubbed from the public artifact. No AppHost, foreign process, container, network or volume changed.
