# Evaluation: PR #1748 — docs(aspire) terminology sweep (#1723 slice A, closes #1000)

## Metadata

| Field          | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Run ID         | `docs-aspire-terminology--1723a`                                      |
| Target         | branch `docs/aspire-terminology-sweep`, head `6b91eb2597d924a176b3d883aa7c34e556cde4e4`, base `origin/main` `13878a80` |
| Archetype      | N/A (docs only)                                                       |
| Scope overlays | docs (`SCOPE-docs.md`)                                                |
| Evaluator      | Claude Fable 5, fresh session, 2026-08-30, read-only; generator was Codex `gpt-5.6-sol` (opposite family) |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | **FAIL_FIX** |
| Rationale | Scope, invariants, manifest accounting, and every gate I could execute are clean. Two things block: one edited sentence lost its meaning when ".NET" was dropped (`docs/site/explanation/aspire.md:100-101`), which is exactly the "scar" the brief forbade; and the run dir carries no `supervisor.md`, which `lane-policy.md:250` says makes the run "not activated". Both are minutes to fix; the plan is valid. |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate / PLAN-EVAL N/A recorded before implementation | PASS | `plan.md` opens with a justified `PLAN-EVAL: N/A`; committed in `90ff314a` before `b835638e` |
| Design section exists in worklog | PASS | `worklog.md` `## Design` (public surface, vocabulary, slices, deferred scope) |
| Commit slices match design | PASS | `b835638e` (S1 prose) + `6b91eb25` (S2 regenerated assets) as planned |
| `supervisor.md` present | **FAIL** | `ls .llm/runs/docs-aspire-terminology--1723a/` → no `supervisor.md`; `lane-policy.md:250`: "A run without that file is not activated"; SKILL checklist item unmet. Identity exists only in `codex-thread-ids.md` + PR body |
| Generator ≠ evaluator | PASS | Codex thread `01a05185-…` implemented; this is a fresh Claude session |
| Per-slice PR comments (commit trail) | ADVISORY | `gh pr view 1748 --json comments` → only an OpenHands trigger + its summary; no per-slice harness comments. Evidence lives in the PR body/worklog instead |
| SKILL chapter in briefs | PASS | `implement.md` `## SKILL`; evaluator brief `## SKILL` |
| Close-gate | PASS | `Closes #1000` in body; #1000 has no acceptance/`gate:` boxes; CI `close-gate` job green. #1723 referenced without keyword ("Part of #1723") — correct, it does not close |

## 1. Is the split defensible?

Yes — verified, not accepted.

- `git show origin/main:.github/toolchain.env` → `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.6`, `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.6`.
- #1727 (S1 pin bump) is `OPEN draft=true`; #1740 (S5) `OPEN`; #1718/#1720/#1722/#1741/#1642/#1724 all `OPEN`.
- Both literals at HEAD: `docs/site/explanation/aspire.md:83` (`"sdk": { "version": "13.4.6" }`, `Aspire.Hosting.PostgreSQL: 13.4.6`) and `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58` (`` `13.4.6` ``) — writing 13.5.3 today would be false against main.
- Was more shippable? Within the plan's boundary (no `packages/`), no: the S11 `doc:root` rows `AGENTS.md`/`CONTRIBUTING.md`, the `doc:site-infra` rows, the `template:other`, `generator:workspace`, and `mcp:client` S11 rows all return zero hits for `\.NET Aspire|learn\.microsoft\.com/dotnet/aspire` at HEAD (grep over every non-`.llm` S11 path, exit 1). The one remaining published ".NET Aspire" is `packages/aspire/README.md:11` (JSR README of `@netscript/aspire`), manifest class `aspire-ports` owner `N/A` — outside S11 and outside this plan's `packages/` prohibition. Advisory, see Findings.

## 2. Terminology sweep — completeness and naturalness

