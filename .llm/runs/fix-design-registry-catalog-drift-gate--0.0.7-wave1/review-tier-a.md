# Tier-A substantive review — design-registry-catalog-drift-gate (#1358 / PR #1657)

Reviewer: `topic-fixes-0.0.7`, native Claude Opus 5 / high, session
`c7597d28-6774-44c9-aa00-b8b40b776165`, Remote Control
`https://claude.ai/code/session_014pCd2QWkCscgZpVdjcUPST`. Separate from the Codex implementation
lane (`gpt-5.6-sol` / medium, thread `01a003f0-7821-7a10-a555-e619a9280479`).

Reviewed head: `c792327c99a54eb64f236d1676ee3a7c1d76efc2` (evidence head).
Product head: `4a3c40321ac1e58aa337e02afeaa95fbc553ce7f`. Base: `da574111af05a5cded74250128b196fcab870274`.

## Verdict

**CHANGES_REQUESTED** — one blocking finding (T-3). The implementation itself is correct and
well-evidenced; the gap is in the gate's CI coverage, which is the half of #1358 that makes the fix
durable.

This verdict does not authorize a ready flip, merge, publication, relabeling, or issue closure.
IMPL-EVAL is not launched.

## What is verified correct

### Catalog semantics — independently recomputed, not read from the test

I parsed the generated template and the authoritative `freshUiRegistryManifest` myself:

| Property | Result |
| --- | --- |
| Manifest items | **66** |
| Template `registryCatalog` entries | **66** |
| `registryMeta.total` | **66** — agrees with both |
| Set difference (manifest → template) | **none missing** |
| Set difference (template → manifest) | **none extra** |
| Duplicates in template | **none** |
| **Ordered** name equality | **true** across all 66 |
| `kind` / `layer` / `description` fidelity | **0 mismatches** |

The previously-invisible AI collection is present: `citation-chip`, `model-selector`,
`tool-call-card`, `prompt-input`, `message`, `markdown`, `chat-render`, `mcp-ui-widget`,
`render-ui`, `command-palette`, `search`, `chart-block`, `donut`, `avatar`, `code-block`, `dropzone`.

### Collections and metadata

All 8 collections (`foundation`, `ai`, `forms-core`, `surface-core`, `feedback-core`,
`layout-foundations`, `dashboard-blocks`, `desktop`) are present, **ordered-equal by name**, and
**ordered-equal by membership** (46/15/10/5/8/1/13/7 — each matching the manifest exactly).

### The gate is a real drift gate, not a count assertion

`assertCatalogMatchesManifest` reports *what* diverged — `manifest-only items:`,
`catalog-only items:`, `changed items:`, `changed collections:`, `changed registryMeta fields:` —
and the fixtures assert those messages by name:

- **manifest-only** fixture (`fixture-manifest-only`) → `assertThrows` on the named item **plus**
  `changed registryMeta fields: total`.
- **catalog-only** fixture (removes `render-ui`) → `assertThrows` on the named item **plus**
  `changed collections: ai` **plus** `changed registryMeta fields: total`.
- **field/metadata** fixture (`button` layer 3, `forms-core` membership, `version`) → asserts
  `changed items: button`, `changed collections: forms-core`, `changed registryMeta fields: version`.

Symmetric in both directions, field-level, and offender-naming. This satisfies the substance of the
issue's drift-gate requirement.

### Gate evidence re-executed by this reviewer

| Gate | Result |
| --- | --- |
| Drift test (structured wrapper) | `exitCode 0`, **5 passed / 0 failed** |
| `deno task quality:scan` | `ok: true`, **0 findings**, 7 allowances all pre-existing |
| `deno task arch:check` | raw exit **0** |

The author's remaining non-browser evidence is present and consistent: CLI + Fresh-UI structured
check, Fresh-UI package tests 172/0, focused lint and fmt, CLI JSR audit, CLI and Fresh-UI publish
dry-run. The author also recorded its own failed command-selection iterations transparently rather
than presenting only the green ones.

### Leased browser gate — receipt and ancestry

