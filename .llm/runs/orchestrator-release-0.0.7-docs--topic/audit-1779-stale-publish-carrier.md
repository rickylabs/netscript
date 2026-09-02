# Audit — #1779 (Aspire, ready-merge) stales the mcp publish carrier

Date: 2026-09-02. Route: claude-fable-5-1 · low. Role: bounded documentation/claim audit of active
0.0.7 PRs; ownership unchanged (Aspire). Docs 0.0.7 queue remains empty.

## Finding

- `packages/mcp/README.md` L349–353 edited (adds `aspire ps --format Json` discovery step).
- `packages/mcp/src/publish-assets.generated.ts` not regenerated (last touched `4720596fc`;
  0 occurrences of the new text vs 1 in README).
- Head `3bef62a` has **no `ci` run**; PR is `DIRTY/CONFLICTING` on
  `export-surface-corpus.generated.ts`, 4 behind `main`.
- Predicted failure: `quality` → Publish asset freshness. Repair: `deno task gen:publish-assets`
  with the conflict resolution.
- README prose claim verified against the diff (injectable `aspire ps` reader exists).

Handed to the Aspire supervisor as a PR comment. No label changes.

## Also swept

- #1760 `packages/cli/e2e/README.md`: no fence lines change; outside the fence gate. `UNSTABLE`.
- #1895, #1930, #1885: run-artifact Markdown only.
- #1759 carries its own `docs-audit-request.md` (Aspire-dispatched Codex prose audit); not duplicated.

## 2026-09-02 continuous sweep (claude-fable-5-1 · low)

| PR | Lane | Event | Docs verdict |
| --- | --- | --- | --- |
| #1909 | fixes | head `3d87111ad` | code-only delta; clean |
| #1759 | aspire | head `c6ec50214` | code fix; skill prose spot-check clean (no `13.4.6`, no `aspire mcp start`) |
| #1938 | fixes | `impl-eval`, head `6e546515c` | **FINDING**: `quality` failed at MCP export corpus freshness — `JobDefinition` generics widened + new `JobPayloadSchema` on a corpus-covered surface, `export-surface-corpus.generated.ts` not regenerated. Repair `deno task gen:mcp-export-corpus` after merging `main` (13 behind; main moved the carrier). Handed to Fixes via PR comment. |
| #1941 | features | new, `impl-eval` | code-only; clean |
| #1885 | fixes | head `dd039a791` | main merge; zero delta vs main |
| #1916 | fixes | head `1c59ae57b` | code-only; clean |
| #1779 | aspire | unchanged `3bef62a` | still conflicting; awaiting re-sweep |

Pattern worth the coordinator's eye: two active 0.0.7 PRs (#1779, #1938) stale a generated carrier
in `packages/mcp/src/` and both collide with `main` on it. Regenerate-after-merge is the rule.

## Closure

- #1779 rebased onto `850cc7757`, carrier + corpus regenerated (`3352583`); `quality` **success** on
  run 33656583038. Finding closed on the PR.
- #1938 regenerated the corpus **before** merging `main` → `DIRTY` on the carrier as predicted;
  fix sequence posted. Awaiting a new head.
- #1941 (features), #1942 (fixes) opened: code-only, clean. #1883/#1759 heads: code-only, clean.

## ready-merge audits (later 2026-09-02)

- #1938 merged `main` and regenerated on the merged tree (`6ae6cc483`); first `ci` run
  33659669247 in progress. Finding pending closure on `quality`.
- #1916 → `ready-merge`: `quality`/`check-test` green, **`close-gate` red** (label applied after
  the run; mirror never fired). Also 16 behind `main`. Rerun/new-head sequence posted.
- #1942 → `ready-merge`: same close-gate race; 0 behind `main`. Rerun posted.

- #1938 `quality` **success** on run 33659669247 (`6ae6cc483`). Findings closed on the PR.

## ready-merge audits (evening 2026-09-02)

- #1941, #1944, #1943 (features): label-then-push, close-gate green, 0 behind, corpus regenerated
  where touched; `quality` green on #1941/#1944, pending on #1943. Clean.
- #1856 (fixes) → ready-merge: gates green/pending rerun; **stale claim** —
  `docs/site/reference/fresh/index.md:414` says `FormCollectionStrategy` is `interface`, PR makes it
  a `type` alias; exports-drift checks presence not kind. Handed in-PR with a Docs follow-up offer.
- #1945 (fixes, plan): `/design` out of production builds — audit scaffold docs when impl lands.

## ready-merge audits (2026-09-02, late)

| PR | Head | Verdict |
| --- | --- | --- |
| #1909 (Fixes) | `c3805e1d2` | IMPL-EVAL PASS → `augment-review`; same head already swept clean, no docs/carrier delta. |
| #1938 (Fixes) | `6ae6cc483` | → `ready-merge`. 0 behind main; quality/check-test/close-gate pass; `Refs #1455` partial with #1451 stated out of scope (correct non-closing form). Corpus carrier fresh. Clean. |

## Landed S13 carrier audit + ready-PR resweep (2026-09-02 18:40, main `c0b7d841a`)

