# Phase Group Registry: jsr-readiness

The group map for the `release/jsr-readiness` umbrella (supervisor run). See
`.llm/harness/workflow/supervisor.md`. One section per **phase group** (= one sub-run:
branch + worktree + nested run + sub-PR + evaluator pass). The umbrella exit gate is
`scorecard.md`.

## Run Metadata

| Field | Value |
|-------|-------|
| Supervisor run ID | `release-jsr-readiness--supervisor` |
| Integration branch | `release/jsr-readiness` (off `main` @ `cc3b8731`) |
| Base branch | `main` |
| Surface | JSR-readiness of the **26 publish targets** (27 declare name+exports; `cli-e2e` is `publish:false`); waves E=25 non-CLI + F=`@netscript/cli`. Exit = `scorecard.md` PASS |
| Exit gate | `scorecard.md` (evaluator-owned, separate session) |
| Roles | Claude supervises · OpenHands evaluates (separate session) · Codex WSL implements **framework/source** (mobile-visible) · **docs authoring → Claude dynamic workflow** (harness-skill-driven agents; OpenHands validates per-package/per-domain) per LD-DOCS-LANE |

### LD-DOCS-LANE — docs-authoring implementation lane (decided 2026-06-18, user)

- **Docs authoring** (Lume content, per-package README + reference prose, internal-doc consolidation)
  is implemented by a **Claude dynamic workflow**, NOT WSL Codex. Rationale: language-dominated work
  where Opus 4.8 ≫ Codex/GPT-5.5, and it touches **no `packages/`/`plugins/` source**.
- Authoring agents run **under the harness SKILL** (`netscript-harness` + `jsr-audit` /
  `netscript-doctrine` / `deno-fresh` as relevant). Model routing per slice: Opus med (reference /
  concepts), Opus low (README standardization), Sonnet 4.6 (trivial link/cleanup).
- **Validation = OpenHands (qwen 3.7 max, separate session) with a per-package / per-domain verdict.**
  The workflow is generator-only; it does not self-certify. (See cost note below — realized as a
  per-group IMPL-EVAL emitting a per-unit verdict table, not one Actions run per package, unless the
  user directs otherwise.)
- **`@netscript/fresh-ui` `*Namespace` source slice stays WSL Codex** (framework code, public-API,
  off-limits to the workflow). Group-3 IMPL = Claude-workflow doc authoring + 1 Codex source slice.
- Amends `CLAUDE.md` Workflow Policy (docs-authoring exception recorded there). Gate unchanged: no
  authoring run launches until **both** docs PLAN-EVALs PASS and plans+scorecard are presented.

## Status Legend

| Status | Meaning |
|--------|---------|
| `planned` | In the map, not started |
| `active` | Group branch/worktree launched; implementation in progress |
| `evaluating` | Handed to a separate evaluator session |
| `merged` | Evaluator `PASS` (or accepted `FAIL_DEBT`); merged `--no-ff` |
| `blocked` | Waiting on a dependency or a user decision |
| `rescope` | Under rescope (see `escalations/`) |

## Sequencing (handover §3)

```
chore/prod-readiness  ┐
chore/deps-hygiene    ├─ run in parallel (independent surfaces)
docs/* RESEARCH+PLAN  ┘
        │
        ▼  (cleanup + hygiene MERGED — docs document the clean, hygienic surface)
docs/user-site IMPL · docs/internal-overhaul IMPL
        │
        ▼
scorecard PASS (evaluator) ──► publish prep: E (25 non-CLI OIDC) ──► F (@netscript/cli last, LD-7)
                                                  └─ cli-e2e (publish:false) is NEVER published
```

Forced order: **docs IMPL** does not start until `chore/prod-readiness` **and**
`chore/deps-hygiene` are `merged`. The two docs sub-runs may run Research+Plan in
parallel with cleanup/hygiene. All four sub-runs branch off the umbrella and PR into it.

## Group 1 — chore/prod-readiness (repo cleanup)