`receipts/fresh-browser.json`: `outcome PASS`, `exitCode 0`, `argv ['deno','task','test:browser']`,
`cwd .../packages/fresh`, `attempt 1`, `durationMs 33292`, child verdict 2 passed / 0 failed.
**`gitHead` == `actualGitHead` == `4a3c40321…`**, and `run-gate.ts` resolves `HEAD` itself and fails
closed on mismatch, so the head binding is real rather than self-declared.

Ancestry verified: `git merge-base --is-ancestor 4a3c40321 c792327c9` → **true**, and base
`da574111a` is an ancestor of `HEAD`. The evidence commit adds only run artifacts on top of the
gated product head.

### Scope, lock, and resource hygiene

Product delta is **2 of the 4** authorized surfaces — narrower than the contract, never wider.
`deno.lock`, the CLI lock, and the Fresh-UI lock are all unchanged. Evidence commit `c792327c9`
touches only `.llm/runs/**`. Post-gate: **0** chromium/playwright processes against a deliberately
captured **0** baseline, `aspire ps` no AppHost, `docker ps -a` empty, only default networks, no
volumes. No Playwright install was required. `review-threads` **PASS**, threads=0 unanswered=0.

## T-3 — BLOCKING: the drift gate does not run on CLI-side edits

Issue #1358 carries this **close-gated** acceptance box (`gate:` prefix, therefore enforced by
`check-close-gate.ts`, and the PR body carries `Closes #1358`):

> `gate:` the drift gate runs in CI on every change to `packages/fresh-ui/registry.manifest.ts`
> **or the CLI design assets**.

Only the first half holds. Traced end to end:

1. `packages/fresh-ui/tests/registry-doc-drift.test.ts` runs **only** through
   `.github/workflows/fresh-ui-quality.yml`. `.github/workflows/ci.yml` contains **no** reference to
   `fresh-ui` at all.
2. `fresh-ui-quality.yml`'s `paths:` filters (both `pull_request` and `push`) list
   `packages/fresh-ui/**` plus a handful of tool/config paths. They do **not** include
   `packages/cli/src/kernel/assets/app/routes/(design)/**`.
3. The classifier agrees: `ci-classify-changes.ts` sets `freshUi: path.startsWith('packages/fresh-ui/')`.
   A CLI design-asset path yields `desktop`/`surface`, **not** `freshUi`.
4. The root `deno task test` cannot cover it either — `packages/fresh-ui` is **not** a member of the
   root workspace (it carries its own lock, which is why the author had to run it with
   `--lock=packages/fresh-ui/deno.lock --frozen`).

**Consequence.** A future PR that edits only the generated catalog template re-introduces exactly
the 50-of-66 drift this issue exists to eliminate, with **no CI signal**. The blind spot sits on the
precise surface that drifted in the first place, so the gate does not yet close the loop it was
written to close.

This PR itself does touch `packages/fresh-ui/`, so `fresh-ui-quality` runs here and the gate is
green now. The gap is about every subsequent CLI-only edit.

**Secondary consequence.** Because the box is close-gated and the PR body carries `Closes #1358`,
CI's close-gate will independently fail this PR at ready-flip. Left as-is, it surfaces as a red gate
rather than as a considered decision.

### Required action — and why it needs the coordinator

The fix is small: add the CLI design-asset paths to `fresh-ui-quality.yml`'s two `paths:` filters,
and mirror it in `ci-classify-changes.ts` so `freshUi` is set for those paths (with its
`ci-classify-changes.test.ts` case).

**Those files are outside this leaf's frozen 4-file contract surface**, so the implementer must not
touch them unilaterally — the same boundary discipline both Wave 0 leaves observed. This therefore
needs a coordinator contract amendment naming `.github/workflows/fresh-ui-quality.yml`,
`.github/scripts/ci-classify-changes.ts`, and `.github/scripts/ci-classify-changes.test.ts`.

Alternative dispositions, both coordinator-owned: re-scope the acceptance box to the manifest side
only and record why, or drop `Closes #1358` to a plain reference and file the CI-coverage half as a
follow-up issue.

## Non-blocking observations

- **N1 — "derived from the manifest" is enforced, not computed.** The acceptance box asks that
  `registryMeta.total` and `registryMeta.version` be "derived from the manifest". They are literal
  values (`66`, `'0.1.0'`) in a static template asset, not computed at generation time. They match
  today, and the drift gate fails on any divergence (`changed registryMeta fields: total|version`),
  so the intent is met by enforcement. Worth stating plainly rather than reading the box as
  describing a computation that does not exist.
