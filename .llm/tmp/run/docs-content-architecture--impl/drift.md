# Drift — docs/content-architecture implementation

Append-only. Severity: minor | significant | architectural.

## 2026-06-19 — Stage-4 wave-1 page authoring model divergence (significant)

**What diverged.** The Stage-4 wave-1 workflow generated 7 components + 4 chrome
files + 3 front-door pages (index, why, quickstart). The 11 component/chrome files
are correct. The 3 pages were authored against an **incorrect Lume mental model**
with two systematic defects:

1. **Wrong `comp` invocation syntax for body components.** Pages opened body
   components with the function-call form `{{ comp.callout({...}) }}` but closed
   with the tag-form `{{ /comp }}`. Lume's `comp` Vento tag
   (`lume@v2.5.4/plugins/vento.ts` line 158, regex line 209, body injection line
   234) only pairs `{{ /comp }}` with a **tag-form opener** `{{ comp NAME { args } }}`.
   The mismatch left `{{ /comp }}` orphaned → Vento parsed `/comp` as a regex →
   `TransformError: Unterminated regular expression`. Build aborted at index.vto:15.
   - **Verified fix syntax (empirically, isolated build):**
     - body: `{{ comp NAME { args } }}` … body … `{{ /comp }}`
     - self-close: `{{ comp NAME { args } /}}`
     - no-body function form `{{ comp.NAME({...}) }}` still works (returns a string).

2. **Raw markdown prose inside `.vto`.** why.vto and quickstart.vto are ~80% raw
   markdown (`## headings`, `1. **bold**` lists, `[links](url)`, fenced code).
   Lume does **not** markdown-process `.vto` output (verified: a `.vto` with
   `## A heading` emits the literal text `## A heading`). These pages cannot render
   correctly until Phase-0b markdown support exists. This is the planned hybrid
   model (prose = `.md` + callout shim; marketing/hubs = `.vto`) — the wave-1
   agents jumped ahead and authored Phase-1 prose pages before the Phase-0b engine
   that renders them.

**Resolution taken (Phase 0a landed tonight, supervisor, docs lane).**
- Fixed `index.vto` to the correct model in-lane: callout → tag form; the 3 section
  `## headings` → `<h2>` (index is a marketing/landing `.vto`, almost entirely
  `comp.*` calls + 3 headings, so it is correctly a `.vto` page). Build is GREEN
  (80 files); index.html renders hero/callout/tabbedCode/featureGrid/learningPath
  with zero literal-markdown leak.
- Relocated why.vto + quickstart.vto to `docs/site/_drafts/` (Lume ignores
  `_`-prefixed dirs) to preserve the authored content for Phase-0b rework without
  breaking the build. Their B2 worklogs remain at `docs/site/_plan/worklog/`.

**Follow-up required (does NOT block the Phase-0a merge gate).**
- **Phase 0b engine config (Codex slice):** add markdown rendering for prose pages.
  Either (a) configure Lume so prose pages are `.md` processed by [vento, markdown]
  so they can still call `{{ comp ... }}`, or (b) keep prose pages `.vto` and pipe
  prose blocks through an `md` filter. Plus the GitHub-callout shim (`> [!TIP]`),
  Shiki, toc, sitemap, and `api-cite.ts` per the locked plan. Touches
  `docs/site/_config.ts` only — NOT packages/plugins.
- **Wave-1b re-author:** once 0b lands, re-home `_drafts/why.vto` and
  `_drafts/quickstart.vto` as correctly-rendering prose pages (the prose CONTENT and
  the B2 accuracy worklogs are good — the quickstart worklog verified every CLI
  command/flag/port/route against source; why has its own).
- **Soft packaging note (NOT a hard blocker), from the quickstart accuracy pass:**
  `@netscript/cli` ships `bin/netscript.ts` but does not expose it in the JSR
  `exports` map (only `.`, `./scaffolding`, `./testing`). The documented install is
  `deno add jsr:@netscript/cli`. The global-install / ad-hoc-run commands resolve
  against the raw published file path but are not a formal `exports` entry. A future
  CLI packaging slice (Codex, packages/cli — separate from docs) could add a `./bin`
  export + document the global install. The quickstart page is accurate against
  today's surface.

**IMPL-EVAL (Stage 5) sequencing note.** Benchmarking doc quality vs competitors is
premature while the front door is only the landing page. Recommend dispatching
Stage-5 IMPL-EVAL only after Phase 0b + wave-1b make why/quickstart render.

