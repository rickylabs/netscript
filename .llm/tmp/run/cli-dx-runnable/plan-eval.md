# PLAN-EVAL — PR #120 CLI `dx`-runnable slice (`feat/cli-dx-runnable`)

> Evaluator session (separate from the generator). Follows
> `.llm/harness/evaluator/plan-protocol.md` + `gates/plan-gate.md` + the
> `netscript-deno-toolchain` skill (ground-truth for `deno dx` / JSR exports) +
> `netscript-doctrine` (Archetype 6 — CLI / Tooling, public-surface rules) + `jsr-audit` skill
> (publishability of the new export). Hard stop before any implementation. No edits to
> `packages/`, configs, or lockfiles; this file is the only output.

- **Evaluator session:** MiniMax M3 (OpenHands cloud) — `run-28135291668-1`
- **Run:** `cli-dx-runnable`
- **Branch / PR:** `feat/cli-dx-runnable` (PR #120)
- **Phase:** plan (Plan-Gate)
- **Surface / archetype:** `packages/cli` / **Archetype 6 — CLI / Tooling**
  + **SCOPE-docs** overlay (the slice also sweeps user-facing docs/READMEs)
- **Base rebased onto:** current `feat/cli-dx-runnable` HEAD = `336df06b docs(cli-dx-runnable):
  research + plan for the CLI dx-runnable slice` (single commit on the branch; verified via
  `git log -1`); branch tracks `origin/feat/cli-dx-runnable`.

## Inputs reviewed

- [x] `research.md` (108 lines — full read)
- [x] `plan.md` (89 lines — full read)
- [x] `.llm/harness/gates/plan-gate.md` (8-item checklist)
- [x] `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md` (v2)
- [x] `.llm/harness/archetypes/SCOPE-docs.md` (sweep overlay)
- [x] `.llm/harness/debt/arch-debt.md` (no new debt from this slice; only a contingent debt note
  conditional on Option B being forced)
- [x] `.agents/skills/netscript-deno-toolchain/SKILL.md` (dx / JSR exports ground truth)
- [x] `.agents/skills/jsr-audit/SKILL.md` (publishability rubric)
- [x] `.agents/skills/netscript-doctrine/SKILL.md` + doctrine 02-public-surface,
      06-archetypes (A6), 09-anti-patterns (cited by A6), arch-debt ledger
- [x] `packages/cli/deno.json` (exports `.`/`./scaffolding`/`./testing`; `publish.include` ships
      `bin/netscript.ts`; `publish.exclude` excludes `bin/netscript-dev.ts` and `maintainer.ts`)
- [x] `packages/cli/mod.ts` (library: re-exports `createPublicCli` via
      `src/public/public-api.ts`, `@module` JSDoc, **no `import.meta.main`** — confirmed)
- [x] `packages/cli/bin/netscript.ts` (executable entry: `if (import.meta.main) { runPublicCli(...) }`
      — `import.meta.main` guard already in place, **imports side-effect-free above the guard**)
- [x] `packages/cli/bin/netscript-dev.ts` (maintainer local-source: `createLocalContributorCli` —
      correctly excluded from sweep; `publish.exclude`d)
- [x] Sweep residual: `grep -rln "jsr:@netscript/cli/bin/netscript.ts"` → 18 source files in the
      current tree (README, docs/site, tutorials, plugin READMEs). Plan's "grep-driven, not
      whitelist" framing is consistent with the residual set; D4 leaves the residual check as the
      S2 gate.

## Plan-Gate checklist (gates/plan-gate.md)

| # | Plan-Gate item                            | Result            | Evidence / location                                                                                              |
|---|--------------------------------------------|-------------------|------------------------------------------------------------------------------------------------------------------|
| 1 | Research present and current              | **PASS**          | `research.md` (108 LOC) exists. Re-baselining: the decisive correction (no `bin` field for JSR; `dx` resolves a module export) is verified against current `packages/cli/deno.json` — `exports` map has no runnable entry today, `bin/netscript.ts` ships via `publish.include` but is not in `exports`. The empirical Q1/Q2 questions (bare-vs-subpath resolution + arg forwarding) are correctly flagged as docs-inconclusive and required to be verified empirically against a published reference package (e.g. `jsr:@std/http/file-server`). |
| 2 | Decisions locked                          | **PASS**          | D1–D5 stated with rationale. D1 names the mechanism (executable export, not `bin`). D2 commits to an empirical-then-pick sequence with explicit A/B options and a documented selection criterion (bare resolution works → A, else B). D3 names the guard mechanism + test. D4 names the sweep scope + verified-form-only rule. D5 names the gate split (structural pre-merge, dx smoke post-publish). All five decisions are non-contradictory. |
| 3 | Open-decision sweep                       | **PASS**          | The only open decision is D2 (A vs B). It is correctly marked **"safe to defer until the empirical dx check"** — the criterion is deterministic (run `deno x jsr:@netscript/cli` and `deno x jsr:@netscript/cli/<named>`; observe which resolves; pick A or B), and both branches are pre-designed (Option A modifies `mod.ts` to add a guard; Option B adds `"./cli"` to `exports`). Deferring does **not** force rework. No other open decision found. |
| 4 | Commit slices (<30, gate + files each)    | **PASS**          | Two slices: S1 (runnable export + guard test) and S2 (repo-wide command sweep). Each names its gate (S1: dry-run, check, lint, fmt, test; S2: grep residual + fmt on touched docs) and the files it touches (S1: `packages/cli/deno.json` ± a thin entry file; S2: 18 file occurrences of `jsr:@netscript/cli/bin/netscript.ts` per the current residual grep, plus possibly scaffold-emitted help text). Both <<30 cap. |
| 5 | Risk register                             | **PASS**          | Risks surfaced in research (Q1/Q2 empirical gaps, library-purity risk on Option A, false-landing-page claim on sweep, post-publish-only end-to-end verification) are all addressed by a named gate or named mitigation in plan.md: empirical dx check + verified-form-only rule (Q1/Q2 + landing-page), guard test (library purity), structural pre-merge gate + post-publish dx smoke on #111 (end-to-end). |
| 6 | Gate set selected                         | **PASS**          | `deno publish --dry-run --allow-dirty --no-check=remote` (publishability), scoped `deno check --unstable-kv` (type-correctness), scoped `deno lint` + `deno fmt --check` (style), guard test (library purity), grep residual check (sweep completeness). Matches A6 + SCOPE-docs + JSR publish surface. `scaffold.runtime` correctly **not** required (no scaffold change; noted in worklog rather than run). |
| 7 | Deferred scope explicit                   | **PASS**          | Out-of-scope enumerated in `plan.md` §Scope: any CLI behavior change, new subcommands, the publish workflow/order (#111), maintainer local-source entries (`bin/netscript-dev.ts`, `maintainer.ts`, `deno task dev`), and the npm/dnt `bin` concept (irrelevant to JSR `dx`). |
| 8 | jsr-audit surface scan (pkg/plugin)       | **PASS**          | `packages/cli` is a JSR package (`packages/cli/deno.json` has `name` + `version` + `publish`). The slice adds (or repoints) one entry in the `exports` map; the new export points to an `import.meta.main`-guarded module. Risks named: (a) **publishability** — dry-run gate stays green; (b) **slow types** — accepted per the publish decisions (research §Gates); (c) **`@module` JSDoc on the new export** — required for `deno doc --lint`; this is an IMPL-EVAL check, not a plan-level fix; (d) **`isolatedDeclarations`** — `false` in current `packages/cli/deno.json` (correct: CLI is not on the strict-isolated-declarations list; slow-types carve-out covers it). |

**Plan-Gate sub-total: 8/8 PASS.**

## Per-point checklist (the six evaluator asks)

| # | Concern from trigger                                          | Verdict | Notes |
|---|---------------------------------------------------------------|---------|-------|
| 1 | **Mechanism correctness (D1/D2)** — Is the export-based `dx` mechanism correct for JSR (no `bin` field)? Is empirical verification of bare-vs-subpath resolution + arg-forwarding sound? Are Options A/B both viable with a correct selection criterion? | **PASS** | Deno 2.6 docs (cited in `research.md`) make `dx` resolve an exported module entry; `jsr:@std/http/file-server` is the canonical example. D1 is correct. The Deno docs do not explicitly state the bare-specifier resolution rule or show arg-forwarding, so D2's "verify empirically against a published reference package BEFORE locking the surfaced command form" is the right move. Options A and B are both viable: A makes the library-export also the executable export (with a guard), B adds a parallel executable export (no library coupling). The selection criterion (bare resolution works → A, else B) is correct because (a) A is the cleaner marketing form (shortest surfaced command), (b) A is only viable if `dx` can resolve a bare specifier to a default export (a Deno behavior the docs don't confirm), (c) B is the safe fallback that works regardless. The "verified-form-only" rule (D4) prevents false claims about which form actually works. |
| 2 | **Library purity (D3)** — Does the plan adequately protect `import { createPublicCli } from "jsr:@netscript/cli"` and the `./scaffolding`/`./testing` consumers from accidental CLI execution via the guard + test? | **PASS** | `bin/netscript.ts` already has the `if (import.meta.main) { ... }` guard in place; the imports above the guard are side-effect-free (verified by reading the file: only `outputError`, `resolve`, `formatError`, `CliExitError`, `runPublicCli` imports — none run on import). D3's guard test asserts the library import is side-effect-free, which is the right test (Option A path) or trivially passes (Option B path, because the library-exported file is separate). Either way, the existing `./scaffolding`/`./testing` consumers and the library import are not at risk. |
| 3 | **Sweep completeness (D4)** — Is the sweep scoped to ALL user-facing `jsr:@netscript/cli/bin/netscript.ts` occurrences (grep-driven, not whitelist), with a residual grep check, while correctly EXCLUDING maintainer local-source forms? Is the "verified-form-only" rule sufficient? | **PASS** | D4 says "Grep the whole repo; the research site list is a starting point, not a whitelist. Maintainer local-source forms are NOT swept." The current residual grep returns 18 source files — that's the S2 target set. Maintainer local-source forms (`bin/netscript-dev.ts`, `deno task dev`, `maintainer.ts`) are correctly excluded: `bin/netscript-dev.ts` calls `createLocalContributorCli` (a separate, non-public flow); it is already `publish.exclude`d; the `deno task dev` invocation in `packages/cli/deno.json` runs `bin/netscript.ts` against local source, not the published JSR form, so it's not a "user-facing install command." The "verified-form-only" rule — "Do not surface a command form that was not actually run" — is sufficient to prevent false landing-page claims, because Codex is required to actually execute the surfaced form (via the empirical dx check + the local `deno run` of the export) before sweeping docs to it. |
| 4 | **Gate sufficiency (D5)** — Is the pre-merge structural gate sufficient, with the true end-to-end `deno dx jsr:@netscript/cli …` smoke deferred to a post-publish close-out on #111? Or must something move earlier? | **PASS** | The pre-merge gate (`deno publish --dry-run` clean, local `deno run` of the export, empirical `dx` resolution-rule check against a reference package, guard test green) is sufficient because (a) `publish --dry-run` validates the new export is publishable; (b) local `deno run` validates the executable entry is wired correctly and forwards args via `Deno.args` (already used by `runPublicCli`); (c) the empirical `dx` check against `jsr:@std/http/file-server` (and a bare-specifier probe) validates the Deno resolution rule itself; (d) the guard test validates library purity. The true end-to-end `deno dx jsr:@netscript/cli …` smoke is correctly deferred to #111's post-publish close-out, because the CLI publishes LAST (per the road-to-JSR program); the slice ships before publish, so an end-to-end dx smoke against `@netscript/cli` is not possible pre-merge. The risk of "surfaced form doesn't actually work at publish time" is bounded because (i) the empirical check validates the rule, (ii) the verified-form-only rule means only actually-run commands are surfaced, (iii) the post-publish smoke closes the loop and can trigger a fast follow-up if needed. |
| 5 | **Scope discipline** — Does the slice exclude CLI behavior changes, new subcommands, and the publish workflow/order (#111)? Is the two-commit slice plan (S1 export+test, S2 sweep) right-sized? | **PASS** | §Scope explicitly excludes: any CLI behavior change, new subcommands, the publish workflow/order (#111), maintainer local-source entries (`bin/netscript-dev.ts`, `maintainer.ts`, `deno task dev`), and the npm/dnt `bin` concept. The two-commit slice plan is right-sized: S1 is a focused `deno.json` + entry-file + guard-test change (one logical concern: the export); S2 is a focused repo-wide docs sweep (one logical concern: the surfaced form). No slice mixes concerns. No slice under-sizes (S1 needs the empirical check + the deno.json edit + the guard test + the publish dry-run; S2 needs the residual grep + the verified-form check + the voice-clean rewrite). |
| 6 | **Debt** — Is the fallback (Option B forces a longer `…/cli init` form → arch-debt note) correctly dispositioned? | **PASS** | Plan §Debt/follow-ups correctly identifies the contingency: "If Option B (named subpath) is forced because bare-specifier resolution does not work, record an arch-debt note that the surfaced command is `…/cli init` (slightly longer than the marketing-ideal bare form) so a future Deno `dx` improvement can shorten it." This is the right disposition because (a) the debt is conditional and gated on a specific empirical outcome (not speculative), (b) the resolution event (a future Deno `dx` improvement that allows bare resolution of a runnable default export) is external and predictable, (c) the debt note captures both the current state and the closing trigger. |

**Per-point sub-total: 6/6 PASS.**

## Open-decision sweep (evaluator-run)

| Decision | Plan status | Evaluator finding |
| -------- | ----------- | ------------------ |
| **Q: A vs B (D2)** | safe to defer until empirical dx check | OK — the criterion is deterministic, both options are pre-designed, and the slice is structured so the choice happens during S1 (not after). The empirical check is cheap (one or two `deno x` runs against a reference package). No rework if deferred. |

**No open decision would force rework if deferred. All "must resolve now" items resolved.**

## Code-evidence cross-checks

| Plan claim                                              | Code evidence                                                                                       | Verified? |
|---------------------------------------------------------|------------------------------------------------------------------------------------------------------|-----------|
| `.` export is the library, not an executable           | `packages/cli/mod.ts` re-exports `createPublicCli` from `src/public/public-api.ts`; no `import.meta.main` | ✓         |
| `bin/netscript.ts` has `import.meta.main` guard         | `packages/cli/bin/netscript.ts` lines 11–24: `if (import.meta.main) { ... }`                         | ✓         |
| `bin/netscript.ts` is published but not in `exports`   | `packages/cli/deno.json` `publish.include` ships `bin/netscript.ts`; `exports` map has only `.`, `./scaffolding`, `./testing` | ✓         |
| `bin/netscript-dev.ts` is the maintainer local-source   | `packages/cli/bin/netscript-dev.ts` calls `createLocalContributorCli`; `publish.exclude` excludes it   | ✓         |
| `packages/cli` is a JSR package                          | `packages/cli/deno.json` `name: "@netscript/cli"` + `version: "0.0.1-alpha.1"` + `publish` block       | ✓         |
| `bin/netscript.ts` imports are side-effect-free above guard | Lines 1–10: pure ESM imports (no top-level statements that run on import)                          | ✓         |
| `isolatedDeclarations: false` on `packages/cli` (so slow types are accepted, not an `isolatedDeclarations` failure) | `packages/cli/deno.json` `compilerOptions.isolatedDeclarations: false`                       | ✓         |
| Sweep residual set is the S2 target                     | `grep -rln "jsr:@netscript/cli/bin/netscript.ts"` returns 18 source files (README, docs/site, tutorials, plugin READMEs) | ✓         |
| Deno 2.6 `dx` resolves a module export                  | `https://docs.deno.com/runtime/reference/cli/x/` (cited in research.md): "JSR packages are run by pointing `deno x` at an export that executes when imported, for example `deno x jsr:@std/http/file-server`" | ✓ (cited)  |
| JSR has no `bin` field                                   | JSR package manifest spec (cited in research.md) — exports-only resolution                           | ✓ (cited)  |

## Verdict

**`PASS`**

The plan satisfies every box on the `gates/plan-gate.md` checklist plus the six evaluator-specific concerns. Research is current and decisively grounded (corrects the original task framing's "bin field" assumption against authoritative Deno 2.6 docs + JSR's exports-only manifest). All five locked decisions (D1–D5) are non-contradictory and carry rationale. The single open decision (A vs B export shape) is correctly deferred with a deterministic empirical resolution criterion and pre-designed fallback. The two commit slices (S1 export+test, S2 sweep) are right-sized, each names its gate and files, and are well under the <30 cap. The gate set matches Archetype 6 + SCOPE-docs + JSR publish surface. Deferred scope (CLI behavior changes, new subcommands, #111, maintainer local-source entries, npm/dnt `bin` concept) is explicit. JSR publishability risks (new export must publish cleanly, slow-types accepted per publish decisions, `@module` JSDoc required for `deno doc --lint`) are named. Library purity is protected by the existing `import.meta.main` guard + a focused test. The sweep is grep-driven (not whitelist) with a residual grep gate, correctly excludes maintainer local-source forms, and the "verified-form-only" rule prevents false landing-page claims. The pre-merge structural gate is sufficient given that the CLI publishes LAST; the true end-to-end `deno dx jsr:@netscript/cli …` smoke is correctly deferred to a post-publish close-out on #111. Debt is correctly dispositioned (the Option-B arch-debt note is conditional on the empirical outcome and names the closing trigger).

### Required follow-ups (non-blocking, addressed during impl)

These are gap cleanups, not plan fixes — they do not block `PASS`:

1. **`packages/cli/deno.json` `publish.include` should be reviewed during S1.** If Option B (named `./cli` export) is chosen and points to a thin new entry file (rather than reusing `bin/netscript.ts`), that new file must be added to `publish.include`. If Option A is chosen (`.` repointed to a new runnable entry), the existing `bin/netscript.ts` and `mod.ts` may need to be re-coordinated. **Not a plan defect** — the slice's gates (dry-run + lint + check) catch a missing publish.include entry. IMPL-EVAL should confirm.
2. **`@module` JSDoc tag on the new export.** JSR's `deno doc --lint` requires a `@module` JSDoc tag on each exported module. The existing `mod.ts` has one; the new export (whichever option) should mirror it. **Not a plan defect** — the publish dry-run gate surfaces this if missed.
3. **Empirical dx check log retention.** D2 requires Codex to verify the dx resolution rule against a reference package. The result + the chosen A/B + the rationale should be appended to `worklog.md` (per plan §Pipeline step 2). **Not a plan defect** — the slice's gates do not enforce this, but the plan explicitly requires it; IMPL-EVAL should confirm the worklog entry exists.
4. **Option B debt note registration.** If Option B is forced, an `arch-debt.md` entry must be added with owner/target/reason/linked-plan/status. **Not a plan defect** — the plan names the disposition; IMPL-EVAL should confirm the entry is created or not needed.
5. **Post-publish `deno dx` smoke on #111 close-out.** The plan correctly defers this. After CLI publishes (last in dependency order), the run that closes #111 should record the end-to-end `deno dx jsr:@netscript/cli …` smoke evidence (the surfaced form actually resolving + forwarding args + producing the expected output). **Not a plan defect** — out of scope for this slice; tracked on #111.

### Cycle

- **Plan-EVAL cycle: 1 of 1** (verdict: **PASS**).
- Implementation may begin on the strength of this verdict per `plan-gate.md`. S1 → S2 → IMPL-EVAL → merge → #111 ordered publish → post-publish dx smoke close-out.

## Notes

- I did **not** edit `packages/`, configs, lockfiles, or any file other than this `plan-eval.md` artifact (the trigger-mandated hard stop).
- All evidence is cited with file + line references; no fabrication.
- The plan is small enough to be a two-commit slice (one PR `feat/cli-dx-runnable`), well within harness budget.
- The slice does **not** depend on any other open slice — it can ship independently of the road-to-JSR program (it only **gates** the CLI publish, which is sequenced via #111).
- The `dx` vs `x` naming in docs: the request body uses `deno dx` (the user-facing Deno 2.6+ shorthand) and Deno 2.6 aliases `dx` → `x` (per the Deno 2.6 blog cited in research.md). The plan uses `deno dx` consistently in surfaced form (matching the user directive and the marketing form), and `deno x` in the empirical check (matching the docs example `deno x jsr:@std/http/file-server`). This is correct and non-contradictory.
- Verdict file: `.llm/tmp/run/cli-dx-runnable/plan-eval.md` (this file).