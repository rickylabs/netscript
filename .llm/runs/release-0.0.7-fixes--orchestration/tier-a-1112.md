# Tier-A — #1112 `prisma-mysql-honest-example` RESEARCH + PLAN at `7a3639969ae8319d501244b6658ade303ac3392f`

| Field | Value |
| --- | --- |
| Plan head | `7a3639969ae8319d501244b6658ade303ac3392f` — local == remote == PR `headRefOid` |
| Base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b` |
| PR | **#1711**, `OPEN`, **draft**, base `main` |
| Author | Codex `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, `gpt-5.6-sol` · high |
| Verdict | **PASS** — with one finding that must be settled before implementation |

## Scope — plan-only, exact

Three commits (`8c4bef940` → `26c163fdf` → `7a3639969`). `git diff --name-only cf648f1ff HEAD` returns
**five paths, all under the run dir**: `research.md`, `plan.md`, `context-pack.md`, `worklog.md`,
`drift.md`. **Zero** `packages/`, **zero** `docs/`, **zero** `deno.lock`. Worktree clean.

## Lockfile boundary — resolved, and the record corrected

A live check found `M deno.lock` mid-turn: one added line,
`"npm:mysql2@3.22.5": "3.22.5_@types+node@25.9.3"`, an exact-pin resolution beside the existing
`^3.22.5` range. It was **never committed** — verified by
`git diff --name-only cf648f1ff HEAD -- deno.lock` returning empty across all three commits.

**Correction to this topic's own account:** the boundary instruction this topic wrote was committed but
**never delivered** — the background job armed a watcher that only *waited* for idle; it did not resume
the author. The author restored the lockfile independently. Reporting it as "instructed and complied"
would have been false.

The transient is now documented at the author's `drift.md:40-51` and `worklog.md:84,104,134`, with a
named cause (`deno info npm:mysql2@3.22.5`), detection attributed to its own gate 15, and the final
state ("byte-identical to base before every commit and never entered history"). Honest and specific.

## Envelope — seven paths, eighth declared a rescope

The amended plan carries the seven-path envelope with no stale five-path claim anywhere. Deferred scope
explicitly names an eighth path as a hard rescope, including the site `examples_test.ts`, any new test
file, generated fixtures, public-barrel translator/adapter exports, and runtime injection.

Recorded because it nearly became a false finding: a grep for out-of-envelope paths hit
`docs/site/reference/prisma-adapter-mysql/examples_test.ts` at `plan.md:198`. Reading the context showed
it sits **inside** the "Deferred scope" list — correctly declared, not planned. That would have been the
third grep-shaped false finding this milestone; context, not the count, settled it.

## Seam architecture — matches the ruling exactly

| Requirement | Plan |
| --- | --- |
| Internal-source export only | **D13** — export `toMysql2PoolOptions` from `src/adapter.ts` only, imported directly by the owned test |
| No package-root exposure | **D14** — no `PrismaMySqlAdapter` or translator from the public barrel; gate 14 asserts absence from **both** barrels and the published root |
| No runtime injection port | **D14**, explicit |
| Extend, do not add | **D15** — extend `connection_errors_test.ts`, with the reason stated: it already owns `FakePoolClient` cleanup, so one contract cannot drift across suites |

The risk register carries "Translator becomes accidental public API" with the assertion that closes it.

## Required plan content — present

Falsehood census enumerated to **eight** Deno-native locations (README `:13`/`:20`, `src/mod.ts:4-5`,
`types.ts:92`, `adapter.ts:333`/`:173`/`:216`, and `examples/basic-usage.ts:4`), each row carrying an
explicit disposition. The `adapter.ts:30` Debug namespace is decided rather than swept in — gate 13
expects "only the explicitly allowlisted legacy debug string remains".

The example is planned to be **compile-checked as the actual file**, not as a transcribed snippet, with
live `PrismaClient` construction, one real query, and `$disconnect()` in `finally`. The risk register
names the precise trap — "Example type-checks while its Prisma code remains dead" — and mitigates it
with a content review, not just a compile.

## FINDING — `tls.mode: 'verify_identity'` is a breaking behaviour change, and the authorization claim is wrong

The option audit is the strongest part of the research, and it found a genuine defect. Current code,
`adapter.ts:738-740`:

```ts
if (config.tls?.mode === 'verify_identity' && config.tls.caCerts?.length) {
  options.ssl = { ca: config.tls.caCerts.join('\n') };
}
```