---

## Wave-1b — `function` keyword landmine in Vento `comp` tags (VERIFIED 2026-06-19)

**Severity:** minor (authoring constraint, fixed in-lane).

**Symptom.** `deno task --cwd docs/site build` aborted on `why.vto` with
`Caused by: Error: Invalid function: comp.tabbedCode({ tabs: [ ...`. The landing
(`index.vto`) and `why.vto` blocks 1–2 built fine; block 3 (the observability
`tabbedCode`) failed.

**Root cause (bisected in an isolated Lume build).** The literal keyword `function`
appearing ANYWHERE inside a `comp` tag's argument text — even inside a double-quoted
`code:` string — makes Vento's function-definition tag matcher mis-fire and try to
parse the whole `comp.NAME({...})` call as a `{{ function … }}` definition. It is the
keyword specifically: `import`, `export`, `const`, `if`, `for` inside the same code
strings are all fine (blocks 1–2 use them). The self-closing tag form
`{{ comp NAME { … } /}}` does NOT bypass it (tested — still fails). The only reliable
fix is to **avoid the word `function` inside any `comp` tag argument**: write code
samples with arrow/`const` form (`export const f = async (x) => { … }`) instead of
`export async function f(x) { … }`. Page-level markdown prose is unaffected (Vento only
scans inside `{{ }}` delimiters), so the word `function` in body copy is safe.

**Fix applied.** `why.vto` block 3 tab 1 rewritten from
`export async function chargeOrder(orderId: string) { … }` to
`export const chargeOrder = async (orderId: string) => { … };` — semantically identical,
same `getTracer`/`withSpan` symbols, no accuracy change. Build → GREEN, 85 files.

