# Drift

- Owner routes override current matrix (recorded verbatim in worklog).
- rtk unavailable; direct commands used.
- Manifest and template-loader files under `kernel/adapters/templates/` are added
  to the authorized surface because new template registration requires them.
- The specific operator process overrides generic dispatcher boilerplate: Refs-only,
  no labels, draft until verified gates, final report publication handoff.

PLAN-EVAL round 1: FAIL_PLAN (B1–B6). Corrected commands, request-time capability
projection, memory-vs-database procedures, runtime compatibility invariants,
command-palette registry install and full acceptance mapping. Source changes remain
unstarted. Optional capability discovery stays server-side and never claims health
from installation. Added `kernel/adapters/templates/scaffold-template-assets.ts`
and `kernel/assets/manifest.ts` to registration scope. No e2e probe changes planned.

S1 inventory: 29 owning source/test/documentation files plus the embedded carrier.
This meets the target for the owning slice; carrier regenerated in the same commit
so the CLI's emitted scaffold matches the template source. No unrelated source.
