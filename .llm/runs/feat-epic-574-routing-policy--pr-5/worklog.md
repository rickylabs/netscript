# Worklog — canonical routing policy migration (#581)

## Design

### Public surface

No published `@netscript/*` API changes. Repository-internal command surfaces gain required route
selection inputs for Codex/OpenHands launches and secret-safe requested/observed route evidence.
The canonical human contract is `.llm/harness/workflow/lane-policy.md`.

### Domain vocabulary

- `RoutingLane`: finite task-purpose identifier.
- `CanonicalRoute`: provider, agent/tool, model, effort, availability/subscription constraints, and
  dated activation window.
- `RouteIdentity`: existing #577 runtime identity; reused, not forked.
- `TemporaryOverride`: owner, effective-through date, transition date, and fallback route.
- `AuthorshipFamily`: Claude, GPT/Codex, mixed; determines opposite-family review.
- `LaunchRouteEvidence`: requested identity plus observed provider/model/effort/session metadata.

### Ports

No new external-service port. Existing launch/process and evidence adapters remain the IO boundary.
Policy selection and validation stay pure; launch edges consume validated `RouteIdentity`.

### Constants

Finite lane IDs, provider/agent/effort values, override dates, subscription states, and deferred issue
IDs are constants with derived union types. Model display names appear only in canonical policy data.

### Commit slices

1. Planning artifacts — Plan-Gate checklist.
2. Canonical policy data/table — focused policy tests and scoped wrappers.
3. Enforced launch identity/evidence — launcher and regression tests.
4. Skills/docs/generated mirrors — Claude surface validation and source-alignment checks.
5. DoD/gate reconciliation — complete gate set and hygiene checks.

### Deferred scope

#582 rollout/promotion/canaries; live paid-provider calls; provider login/billing; historical run
rewrites; distinct Gemini model lane without owner resolution.

### Contributor path

Change route semantics first in the typed canonical policy adjacent to the lane-policy document,
then update/verify the single rendered table, extend launch validation tests, regenerate Claude
mirrors, and run the documented gates. Do not add model tables to individual skills.

## Pre-flight evidence

- Explicit fetch of integration and feature refs: PASS.
- `git merge-base --is-ancestor 908d4f25 HEAD`: exit 0.
- Branch/HEAD: `feat/epic-574-routing-policy` @ `fb77d165` before plan slice.
- Initial status: only untracked coordinator-owned `codex-thread-ids.md`; preserved.
- Plain `git fetch origin`: failed due stale absent remote fetch ref; recorded in drift.

## Slice 2 — canonical policy data and rendered lane table

- Added finite typed canonical routes, dated resolution, quota-only fallback eligibility, and
  opposite-family review data in `runtime/routing-policy.ts`.
- Replaced the stale tier binding table with the canonical rendered policy view in
  `workflow/lane-policy.md` and retained harness invariants plus the explicit #582 boundary.
- Removed completed #581 from `DEFERRED_ISSUES`; #582 remains the sole deferred rollout owner.
- Focused policy/contract/deferred-boundary tests: 20 passed, 0 failed.
- Scoped wrapper check: 5 files, 0 findings.
- Scoped wrapper lint: 5 files, 0 findings.
- Scoped wrapper fmt: 5 files, 0 findings.
- Full agentic-root fmt currently reports two pre-existing findings in `openhands-status.ts` and
  `validate-claude-surface.ts`; neither file is owned by this slice. Changed-file fmt is green.
- `git diff --check`, secret scan, and lock verification are required immediately before commit.

### Reconcile note

PR #590 remains draft at implementation phase. The approved plan is unchanged. The distinct Gemini
model lane remains an owner open question; Antigravity `agy` is implemented as directed. No #582
rollout/promotion capability was added.

## Slice 3 — launch identity enforcement and evidence

- Added a pure route-identity boundary that rejects absent/unsupported provider, model, or effort
  and compares requested versus observed identity without retaining raw provider output.
- Codex launch now requires all three identity fields, passes model/effort to the child command,
  parses observed provider/model/effort from daemon output, records both identities, and fails closed
  on pending or mismatched observation.
- OpenHands dispatch now requires provider/model/effort, emits all three trigger fields, and records
  requested identity plus an honest `observed=pending` marker for asynchronous status reconciliation.
- Parser/launcher/provider tests: 73 passed, 0 failed.
- Scoped wrapper check/lint/fmt: 7 files, 0 findings each.
- No live provider launch occurred; this slice cannot spend or alter provider authentication.

### Reconcile note

The launch edges now treat route identity as enforced data rather than prompt prose. Codex provides
synchronous observed identity and fails closed; OpenHands records pending observation because its
GitHub Action is asynchronous. #577 provider validation, #579 fallback rules, #580 sender ownership,
and #582 deferred rollout remain intact.
