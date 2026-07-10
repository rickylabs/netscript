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

