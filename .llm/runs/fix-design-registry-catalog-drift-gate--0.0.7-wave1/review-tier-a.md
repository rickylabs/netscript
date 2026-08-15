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
