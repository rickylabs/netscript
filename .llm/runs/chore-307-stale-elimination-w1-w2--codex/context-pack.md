# Context Pack

- Objective: issue #307 Waves 1–2 stale elimination only.
- Baseline: `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` (preflight passed).
- Branch: `chore/307-stale-elimination-w1-w2`.
- Plan status: PLAN-EVAL owner-waived; importer audit completed.
- Planned deletion: Fresh UI orphan data-grid CSS and unused workers/sagas service health routers.
- Retained candidates: anything imported/exported/manifest-referenced, plus CLI extension-points
  required by F-CLI-31.
- Forbidden: `deno.lock`, Waves 3–5, PR creation, `e2e:cli`/`scaffold.runtime` execution.