So today: `verify_identity` **without** CAs sets no `ssl` at all — the connection is **plaintext**; with
CAs it sets `ssl.ca` but leaves mysql2's `ssl.verifyIdentity` at its default `false`. The accepted option
name promises verification the adapter never performs. That is a real acceptance-row-4 finding.

**But the proposed remedy is not a docs fix.** Plan **D12** would "always set mysql2
`ssl.verifyIdentity: true`" when the mode is selected. That changes runtime behaviour for existing
consumers in two breaking ways:

1. `verify_identity` with no CAs goes from **plaintext** to **TLS + identity verification** — a
   connection that works today can start failing outright.
2. `verify_identity` with CAs goes from **TLS without hostname verification** to **hostname
   verification enforced** — certificates with mismatched hostnames, common in internal deployments,
   begin failing.

Both are runtime-breaking, and one is security-relevant in the direction of *tightening*, which is
correct behaviour but a **breaking change**, not a bug fix that can ride inside a documentation leaf.

**The authorization claim is over-stated.** `research.md:130` reads "The **coordinator-authorized**
correction is to forward `ssl.verifyIdentity: true`". Checked against the coordinator's actual grants:
the rescope authorized the two extra paths, the seam shape, and testing the exact structured → `mysql2`
mapping. **Nothing authorized changing TLS semantics.** `plan.md` D12 does not repeat the phrase, so the
false claim is confined to `research.md:130` — but it would carry into implementation as settled.

**Disposition — not a plan FAIL, but blocking for implementation.** Acceptance row 4 permits
"remove/deprecate **or** implement". The non-breaking satisfaction — document the current conditional
behaviour honestly and deprecate the misleading mode — is available and is entirely within a docs leaf.
Implementing verification is defensible but is the coordinator's call, and needs disclosure as a
breaking change if taken. **Returned for a ruling; no implementation grant should treat D12 as settled.**

## Prohibitions — held

No product mutation. No PLAN-EVAL launched. No runtime, Aspire, Docker, browser, or `e2e:cli` — the plan
states none is required because the seam gives static and unit evidence. `#1664` untouched, `#1293`
row-1 wording untouched, no other lane's artifacts modified. Docker 0 containers throughout.

PR body carries **no** closing keyword — correct, the plan does not resolve #1112.

## Lifecycle updated in place

| Record | Before | Now |
| --- | --- | --- |
| PR **#1711** | no labels, no milestone | `type:docs` `area:database` `priority:p1`, sole `status:plan`, milestone `0.0.7`, still **draft** |
| Issue **#1112** | `status:triage` | sole `status:plan` |

## Outcome

**Tier-A PASS at `7a3639969`.** The plan is coherent across all seven paths, the seam matches the ruling
exactly, and the falsehood census is complete at eight locations. One finding returned for a coordinator
ruling: the `verify_identity` remedy in D12 is a breaking runtime change carrying an incorrect
"coordinator-authorized" label in `research.md:130`.

**STOPPED before PLAN-EVAL**, per instruction. No PLAN-EVAL dispatched, no implementation authorized.

---

# Tier-A — #1112 TLS repair at `34a6e3d9897dd7d9880686c3c2734b24a5591af6`. **PASS**