| Field | Value |
|-------|-------|
| Group branch | `chore/prod-readiness` (off `release/jsr-readiness`) |
| Nested run ID | `chore-prod-readiness--cleanup` |
| Surface | Repo-wide, incl. root: dead code, ALL backward-compat shims, temp/garbage/build cruft, stray root files |
| Archetype | N/A — cross-cutting repo hygiene (no public-API archetype). Touches many surfaces; adds/removes no API |
| Scope overlay | partial `SCOPE-docs.md` (deletes dead doc *files*; does **not** rewrite doc *content*) |
| Sub-PR | #54 (draft, base `release/jsr-readiness`) |
| Status | `merged` ✅ — IMPL-EVAL PASS (run 27761272236, evaluate.md `646218f9`); **merged into `release/jsr-readiness` via PR #54 (merge_sha `a4db5527`, --no-ff)** on 2026-06-18 per user go-ahead. All 6 cycle-2 decisions VERIFIED. Debt: D-G1-1/2/3a/5 + `database-connectivity-legacy-connstring-alias`. |
| Impl thread | `019edaa8-3b82-70a1-9a38-129f189ca807` (Codex, daemon-managed, mobile-visible) |
| Impl worktree | `/home/codex/repos/netscript-prod-readiness` (ext4 native, `chore/prod-readiness` @ launch base `0f352ea`) |
| Steering | `codex exec resume 019edaa8-3b82-70a1-9a38-129f189ca807 "<follow-up>"` (NEVER a 2nd `send-message-v2` on this worktree) |

### Pre-conditions
- Umbrella branch current with `main`.

### Deliverables
- Zero dead/temp/garbage/build cruft; all back-compat shims/aliases removed (functional workarounds excluded); dead doc files deleted; `AGENTS-handoff.md` relocated into the `openhands-handoff` skill + root file deleted (no other stray root files exist).

### Success criteria
- Scorecard **C1**. `publish:dry-run` 0 slow types (25-unit batch) still green; `check`/`test`/`lint`/`fmt` green; `arch:check` not regressed; `e2e:cli` at merge-readiness.