- **N2 — PR Definition of Done is stale.** The `fresh-browser` box is still unchecked although the
  leased gate returned PASS with a committed receipt. The Tier-A/IMPL-EVAL box is correctly still
  open.

## Standing stops

1. IMPL-EVAL is **not** launched and is not authorized by this review.
2. Ready flip, merge, publication, relabeling, and issue closure remain coordinator-only.
3. The expensive-gate lease is consumed; no further browser or runtime pass is authorized.
4. PR #1657 remains `OPEN`, draft, `MERGEABLE`, exactly one `status:impl`.

---

# Tier-A RE-REVIEW after the T-3 contract-amendment repair

Reviewed head: `a093314973b2039183ee408ef7501cd9e08ea0aa`. Repair base: `c5e06661b` (amendment
record). Same reviewer/session as above; same separation from the Codex author thread.

## Verdict

**PASS_TO_IMPL_EVAL.** T-3, N1 and N2 are all resolved. One new non-blocking residual (R-1) is
recorded for the coordinator. This authorizes nothing further — IMPL-EVAL, ready flip, merge,
publication, relabeling and issue closure all remain coordinator-only.

## T-3 — RESOLVED

The repair touched exactly the three amended files plus two run artifacts; nothing else.

**The classifier half is proven by execution, not by reading its tests.** I imported `classifyPath`
and ran it directly:

| Case | Path | `freshUi` |
| --- | --- | --- |
| POSITIVE | `…/assets/app/routes/(design)/design/(_shared)/registry.ts.template` | **true** |
| POSITIVE | `…/assets/app/routes/(design)/design/components/index.tsx.template` | **true** |
| REGRESSION | `packages/fresh-ui/registry.manifest.ts` | **true** (unbroken) |
| NEGATIVE | `packages/cli/src/kernel/adapters/database/scaffolder.ts` | false |
| NEGATIVE | `packages/cli/bin/netscript.ts` | false |
| NEGATIVE | `packages/cli/src/kernel/assets/database/seed.ts.template` | false |
| NEGATIVE | `packages/service/src/mod.ts` | false |

The third negative matters most: it is another path under `packages/cli/src/kernel/assets/` that is
**not** under `(design)`, and it stays false. Ownership was scoped by the design-asset prefix
`packages/cli/src/kernel/assets/app/routes/(design)/`, so unrelated CLI diffs were not broadened —
which was the explicit constraint on this repair.

**The workflow half** carries `packages/cli/src/kernel/assets/app/routes/(design)/**` in **both**
the `pull_request` and `push` `paths:` filters (occurrence count 2; the YAML parses with 11 paths on
each trigger and the design path present in both).

Tests re-executed by this reviewer: `ci-classify-changes.test.ts` **62 passed / 0 failed**;
`registry-doc-drift.test.ts` **5 passed / 0 failed**. The added cases are named
`POSITIVE: CLI design assets request the Fresh UI gate` (asserts `needsFreshUi === true`) and
`NEGATIVE: unrelated CLI changes do not request the Fresh UI gate` (asserts `needsFreshUi === false`).

`deno task quality:scan` → `ok: true`, 0 findings. `deno task arch:check` → raw exit 0.

## Preservation — verified

- **The four original product files are byte-identical** to the gated product head:
  `git diff --stat 4a3c40321..HEAD -- packages/` is **empty**. The consumed `fresh-browser` lease's
  `PASS` receipt at `4a3c40321` therefore remains valid; the repair could not have invalidated it.
- `deno.lock`, the CLI lock and the Fresh-UI lock: unchanged.
- `review-tier-a.md` (pre-existing section), `receipts/fresh-browser.json` and `drift.md`: unchanged
  by the repair commit.
- `Closes #1358` intact; PR `OPEN`, draft, exactly one `status:impl`.
- No expensive gate ran: `docker ps -a` empty, no chromium/playwright survivors.

## N1 — RESOLVED

`worklog.md` now records: "`registryMeta.total` and `registryMeta.version` remain static template
literals; their equality with the manifest is enforced by the semantic drift gate rather than
computed during generation." That is accurate and prevents a reviewer from reading the issue's
"derived from" wording as describing a computation that does not exist.