| Field | Value |
| --- | --- |
| Plan head | `34a6e3d9897dd7d9880686c3c2734b24a5591af6` — local == remote == PR `headRefOid`, clean, **draft** |
| Base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b` |
| Commit | `34a6e3d98 docs(prisma-mysql): plan legacy TLS deprecation` |
| Verdict | **PASS** |

## Scope and lockfile

Four commits, `git diff --name-only cf648f1ff HEAD` = **five paths, all under the run dir**. Zero
`packages/`, zero `docs/`, zero `deno.lock`. `git log --all -- deno.lock` on this branch returns only
pre-existing `main` release cuts — the lockfile never entered this branch's history at any point.
Seven-path envelope intact; `plan.md:26` and `:77` declare an eighth path a rescope.

## The 13-location sweep — verified by reading, not counting

| Check | Result |
| --- | --- |
| `coordinator-authorized` claim | **0 occurrences** — deleted, not softened, and not replaced with another authorization assertion |
| Runtime-change intent (`set/forward verifyIdentity`, `always set`, `implement identity verification`) | **0 occurrences** |
| Surviving `verifyIdentity` / `verify_identity` / `identity verification` mentions | **20**, every one read individually |

All 20 describe deprecation, legacy behaviour, or characterization. Nothing implements. The count alone
would not have established this — two greps in this milestone returned false results — so each hit was
read in context.

**`D12` as repaired** (`plan.md:109`): add a JSDoc `@deprecated` tag to the **existing**
`verify_identity` member in `src/types.ts`, mark it deprecated everywhere it is documented, state the
exact legacy behaviour for both branches, **"Do not change the translator"**, and pin both branches with
characterization tests. Its stated rationale is the correct one: *"Tightening either branch would break
connections that currently succeed."*

**Exact legacy behaviour, stated consistently** across `plan.md:66,:69`, `context-pack.md:61,:64`,
`drift.md:27,:35`, `research.md:132,:136`, `worklog.md:36-38`:

- no non-empty `caCerts` → `ssl` left unset → **plaintext, no TLS requested**
- non-empty `caCerts` → forwards **only** joined `ssl.ca`; mysql2 hostname **identity verification is
  not enabled**

**Deferral present** — `plan.md:216` item 7 and `worklog.md:69`: any TLS behaviour change, replacement
mode, or removal requires a separately scoped breaking change. **No new mode introduced.**

## PR #1711 — rewritten in place

Body reflects the deprecation (5 mentions), carries **no** implementation or `verifyIdentity` intent,
**no** closing keyword, and the seven-path envelope. Still draft, single PR — no second PR opened.

## FINDING — a defect in this topic's own brief, caught by the author

`supervisor.md` is **absent** from the leaf run dir. The harness requires it ("every run dir carries
`supervisor.md`"), and **this topic's brief omitted it** from the artifact allowlist, listing only
`research`/`plan`/`context-pack`/`worklog`/`drift`.

The author handled this exactly right: it did **not** silently create the file outside its allowlist,
and did **not** ignore the requirement. It recorded the variance in `drift.md:64-68` and surfaced it in
`context-pack.md:126-127` as "the explicit artifact allowlist omits mandatory `supervisor.md`; recorded
in `drift.md` and not overridden."

**Not repaired here.** The coordinator specified Tier-A on an **immutable** repaired plan head and a stop;
adding an artifact would move that head after the verdict. Returned as a one-artifact gap to close on
instruction — either the author adds it under an amended allowlist, or it is explicitly waived. The
defect is this topic's, not the author's.

## Prohibitions — held

No product mutation, no implementation, no runtime/Aspire/Docker/browser/`e2e:cli`, no PLAN-EVAL
dispatched, no extra path, `#1664` and `#1293` untouched, no other lane's artifacts modified.

## Outcome

**Tier-A PASS at `34a6e3d98`.** The TLS ruling is fully absorbed across all five artifacts and the PR
body; the false authorization claim is gone; the deprecation carries the exact legacy behaviour for both
branches with characterization rather than correction. One open item: the `supervisor.md` allowlist gap,
which is this topic's error.

**STOPPED before PLAN-EVAL.**

---

# Tier-A — #1112 `supervisor.md` control-plane correction at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`. **PASS**

