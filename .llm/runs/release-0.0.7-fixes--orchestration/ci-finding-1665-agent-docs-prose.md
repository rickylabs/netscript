# Post-eval CI finding + scope amendment — PR #1665

| Field | Value |
| --- | --- |
| Raised | 2026-08-15, after IMPL-EVAL PASS |
| PR head at detection | `0fed4d7ffb8c655a00846fbf545805bd2e184fb0` |
| CI run / job | `31892668157` / quality `95031217843` |
| Failing gate | `check:agent-docs-prose` |
| Classification | **branch-caused**, not baseline and not infrastructure |
| Authority | coordinator amendment; recorded **before** any generated-output mutation |

## The finding

`deno task check:agent-docs-prose` fails with
`Agent docs prose is stale: prose.json.gz, provenance.json`.

Reproduced locally at `0fed4d7ff` by this orchestrator, not taken from the CI summary:

```text
{"fresh":false,"stalePaths":["prose.json.gz","provenance.json"],
 "provenance":{"schemaVersion":1,"version":"0.0.6","sourceCommit":"504de3f67",
 "extractionTimestamp":"2026-08-15T08:52:56.248Z", ... }}
error: Uncaught (in promise) Error: Agent docs prose is stale: prose.json.gz, provenance.json
  at .llm/tools/docs/build-agent-docs-bundle.ts:358:15
```

The bundle's own file manifest includes `pages/web-layer/query-bridge/index.md`. That is the direct
causal link: S3's authorized edit to `docs/site/web-layer/query-bridge.md` changes a source page that
feeds the agent-docs bundle, so the checked-in generated assets under `.llm/assets/agent-docs/` no
longer match their source. Lint and TypeScript fmt passed; this is the only branch-caused blocker.

## Why this survived three Tier-A reviews and IMPL-EVAL — supervisory accountability

This is my miss, and it is a repeat of a class this topic has already been burned by.

At S3 Tier-A I asked whether a **formatter** could disturb the docs block and proved it could not
(root `fmt` covers only `packages/**` and `plugins/**` TS; `docs/site` excludes `**/*.md`). I never
asked the adjacent and more important question: **is this source file an input to a generated,
checked-in artifact?** It is.

That is the same defect class as E-1 on #1657, where I verified template↔manifest semantics
exhaustively and never asked whether the template was what actually shipped — the answer there was
`embedded.generated.ts`, and the gate that caught it was `check:assets-barrel`. Here the answer is
`.llm/assets/agent-docs/`, and the gate is `check:agent-docs-prose`. Both times the reviewed edit was
correct and the *generated mirror* was stale.

**Rule, generalized from two occurrences:** when a slice edits any file that a `gen:*` task consumes,
the matching `check:*` freshness gate is part of that slice's proving set. Editing a source without
regenerating its mirror is a defect even when every gate scoped to the edited package is green. The
scope grant naming `docs/site/web-layer/query-bridge.md` implicitly carried its generated mirror; I
should have surfaced that when I reviewed the five-path widening, and did not.

Neither the S3 slice brief nor any Tier-A gate set included `check:agent-docs-prose`, so no evaluator
was positioned to catch it either. The IMPL-EVAL PASS is unaffected in what it evaluated — it
evaluated the source tree and the gates it was given — but its gate set was incomplete, which is why
a fresh proportionate delta evaluation is required before readiness resumes.

## Scope amendment — exact, bounded

Authorized additions for the repair slice, and nothing else:

| Path | Why | Kind |
| --- | --- | --- |
| `.llm/assets/agent-docs/prose.json.gz` | regenerated bundle; stale against the authorized query-bridge source edit | generated output |
| `.llm/assets/agent-docs/provenance.json` | regenerated manifest/provenance for the same bundle | generated output |
| `.llm/runs/fix-sdk-cache-surface-and-telemetry--0.0.7-wave3/**` | slice report and worklog | run artifacts |

Explicitly **not** authorized: any further `docs/site/**` page, any `packages/**` or `plugins/**`
source, and any change to the two pre-existing baseline reds (`surface:diff` stale
`baselines/public-surfaces.json`; JSR `F-DOCT-5`). Those remain red and untouched.

The regeneration must come from the canonical task `deno task gen:agent-docs-prose` — not a
hand-edited asset. Note that task first runs `deno task --cwd docs/site build` (a Lume build); that is
not an Aspire/Docker/e2e gate and needs no lease.

`provenance.json` currently records `sourceCommit: 504de3f67`; regeneration is expected to advance it.
The diff must be confined to the two assets, and the review must confirm the regenerated content is a
faithful function of the authorized source edit rather than an unrelated bulk rebuild.

## Lifecycle

Preserved: PR #1665, Codex author thread `01a00516-2033-7ed3-936a-a616cee47447`, and all prior PASS
evidence (PLAN-EVAL `cd5193b66`; Tier-A S1 `0e4e26c51`, S2 `1cf76c6dd`, S3 `9a26c107a`; IMPL-EVAL
`9a26c107a`/`0fed4d7ff`). No new leaf, no broad agent, no re-plan.

Sequence: repair → fresh Tier-A → proportionate fresh delta evaluator over source-to-generated
fidelity → readiness. Automation has set `status:impl-eval`; labels are reconciled only after that
lifecycle is genuinely complete, not before.
