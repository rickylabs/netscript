# Prior waves 1–3 — early agent-experiment briefs, extracted

**Source corpus (read in full, 1589 lines / 10 files):**

- `agent-posts/archive/` — `PLAN.md` (582 l), `FIX-PIPELINE.md` (178 l), `AGENT-PROMPT.md` (132 l),
  `SUPERVISOR-BRIEF.md` (100 l), `Smoke test.md` (95 l), `CONTROL-BUILD-BRIEF.md` (34 l),
  `TRANSLATION-BRIEF.md` (33 l)
- `agent-posts/wave-3/` — `WAVE-3-PROMPT.md` (253 l), `ROUND-THREE-PLAN.md` (120 l),
  `NIGHT-PLAN.md` (62 l)

Vault root: `/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts/`.
Dates in the corpus: 2026-07-31 → 2026-08-02. Today: 2026-08-08, repo `deno.json` version `0.0.4`,
latest release `v0.0.5-canary.16` (`gh release list --repo rickylabs/netscript`).

Terminology note: these docs say "round one/two/three"; the run's wave numbering maps
round 1 → wave 1, round 2 → wave 2, round 3 → wave 3. `wave-4/`, `wave-5/`, `wave-6/` and
`codex-sol-last-runs-remediation-plan/` exist as sibling dirs but are **out of scope for this task**
and were not read.

---

## 1. What each wave tried to prove

### Wave 1 (round one) — improvised, retrospectively characterised only

There is no wave-1 brief in this corpus; wave 1 is described from the outside by
`archive/PLAN.md §1` and `archive/Smoke test.md`.

- **Thesis it accidentally tested:** can four frontier models, given a beta with no quickstart, no
  docs link, a version mismatch and mid-flight steering, produce publishable first-person essays
  about a framework absent from their training data? (`PLAN.md` §1 "Round one was improvised").
- **Actual output** (`PLAN.md` header): 4 essays, 4 playgrounds, 14 issues filed, 3 fix PRs open.
- **Builds** (`Smoke test.md` §Paths): `fable-radar` (Claude Fable 5, 9.2 M / 615 files, 10
  screenshots), Incident & SLA platform (Gemini 3.6 Flash, 7.6 M / 235), Signal Garden (GPT-5.6 Sol,
  6.0 M / 227), GrokPulse (Grok 4.5, 9.0 M / 348). All on `0.0.1-beta.11`, one scaffolded against
  beta.10, under `aspire start --isolated` with real Postgres + Redis.
- **Proven:** first-person model voice + build-before-write produces readable prose; `drift.md`
  produces real issues; **independence produces convergence** — four agents that could not see each
  other hit the same defects (`PLAN.md` §1 "Independence").
- **Not proven:** that an agent can produce a *clonable product*. `Smoke test.md` §"Why they are not
  published yet" states all four would fail the clone test; `PLAN.md` §7.2 repeats it.

### Wave 2 (round two) — "stop prescribing, and measure against a control"

`archive/PLAN.md §2` mission: *five* language models each build a real, clonable, runnable product
**chosen entirely by them**, then write about it.

Hypotheses under test, each traceable to a wave-1 failure:

| Hypothesis | Section | Wave-1 failure it answers |
| --- | --- | --- |
| Removing the feature list removes silhouette convergence | §3, §12 | all four wave-1 apps shared one shape (§1) |
| A mandatory self-directed research swarm ("phase 0") closes the training-data gap | §4 | agents never knew `withResource`/`useLiveQuery`/`ui:add`/`cloud-run`/`sdk/collections`/`query-client`/cache engine/Scalar existed (§1) |
| Complete context at minute zero removes lost hours | §5 | beta.10/11 skew, docs found on the third pass, harness/skills never mentioned |
| A pre-extracted offline docs bundle beats live fetching | §5 "docs bundle" | 2.0 MB / ~273k words / ~365k tokens / 162 pages — too big to inject, right size to grep |
| A **blind control build** on a competing framework quantifies the zero-training-data penalty | §8 | nothing in wave 1 measured cost |
| An **aggregate** judge (Qwen 3.7 Max, `openrouter/qwen/qwen3.7-max`) attributes gaps correctly | §8 "Judging the output" | a per-pair judge structurally mis-attributes an agent's own gap to the framework |
| Mechanical acceptance (clone into a clean dir, follow only the README) beats agent assertion | §7 | all four wave-1 playgrounds fail it |