## N2 — RESOLVED

The PR Definition-of-Done `fresh-browser` box is now checked and cites
`receipts/fresh-browser.json`. The only remaining unchecked box is Tier-A / IMPL-EVAL, which is
correct at this point in the lifecycle.

## R-1 — new, non-blocking residual for the coordinator

**The parenthesized path glob has no precedent in this repository and no empirical run yet.**
`packages/cli/src/kernel/assets/app/routes/(design)/**` is the **first** use of `(` in any workflow
`paths:` filter here — the only two occurrences in `.github/` are the two lines this repair added.

This matters because the `paths:` filter is the **outer** gate: `fresh-ui-quality.yml` is a separate
workflow, so if its filter fails to match, the workflow never starts and the classifier inside it
never runs. The classifier being provably correct does not rescue a non-matching filter.

Assessment: GitHub's filter-pattern syntax treats `*`, `**`, `?`, `+`, `!`, `[]` and `\` as special
and parentheses as literal characters, so the pattern should match. But it is unproven here —
`fresh-ui-quality` currently reports `skipping` on this draft, so there is no run to point at.

Not blocking: the documented semantics support it, and this PR touches `packages/fresh-ui/**`
regardless, so the gate runs for this change either way. It becomes empirically provable at the
ready flip, when `fresh-ui-quality` executes for real. **Recommended:** at ready flip, confirm the
workflow actually triggers, and if it does not, the filter needs an escaped or restructured pattern.
Recorded so a later reader does not assume the glob was verified against GitHub.

## Standing stops

1. **IMPL-EVAL is not launched** and is not authorized by this review.
2. Ready flip, merge, publication, relabeling and issue closure remain coordinator-only.
3. The expensive-gate lease is consumed; no further browser or runtime pass is authorized.
4. No next leaf has been started.

---

# CORRECTION — this Tier-A PASS was wrong on the central question

IMPL-EVAL cycle 1 (`a46b83831`, evaluated head `939e73113`) returned **`FAIL_FIX`** on finding
**E-1**, which this Tier-A review missed. The correction is recorded here rather than by editing the
sections above, so the error stays visible.

## What I got wrong

I verified template↔manifest semantics exhaustively — 66/66, ordered equality, field fidelity,
collection membership, symmetric negative fixtures — and concluded the catalog was correct. **I never
asked whether the template is what ships.** It is not.

Verified myself after the verdict:

| Check | Result |
| --- | --- |
| `git diff --name-only da574111a..HEAD -- …/assets/embedded.generated.ts` | **empty — never regenerated** |
| `grep 'total: 5[0-9]' embedded.generated.ts` | **`total: 50`** |
| `grep -c 'citation-chip' embedded.generated.ts` | **0** — the AI collection is absent from the shipped barrel |
| `deno task check:assets-barrel` | **raw exit 1** — barrel stale |

`TemplateRegistry`'s only content source is `EMBEDDED_TEMPLATE_CONTENT` from
`embedded.generated.ts`, with a no-op `hydrate()` and no disk fallback, and that registry is what
`netscript init` uses. So a project scaffolded from this branch still renders "All **50** items" and
still hides the entire AI collection. The user-visible defect #1358 exists to fix is **unfixed on
the consumer path**; only its source template was corrected.

## Why the miss is not excusable by the contract

