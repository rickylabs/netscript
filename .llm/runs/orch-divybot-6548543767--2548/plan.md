# Plan & Design — READY FOR REVIEW

LOCKED: option (a), include the canonical Fresh UI registry in coordinated version-file discovery using the same tracked-or-existing semantics as maintained assets. This is smaller and safer than introducing a new dependency representation or installer resolution path. Keep exact first-party dependencies and third-party ranges intact.

LOCKED: legacy-v1 uses `0.0.0-fixture`, a valid semver deliberately independent of any release. No residue exclusions are broadened. Document ownership in the registry contributor guide.

PLAN-EVAL: N/A — bounded discovery/gate repair with existing rewrite and release sequencing; issue supplies the complete contract and proof. No architecture or public-contract change. Mandatory separate-family IMPL-EVAL remains selected with the owner's exact Claude command.

Slices: bootstrap plan; one implementation slice for coordinated registry rewriting, fixture isolation, guard regression, and contributor documentation; final evaluation/evidence slice. Each implementation commit includes worklog/context.

Gates: structured test wrapper for bump/release/specifier, fresh-ui registry, UI add, CLI init/preset; structured scoped check/lint/fmt; release:preflight; carrier check tasks; quality:gate; CLI scaffold.runtime merge gate; disposable-clone `deno task release:canary -- 0.0.9 --dry-run` beyond residue; read-only Claude IMPL-EVAL.

Risk: generated carriers can contain fresh changes after generators; inspect and commit only required changes, then verify drift checks after commit. Docs-site lock churn must be restored. Disposable rehearsal may expose unrelated release blockers; record exact results rather than treating a future CI check as proof.

Open decisions: none. Deferred: publication and merge, owner reserved; installer redesign is unnecessary. Debt: no new architectural debt planned.
