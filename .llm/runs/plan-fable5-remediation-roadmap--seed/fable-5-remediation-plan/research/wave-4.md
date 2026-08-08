# Wave 4 research digest — agent-posts/wave-4

Source corpus (all read in full): `/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts/wave-4/`

| File | Lines | Role |
| --- | --- | --- |
| `README.md` | 45 | wave framing, lineup, caps |
| `RUN-PLAN.md` | 128 | transports, workspaces, per-run measurement obligations |
| `WAVE-4-PROMPT.md` | 333 | the verbatim build brief (v1) |
| `BRIEF-AMENDMENT.md` | 87 | brief v2, applied after runs 1–2 |
| `ADVERSARIAL-PROMPT.md` | 136 | independent review lane brief (no lane report present in this folder) |
| `01-fable-5-high.md` | 120 | run 1 report |
| `02-grok-4-5-max.md` | 101 | run 2 report |
| `03-deepseek-v4-flash-max.md` | 111 | run 3 report (first under brief v2) |
| `03b-deepseek-v4-flash-max-0.0.4-control.md` | 152 | 0.0.3→0.0.4 attribution control |
| `docs-investigation-REPORT.md` | 485 | causal investigation of run 1's web layer |
| `docs-audit-gemini-REPORT.md` | 296 | Antigravity/Gemini audit of `docs/site/` + MCP |

No report exists for lanes 4a (Gemini/agy), 4b (NestJS twin), 5a/5b (Codex Sol + Next.js twin) — planned in `RUN-PLAN.md:30-41` but never delivered as files. **Fact:** the wave shipped 4 of 7 planned lanes. The twins (the only direct NetScript-vs-incumbent comparison in the plan) were never run.

---

## 1. Run-by-run facts and per-model behaviour differences

### 1.1 Headline table (all figures cited from the run reports)