| Field | Value |
| --- | --- |
| Plan head | `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` — local == remote == PR `headRefOid`, clean, **draft** |
| Base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b` |
| Commit | `069fd3e91 docs(harness): restore prisma mysql supervisor record` |
| Verdict | **PASS** |

## Scope — exactly one added path

Run dir now holds **six** harness artifacts. `git diff --name-only cf648f1ff HEAD` adds only
`.llm/runs/fix-prisma-mysql-honest-example--0.0.7/supervisor.md` to the previous five. **Zero**
`packages/`, **zero** `docs/`, **zero** `deno.lock`. The seven-path product envelope is unchanged, and
`supervisor.md` states in its own text that it is control-plane, not an eighth product path.

**Settled product scope was not rewritten.** `git diff --stat 34a6e3d98 HEAD` over the five originals
touches only `context-pack.md`, `drift.md`, `worklog.md` — the omission-resolution surface.
**`plan.md` and `research.md` are byte-unchanged**, so the TLS ruling and the seven-path plan carried
forward untouched.

## `supervisor.md` — verified against the supplied facts, field by field

Topic ownership (fixes, Opus 5 / high, Remote Control, session `ea346a9a-…`, branch), leaf identity
(#1112, PR #1711, branch, worktree, base `cf648f1ff`), author route (`01a047f1-…`, `openai`,
`gpt-5.6-sol`, high, `agentic:launch-codex-slice`, one-sender invariant), the seven paths with an
eighth declared a rescope, plan-only state with the stop line before PLAN-EVAL, the non-breaking TLS
ruling with both legacy branches stated exactly, and the source-only seam boundary — all correct.

Two things worth recording as done **well**, not merely done:

- **It refused to invent the one fact it was not given.** The Host row reads "Not supplied in the
  coordinator ruling; no host identity is inferred." A plausible fabricated hostname would have been
  undetectable later.
- **It did not launder the gate history.** Both Tier-A passes are recorded, and the first is described
  with its finding intact — that D12 once proposed setting `ssl.verifyIdentity: true` and that
  `research.md:130` claimed a coordinator authorization that never existed — followed by the plain
  sentence "The first pass was not clean." A record showing two clean passes would have been more
  comfortable and false.

The reverted `deno.lock` probe is also carried forward in its own section.

## Omission resolved, not erased

`drift.md:64-82` preserves the original entry verbatim (What / Source / Expected / Actual at discovery /
Severity / Initial action) and appends **Coordinator ruling**, **Resolution**, and **Current evidence**.
`context-pack.md:127-129` now reads "Resolved process variance", replacing "not overridden". The record
shows the omission happening and being closed, which is the point.

## Invariants re-checked at this head

`coordinator-authorized` → **0 occurrences**. Seven-path envelope intact.

A naive sweep for surviving runtime-change intent returned two hits, both inside `supervisor.md`, and
**both are correct in context**: `:90` is the historical Tier-A row recording what D12 *once* proposed,
and `:67` is the prohibition **"Do not set `ssl.verifyIdentity`"** — a negation matched by the pattern.
That is the **third** naive-pattern false positive this milestone; reading settled it, as it has every
time. The count is not the finding.

## Prohibitions — held

No product mutation, no implementation, no `deno.lock`, no runtime/Aspire/Docker/browser/`e2e:cli`, no
PLAN-EVAL dispatched, no other lane touched. PR #1711 remains **draft**, sole `status:plan`, milestone
`0.0.7`, no closing keyword.

## Outcome

**Tier-A PASS at `069fd3e91`.** The harness-mandatory supervisor record now exists and is truthful,
including the parts that are unflattering. The recorded omission — which originated in this topic's own
brief — is closed. No open findings.

**STOPPED before PLAN-EVAL.**

---

# PLAN-EVAL cycle 1 — terminal `FAIL_PLAN`; reconciliation

| Field | Value |
| --- | --- |
| Verdict | **CHANGES_REQUESTED / `FAIL_PLAN`**, cycle **1 of 2** |
| Evaluated leaf head | `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` — unchanged; the evaluator did not push over the leaf |
| Evaluator artifact head | `5b58738abfd38e859a331e5f5fa47ce968d7d9ef` (its own detached worktree) |
| Public comment | `5452181794` — `2026-08-28T11:53:14Z`, 5112 bytes |
| Evaluator | native Claude Fable 5 · medium, job `29284a3f`, session `29284a3f-3d87-4614-a616-13a7babbbdf0`, bridge `cse_01KHPgQNFFkjAYxeFbkRKfbW`, `bridgeOutboundOnly: false` |

## Transport history — both attempts recorded

**Attempt 1 interrupted, no verdict.** Raw `nohup claude` starts a session but never registers a
background job, so job id, bridge id, and Remote Control URL cannot exist on that route; the attachment
gate was unsatisfiable, not merely slow. Verified before stopping: no `plan-eval.md`, clean worktree,
**zero** PR comments. Stopped exactly PID `247931`, wrapper `247929`, and this topic's stale watcher.

**Attempt 2 attached and produced the verdict** via `claude --bg` (`claude-manager` SKILL:36), with
`providerEnv: {}`. Attachment claimed only on `bridgeOutboundOnly: false` **plus** non-empty bridge
**plus** matching cwd — never on the `--remote-control` flag alone, which is what made attempt 1 wrong.

Evaluator lease **released** after the terminal verdict (`claude stop 29284a3f`; `claude agents --json`
→ 0 remaining `#1711` evaluators), so no lease is held while cycle 2 is ungranted.

## Findings — all four judged well-founded

**F1 BLOCKING** — the example's `PrismaClient` import cannot type-check as planned. Proven, not
asserted: no generated client exists; `@prisma/client` is in root `deno.json` `"catalog"` only, never
`"imports"`, and the package `deno.json` has no `imports` — probe returned
`TS2307 … not a dependency and not in import map`, exit 1. Even if mapped, Prisma 7's ungenerated stub
types `PrismaClient` as `any`, so a green `deno check` through it would not be the semantic evidence
gate 1 claims. The plan's open-decision sweep marks this "Resolved: owned"; it is not.

