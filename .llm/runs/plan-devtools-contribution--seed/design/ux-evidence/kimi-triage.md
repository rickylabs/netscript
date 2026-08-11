# Stage-D2 adjudication — Kimi K3 pure UI/UX pass

Lane: `openrouter/moonshotai/kimi-k3`, variant `high`, read-only worktree `ns-devtools-d2-kimi`,
findings-only. Owner-directed lane split, drift **D-16**. Advisory design evidence — **not** a
Plan-Gate verdict.

Reviewer verdict: **`UX-FINDINGS: 1 critical, 5 major, 5 minor`**.

**Every finding is dispositioned. I verified each anchor in source before accepting it.**

| # | Sev | Finding | Disposition |
| - | --- | ------- | ----------- |
| **K-C1** | **critical** | **Home cannot distinguish "nothing is broken" from "DevTools is blind."** A ranked problem feed rendering empty has two meanings and the RFC gave no way to tell them apart | **ACCEPTED — fixed.** Verified: §11.3's tree listed *what* the feed shows and nothing about its own observability. Added **§11.3.1**, a normative feed-coverage contract: a closed `FeedSource` set, a `FeedSourceStatus` per source, and the rule that **`all-clear` is only reachable when every source is `reported`** — otherwise the feed renders `partial` and names the gap. `not-configured` is kept distinct from `unreachable` so a missing automation plugin doesn't cry wolf and a real outage isn't hidden. Browser validation asserts all three shapes |
| **K-M1** | major | **`DevToolsUiNode` tables are string-only** — `rows: readonly (readonly string[])[]`. The canonical devtools table is `id \| status-badge \| trace-link`, which a string matrix cannot express | **ACCEPTED — fixed.** Verified at §7. Table cells are now `DevToolsCell` nodes (text / badge / link / code). This was the sharpest finding in the pass: the RFC claims "most panels are key/value + table + list" *and* shipped a table that cannot hold the two things a devtools table exists to show |
| **K-M1b** | major *(same fix)* | **No `code` element**, yet §11.1's AC-2 requires every mutation surface to render its CLI-equivalent line | **ACCEPTED — fixed.** Added `{ kind: 'code' }`. Without it an acceptance criterion the RFC declares normative was **unsatisfiable by its own vocabulary** |
| **K-m3** | minor | **§5's route sketch contradicts §11.3** — it promises `traces/`, which §11.1 explicitly killed | **ACCEPTED — fixed.** Verified both anchors. §5 now lists `runtime/ flows/ contracts/ plugins/ generated/ automation/`. A sketch promising a surface the same RFC bans is worse than no sketch |
| **K-M2** | major | **Journey view has no index route** and in-links are inconsistent — Sagas links to `/flows/:correlationId`, Workers lists only Aspire out-links | **ACCEPTED — deferred to the next amendment pass**, with the reason recorded: it needs a `/flows/` index design (what does the list show when you have no correlation id in hand?), which is a design decision rather than a correction. Tracked as an open item, not silently dropped |
| **K-M3** | major | **Two panel-state vocabularies with no mapping** — `PanelAvailability` (§7) vs the seven-arm `PanelState` (§11.7), and read-only v1's central affordance falls between them | **ACCEPTED — deferred to the next amendment pass.** Real and structural; the fix is a single state contract, and doing it half-way would leave a third vocabulary. Same class of defect PLAN-EVAL cycle 2 caught with identity/ordering, which is why it gets a proper pass rather than a patch |
| **K-M4** | major | **Staleness is unrepresentable in the normative state contract**, though §11.7 quotes "shows stale data" as the very false-done mode it guards | **ACCEPTED — partially fixed now, rest deferred.** §11.3.1's `FeedSourceStatus` introduces `'stale'` with `observedAt` at the *feed* level. The per-panel freshness contract lands with K-M3's state unification |
| **K-M5** | major | **Contributor walkthrough dead-ends at data** — §7's `DevToolsPanelContext` carries `data?: unknown` and never signposts §8's `DevToolsProcedureReference` | **ACCEPTED — deferred**, and this one matters most for adoption: a plugin author reading §7 alone cannot get their own runtime state. Fix is a signpost plus one worked end-to-end example |
| **K-m1** | minor | **"Ranked" has no ranking rule**, severity vocabulary, or row schema | **ACCEPTED — deferred.** Folds naturally into the K-M3 state-contract pass; ranking without a severity vocabulary is undefined |
| **K-m2** | minor | The two most common sessions have no shell-level state: **app down**, and **stale generated host** | **ACCEPTED — deferred**, folds into K-M3 |
| **K-m4** | minor | **`/automation/` is filler** — a permanent placeholder holding a top-level nav seat | **ACCEPTED as a fair charge, not yet actioned.** It is staged behind #1446's contracts, so it is *justified* filler — but Kimi is right that a placeholder occupying a top-level seat from day one is exactly the "generic IA" smell the charter warns about. Escalated as an owner-visible IA question rather than quietly kept |
| **K-m5** | minor | **No density contract** — unbounded histories, no sort/filter/pagination story, while Aspire's own store caps at 10,000 | **ACCEPTED — deferred.** A diagnostic surface without a density/truncation story silently lies at scale, and the cap is a cited upstream fact |

## What Kimi got right that the architecture lane could not have

Every accepted finding here is about **what a developer experiences**, and none of them overlaps the
Qwen lane's contract-level findings. The lane split the owner directed produced genuinely
complementary evidence rather than two views of the same list.

The two fixes applied immediately — the ambiguous empty feed and the string-only table — are both
cases where the RFC **contradicted its own stated goals**: it declared a "what is broken?" home and
gave it no way to say "I cannot see", and it declared a CLI-equivalent acceptance line and gave its
vocabulary no way to render one.

## Honest limitation of this pass

Kimi K3 is the **vision-capable** lane, but nothing is implemented, so there are no screenshots,
mockups, or rendered artifacts. It reviewed the information architecture **as text** and its vision
capability was **unused** (drift D-16). A follow-up pass *with* images, once the IA is prototyped,
would be materially different — and stronger — evidence.

## Deferred items are tracked, not dropped

K-M2, K-M3, K-M4 (per-panel), K-M5, K-m1, K-m2, K-m5 land in a **single state-and-DX amendment
pass**, because they share one root: the RFC has two panel-state vocabularies and no worked
data-access example. Splitting them across patches would produce a third vocabulary — the precise
failure PLAN-EVAL cycle 2 caught with identity and ordering.
