# PLAN-EVAL round 2 for issue 2396 adoption (blockers only, read-only)

No blockers remain: all four round-1 defects are fixed in the plan and recorded in `supervisor.md` and `drift.md` before any product edit.

## Round-1 blockers
- [x] **Runtime gate:** fixed by plan repairs 1 and 2.
  - The owner authorizes the coordinator to apply `e2e-cli-gate`; the implementer never labels.
  - 2421 leaves draft only after a blocker-free preliminary IMPL-EVAL.
  - The exact-head runtime result stays explicitly unproven until CI reports it, and no local `scaffold.runtime` runs.
  - Post-publish `e2e-cli-prod` is recorded as proposed `DEBT_ACCEPTED`, targeted at the first 0.0.9 canary before stable. It still needs independent acceptance, and the dry-run is labelled static proof only. This matches `release-gates.md`.
- [x] **Main merge mechanism:** fixed by repair 3.
  - It's a local merge without rewriting history, then a normal push.
  - The token's `workflow` scope was verified without printing the credential. I can't check this myself, so I'm accepting it as stated.
  - If the push is refused, the fallback is GitHub's update-branch API with an expected-head check. Force-push is never used.
  - Workflow files may only arrive from main; no workflow edits are authorized.
- [x] **Saga/trigger gap:** fixed by repair 4. S3 now owns a read-only review, and both `plugins/sagas/services/src/main.ts` and `plugins/triggers/services/src/main.ts` exist. The results go into the host guide. Redesigning those entrypoints is explicitly deferred.
- [x] **S3 scope and files:** fixed by repairs 5 and 6, plus the supervisor addendum and the drift entry.
  - New legacy, test and guide paths are listed exactly.
  - The existing targets exist (streams README, `services-sdk/services.md`, all four generated files).
  - The plugin CHANGELOGs don't exist yet, but the plan only adds them "if needed", so that's fine.
  - None of the new test names collide with existing files.

## New blockers from the repairs
- [x] None. The repairs are consistent with locked decision 7 (the implementer doesn't label; the coordinator does under the owner's authorization) and with the deferral of CI scheduling to the coordinator.

**Not a blocker:** recipes in `docs/site/services-sdk/how-to/` are also listed in that folder's `index.md`, which isn't among the approved paths. Adding one line there is a one-line scope addition. It should be recorded in `drift.md` before writing, but it can't force rework.

VERDICT: PASS
