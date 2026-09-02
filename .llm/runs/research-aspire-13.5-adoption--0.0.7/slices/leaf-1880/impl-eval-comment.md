IMPL-EVAL (separate session, OpenRouter z-ai/glm-5.3-flash xhigh) — head 478450a3c

Diff base `ba6f1f49a` → exactly the expected 16 files; tree verified clean after every check.

**1. Reproduction — PASS.** `observeReadinessDisagreement(projectRoot, unhealthyEvidence.testOnly)`
runs at `listener-unreachable-fixture.ts:136-138` only for `controllerListener === 'postgres'`,
inside the subscription opened at `:122` / closed at `:172`, after departure evidence (`:129-134`)
and before the reopen command (`:140`) — log and Unhealthy report captured in the same failure
window. `selectOwnedContainer` (`owned-container-log.ts:46-66`) requires the Aspire mounts-label
`src` (or `ASPIRE_DCP_APPHOST_PATH`) to be `pathContained` in projectRoot **and** demands exactly
one match (`found 0`/`found 2` throw); image name alone never selects. `assertReadinessDisagreement`
(`readiness-disagreement.ts:80-92`) accepts only log-ready + listener-Unhealthy and rejects the
weaker shape ("ordinary not-ready observation") — a failing probe can't masquerade as gate-2
evidence. Receipt carries `agreement` + `listenerFailure` + container id/image + 20-line `logTail`
(`:214`). Sqlite/MySQL/MSSQL tiers are garnet-only (`listener-readiness-gates.ts:117-130`) → field
omitted via conditional spread, no docker call.

**2. Permissions — PASS.** `--allow-run=aspire,docker` on the listener-unreachable gate only
(`listener-readiness-gates.ts:95`); repo-wide sweep shows no other gate gained docker. Pinned by
`runtime-gates_test.ts:127-142` (parses the argv entry, asserts both executables) and
`listener-readiness-gates_test.ts:165`.

**3. Contract doc — PASS.** `docs/site/reference/aspire/index.md` "## Readiness contract" states
what `Unhealthy` means, why the container log is not the readiness authority (in-namespace vs
published-endpoint; DCP loopback binding), what consumers wait on (`aspire wait`, `healthReports`),
and treats `healthReports: {}` as unknown. Dry read (no mutation): all six phrases pinned in
`checkAspireReadinessContract` (`.llm/tools/docs/check-accuracy-and-discoverability.ts:348-368`)
exist verbatim (1/1/1/1/1/2); the check is wired into `runAccuracyCheck`.

**4. Carriers — PASS.** All five read-only checks exit 0 at this head: `check:agent-docs-prose`,
`check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`,
`check:aspire-version-parity`; `git status` clean afterwards → regenerated, not hand-edited.

**5. #1957 preservation — PASS.** `verify-typed-db-phase-b.ts` diff is empty (0 bytes);
`observeInducedListenerDeparture` (`:241-265`) and `RESOURCE_TRANSITION_FAILURE_CEILING_MS =
120_000` (`:49`) byte-identical to base.

**6. Doctrine/scope — PASS.** No `plugins/`, no `deno.lock`; `packages/*/src` changes are the four
e2e gate files plus the two generated carriers — zero product code, no rescope trigger.

**7. Tests — PASS.** Pinned command: 216 passed, 0 failed. Targeted `deno check --unstable-kv` on
the four changed sources: exit 0. `deno fmt --check` + `deno lint` on the 8 changed e2e `.ts`
files: exit 0. Hosted docker/sqlite scaffold-runtime tiers SUCCESS at this head (supervisor
evidence, not rerun); canary 7 out of scope as instructed.

**Findings (all low, non-blocking):**
1. Fixture-level wiring untested at unit level — the postgres-tier conditional, `logTail` slice,
   and receipt spread are exercised only by the hosted docker tier
   (`listener-unreachable-fixture.ts:136-138,169,207-215`). Action: follow-up test with an injected
   docker/observe seam, or debt.
2. `appHostSourceOf` (`owned-container-log.ts:89-106`) duplicates the private
   `containerAppHostSource` (`evidence/cleanup.ts:284-299`) — same regex + env fallback; drift
   risk. Action: export + reuse, or debt.
3. Sqlite/MySQL/MSSQL tiers grant `docker` in the gate argv though the fixture never invokes it
   there (`listener-readiness-gates.ts:95` vs `:117-130`). Action: optional tier-conditional grant.

Hosted evidence at this exact head (scaffold-runtime docker + sqlite, quality/check-test/
code-quality/scaffold-static all SUCCESS) was taken as given and not rerun, per instructions.

VERDICT: PASS