- `git grep -n '\.NET Aspire' HEAD -- . ':!docs/site/_plan' ':!.llm'` → 3 hits, none published by Lume: `.agents/docs/README.md:56` (S13 row), `packages/aspire/README.md:11` (see above), `resources/design/.../01-shell-ia-routing.md:5` (design archive).
- `learn.microsoft.com/dotnet/aspire` outside `_plan`/`.llm` → 0 hits. `ai.assistant|auto-?launch` in `docs/site README.md` → 0 hits.
- Lume ignores `_plan`: I built the site (`deno task --cwd docs/site build` exit 0, 227 HTML) and `ls docs/site/_site` has no `_plan`/`plan` directory; `grep -rl '\.NET Aspire' docs/site/_site` → 0 files; `grep -rl 'learn.microsoft.com/dotnet/aspire' docs/site/_site` → 0 files. Verified, not taken on word.
- Read all 18 edited sentences. 17 read naturally. **One does not**: `docs/site/explanation/aspire.md:100-101` now says "Two facts about the AppHost are worth internalizing because they contradict assumptions people carry from Aspire:" — on the Aspire explanation page, "assumptions people carry from Aspire" no longer says *which* Aspire experience (the .NET/C# AppHost) is being contrasted with NetScript's TypeScript AppHost. The two facts that follow (isolated Node runtime; derived graph) are precisely the contrast with a dotnet AppHost. Dropping ".NET" turned a contrast into a near-tautology. Blocking (brief: "if dropping `.NET` leaves a sentence awkward or ambiguous about what Aspire is, fix the sentence, don't leave a scar").

## 3. Version literals

`git diff origin/main...HEAD -- docs README.md | grep -E '^[+-].*13\.[45]\.'` → empty. Both `13.4.6` occurrences present at HEAD (quoted above). **Invariant holds.**

## 4. Manifest accounting (102 rows)

- Source: `origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` (813 rows). `grep -P '\tdoc:public-page\tS11'` → **102** paths.
- Worklog table rows → 102, zero duplicates, `diff` against the manifest set → **IDENTICAL**. Buckets: 8 edited / 91 no change needed / 3 deferred.
- All 91 "no change needed" greps re-run by me at HEAD in one command: `git grep -nEi '\.NET Aspire|learn\.microsoft\.com/dotnet/aspire|ai.assistant' HEAD -- <91 paths>` → exit 1 (no hits); every path exists at HEAD.
- 3 deferred (`observability/{index,telemetry,how-to/add-opentelemetry}.md`) → blockers #1741 (S3, open PR) and #1722 (S10, open issue) exist. Note: these pages contain **zero** terminology hits and zero `aspire otel|export` mentions; the deferral is about content #1723 wants *added*, not about anything wrong today. Honest, but "no change needed for this slice; content deferred to S3/S10" would be the more precise label (advisory).
- Deferred rows in the PR body outside the 102 (`reference/aspire/index.md`, the two literals, `quickstart/aspire.md`, #1642, `README.md:135`/`plugins/ai/README.md:72`) name real open blockers (#1727, #1718, #1720, #1642, #1740).
- `README.md:135` / `plugins/ai/README.md:72` deferral: both lines quote a port-bearing install message; #1740 (S5, removes runtime literal ports) is `OPEN`, so they are accurate against main today. Deferral is correct.
- "AI-Assistant mention" row: grep on HEAD → 0 hits. Satisfied.

## 5. Scope

`git diff --stat origin/main...HEAD`: 22 files — README.md, 13 `docs/site` files, run-dir artifacts, `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`, `packages/cli/src/kernel/assets/agent-docs.generated.ts`, `packages/mcp/src/publish-assets.generated.ts`. No other `packages/`/`plugins/` file. `_plan/**` untouched. `git diff --check` clean. Note the S2 commit was recreated (`c632850c` → `6b91eb25`, delta is run-dir prose only); worklog gates cite `c632850c`, PR body says Tier-A re-ran at `6b91eb25` — content head identical, accepted.

## 6. Derived gate set (from the diff's inputs, not the brief's list)

Inputs that moved: `README.md`, `docs/site/**` (md/vto/mmd). Consumers traced through `deno.json` and `.llm/tools/*`:

| Consumer of a moved input | Emits / checks | Gate | Executed? | Result |
| --- | --- | --- | --- | --- |
| Lume (`docs/site/deno.json` build = source-format + lume + rendered-output) | `_site/` | `--cwd docs/site check:source-format` | yes | exit 0 `Docs source format: OK` |
| | | `--cwd docs/site build` | yes | exit 0, 227 HTML, `Rendered output: OK` |
| `check-internal-links.ts _site` | | `--cwd docs/site check:links` | yes | exit 0 `35344 internal links across 227 pages — all resolve` |
| `check-caveat-refs.ts` | | `--cwd docs/site check:caveats` | yes | exit 0 `18 caveat markers across 14 pages` |
| `_diagrams/render.ts --check` (mmd edited) | SVG byte-compare | `--cwd docs/site diagrams:check` | **NOT RUNNABLE here** (exit 1: mermaid-cli/npx not installed on host) | Structural verification instead: non-`%%` lines of `aspire-resource-graph.mmd` identical main↔HEAD (`diff` IDENTICAL); `assets/diagrams/*.svg` not in the diff (byte-identical to main); SVG contains 0 occurrences of `%%`/`.NET`/comment text; `render.ts:88-119` only byte-compares rendered vs committed. Worklog + Tier-A report 16/16 match after host bootstrap; consistent with the structure, and I did not reproduce the Chromium bootstrap |
| `build-agent-docs-bundle.ts` ← `_site` (gen:agent-docs-prose) | `.llm/assets/agent-docs/*` | `check:agent-docs-prose` | yes | exit 0 `fresh:true, stalePaths:[]`, sourceCommit `b835638e2` |
| `generate-cli-assets-barrel.ts` ← prose/provenance | `agent-docs.generated.ts` | `check:assets-barrel` | yes (task expansion + `git diff --exit-code` visible in log) | exit 0, tree clean |
| `generate-publish-assets.ts` ← prose/provenance/agent-docs.generated.ts | `publish-assets.generated.ts` | `check:publish-assets` | yes (`generate-publish-assets.ts '--check'` in log) | exit 0, tree clean |
| `check-accuracy-and-discoverability.ts` ← docs/site + corpus | | `docs:accuracy` | yes | exit 0 `docs accuracy: PASS` (199 pages, 181 corpus files) |
| `check-internal-doc-links.ts` ← README.md etc. | | `docs:links` | yes | exit 0 `docs=103 broken-links=0 broken-anchors=0` |
| `check-snippets.ts` ← docs/site (a `sh` block comment was edited in `workspace/01-scaffold.md:46`) | | `docs:snippets` | yes | exit 0 |
| `check-exports-drift.ts` ← docs/site | | `docs:exports-drift` | yes | exit 0 `PASS` |
| `generate-export-surface-corpus.ts --check` | | `check:mcp-export-corpus` | yes | exit 0 |
| Regenerated TS is `packages/**` source | | `deno check --unstable-kv packages/mcp/mod.ts packages/mcp/cli.ts packages/cli/mod.ts <both generated files>` | yes | exit 0 |
| | | `deno fmt --check <both generated files>` | yes | exit 0 (`Checked 1 file`; the CLI generated file is fmt-excluded by config) |
| `doc:lint` (#1723 acceptance) | JSDoc/private-ref on TS entrypoints | `deno task doc:lint` (bare) | yes | exit 1 — usage error `--root` required (D-5 reproduced) |
| | | `doc:lint --root packages/cli --pretty` | yes | exit 0 |
| | | `doc:lint --root packages/mcp --pretty` + `deno doc --lint packages/mcp/mod.ts` | yes | exit 1: `private-type-ref` at `packages/mcp/src/application/flows/get-operation-schema-flow.ts:21` (`SchemaViewName`) — file untouched by this diff, pre-existing on main |
| Not applicable, with reason | | `docs:readme:check` (packages/plugins READMEs only — none changed); `arch:check`/`quality:scan` (no hand-written `packages/` source); `e2e:cli` (`ci:skip-e2e`, no scaffold surface) | — | skipped by derivation, not by inheritance |

On the PR's "`doc:lint` is N/A" claim: I agree in substance — the task wraps `deno doc --lint` over `deno.json` export maps and cannot lint Markdown; it has no path by which this diff could change its result except through `publish-assets.generated.ts`, which I checked type-checks and is not an entrypoint. It is not an excuse for a skipped gate: the scoped runs were done and reproduced here. #1723's acceptance lists it, so the PR that *closes* #1723 owes a green `doc:lint` (which today means fixing the pre-existing `packages/mcp` private ref) — outside this leaf.

CI at evaluation time: `build`, `classify`, `close-gate`, `code-quality`, `quality`, `dispatch` green; `check-test` still **pending**. An OpenHands `phase=impl` run (DeepSeek) was also dispatched on the PR and running.

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| **blocking** | Dropping ".NET" left `explanation/aspire.md` ambiguous about what is being contrasted | `docs/site/explanation/aspire.md:100-101`: "contradict assumptions people carry from Aspire" (original: "from .NET Aspire"); the enumerated facts contrast with the C#/dotnet AppHost | Rewrite the clause so the contrast survives, e.g. "assumptions people carry from Aspire's .NET AppHost" / "from C#-based Aspire projects" — one line, no version claim |
| **blocking** | Run dir has no `supervisor.md` | `ls .llm/runs/docs-aspire-terminology--1723a/`; `lane-policy.md:250`; harness SKILL checklist | Add `supervisor.md` from `templates/supervisor.md` (model/session/host/paths/branch/baseline/lanes are all already known from `codex-thread-ids.md` + PR body) and commit it with the run dir |
| advisory | No per-slice PR comments on #1748 | `gh pr view 1748 --json comments` → OpenHands trigger only | Post the two slice comments (S1 `b835638e`, S2 `6b91eb25`) with gate evidence, or record in `drift.md` why the PR body substitutes |
| advisory | `packages/aspire/README.md:11` still says ".NET Aspire" on a JSR-published README | `git grep '\.NET Aspire' HEAD -- packages/` | Outside S11 and this plan's `packages/` prohibition; hand to S13 (#1724) or a one-line follow-up so #1000's intent is complete across *all* published surfaces |
| advisory | 3 observability rows labelled "deferred" carry zero terminology hits | greps above | Keep the S3/S10 dependency but state that no change is needed *for this slice*, so S13's parity report reads them correctly |
| advisory | `check-test` CI job pending at evaluation time | `gh pr checks 1748` | Confirm green before merge |
| advisory (harness, not this PR) | `SCOPE-docs.md` Terminology gate points at `.claude/09-glossary.md`, which does not exist | `ls .claude/09-glossary.md` → no such file | Harness doc fix; I used `docs/site/glossary.md` (edited here, consistent) |
| advisory (issue hygiene, not this PR) | #1000 carries `documentation`/`status:triage` and milestone `Backlog / Triage`, not the colon taxonomy / 0.0.7 | `gh issue view 1000` | Supervisor: relabel/milestone before merge auto-closes it |

## Arch-Debt Delta

New 0 · resolved 0 · deepened 0 · unrecorded 0 — `.llm/harness/debt/arch-debt.md` not in the diff; no `packages/`/`plugins/` hand-written source changed.

## Anti-pattern check

N/A across AP-1…AP-25 — no framework code touched; the only `packages/` files are generator outputs verified by their own `--check` gates.

## What I checked and cleared

- Base/head: `merge-base HEAD origin/main` = `13878a80`; head = `6b91eb25` = PR `headRefOid`.
- 13.4.6 literals intact; no 13.x literal moved in the diff.
- 18/18 replacements present; 0 `.NET Aspire`, 0 Learn links, 0 AI-Assistant mentions in published sources and in the built `_site`; `_plan` unpublished (verified by build output).
- Manifest: 102 = 102, set-identical, single bucket per row, all 91 "no change" greps reproduced, all blocker issues/PRs exist and are open.
- Scope: only prose + the four generator outputs; `git diff --check` clean.
- Generated-asset chain: all three generators' `--check` gates executed (task expansion visible in logs), exit 0, working tree clean afterward.
- `doc:lint` D-5 reproduced; the `packages/mcp` finding is in an untouched file.
- Diagram claim: comment-only `.mmd` change, SVG byte-identical to main and free of comment text; local `diagrams:check` could not execute on this host (mermaid-cli absent) — reported as not run, not as pass.
