# PLAN-EVAL — docs-v4-ia-deepening

- Plan evaluator session: OpenHands minimax-M3 (separate session; not the Claude author / not the
  WSL Codex implementer)
- Run: `docs-v4-ia-deepening`
- Branch: `docs/v4-ia-deepening` @ `2db524bd` (off `origin/docs/v3-ia-plan` @ `89ad3cc5`)
- Surface / archetype: **n/a** (docs planning PR; no `packages/**`/`plugins/**` code in this run's
  authored commits — but a SINGLE ARCHETYPE slice is planned: `packages/auth-better-auth` R0
  passthrough, see `arch-debt.md:935`).
- Scope overlays: `SCOPE-docs` (+ one bounded `ARCHETYPE-1`/`ARCHETYPE-2` overlay for the R0 seam
  slice, on its own framework PR — ordered behind this docs PR per plan §"Build / eval / merge
  flow" step 5).
- Inputs verified: `plan.md`, `research.md`, `ia-tree.md`, `seam-coverage.md`, `drift.md` (D1),
  `arch-debt.md` (R0–R5 entry), `gates/plan-gate.md`, `evaluator/plan-protocol.md`. Re-checked
  against live `origin/docs/v4-ia-deepening` tree at HEAD `2db524bd`.

---

## Independent spot-checks (against the live repo)

These are the checks I ran myself before walking the Plan-Gate checklist:

1. **`@netscript/fresh` Web-Layer 10-page IA → real export subpaths.**
   - `packages/fresh/deno.json` exports map lists exactly 11 subpaths: `.`, `./server`,
     `./builders`, `./route`, `./defer`, `./form`, `./error`, `./streams`, `./query`,
     `./interactive`, `./vite`, `./testing` — every IA-tree Web-Layer leaf maps to a real
     subpath: `./server` (Overview), `./builders` (`definePage`), `./route`
     (`defineRouteContract`), `./query`, `./form`, `./defer`, `./streams`, `./interactive`,
     `./vite`, `./error`, `./testing`. The "Examples / sandbox" leaf is the only pillar-1 page
     that does NOT map to a subpath — and that is intentional (prose showcase, subpath backlog),
     so it is consistent with plan §"Locked decisions" item 1.
   - Spot-checked `definePage` at `packages/fresh/src/application/builders/mod.ts:26` and
     `defineRouteContract` at `packages/fresh/src/application/route/mod.ts:99` — both exist.
   - **No invented symbol/page.** PASS for IA-page-vs-export-subpath coherence.

2. **`createDurableSagaRuntime` DRIFT in `seam-coverage.md` and `ia-tree.md`.**
   - Both `seam-coverage.md:61` ("seam present (`createDurableSagaRuntime`)") and `ia-tree.md`
     pillar-4 reference frame list `createDurableSagaRuntime`. But the actual current
     `@netscript/plugin-sagas-core` public export is `createSagaRuntime`
     (`packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:73`, re-exported via
     `packages/plugin-sagas-core/src/runtime/mod.ts:75` and `packages/plugin-sagas-core/src/public/mod.ts`).
     The `createDurableSagaRuntime` name only survives in
     `.llm/tmp/run/feat-prime-time-sagas-telemetry-spans--impl/` and
     `feat-framework-prime-time--supervisor/` historical artifacts.
   - This is **drift the plan itself flags** (`drift.md` is the drift file; the IA/seam docs were
     drafted before the rename consolidated). The plan DOES NOT explicitly carry a fix for this
     in W2/W3/W6 (pillar rewrite) — so a reader of the published pillar-4 page will be pointed at a
     non-existent symbol. See Required Fix #1 below.

3. **`NetscriptBetterAuthOptions` has no `plugins` field — re-verified.**
   - `packages/auth-better-auth/src/better-auth.ts:23` exports `NetscriptBetterAuthOptions` with
     fields: `prisma`, `provider`, `debugLogs?`, `usePlural?`, `transaction?`, `appName?`,
     `baseURL?`, `basePath?`, `secret?`. **No `plugins` field.** Plan §"Locked decisions" item 2
     and `seam-coverage.md:25`–`27` match the source. ✓

4. **`createBetterAuthBackend({ auth })` accepts structural `BetterAuthInstance`.**
   - `packages/auth-better-auth/src/better-auth.ts:77` defines `BetterAuthInstance` as a structural
     interface `{ handler: (req) => Promise<Response>; api: { getSession(...) } }`. The escape
     hatch documented in `seam-coverage.md:13`–`22` is type-correct today. ✓

5. **R0/R1/R2 ordering & honesty constraints — plan + `arch-debt.md` agree.**
   - `arch-debt.md:952`–`988` records R0 (passthrough, build-now), R1 (DB schema generation —
     "REQUIRED for R0 to be usable"), R2 (interactive flow port — magic-link/passkey caveat),
     R3–R5 (roadmap). Plan §"Locked decisions" item 2 explicitly mandates that docs "state the R1
     schema-generation requirement honestly" and "carry the R2 interactive-flow caveat for
     magic-link/passkey". ✓ Honesty constraint is in the plan.

6. **Streams consumer / replay / consumer-groups claim — re-verified.**
   - `packages/plugin-streams-core/src/public/mod.ts` exports ONLY producer-side symbols
     (`createDurableStream`, `DurableStreamProducer`, `defineStreamSchema`,
     `inspectStreamTopic`, plus URL resolvers `buildStreamUrl`, `getStreamsAuth`,
     `getStreamsUrl`). NO consumer / replay / consumer-group export. The
     "absent — already documented" verdict in `seam-coverage.md:63` matches source. ✓

7. **Background-Processing-vs-Durable-Workflows split — internal consistency.**
   - Pillar 3 (workers / queues / schedulers) and pillar 4 (sagas / triggers / streams) cleanly
     partition "ephemeral background work" vs "stateful durability primitives". `sagas` is
     grouped with `triggers` (durability) and `streams` is grouped with both because the durable
     `DurableStream` is itself a durability primitive — not a worker. The split is internally
     consistent and matches what `drift.md` implies the user wants ("deeper structure").

---

## Checklist results

| Plan-Gate item                          | Result      | Evidence / location |
| --------------------------------------- | ----------- | ------------------- |
| Research present and current            | PASS        | `research.md` exists; re-baselined to current `main`; spot-checks 1–7 above cite live-tree locations. |
| Decisions locked                        | PASS        | `plan.md:9–34` — 5 locked decisions with rationale. Auth-seam decision (`plan.md:17`–`21`) is the user directive and is restated in `arch-debt.md:947–950`. |
| Open-decision sweep                     | PASS w/ fix | 3 open IA questions explicitly enumerated in `plan.md:67–71` AND `ia-tree.md:80–86`; **but** the saga-symbol name drift (spot-check 2) is a 4th open question that is NOT enumerated — see Required Fix #1. |
| Commit slices (< 30, gate + files each) | PASS        | 7 workstreams (W0–W6) listed in `plan.md:36–52`. Each names the gate (caveat-harvest / link-integrity / seam-coverage / IMPL-EVAL / WSL Codex panel). Slices are commit-sized (per `plan.md:58`–`60`: "Commit-by-slice"). No slice exceeds 30 commits. |
| Risk register                           | PASS w/ fix | `drift.md` D1 names the process risk + 3 mitigation gates; `arch-debt.md` R0–R5 names the auth-seam risk. **However**, the risk that `docs-v4` ships while `packages/auth-better-auth` R0/R1 PR is still red is named in `plan.md:64` ("ordering: seam green first, or docs state 'shipping in <ref>'") but is not given a named risk-register row — see Required Fix #2. |
| Gate set selected                       | PASS        | Plan-gate (this), IMPL-EVAL (`evaluator/protocol.md`), WSL Codex adversarial panel (`plan.md:56`), and the three drift-D1 gates (caveat-harvest / link-integrity / seam-coverage — `plan.md:28–34`, `drift.md:32–38`). |
| Deferred scope explicit                 | PASS        | `plan.md:73–77` enumerates R1–R5 seamless-auth, P3-*/P4-* enhancement backlog, PR #63 capability-audit refresh, #6 scorecard/publish, #35 W3b, #36 lock-hygiene, #44 doc-as-limitation, #67 plugin→package registry, `reference/**` untouched. |
| jsr-audit surface scan (pkg/plugin)     | PASS        | The only package touched is `packages/auth-better-auth` R0 (one new option field on `NetscriptBetterAuthOptions`); jsr-audit impact is bounded (a single `plugins?: BetterAuthPlugin[]` forward — no new exports, no new public symbols). Plan does not call out slow-type risk for the new field, but `better-auth`'s plugin types are exported and the field is `readonly`, so the surface risk is contained. Marked PASS w/ the note that IMPL-EVAL should still run `jsr-audit` on the auth PR. |

---

## Open-decision sweep (evaluator-run)

I found ONE open decision the plan did not flag — a deferred-rewrite hazard:

- **`createSagaRuntime` (real) vs `createDurableSagaRuntime` (text in docs).** The pillar-4
  Reference leaves will document `createSagaRuntime`. `seam-coverage.md:61` and the IA-tree
  prose list the old `createDurableSagaRuntime` name. If this is not corrected in W2/W3/W6
  (page moves + pillar rewrite), the published pillar-4 page will cite a non-existent symbol —
  exactly the class of caveat `drift.md` D1 was opened to prevent. Required Fix #1.

The 3 IA questions explicitly delegated to PLAN-EVAL by `plan.md:67–71`:

| # | Question | Ruling (PLAN-EVAL) | Rationale |
|---|----------|---------------------|-----------|
| 1 | Split Background-Processing (workers/queues) from Durable-Workflows (sagas/triggers/streams)? | **RULE: SPLIT.** Pillar 3 = "BACKGROUND PROCESSING" (workers, polyglot runtimes, queues, schedulers). Pillar 4 = "DURABLE WORKFLOWS" (sagas, triggers, durable streams). | The split cleanly separates **ephemeral** work (run-and-forget; runtime + provider choice is the user's lever) from **stateful** work (a durability-tier axis is the user's lever). `DurableStream` is a durability primitive, not a worker — grouping it with `workers` would conflate the two axes. The plan's 8-pillar structure is the right shape. |
| 2 | Reference: pillar-local leaves + thin global index vs global catalog only? | **RULE: PILLAR-LOCAL + THIN GLOBAL INDEX** (matches `ia-tree.md:76` "Reference (thin global API index that fans out into each pillar's Reference leaves)"). | Pillar-local Reference is discoverable in-context (a reader mid-tutorial stays inside the pillar's sidebar) and respects the "single global sidebar — no parallel per-pillar sidebars" rule. The thin global index is the cross-pillar API catalog that the current `reference/**` zone becomes. Reference-zone pages are explicitly OUT OF SCOPE (`plan.md:77`) so this preserves the existing `reference/**` content untouched, which avoids rework. |
| 3 | Fresh "Examples/sandbox" leaf: prose now, live StackBlitz later? | **RULE: PROSE NOW, STACKBLITZ BACKLOG.** | The leaf does not map to any `@netscript/fresh` subpath and so cannot be tied to a verified export surface — prose-only with curated code snippets is honest. The StackBlitz embed would require an external CI artifact (the repo has no existing StackBlitz wiring); deferring avoids bringing a new external integration into a docs-only PR. The plan already lists this as deferred (`plan.md:71`), so the ruling is consistent. |

All three ruled PASS.

---

## Verdict

`FAIL_PLAN`

### Required fixes

1. **`createSagaRuntime` symbol name drift in `seam-coverage.md:61` and the IA-tree prose (pillar 4).**
   - The actual exported symbol on `origin/docs/v4-ia-deepening` @ `2db524bd` is
     `createSagaRuntime` (`packages/plugin-sagas-core/src/runtime/create-saga-runtime.ts:73`,
     re-exported via `packages/plugin-sagas-core/src/public/mod.ts`). The IA-tree + seam-coverage
     text says `createDurableSagaRuntime`.
   - **Fix:** in `ia-tree.md` pillar-4 Reference framing AND `seam-coverage.md` row
     "Background | sagas Prisma store + durability tiers", rename `createDurableSagaRuntime` →
     `createSagaRuntime`. Carry the rename into W2 (IA restructure, page moves) and W6
     (Durable-Workflows pillar prose + Reference leaf) so the published page cites the real
     symbol. This is the kind of untracked caveat `drift.md` D1 was opened to prevent — fix in
     this run, do not punt.
   - This is also a precondition for the drift-D1 **caveat-harvest gate** to do its job
     (the gate requires every authored caveat to carry a tracked reference — the renamed-symbol
     drift must be recorded in `drift.md` with id `D2`, or the W2/W6 prose author will hit the
     gate).

2. **Risk-register row for the docs-vs-seam ordering hazard (R0/R1 docs shipping before the
   auth PR is green).**
   - `plan.md:64`–`65` says "R0 seam slice rides its own framework PR … ordering: seam green
     first, or docs state 'shipping in <ref>'". This is correct ordering policy but it is not in
   a risk-register format. IMPL-EVAL will need to check: "if R0 is not green at merge time, does
   the auth pillar explicitly cite 'shipping in <auth-PR-ref>' or 'awaiting R0'?" If the answer
   is yes, no further action; if not, the docs PR must be held.
   - **Fix:** add a one-line entry in `drift.md` or in a new `risk-register.md` next to
     `plan.md` that names: (a) the hazard, (b) the trigger ("auth-better-auth R0 PR red at
     docs-merge time"), (c) the mitigation ("hold docs merge OR every auth-pillar page carries
     an explicit `shipping in <ref>` caveat"), (d) the owner (Claude authoring workflow). The
     caveat-harvest gate already exists — this just gives the hazard an explicit ID so IMPL-EVAL
     can verify it.

3. **(Minor, optional.) Plan says W4 is "gated on R0+R1 reality" but does not enumerate what
   happens if only R0 ships.**
   - `plan.md:46`–`48` mentions "if R1 not built this run, tutorial documents the schema-gen
     requirement rather than silently assuming tables". Good. But the auth pillar prose
     (auth-pillar page itself, not just the tutorial) has the same conditional: if R0 ships
     without R1, the auth-pillar "Plugins" leaf must carry the R1 caveat at the page level
     (not buried in the tutorial).
   - **Fix:** add one line to W4's scope — "auth-pillar Plugins leaf carries R1 schema-gen
     caveat if R0-only ships". This is a one-line edit and makes the honesty constraint
     visible at the page level, not only at the tutorial level.

---

## Rulings on the 3 PLAN-EVAL-delegated IA questions (re-stated for clarity)

1. **Background-Processing vs Durable-Workflows SPLIT.** ✓
2. **Reference = pillar-local + thin global index.** ✓
3. **Fresh Examples/sandbox = prose now, StackBlitz backlog.** ✓

## Notes

- This is the first PLAN-EVAL cycle on `docs-v4-ia-deepening`. Per
  `evaluator/plan-protocol.md` §"Loop limit", one `FAIL_PLAN` cycle is allowed; a second
  unfixed cycle escalates to the user.
- `createSagaRuntime` was renamed away from `createDurableSagaRuntime` in
  `feat-prime-time-sagas-telemetry-spans--impl` (see the historical artifacts under
  `.llm/tmp/run/`); `ia-tree.md` and `seam-coverage.md` were drafted in `docs-v4` research
  without re-spot-checking the rename. Required Fix #1 closes this loop.
- The plan is otherwise complete, internally consistent, and the locked decisions + drift-D1
  gates are correctly aimed at the user-identified systemic failure (process, not breadth).
  No `packages/**`/`plugins/**` code is touched in the docs PR — the auth-better-auth R0
  slice is correctly ordered to ride its own framework PR (plan §5), which satisfies
  the SCOPE-docs overlay's "no framework churn in this PR" constraint.