The evaluator ran its probe in a scratch file placed beside the example, deleted it immediately, and
left the worktree clean — the right way to establish this.

**F2 ADVISORY** — the "exactly eight" census count under-counts its own 49-row table (`README.md:7`,
site `:100`/`:104` are dispositioned but excluded from the eight). Gate 13's hard-coded count is
satisfiable while leaving those untouched.

**F3 ADVISORY** — no PR phase-comment trail; `gh pr view 1711 --json comments` returned **0**.

**F4 ADVISORY** — gate 12 names `audit-jsr-package.ts` without its path
(`.llm/tools/fitness/audit-jsr-package.ts`).

## F3 is partly this topic's own defect, and is partly repaired

The missing trail is not solely the author's: **this topic never required phase comments on #1711 and
never posted its own Tier-A records.** Backfilled now as comment `5454328918`, covering all three Tier-A
passes with the first one's finding stated plainly rather than presented as clean. The author is asked
for the research and plan comments only; the Tier-A comments were supervisor-owned and were mine to
post.

## Owner policy amendment — recorded

Formal PLAN-EVAL is selected **only for genuinely critical, complex, or decision-heavy topics**.
Routine or mechanical leaves record **`PLAN-EVAL: N/A` plus Tier-A**.

**#1112 remains selected** for one final cycle: it coordinates published integration docs, an executable
generated-client import, adapter lifecycle, public option truth, and TLS compatibility. That is a
decision-heavy surface, not a mechanical one.

## Evaluator-failure policy — recorded for this lane

After **two consecutive IMPL-EVAL failures**: stop and release evaluator leases, and surface the owner
decision in the primary coordinator task. **No third loop, and no frozen author.** This lane holds one
PLAN-EVAL failure; the counter is at one.

## Dispatched

Repair delivered to the preserved canonical Codex author `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8` in
`/home/codex/repos/netscript-007-leaf-prisma-mysql` — **plan-artifact repair only, no product
implementation**, and no new author. It is required to run the cheapest exact probes to lock an honest
import strategy, preferring a real explicit generated-client path or scratch-only generation that
compile-checks the actual example without committing generated output; ambient declarations,
`@ts-ignore`, and the ungenerated `any` stub are all forbidden. If the seven paths cannot make it
executable honestly it must **STOP before rescope** and report the minimum exact additional path with
proof — never a silent eighth path. F1's six dependent locations must be amended together; F2/F3/F4
folded in.

**Next gate:** fresh Tier-A on the repaired plan head. **Cycle 2 is prepared but NOT launched** until
the coordinator grants it.

## Pre-established evidence boundary for the forthcoming Tier-A — instrument validated before use

The coordinator's boundary: do not accept a plan whose checks pass only while **untracked** generated
output sits in the worktree. `basic-usage.ts` is selected by the ordinary wrapper, so after scratch
cleanup its literal generated-client import must still resolve **in a clean exact-head checkout**, or
the plan must explicitly STOP with the minimum additional path(s).

This topic built and **validated the proof instrument in advance**, so the eventual verdict rests on an
executable test rather than on reading the plan.

**Method.** `git archive <exact head> | tar -x` into a scratch directory — tracked files only, no
untracked residue by construction — then run the ordinary structured wrapper there.

