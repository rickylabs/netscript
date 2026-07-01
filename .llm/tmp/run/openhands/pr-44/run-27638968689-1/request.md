You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=500 use harness

# IMPL-EVAL — Deno 2.8 / Aspire 13.4 toolchain upgrade: remediation pass (R1–R6)

ROLE: You are the **EVALUATOR** (Qwen3 Max, OpenHands cloud), a SEPARATE session
from the generator. You AUDIT the committed remediation on branch
`chore/deno-2.8-aspire-13.4-upgrade` (PR #44, HEAD `a50d73f`) against the criteria
below and emit a verdict. You do NOT generate or fix unless the verdict section
explicitly asks for a follow-up patch. **Evidence only** — paste real command output;
never fabricate. This run replaces the prior `CHANGES_REQUESTED` IMPL-EVAL (HEAD
`75abf9f`); your job is to confirm whether each requested fix actually landed.

> **Iteration discipline (mandatory).** This run hard-stops near the cap and prior
> cloud runs have fabricated summaries when they ran out of budget. WRITE THE SUMMARY
> SKELETON FIRST (the C1–C6 + verdict headers, all marked `PENDING`) to
> `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/evaluate.md`, then fill
> each section as you verify it and commit/update as you go. If you approach the cap,
> stop and emit your PARTIAL findings with every unverified criterion explicitly
> labelled `UNVERIFIED` — never guess a PASS.

Activate skills FIRST: `netscript-harness`, `netscript-doctrine`, `netscript-cli`,
`jsr-audit`.

Read the run source of truth before judging (do NOT trust it — verify independently):
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/phase-registry.md` (R1–R6 status + eval refs)
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (LD-1..LD-11, Commit Slices)
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/drift.md`
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/commits.md`

## Remediation map (what each fix claims, and where to verify it)

| Slice | Commit | Eval ref | Claim to verify |
| ----- | ------ | -------- | --------------- |
| R1 | `104bfc5` | C1/C3 | subpath pins catalog-aligned (preact ^10.29.2, render-to-string ^6.7.0), dax ^0.48 |
| R2 | `3e7368f` | C5 | 5 dead imports removed (`@hono/hono` ×2 + 3 internal `@netscript/*` subpaths), survivors still used |
| R3 | `211039d` + `3613a7d` | C2 | catalog → stable latest (fedify 2.2.5, logtape 2.1.5, amqplib, durable-streams/state, fedify amqp/denokv/redis); `vite` held with DEBT |
| R4 | `b834f54` | C6 | scaffold pins all GA (SDK 13.4.4, hosting-deno/sqlite 13.4.0, scalar 0.10.3, no prerelease); generator sources catalog |
| R5 | `e148a59` | C6 | merge-readiness: `CI_EXIT=0`; recorded R5 BLOCKED at `database.init` (Aspire 13.4 AppHost shape mismatch) |
| R6 | `677d5405` + `a50d73f` | C6 | scaffold migrated to Aspire 13.4 GA AppHost shape (`apphost.mts` + `.aspire/modules/*.mts` + `tsconfig.apphost.json`); `scaffold.runtime` E2E green |

## Context the evaluator must hold

- This is a TOOLCHAIN UPGRADE. `deno.lock` + version-range churn is EXPECTED output
  (LD-11), not drift. Do not flag lock movement as a failure on its own.
- `catalog:` is **npm-only**. A jsr-migrated dep CANNOT be `catalog:` — it MUST be an
  inline `jsr:` specifier. The regression to catch is the OPPOSITE: a genuinely-**npm**
  bare dep inline instead of `catalog:`.
- `vite` is a KNOWN held major (R3) — confirm a `DEBT_ACCEPTED` row names the exact
  blocking regression; do not re-flag it as a fresh failure.
- Do NOT touch `packages/aspire/src/public/mod.ts`. Do NOT delete lock files/caches or
  run `deno cache --reload`.

## Pass/fail criteria — report each as PASS / FAIL with pasted evidence

**C1 — Catalog completeness.** Enumerate every `deno.json` (root + members + CLI
scaffold templates/fixtures). Every npm bare specifier MUST be `catalog:` unless it is
an un-catalogable subpath (`@orpc/client/fetch`, `preact/jsx-runtime`) whose version
equals the catalog entry. FAIL on any npm bare dep inline without a stated reason.

**C2 — Latest.** Run `deno outdated --latest` (or `deno task deps:latest`). Spot-check
each catalog entry + each inline `jsr:` pin against the registry meta
(`https://registry.npmjs.org/<pkg>` / `https://jsr.io/<scope>/<name>/meta.json`). Every
dep at latest, OR carrying a `DEBT_ACCEPTED` row naming the verified blocking regression
(expect exactly one: `vite`).

**C3 — Alignment.** Build a dep → {versions seen} map across all members. Every dep
resolves to exactly ONE version everywhere unless a member documents a justified pin.

**C4 — jsr-first.** Sweep every `npm:` specifier; query `https://jsr.io/<equiv>/meta.json`.
FAIL if any package that EXISTS on jsr is still sourced from npm.

**C5 — Clean production form + CI gate.** Every output `deno.json` parses, no duplicate
keys, no dead/empty `imports`. Run the smallest trustworthy verdicts (prefer scoped
`deno task check:<slice>` + `.llm/tools/parse-deno-check-errors.ts`): `deno task lint`,
`deno task fmt` check, `deno task publish:dry-run`, and the frozen-install CI gate
(`deno ci` / `deno task` CI lane) MUST EXIT 0.

**C6 — CLI scaffold parity + runtime (the R5→R6 blocker).** Confirm the scaffold emits
the Aspire 13.4 GA AppHost shape (`apphost.mts`, `.aspire/modules/*.mts`,
`tsconfig.apphost.json`) and that generated scaffold pins equal the framework catalog.
The acceptance gate from R6: from a **native ext4 WSL worktree** (never `/mnt/c`),
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty ; echo "E2E_EXIT=$?"`
MUST reach `E2E_EXIT=0` with `database.init` PASS. If you cannot run the full runtime
E2E in the cloud sandbox (no native WSL / Aspire CLI 13.4.4), say so explicitly, audit
the migration STATICALLY (file shape, tsconfig targets, generator + E2E expectation
diffs in `677d5405` / `a50d73f`), and mark the runtime portion `UNVERIFIED (sandbox)`
rather than guessing.

## Output

1. Per-criterion C1–C6: PASS / FAIL / UNVERIFIED + pasted evidence (command + key output).
2. A table of every dep: source (npm-catalog / npm-inline-subpath / jsr-inline), version, latest?
3. Any violations, each with offending file + line.
4. Verdict: exactly one of `APPROVED` or `CHANGES_REQUESTED: <numbered fixes>`. A clean
   `APPROVED` clears the standing `CHANGES_REQUESTED` and unblocks merge of PR #44.

Do not self-approve generator work silently — the verdict is yours to justify with evidence.
Use `.llm/tools` and scoped commands to keep your context tight and your session short.

Issue/PR title: [Toolchain] Deno 2.8.x + Aspire 13.4.x upgrade — IMPL (Phase T, type foundation green)

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
- Write /home/runner/work/_temp/openhands/27638968689-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27638968689-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-44/run-27638968689-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 44
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27638968689
