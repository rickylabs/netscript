You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment

use harness

You are the **PLAN-EVAL** evaluator (separate session from the generator; hard gate — NO
implementation may begin before you emit PASS_PLAN). Evaluate the centralization plan that hoists the
duplicated plugin-scaffolding primitives/base/adapters into the core `@netscript/plugin` package so the
5 plugins retain only per-plugin specifics. This is a USER-declared release blocker: the current
per-plugin `src/scaffold/` reinvents primitives instead of consuming core, which "does not reach the
netscript standards." The plan folds onto the existing branch `chore/plugin-167-harden` (PR #170, which
already PASSed its own PLAN-EVAL + IMPL-EVAL and is being HELD open, not merged, so the substandard
duplication never reaches main). Do NOT edit source. Emit a plan verdict only.

## SKILL
- `.agents/skills/netscript-harness` — PLAN-EVAL protocol (`evaluator/plan-protocol.md`,
  `gates/plan-gate.md`, `gates/archetype-gate-matrix.md`, `evaluator/verdict-definitions.md`),
  commit-slice discipline, drift rules.
- `.agents/skills/netscript-doctrine` — `@netscript/plugin` (ARCHETYPE-2/3) public-surface + export
  rules, plugin (ARCHETYPE-5) shape, dependency-direction law (CLI→plugin, never plugin→CLI), debt
  rules.
- `.agents/skills/jsr-audit` — additive `./scaffold` export publish surface + tarball resolution of the
  per-plugin `deno.json` JSON import under `jsr:@netscript/<plugin>/scaffold`.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` public-surface inspection, `publish.include`,
  `deno publish --dry-run`.
- `.agents/skills/netscript-tools` — scoped `run-deno-{check,lint,fmt}.ts`, gate-evidence rules, lock
  hygiene.
- `.agents/skills/netscript-cli` — the `plugin add` → `./scaffold` `--context-json` invocation contract.

## Read (then VERIFY against the actual tree on `chore/plugin-167-harden`; do not trust the plan prose)
- `.llm/tmp/run/plugin-167-harden--impl/plan-scaffold-core.md` (the plan under evaluation).
- The duplication evidence in-tree: `plugins/{workers,sagas,streams,triggers,auth}/src/scaffold/`
  `{artifacts.ts,mod.ts,files.ts}` — confirm the casing helpers, `NETSCRIPT_VERSION` deno.json import,
  `SCAFFOLD_SCHEMA_URL`, the `generateScaffoldPluginJson` envelope, the `--context-json` CLI harness,
  and `writePlannedFiles` are genuinely duplicated (md5 `files.ts`: sagas==triggers, streams==auth).
- The existing core surface the plan reuses: `packages/plugin/src/protocol/scaffolder.ts`,
  `ports/{scaffolder,template}-port.ts`, `adapters/{filesystem-scaffolder,string-template-adapter}.ts`,
  `cli/base/plugin-item-scaffolder.ts`, and `packages/plugin/deno.json` exports/publish.
- `packages/cli/src/kernel/adapters/scaffold/template-adapter.ts` (casing pipes — confirm it is in
  `packages/cli`, hence NOT plugin-consumable, so a new `packages/plugin` home is correct).

## Judge the plan against the Plan-Gate (cite file:line)
1. **Problem correctly diagnosed.** Is the duplication real and is the proposed split
   (primitive/base/adapter → core vs specifics → plugin) accurate? Flag anything the plan
   mislabels as a primitive that is actually plugin-specific, or vice-versa.
2. **Dependency-direction soundness.** Core home = `packages/plugin` (not `packages/cli`). Confirm no
   proposed import makes a plugin depend on `packages/cli`, and that `@netscript/plugin/scaffold` is a
   legal additive export with no cycle into protocol/sdk.
3. **Byte-identical-output invariant is the right safety net.** Is C2's byte-equality test (specs →
   `buildScaffoldPluginJson` diffed against the 5 committed manifests) sufficient to guarantee
   `plugins:check` stays green and no committed `scaffold.plugin.json` churns? Is the C6 full
   `scaffold.runtime` e2e correctly marked mandatory (machinery change, unlike #170's inert string
   change)?
4. **Slice decomposition.** Are C1–C6 dependency-ordered, independently gateable, and is each
   acceptance bound in-slice (nothing deferred)? Is "fold vs split" justified?
5. **API minimalism / no over-abstraction.** Is the 6-file core surface
   (`artifact/naming/schema-url/manifest-spec/runner/mod`) the smallest that removes the duplication,
   and is the base-class+adapters shape consistent with the existing `PluginItemScaffolder` and
   doctrine? Flag any generic-template-DSL creep.
6. **#167 reconciliation.** Confirm the plan preserves the #167 mandate — plugins still OWN their
   `./scaffold` entrypoint export + their file templates + manifest data; only machinery moves to core.
7. **Debt handling.** Are the out-of-scope items (cli casing dedupe; optional `buildPluginDenoJson`)
   correctly deferred to arch-debt rather than silently dropped or force-fit?
8. **Gate set.** Is the validation set (scoped check/lint/fmt, `deno task test`, `plugins:check`,
   `arch:check`, full e2e, 6 publish dry-runs) the smallest that proves the change, with no missing
   gate (e.g. `deno doc` public-surface confirmation of the new export)?

## Output
A single PR comment. Per-criterion `OK`/`ISSUE` with file:line. Then the verdict per
`verdict-definitions.md`: `PASS_PLAN` (implementation may begin) or `FAIL_PLAN` (list the must-revise
set, ranked). If `FAIL_PLAN`, be concrete enough that one revision pass can reach PASS. Two FAIL_PLAN
cycles then escalate. Preserve lock hygiene: commit only your run-trace artifact, no source/lock churn.


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
- Write /home/runner/work/_temp/openhands/28329181305-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28329181305-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-170/run-28329181305-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 170
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28329181305
