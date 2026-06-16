You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=800

# IMPL-EVAL — Deno 2.8 / Aspire 13.4 toolchain upgrade: dependency harmonization

ROLE: You are the **EVALUATOR** (MiniMax M3, OpenHands cloud), a SEPARATE session
from the generator. You AUDIT the committed result on branch
`chore/deno-2.8-aspire-13.4-upgrade` (PR #44, HEAD `75abf9f`) against the criteria
below and emit a verdict. You do NOT generate or fix unless the verdict section
explicitly asks for a follow-up patch. Evidence only — paste real command output;
never fabricate. If you approach an iteration cap, WRITE YOUR PARTIAL FINDINGS FIRST
(to the run summary path), then stop.

Activate skills FIRST: netscript-harness, netscript-doctrine, jsr-audit.
Read the run source of truth before judging:
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (LD-1..LD-11, Commit Slices)
- `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/drift.md`

## Context the evaluator must hold

- This is a TOOLCHAIN UPGRADE. `deno.lock` + version-range churn is EXPECTED output
  (LD-11), not drift. Do not flag lock movement as a failure on its own.
- `catalog:` is **npm-only**. A jsr-migrated dep CANNOT be `catalog:` — it MUST be an
  inline `jsr:` specifier. So "left the catalog block / became inline jsr" is CORRECT
  for zod, hono, @standard-schema/spec and any other jsr migration. The regression to
  catch is the OPPOSITE: a genuinely-**npm** bare dep that is inline instead of `catalog:`.
- Verified jsr-first migrations the generator was told to make:
  `zod → jsr:@zod/zod`, `hono (+ /cors,/logger) → jsr:@hono/hono`,
  `@standard-schema/spec → jsr:@standard-schema/spec`.
- Verified stay-on-npm (NOT on jsr): all `@orpc/*`, `@prisma/*`, `@tanstack/*`,
  `@preact/signals`, `preact`, `preact-render-to-string`, `@saga-bus/core`,
  `@durable-streams/*`, `amqplib`, `ioredis`, `mysql2`, `pg`, `clsx`,
  `tailwind-merge`, `vite`, `@opentelemetry/api`.

## Pass/fail criteria — report each as PASS / FAIL with evidence

**C1 — Catalog completeness.** Enumerate EVERY `deno.json` (root + all members + any
CLI-scaffold template/fixture). For each npm bare specifier, it MUST be `catalog:`
unless it is genuinely un-catalogable (a subpath specifier like `@orpc/client/fetch`,
`preact/jsx-runtime`) — those stay inline but their version MUST equal the catalog
entry's. FAIL on any npm bare dep inline without a stated subpath/justification reason.

**C2 — Latest.** Run `deno outdated --latest` across the workspace. Spot-check each
catalog entry AND each inline `jsr:` pin against the registry meta.json
(`https://registry.npmjs.org/<pkg>` / `https://jsr.io/<scope>/<name>/meta.json`).
Every dep must be at latest. **Confirmed ground truth at HEAD `75abf9f`**: the T6b
bump (`17431e5`) moved ONLY `@opentelemetry/api → ^1.9.1`, `preact → ^10.29.2`,
`preact-render-to-string → ^6.7.0`. These remain UNCHANGED at the pre-bump values:
`ioredis ^5.4.1`, `@orpc/* ^1.14.6`, `pg ^8.13.1`. You MUST resolve whether each of
those three is unchanged because it is ALREADY latest (→ PASS) or because the bump
skipped it (→ FAIL) — query `https://registry.npmjs.org/<pkg>` for the true latest
and paste the `dist-tags.latest` for ioredis, @orpc/server (representative of @orpc/*),
and pg. Any not-latest dep MUST carry a `DEBT_ACCEPTED` row naming the exact verified
regression that blocks the bump.

**C3 — Alignment.** Build a dep → {versions seen} map across all members. Every dep
resolves to exactly ONE version everywhere. FAIL on any split version unless a member
documents a deliberate, justified pin.

**C4 — jsr-first.** Sweep every `npm:` specifier; for each, query
`https://jsr.io/<equivalent>/meta.json`. FAIL if any package that EXISTS on jsr is
still sourced from npm. Re-verify the three known migrations actually landed.

**C5 — Clean production form.** Every output `deno.json` parses as JSON, has no
duplicate keys, no dead/empty `imports`, consistent specifier style. `deno ci`
(frozen install) MUST EXIT 0 — this is the CI gate that was failing; it proves the
committed `deno.lock` matches the graph. Also `deno task check`, `deno task lint`,
`deno task fmt:check`, `deno task publish:dry-run`, `deno task audit:critical`.

**C6 — CLI scaffold parity.** The CLI that emits `deno.json` for scaffolded projects
MUST use the same catalog system: the generated root `deno.json` mirrors the producer
catalog so copied package-level `catalog:` imports resolve in the consumer workspace
(see `packages/cli/src/maintainer/adapters/packages-copier.ts`). Confirm scaffold
template/constant versions equal the framework's, and that a scaffolded app actually
resolves: run `deno task e2e:cli` (it scaffolds + type-checks). If the box lacks
dotnet/aspire/docker, say so explicitly and confirm the generated `deno.json`
resolves under `deno install` + `deno check` — do not claim e2e passed if it did not run.

## Output

1. Per-criterion C1–C6: PASS/FAIL + pasted evidence (command + key output).
2. A table of every dep: source (npm-catalog / npm-inline-subpath / jsr-inline),
   version, and whether it is latest.
3. Any violations, each with the offending file + line.
4. Verdict: exactly one of `APPROVED` or `CHANGES_REQUESTED: <numbered fixes>`.
Do not self-approve generator work silently — the verdict is yours to justify with evidence.

## Generator self-report (DO NOT TRUST — verify independently)

The generator reported all gates green across T6a `cbb2cb0` / T6b `17431e5` / T6c
`75abf9f` (`check`, `lint`, `fmt:check`, `deno ci`, `publish:dry-run`, `audit:critical`,
`e2e:cli` = 41 passed / 0 failed each), jsr migrations at `@zod/zod@4.4.3`,
`@hono/hono@4.12.24`, `@standard-schema/spec@1.1.0`, and 2 non-critical advisories
(`@opentelemetry/core` moderate `GHSA-8988-4f7v-96qf`, `esbuild` high
`GHSA-gv7w-rqvm-qjhr`) with `audit:critical` clean. Reproduce and confirm or refute
each claim with pasted command output. Note the 2 non-critical advisories: confirm
they are genuinely below the critical merge gate and not maskable by a bump.

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
- Write /home/runner/work/_temp/openhands/27581356322-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27581356322-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-44/run-27581356322-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 44
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27581356322
