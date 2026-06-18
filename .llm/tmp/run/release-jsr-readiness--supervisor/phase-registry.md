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
| Status | **PLAN-EVAL PASS** ✅ (cycle 1, 2026-06-18) — draft **PR #56** (`docs/user-site` → umbrella, head `6c6f2672`). OpenHands/minimax-M3 run **27766416695** = `success`; verdict `plan-eval.md` committed back to branch. All 6 spot-checks VERIFIED (US-5 denominator=26, US-6 fresh-ui=1 Codex source slice, US-7 Pages subpath `https://rickylabs.github.io/netscript/`, gates concrete, boundary clean, open decisions non-blocking) + off-limits guardrail PASS. User-gated downstream (non-blocking): `workflow`-scoped token for Pages CI YAML. **No slice launches until BOTH docs groups PASS and plans+scorecard are presented to the user (binding).** |

### Deliverables
- Diátaxis-structured site (tutorial + how-to + reference + explanation); per-package reference generated from `deno doc`; standardized READMEs; Lume site + GitHub Pages CI.

### Success criteria
- Scorecard **A1–A3 + E1**. `deno doc --lint` 0 (full-export) per unit; READMEs to standard; Lume build + Pages deploy green; doc-freshness gate wired.

### Notes
- Research grounding: `.llm/tmp/docs/docs-architecture-research.md` (Diátaxis, Lume→Pages, Laravel/TanStack/Medusa). Pages subpath (`rickylabs.github.io/netscript`) likely needs Lume `location` config — OQ. Pages workflow file needs a local-git push (PAT lacks `workflow` scope).

## Group 4 — docs/internal-overhaul (contributor docs)

| Field | Value |
|-------|-------|
| Group branch | `docs/internal-overhaul` (off `release/jsr-readiness`) |
| Nested run ID | `docs-internal-overhaul--contributor` |
| Surface | Internal/contributor docs: harness, doctrine, `.llm/` architecture, `AGENTS.md`/`CLAUDE.md` surface, root ops docs; document `deno doc` in harness + `jsr-audit` skills |
| Archetype | N/A — docs/internal |
| Scope overlay | `SCOPE-docs.md` |
| Status | **PLAN-EVAL cycle-1 FAIL_PLAN → REMEDIATED → cycle-2 DISPATCHED** (2026-06-18) — draft **PR #57** (`docs/internal-overhaul` → umbrella). **Cycle 1** (run **27766416302** = `success`, `plan-eval.md` committed): 7/8 Plan-Gate boxes PASS; locked IO-2…IO-6, boundary, off-limits guardrail all VERIFIED. **Single FAIL = "Commit slices (< 30, gate + files each)"** — plan lacked a `## Commit Slices` enumeration (required per `run-loop.md §3b` item 5). **Remediation** (head now `565e672b`): added `## Commit Slices` (S0–S8, each with what-it-proves + proving gate + path-level files), aligned to the evaluator's illustrative shape + LD-DOCS-LANE; NO locked decision / scope / gate / risk-register changed. **Cycle-2 PLAN-EVAL re-triggered** (comment `4743269790`, OpenHands/minimax-M3) → Actions run **27768669083** (in_progress; sibling `27768683336` is the bot status-comment echo → skips). Cycle **2 of 2** — a 2nd FAIL escalates to user. No slice before PASS. |

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
- Groups 3 & 4 (docs) not yet launched — branches/sub-PRs created when their Research+Plan starts (handover §5.5).
