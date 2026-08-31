# IMPL-EVAL (exact head) — PR #1748 at `22e79dccf5f7cc8bb766d9eb1bd11d5bd8c9e525`

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **PASS** |
| Evaluated head | `22e79dccf5f7cc8bb766d9eb1bd11d5bd8c9e525` — identical across `git rev-parse HEAD`, `git ls-remote origin docs/aspire-terminology-sweep`, and `gh pr view 1748 --json headRefOid` |
| Base | `origin/main` `13878a80a50c55b9662099fed64555f2310ae4a3` = `merge-base HEAD origin/main` |
| Evaluator identity | Requested: Claude · Anthropic · Fable 5 · medium (`formal_impl_evaluation`). Observed: the harness reports "You are powered by the model named Fable 5. The exact model ID is claude-fable-5." I cannot introspect my own effort setting; the requested effort was medium and nothing observed contradicts it. Fresh session, separate from both Codex generator threads (`01a05185…`, repair `01a051d4…`). Generator ≠ evaluator holds. |
| Read-only compliance | No tracked file edited, nothing committed or pushed, PR/issues/labels untouched. This report is the single new untracked file. `git status --porcelain` before and after: only the two protected evaluator files (`impl-eval.md`, `codex-thread-ids.md`) plus this report. |

Both blocking findings from the prior FAIL_FIX at `6b91eb25` are **discharged**. The repair
introduced nothing that blocks. Required PR-body edits are listed below; they are
supervisor-owned surface work, not implementation defects, but should land before merge because
the body's Validation section and one DoD box currently cite a superseded head.

## B-1 — DISCHARGED (contrast restored; judged on the prose, in context)

`docs/site/explanation/aspire.md:100-101` now reads: "Two facts about the AppHost are worth
internalizing because they contradict assumptions people carry from Aspire's .NET AppHost:".

I read the full surrounding section (lines 80–130). The two enumerated facts are genuinely
contrasts with a C#/.NET AppHost:

1. "isolated TypeScript/Node runtime" — a .NET AppHost runs the orchestration program on the .NET
   runtime; NetScript's runs `apphost.mts` on a sealed-off Node runtime. Real contrast.
2. "the graph is derived, not hand-written" — in a .NET AppHost you author the resource graph in
   the AppHost program by hand; here `createNetScriptAppHost` derives it from `appsettings.json`
   plus plugin contributions. Real contrast.

The sentence is true again and the contrast reads as a contrast, not a tautology. Verified in the
**rendered output** as well: `_site/explanation/aspire/index.html` carries the full sentence
("…assumptions people\ncarry from Aspire's .NET AppHost:") — my first grep missed it only because
of a line break, confirmed by inspecting the raw HTML bytes.

### The central judgement call — does ".NET AppHost" reintroduce what #1000 removes?