### Notes
- Off-limits: `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, catalog/`catalog:` (LD-7/LD-8 + Option-A law). Deletes only — **no new aliases**. Removing a shim requires a consumer scan first.

## Group 2 — chore/deps-hygiene (dependency tooling)

| Field | Value |
|-------|-------|
| Group branch | `chore/deps-hygiene` (off `release/jsr-readiness`) |
| Nested run ID | `chore-deps-hygiene--deps` |
| Surface | `deno.json` task/dep hygiene + dependency-shape **tooling** (scanners). Ships tooling; does **NOT** restructure the catalog |
| Archetype | A6-adjacent for the scanner scripts (cli-tooling); otherwise N/A repo tooling |
| Scope overlay | none |
| Sub-PR | #55 (draft, base `release/jsr-readiness`) |
| Status | `merged` ✅ — IMPL-EVAL PASS (run 27760239494); **merged into `release/jsr-readiness` via PR #55 (merge_sha `4380203c`, --no-ff)** on 2026-06-18 per user go-ahead. Only conflict was an append-collision in `arch-debt.md` (resolved as union of both groups' debt entries). Post-merge `deno task deps:check` exits 0 on the umbrella. D-1…D-7 all PASS; D-7 enforcement wiring (`deps:check` → `ci:quality` + `arch:check`). |
| G2 eval follow-ups | (1) **Unit count drift — RESOLVED 2026-06-18:** 27 members declare `name`+`exports`; canonical `publish:dry-run` simulates **25**; real publish denominator **26**. The 2 not in the batch: `@netscript/cli-e2e` (`publish:false`, nested under `packages/cli` — **never published**) and `@netscript/cli` (publishable; LD-7 publish-last/F-wave). Corrected waves: **E = 25 non-CLI**, **F = `@netscript/cli`**, cli-e2e excluded. (1b) **Publish-gate blind spot (NEW, publish-phase action):** the batch `publish:dry-run` scanner discovers `packages/cli` but emits no cli simulation (25 not 26) while exiting 0 — yet a **standalone** `deno publish --dry-run` in `packages/cli` succeeds (EXIT=0, only non-fatal `unanalyzable-dynamic-import` warnings from runtime plugin loading). → CI's dry-run does NOT validate the F-wave unit; the F dispatch MUST run cli's own `deno publish --dry-run` before the real publish. Root cause of the batch omission unconfirmed (likely catalog-materialization/workspace-resolution interaction); investigate at publish-phase, candidate arch-debt. (2) **Non-blocking debt:** add arch-debt note for `queue`/`amqplib` `^0.10.3 vs ^2.0.1` divergence for a future convergence slice. (3) Pre-existing `arch:check` doctrine baseline red (58 FAIL/147 WARN) — NOT attributable to G2; `deps:check` step itself green. |
| Impl thread | `019edaa8-af32-7011-899c-00e14f730ef1` (Codex, daemon-managed, mobile-visible) |
| Impl worktree | `/home/codex/repos/netscript-deps-hygiene` (ext4 native, `chore/deps-hygiene` @ launch base `b6985c6`) |
| Steering | `codex exec resume 019edaa8-af32-7011-899c-00e14f730ef1 "<follow-up>"` (NEVER a 2nd `send-message-v2` on this worktree) |

### Deliverables
1. **JSR-dep centralization scanner** — flags any `jsr:` dep used by >1 member with divergent versions; structured JSON; wired into CI + `arch:check`.
2. **npm catalog-compliance scanner** — any `npm:` dep used by >1 member, or not bound to a single member, MUST be a `catalog:` ref (not inline pin); fails on violation; wired in.
3. **`file:`/`link:` audit** — fail if any publishable unit ships one. Do NOT adopt them.
4. **`deno task` prune** — drop dead/dup tasks; `--filter` by dir; `set -e` where needed.
5. **`deno bump-version` wrapper** — replace the bespoke bump tool with a thin wrapper over native Conventional-Commit-derived `deno bump-version`; keep structured output.

### Success criteria
- Scorecard **D1–D5 + E2**. Early check: confirm member `catalog:` refs resolve on Deno 2.8.3 before touching anything. `publish:dry-run` still green.

### Notes
- Off-limits (NEVER): catalog restructuring / de-cataloging; version pins; `scaffold-versions.ts`. Catalog law: npm via `catalog:`, JSR inline `jsr:` per member. No release-time `deno.json` transform.

## Group 3 — docs/user-site (external/user docs)

| Field | Value |
|-------|-------|
| Group branch | `docs/user-site` (off `release/jsr-readiness`) |
| Nested run ID | `docs-user-site--diataxis` |
| Surface | External user docs: per-package reference (`deno doc` + standardized README, `deno doc --lint` clean) + conceptual onboarding; Lume → GitHub Pages |
| Archetype | N/A — docs (touches every unit's doc/README surface) |
| Scope overlay | `SCOPE-docs.md` |
| Status | **MERGED → umbrella** ✅ (2026-06-18, merge `b943e68d`); PLAN-EVAL + IMPL-EVAL PASS — **PR #56** (`docs/user-site` → umbrella, head `6c6f2672`). OpenHands/minimax-M3 run **27766416695** = `success`; verdict `plan-eval.md` committed back to branch. All 6 spot-checks VERIFIED (US-5 denominator=26, US-6 fresh-ui=1 Codex source slice, US-7 Pages subpath `https://rickylabs.github.io/netscript/`, gates concrete, boundary clean, open decisions non-blocking) + off-limits guardrail PASS. User-gated downstream (non-blocking): `workflow`-scoped token for Pages CI YAML. **No slice launches until BOTH docs groups PASS and plans+scorecard are presented to the user (binding).** |

### Deliverables
- Diátaxis-structured site (tutorial + how-to + reference + explanation); per-package reference generated from `deno doc`; standardized READMEs; Lume site + GitHub Pages CI.

### Success criteria
- Scorecard **A1–A3 + E1**. `deno doc --lint` 0 (full-export) per unit; READMEs to standard; Lume build + Pages deploy green; doc-freshness gate wired.