**Authoring rule for future code samples (add to component usage notes / 0b brief):**
in any `comp.tabbedCode` / `comp.apiTable` / callout argument, prefer arrow-`const`
function expressions; never the `function` keyword. If a sample genuinely needs the
`function` keyword, render it on a page-level fenced ```` ```ts ```` block (markdown),
not inside a comp arg.

## Wave-1b landed

`why.vto` + `quickstart.vto` re-authored to the verified model (front matter
`templateEngine: [vento, md]`; marketing comps in function-call form; callouts in
`{{ comp callout { … } }}` tag form with INLINE-HTML bodies; all other prose markdown).
Both render: 17 headings each, zero literal-markdown leak, callout HTML bodies rendered
(`<strong>alpha</strong>`), accuracy markers intact (`localhost:18888`, JSR bin path).
Also fixed `index.vto` install command `jsr:@netscript/cli/bin` →
`jsr:@netscript/cli/bin/netscript.ts` (bin is not in the `exports` map, so the full file
path is required to resolve). Front door is now COMPLETE → Stage-5 IMPL-EVAL unblocked.

## 2026-06-19 — Scope expansion to SOTA full-site + research-led re-architecture (architectural)

**Owner directive (verbatim intent).** The Track-B wave plan (build-plan.md) was judged "too
minimalistic … miles behind an actual production/enterprise-grade documentation website." Owner
authorized expanding scope to a **state-of-the-art, exhaustive, content-rich, visually polished**
documentation site benchmarked against Medusa, TanStack, and Laravel (named references), and
explicitly directed a **real multi-agent workflow** to build it. This is a user-authorized scope
expansion (harness rule: confirm before expanding — confirmed by the owner's message).

**Actions taken (supervisor, docs lane):**
1. **Re-ran the documented E2E suite without cleanup** (`deno task e2e:cli run scaffold.runtime
   --format pretty`) to persist a real project for grounding. Result: **passed=8 failed=1**. The
   full project tree (service + contracts + all 4 plugins + aspire) persisted at
   `.llm/tmp/cli-e2e/plugin-smoke-20260619-052006/`.
2. **`database.init` gate FAILED** (only failure). Root cause is a scaffold/CLI inconsistency, NOT a
   docs problem and NOT in the docs lane to fix: `netscript db init` internally invokes `aspire
   start`, which fails `Project file does not exist`. The generated `netscript.config.ts` sets
   `aspire.appHost: 'dotnet/AppHost'` while the real AppHost is the TS `aspire/apphost.mts`; the db
   gate also runs before the runtime aspire-restore/start gates, so Postgres isn't up yet. **Flag as
   a product debt item for a Codex/packages slice (separate from docs); do not patch packages/cli
   here.** Docs already encode the correct dev flow (`aspire run` from `aspire/` BEFORE db commands).
3. **Launched competitor-research workflow** (`docs-competitor-research`, run wf_9a9cb2ba-5cb): 6
   parallel analysts crawl live docs (Medusa, TanStack, Laravel, Astro, Stripe, Temporal) → schema'd
   findings → one synthesis agent emits "NetScript Documentation Architecture v2" (deep IA,
   page-type catalog, per-capability decomposition, component/design gaps, wayfinding, build waves).
4. **Launched project-anatomy agent** (adffa056629ab0049) to deep-walk the persisted scaffold and
   write `ground-truth-project-anatomy.md` (real worker/saga/trigger/stream/service/contract code
   shapes, manifests, runtime routes, db wiring, aspire apphost).

**Supersession.** `build-plan.md` (Waves A–F, the minimalistic plan) is **superseded** by the
forthcoming `doc-architecture-v2.md` (research-led). Wave-A central edits already landed and remain
valid groundwork: `_data.ts` navSections expanded to the full ladder; `tutorials/first-workspace.md`
authored (real Aspire-first flow). These fold into v2. Old build-plan retained for history only.

**Next.** On research+anatomy completion: synthesize/persist `doc-architecture-v2.md`, present it to
the owner (morning-visible), then dispatch the build workflow (1 agent/page, grounded in v2 +
ground-truth + anatomy), per-wave build-green + commit + PR #59 comment + commits.md, NO merge,
then ONE un-narrowed full-tree IMPL-EVAL (OpenHands) + adoption-eval. Evaluator ≠ generator.

## Stage-5 IMPL-EVAL = PASS; Stage-6 polish applied (severity: minor)

Stage-5 IMPL-EVAL (OpenHands minimax-m3, run 27798713207, separate session) returned
**PASS** — five A's + one B (code-proof credibility: quickstart had bash only, no framework
snippet). Verdict + 8 prioritized items in `evaluate.md`. Cycle-1 (run 27798222833) was an
INCOMPLETE iteration-limit timeout (not a verdict) caused by over-broad scope; re-run was
narrowed (no rebuild, 5-file read set, knowledge-based competitor benchmark, single artifact).

Stage-6 polish (Claude docs workflow per LD-DOCS-LANE, no packages/plugins touched) actioned
the 2 P0 + 5 safe P1 items, persisted by supervisor:
- index.vto: promoted "Orchestrated with Aspire" featureGrid card #3 → #2 (locked-08 Q7 hero-level).
- why.vto: added 2-line value-prop under "The problem"; split combined "NestJS / Encore" honest-
  table row into two named rows; linked first `--no-aspire` to /concepts/aspire/.
- quickstart.vto: added "See the framework code" defineService proof (arrow/const, no `function`
  keyword — landmine-safe); "If something doesn't come up" warning callout (port 18888/8000,
  aspire-restore time, deno PATH); tutorial-link tip callout in Next steps.
Skipped the one P1 that *removed* the index API/GitHub/JSR triplet (removing useful nav). Build
GREEN (85 files); rendered HTML verified — no comp-tag leak, callout HTML rendered, Aspire ahead
of Durable workflows, both competitors as separate rows. Next: Stage-7 Qwen adoption eval.

## 2026-06-19 — CLI scaffold bug confirmed on native ext4 → Codex fix slice dispatched (significant)

**Bug (reproduced on native WSL, NOT a /mnt/c artifact).** Re-ran the documented full E2E
(`deno task e2e:cli run scaffold.runtime --format pretty`) on the native WSL clone
(`/home/codex/repos/netscript-wave5-apps`, branch `feat/package-quality-wave5-apps` @ c47fb46).
Result `passed=8 failed=1` — `database.init` FAILED after 10.79s. preflight/scaffold-init/4 plugin
adds/plugin-list all PASS; db.init is the first failure and aborts before the Aspire runtime gates.
The skill's historical "passed=41/0" was an older state; on current code the bug is real and
environment-independent (ext4, Deno 2.8.3, Aspire 13.4.4).

**Root cause (evidence-backed).** Generated `netscript.config.ts:17` sets
`aspire: { appHost: 'dotnet/AppHost' }` — a non-existent .NET project path — while the SAME scaffold
emits a **TypeScript** Aspire host (`aspire/apphost.ts` + `aspire/tsconfig.apphost.json`; no `.csproj`).
`netscript db init` drives Aspire to provision Postgres and cannot resolve the dotnet project →
fail. The downstream `aspire restore/start --apphost` runtime gates already drive the real TS host
when reached, so the correct target is `aspire/apphost.ts`, not `dotnet/AppHost`.

**Lane.** This is a `packages/cli` scaffold-template defect — Codex's lane, on a **new branch + new
PR** per owner directive, independent of docs PR #59. NOT patched in the docs lane.

**Codex slice (mobile-visible, daemon-attached):**
- Worktree: `/home/codex/repos/netscript-cli-dbfix` (off `origin/main` @ cc3b873)
- Branch: `fix/cli-db-init-apphost`
- Thread/session id: `019eddf5-00fe-7250-88cd-ac2e29f98e10` (turn `019eddf5-01cb-7bd1-967f-a293105a94a4`)
- Daemon proof: managed `codex app-server --remote-control --listen unix://` PID 84476 (user `codex`)
- Dispatch: `send-message-v2` detached (`nohup … & disown`), log `/home/codex/cli-dbfix-codex.log`
- Steering (do NOT re-send send-message-v2): `cd /home/codex/repos/netscript-cli-dbfix && codex exec resume --last "<follow-up>"`
- Next supervisor action: on branch push, open the new PR + comment; track per harness slice rules.