My judgement: **no, it is consistent with #1000's intent.** #1000 tracks the product rename
".NET Aspire" → "Aspire" (the product dropped the prefix when it went polyglot). "Aspire's .NET
AppHost" does not name the product ".NET Aspire"; it uses ".NET" as a technology descriptor for
one AppHost flavor of the now-polyglot product — which is exactly the thing this page contrasts
with NetScript's TypeScript AppHost, and which polyglot Aspire still ships. Under the new naming,
this is arguably the only phrasing that keeps the sentence true without the banned product name.
Mechanically it also does not match the sweep's invariant pattern: `git grep -n '\.NET Aspire' --
. ':!docs/site/_plan' ':!.llm'` at HEAD returns **exactly the three pre-existing hits**
(`.agents/docs/README.md:56`, `packages/aspire/README.md:11`,
`resources/design/dashboard/reference/dashboard-design--orchestrator/design-prompts/01-shell-ia-routing.md:5`),
and `grep -rl '\.NET Aspire' docs/site/_site` on the freshly built site returns zero files. A
stricter reading ("no .NET-adjacent naming at all") would also have to reject truthful sentences;
I do not adopt it.

## B-2 — DISCHARGED (supervisor.md present, complete, honest via D-8)

- `supervisor.md` exists in the run dir, committed in S3 `3301f593`. Checked field-by-field
  against `.llm/harness/templates/supervisor.md`: Model, Session, Host, Checkout, Worktree,
  Branch, Baseline (SHA + branch + date), Run ID, "Routes in force" table, and the overrides
  section (recording both Codex thread ids) are all present and specific. It satisfies
  `lane-policy.md:250` ("A run without that file is not activated").
- `drift.md` **D-8** states plainly: "The file was added retroactively in S3 … It was added after
  implementation, not at run start; this entry does not backdate activation." That is exactly the
  honesty the brief demands.
- One wrinkle (advisory A-1): `supervisor.md` itself retains the template boilerplate "Written at
  run start per `workflow/lane-policy.md`", which is literally false for this run. D-8 corrects
  the record, but a reader of `supervisor.md` alone could be misled. A one-line "(added
  retroactively in S3; see drift D-8)" in the file would close the gap. Not blocking: the drift
  ledger is the designated place for this correction and carries it verbatim.

## Terminology and version invariants (re-verified at HEAD, not inherited)

- `.NET Aspire` grep: exactly the 3 pre-existing hits (above). Built `_site`: 0 files.
- Both `13.4.6` literals unchanged: `docs/site/explanation/aspire.md:83` (sdk version +
  `Aspire.Hosting.PostgreSQL`) and
  `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58`. Neither S3 nor S4 touches
  a version literal.

## Derived-asset chain (re-derived from the generators, not from any handed list)

Read `.llm/tools/docs/build-agent-docs-bundle.ts`, `.llm/tools/generate-cli-assets-barrel.ts`,
`.llm/tools/generate-publish-assets.ts`, and the `deno.json` task definitions (lines 112–119):

- `docs/site/**` → Lume build (`_site`) → `build-agent-docs-bundle.ts` →
  `.llm/assets/agent-docs/{prose.json.gz,provenance.json}`; gate `check:agent-docs-prose`.
- prose+provenance → `generate-cli-assets-barrel.ts` →
  `packages/cli/src/kernel/assets/agent-docs.generated.ts` (verifies provenance sha256/byte
  counts at read time, lines 374–400); gate `check:assets-barrel` (regenerate + scoped
  `git diff --exit-code`).
- `generate-publish-assets.ts` input list (lines 34–53) includes the prose assets **and**
  `agent-docs.generated.ts`, emitting `packages/mcp/src/publish-assets.generated.ts`; gate
  `check:publish-assets`. This is the gate the sibling leaf #1746 omitted; it is required here
  and was run.

Provenance: `provenance.json` `sourceCommit` = `3301f593b` = the S3 prose commit. No orphan
regeneration. S4 `22e79dcc` contains **only** the four derived assets (`prose.json.gz`,
`provenance.json`, `agent-docs.generated.ts`, `publish-assets.generated.ts`) — confirmed by
`git show --stat`.

## Gates executed by me at `22e79dcc` (real exit codes)

| Gate | Exit | Note |
| --- | ---: | --- |
| `deno task check:agent-docs-prose` (includes full site build) | 0 | `fresh:true, stalePaths:[]`, sourceCommit `3301f593b`, 638 files / 227 HTML, `Rendered output: OK` |
| `deno task check:assets-barrel` | 0 | tree clean afterward (`git status --porcelain` unchanged) |
| `deno task check:publish-assets` | 0 | tree clean afterward |
| `deno task --cwd docs/site check:source-format` | 0 | |
| `deno task --cwd docs/site check:links` | 0 | |
| `deno task --cwd docs/site check:caveats` | 0 | |
| `deno task docs:links` | 0 | |
| `deno task docs:accuracy` | 0 | |
| `deno task docs:snippets` | 0 | |
| `deno task docs:exports-drift` | 0 | |
| `deno task check:mcp-export-corpus` | 0 | |
| `deno check --unstable-kv` on both regenerated TS files | 0 | |
| `git diff --check 6b91eb25..HEAD` | 0 | no whitespace damage |

Skipped, with reasons (not reported as passes):

- `diagrams:check` — mermaid-cli/Chromium absent on this host. Honest status: **not run by me.**
  The repair delta (S3+S4) contains no `.mmd` or SVG change, so the diagram state at `22e79dcc`
  is byte-identical to `6b91eb25`, where the worklog and Tier-A recorded 16/16 byte-match after
  host bootstrap; the prior evaluator's structural verification (comment-only `.mmd` delta, SVGs
  byte-identical to main) also carries over unchanged.
- `doc:lint` scoped runs — the repair delta touches prose and two generated files that are not
  `deno doc` entrypoints; the prior evaluator's reproduction (cli passes; mcp has a pre-existing
  `private-type-ref` in an untouched file) cannot have been changed by this delta.
- `e2e:cli`, `arch:check`, `quality:scan`, `docs:readme:check` — skipped by derivation: no
  scaffold surface, no hand-written `packages/`/`plugins/` source, no package README changed.

CI check-runs pinned to the exact head `22e79dcc` (via `gh api commits/<sha>/check-runs`):
`build`, `close-gate`, `quality`, `code-quality`, both classify jobs — success. **`check-test`
still in progress at evaluation time** (advisory A-2: confirm green before merge).

## Scope

- `git diff --stat 6b91eb25..HEAD`: 8 files — 1 prose line in `explanation/aspire.md`, 3 run-dir
  artifacts (drift, supervisor, worklog), 4 derived assets. Nothing else.
- `git diff --name-only origin/main...HEAD`: 23 files; the only `packages/` entries are the two
  generator outputs. No hand-written `packages/`/`plugins/` source changed. `_plan/**` untouched.

## Does the prior report's non-blocking work still stand?

Yes. The repair delta could only touch: (a) the `explanation/aspire.md` row of the 102-row S11
accounting — it was already in the "8 edited" bucket, so the 8/91/3 arithmetic and set identity
are unaffected; (b) the terminology grep — re-run by me, identical 3 hits; (c) the derived-asset
freshness — re-proven above at the new head. The deferral table, the 91 "no change needed" greps,
and the shippability analysis reference paths the repair never touched; I did not re-run them and
say so explicitly. The worklog's new S3/S4 section's gate claims were reproduced here (every gate
it lists exits 0 for me as well), and its "S3 is `HEAD^` / S4 is `HEAD`" relative-SHA note is
accurate.

## Blocking findings

None.

## Required PR-body edits (supervisor-owned; do before merge)

The body was written at `6b91eb25` and the head has moved twice. Two statements have gone stale:

1. **`## Validation`** opens with "Re-run independently by the Tier-A supervisor at the pushed
   head `6b91eb25`" — `6b91eb25` is no longer the pushed head. Update to cite `22e79dcc` (or list
   both heads), noting the repair gates re-run there (this evaluation reproduces all of them,
   exit 0) and that `diagrams:check` was not re-run for the repair because the delta contains no
   `.mmd`/SVG change (the `6b91eb25` 16/16 byte-match evidence carries over byte-identically).
2. **DoD box 4** — "Every applicable gate green at the pushed head, verified independently by the
   supervisor" — is currently supported only by evidence at the superseded head. The substance is
   true at `22e79dcc` (verified here and by CI), but the body must say so to keep the checked box
   truthful for the close-gate; edit 1 accomplishes this.
3. **Add a short repair note** (in `## Harness` or `## Drift / Debt`): IMPL-EVAL returned
   FAIL_FIX at `6b91eb25` (lost AppHost contrast; missing `supervisor.md`); repaired in S3
   `3301f593` + S4 `22e79dcc` on repair thread `01a051d4…`; drift D-7/D-8 record it. Without
   this, the body's implementation/route story ends before the repair existed.

## Advisories

- **A-1**: `supervisor.md` keeps the template's "Written at run start" line, literally false for
  this retroactive file; D-8 corrects the record but the file itself should carry a one-line
  retroactivity pointer.
- **A-2**: `check-test` CI job in progress at the exact head at evaluation time; confirm green
  before merge.
- Carried from the prior report, still applicable and still non-blocking: no per-slice PR
  comments on #1748; `packages/aspire/README.md:11` ".NET Aspire" on a JSR-published README
  (S13/#1724 follow-up); #1000 label/milestone hygiene before the merge auto-closes it;
  `SCOPE-docs.md` glossary-path harness doc fix.

## Arch-debt delta

New 0 · resolved 0 · deepened 0 · unrecorded 0 — no hand-written framework source in the diff.