### Notes
- Research grounding: `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis, Lume→Pages, Laravel/TanStack/Medusa). Pages subpath (`rickylabs.github.io/netscript`) likely needs Lume `location` config — OQ. Pages workflow file needs a `workflow`-scoped token push: **RESOLVED — the in-Credential-Manager PAT (`ghp_hT8…`, login `rickylabs`) carries `repo, workflow` scope** (verified 2026-06-18 via `X-OAuth-Scopes`), so G3-DEPLOY is unblocked; no new token needed.

### IMPL launch (2026-06-18, after user "proceed" + gated answers)
Two parallel lanes (LD-DOCS-LANE doc bulk on `docs/user-site`; fresh-ui source fix on its own branch). Design locked: US-8 (22 primary reference pages; 4 `*-core` folded as Internals subsections; all 26 in lint denominator), US-9 (standardized README template, generated per unit + `check-readme-standard.ts` conformance checker). Slices G3-0…G3-6 (doc lane) + G3-FUI (Codex) + G3-DEPLOY (Pages, now unblocked).

- **Doc-authoring lane — Claude dynamic workflow (scaffold + pilot first):** run `wf_b885234c-937` (task `wptxflbog`), background. Phases: Scaffold (G3-0 Lume skeleton + Diátaxis nav + `location` subpath; G3-1 README standard + `check-readme-standard.ts` + `docs:readme:check` task) → Pilot (G3-2 `deno doc`→reference page for `@netscript/logger`; G3-3 standardized README) → Verify (`deno task build` + pilot render + `deno doc --lint` logger=0 + checker). **Gates the full fan-out** to the remaining 21 reference pages + 25 READMEs + Diátaxis concepts. Agents write via Bash absolute paths into the `g3-user-site` worktree (workflow-subagent worktree-pin lesson). Models per CLAUDE.md doc exception: Opus med (Lume/reference), Opus low (README/checker).
- **fresh-ui lane — WSL Codex daemon-attached slice (G3-FUI):** user chose "drive now".
  - Daemon: `connected`, server `YogaBook9i`, env `env_e_6a2d72f8404c832aa279d30e55f13ee3`, `remoteControlEnabled: true` (mobile-visible).
  - WSL worktree: `/home/codex/repos/netscript-fresh-ui-namespace`
  - Branch: `fix/fresh-ui-namespace-exports` (off `origin/release/jsr-readiness` @ `2a2aec70`) — **own branch → own PR into umbrella**, keeps docs PR #56 docs-only.
  - Codex thread id: **`019edc0d-8e77-7931-9cd7-8f7cb93b2b2d`** (`codex exec --json`, full-access, brief at worktree `.llm/tmp/g3-fui-brief.md`).
  - Steering command: `codex exec resume 019edc0d-8e77-7931-9cd7-8f7cb93b2b2d "<msg>"` (one active turn per worktree).
  - Scope: export the 7 private `*Namespace` types (Accordion/Dialog/Drawer/Popover/Sheet/Tabs/Tooltip) + re-export from public entries; proving gate `deno doc --lint` of the 3 public entries → 0 (was 7). Commit + push; supervisor opens the PR. SCOPE-frontend; no version/catalog/other-package edits; lock hygiene preserved.
- **Per-group IMPL-EVAL** (OpenHands qwen 3.7 max, separate session) follows once each lane lands — not ~26 separate Actions runs.

**Progress (2026-06-18, autonomous tick):**
- **Doc pilot GREEN** (workflow `wf_b885234c-937`, 5 agents): Lume v2.5.4 site builds (`_site` exit 0), US-7 subpath nav verified, US-1 Diátaxis IA up; README standard + `check-readme-standard.ts` works (template fixture exit 0; default 26-unit scan correctly RED pre-standardization); `@netscript/logger` reference page generated from `deno doc` (lint exit 0) + README standardized. Root build task = `deno task --cwd docs/site build`; `docs/site` deliberately outside workspace globs (no root check/publish pollution). Pilot files uncommitted in the g3 worktree — committed as a bulk after fan-out.
- **Doc fan-out LAUNCHED** (workflow `wf_910e9292-7b7`, task `wwpuc730q`, background): 21 reference pages (4 `plugins/*` fold their `packages/plugin-*-core` as `## Internals` per US-8) + 25 standardized READMEs (Opus low) + 4 Diátaxis concept pages (getting-started, add-a-plugin, architecture, plugin-model) + a Verify barrier (full build + README checker + per-unit `deno doc --lint` 26-tally + `_site` link scan). Layout: 26 = 22 `packages/` (18 non-core + 4 `-core`) + 4 `plugins/`. Agents write via Bash absolute paths into the g3 worktree; supervisor reconciles any worktree-pin leak into the umbrella afterward.
- **fresh-ui (G3-FUI) → PR #58 OPEN** (`fix/fresh-ui-namespace-exports` → umbrella, tip `8c26459`). Codex thread `019edc0d…` completed: 7 `*Namespace` types exported, `deno doc --lint` 7→**0** (supervisor re-verified), `deno check` 0, 8 files all under `packages/fresh-ui/`, no churn/lock. **Trade-off flagged for IMPL-EVAL:** members changed from `typeof <Subcomponent>` → `(props: any) => unknown` (clears secondary private-type-refs but degrades public type precision + injects `any`); alternative = export subcomponents to preserve `typeof`. **IMPL-EVAL dispatched** (OpenHands qwen 3.7 max, comment `4745175329`) with the (a)-lossy-vs-(b)-typeof ruling question + `deno lint` no-explicit-any check. Awaiting verdict.

**Fan-out RESULT (2026-06-18, workflow `wf_910e9292-7b7` complete — 51 agents, 2.86M tok, 28.5min):**
- **Content: ALL GREEN.** 0/50 content agents failed. 21 reference pages + 25 READMEs + 4 concept pages authored. Build exit 0 (31 files, Lume v2.5.4). README checker **26/26 conform** (A2 PASS). Committed to `docs/user-site` (PR #56) in 2 slices → tip `cdc02af4` (`8be87e90` site+checker+tasks; `cdc02af4` 26 READMEs). **Umbrella worktree clean — zero worktree-pin leaks** (agents wrote via Bash/PowerShell absolute paths; one agent used PS `WriteAllText` to dodge heredoc pipe-escaping).
- **Verify = NO-GO** on two separable blockers (neither is content quality):
  - **Blocker B (doc-lane, in scope) = FIXED.** Lume default markdown emitted headings with **no `id`** → 12 in-page `#anchor` targets broken. Fix = `docs/site/_config.ts` + `markdown-it-anchor@9.2.0` (GitHub-style slugify, h1–h4). Post-fix audit: **0 broken in-page anchors / 31 pages**. Also untracked `docs/site/_site/` (build output erroneously committed in `8be87e90`) + gitignored it, and locked the new dep. Pushed to `docs/user-site` (PR #56) → tip `b8085a1a`.
  - **Blocker A = FALSE POSITIVE — WITHDRAWN (2026-06-18).** User authorized a Codex slice; deeper verification (supervisor) showed the premise was wrong, so **no slice was launched**. Root cause: the fan-out Verify agent ran `deno doc --lint` on each package's `mod.ts` **in isolation**, which falsely reports any type re-exported from a *sibling* export entry as `private-type-ref`. The **authoritative** check — `deno doc --lint` over each unit's **full export map** (how JSR evaluates a package) — shows `packages/plugin`, `packages/telemetry`, `packages/database` all **CLEAN** (their "private" types ARE public via `config/mod.ts`, `context/mod.ts`, etc.), and `deno publish --dry-run` passes all three. **Authoritative full-export-set A1 census = 25/26 CLEAN**; the ONLY real failure is **fresh-ui** (7 `private-type-ref` — the `*Namespace` types genuinely exported nowhere), fixed by PR #58 → **26/26 once #58 merges.** Original scope (fresh-ui = sole A1 failure) was correct. **LESSON:** A1 must be measured full-export-set, never single-entry → recorded in `.llm/harness/lessons/` + memory.
- **Group 3 docs IMPL-EVAL DISPATCHED** on PR #56 (comment `4745606283`, OpenHands qwen 3.7 max, per-domain verdict — build+nav / reference accuracy / READMEs / Diátaxis) per LD-DOCS-LANE (generator≠evaluator). Tip `b8085a1a`. Trigger explicitly warns the evaluator to lint **full-export-set** (avoid the Blocker-A measurement trap). Awaiting verdict. PR #56 PLAN-EVAL (minimax-m3) already PASSED earlier (comment 14:25).
- **fresh-ui PR #58 cycle-2 = `PASS`** (OpenHands qwen 3.7 max, comment `4745431155`, trace `run-27783995605-1`). All 5 gates green: `deno doc --lint` 0, `deno lint` 0 `no-explicit-any` (was 42), `deno check` 0, scope clean (8 files all under `packages/fresh-ui/`, no version/catalog/lock churn), `typeof <Subcomponent>` precision genuinely restored (ruling (b) fulfilled, not faked). **PR #58 MERGED** into `release/jsr-readiness` (merge commit `ba0c1e08`, 2026-06-18, user-authorized). Post-merge re-verify in umbrella: fresh-ui `deno doc --lint` = 0. **A1 GATE = 26/26 publishable units doc-lint clean (full-export-set).**


**Group 3 CLOSE (2026-06-18) — PR #56 MERGED into `release/jsr-readiness` (merge `b943e68d`).**
- **IMPL-EVAL = PASS** (OpenHands qwen 3.7 max, run 27785249920, comment `4745607646`): all 4 domains (build+nav / reference accuracy / READMEs / Diátaxis) green.
- **Acceptance-time rescope D-1 (significant, user-authorized):** the content-scoped IMPL-EVAL did not gate visual styling or inter-page base-path links. Supervisor Playwright live-check found (1) zero CSS (scope gap — plan never specced a theme) and (2) in-body root-absolute links broken on 31/31 pages under the `/netscript/` subpath (real US-7 defect). User chose **"Full themed site + links"** + steer to match `@netscript/fresh-ui` tokens + `netscript-start` playground.
- **Theme FAIL_FIX (LD-DOCS-LANE Claude workflow `wf_e77e669a-f2b`, 4 agents):** ported fresh-ui `--ns-*` tokens (verbatim copy — user chose ship-copy over a sync-task) + playground SidebarShell chrome into the static Lume site; wired Lume `base_path` (link fix) + `pagefind` (search) + `code_highlight`; dark mode (`data-theme` + `ns-theme`), favicon. Commit `58d2d138` (docs/site only, 1324 ins). Root lock untouched, `_site` gitignored.
- **Supervisor Playwright live-check (served under real `/netscript/` subpath) = ALL PASS:** build exit 0 / 31 pages; **0 bare root-absolute internal links** (1093 now `/netscript/…`); tokens+DM Sans+copper+SidebarShell render; dark-mode toggle persists to `ns-theme`; sidebar 27 items + hierarchical active-highlight; pagefind search; `hljs` code highlighting; favicon linked; **0 console errors** on real pages; logger symbols + tables intact. Screenshots in `.llm/tmp/run/docs-user-site--diataxis/live-check/`.
- **Merge = user-authorized** ("if all live checks pass then you can merge"; live checks passed; merge-gate decision = "Merge now"). **A1 stays 26/26.** Optional deferred follow-up: token sync/drift-check task (`tokens:sync`/`:check`) instead of the verbatim copy.

## Group 4 — docs/internal-overhaul (contributor docs)

| Field | Value |
|-------|-------|
| Group branch | `docs/internal-overhaul` (off `release/jsr-readiness`) |
| Nested run ID | `docs-internal-overhaul--contributor` |
| Surface | Internal/contributor docs: harness, doctrine, `.llm/` architecture, `AGENTS.md`/`CLAUDE.md` surface, root ops docs; document `deno doc` in harness + `jsr-audit` skills |
| Archetype | N/A — docs/internal |
| Scope overlay | `SCOPE-docs.md` |
| Status | **PLAN-EVAL PASS** ✅ (cycle 2, 2026-06-18) — draft **PR #57** (`docs/internal-overhaul` → umbrella, head `565e672b`). **Cycle 1** (run `27766416302`): 7/8 boxes PASS, single FAIL = missing `## Commit Slices`. **Remediated** (added S0–S8 with what-it-proves + proving gate + path-level files; LD-DOCS-LANE annotation; NO locked decision / scope / gate / risk changed). **Cycle 2** (run **27768669083** = `success`, `plan-eval.md` overwritten on branch): **8/8 boxes resolved (7 PASS + 1 N/A)** — the previously-failing Commit-slices box now PASS; no regression to the other 7; off-limits guardrail re-checked empty on tree. Evaluator NITs (non-blocking, IMPL-time): G-links has no dedicated script yet (manual check); keep each slice's per-domain OpenHands validation strictly sequential; re-check Group-1 doc-file coordination if G1 ships more deletions. No slice before user go-ahead. **IMPL DONE → IMPL-EVAL dispatched (2026-06-18):** Claude workflow `wf_ea6d8234-e50` authored all 7 slices; supervisor reconciled the workflow's worktree-pin leak (S1+S4 patched from umbrella onto the docs branch; umbrella reverted clean), regenerated mirrors, ran gates (**G-mirror PASS, G-surface PASS**; G-links surfaced **only 26 pre-existing `impeccable`-skill dead links** → arch-debt, Group-4 surface clean), committed 8 commits (S1 `17f658ed` · S2 `ade81736` · S3 `95b14136` · S4 `b7baca34` · S5 `8073bb57` · S6 `ad6d559f` · S7 `42da427b` · bookkeeping `6ae41fc3`/`7a8b1c38`), pushed tip **`7a8b1c38`**. **IMPL-EVAL** (OpenHands qwen 3.7 max, separate session) dispatched via PR #57 comment `4743777688` — per-slice verdict table requested; open question = `docs:maintenance` red on the out-of-scope `impeccable` links (recommend scoping the checker). The S7 gate replaces the "G-links no dedicated script" NIT (`check-internal-doc-links.ts` + `docs:links`/`docs:maintenance` tasks). **IMPL-EVAL VERDICT: PASS ✅** (OpenHands qwen 3.7 max, run **27772128294** = `success`; comment `4743780737`; `evaluate.md` committed back, branch tip then `a7e21995`). All 7 slices PASS with gates independently re-verified (G-mirror exit 0 = 17 skills mirrored; G-surface exit 0; G-links exit 1 = 26 broken links **all** in `impeccable`, Group-4 surface clean; G-doctrine manual = S4 dead-link de-link only, no decision text changed; boundary `git diff …--name-only | grep packages/` empty, no files deleted). IO-1…IO-6 all OK; generator≠evaluator confirmed; no `deno.lock` committed. **Open-question ruling: (c) accept the `impeccable` links as recorded debt — does NOT block PASS** (evaluator argued scoping the checker would weaken an honest gate; supervisor honors (c), not the recommended (a)). One **minor non-blocking finding** = worktree-pin reconciliation was in `worklog.md` but not `drift.md`; **remediated** by supervisor (drift.md minor entry, commit `0d956df1`, pushed). **Group 4 lane = VERIFIED GREEN — LD-DOCS-LANE pilot validated.** **PR #57 un-drafted + merge-ready (`clean`) into the umbrella; merge itself gated to user dispatch (classifier blocks the external merge).** **Augment bot review round (post-IMPL-EVAL, 4 suggestions) addressed in `224ca537`** — static-gates step-table reorder to match `deno.json` order; `docs:links` gains `--no-lock` (lock hygiene); checker docstring corrected (out-of-scope link targets ARE existence-checked); leading-`/` links resolved repo-root-relative. Behavior re-verified non-regressive (docs:links still exit 1 on only the 26 `impeccable` links; `deno.lock` clean). Fixes are S7-tooling/doc only, no framework code, no substantive change to validated slices; reply comment `4744777964`. Review threads left open for maintainer (thread-resolve also classifier-gated). |

### Deliverables
- Consolidated, de-duplicated, prod-ready internal docs; `deno doc` documented (npm rendering, JSX/TSX highlighting, npm-without-types fixes) in the harness + `jsr-audit` skills.

### Success criteria
- Scorecard **F1 + E1**. `validate-claude-surface.ts` green; no broken internal cross-refs; harness doc-maintenance gate wired.

### Notes
- Keep `.claude/skills/` **generated** from `.agents/skills/` — do not hand-edit mirrored files. Run `.llm/tools/agentic/validate-claude-surface.ts` after edits.

## Open umbrella-level items

- **GitHub access (RESOLVED 2026-06-18):** `gh`/GitHub MCP absent, but the rickylabs PAT in Windows Credential Manager (repo+workflow) drives the REST API directly via `git credential fill` + `curl`. Draft sub-PRs #54/#55 were created this way; PR-comment triggers + merges use the same path. (PAT is in the chat transcript — rotate/revoke after the program.)
- **Groups 1 & 2 launched (2026-06-18):** branches `chore/prod-readiness` + `chore/deps-hygiene` off the umbrella; draft sub-PRs #54 + #55; plan/research/Design ready on each (inherited from the umbrella + a launch entry in each group worklog). Worktrees deferred to **implementation launch** (WSL Codex, native ext4 — not local Windows `.worktrees/`); recorded as a reasoned deviation from supervisor.md §2.
- **PLAN-EVAL complete for Groups 1 & 2 (2026-06-18) — BOTH PASS:** ran in parallel (user-authorized), each a separate OpenHands minimax-M3 session.
  - **Group 1** (`chore/prod-readiness`, PR #54): cycle 1 = `FAIL_PLAN` (7 mechanical fixes — F3 functional/off-limits + arch-debt, S4′ deprecate-not-delete, S5 refactor-not-delete, S6 scaffolder consumer, scaffold.runtime smoke per public slice, per-slice LOC budget, bounded G1-6). Supervisor applied all 7 in-role → cycle 2 = **PASS** (run 27755852001). Two FAIL_PLAN cycles allowed; passed on cycle 2.
  - **Group 2** (`chore/deps-hygiene`, PR #55): cycle 1 = **PASS** (run 27755191977). Catalog live-invariant spot-check (8 points) confirmed against tree; off-limits/catalog guardrail PASS. One non-blocking NIT for D-2 (compliance scanner anchors on real `from "npm:…"` imports + `deno.json` imports/scopes, NOT substring; allow-list `windows.ts` bundle-external map + `registry.manifest.ts` dependency array) recorded in plan.md.
  - **Both Plan-Gates cleared. NO implementation slice starts until the user reviews both plans and explicitly dispatches the generators (WSL Codex, daemon-attached, mobile-visible).** IMPL-EVAL (post-impl) = OpenHands qwen 3.7 max, separate session.
- **Groups 1 & 2 implementation LAUNCHED (2026-06-18) — WSL Codex daemon-attached, mobile-visible, in parallel (user-authorized "Dispatch both in parallel"):**
  - **Daemon health (pre-launch gate, user-requested):** `codex remote-control start --json` → `status: connected`, `remoteControlEnabled: true`; managed pair (app-server `--remote-control` + `daemon pid-update-loop`) confirmed; held `connected` on an idle re-check. The transient `not managed` seen earlier is reported only *while a turn is in-flight* (app-server busy), not a daemon fault — verified on codex-cli 0.141.0.
  - **G1** thread `019edaa8-3b82-70a1-9a38-129f189ca807`, worktree `/home/codex/repos/netscript-prod-readiness`, brief `…/chore-prod-readiness--cleanup/implement.md` (committed `0f352ea`). Attach proof: `approval_policy: Never`, `sandbox: DangerFullAccess`, cwd matches, turn InProgress. Slices G1-0…G1-6.
  - **G2** thread `019edaa8-af32-7011-899c-00e14f730ef1`, worktree `/home/codex/repos/netscript-deps-hygiene`, brief `…/chore-deps-hygiene--deps/implement.md` (committed `b6985c6`). Attach proof: `approval_policy: Never`, cwd matches, turn InProgress. Slices D-1…D-6.
  - **Steering (not a 2nd send):** `codex exec resume <thread-id> "<follow-up>"`. One active turn per worktree.
  - **PR-comment division:** Codex pushes per slice + maintains `commits.md`/`worklog.md` (no `gh` auth in WSL); supervisor mirrors slice progress to PR #54 / #55 via the rickylabs PAT. IMPL-EVAL (post-impl) = OpenHands qwen 3.7 max, separate session.
  - **DO NOT push to `chore/prod-readiness` or `chore/deps-hygiene` from any other clone while Codex is live** — it would non-fast-forward the per-slice pushes. Supervisor bookkeeping during impl stays on this umbrella branch.
- **Docs PLAN-EVALs BOTH PASS (2026-06-18) — program at the user gate:** Group 3 `docs/user-site` PR #56 PASS (cycle 1, run 27766416695); Group 4 `docs/internal-overhaul` PR #57 PASS (cycle 2, run 27768669083, after a single-box cycle-1 FAIL remediated in-role). **Binding gate now active:** no docs-authoring generator launches until the user reviews both plans + the JSR-readiness scorecard and explicitly dispatches. On go-ahead, IMPL = LD-DOCS-LANE (Claude dynamic workflow authoring — Group 3 per-package, Group 4 per-domain, harness-skill-driven, Opus/Sonnet routed) + per-package/per-domain OpenHands validation (qwen 3.7 max, separate session) + the **1 `@netscript/fresh-ui` `*Namespace` source slice** (WSL Codex, mobile-visible). Open question for the user at presentation: OpenHands per-package validation mechanism (≈26 literal Actions runs vs. one per-group IMPL-EVAL emitting a per-unit verdict table — supervisor recommends the latter on cost).
- **User go-ahead given ("approved", 2026-06-18) + scorecard presented/reconciled (D-4).** Validation mechanism approved = **per-group IMPL-EVAL emitting a per-unit verdict table** (NOT ~26 separate Actions runs). Docs IMPL launched per LD-DOCS-LANE.
- **Group 4 authoring LAUNCHED (2026-06-18) — Claude dynamic workflow** `wf_ea6d8234-e50` (task `wzg4ptnzh`): slices S1/S2/S4/S5 parallel → S3→S6 → S7, Opus-routed (S3 high, rest medium), under the harness SKILL, write-only into worktree `.claude/worktrees/g4-internal` (docs/internal-overhaul @ `c1b5f03a`). Supervisor handles git per slice + `agentic:sync-claude` regen + `agentic:check-claude` (F1/G-surface) + internal link check, push to PR #57, then OpenHands per-domain IMPL-EVAL (qwen 3.7 max, separate session). Group 3 + the fresh-ui WSL Codex source slice follow once the G4 lane is validated.