Wave 2 also ran a **second, separate experiment** — `archive/FIX-PIPELINE.md`: can a Claude workflow
(deterministic control flow) supervise Codex 5.6-low implementation slices under the internal
harness, to close the 24 `type:fix` issues wave 1 produced? That one **succeeded** (see §3).

### Wave 3 (round three) — "one agent, one session, end to end"

`wave-3/ROUND-THREE-PLAN.md` opens with the wave-2 post-mortem and inverts the orchestration:
pilot = GPT-5.6 Sol alone, `codex exec` + `codex exec resume --last`, no workflow tool, no
supervisors, no per-step spawning, no control build, no judge, no claim-collision barrier.

Three variables restored/changed (`ROUND-THREE-PLAN.md` §"The three changes that matter"):

1. **Session continuity** — one `codex` session from first `deno doc` to final post. "If that
   session dies, the run is over and we say so."
2. **Scope that finishes** — small-and-done over ambitious-and-half-built.
3. **Steering is allowed and expected** — wave 2 banned it, which was right for *product choice* and
   wrong for everything else.

`wave-3/WAVE-3-PROMPT.md` adds a fourth, product-level goal (owner corrections 2026-08-02): the
article's subject is **the agent's first hands-on experience**, the product is evidence; it ships as
a draft PR on `rickylabs/devocracy-website` with a working Vercel preview; and the run must
**exercise the 0.0.3 `netscript agent init` surface**, "which has never had a real first user".

`wave-3/NIGHT-PLAN.md` records the launch gate (0.0.3 landed, `round3-sol` refreshed,
`netscript --version` = 0.0.3) and a **second pilot** on `deepseek/deepseek-v4-flash-0731` via the
OpenCode lane, same prompt, separate workspace.

**Conflict to note:** `NIGHT-PLAN.md` §"Wave-3 launch parameters" says *"Model: GPT-5.6 Sol · **low**
(owner correction 2026-08-02; the plan originally said `high`)"*, while `WAVE-3-PROMPT.md` header
says *"Model: GPT-5.6 Sol · **high**"* with owner correction "The first demo runs at **high**
effort", and `ROUND-THREE-PLAN.md` says high. Three of four say high; `NIGHT-PLAN.md` is the outlier
and appears to record a correction that was itself later reversed. Fact, not hypothesis: the corpus
is internally inconsistent on wave-3 effort.

---

## 2. Framework gaps and defects found — status today

All wave-1 drift became issues #951–#972 (`Smoke test.md` §Known state; `PLAN.md` header). State
verified `gh issue view` 2026-08-08.

| # | Defect (as recorded in the briefs) | Cited in | State today |
| --- | --- | --- | --- |
| 951 | Worker job dispatch returns `NOT_FOUND` — compiled job in the generated registry the runtime never registered; hit by GPT's and Fable's builds, "triple-confirmed" | `Smoke test.md` | **CLOSED/COMPLETED** 2026-07-31, milestone 0.0.2 |
| 952 / 978 | Generated **fixed host ports** defeat `aspire start --isolated`; two workspaces collide around `:3000` | `Smoke test.md`, `FIX-PIPELINE.md` §5 (the "medium effort" case: it changes what a configured port *means*) | **CLOSED/COMPLETED**; PR #978 merged (host-port pinning became opt-in) |
| 953 / 957 | Fresh UI 500s — `jsr://…/sdk/desktop` fails to resolve under Vite; GPT's UI never rendered | `Smoke test.md` | **CLOSED**; PR #957 merged (`ui:add` emits a resolvable import + pins the current SDK) |
| 954 / 963 | Aspire reports `Healthy` while the app returns 500 — the probe checked the port, not the app | `Smoke test.md` | **CLOSED**; PR #963 merged (health only once the app can server-render) |
| 955 | `config set` writes a doubled key the generator never reads, and reports success | `FIX-PIPELINE.md` §3 | **CLOSED/COMPLETED** |
| 956 | Version skew: fresh-ui pins sdk@beta.10, scaffold pins beta.10, MCP advertises beta.9 | implied by `PLAN.md` §1 "version mismatch nobody had noticed" | **CLOSED/COMPLETED** |
| 958 | First `aspire start` may time out at 120 s on a cold AppHost | `Smoke test.md` | **CLOSED/COMPLETED** |
| 959 / 961 / 962 | Plugin cluster: install/remove leaves contradictory state, `plugin sync` validates against the wrong resolution graph; cache provider side-effect import missing; generated plugin runtimes do not opt into the selected KV backend | `FIX-PIPELINE.md` status block ("one root-cause fix and two issue corrections") | all three **CLOSED/COMPLETED** |
| 965 | `defineSaga` documented as an object argument, implemented as a fluent builder | `PLAN.md` §5 "Docs are a precondition" | **CLOSED/COMPLETED** (docs) |
| 966 | Generated `.gitignore` excludes `appsettings.json`, which a clean clone needs | `FIX-PIPELINE.md` §2 (cited as the clear "skip the plan" case) | **CLOSED/COMPLETED** |
| 967 | `init` nests a project directory when cwd is already the target — this is why Fable's build sat one level deep | `Smoke test.md` footnote ² | **CLOSED/COMPLETED** |
| 971 / 972 | Task pages surface the general-purpose route ahead of the first-class helper; no compact map of what each command mutates/regenerates | `PLAN.md` §5 | both **CLOSED/COMPLETED** |
| 990 | `@netscript/fresh-ui`'s own `deno task test` cannot pass — it lacks the permissions its tests need | `ROUND-THREE-PLAN.md` known-broken list | **CLOSED/COMPLETED** 2026-08-01, milestone 0.0.3 |