**Both directions proven** at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`:

| Scratch state | Result |
| --- | --- |
| Pristine, as checked in | `filesSelected: 12`, `failedBatches: 0`, `totalOccurrences: 0`, **exit 0** — green control |
| Same, with `import { PrismaClient } from './.generated/client.ts'` appended to `basic-usage.ts` | **exit 1**, `failedBatches: 1`, **`TS2307 Cannot find module`** |

The scratch example was restored immediately; the archive is disposable and the leaf worktree was never
touched.

**Two facts this settles, which were previously assumption:**

1. **`examples/basic-usage.ts` is genuinely selected** by the ordinary wrapper. A near-miss is recorded:
   `packages/prisma-adapter-mysql/deno.json` does carry `"exclude": ["examples/**", …]`, which looked
   like the example being excluded from checking — but that block lives under **`publish`**, and the
   file has **no top-level `exclude`**. It excludes examples from *publishing*, not *type-checking*.
   Reporting that as a contradiction of the coordinator's premise would have been wrong; checking the
   parent key settled it.
2. **A literal `./.generated/client.ts` import fails in a clean checkout** when the generated output is
   not committed — `TS2307`. So the plan cannot claim an executable example on that specifier while
   leaving generated output untracked.

**Verified at the current head:** the leaf worktree is clean including untracked files
(`git status --untracked-files=all` empty), no `.generated` directory exists anywhere under the package,
and no `.gitignore` entry hides one. The author cleaned its earlier scratch probe correctly.

**Application at the repaired head — no PASS without this:** re-run the archive-based check at the exact
pushed head. If `basic-usage.ts`'s literal import fails there, the plan must either name the minimum
additional path(s) with proof, or have explicitly STOPPED. **No silent eighth path, and no downgrading
the executable claim to make the gate green.** A green obtained only because untracked output survived
in the author's worktree is not a pass.

Author `01a047f1-…` remains `working` on the repair. Cycle 2 remains withheld.

---

# Tier-A — #1112 PLAN-EVAL cycle-1 repair at `3e0f2223ac7bed9068ecc033c92da7ffbed83711`. **FAIL**

| Field | Value |
| --- | --- |
| Repaired plan head | `3e0f2223ac7bed9068ecc033c92da7ffbed83711` — local == remote == PR, clean incl. untracked |
| Verdict | **FAIL** — F1 is relocated, not resolved |

## Scope — correct

Plan-only: six harness artifacts, **zero** `packages/`, **zero** `docs/`, **zero** `deno.lock`. Seven-path
envelope intact. F2, F3 (author half), and F4 are addressed. The failure is F1 alone.

## F1 — the executable-example claim does not survive scratch cleanup

**The plan's strategy (D3, gate 1):** the checked-in `examples/basic-usage.ts` imports exactly
`./.generated/client.ts`; gate 1 creates an uncommitted `.llm/tmp` schema/config, generates a real
Prisma 7 client into that location, checks the actual file with
`--deno-arg --config=.llm/tmp/prisma-example-check-deno.json`, then **removes the output before
handoff**.

**Proven at this exact head** — `git archive 3e0f2223a` into scratch (tracked files only, so untracked
residue is impossible), the planned literal import applied, no generated output present, then the
**ordinary** package-root wrapper:

```text
run-deno-check.ts --root packages/prisma-adapter-mysql --ext ts,tsx
filesSelected: 12 | failedBatches: 1 | occurrences: 1 | exit 1
TS2307 Cannot find module '…/packages/prisma-adapter-mysql/examples/.generated/client.ts'
```

The instrument was validated in both directions beforehand: the same pristine archive **without** the
import returns `failedBatches: 0`, `occurrences: 0`, exit 0. So the red is caused by the planned import,
not by the harness.

**Why the plan's own gates do not catch this:**

- **Gate 1** passes only inside the scratch window — a scratch `--config` plus a scratch-generated
  client, both deleted before handoff.
- **Gate 5 "Package check"** is scoped `--file packages/prisma-adapter-mysql/mod.ts`, so it **never
  selects the example**.
- Post-cleanup resolvability is addressed **nowhere**: a search across `plan.md`, `research.md`, and
  `drift.md` for *clean checkout*, *post-cleanup*, *TS2307*, *unresolvable*, or *`deno task check`*
  returns **zero** hits.

The consequence is a **permanent `TS2307` introduced into the repository** by the implementation: the
checked-in example would import a path that exists only during a scratch window. That is precisely the
boundary the coordinator drew — direct/root/package checks passing only while untracked generated output
remains.

The plan neither keeps the import resolvable in a clean checkout **nor** STOPs to report the minimum
additional path. It marks the open decision "Resolved: exact scratch-generated". It is not resolved.

## Minimum additional path — measured, not asserted; and neither is granted here

`packages/prisma-adapter-mysql/deno.json` is **not** among the seven paths (the ceiling lists paths 1–7;
`deno.json` is absent), so **every** candidate below is an eighth path requiring a coordinator ruling.

| Candidate | Result | Cost |
| --- | --- | --- |
| **A** — add top-level `"exclude": ["examples/**"]` to `packages/prisma-adapter-mysql/deno.json` | **exit 0**, `failedBatches: 0` — measured | Makes the ordinary gate green by **no longer type-checking the example at all**. That weakens the executable claim rather than supporting it, and is arguably the downgrade the coordinator forbade. |
| **B** — commit a generated client fixture | not measured | The plan's own Deferred item 3 |
| **C** — add an `imports` entry mapping the specifier | not measured | Also `deno.json`; PLAN-EVAL already showed the ungenerated `@prisma/client` stub types `PrismaClient` as `any`, so this risks a green that is not semantic evidence |

**No eighth path is granted by this review**, and candidate A is not recommended on its measurement
alone: passing by exclusion is not the same as passing by resolution.

## Outcome

**Tier-A FAIL at `3e0f2223a`.** Returned to the coordinator for a rescope ruling on the minimum
additional path, with the proof above. **Cycle 2 remains withheld** — it would be withheld on this
verdict regardless of the standing instruction.

No product mutation, no eighth path granted, no runtime, no lease, no other lane. Scratch archives
removed; the leaf worktree was never touched. PLAN-EVAL failure counter for this lane: **1**.

---

# Tier-A — #1112 dynamic-import repair at `da769cd7c8e0438f2317ed761ec10bce15692d03`. **PASS**

| Field | Value |
| --- | --- |
| Plan head | `da769cd7c8e0438f2317ed761ec10bce15692d03` — local == remote == PR #1711, clean incl. untracked |
| Commit | `da769cd7c docs(plan): repair prisma example import gates` |
| Verdict | **PASS** |

## Scope

`git diff --name-only cf648f1ff..HEAD` = **exactly six** paths, all under
`.llm/runs/fix-prisma-mysql-honest-example--0.0.7/`. Filtering that list for anything outside the run
dir returns **empty** — no product, generated, or temp diff. Seven-path envelope intact.

## Claims re-derived independently — all five

Every executable claim was re-run from a `git archive` of this exact head (tracked files only, so
untracked residue is impossible by construction), applying the plan's **prescribed** forms rather than
trusting its account.

**(1) Clean archive, ordinary root, all 12 files, green before generation and after cleanup**

| State | Result |
| --- | --- |
| Pristine archive, unmodified | `filesSelected: 12`, `failedBatches: 0`, `occurrences: 0`, exit 0 |
| Plus the plan's **module-scope** D3 dynamic import, **no** generated output | `12 / 0 / 0`, exit 0 |
| After `.generated` + all scratch removed, with D3 **and** D17 applied | `12 / 0 / 0`, exit 0 |

The example is **selected and checked** in all three — this is resolution, not exclusion. The earlier
deliberate-red control (literal specifier → `TS2307`, exit 1) is what proves the wrapper genuinely sees
that file.

**(2) Real Prisma 7.8.0 generated-client static compatibility wrapper**

`deno run -A --no-lock npm:prisma@7.8.0 generate` produced a real client (`client.ts`, `enums.ts`,
`internal/`, …) into `examples/.generated`, exit 0. Then the plan's exact scratch wrapper:

| Source state | Result |
| --- | --- |
| **Unmodified** | exit 1 — `TS2322 'PrismaMySqlAdapterFactory' is not assignable to 'SqlDriverAdapterFactory'` |
| With the planned **D17** one-line narrowing `columnTypes: SqlResultSet['columnTypes']` | **`filesSelected: 1`, `failedBatches: 0`, `occurrences: 0`, exit 0** |

So the plan's prospective claim is **true**, and it is true for the stated reason. `SqlResultSet` is
already imported at `adapter.ts:18`, so the correction needs no new import. Recorded precisely because
the wrapper does **not** pass at today's source — it passes only with D17, exactly as the plan says.

**(3) Import-only smoke, no MySQL**

`deno eval … await import(<example url>); console.log("dynamic-import-smoke:ok")` →
**`dynamic-import-smoke:ok`, exit 0**. Structurally safe: the example guards execution behind
`if (import.meta.main)`, so importing runs the generated-client dynamic import without invoking
`main()` or contacting MySQL.

**(4) Evidence split stated honestly** — `plan.md:62`, `:65` ("The root check does not type
`PrismaClient` or `prisma`"), `:158`, and gate 1's expected result, which says in full that it
"validates adapter construction and the stable query/`finally`/disconnect shell, but `PrismaClient` and
`prisma` are untyped because the dynamic import is non-literal." Untyped root-shell evidence and
specialized semantic evidence are not conflated anywhere.

**(5) Prohibitions retained** — D3 forbids ambient declarations, `// @ts-ignore`, the ungenerated
`@prisma/client` stub, **and excluding the example**; gate 1 adds "No exclusion is permitted"; the
eighth-path rescope line stands at `:26`.

