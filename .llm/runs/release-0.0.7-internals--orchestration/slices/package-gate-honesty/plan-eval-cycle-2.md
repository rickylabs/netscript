# PLAN-EVAL cycle 2 — release-0.0.7-internals--orchestration/slices/package-gate-honesty

- Plan evaluator session: Claude Code `517ac0e7-9951-40ec-ab48-d0175a6d7ebb` / 2026-08-15
- Run: `release-0.0.7-internals--orchestration/slices/package-gate-honesty`
- Surface / archetype: `packages/cli` E2E harness + `packages/mcp` + root `deno.json` + `.llm/tools`
  fmt/lint wrappers / Archetype 6 (CLI / Tooling), supporting MCP member A2
- Scope overlays: `docs`
- **Evaluated head:** `df1d7a96d7fd4ecca0bd61710ba90ff67449da0b` (repaired plan head)
- **Immutable base:** `05fc3132b6800a85eb6152691a961b658962571b`
- **Prior cycle:** cycle 1 `FAIL_PLAN` at evaluator commit
  `be2b1872823cbbb07a393633fcccb684f753afc1`, preserved verbatim as `plan-eval-cycle-1.md` in this
  directory.

## Identity, independence, route

| Field                           | Value                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Model                           | Anthropic Claude Fable 5 (`claude-fable-5`)                                                                                               |
| Session ID                      | `517ac0e7-9951-40ec-ab48-d0175a6d7ebb`                                                                                                    |
| `bridgeSessionId`               | `cse_01McQHBVtbuX4WYDsaVXEYAn` (Remote Control, non-empty)                                                                                |
| Daemon short / job              | `517ac0e7` (`~/.claude/jobs/517ac0e7/state.json`, backend `daemon`)                                                                       |
| PID                             | shell parent `795739` (`claude bg-spare`, spare claim `dc2413ce`); `state.json` carries no `pid` key                                      |
| cwd                             | `/home/codex/repos/netscript-007-package-gate`                                                                                            |
| Requested route                 | formal PLAN-EVAL cycle 2: Anthropic / Fable 5 / medium / `--remote-control`                                                               |
| Observed route (`respawnFlags`) | `--effort medium --permission-mode bypassPermissions --remote-control --name "NetScript 0.0.7 #1663 PLAN-EVAL c2" --model claude-fable-5` |
| Route verdict                   | matched (native opposite-family binding for a Codex GPT-5.6 Sol-authored plan)                                                            |

Independence: fresh Claude session; not the Codex author thread
`01a004ec-86a6-7c21-8886-81c09de099f5`, not the cycle-1 evaluator session `9078ecb6-…`, not the
topic supervisor. Inputs were the committed run artifacts, the PR, the tree, and my own executions.

## Target verification

