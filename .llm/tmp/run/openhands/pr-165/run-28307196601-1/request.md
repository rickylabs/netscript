You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=40

use harness

You are the IMPL-EVAL evaluator (separate session from the generator) for PR #165
`fix/service-openapi-asset-embed`. Write the verdict to
`.llm/tmp/run/fix-service-openapi-asset-embed--asset-read/evaluate.md` and post it as a PR comment.
Emit exactly one of: PASS, FAIL_FIX, FAIL_RESCOPE, FAIL_DEBT. Do NOT implement fixes — you are the
gate, not the generator.

## SKILL
- `netscript-harness` — controlling skill. Read `.llm/harness/evaluator/protocol.md` and
  `.llm/harness/evaluator/verdict-definitions.md`. Evaluator separation is mandatory; this is the
  final IMPL pass.
- `netscript-doctrine` — `@netscript/service` archetype + public-surface rules. `createScalarJs` is an
  existing public export; its exported signature and runtime behavior MUST be unchanged (it must still
  return a `ServiceHandler` that serves the Scalar JS with the same Content-Type + Cache-Control).
- `jsr-audit` — THE locked rule being enforced: bundled assets must travel as **inlined plain string
  constants in a generated `*.generated.ts` barrel**, NEVER `Deno.readTextFile`/`fromFileUrl`/
  `import.meta` path reads, and NEVER `with { type: 'text' }` (text imports type-check + pass
  `publish --dry-run` but are REJECTED at authenticated `deno publish` — proven at alpha.5/alpha.6;
  only string consts publish cleanly, proven at alpha.7). The whole point of this PR is to remove the
  last `Deno.readTextFile` asset read in the service package.
- `netscript-deno-toolchain` — `deno publish --dry-run`, `deno doc`, `deno check --unstable-kv`,
  scoped check/lint/fmt wrappers.
- `netscript-tools` — gate evidence rules, scoped wrappers, lock hygiene.

## What the PR claims (verify, do not trust)
Converts `@netscript/service` `createScalarJs()` from `Deno.readTextFile(scalarJsUrl)` (JSR-unusable —
throws "Must be a file URL" over https) to importing a generated `SCALAR_MIN_JS` string const, by
adding a 4th service target to `.llm/tools/generate-cli-assets-barrel.ts`. Changed files (the ONLY
files that may change besides run artifacts):
- `.llm/tools/generate-cli-assets-barrel.ts` (4th SERVICE target + renderServiceEmbeddedContent)
- `deno.json` (root) — `check:assets-barrel` git-diff file list extended to cover the service barrel
- `packages/service/deno.json` — `publish.include` adds `src/primitives/scalar.generated.ts`, drops
  raw `assets/scalar.min.js`
- `packages/service/src/primitives/openapi.ts` — drops `scalarJsUrl`/`scalarJsCache`/readTextFile,
  imports `SCALAR_MIN_JS`, `createScalarJs` returns a handler serving the const
- `packages/service/src/primitives/scalar.generated.ts` — NEW generated barrel (inlined string const)

## Gates to RE-RUN yourself from repo root (record raw exit codes)
1. `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts` → expect exit 0.
2. `deno task check:assets-barrel` → expect exit 0 (regen reproduces byte-for-byte; the generated
   barrel is determinism-gated). This is the critical determinism proof — confirm the service barrel
   is in the task's `git diff --exit-code` file list and that a fresh `deno task gen:assets-barrel`
   leaves NO git diff.
3. `cd packages/service && deno task publish:dry-run` → expect exit 0; confirm the tarball includes
   `src/primitives/scalar.generated.ts` and does NOT ship raw `assets/scalar.min.js` (a pre-existing
   accepted slow-types warning may remain).
4. `deno task release:preflight` → expect exit 0 with ZERO flags for `openapi.ts` (the #147 gate; this
   is the proof the JSR-unusable read is gone).
5. `deno doc --filter createScalarJs packages/service/mod.ts` → confirm signature is still
   `function createScalarJs(): ServiceHandler` (no public API change).
6. `cd packages/service && deno task test` → expect all pass.
7. `git grep -nF "Deno.readTextFile" packages/service/src/primitives/openapi.ts` → expect ZERO matches.
8. Confirm NO `with { type: 'text' }` was introduced anywhere under `packages/service/` and NO new
   type casts beyond the 2 accepted repo-wide casts.
9. Confirm `deno.lock` is unchanged vs `origin/main` (no lock churn).

## Verdict rules
- PASS only if every gate above is green AND the public surface of `createScalarJs` is byte-identical
  in signature AND the embedding uses a string const (not a text import) AND no out-of-scope files
  changed. The generated barrel being large (inlined minified JS) is EXPECTED, not a defect.
- FAIL_FIX for a concrete, small correctable defect (e.g. determinism gate red, a residual readTextFile,
  a behavior change in the handler, a publish.include mistake). State the exact fix.
- FAIL_RESCOPE / FAIL_DEBT per verdict-definitions only if warranted.
- Eval loop limit is two failures before escalation. Post the verdict as a PR comment and write
  `evaluate.md`. Do NOT push fixes or self-implement.


Issue/PR title: fix(service): JSR-safe scalar.min.js embedding (createScalarJs no longer reads import.meta path)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28307196601-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28307196601-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-165/run-28307196601-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 165
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28307196601
