# Umbrella Context Pack — Wave 4: Runtimes & their plugins (A1/A3/A4 + A5)

Run ID (umbrella): `feat-package-quality-wave4-runtimes--umbrella`
Umbrella branch: `feat/package-quality-wave4-runtimes` (off track `feat/package-quality` @ `f2a7ff2`)
PR target: `feat/package-quality` (the S1 track) — merges **once**, at full Wave 4 completeness.
Role: SUPERVISOR-authored umbrella/tracking + pre-research seed. **Not** a PLAN-EVAL or
IMPL-EVAL artifact. The locked slice authority is each sub-wave `plan.md` once written.

## ⛔ STATUS: PREPARED — PLAN-LOCK BLOCKED ON WAVE 3

Research is done (see `research.md`, `split-strategy.md`). **Do not open sub-branches or
lock any plan yet.** Wave 4 plugins consume `@netscript/plugin` (Wave 3) and the triggers
sub-wave depends on Wave 3's OQ-D triggers-health verdict. Gate sequence:

1. **Now (done):** umbrella branch + worktree + this seed + Draft PR (marked BLOCKED).
2. **Wait:** Wave 3 (`@netscript/plugin`) IMPL-EVAL PASS + merged to the track.
3. **Reconcile (extra Claude pass):** merge the track into this umbrella, then re-run the
   `@netscript/plugin` consumer scan against the merged surface + resolve OQ-D ownership;
   update this seed + `split-strategy.md` accordingly.
4. **Then:** open sub-wave **4a** (branch + worktree + Draft PR → umbrella). Plan & Design
   per sub-wave from there.

## Scope — 9 publishable units

Cores: `@netscript/plugin-streams-core`, `-workers-core`, `-sagas-core`, `-triggers-core`.
Standalone: `@netscript/watchers` (A3). Plugins (A5): `@netscript/plugin-{streams,workers,
sagas,triggers}`. All `0.0.1-alpha.0`.

Out of scope (later waves): `sdk`/`service`/`fresh`/`fresh-ui` (**Wave 5**); `@netscript/cli`
(**Wave 6**); publishing/versioning/OIDC (S2/S3).

## Headline (read `research.md` for the full pass)

- **This is fine-tuning + a challenge pass, NOT a rebuild.** All 9 units already
  `deno publish --dry-run` **PASS, 0 slow types** at `f2a7ff2` (provenance: the
  `netscript-start#96` platform rewrite, merged 2026-05-26). Canonical "before" counts are stale.
- **Real work:** (1) full-export `deno doc --lint` debt — unmeasured, expect large on the
  17/19-export cores (Wave 3 root-vs-full was 11→120); (2) **A5 plugin tier has 0 tests**;
  (3) `watchers` structural lift (no README/docs/tasks, flat layout); (4) F-1 file-size
  (`plugin-sagas` v1 router 716, etc.); (5) F-6 task hygiene; (6) docs/ missing on
  `triggers-core` + `plugin-triggers`.
- **Central planning question:** archetype-per-core is disputed (registry A1/A4 vs canonical
  A3). A3 ⇒ **F-13 + Runtime/Aspire validation required** — heavier than Waves 2–3. Settle
  per unit before selecting gates (research §4).
- **Triggers-health is confronted here** (A5 ⇒ runtime validation required); triggers sub-wave
  runs last.

## Sub-wave split (proposal — see `split-strategy.md`)

`streams/watchers (4a) → workers (4b) → sagas (4c) → triggers (4d)`, atomic core+plugin per
family, dependency-ordered. 4b/4c may each split core/plugin if doc-lint debt blows the
`<30`-slice cap — decide at each Plan Gate. Umbrella merges once at full completeness.

## Gate sets (from `gates/archetype-gate-matrix.md`)

- **A3** (likely the cores + watchers): all F-* incl. **F-13 required**; **Runtime/Aspire
  validation required**; consumer-import required.
- **A5** (plugins): F-2/F-4 n/a; F-13 subtype; **Runtime/Aspire validation required**;
  Browser n/a; consumer-import required; **F-10 test-shape required** (closes the 0-test gap).
- **A1/A4** (if a core is a pure contract/DSL surface): lighter — F-13/runtime n/a/optional.
- All: F-1, F-5, F-6, F-7, F-11, F-12, F-16, F-17, F-18 required; full-export doc-lint;
  docs scaffold; doctested README ≥150.

## Phase 0 reading (per sub-wave, read only what the slice needs)

1. This pack + `research.md` + `split-strategy.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{3,4,5}-*.md` + `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/{package-quality-archetype,validation,sub-wave-orchestration,platform}.md`
   — package-quality is **architectural, not type/lint cleanup**.
4. Canonical (stale, structural intent only) — map names via `research.md` §7.
5. Focused code per unit: `deno.json`, `mod.ts`, `src/public/mod.ts`, the exports entrypoints.
   Prefer `deno doc <module>` / `deno doc --filter <symbol>` over whole-file reads.

## MEASURE-FIRST (per sub-wave generator, before locking effort)

- Full-export `deno doc --lint` over **every** `exports` entrypoint of each unit (root-only
  undercounts massively — Wave 3 went 11→120; the 17/19-export cores are the risk).
- `deno publish --dry-run --allow-dirty` (re-confirm 0 slow types post-edits).
- `deno check --unstable-kv` over all entrypoints (tasks.check enumerates only some today).
- Test adequacy vs archetype layers; for A5 plugins this starts from **zero**.
- Record real per-entrypoint numbers in the sub-wave `research.md`/`drift.md`.

## Carried-in caveats

1. **triggers-health** (`localhost:8093/health`, os err 10054) — terminal owner is the
   triggers sub-wave; gate on Wave 3 OQ-D. See `research.md` §6.
2. **`#96` typing drift** — `check:services`/`check:workers` were failing on generated-DB
   artifacts + router/job typing at rewrite-merge time; separate env-artifact gaps from real
   package debt during Research. See `research.md` §0/§5.
3. **`cli-maintainer-sync-isolated-declarations`** — Wave 6, not here.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL are each a SEPARATE session. Evaluator ≠ generator.
- Supervisor does not run gates/PLAN-EVAL/IMPL-EVAL/scoring. (Pre-research dry-run sweep here
  was an explicit user-directed prep pass; the per-sub-wave doc-lint MEASURE-FIRST stays with
  the generator.)
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`.
- Record every plan deviation + rename in the sub-wave `drift.md`.

## References

- Research: `research.md`; split: `split-strategy.md`.
- Canonical (stale, intent only): `…/copilot-evaluate-…/{evaluate,plan}_*` (name map in research §7).
- Gate matrix: `.llm/harness/gates/archetype-gate-matrix.md`; archetypes `ARCHETYPE-{3,4,5}-*.md`.
- Lessons: `.llm/harness/lessons/*`.
- Supervisor: `.llm/tmp/run/feat-package-quality--supervisor/phase-registry.md` (Wave 4).
- Prework provenance: `rickylabs/netscript-start#96`.