**Note.** First dispatch attempt was piped through `head -40` (no detach) and died with the pipe —
ps confirmed no lingering thread and the worktree index stayed clean, so the single detached
re-dispatch is not a rival-agent violation.

### Update — Codex slice landed, fix verified correct, but accidentally pushed to origin/main

**Outcome.** Codex pushed `1fcbc14` (`fix(cli): align db init Aspire apphost`) — 15 lines across 6
`packages/cli` files (scaffold-defaults, netscript-config template, generate-aspire-config, db
operation-runner-helpers, + 2 test files), with test updates. Verified correct: main's scaffold
genuinely emits `aspire/apphost.mts` (templates + `generators-pipeline_test.ts` confirm), so
defaulting modern `netscript.config.ts` `aspire.appHost` to `aspire/apphost.mts` (while legacy
`aspire.config.json` stays `dotnet/AppHost` via `ASPIRE_LEGACY_APPHOST_PATH`) is internally
consistent. Codex validation: focused tests 16 passed/0 failed; scoped check/lint/fmt pass;
`deno task --cwd packages/cli check` pass. E2E before `passed=8 failed=1` → after `passed=9 failed=1`.

**Remaining db.init blocker (separate, environmental — NOT this change).** db.init now resolves the
TS apphost but Aspire hangs on bundled NuGet restore (`Aspire.Hosting`, `…PostgreSQL`,
`…CodeGeneration.TypeScript`) and times out (`Timed out waiting 300s for AppHost to start`); log also
shows `NativeCertificateToolRunner: certificate is not trusted by OpenSSL` (SSL_CERT_DIR). Codex
raised `ASPIRE_CLI_START_TIMEOUT=300`. This is WSL first-run restore slowness + cert trust, a
follow-up (likely a separate env/Codex investigation), not the appHost path bug.

**PROCESS INCIDENT.** The commit also landed on `origin/main` (main now == 1fcbc14, parent cc3b873).
Cause: the worktree branch was created with `git worktree add -b fix/... origin/main`, which set the
branch's UPSTREAM to origin/main; Codex's bare `git push` targeted main. Codex did NOT force-reset
main. Lesson saved to memory `codex-worktree-upstream-tracking-landmine`. The commit also exists on
`origin/fix/cli-db-init-apphost` (nothing lost). Awaiting owner decision on main handling
(keep-and-fix-forward / non-destructive revert + re-land via PR / destructive force-reset). No
destructive action taken autonomously.

**RESOLVED (owner decision: revert main + re-land via PR).** main reverted via `3e9ec3d`
(`Revert "fix(cli)…"`, tree back to cc3b873 state); fix re-applied on the branch as `27ef464` and
opened as **PR #60** (base main ← head fix/cli-db-init-apphost). PR #60 CI green. No destructive
history rewrite. The remaining env db.init blocker is documented in PR #60 as a follow-up.

### Update — Pipeline step 1 (Gemini research) first dispatch SKIPPED → re-routed via OpenRouter