### Still open — the stale residue from the wave-3 known-broken list

`ROUND-THREE-PLAN.md` §"Carried-over environment facts" names the known-broken list as
`.briefing/KNOWN-BROKEN.md` (#863, #175, #990, #864). Only #990 closed.

| # | Title | State (2026-08-08) | Staleness signal |
| --- | --- | --- | --- |
| 863 | `netscript db init` can block indefinitely on an Unhealthy-but-Running Postgres resource (clean-machine quickstart flake) | **OPEN**, milestone **0.0.2** | milestone is three releases stale (0.0.2 shipped; train is at 0.0.5-canary.16) |
| 864 | `deploy list --json` advertises an `emit` operation that no target command tree ships | **OPEN**, milestone **0.0.2** | same |
| 175 | Service logs spurious "MySQL is NOT reachable" ERR under `--db sqlite` | **OPEN** (`stateReason: REOPENED`), milestone **0.0.2**, **zero labels**, last touched **2026-07-19** | violates AGENTS.md taxonomy (no `type:`/`area:`/`status:`); 20 days untouched; predates the whole agent-post programme |

Two more 0.0.2-milestoned issues are still open and are not in the corpus but belong to the same
stale band: **#768** (OpenHands agent runtime fails to bootstrap — `ModuleNotFoundError: fastapi`)
and **#767** (`docs:readme:check` is a dead gate — checker/template/house-style three-way
divergence). Total open issues on the repo: **259**.