`main` advanced `850cc7757` → `ef8f3bee7` (#1937) → `09c07fd4e` (#1930) → `c0b7d841a` (#1779, S13).
Audited on a detached worktree at `origin/main` (never on this lagging checkout):

- `check:mcp-export-corpus` exit 0 (`packageCount=35 subpathCount=273 symbolCount=7834`).
- `check:publish-assets` clean (`packages/mcp/README.md` ↔ `publish-assets.generated.ts`).
- `check:assets-barrel` exit 0 (`embedded.generated.ts` ↔ S13 telemetry template).
- `frameworkVersion` in the corpus is `0.0.6` because `deno.json` is still `0.0.6` — expected until the release bump; not a finding.

Predicted collision materialised: #1938, #1943, #1944 (all Fixes, all `ready-merge`, all carrying their own regenerated corpus) conflicted on `export-surface-corpus.generated.ts` the moment #1779's copy landed. Handed to Fixes on each PR (take main's copy, regenerate on a clean tree — #1937 now refuses dirty sources — keep `ready-merge` on before the push).

| PR | Head | behind | State | Verdict |
| --- | --- | --- | --- | --- |
| #1760 (Aspire) | `4c64dfc93` | 0 | CI pending | `packages/cli/e2e/README.md` rewrapped (now fmt-clean; main's copy was not) + structured-gate table; every gate id / env var / ndjson path named exists in `packages/cli/e2e/src` on this head. Not embedded in any carrier. Clean. |
| #1856 (Fixes) | `9d4713d52` | 53 | green, mergeable | `FormCollectionStrategy` reference-kind nit still unanswered. |
| #1895 (Fixes) | `d0bf0aebf` | 3 | green | `Closes #1590`. No docs/carrier files. Clean. |
| #1916 (Fixes) | `1c59ae57b` | 19 | close-gate **fail** | Still needs the rerun. |
| #1938 (Fixes) | `6ae6cc483` | 3 | **CONFLICT** on corpus | Handed off. |
| #1941 (Fixes) | `4bfded8c8` | 3 | green | Clean. |
| #1942 (Fixes) | `2a5d01ae1` | 3 | close-gate **fail** | Still needs the rerun. |
| #1943 (Fixes) | `3a888f398` | 0 | re-headed, CI pending | Conflict resolved by owner; corpus freshness step will verify. |
| #1944 (Fixes) | `bd3eeac54` | 0 | re-headed, CI pending | Same. |

## Resweep after Fixes' convergence batch (2026-09-02 19:05, main `1ca47b859`)

- **#1856** took the `typeAlias` fix (`511e1a347`), then chased carriers one commit at a time: prose bundle
  (`34a757d44`, on a 54-behind base → conflicted on `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`;
  handed off), merged main + regen (`162c6bc49`), corpus (`f8c359317`), asset barrel (`b48aacb07`). Now behind 0,
  no conflict. **Regen chain for any `docs/site` edit, in one commit after merging main:**
  `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:mcp-export-corpus` (last only if a reference kind/symbol moved).
- **#1938** `89ac276bf` resolved the corpus conflict; #1943 `3a888f398`, #1944 `bd3eeac54` re-headed clean.
- **#1883 / #1909 / #1916 / #1940 / #1942** re-headed as pure main merges (behind 0, no conflict, no docs/carrier
  delta). #1916/#1942 close-gate went `fail` → `pending` on the new heads with `ready-merge` already applied.
- **#1759** `4c9def611`: merged main + Aspire surface manifest. 64 added files under
  `.agents/generated/consumer-skills/` are declared generator output (S2, `agentic:dogfood-skills:check` PASS) — not an
  accidental add; no CI freshness gate exists for that bundle (pre-existing, not this PR's regression).
- **#1760** `0b3f13e0c`: +11 Aspire surface-manifest rows only.
- **#1664** `06cf9c301` (Features): converged main → regenerated corpus in the right order; `packages/cli/README.md` /
  `packages/fresh/README.md` claims verified against the head (`service generate`, `--dry-run`, `ContractV1`,
  `initialDataUpdatedAt` in `hooks.ts:128-140`, query-key namespace change matches the template diff).
- **#1946** `37b3b9b65` (Features): internal `resource-slice/` code only; no export/carrier surface.

No open docs finding. No `orchestrator:docs` issue in 0.0.7.

## Stable-cut notes: #1947 → PR #1949, plus S9/#1883/#1948/#1664 resweep (main e341c6f71)

- **#1949** `docs(cli): top up the 0.0.7 changelog before the stable cut` — head `85ca65cc4`
  on `docs/changelog-0-0-7-topup`, base `e341c6f71`. One file, `packages/cli/CHANGELOG.md`,
  +52 lines under `## 0.0.7`; hand-wrapped ≤ 100 cols, `check:publish-assets` exit 0 (package
  CHANGELOGs are not embedded). `Closes #1947`, Docs labels, milestone 0.0.7, `status:impl`.
  IMPL-EVAL dispatched to GLM 5.3 Flash · max (accuracy audit of every named export / version /
  behavioural claim against `origin/main`, completeness vs the merged 0.0.7 list). Late merges
  (#1856, #1943, #1944, #1942, #1895, #1759, #1664) deliberately not described yet — folded in at
  the cut point.
- **#1759 (S9)** new head `d2c0a51a0` → `status:ready-merge`: behind 0, no conflict (the earlier
  code conflict with #1760 is resolved); all four carrier checks exit 0 on the head.
- **#1883** `48cb86c04` ready-merge: behind 4, no conflict, no carriers/docs touched, `Closes` present.
- **#1948** `4af7c98d5` impl (Features): behind 0, no conflict; touches `embedded.generated.ts` +
  `resource-slice/README.md`; assets-barrel / publish-assets / mcp-export-corpus all exit 0. No
  closing keyword in the body yet — expected at impl stage, owner Features.
- **#1664** `a30405df1` impl-eval: behind 0, no conflict; corpus + embedded + two READMEs regenerated
  cleanly (three checks exit 0).
