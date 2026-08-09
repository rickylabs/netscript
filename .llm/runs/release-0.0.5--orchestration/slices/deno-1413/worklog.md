# Worklog: Deno 2.9.5 toolchain standardization (#1413)

## Design

### Public surface

- No new export, command, option, dependency, or entrypoint.
- Generated workspace `package.json`, README recovery guidance, and verifier diagnostics expose the
  canonical Deno pin already owned by `SCAFFOLD_DEFAULTS.DENO_VERSION`.

### Domain vocabulary and ports

- `SCAFFOLD_DEFAULTS.DENO_VERSION` — the existing immutable scaffold pin.
- No new types, interfaces, abstractions, or ports.
- Existing Archetype-6 spine/extension axes are untouched; this slice changes only a leaf constant
  and consumers of that constant.

### Constants

- `SCAFFOLD_DEFAULTS.DENO_VERSION = '2.9.5'` is the only scaffold pin.
- Workflow setup pins and `.github/toolchain.env` repeat the operational value because GitHub YAML
  cannot import the TypeScript constant; the final residue audit is their fitness check.

### Commit slice

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Standardize and behaviorally prove Deno 2.9.5 | focused scaffold tests; required owner gates; exact RED/GREEN proof; pin/lock audits | audited `.github`, CLI scaffold, toolchain skill/mirror, this slice directory |

### Deferred scope

- IMPL-EVAL, CI, merge, canary dispatch, release publication, Aspire, containers, and runtime E2E.

### Contributor path

Change the scaffold runtime pin only in `scaffold-defaults.ts`; generators import it and tests assert
against it. Change agent guidance only in `.agents/skills/netscript-deno-toolchain/SKILL.md`, then
run the Claude skill sync generator.

## PLAN-EVAL

`PLAN-EVAL: N/A` — recorded before implementation. The owner supplied a complete audited file map,
fixed upstream facts, exact behavioral command/version, explicit exclusions, required gates, branch,
push refspec, PR metadata, and evaluator ownership. No architecture, sequencing, or trade-off
decision remains that could force rework; a ceremonial evaluator would add no plan information.

## Progress

| Time | Step | Notes |
| --- | --- | --- |
| 2026-08-09 | Bootstrap/research | Branch clean at `origin/main@399f60185`; audited 21 `.github` pins across 11 files. |
| 2026-08-09 | Environment drift | Expected root-owned Deno 2.9.3; actual user-owned Deno 2.9.5. Scratch-only 2.9.3 binary required for RED proof. |
| 2026-08-09 | Implementation | Updated 21 `.github` pins, the scaffold constant/derived consumers, canonical toolchain skill, and generated Claude mirror. |
| 2026-08-09 | Behavioral RED | Deno 2.9.3 rejected the exact `deno add --minimum-dependency-age=0 ...canary.17` command; raw exit 1. |
| 2026-08-09 | Behavioral GREEN | Deno 2.9.5 accepted the identical add command and wrote the exact canary; raw exit 0. See `red-green-proof.md`. |

## Gate results

| Gate | Exit | Result | Evidence |
| --- | ---: | --- | --- |
| Exact 2.9.3 flag RED | 1 | PASS (expected RED) | `red-green-proof.md` |
| Exact 2.9.5 explicit-canary GREEN | 0 | PASS | `red-green-proof.md`; resulting `deno.json` pins `0.0.5-canary.17` |
| Claude mirror generation | 0 | PASS | `deno task agentic:sync-claude`; 18 skills / 22 mirrored files |
| Focused scaffold tests | 0 | PASS | 31 passed, 0 failed |
| `deno task check` | 0 | PASS | 2,680 files; 23 batches; 0 failed batches/occurrences |
| `deno task test` | 0 | PASS | 3,052 passed (575 steps), 0 failed, 17 ignored |
| `deno task lint` | 0 | PASS | 1,849 files; 0 occurrences (configured task excludes CLI) |
| Focused CLI lint wrapper | 0 | PASS | 5 changed TS files; 0 occurrences |
| `deno task fmt:check` | 0 | PASS | 1,999 files; 0 findings (configured task excludes CLI) |
| Focused CLI format wrapper | 0 | PASS | 5 changed TS files; 0 findings |
| `deno task quality:gate` | 0 | PASS | Quality scan clean; configured doctrine/dependency gates green with existing warnings |
| `deno task arch:check` | 0 | PASS | Required configured architecture gate; existing non-failing warnings only |
| Claude mirror parity + surface validator | 0 | PASS | 18 skills / 22 mirrors; all five validator checks green; lock unchanged after hooks |
| `.github` residue audit | 0 | PASS | 0 remaining 2.9.0/2.9.3 pins; 21 Deno 2.9.5 pins |
| Lockfile audit | 0 | PASS | no changed `deno.lock` at any depth |
| `git diff --check` | 0 | PASS | no whitespace errors |

### Additional finding (not an owner-required verdict command)

`deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/cli` exited 1 with 50
existing findings, none naming a changed file. Most are the scanner's `describe/it/expect` match
against untouched Deno tests; the report also repeats the doctrine's existing `@netscript/cli`
`Restructure` verdict. No allowance, suppression, or unrelated repair was added. The repository's
required configured `deno task arch:check` and `deno task quality:gate` both exited 0.

## Literal and lock audit

Changed:

- All 21 Deno pins under `.github` (11 files) to 2.9.5.
- The canonical scaffold constant to 2.9.5; README and three test sites now derive from it.
- The canonical toolchain skill's current repo version plus generated Claude mirror.

Deliberately retained:

- `packages/telemetry/tests/hono/otel_middleware_test.ts`,
  `packages/service/tests/hono-tracing_test.ts`, and `plugins/workers/jobs/job-tools_test.ts` use
  `npm:@opentelemetry/context-async-hooks@^2.9.0`; these are dependency versions, not Deno pins.
- `.llm/tools/agentic/runtime/contract_test.ts` mutates the desired runtime state to `2.9.0` as an
  intentionally invalid strict-vocabulary fixture; its test passed.
- The toolchain skill's catalog paragraph retains the historical statement that the catalog rule
  was re-verified on 2.9.0; it is evidence history, not the current repo pin.
- Every lockfile is byte-unchanged relative to `origin/main`.

No local system upgrade was required: the installed binary was already user-owned Deno 2.9.5. The
2.9.3 RED binary was created only in the external scratch directory.

## Handoff

The milestone orchestrator must launch the mandatory separate-session IMPL-EVAL after this lane
opens the draft PR and hands back. This Tier-D lane does not self-certify or merge.