**Assessment:** every *product-surface* defect wave 1 found is fixed. The residue is (a) a
quickstart-flake class (#863) that is exactly the class of defect that blocks the clone test wave 2
made mandatory, and (b) **milestone rot** — four open issues still carrying a shipped milestone.

### Gaps that were never issues — capability *discoverability*

`PLAN.md` §1 and §8 name the same list twice: across four agents and three writing passes, **none**
used `withResource`, `useLiveQuery`, `ui:add`, `cloud-run`, `sdk/collections`, `query-client`, the
cache engine, or Scalar — "*Not from choice — they never knew those existed*". §8's judge rubric
formalises this into a three-way verdict that is directly reusable as a remediation-plan
classifier:

| verdict | when | meaning |
| --- | --- | --- |
| **Framework gap** | the capability genuinely does not exist in docs or the exported surface | real limitation |
| **Documentation gap** | it exists but no agent found it | not a framework failure; discoverability defect |
| **Run gap** | it exists and some agents used it, others did not | belongs to that run |

`PLAN.md` §8: *"Never report a framework loss on a capability that exists."*

**Status today — the fix shipped as product, not as docs.** The offline-bundle idea (§5:
`llms.txt` / `llms-full.txt` / `pages/**` / `deno-doc/<pkg>.txt` / `MANIFEST.md`, mirror-not-curate)
is now generated by the CLI itself: `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`, consumed by
`packages/cli/src/public/features/agent/init/init-agent.ts`. So wave 2's highest-leverage
infrastructure survived into the framework.

### Two `deno doc` traps recorded and worth preserving

`PLAN.md` §5 (blockquote "Met, 31 July 2026"), both hit while building the bundle:

1. `deno doc` against a package's **root export only** misses subpaths — zero hits for `useLiveQuery`
   and `withResource` until every `exports` entry was documented; bundle grew 1.2 MB → 3.4 MB.
   This is the same failure mode it exists to prevent.
2. `deno doc` emits ANSI escapes even when redirected; every grep is corrupted unless `NO_COLOR=1`.

### Environment traps (mostly obsolete, one still live)

- **Dependency-age wall** (`PLAN.md` §5, `AGENT-PROMPT.md`): Deno 2.9 refuses to resolve a dependency
  published <~24 h ago, so every `jsr:@netscript/*` resolution fails on a fresh cut;
  `--minimum-dependency-age=0` is needed on `run`/`task`/`check`/`test`/`install`/`add`. Sub-trap
  that cost two CI runs on the beta.10 cut (#813, #817): **`deno x` re-invokes `deno run` in a child
  process that does not inherit the flag** — bypass `deno x`, invoke the resolved entrypoint.
  *Status:* `ROUND-THREE-PLAN.md` reports the scaffold now handles it (`minimumDependencyAge`
  excludes `jsr:@netscript/*`); hand-written Deno commands still need the flag.
- **Root config poisoning** (`NIGHT-PLAN.md` §"Standing constraint", `WAVE-3-PROMPT.md`
  §"Build quality"): in wave 2 the products sat inside the Astro website repo; Prisma's generator and
  Vite's SSR both walked **up** the tree, found that repo's config and failed on it — cost four
  agents time and produced bug reports "that were really about our layout". Never create
  `tsconfig.json`/`package.json`/`deno.json` at or above the product root. *This is a false-defect
  generator, not a framework defect — relevant when triaging carried-in reports.*
- **PATH shadowing** (`ROUND-THREE-PLAN.md`): a Windows shim pinned to `alpha.10` shadowed
  `/home/codex/.deno/bin/netscript`; fixed in `~/.profile`.
- **Skill-name drift** (`ROUND-THREE-PLAN.md`): `netscript agent init` installs skills named
  `netscript`, `netscript-build`, `netscript-operate` — **not** the seven names wave 2's brief
  claimed (`netscript-cli`, `netscript-tools`, `netscript-deno-toolchain`, `netscript-doctrine`,
  `aspire`, `deno-fresh`, `fresh-ui-horizontal`, per `AGENT-PROMPT.md` §"What you have"). The brief
  advertised the *internal* repo skill set to an agent working in a *consumer* project.
  *Status today: the consumer set is real* — `packages/cli/src/public/features/agent/init/init-agent.ts:29`
  emits "Installed skills: `netscript`, `netscript-build`, `netscript-operate`, `aspire`, and `deno`"
  plus `.claude/skills/help.md`. The internal set at `.agents/skills/` is a different, 20-entry list.
  **The confusion is structural and still latent: two skill namespaces with overlapping names.**

---

## 3. Harness / supervision lessons

### From the wave-2 fix pipeline (`archive/FIX-PIPELINE.md`) — the run that worked

Outcome recorded in its own status block: **20 issues closed across 9 grouped PRs (#981–#989) plus
#978, all merged.** Design verdict, stated without varnish: grouping by shared cause paid off for the
plugin cluster (#959/#962/#961 → one root-cause fix + two issue corrections, where "three parallel
agents would have written three symptom patches") and **did not** pay off for scaffold hygiene, which
was four unrelated defects — "the evaluator said so rather than dressing it up".

Five failure modes recorded, each still actionable:

1. **A Codex slice can die silently** — one turn ended 22 s in, mid-reasoning, no error, no exit.
   Detected only by comparing session-file sizes (137 KB vs 1–2 MB for siblings). Recovery is
   `deno task agentic:codex-resume`, **never** a second `launch-codex-slice` on the same worktree,
   "which forks rival agents over one git index". *Still true today:* the task exists
   (`deno.json:87` → `.llm/tools/agentic/codex/codex-resume.ts`, whose header reads "steer an
   existing Codex thread (never fork a rival)").
2. **A finished slice can be unable to commit** — `check:assets-barrel` runs
   `gen:assets-barrel && git diff --exit-code`, so an *intended* generated diff fails the gate until
   committed, stranding a complete implementation in a worktree. *Still live:* `deno.json:108` still
   defines exactly that gate, now over 7 generated files.
3. **`close-gate` checks the *issue's* acceptance boxes, not the PR's.** Two PRs looked done and were
   not. "Verify against the diff, then tick — never tick to make the gate quiet."
4. **Fixes legitimately invalidate pre-existing tests** — widening a schema or making an emission
   conditional makes old assertions stale *by design*. Update the assertion but keep the property it
   was really guarding as its own test.
5. **Supervisors hit the weekly model limit mid-run**, leaving finished Codex work unpushed. Budget
   or stagger the fan-out.

Design rules from the same doc worth carrying:

- Gates that are green but **did not cover the changed files** are the false-green mechanism: root
  `lint`/`fmt:check` exclude `packages/cli` by their own regex (§2, §3). Re-run scoped. This is now
  doctrine in `AGENTS.md` §Validation.
- **Plan and plan-eval are conditional, decided from the issue's shape** — does it change a contract,
  a public surface, or what an existing configuration *means*? #952 (port semantics) yes; #966
  (a `.gitignore` line) no.
- **impl-eval must not re-run CI.** It exists for coverage-of-changed-files, root-cause-vs-symptom,
  issue-was-wrong, and regression-guard-fails-when-reintroduced.
- **`address-review` has a hard 5-minute ceiling**; nothing waits indefinitely.
- **The workflow never merges** (§2 step 8).
- **The issue is a lead, not a diagnosis:** "in the beta.12 cycle *every* fix agent found its issue
  understated or misframed, and two found the stated cause was not the real one" (`PLAN.md` §8b C2);
  `FIX-PIPELINE.md` §3 sharpens it — "one found the described component did not exist at all".
  Consequence rule: when Codex reports a wrong issue, **the supervisor updates the issue**, not just
  the PR body.

### From wave 2's demo orchestration (`PLAN.md` §8b, `SUPERVISOR-BRIEF.md`) — the shape that failed

The design: one Claude Opus 5 · high supervisor per agent, 10 discrete steps per agent, five agents.
Steps 1→2→3 (swarm → read reports → decide) deliberately kept separate so "did it actually read the
reports?" is a verifiable checkpoint. Step 6 (blind control) and step 7 (comparison chapter) must be
different actors. Exactly one synchronisation barrier — claim collision — and `pipeline()` per agent
thereafter.

`SUPERVISOR-BRIEF.md` §"Done means" is the most reusable artefact in the corpus: a per-step
verification table where every row is an artefact the supervisor looked at, plus a
**send-back-once** rule ("a second failure is reported to the orchestrator as a failed step, not a
third attempt") and the closing line *"A failed step reported as failed is worth more than a
recovered one reported as clean."*

**Why it failed anyway** (`ROUND-THREE-PLAN.md` §"Why round two failed"): the workflow spawned a
fresh Opus supervisor per step around a model agent that was itself relaunched whenever a
supervisor's budget ran out. First supervisor's verdict, two minutes in: ***"I ran out of run before
it ran out of work."*** Builds fragmented across a dozen sessions; essays were written by agents
"reconstructing a build they had not lived through". Every mitigation (completion gating, session
continuity, experience logs) was "a patch on that shape rather than a repair of it".

**The generalised lesson:** *supervision granularity must not exceed the budget granularity.* Step
boundaries are valuable as checkpoints and lethal as session boundaries. Wave 1's better prose came
from **one agent per model alive the whole way, steered between passes** — that is the variable
wave 3 restored.

### Secondary supervision lessons

- **Verify the artefact, never the exit code.** `PLAN.md` §9: wave 1 produced two false "pushed"
  reports and one silently lost file. `WAVE-3-PROMPT.md` §"Build quality" gives the mechanism:
  a piped command reports the last stage's status — `deno task check | tail` **exits 0 while type
  checking fails**.
- **Crash resilience is a first-class requirement.** Working files outside `/tmp`, commit early,
  transcripts recoverable (`~/.claude/projects/`, `~/.codex/sessions/`, opencode's SQLite) —
  "round one lost hours of build reasoning before we learned this" (`PLAN.md` §9).
- **Steering polarity.** Wave 2: no mid-flight steering, "if the brief is wrong, stop the round and
  rewrite it rather than patching by message" (§9) — because wave-1 corrections "pulled all four
  toward the same target". Wave 3 reversed it (`ROUND-THREE-PLAN.md`): ban steering on **product
  choice**, allow and expect it everywhere else, and `WAVE-3-PROMPT.md` operationalises it as a
  15-minute rule: *"If you are stuck for more than about fifteen minutes on the same thing, stop and
  say so… it is much cheaper than a three-hour hang."*
- **Model-specific operational constraints** (`ROUND-THREE-PLAN.md` §"Then, and only then"):
  Gemini cannot survive long tool loops and must run in segments — "the worst fit for a
  single-session design"; opencode's sub-agent tool **hung 10 of 12 times for kimi-k3**, so those
  models read directly rather than swarming; Claude Fable 5 is "by far the most expensive and a
  self-swarm once exhausted a monthly limit".
- **Budget is a hard binding constraint, and per-key ≠ per-account.** `NIGHT-PLAN.md`: OpenRouter key
  had $59.40 remaining against $140/day burn; "the binding constraint today was the per-key monthly
  cap, not account credit"; wave 2 "stalled on exactly that"; three agents were stopped by a credit
  wall in one day.
- **Lane fragility** (`NIGHT-PLAN.md`, verified 2026-08-02): the OpenRouter lane worked through
  OpenCode only because `opencode-run.ts` falls back to
  `~/.config/netscript-agentic/openrouter.env`; the `claude-openrouter` profile reads `Deno.env`
  only "and therefore still fails without an export".
- **Parallel agents in one worktree is a named collision** — "the collision that has already bitten
  this project twice tonight" (`NIGHT-PLAN.md`), same root cause as the `launch-codex-slice`
  fork-a-rival rule.
- **Evaluator independence can be structural rather than promised.** `FIX-PIPELINE.md` §4: a Claude
  supervisor evaluating a Codex slice satisfies harness independence *by construction* — different
  process, different model family. `PLAN.md` §8 applies the same reasoning to close the judge
  question: Qwen 3.7 Max built nothing, so it has no pair to favour.

---

## 4. Recurring adoption failures by agents

Ranked by how many independent sources in this corpus record them.

**A. Reaching for the general-purpose construction when a specific helper exists.**
The single most-repeated finding. `PLAN.md` §5 quotes Fable's wave-1 lesson verbatim as "round one's
single most transferable lesson": *"Every time I reached for the obvious general-purpose
construction, the specific helper I should have used was sitting three exports below the one I knew
about."* Restated in `AGENT-PROMPT.md` §"How to work" ("Every previous run reported the same thing")
and again in `WAVE-3-PROMPT.md` §"The single most important fact" ("Every prior run found the
specific helper it wanted sitting a few exports below the general-purpose one it already knew
about"). Its docs analogue is issue **#971** — task pages surfacing the general-purpose route ahead
of the first-class helper. **Mitigation that shipped: per-subpath `deno doc` in the agent bundle.**

**B. Building from priors instead of from the framework.**
`PLAN.md` §1 root cause: *"The brief named a feature set, and that set became the definition of 'a
NetScript app'."* Not one of four proposed a domain outside the one the first brief implied, "even
when explicitly told to start from a blank page". §3's rule — "If we find ourselves writing 'the app
should probably…', that sentence is the bug" — and §4's insistence that exploration and decision be
**separate steps** ("an agent that sweeps and decides in a single breath decides from its priors,
and phase 0 becomes decoration"). Wave 2 confirmed the fix worked: five genuinely different products
vs wave 1's four variations of one (`ROUND-THREE-PLAN.md` §"What stays").

**C. Ignoring installed diagnostics and hand-rolling worse alternatives.**
The hardest number in the corpus (`WAVE-3-PROMPT.md` §"Use the tooling", stated twice, marked
"measured, not rhetorical"): across **five agent runs, `aspire otel` was invoked zero times. So was
`netscript plugin doctor`.** Those agents "lost hours hand-rolling worse alternatives around tooling
that was already installed" — `curl` probes and print statements instead of traces. The prescribed
inversion: *symptom → look it up in `help.md` → run the diagnostic it names → then form a theory.
Not the reverse.*
**Status today: this is now enforced in product, not exhortation.**
`packages/cli/src/public/features/agent/init/init-agent.ts:29` writes into the consumer
`AGENTS.md`/`CLAUDE.md` block: *"Drift is gated, not suggested: `netscript agent drift record` and
MCP `record_drift` refuse unless the same resource has a successful `netscript plugin doctor
--resource <name>` or MCP diagnostic receipt from the last 15 minutes."* Receipts land in
`.netscript/agent/diagnostics/`, accepted drift in `.netscript/agent/drift.jsonl`. That is a direct,
traceable wave-3-finding → shipped-mechanism line.

**D. Over-scoping past the point of completion.**
`WAVE-3-PROMPT.md` §Scope: "every agent chose an ambitious system — a five-service auction house, an
incident-remediation fleet — and **not one reached a running product a stranger could clone**. The
posts then described things that did not work, and none of it shipped."
`ROUND-THREE-PLAN.md` makes it a gate the orchestrator must actually enforce: after pass 1, one
question — *can this be finished, run and screenshotted by one agent in one sitting?* — "Round two
never asked this and every product ran out of time." Domain stays the agent's; only **size** is
pushed on. Note the wave-1/2 pattern is monotone: wave 1's four builds also failed the clone test
(`Smoke test.md`), so this is 9-for-9 across two waves.

**E. Backend-heavy builds with an afterthought interface.**
`PLAN.md` §1: "Backend-heavy across the board. Where a UI existed it was unstyled default
scaffolding, and one never rendered at all." `Smoke test.md` confirms GrokPulse was "**the only one**
with a working UI". Countermeasure repeated in all three briefs (`PLAN.md` §6.3,
`AGENT-PROMPT.md` §3, `WAVE-3-PROMPT.md` §"Build quality"): re-skinning is a **token exercise** —
`netscript ui:add` copies components in as owned source, every style consumes CSS custom properties,
so `assets/tokens.css` / `tokens.json` plus per-component overrides changes everything together.
Acceptance is a screenshot beside the default theme. Reference datum held by the orchestrator only:
a production NetScript app was fully revamped with 237 lines of `tokens.css`, 399 of `tokens.json`,
a handful of overrides, plus a brand-token sync tool.

**F. Asserting instead of verifying.**
Wave 1 produced two false "pushed" reports and one silently lost file (`PLAN.md` §9). Wave 2's answer
is mechanical: the **orchestrator** clones into a clean directory on a different path and follows
only the README (`PLAN.md` §7.2, `SUPERVISOR-BRIEF.md` §Checkpoints — "The agent does not get to
assert this"). Note the corollary defect class this catches is the same one #863 still represents.

**G. Mistaking unfamiliarity for defect — the negativity inversion.**
`WAVE-3-PROMPT.md` §"On the experience log": *"Every previous run of this experiment produced a
relentlessly negative log, and the reason is structural rather than true: you have no training data
here, so everything is unfamiliar, and unfamiliarity is easy to mistake for defect."* The prescribed
split is a triage rule directly reusable for grading carried-in drift:

| symptom | destination |
| --- | --- |
| cost me time because **I did not know how it worked** | `experience.md` — then ask whether the design was actually good once understood |
| cost me time because **it is broken** | `drift.md`, with exact command and exact output |

"When something took three attempts and then turned out to be right, that is a finding — say so."
This is the agent-side twin of §8's framework-gap / documentation-gap / run-gap classifier.

**H. Polite drift.** Repeated in `PLAN.md` §8b, `AGENT-PROMPT.md`, `SUPERVISOR-BRIEF.md` row 8 and
`WAVE-3-PROMPT.md`: drift must be recorded **when hit**, not reconstructed at the end; ranked by time
lost; exact commands and outputs; "a polite drift report is a useless one". Vague entries are sent
back once. Justification is empirical: wave-1 drift became 14 issues, "three of which turned out to
be *worse* than reported once an engineer read the code" (`PLAN.md` §1, §8b).

**I. Agents did not know what they did not know.** `PLAN.md` §4: "None of the four round-one essays
mentioned this, which is itself worth noting: they did not know what they did not know." The
structural fact behind every item above — `PLAN.md` §4 and both agent prompts open on it: *NetScript
is in zero lines of training data, while Rails/Nest/Next/Temporal carry years of absorbed text.*
`PLAN.md` §8 turns the asymmetry into the experiment's headline question: *how close does a framework
with no training-data presence get, when the model is given good documentation instead?* — and rules
that a benchmark hiding its own asymmetry "is marketing".

---

## 5. Facts vs hypotheses — explicit ledger

**Facts (recorded outcomes, verifiable):**

- Wave 1: 4 essays, 4 playgrounds, 14 issues, 3 fix PRs (`PLAN.md` header).
- Wave-1 issues: 20 closed across 10 merged PRs by 31 July (`PLAN.md` header); the fix pipeline
  itself reports 20 closed across 9 grouped PRs #981–#989 plus #978 (`FIX-PIPELINE.md`). *These two
  counts overlap but are stated differently; treat "20 closed" as the shared, load-bearing number.*
- Docs bundle measured: 162 pages, 2.0 MB, ~273k words, ~365k tokens, 36 `deno doc` files
  (`PLAN.md` §5, `ROUND-THREE-PLAN.md`).
- `aspire otel` and `netscript plugin doctor`: **0 invocations across 5 runs** (`WAVE-3-PROMPT.md`).
- opencode sub-agent tool hung **10 of 12** times for kimi-k3 (`ROUND-THREE-PLAN.md`).
- 0 of 9 builds across waves 1–2 passed the clone test (`Smoke test.md`, `WAVE-3-PROMPT.md`).
- The four wave-1 playgrounds were never published: `rickylabs/netscript-fable-radar`,
  `-signal-garden`, `-grokpulse`, `-incident-ops` all 404 today (`gh repo view`), against the
  proposal in `Smoke test.md` §"Why they are not published yet". They exist only on the WSL box at
  `/home/codex/repos/playground-{fable,gemini,gpt,grok}`; all "secrets-scanned clean, 6–9 MB
  without `node_modules`".

**Hypotheses / unresolved in the corpus:**

- `PLAN.md` §11 leaves open: do wave-1 posts stand alongside wave 2 or get superseded (Q3); does the
  parent post change shape (Q4); how much compute phase 0 gets — cap or agent's choice (Q5);
  blind-judge-vs-builder-opinion (Q6, partially closed by the Qwen decision in §8); and **cost has no
  ceiling** (Q7 — "Accepted as 'for science' — but worth a ceiling before it starts rather than
  after"). Wave 2 then died of budget, so Q7 is the open question that actually bit.
- Whether wave 3's single-session shape generalises beyond GPT-5.6 Sol was explicitly *not* decided:
  "Run it, judge it, and only then decide how to repeat it… No parallel fleet until the shape is
  proven on one" (`ROUND-THREE-PLAN.md`). This corpus contains no wave-3 result; `wave-4/`–`wave-6/`
  (not read here) would carry it.
- `PLAN.md` §8's blindness caveat is stated as a known limit, not a solved problem: framework
  identity cannot be stripped from a repo (imports, config, lockfiles), so "the judge is blind to
  *our stake*, not to the technology. Claiming more than that would be dishonesty."

---

## 6. Carry-forward candidates for the remediation plan

Ordered by leverage, each with its source.

1. **Adopt the three-way gap classifier** (framework / documentation / run) as the grading rule for
   every carried-in defect claim — `PLAN.md` §8. Its agent-side twin is the
   *didn't-know* vs *broken* split (`WAVE-3-PROMPT.md`). Nothing in the current AGENTS.md doctrine
   encodes either.
2. **Treat every carried-in drift item as a lead, not a diagnosis.** Empirical base rate: in the
   beta.12 cycle *every* fix agent found its issue understated or misframed; two found the stated
   cause was wrong; one found the described component did not exist (`PLAN.md` §8b C2,
   `FIX-PIPELINE.md` §3).
3. **Fix the milestone rot before planning waves.** #863, #864, #175, #767, #768 are open on the
   shipped 0.0.2 milestone; #175 additionally carries **zero labels**, violating the AGENTS.md
   taxonomy obligation, and has been untouched since 2026-07-19.
4. **Resolve the two-skill-namespace hazard.** Consumer `netscript agent init` installs
   `netscript` / `netscript-build` / `netscript-operate` / `aspire` / `deno` + `help.md`
   (`init-agent.ts:29`); the internal repo set at `.agents/skills/` has 20 differently-named entries.
   Wave 2's brief advertised the internal names to consumer-context agents
   (`AGENT-PROMPT.md` §"What you have"); `ROUND-THREE-PLAN.md` caught it and said "Fix the brief
   text". The underlying collision is unfixed.
5. **Keep the supervision-granularity rule explicit:** never let a step boundary become a session
   boundary; recover with `agentic:codex-resume`, never a second `launch-codex-slice` on the same
   worktree (`FIX-PIPELINE.md` status block; `.llm/tools/agentic/codex/codex-resume.ts`).
6. **The `check:assets-barrel` strand-a-slice trap is still live** (`deno.json:108`) and now covers 7
   generated files, i.e. strictly more surface than when it stranded a slice in wave 2.
7. **Budget ceilings are a planning input, not an afterthought** — wave 2 was killed by per-key
   OpenRouter caps and weekly model limits, and `PLAN.md` §11 Q7 flagged the missing ceiling before
   it happened (`NIGHT-PLAN.md`, `FIX-PIPELINE.md` status block).
