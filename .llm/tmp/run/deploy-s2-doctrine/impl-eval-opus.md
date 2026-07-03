# IMPL-EVAL (Opus 4.8, separate session) — #338 [Deploy-S2] Archetype 7 doctrine

**Verdict: PASS_IMPL**

Branch `feat/deploy-s2-doctrine` (PR #357, DRAFT). Evaluated the built artifact adversarially
against the eval brief + authoritative `contract-reconciliation.md`, reproduced the docs-slice
quality gate, and performed a manual three-surface consistency read. Did not edit any
doctrine/harness file; did not mark the PR ready.

## Reconciliation correctness (most-important check) — PASS

- **7-op lifecycle remains CANONICAL** everywhere. `plan`/`emit` · `up` · `down` · `status` ·
  `logs` · `rollback` · `secrets` is the uniform contract in the doctrine op table
  (`06-archetypes.md` L280–284), the harness archetype op table (`ARCHETYPE-7-*.md` L54–62),
  R-DEPLOY-1 ("uniform 7-op contract"), and the debt entry ("uniform 7-op adapter contract").
  The doctrine was NOT demoted to 3-op.
- **Shipped 3-op seed acknowledged, framed as a stub to expand — not the contract.** Doctrine
  L310–321 adds a "Shipped seed" block naming the 3-op `DeployTargetPort`
  (`build`/`install`/`uninstall`, all optional) and stub `WindowsServiceDeployTarget`
  (key `windows-service`), landed by `3137e455` (unrelated command-registry slice, not the epic),
  with the verb map **`build → plan`/`emit`, `install → up`, `uninstall → down`** and
  `status`/`logs`/`rollback`/`secrets` explicitly net-new. Verified firsthand against ground-truth
  source on the branch: `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts` (exactly the
  3-op `build|install|uninstall` surface) and `windows-service-deploy-target.ts` (canned-message
  stub delegating no real work). The doctrine's description matches the code precisely.
- **Arch-debt carries the 3-op→7-op expansion + stub-retire obligation.**
  `DEPLOY-ARCHETYPE-7-CORE-SEED` (arch-debt.md L1848–1859) records the seed, the same verb map,
  the "expand to full 7-op `OsServicePort`/cloud-adapter contract across #339–#343 and
  migrate/retire the `windows-service` stub — never entrench the 3-op surface" obligation,
  deferred verb-vocabulary lock (#339/#340), and **closing gate = `F-DEPLOY-1` promoted `gated`**.
  Cites the reconciliation note by path. Faithful to `contract-reconciliation.md` decisions 1–4.

## Three-surface consistency — PASS

Archetype 7 is present and mutually coherent across all three surfaces plus the decision-order
README:

- `06-archetypes.md`: intro "seven archetypes" (L7); full Archetype 7 section (L232–321);
  decision step 7 (L334–336); future/pending assignments row; checklist rows (L379–384).
- `ARCHETYPE-7-deploy-target-adapter.md`: future-wave status, composition (A2 core + A6 router),
  7-op contract table, R-DEPLOY-1..5, F-DEPLOY-1/2 seeded `reviewed`. (It does not restate the
  3-op seed line — acceptable: it is the conformance north-star; the seed acknowledgment correctly
  lives in the doctrine prose + debt entry per the reconciliation action items.)
- `archetype-gate-matrix.md`: Arch 7 column in BOTH tables (Fitness Gates L20–39; Other Gate
  Families L59–64); composite-union explanation; F-DEPLOY-1/2 prose seeded `reviewed` (L50–55).
- `archetypes/README.md`: decision-order row for Archetype 7 (L21) + composite note (L24–26).

No dangling refs among the doctrine surfaces.

## PLAN-EVAL F1–F4 held — PASS

- **F1** — intro says "seven archetypes" (L7). Held.
- **F2** — assignments row is future/pending: `cli` → `6 — CLI/Tooling` (L352) is intact;
  `_future_ deploy-core (not yet extracted; deploy today folded in cli / A6)` → Archetype 7
  (L353). `cli` was NOT relabelled. Held.
- **F3** — Arch 7 present in BOTH gate-matrix tables. Held.
- **F4** — no reliance on `arch:check` for markdown link integrity; worklog documents that
  `arch:check` only walks package TS and the real proof is the manual three-surface read. Held.

## Doctrine-shape sanity — PASS

Archetype 7 is a genuine cross-package composite (A2 port/adapter core + A6 thin router, folding
neither), package-agnostic except the intentional seed reference, with gates seeded `reviewed`
(correct for future-wave), not `gated`. R-DEPLOY-1..5 and AP mappings are coherent.

## No scope leak — PASS

Changed files vs merge-base (`44d7945`): `ARCHETYPE-7-deploy-target-adapter.md` (A),
`archetypes/README.md` (M), `debt/arch-debt.md` (M), `gates/archetype-gate-matrix.md` (M),
`docs/architecture/doctrine/06-archetypes.md` (M), plus committed run artifacts. No product/adapter
code, no `.claude/` config/skills/hooks, no `deploy-schema.ts` edit, no doctrine renumber.
`validate-claude-surface.ts` correctly N/A (no Claude-surface change).

## Quality gate reproduction (docs slice — no scaffold.runtime)

- **`deno task arch:check` → exit 0.** FAIL=0 across all package roots; only pre-existing
  WARN/INFO on package TS source (export-default AP-19, file-size A8/AP-9, A9/A12 INFO). No
  regression introduced by this markdown slice.
- **Scoped fmt `run-deno-fmt.ts --root .llm/harness --ext md` → exit 1, 14 findings, but the
  three fmt-governed files this slice authored/edited are CLEAN** (ARCHETYPE-7 file, archetypes
  README, gate-matrix are all absent from the findings). The 14 findings are pre-existing baseline
  drift (ARCHETYPE-1..6, lessons/*, profiles/*, templates/*, workflow/*). `arch-debt.md` appears,
  but the brief pre-declares it baseline-dirty and out of the repo fmt include, and the specific
  finding is on an unrelated pre-existing entry (the `_aspire-compat.mjs` reason line), not the
  slice's inserted DEPLOY-ARCHETYPE-7 block. Per the F4 caveat, repo-wide/baseline-dirty fmt is not
  this slice's verdict. Not a red on this slice.
- Manual three-surface consistency read: PASS (above).

## Non-blocking finding (informational)

- `.llm/tmp/run/deploy-s2-doctrine/contract-reconciliation.md` is **gitignored / not committed**
  on the branch (confirmed via `git check-ignore` + `git ls-files`), whereas its sibling run
  artifacts (`plan.md`, `worklog.md`, `research.md`, etc.) were force-committed. The debt entry and
  doctrine both cite this path as the "authoritative reconciliation," so once merged the citation
  points at a repo-absent file. This is a traceability nit only — the reconciliation's *content* is
  fully and faithfully absorbed into the committed doctrine prose + debt entry, so no
  doctrine-correctness or reconciliation-fidelity failure. Recommend (optional) force-adding the
  note for parity with the other committed run artifacts, or leaving it as an internal supervisor
  note. Does not block.

## Conclusion

The 7-op lifecycle stands as the canonical contract; the shipped 3-op seed is correctly
acknowledged and framed as a stub to expand; the arch-debt entry carries the full 3-op→7-op
expansion + stub-retire obligation with the `F-DEPLOY-1 gated` closing gate; PLAN-EVAL F1–F4 all
held; three-surface consistency is intact; scope is clean; the applicable quality gates reproduce
green for this slice. Do not mark PR #357 ready (evaluator does not promote).

result: PASS_IMPL
