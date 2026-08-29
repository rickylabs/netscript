# Drift Log: plugin doctor registry/source drift

Drift is append-only. Any product path beyond the six-path ceiling in `plan.md` requires supervisor
approval before editing.

## 2026-08-30 — Current streams plugin has no registry contract

- **What:** Issue #1673 names stream definitions in the generic target contract, but current
  `plugins/streams` has no `scaffold.runtime.json`, generated stream registry, or runtime loader for
  such a registry.
- **Source:** `find plugins/streams -name scaffold.runtime.json`; repository search for
  `streams.registry.ts`; comparison with saga/worker/trigger manifests.
- **Expected:** Every named durable definition kind would have a generated registry contract.
- **Actual:** Manifest-backed generation currently covers sagas, worker jobs, triggers, and AI
  resources; streams are not a registry-backed surface.
- **Severity:** minor
- **Action:** accept for this bounded CLI slice. Doctor wording will state the exact manifest-backed
  targets verified. Creating a streams registry would be significant rescope and is not attempted.
- **Evidence:** `research.md` findings 2–3 and exact path ceiling.