The contract's `provingGates` list (`check`, `test`, `publish-dry-run`, `fresh-browser`) does not
name `assets-barrel`, and no lane ran it — that is the evaluator's **E-2**. But this is a known
repo-wide pattern, not an obscure one: the sibling scaffold leaf (#1654) regenerated
`embedded.generated.ts` in **every** slice that touched an asset template, and this reviewer
explicitly recorded that fact in that leaf's Tier-A. Here the file's **absence** from a two-file
product diff should have been the first thing checked, precisely because a template edit without a
barrel regen is the exact shape of a fix that passes every test and ships nothing.

Reviewing generated-asset changes without asking "does the generated artifact carry this?" is the
gap. The verification list for any future CLI asset-template slice must include the barrel diff and
`check:assets-barrel`.

## Corrected verdict

The Tier-A `PASS_TO_IMPL_EVAL` above is **withdrawn**. The correct Tier-A verdict at head
`939e73113` is **CHANGES_REQUESTED**, subsumed by the formal IMPL-EVAL `FAIL_FIX`.

The T-3/N1/N2 findings and the R-1 residual in the sections above remain accurate and are unaffected
— the classifier and workflow-ownership analysis stands, and the evaluator independently reached the
same conclusion on those. What was missed is orthogonal to them.

## Required repair (coordinator-owned)

`deno task gen:assets-barrel` and commit the single regenerated `embedded.generated.ts`, then re-run
`check:assets-barrel` and record the raw exit code. **`embedded.generated.ts` is outside the current
contract surface**, so this needs a further coordinator amendment — the same boundary that produced
the T-3 amendment. `assets-barrel` should also be added to the leaf's proving-gate set (E-2).

---

## Fresh Tier-A Review — E-1 Repair Delta — 2026-08-15

**Verdict: `PASS_TO_IMPL_EVAL`** — bounded to the E-1 repair delta. Authorizes nothing beyond the
next formal gate; ready-flip, merge, and issue closure remain coordinator-only.

### Reviewer identity and route

| Field | Value |
| --- | --- |
| Role | Fresh opposite-family Tier-A reviewer (launched by `topic-fixes-0.0.7`) |
| Requested route | Claude / Anthropic, Opus 5, high effort (opposite-family to Codex author `01a003f0-7821-7a10-a555-e619a9280479`, `gpt-5.6-sol`) |
| Observed route | `claude-opus-5` (Anthropic native), background CLI session, v2.1.233 |
| Session id | `f7b48b24-96b6-4e62-b1c6-37d6a9ac45e9` |
| Bridge id | `session_011pmnHd9xRTLDJFJuNL3kEw` (from `~/.claude/sessions/266646.json`) |
| PID | `266646` |
| Job id | `f7b48b24` |
| cwd | `/home/codex/repos/netscript-007-leaf-design-registry-drift` |

No prior conclusion was inherited. Every claim below was re-derived by executed command.

### Head resolution

| Source | Value |
| --- | --- |
| Local `HEAD` | `acfb2d2064c057c6d805a2d36fcb09201ca247e5` |
| `git ls-remote origin refs/heads/fix/design-registry-catalog-drift-gate` | `acfb2d2064c057c6d805a2d36fcb09201ca247e5` |
| PR #1657 `headRefOid` | `acfb2d2064c057c6d805a2d36fcb09201ca247e5` |

Three-way match. PR state `OPEN`, `draft: true`, labels `type:fix, area:cli, area:fresh-ui,
gate:jsr, priority:p1, status:impl` — exactly one `status:` label. Body line 10 still reads
`- Closes #1358`, unmodified.

### Q1 — The repair delta

**Claim: the repair commit changes exactly one product file, by exactly the deterministic generator
output. VERIFIED.**

`git show --stat 4ca76fa75` → 4 files: three append-only run artifacts (`context-pack.md`,
`plan.md`, `worklog.md`) plus one product file,
`packages/cli/src/kernel/assets/embedded.generated.ts` at `2 +-`. `git diff --numstat da574111..acfb2d206 -- '*generated*'` → a single row, `1 1
packages/cli/src/kernel/assets/embedded.generated.ts`: one insertion, one deletion, on the
`template_005` generated source line. Content moves `total: 50` → `total: 66`;
`citation-chip` occurrences go 0 → 1; `registryCollections` occurrences go 0 → 1.

No other generated target moved. Verified per-path across the full leaf range
`da574111..acfb2d206`:

| Generated target | State |
| --- | --- |
| `packages/cli/src/kernel/assets/embedded.generated.ts` | CHANGED (the amended path) |
| `packages/cli/src/kernel/assets/skills.generated.ts` | unchanged |
| `packages/cli/src/kernel/assets/agent-tools.generated.ts` | unchanged |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts` | unchanged |
| `packages/plugin/src/kernel/assets/embedded.generated.ts` | unchanged |
| `packages/fresh-ui/registry.generated.ts` | unchanged |
| `packages/service/src/primitives/scalar.generated.ts` | unchanged |

**Regenerated, not hand-edited — proven, not asserted.** I ran the generator half myself
(`deno task check:assets-barrel`, whose first half is `gen:assets-barrel`) in a clean tree at the
review head: raw exit `0`, and `git status --porcelain` was empty both before and after. Running the
deterministic generator reproduces the committed bytes exactly; a hand edit could not survive that.
Independently, I decoded the barrel's design-catalog value and compared it byte-for-byte to the
authored template on disk — `disk === embedded`, both `15404` bytes.

`deno.lock`, `deno.json`, and the per-package locks are unchanged across `da574111..acfb2d206`.

### Q2 — The scope amendment

**Claim: nothing outside the amended surface changed, and the four original product files are
byte-unchanged. VERIFIED.**

Full non-run-artifact diff over `da574111..acfb2d206` is exactly six paths:

```
.github/scripts/ci-classify-changes.test.ts        (T-3 amendment)
.github/scripts/ci-classify-changes.ts             (T-3 amendment)
.github/workflows/fresh-ui-quality.yml             (T-3 amendment)
packages/cli/src/kernel/assets/app/routes/(design)/design/(_shared)/registry.ts.template
packages/cli/src/kernel/assets/embedded.generated.ts   (E-1 amendment)
packages/fresh-ui/tests/registry-doc-drift.test.ts
```

That is the original contract surface + the three T-3 CI files + the one E-1 generated path, and
nothing else. Sharper still: `git diff --name-only 939e73113..acfb2d206 -- packages plugins .github`
(from the T-3 Tier-A PASS head forward) returns a **single** path — the barrel. So the four original
product files and all three T-3 CI files are byte-unchanged since the last reviewed product head,
which is exactly what the `drift.md` E-1 amendment declares.

### Q3 — E-1 closure

**Claim: the fix now reaches the artifact the CLI ships. VERIFIED, by decoding the committed barrel
rather than trusting `total: 66`.**

Read path re-derived at `packages/cli/src/kernel/application/registries/template-registry.ts`:
the constructor's only content source is `EMBEDDED_TEMPLATE_CONTENT` (line 18, imported line 3);
`read()` resolves from the in-memory map (lines 41-47); `hydrate()` is `return Promise.resolve()`
(lines 49-52); there is no `Deno.readTextFile`, no disk fallback, and `write()` rejects. A repo-wide
grep confirms the only non-test consumer of `EMBEDDED_TEMPLATE_CONTENT` is that file. The key
`app/routes/(design)/design/(_shared)/registry.ts.template` is present in
`packages/cli/src/kernel/assets/manifest.ts:10` as `appRoutesDesignSharedRegistry`, so it is actually
registered and scaffolded.

I then imported the **committed** barrel and parsed its design-catalog value directly:

| Property decoded from the barrel | Observed |
| --- | --- |
| `EMBEDDED_TEMPLATE_CONTENT` entry count | 103 |
| Design-catalog value length | 15404 bytes, byte-identical to the on-disk template |
| `registryMeta` object entries | **66** (counted structurally, not read off `total:`) |
| `registryMeta.total` declaration | `66` |
| `registryCollections` export | present, **8** collections |
| Collection names | `foundation, ai, forms-core, surface-core, feedback-core, layout-foundations, dashboard-blocks, desktop` |
| `ai` collection membership | 15 items incl. `citation-chip`, `model-selector`, `tool-call-card`, `prompt-input`, `mcp-ui-widget`, `render-ui` |

The AI collection is present in the shipped artifact, not only in the template. E-1's user-visible
defect — `netscript init` scaffolding a gallery that reads "All 50 items" with the AI collection
hidden — is closed on the consumer path.

Supporting cheap gates I executed at the review head:

| Command | Raw exit |
| --- | ---: |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/assets --ext ts` | 0 (7 files, 0 findings) |
| `deno test --allow-all --unstable-kv packages/cli/.../template-registry_test.ts packages/cli/.../template-asset_test.ts` | 0 (6 passed) |
| `deno test --allow-all --unstable-kv packages/fresh-ui/tests/registry-doc-drift.test.ts` | 0 (5 passed) |

### Q4 — E-2 closure and gate bindings

**Claim: `check:assets-barrel` is bound into the leaf's validation plan and a structured receipt with
a raw exit code exists. VERIFIED, with one recorded observation.**

- Binding: `plan.md:172` (S4 row of the appended "E-1 Bounded Repair Amendment" table) names
  `deno task check:assets-barrel` as a bound proving gate, and `plan.md:176` states it is now a
  required leaf gate.
- Receipt: `receipts/assets-barrel.json` exists — `gateId: assets-barrel`,
  `invocationId: assets-barrel-1657-e1`, `outcome: PASS`, `exitCode: 0`, `attempt: 1`,
  `schemaVersion: 1`, `durationMs: 541`, empty stdout (correct for a silent
  `git diff --exit-code`), stderr containing only the two task banners.

**Independently re-executed at the review head:**

```
deno task check:assets-barrel   → RAW EXIT 0
```

`git status --porcelain` was empty immediately afterwards. The command's mutating first half caused
no residual modification because the committed barrel is already the generator's fixed point, so no
restoration was required and the worktree is left clean.

### Q5 — The inherited-browser-head argument

**The inherited receipt legitimately still covers this head. Stated plainly: yes.**

Three independent legs, each executed:

1. **The leased product surface is byte-identical.** `git diff --name-only 4a3c40321..acfb2d206 --
   packages plugins .github` returns four paths: the three T-3 CI files and the CLI barrel. The
   browser-gated template `registry.ts.template` is **not** among them — it has not moved since the
   lease was consumed.
2. **The barrel is a representation, not an independent surface.** I proved this by equality, not by
   architecture argument: the barrel's design-catalog value is byte-for-byte the on-disk template
   (`15404 === 15404`, strict equality true), and `gen:assets-barrel` reproduces it deterministically
   from that template. It carries no content the browser gate could observe that the template does
   not already carry.
3. **The consumed lease does not exercise this surface at all.** `receipts/fresh-browser.json`
   records `deno task test:browser` in `cwd packages/fresh`, running
   `tests/form-navigation_browser.ts` — 2 tests, both `ok`, `exitCode 0` at `gitHead 4a3c40321`. That
   suite is Fresh form-navigation; it has no dependency on the CLI asset barrel or the design
   registry template. So the repair cannot have invalidated it even in principle.

A `fresh-browser` rerun is not required at this head. No browser, Aspire, Docker, scaffold-runtime,
or `e2e:cli` gate was run or requested by this review. `docker ps -a` reported zero containers before
and after.

### Findings

No blocking findings. Three non-blocking observations, each checkable:

- **O-1 (informational).** `receipts/assets-barrel.json` records `gitHead` /`actualGitHead` =
  `4ca76fa75` (the product commit), not the review head `acfb2d206`. This is not a stale receipt:
  `acfb2d206` touches only `.llm/runs/**`, so the product tree is byte-identical between the two
  heads, and I re-executed the gate at `acfb2d206` myself (raw exit 0). Recording it so a later
  reader does not mistake the head delta for drift.
- **O-2 (bookkeeping).** The E-2 binding lives in the appended amendment table (`plan.md:172`), not
  in the original nine-row Validation Plan table at `plan.md:137`, which still has no
  `assets-barrel` row. Appending is the correct behaviour under the run's immutability rule, so this
  is not a defect — but a reader consulting only the original table would still not see the gate.
- **O-3 (pre-existing repo config).**
  `run-deno-fmt.ts --root packages/cli/src/kernel/assets --ext ts` reports `findings: 0` but
  `failedBatches: 1` with "excluded by Deno; refusing a false-green gate", because the root `fmt`
  config excludes `packages/cli`. This is pre-existing repository configuration, not introduced by
  this delta; the author recorded the same behaviour and obtained a `0` verdict via an equivalent
  temporary config. No formatting change is owed by this delta.

### Verdict

**`PASS_TO_IMPL_EVAL`.** The repair delta is exactly one generated product file, is the
deterministic generator output (proven by reproducing it), stays inside the amended surface, leaves
the four original product files and three T-3 CI files byte-unchanged, closes E-1 on the artifact the
CLI actually ships (verified by decoding the barrel to 66 items with the AI collection and
`registryCollections`), closes E-2 with a bound gate plus a structured receipt and an independently
re-executed raw exit `0`, and correctly inherits the `fresh-browser` lease. Worktree left clean; no
source was modified by this review.