| Check                                                      | Observed                                                                                                                                                                                       |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local `HEAD`                                               | `df1d7a96d7fd4ecca0bd61710ba90ff67449da0b`                                                                                                                                                     |
| `git ls-remote origin refs/heads/fix/package-gate-honesty` | `df1d7a96d7fd4ecca0bd61710ba90ff67449da0b`                                                                                                                                                     |
| PR #1663 `headRefOid`                                      | `df1d7a96d7fd4ecca0bd61710ba90ff67449da0b` — no mismatch                                                                                                                                       |
| `git diff --stat 05fc3132b HEAD`                           | 8 files, +992/-0, all under this run dir; **no product/config path changed**                                                                                                                   |
| PR state                                                   | draft; base `main`; milestone `0.0.7`; labels `type:fix`, `area:tooling`, **`status:research`** (brief expected `status:plan-eval` — supervisor's to fix, not mine)                            |
| PR body `## Slices`                                        | S1 marker/batching/normalization, S2 CLI cwd, S3 `closeScoreGap`, S4 gates — **now reconciles** with `plan.md` S1–S4 (cycle-1 F2 fixed)                                                        |
| Tree at exit                                               | `git status --short` empty; no `.deno-fmt-lint-ignore` anywhere outside `.llm/tmp/`; `healthy/netscript.config.ts` still single-line/single-quoted; `broken/deno.json` sha256 `6815999d…37361` |

All reproductions ran on `git archive HEAD` copies under `$CLAUDE_JOB_DIR/tmp/` (never the
checkout), on Deno 2.9.5. The author's own scratch prototype
(`.llm/tmp/package-gate-honesty-plan-proof.xd8Msn/`) was read only to learn the proposed wrapper
code; every number below is my own run.

## Checklist results

| Plan-Gate item                          | Result                   | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | PASS                     | `research.md` re-baselined @ `05fc3132b`; R8 correctly re-recorded as falsified; R14/R15 numbers (114/2 batches, one honest finding, lint green, doctor 4/4) **reproduced by execution** (§1–§3 below). R14's "no style conflict" wording is inaccurate (advisory A2) but not load-bearing.                                                                                                                                                                                          |
| Decisions locked                        | PASS                     | L1–L10 stated with rationale. L3 now holds by execution: child-only marker + nearest-config batching reach the exact acceptance commands green (§1–§4). L7 ("wrapper behavior changes only at selection") is true of the wrappers but omits the consumer-shipped copy (F1).                                                                                                                                                                                                          |
| Open-decision sweep                     | **FAIL**                 | Evaluator-run sweep finds one decision the plan did not flag and that forces rework if deferred: `.llm/tools/run-deno-lint.ts` is embedded verbatim in the **published** `packages/cli/src/kernel/assets/agent-tools.generated.ts`; editing it under the twelve-path surface makes CI `assets-barrel` red and requires a thirteenth path (F1, executed). Automatic unchecked box.                                                                                                    |
| Commit slices (< 30, gate + files each) | PASS (with F1 reconcile) | Four ordered slices, each with proof/files/gates (`plan.md` S1–S4); numbering matches the PR body. S1's file list and S4's gate list must absorb F1.                                                                                                                                                                                                                                                                                                                                 |
| Risk register                           | PASS                     | `plan.md` risk table; row 1–2 correctly anticipate parent-family/blanket skips and the "exclude the healthy file" temptation.                                                                                                                                                                                                                                                                                                                                                        |
| Gate set selected                       | PASS (with F1 gap)       | Frozen contract gates mapped; `scaffold.runtime` correctly `n/a` by coordinator waiver. **Missing:** the CI "Generated asset freshness" gate (`deno task check:assets-barrel`, `.github/workflows/ci.yml:376-381`), which the plan's `ci:quality` row does not include (`deno.json:21-32`) and which F1 turns red.                                                                                                                                                                   |
| Deferred scope explicit                 | PASS                     | `plan.md` § Explicit deferrals / non-scope.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| jsr-audit (package/plugin waves)        | **FAIL**                 | `@netscript/cli` row states "None; all edits are under publish-excluded `e2e/`". False once `run-deno-lint.ts` changes: `packages/cli/src/kernel/assets/agent-tools.generated.ts` (published under `src/**/*.ts`, `packages/cli/deno.json:57-68`) must be regenerated, changing the embedded tool text and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` (F1). The `@netscript/mcp` row and the two-member audit plan otherwise remain proportionate; baseline CLI debt is not mislabeled green. |

## The eight specific proofs (re-derived, not re-read)

### 1. Child-only marker semantics — PASS by code reading + execution

The proposed mechanism (author prototype, to be implemented in S1) checks for
`<dir>/.deno-fmt-lint-ignore` at the top of `collectRoot` and returns before descending — so only
the marked directory's own subtree leaves selection; the parent walk and every sibling continue.
Executed on my archive copy with the marker in `doctor/broken/` only: **115 → 114** for both
wrappers, and all four `doctor/healthy/**` TS files were individually named by findings in a single
run (§3). A `--root` pointed directly at the marked directory yields empty selection and the
wrapper's existing non-empty refusal (honest red, not silent green). Explicit `--file`/file-`--root`
arguments bypass the marker — consistent with the plan's "automatic selection" wording. A
parent-family or blanket `tests/fixtures` skip would drop the four healthy files (110) and cannot
satisfy the plan's "114 with exactly one file removed" condition; the plan's wrapper-test rows name
both directions (marked subtree skipped, unmarked sibling still selected). Sufficient at plan level.

### 2. Nearest-config batching — PASS, and it is genuinely load-bearing

Executed control: HEAD wrapper (single batch) with only the broken subtree removed via
`--exclude '^packages/mcp/tests/fixtures/doctor/broken/'` → 114 selected, **1 failed batch, exit
1**:

```text
error: Command resolved to multiple config files. Ensure all specified paths are within the same workspace.
  First: file:///…/repo-copy/deno.json
  Second: file:///…/repo-copy/packages/mcp/tests/fixtures/doctor/healthy/deno.json
```

So removing the malformed file alone is not enough: Deno refuses explicit argv spanning two
workspaces (`healthy/deno.json` is a non-member nested workspace root). Grouping by effective
nearest `deno.json`/`deno.jsonc` (walk from the file's directory up to `cwd`) yields two groups (110
under `packages/mcp/deno.json`, 4 under `healthy/deno.json`) → fmt 114/2 batches, lint 114/2
batches, no crash. Properties checked: files are partitioned by `Map` then `flatMap`-ed — none
dropped or merged; order changes only across groups (irrelevant to per-file findings); no empty
group can exist; a group whose nearest config is malformed still crashes but as an attributable
failed batch of its own (honest red, no cross-poisoning); files whose nearest config lies above
`cwd` share the `<no-config>` key, which is still one consistent group; `--config` short-circuits to
plain chunking (Deno disables discovery). Over-splitting a single workspace into root/member groups
is harmless (same resolution per file). Cost: one `stat` pair per ancestor directory per file —
negligible at 114, acceptable at root scale (advisory A4: memoize per directory).

### 3. The 114 count and the collateral claim — PASS by execution

My run after normalization with a formatting defect injected into each of the three generated
registries: `filesSelected:114, batches:2, findings:4`, naming
`healthy/.netscript/generated/plugin-ai/agents.registry.ts`, `…/plugin-ai/tools.registry.ts`,
`…/plugin-workers/job-registry.ts`, **and** `healthy/netscript.config.ts` (the genuine finding) —
all four healthy TS files proven selected in one invocation; registries restored byte-exact (`cmp`
vs checkout). Exactly one file leaves selection: `broken/netscript.config.ts`. The plan's proof
(three injected + one genuine) is sufficient; the fourth file is equally covered.

### 4. Both wrappers green with no extra flags — PASS by execution

Exact commands, unpiped exit status, on the copy with marker + batching + `deno fmt` applied to
`healthy/netscript.config.ts` only:

- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` →
  **EXIT 0**, `filesSelected:114, batches:2, failedBatches:0, findings:0`.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx` →
  **EXIT 0**, `filesSelected:114, batches:2`, 0 occurrences.

Also green with the plan's root `deno.json` `exclude` entry added (wrapper ignores it, as cycle 1
proved). No `--exclude`, no `--config`.

### 5. The twelfth path is formatting-only — PASS, with one wording correction

`deno fmt packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts` in the copy produced
exactly the plan's diff (object expanded, `'workers'` → `"workers"`). `deno eval --no-config` import
of original vs formatted: both `{"plugins":["workers"]}`, equal. Doctor reads this file only through
`/\bplugins\s*:/` (`project-wiring-doctor-family.ts:101-103`), which the formatted text still
matches; `doctor-families_test.ts` **4 passed / 0 failed** with the marker present.
Serialized-export equality plus "the diff is what `deno fmt` emitted" is sufficient for a
formatting-only claim.

Correction (advisory A2): R14's "there is no style conflict … the source is simply unformatted" is
inaccurate. Under the repo root config (`singleQuote: true`, `lineWidth: 100`) the **original** file
is correctly formatted (`deno fmt --check --config deno.json` on the original passes; baseline
`--config deno.json` run was 115/0 findings), and the **formatted** file is flagged. The finding
exists because the wrapper's nearest-config semantics make `healthy/deno.json` (Deno defaults:
double quotes, width 80) authoritative for that subtree. That is the correct choice for a fixture
that models a consumer project, but the plan should say so, because it also means the root
`deno.json` `exclude` is **not** merely "non-load-bearing": a raw root `deno fmt` walk applies root
style to that subtree (executed: raw `deno fmt --check packages/mcp` sees 136 files / 6 unformatted
without the exclude vs 127 / 4 with it) and would flip the file back, re-redding the wrapper. Keep
the exclude and state its real role.

### 6. `broken/deno.json` byte-identical; negative controls fire and restore — PASS by execution

sha256 `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361` in checkout and copy. Fmt
negative (`export const   y=2` appended to `packages/mcp/mod.ts`) → EXIT 1, 114/2, one finding
naming `packages/mcp/mod.ts`; lint negative (unused binding in `packages/mcp/cli.ts`) → EXIT 1,
114/2, one `no-unused-vars` occurrence, no crash batch. Both restored and `cmp`-equal to the
checkout.

### 7. Publish/JSR proportionality — **FAILS on the CLI row** (F1)

`.llm/tools/**` is not itself published, but `.llm/tools/run-deno-lint.ts` is a consumer-installed
tool (`.llm/tools/consumer-tools.json:18-22`) embedded verbatim by
`.llm/tools/generate-cli-assets-barrel.ts` into
`packages/cli/src/kernel/assets/agent-tools.generated.ts`, which `@netscript/cli` publishes
(`src/**/*.ts`) and `netscript agent init` installs into consumer projects
(`init-agent_test.ts:527-556`). Executed on a full `git archive HEAD` copy:

- control (unmodified copy): `deno task gen:assets-barrel` → barrel identical to HEAD (fresh);
- with the prototype `run-deno-lint.ts` in place: `deno task gen:assets-barrel` → EXIT 0,
  `agent-tools.generated.ts` **CHANGED** (contains `nearestConfig`;
  `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` changes); `embedded.generated.ts` and `skills.generated.ts`
  unchanged.

Consequences the plan does not account for: (a) CI job "Generated asset freshness"
(`run-gate.ts --gate assets-barrel` = `deno task check:assets-barrel`, `ci.yml:376-381`) fails
unless the barrel is regenerated; (b) regenerating edits a **thirteenth path** that is published CLI
source, contradicting the surface bound, the "Frozen contract entries deliberately not touched"
bullet ("no other CLI file, … generated asset … is edited") and the JSR table's `@netscript/cli`
"None"; (c) the consumer-installed copy of `run-deno-lint.ts` acquires marker + nearest-config
batching semantics — a consumer-facing behaviour change that the plan's L7/A1 wording does not
mention. `run-deno-fmt.ts` is not in `consumer-tools.json` (only mentioned as text in
`skills.generated.ts`), so the two wrappers' publish exposure differs. `@netscript/mcp` remains
proportionate as planned.

### 8. Surface discipline — twelve paths one-for-one, but the bound is not implementable green

The twelve rows in `plan.md` match the coordinator grant described in the brief (6 original + 4
wrapper files + marker + healthy config), the thirteenth-path guard is present, and slice numbering
now reconciles with the PR body. Because of F1 the bound as written cannot be implemented with CI
green; the coordinator must decide between (i) granting
`packages/cli/src/kernel/assets/agent-tools.generated.ts` (regenerated only, via
`deno task gen:assets-barrel`, verified by `check:assets-barrel`) as a thirteenth path and recording
the CLI publish delta, or (ii) removing the two lint-wrapper paths (and the marker's lint clause)
from this leaf, leaving lint's identical crash to a follow-up. That is a plan decision, not an
implementation detail.

## Open-decision sweep (evaluator-run)

1. **Barrel / thirteenth path** — unflagged, forces rework if deferred (F1). → `FAIL_PLAN`.
2. **Root task-level exclusion** (`deno.json:140` `fmt:check`
   `--exclude … packages/mcp/tests/fixtures/doctor/ …`) — `deno.json` is already in-surface; after
   S1 this wrapper-level parent-family exclusion becomes the same silent over-exclusion of the four
   healthy files at the root gate that R9 calls a "false-green blind spot". Not rework-forcing
   (advisory A1) but the plan should state whether it is removed in the same `deno.json` edit or why
   it stays.
3. Everything else in the plan's sweep holds.

## Verdict

`FAIL_PLAN`

### Required fixes

1. **F1 — published asset barrel (`plan.md` surface table, "not touched" list, JSR table
   `@netscript/cli` row, S1 files, S4/gate rows 3 and 6, L7).** Observed:
   `.llm/tools/run-deno-lint.ts` is embedded in
   `packages/cli/src/kernel/assets/agent-tools.generated.ts`; `deno task gen:assets-barrel` on a
   HEAD copy with the planned lint wrapper changes that published file, and CI `check:assets-barrel`
   diffs it (evidence §7). Required: coordinator decision recorded in `drift.md` — either grant the
   regenerated barrel as an exact thirteenth path (regeneration-only, no hand edit; add
   `check:assets-barrel` to the gate plan; state the `@netscript/cli` publish delta honestly in the
   JSR table: embedded tool text + `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`, no export/API change; note the
   consumer-installed tool's new marker/batching semantics), or drop the lint-wrapper paths from
   this leaf and re-prove the remaining surface. Update the surface bound, the "not touched" bullet,
   and L7/A1 accordingly.

### Advisory (do not block a PASS on their own)

- **A1** — decide and record the fate of the `fmt:check` task-level doctor exclusion
  (`deno.json:140`) now that the wrapper is marker/config-aware; leaving it is a silent
  parent-family skip at the root gate.
- **A2** — reword R14 / L10 / drift: the healthy finding is root-style-vs-fixture-default-style, not
  "simply unformatted"; the fixture's own config is authoritative under nearest-config semantics,
  and the root `deno.json` `exclude` is what keeps raw root walks from reverting it (§5).
- **A3** — PR carries `status:research`; brief and phase say `status:plan-eval` (supervisor).
- **A4** — memoize `nearestConfig` per directory before this runs at root scale (implementation
  note).

## Notes

- Nothing was executed against the checkout; no product/config path, marker, or fixture was mutated
  in the tree (verified at exit). No `scaffold.runtime`, Aspire, Docker, or `e2e:cli` was run. No
  labels, issues, ready-state, or central state were changed.
- Cycle count: this is PLAN-EVAL cycle 2 of the two allowed. Per `plan-gate.md`, a further
  `FAIL_PLAN` would escalate to the user; F1 is a single, bounded coordinator decision.