## Version consistency

Catalog pins `^7.8.0`; the plan's scratch import map pins exact `7.8.0` and generation uses
`npm:prisma@7.8.0`. Consistent. PLAN-EVAL's earlier sighting of `7.9.1` was a second cached version, not
a discrepancy.

## Outcome

**Tier-A PASS at `da769cd7c`.** F1 is resolved by architecture rather than relocated: the clean root
check is genuinely green with the example checked, and the generated-client evidence is preserved in a
specialized gate with its scope stated honestly. No eighth path granted, no exclusion, no stub.

**PLAN-EVAL cycle 2 NOT launched** — it awaits an explicit coordinator grant. No implementation.
Scratch archives removed; the leaf worktree was never touched. Docker 0, no lease, no other lane.

---

# PLAN-EVAL cycle 2 — terminal `FAIL_PLAN`; reconciliation only

| Field | Value |
| --- | --- |
| Verdict | **CHANGES_REQUESTED / `FAIL_PLAN`**, cycle **2 of 2** |
| Evaluated plan head | `da769cd7c8e0438f2317ed761ec10bce15692d03` — unchanged; local == PR |
| Evaluator artifact | `60cf79ee54ca17dfaa7d62c609290993040539f9`, pushed to `refs/heads/eval/plan-eval-1711-cycle-2` |
| Public comment | `5454993523` — `2026-08-28T16:23:40Z`, 4881 bytes |
| Evaluator | Fable 5 · medium, job `18b66c8f`, session `18b66c8f-ebab-441e-9707-0d31a507dff8`, bridge `cse_01EQXNxAuAuhDuRKvGYBx5iY` — **released** |