| | Fable 5 · high (run 1) | Grok 4.5 · max (run 2) | DeepSeek V4 Flash · max (run 3) | DeepSeek V4 · 0.0.4 control (3b) |
| --- | --- | --- | --- | --- |
| Product | Vigil, on-call escalation | Nightbell, on-call escalation | Shipdeck, deploy queue | DeployLane, deploy queue |
| Wall clock | 1h53m (`01:3`) | **43 min** (`02:27`) | 1h39m (`03:29`) | 2h51m (`03b:43-58`) |
| Cost | not billed; ≈$307 API-equivalent (`01:38`) | $6.38 (`02:28`) | **$1.94** (`03:30`) | $2.29 (`03b:45`) |
| Steps / tool calls | 704 API calls (`01:36`) | 81 steps (`02:29`) | 359 steps / 367 tools (`03:31`, `03b:52`) | 416 steps / 452 tools (`03b:52`) |
| Time to first commit | ~34 min (`01:35`) | ~20 min (`03:36`) | **18 min** (`03:36`) | n/a |
| Commits (agent's own) | 11 of 13 (`01:39`) | 4 of 6 (`02:31`) | 12 (`03:33`) | 7 (`03b:55`) |
| Journal lines (worklog/exp/drift) | 122/92/243 (`01:40`) | 61/36/95 (`02:32`) | 122/82/88 (`03:34`) | 127/50/56 (`03b:56`) |
| Product repo published | **No — blocked** (`01:11`, `01:92-105`) | yes, private (`02:11`) | yes, private (`03:15`) | yes, private (`03b:37`) |
| Teardown claim | asserted, false (`01:79-83`) | claimed, false (`02:33`, `02:81-84`) | partial; orphans killed by PID (`03:106-108`) | 2 Postgres containers left (`03b:137`) |

Efficiency spread is the single largest measured difference: **Fable ≈$307 API-equivalent vs DeepSeek $1.94 for a comparable-or-better product** (`03:37`). Wall clock spread 43 min → 2h51m. Neither wall clock nor cost was the binding constraint in any run except 3b, where the report states plainly "Cost was never the constraint in either; **time was**" (`03b:58`).

### 1.2 The frontend architecture split — the wave's sharpest natural experiment

Same brief, same docs bundle, same framework version, same domain, opposite web architecture (`02:40-60`):

| | Fable (run 1) | Grok (run 2) | DeepSeek (run 3) |
| --- | --- | --- | --- |
| Scaffold's generated service example | **deleted** (commit `8f77555`, 10 files) before writing UI | **kept** (`routes/examples/{incidents,crud,telemetry}`) | kept |
| App-owned UI primitives (`components/ui/mod.ts`) | not used; hand-wrote buttons/inputs/cards/chips | used (`Badge, Button, Card, Input, Textarea`) | used |
| Contract-derived query factories | not used | used (`incidentsClient, incidentsQueries`) | 4 uses |
| `QueryIsland` | 0 | used | 9 |
| `definePage` / `withLayer` | 1 / 1 | 1 / 1 | **18 / 8** |
| Islands | 1 × 360 lines | 1 × 352 lines | **3 × 132–156 lines** |
| Bespoke product CSS | 291 lines `.vigil-*` | none | none |

Sources: `02:47-53` and `03:41-53`.

**Fact:** the variable that separated run 1 from run 2 was not documentation or brief — both identical — but **whether the agent deleted or kept the scaffold's generated examples** (`02:56-58`).

**Fact:** run 3 (brief v2 + a different model) is the first run whose web layer is genuinely composed rather than hand-assembled (`03:55`). **Hypothesis flagged by the report itself:** causation is confounded because model and brief changed together — "One run is a strong signal, not proof" (`03:62-63`).

### 1.3 What all runs missed, regardless of model or brief

`withForm`: 0. `staleTime` / `getCachedEntry`: 0. `withPolicy` / `withTelemetry`: 0 — across three models and two brief versions (`03:65-67`).

The strongest single sentence in the wave on this: Grok "kept and read the generated example, copied its composition, and still did not carry over `staleTime`. **It imitated shape, not behaviour**" (`03:70-71`). This is the empirical basis for the claim that proximity/example-copying fixes *composition* but not *policy/caching/validation discipline*, which must be stated as **numbered defaults in prose**, not demonstrated by example (`03:73`).

### 1.4 Model-specific behavioural notes

- **Fable 5**: strongest drift log of the wave (243 lines, 9 ranked findings with exact command/output, classed broken vs known) — the run report says the drift log is "worth more than the product" (`01:46`). Weaknesses: asserted an unverified cleanup (took `aspire stop` exit code as proof, AppHost tree alive 1h40m — `01:79-83`); 33 minutes of debugging including the run's most valuable finding sat uncommitted until a process steer (`01:84-86`); `experience.md` lagged badly mid-run (`01:87-88`). Used 3 parallel Explore sub-agents, **all scoped to backend** (`01:41`, `docs-investigation:18-22`).
- **Grok 4.5**: fastest and most step-efficient (81 steps, 43 min). Best architecture-per-token. Weakest journal (192 lines total vs Fable's 457) and a **placeholder French translation**, honestly declared (`02:76-79`). Same false teardown claim as Fable, worse (two orphaned AppHost trees, ten processes) — `02:81-84`.
- **DeepSeek V4 Flash**: cheapest by an order of magnitude; **reasoned about the saga exclusion rather than obeying it** — worklog records "No saga plugin — it is known-broken in 0.0.3 (route around it)" and then designs a persisted step list with cooperative cancel at step boundaries and sweep-based recovery (`03:58-61`). Volunteered an honesty note that it captured screenshots but **could not visually inspect them** (no image input) and relied on text snapshots (`03:91-95`). Genuine FR translation.
- **DeepSeek on 0.0.4 (3b)**: disciplined — verified APIs against generated surfaces before writing, wrote 9 failing-capable tests, caught its own Postgres read-modify-write race and said so, flagged >15-min stuck twice as the brief asks (`03b:118-124`). Same failure mode as the baseline: journal written in one batch at the end (`03b:123-124`).

**Cross-model repeated failure (2 of 2, then 3 of 4):** the false teardown claim. "Two different models, same false claim, same mechanism" (`02:84`).

---

## 2. Framework / scaffold defects (real defects, not discovery failures)

Ranked by independent reproduction count, which is the wave's strongest evidence type.

### 2.1 Saga surface — the wave's dominant defect cluster

| Finding | Run(s) | Cost | Current GitHub state |
| --- | --- | --- | --- |
| `POST /api/v1/sagas/publish` hangs forever under the scaffold's **default** redis cache backend; no error, no log, **no exported span** (a hung span never exports, so OTel is structurally blind to it). Root-caused via published JSR sources + 20-line repro; identical path under `CACHE_PROVIDER=denokv` publishes in 18 ms (`01:51-57`) | Fable (~50 min) | ~44% of a 1h53m session (`docs-investigation:76-78`) | **#1064 CLOSED (0.0.4)**; fix PR **#1075 MERGED** |
| `sagaCompensate` effects silently dropped; engine ignores `.correlate()` so instances key on `sagaId:messageType` and **all incidents shared one instance** unless `message.correlationKey` set (`01:59-62`) | Fable | — | **#1065 / #1066 CLOSED (0.0.4)** |
| Scaffolded `sagas/runtime.ts` crash-loops under redis (missing `import '@netscript/kv/redis'`) **while Aspire reports the resource Healthy** — a live instance of the "Healthy is not proof" trap (`01:63-64`) | Fable **and** Grok independently (`02:66`) | — | **#1184 CLOSED (0.0.5)** |
| `createSagaPublisher` hangs when the sagas bus is unavailable (`02:68`) | Grok | — | adjacent to #1064 cluster |
| **`POST /publish` still hangs on 0.0.4 outside the Redis path #1064 fixed**; single-point primitives don't compose | 3b (~75 min, top drift entry — `03b:80-82`) | 75 of the 104-min gap vs baseline (`03b:103-104`) | **#1190 CLOSED (0.0.5), p0** |
| Plugin linking must be declared in plugin config and wired by a shared core seam; root cause traced to the type model — **of every config type only `RawBackgroundProcessorConfig` can express `PluginReferences`**; services, apps and plugins cannot. Hit twice in one session on two surfaces (`03b:90-95`) | 3b | — | **#1189 CLOSED (0.0.5)** |

**Load-bearing conclusion from 3b (`03b:112-116`):** the 0.0.4 engine fixes (#1064/#1065/#1066) "closed with engine-level tests while the *scaffold* around them stayed broken — glue that registers no KV adapter, publish that hangs on the non-Redis path, primitives that can't be composed." The report calls this "**the strongest argument in the wave for e2e-with-OTEL verification over unit coverage**." That is a process/gate finding, not a code finding, and it is the most transferable lesson in the corpus.

**Second-order fact:** two consecutive waves saw an agent route its core flow *around* the saga plugin (`03b:82-83`); 3b kept the saga definition in-repo as a tested policy that never executes.

### 2.2 Streams / live updates

- `STREAMS_DATA_DIR` file-backed mode **silently swallows all producer writes**; `flush()` after upsert does the same; `flush()` resolves either way. Only fire-and-forget enqueue against the in-memory server actually delivers (Fable, ~30 min — `01:58`).
- Installing the streams plugin does not wire its env into dependent services; **install order silently changes behaviour** — **#1067 CLOSED (0.0.4)**.
- Run 3: durable-streams server returned **one snapshot JSON array rather than incremental SSE frames**, so the live UI fell back to a 2s `refetchInterval` and the stream became a durable replay plane only. Report flags the snapshot-instead-of-frames behaviour as possibly "a distinct defect worth its own issue" (`03:86-89`). **Conflict with current state:** I found no issue matching that specific snapshot-vs-frames symptom; the nearest open item is **#1329 (OPEN, 0.0.5) "fix(streams): documented SSE consumer shape differs from the wire protocol and does not specify the standard event/OTEL envelope"** — likely the same root, but the wave-4 symptom is not cited there. Treat as a candidate open thread.
- **Cleanest positive of the wave:** on 0.0.4 the same domain went through — live log tail driven by durable stream via `useLiveQuery`, two dashboards in sync, **zero occurrences of `poll`, `refetchInterval` or `EventSource` anywhere in the run** — and this result is unconfounded by the brief change because nothing in the brief pointed at streams (`03b:71-76`).

### 2.3 Scaffold / CLI defects

- **A fresh scaffold fails its own `deno task check`** — 2 type errors in the generated showcase route, verified on a pristine worktree (`01:65-66`). **#1287 CLOSED (0.0.5)** ("generated catalog showcase hits QueryClientPort vs QueryClient").
- `netscript generate plugins` drops hand-added worker jobs / emits a stale workers registry — **third reproduction across three models** (Fable, Grok, DeepSeek) (`02:67`, `03:82`). **#1234 CLOSED (0.0.5)** ("scaffold profile excludes user files").
- `netscript db seed` starts a partial AppHost (Grok, new — `02:70`).
- Webhook payload nests JSON under `.body` (Grok, new — `02:71`).
- Workers HTTP `/jobs/{id}/trigger` not found (Grok, new — `02:72`). **No matching issue found** in the current board search; nearest historical is #951 (closed, 0.0.2, `triggerJob` NOT_FOUND). Candidate unfiled item.
- Triggers: scheduled trigger fires once then goes silent (KV version mismatch `0.0.1-beta.11` vs `0.0.3`) — **new, explicitly "not yet filed"** (`03:80`).
- Triggers background processor: Redis KV adapter "not registered" even after `import '@netscript/kv/redis'` — new, adjacent to #1064 cluster (`03:81`).

### 2.4 Harness / tooling defects (agent-facing, not framework code)

- `aspire stop --all --non-interactive --nologo` reports *"No running AppHost found"* and **exits 0 while processes rooted at the workspace's `apphost.mts` are alive**; `agentic:teardown` reports `stoppedAppHosts: []` for the same tree. **Confirmed reproducible across two runs and two models** (`01:113-117`, `02:96-98`) and again in run 3 (`03:83`). "Worth an issue each" — **I found no matching issue on the current board.** This is the single highest-confidence unfiled defect in the wave.
- Stray `aspire nuget search` processes are **invisible to `agentic:leak-check`** (which sees only AppHosts and containers) and **ignore SIGTERM** — SIGKILL required. 32 orphans 16–18h old from the Fable and Grok lanes were cleared mid-3b; a prior incident left 36 running for 9.7h (`03:106-108`, `03b:145-147`, `RUN-PLAN.md:9-11`, `RUN-PLAN.md:85-86`). Related-but-different: **#1227 CLOSED (0.0.5)** covers `aspire-restore` hangs against NuGet feeds, not the orphan-process leak.
- **The agentic toolchain has no tool to steer a live interactive Claude session.** Documented loop is launch → watch → steer → evaluate → merge, but `steer` exists only for the Codex lane; `claude/` is hook logger, skill sync, surface validator and a `@deprecated` remote smoke test. Orchestrator-to-orchestrator steering falls back to raw tmux keystrokes against a TUI rendering a stale input buffer (`03b:148-151`). No matching issue found.
- `gh repo create` and the GitHub MCP equivalent were **refused by Claude Code's auto-mode classifier, not by GitHub**, blocking product publication for run 1 and predicted to hit every subsequent run (`01:92-105`).
- Vercel preview failed with "GitHub couldn't verify an account for the commit" because the agent committed as `session@local`. Carry-forward: **set a resolvable git author email in the workspace before launch**, or every agent PR loses its preview (`03b:133`).
- No webp encoder in the sandbox (`cwebp`, `ffmpeg`, Pillow, sharp all absent; apt needs root) → screenshots shipped as PNG against a brief that requires `.webp` (`03b:135-136`, brief `WAVE-4-PROMPT.md:269`).

---

## 3. Docs / discovery failures (not defects)

### 3.1 The docs-investigation verdict (run 1, Vigil)

Primary cause: **capability activation, not documentation completeness** (`docs-investigation:16-22`). The agent knew it had to research unfamiliar backend mechanisms but could build a plausible Preact UI from training priors; it researched the one unfamiliar frontend requirement (live streams), declared the web problem solved, and fell back to familiar component state + CSS. Two of three research lanes were wholly backend; the only web lane was scoped to live query.

Evidence chain (`docs-investigation:64-89`):
1. The manual-read trace contains **six pages and no Web Layer page**; `docs/deno-doc/fresh-ui.txt` was never opened.
2. `.llm/run/drift.md` ranks the saga blocker at ~50 min of a 1h53m session (~44%).
3. The run plan put the Fresh app **last** in the public-surface list; slice 6 = "durable stream + live dashboard", slice 7 = "UI polish". **No planned slice names Fresh UI, query factories, forms, partials, or builder composition.**
4. The exact scaffold is preserved at commit `5778dc8`; its generated service route used four `withLayer()` calls, `withPolicy()`, `withTelemetry()`, a deferred summary partial, hydration, `QueryIsland`, and query-factory mutations. Commit `8f77555` deleted those ten files **before** the product UI was written.
5. Final product imports none of the app-owned UI components and none of the Fresh query/form/error APIs; the root scaffold layout still uses `Badge` and `Button`, the Vigil board does not.

**Four maintainer hypotheses adjudicated** (`docs-investigation:215-335`):

| Hypothesis | Verdict | Confidence stated |
| --- | --- | --- |
| "The brief caused it" | substantial contribution, not sole cause; the brief's real flaw is that web leverage is **aspirational, not an acceptance gate** ("None of this is a requirement to tick", `WAVE-4-PROMPT.md:112`) | high |
| Budget exhaustion | **major amplifier** — "budget loss converted a research omission into a commitment" | high |
| "Docs unreachable / not linked from `llms.txt`" | **factually false** — `docs/llms.txt:121-137` names Web Layer, builders, deferred UI, errors, examples, forms, Fresh UI, query cache, route contracts, testing, live-dashboard tutorial; `:155-156` links both generated references; quickstart says "Start at /design". The real failure is that `llms.txt` is a **flat 185-line catalog, not a task gate**, and the root instruction never reappears when an agent starts editing `apps/dashboard/islands/` | high |
| "The scaffold anchors minimal patterns" | **rejected** — the scaffold demonstrates more web-layer power than Vigil did. Its defect is the opposite: **signal dilution**, 14,398 lines across 143 dashboard files in the first scaffold commit, 50 registry items, the most powerful service route split across ten files, and no app-local instruction naming which files are canonical | very high |
| "Manual prose harms agents; generated API docs are better" | **rejected as direct cause** (no relevant Web Layer manual was read); split as a general claim | high for this run, medium generally |

The one legitimate *content* criticism it does confirm: the builder manual's first "Building a page" sample registers a `metrics` resource, never consumes it, and builds without a layer or layout (`web-layer/builders/index.md:15-31`) — an agent skimming only that anchors low (`docs-investigation:316-320`). → **#1069 CLOSED (0.0.4)**.

Its general rule, worth carrying verbatim into any docs plan: **"manual/task docs choose the capability; generated docs specify it; scaffold examples show composition"** — this run overused step 2 and skipped 1 and 3 for the frontend (`docs-investigation:333-335`).

Generated-docs ergonomics facts: `fresh.txt` is 5,502 lines, builders begin at line 644, streams at 5,162; `fresh-ui.txt` renders the copy registry as an opaque manifest/content record near the end and does not enumerate the app's 50 installed registry items as a task menu (`docs-investigation:38-41`, `322-331`). → **#1070 CLOSED (0.0.4)**.

### 3.2 The Gemini docs audit (`docs/site/` corpus)

Verdict: **NO — good for human architects, "fundamentally unoptimized and deceptive for autonomous AI agents"** (`docs-audit:39`). Corpus: ~165 files / ~35,700 lines under `docs/site/`; 204 active markdown files (`docs-audit:15`, `:129`).

Five structural traps (`docs-audit:43-65`):
1. **Scaffold anchoring / cognitive ceiling** — docs teach `netscript init` as the ceiling; agents never attempt custom plugins, DB adapter seams, or subpath export organisation.
2. **Buried/omitted core primitives** — `definePage().withForm()` **completely omitted** from `web-layer/form.md`; `staleTime` and `api.<resource>.<action>.getCachedEntry` buried in prose and one tutorial while `web-layer/query.md` **teaches raw `fetch()`**; `definePlugin` isolated in a how-to.
3. **Agent onboarding traps in `quickstart.vto`** — omits `netscript agent init` and MCP tooling; omits `--yes --ci`; presents `aspire start` as foreground with no backgrounding note; no repo file-tree map.
4. **Snippet incompleteness/anti-patterns** — 18 code blocks use obsolete barrel imports (`from "@netscript/fresh"`); floating snippets lack file-path headers and top-level imports; five major concept pages contain **0 code blocks** (`data-persistence/kv-queues-cron.md`, `identity-access/auth.md`, `observability/telemetry.md`, `ai/index.md`, `background-processing/polyglot-tasks.md`).
5. **Corpus noise / RAG degradation** — 21 physical redirect stubs (10.3% of active `.md`) + 9 empty how-to index wrappers.

Restructure proposal: 204 → 128 files (−37%), 28 reference directories → 9 domain files, 37 tutorial pages → 3 production track walkthroughs anchored on `eis-chat`, `vigil`/`shipdeck`, `nightbell` (`docs-audit:129-158`). MCP breakage risk is analysed concretely: `FilesystemDocsCorpus.slugFromPath` derives slugs from relative paths, so moves/deletes break `get_doc({slug})`; mitigation is `oldUrl` front-matter parsing + a `slugAliases` map in `filesystem-docs-corpus.ts` and `docs-flows.ts`, then re-run `gen:publish-assets` (`docs-audit:160-166`).

MCP verdict: technically sound (context caps, section slicing, mtime caching) but **"completely insufficient as the primary agent interaction surface"**; agents never called it because (a) quickstart never mentioned `agent init`/MCP, (b) it offers only raw string search + full doc fetch so grep over the offline bundle is faster, (c) no structured topic catalog, snippet extraction, or diagnostic integration (`docs-audit:185-196`). Proposed: `list_topics` with Diátaxis tags, doc slugs embedded in `netscript doctor` failures (`DoctorCheck.docRef`), a code-snippet extractor with `hasCode`/`lang` filters, and BM25/hybrid search replacing term-count `rankDocument()`.

Benchmarks (`docs-audit:172-178`): TanStack ~45% code with live sandboxes; Medusa ~35% code, **100% complete files with explicit path headers**, and a standard 4-part page skeleton (Prerequisites → Steps → Test it out → Next Steps) with strict bidirectional navigation. NetScript ~40% code but snippets float without path headers or imports, prose is "theoretical and academic", cross-linking is sparse.

Six predeclared evaluation metrics with baselines (`docs-audit:258-277`): 0 MCP tool calls / 0% `withForm` / 0% `staleTime` / 0 `ui:add` invocations & ~650 hand-written CSS-HTML lines / 2 of 3 agents forced `refetchInterval` polling / multiple barrel-import violations. Targets: ≥5 MCP calls per run, ≥66% `withForm`, ≥66% `staleTime`, ≥1 `ui:add` per web build, 0% polling, 0 barrel imports.

Phase-5 telemetry (`docs-audit:285-295`): 0 docs-MCP calls across 3 frontier runs; **17 reads of `fresh.txt` with `fresh-ui.txt` (1,319 lines, linked 3× from `llms.txt`) completely ignored**; 0 `withForm`, 0 `staleTime`, 0 cache-first reads. Its conclusion: failures were "**not caused by model limitations**" but by entry points, anti-pattern snippets, buried primitives and missing agent onboarding.

### 3.3 Where the two reports disagree — this matters for the plan

1. **Cause attribution.** docs-investigation says the manual and `llms.txt` were **complete and linked, and simply never read**; the failure is salience at the decision point (`docs-investigation:262-282`). The Gemini audit says the content itself is defective and agents "copied what was shown on the primary concept pages" (`docs-audit:293`). **Both are supportable and they address different runs/surfaces:** run 1 never opened the web-layer pages at all (so content could not have caused its choice), while the `withForm`/`staleTime` zero across *all* runs — including agents that did read the generated example — is better explained by content omission plus example-imitation-without-policy (`03:70-71`). **Recommendation for the plan: do not pick a side; the two failure modes need different fixes (salience gate vs primary-page content), and both were in fact filed and shipped separately (#1071 vs #1097).**
2. **"Agents kept and read scaffold golden examples" (`docs-audit:288`) is false for run 1** — Fable deleted the ten-file service example at commit `8f77555` before writing UI (`docs-investigation:82-83`, `02:47`). The Gemini claim holds for Grok and DeepSeek only.
3. **Polling-fallback baseline.** `docs-audit:272-274` says 2 of 3 agents forced `refetchInterval`. `03:86-89` describes DeepSeek as "the second run to downgrade live updates to polling because streams did not deliver (Grok was the first)". `03b:72-73` instead attributes the two abandonments to **wave three**. The counts are not reconcilable from these documents alone; treat the "2 of 3" baseline as approximate.
4. **Broken-link count.** `docs-audit:202` claims 21 broken links but enumerates only 14 numbered entries (17 anchor + 4 path claimed; list stops at #14). The filed issue **#1095 (CLOSED, 0.0.4)** says "fix 13 broken internal links". Quantities do not match; the audit's count is unverified.
5. **`fresh-ui.txt` size.** `BRIEF-AMENDMENT.md:18-19` and `docs-audit:287` both say 1,319 lines; `docs-investigation:137-138` cites `fresh-ui.txt:1-2,696,1156,1275` — consistent.

---

## 4. Brief-design findings (the brief is itself an instrument under test)

`BRIEF-AMENDMENT.md:8-22` names three defects in brief v1, in damage order:

1. **The quality-bar examples functioned as a menu.** "PagerDuty … an on-call escalation tool" was named first and spelled out first (`WAVE-4-PROMPT.md:79-82`); both runs 1 and 2 built on-call escalation. "We supplied the answer and then measured whether they could find it."
2. **"Build a product whose hard part is the backend, with a real interface on top"** (`WAVE-4-PROMPT.md:55`) **deprioritised the web layer by instruction.** Fable read it as written: all three research sub-agents on backend surfaces, `fresh-ui.txt` never opened despite being in the bundle, linked 3× from `llms.txt`, and **already a declared dependency in its own `deno.json`**.
3. **Everything funnelled into sagas** — the four pressures are answerable by sagas alone, so both agents answered with sagas alone and never exercised workers/queue/cron/triggers/streams as primary surfaces.

Four amendments applied for runs 3/4a/5a: assign the domain per run (deploy queue / subscription billing run / multi-tenant API console, `BRIEF-AMENDMENT.md:30-34`); rebalance to "**Build a product that is hard on both sides**"; make the web layer a first-class research target with "read the generated surface of **every** package your project depends on" and ≥1 web-layer-scoped research sub-agent; and convert "state what you did not use" from a writing gate into a **build gate** ("If the list contains something your product plainly did need, you have found a gap in your own research, not a gap in the framework").

Deliberately unchanged: the four pressures stay expressed as **pressures, never feature names**, and no retrospective framing is ever given to a fresh agent (`BRIEF-AMENDMENT.md:80-86`, `WAVE-4-PROMPT.md:15-17`).

**Run 3b's confound, stated plainly by the orchestrator** (`03b:99-106`, `:127-129`): deleting the "known broken in 0.0.3" saga paragraph was correct for *finding defects* (bought three verified issues, one p0) and wrong for a *clean speed comparison* (cost ~75 of the 104-minute gap). "Net of the saga detour, the two runs are close. **Any statement of the form '0.0.4 made agents slower' is unsupported by this data.**" Additional confound: the 0.0.5 orchestrator and two other sessions shared the VM throughout 3b while the baseline had the machine to itself.

**Unintended treatment in 3b** (`03b:27-30`): 0.0.4's `agent init` emits a materially richer `AGENTS.md` (MCP `search_docs`/`doctor`, receipt-gated drift recording) plus `.llm/tools/` — 11 diagnostic tools the baseline never had. Left in place because "that *is* 0.0.4". So 3b measures release-as-a-bundle, not framework version in isolation.

**Falsifiable check designed but (per this corpus) not executed** (`docs-investigation:454-484`): replay the same brief/version/bundle/budget changing only remediation 1 (generated app-scoped `AGENTS.md`), six agents per arm, blind scoring against a six-item predeclared rubric, success = ≥4 of 6 treatment runs satisfy items 1–5. Its designed discriminator is the valuable part: if treated agents read the named files and still reject the APIs, "the problem is content/API ergonomics rather than discoverability."

---

## 5. Current GitHub state vs the carried-in reports (state wins)

Verified 2026-08-08 via `gh` against `rickylabs/netscript`.

**Shipped / closed since wave 4 — do not re-file:**

| Wave-4 finding | Issue | State |
| --- | --- | --- |
| Saga publish hang under redis default | #1064 (fix #1075) | CLOSED / MERGED, 0.0.4 |
| `sagaCompensate` dropped | #1065 | CLOSED, 0.0.4 |
| `.correlate()` ignored | #1066 | CLOSED, 0.0.4 |
| streams plugin env not wired to dependents | #1067 | CLOSED, 0.0.4 |
| task router above `llms.txt` | #1068 | CLOSED, 0.0.4 |
| builders page must lead with full-power example | #1069 | CLOSED, 0.0.4 |
| generated deno-doc cross-routing + `fresh-ui.txt` under-describes copy registry | #1070 | CLOSED, 0.0.4 |
| **app-scoped `AGENTS.md` + `WEB-LAYER.md`** (docs-investigation remediation 1+2) | #1071 | CLOSED, `status:shipped`, 0.0.4 |
| `agent init` diagnostic surface must gate, not suggest | #1072 | CLOSED, 0.0.4 |
| 14 invalid root/barrel imports → subpaths | #1096 | CLOSED, 0.0.4 |
| `withForm` canonical on the primary form page | #1097 | CLOSED, 0.0.4 |
| verified non-interactive agent quickstart path | #1098 | CLOSED, 0.0.4 |
| Prisma driver adapters (libSQL/Turso) documented | #1101 | CLOSED, 0.0.5 |
| docs corpus redirect-aware instead of indexing 21 empty pages | #1100 | CLOSED, 0.0.4 |
| broken internal links | #1095 (13 links) | CLOSED, 0.0.4 |
| fresh scaffold fails own `deno task check` | #1287 | CLOSED, 0.0.5 |
| `generate plugins` excludes user job files | #1234 | CLOSED, 0.0.5 |
| saga runtime glue registers no KV adapter | #1184 | CLOSED, 0.0.5 |
| publish still hangs on 0.0.4 non-redis path | #1190 | CLOSED, 0.0.5 |
| plugin linking via shared core seam / `PluginReferences` type gap | #1189 | CLOSED, 0.0.5 |

**#1071 verified shipped in the working tree** (not just closed): `packages/cli/src/kernel/templates/app/agent-conventions.ts` (185 lines) is written by `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:176-177` as `apps/<app>/AGENTS.md` + `WEB-LAYER.md`. It contains the numbered defaults the wave asked for, including `QueryIsland` hydration (`:131`), **`withForm` as rule 5** (`:133`), the `ui:add` generators (`:137-139`) and the `contract → createQueryFactories → definePage layers → QueryIsland/useMutation → live stream` chain (`:163`). **Note:** `staleTime`/`withPolicy`/`withTelemetry` do **not** appear in that template — the exact three surfaces that scored 0 across all runs (`03:67`) are still absent from the shipped anchor.

**Still open and directly downstream of wave-4 evidence:**

| Issue | Milestone | Relevance |
| --- | --- | --- |
| #1090 verify(wave-five): does the shipped agent surface actually change agent behaviour? | 0.0.5 | the falsifiable check from `docs-investigation:454-484`, still open |
| #1208 no tutorial demonstrates the page builder — MCP-served docs will teach the wrong patterns | 0.0.5 | direct successor to the Gemini tutorial-consolidation recommendation |
| #1210 web-layer differentiator deep-dives + competitive tutorial benchmark | 0.0.6 | the TanStack/Medusa benchmark work |
| #1333 make the default app an idiomatic eis-chat-grade reference | 0.0.5 | the "signal dilution" scaffold fix, unfinished |
| #1102 MCP capability discovery as intent-aware primary workflow | 0.0.5 | the `list_topics` recommendation |
| #1201 MCP must serve generated export surfaces, not just prose | 0.0.6 | the `fresh.txt`/`fresh-ui.txt` gap |
| #1329 streams SSE consumer shape differs from the wire protocol | 0.0.5 | closest match to run 3's snapshot-instead-of-frames |
| #1332 / #1334 docs(data/contracts), docs(home) | 0.0.5 | remaining docs content work |

**Unfiled as of today, high confidence, from wave-4 evidence** (searched; no matching issue found):
1. `aspire stop --all` exits 0 reporting "No running AppHost found" while the tree is alive, and `agentic:teardown` reports `stoppedAppHosts: []` for the same tree — **3 reproductions, 2 models** (`01:113-117`, `02:96-98`, `03:83`).
2. `agentic:leak-check` cannot see stray `aspire nuget search` processes, which ignore SIGTERM — 32 orphans 16–18h old, historic peak 36 for 9.7h.
3. No steering tool for a live interactive Claude session; `steer` exists only for the Codex lane (`03b:148-151`).
4. Triggers scheduled trigger fires once then goes silent (KV `0.0.1-beta.11` vs `0.0.3` version mismatch) — the run report states outright "not yet filed" (`03:80`).
5. Workers HTTP `/jobs/{id}/trigger` not found (`02:72`); `netscript db seed` starts a partial AppHost (`02:69`); webhook payload nests JSON under `.body` (`02:71`).

---

## 6. What wave 4 proves, as claims a plan can rely on

**Facts (multiply sourced or directly measured):**
- F1. Agents copy *composition* from a nearby example but do not carry over *policy* (`staleTime`, `withPolicy`, `withTelemetry`, `withForm`): 0 uses across 3 models and 2 brief versions (`03:65-71`).
- F2. Deleting vs keeping the scaffold's generated service example is the strongest observed predictor of web-layer quality within a fixed brief and docs bundle (`02:47-58`).
- F3. A single backend blocker consuming ~44% of the budget converts a research omission into an architectural commitment (`docs-investigation:76-78`, `:243-257`).
- F4. Engine-level fixes verified by unit tests do not make a surface usable; the scaffold glue around #1064/#1065/#1066 remained broken on 0.0.4 (`03b:112-116`). **e2e-with-OTEL is the only verdict that transfers.**
- F5. Agents falsely assert cleanup from exit codes. 2 of 2 early runs, same mechanism, and the wave brief already warns about exactly this trap (`WAVE-4-PROMPT.md:153-155` "Verify the artefact, never the exit code") — **the warning did not prevent the behaviour in the agent that quoted it** (`01:79-83`).
- F6. Docs completeness ≠ salience: everything the run-1 agent needed was linked from `llms.txt` and present on disk, and none of it was read (`docs-investigation:262-282`).
- F7. Cost was never the binding constraint; wall clock was (`03b:58`). The cheapest run produced the best-composed web layer.

**Hypotheses (single-run or confounded — label them as such in any plan):**
- H1. Brief v2 (assigned domain + both-halves-hard + web research lane) caused run 3's composition improvement. Confounded by model change; the report says so itself (`03:62-63`).
- H2. 0.0.4 improved the web layer. Supported by the unconfounded streams result (`03b:71-76`) but the wall-clock/token comparison is unusable because of the deleted saga paragraph and VM contention (`03b:127-132`).
- H3. The Gemini audit's claim that the failures were "not caused by model limitations" (`docs-audit:295`) is asserted, not demonstrated — it is contradicted in part by F2 (two models, identical docs, opposite outcomes).