First trigger used `model=google/gemini-3.5-flash`; the OpenHands workflow infers provider from the
model prefix (`google` → GEMINI) and the "Resolve provider credentials" step requires
`LLM_API_KEY_GEMINI` (or fallback `LLM_API_KEY`). That native GEMINI key is not configured in CI, so
the step failed and the agent step was **skipped** (run 27803608207, `agent_outcome=skipped`,
`verdict=not-run`; bootstrap succeeded). Earlier program evals ran on OpenRouter, so
`LLM_API_KEY_OPENROUTER` IS present, and `google/gemini-3.5-flash` is also a valid OpenRouter slug —
so the fix preserves the exact mandated model: re-triggered with
`model=openrouter/google/gemini-3.5-flash` (provider OPENROUTER) on PR #59 (comment 4748775786).
Run **27807559482** is in_progress with provider OPENROUTER ("Running" status confirmed). Lesson:
route mandated non-OpenRouter models through OpenRouter unless the native provider key is
known-present in CI.

## 2026-06-19 — Pipeline step 2 done: `doc-architecture-v2.md` synthesized; PLAN-EVAL dispatched (significant)

**Dossier-quality verdict: STRONG / SUFFICIENT — no research re-run.** Assessed
`research/competitor-doc-research.md` (447 lines, Gemini run 27807559482) against the SOTA bar:
5-site teardown (Medusa/TanStack/Laravel/Astro + Stripe/Temporal), market-fit positioning
("Eliminate the integration tax", skeptical-senior-TS-architect persona, feature-coverage checklist),
and a Lume/Vento component-mapping section with 6 recommended new components + an IA tree + page-type
catalog. Content-rich and explicitly anti-minimalistic — it clears the bar. No gap recorded; no
second research pass needed.

**Synthesized `doc-architecture-v2.md`** from dossier + `ground-truth.md` +
`ground-truth-project-anatomy.md`. Contents: (§0) quality bar / success criteria; (§2) locked
multi-level Diátaxis IA + a Medusa-style 9-hub **Capabilities** lane + a 5-rung **Tutorials ladder**
that builds ONE continuous app along the REAL cross-plugin wiring proven in the anatomy
(workers `create-user-settings` publishes `UserSettingsCreated` → a saga handles it; a trigger
`enqueueJob`s a worker job) — the genuine fil d'Ariane; reference lane (22 units) KEPT untouched;
(§3) page-type catalog T1–T8 mapped strictly to the 9 SHIPPED Vento components; (§4) per-page
grounded briefs with **accuracy markers** tied verbatim to ground-truth commands/ports/endpoints/code
shapes/paths (incl. honest stub callouts: streams producer/consumer + worker trace/progress are
no-ops); (§6) prioritized component gap list as RECOMMENDATIONS only (base.vto/styles/_components are
centrally owned — not edited this run); (§7) authoring-agent contract; (§8) wave sequencing A–F;
(§9) un-narrowed whole-tree eval plan.

**Uncommitted authoring groundwork left in place (NOT committed pre-gate).** `docs/site/_data.ts`
(Wave-A navSections expansion) and `docs/site/tutorials/first-workspace.md` (authored rung) remain
uncommitted on disk. They are the valid Wave-A groundwork recorded above and fold into v2, but page
authoring is HARD-GATED behind PLAN-EVAL PASS + owner GO, so the plan commit stages ONLY the run-dir
planning artifacts and leaves these for the gated authoring waves.

**PLAN-EVAL dispatched (HARD GATE).** OpenHands `openrouter/minimax/minimax-m3`, `output=pr-comment`,
separate session, adversarial against `gates/plan-gate.md`, on PR #59. No authoring workflow launches
until it returns PASS and the owner gives explicit GO.

**PLAN-EVAL PASS + owner GO → corrections folded (commit 045e2892).** Four corrections applied to
doc-architecture-v2.md before authoring: (1) §5 callout now mandates the tag-form opener
`{{ comp callout { type, title } }}` and flags `{{ comp.callout({...}) }}` as BUILD-BREAKING —
verified against shipped index/why/quickstart .vto which all use tag form; the other comps
(hero/featureGrid/apiTable/tabbedCode/card) correctly stay function-call form (verified in
quickstart.vto). (2) §0 prev/next reworded to §7's operational scope (ladder + zone-sequence pages,
not every leaf). (3) §9 jsr-audit declared N/A (docs surface). (4) §9 notes static/fitness gate
boxes are subsumed by the single `deno task --cwd docs/site build` gate. NOTE: the uncommitted
`first-workspace.md` groundwork uses the BUILD-BREAKING `{{ comp.callout({...}) }}` form and will be
fixed to tag-form during Wave B authoring/reconciliation. Authoring workflow launches next.