The evaluator pushed its artifact to a real branch rather than leaving it in a detached worktree, so
unlike cycle 1's `5b58738ab` it cannot be orphaned.

## F1-b — verified independently, and it corrects this topic's own Tier-A PASS

**The finding:** on Deno 2.9.5 a **literal** dynamic import `await import('./.generated/client.ts')`
stays green with the client absent **and** restores static typing when it exists. The non-literal URL
form therefore makes the shipped example `any` for no benefit, leaving only a copied scratch wrapper
typed.

Re-derived here from a `git archive` of the exact head, on `deno 2.9.5`:

| Test | Result |
| --- | --- |
| Literal dynamic import, generated output **absent**, ordinary root wrapper | `filesSelected: 12`, `failedBatches: 0`, `occurrences: 0`, **exit 0** |
| Same, client **present**, deliberate misuse probe under the scratch config | **`TS2322 — Type 'PrismaClient<never, GlobalOmitConfig \| undefined, DefaultArgs>' is not assignable to type 'number'`** |

That second line is the real generated type, not `any`. Under the non-literal URL form the same probe
passes silently. **Both halves of F1-b hold.**

**This is a defect in my own review.** My Tier-A PASS at `da769cd7c` verified that the non-literal form
*worked* against the coordinator's clean-checkout boundary. It never asked whether the non-literal form
was *necessary* — whether a strictly better option existed inside the same constraints. It did. I tested
the proposal rather than the design space, and a cheaper, more honest architecture was one probe away.
The evaluator asked the better question.

Recorded as a by-product: with generated output present, the **ordinary root wrapper goes red for
unrelated reasons** — 51 `TS9010`/`TS9027` `isolatedDeclarations` diagnostics from the generated client
itself. That is why gate 5 needs its scratch config, and it is the state advisory **A2** concerns.

## Required bounded path if the owner accepts — recorded, not executed

Literal dynamic import; gate 5 types the **actual example** with the scratch config and client present;
preserve gate-1's untyped wording and note that gate 5 types the example; bind the connected-adapter
risk row to that example check. **No new product path.**

Advisories: **A1** import-map wording, **A2** gate-1 behaviour during the generated window, **A3** pin
the `import.meta.main` smoke guard.

**Not executed.** This is reconciliation only — no repair, no cycle 3, no implementation.

## State

Evaluator **released**; `claude agents --json` shows **0** active `#1711`/`#1112` sessions. Canonical
author `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8` **kept available and not resumed**; the leaf head is
unchanged at `da769cd7c`. Docker **0**, no runtime lease, no other lane touched.

PLAN-EVAL cycle count for this leaf: **2 of 2 — exhausted**. Awaiting the owner decision on the bounded
path above.
