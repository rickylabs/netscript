You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment

use harness

You are the **IMPL-EVAL** evaluator (separate session from the generator) for PR #170
`chore/plugin-167-harden` — the #167 scaffolder-hardening slice (JSON Schema for `scaffold.plugin.json`
+ `$schema` tolerance + `plugins:check`/CI + version-coherence single-source + dead-code sweep). The
plan passed PLAN-EVAL cycle-2. Implementation (S1–S5) + an adversarial-review fix pass are committed
and pushed. Evaluate the BUILT artifact and emit a final verdict. Do NOT edit source.

## SKILL
- `.agents/skills/netscript-harness` — IMPL-EVAL protocol (`evaluator/protocol.md`,
  `evaluator/verdict-definitions.md`), gate matrix, commit-tracking discipline.
- `.agents/skills/netscript-doctrine` — `@netscript/plugin` (ARCHETYPE-2/3) + plugin (ARCHETYPE-5)
  public surface, manifest contract, `arch:check`, debt rules.
- `.agents/skills/jsr-audit` — additive `./schema` publish surface + JSR tarball resolution of the new
  JSON import / emitted schema URL.
- `.agents/skills/netscript-deno-toolchain` — zod v4 `z.toJSONSchema()`, `deno publish --dry-run`,
  `publish.include`, `deno doc`.
- `.agents/skills/netscript-tools` — scoped `run-deno-{check,lint,fmt}.ts` wrappers, `release:cut`
  internals, lock hygiene.
- `.agents/skills/netscript-cli` — `plugin add` manifest-validator surface.

## Read
- `.llm/tmp/run/plugin-167-harden--impl/{plan.md,worklog.md,drift.md,commits.md}` (generator evidence;
  worklog ends with an "Adversarial review fixes" section + gate table).
- `.llm/tmp/run/plugin-167-harden--impl/adv-review.md` (the unoriented adversarial review that produced
  the 3 fixes — verify each fix actually discharges its finding).
- The diff `4d601e6a..HEAD` (S1 `71b4b7c8`, S2 `9c109834`, S3 `a97202a6`, S4 `8af4f7ca`,
  S5 `4f832606`, adversarial fix `010d560c`). Do not trust the worklog — confirm independently.

## Verify (rank any issue; cite file:line)
1. **Schema fidelity** — `packages/plugin/schema/scaffold.plugin.schema.json` faithfully encodes
   `PluginInstallerManifestSchema` (`.strict()` → root `additionalProperties:false`, `z.record`, enums,
   nullables, the safe-export-path regex as `pattern`). Regen is byte-stable: run
   `deno task plugins:schema:gen` then confirm zero git diff.
2. **`$schema` tolerance** — strip-before-parse via `stripPluginManifestSchemaKey()` is applied at BOTH
   CLI call sites (`fetch-jsr-plugin-validator.ts`, `add-plugin.ts:~237`), clones (no input mutation),
   strips ONLY `$schema`; `PluginInstallerManifestSchema` stays `.strict()`; a non-`$schema` unknown key
   still rejects. `manifest_test.ts` proves accept-all-5 + $schema-strip-passes + extra-key-fails +
   byte-stability.
3. **Userland schema URL (the adversarial MAJOR)** — emitted userland manifests set `$schema` to a
   FETCHABLE `https://jsr.io/@netscript/plugin/<version>/schema/scaffold.plugin.schema.json` derived from
   the plugin package version (NOT a `jsr:` specifier, NOT hardcoded). Committed schema `$id` is a stable
   HTTPS URL (versionless). Confirm no `jsr:@netscript/plugin/schema` specifier remains anywhere.
4. **Version single-source** — no `0.0.1-alpha.12` (or any) NetScript version string literal remains
   under `plugins/*/src/scaffold/**/*.ts`; version derives from each plugin's `deno.json` JSON import;
   `release:cut`/`.llm/tools/release/cut.ts` unchanged; `plugins:check` stale-pin scan now fails on ANY
   literal (verify by reasoning about `check-plugins.ts`).
5. **CI enforcement** — `.github/workflows/ci.yml` `quality` job has a real `deno task arch:check` step;
   `arch:check` invokes `plugins:check`; both exit non-zero on a genuine manifest/schema-drift/stale-pin
   defect (not warning-only). YAML valid; no required-check name renamed.
6. **JSR publish surface** — `deno publish --dry-run` for `@netscript/plugin` includes
   `schema/scaffold.plugin.schema.json` and the `./schema` export resolves; the 5 plugins' dry-runs
   include their `deno.json` (the JSON import is tarball-safe, no parent-escape).
7. **Dead-code + hygiene** — removed symbols are provably unreferenced (no over-removal a dynamic
   registry path needs); no new type casts beyond the 2 sanctioned; no `any`; no `deno.lock` churn; each
   slice committed+pushed+PR-commented; commit messages map 1:1 to slices.
8. **Gate re-run** — run the smallest set that proves the change: `deno task plugins:check`,
   `deno task arch:check`, scoped check/lint/fmt (`--ext ts,tsx`) on packages/plugin + plugins +
   packages/cli, `deno task test`, `deno publish --dry-run` for `@netscript/plugin`. The full
   `scaffold.runtime` e2e was last green 48/48 at S5 and the generator justified skipping it for the
   inert `$schema` string-value change — confirm that justification holds, or run it if you disagree.

## Output
A single PR comment. Per-area `OK`/`ISSUE` with file:line. Then the overall verdict per
`verdict-definitions.md`: `PASS` (ready to merge), `FAIL_FIX` (list the must-fix set), `FAIL_RESCOPE`,
or `FAIL_DEBT`. This is the final gate before merge + the alpha.13 cut. Preserve lock hygiene: do not
commit source/lock churn beyond your run-trace artifact.


Issue/PR title: chore(plugin): #167 scaffolder hardening — schema + plugins:check + version-coherence + dead-code (pre-alpha.13)

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
- Write /home/runner/work/_temp/openhands/28328245073-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28328245073-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-170/run-28328245073-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 170
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28328245073
