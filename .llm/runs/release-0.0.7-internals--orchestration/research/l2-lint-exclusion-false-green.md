# Research — L-2 mixed lint-batch exclusion false green

**Scope: research and bounded scope recommendation only.** No product, config, or workflow source
mutated; no issue or PR created or edited; no author or evaluator launched; no runtime lease; no
other lane touched. All reproductions ran on a `git archive` copy of exact main under the
supervisor's job tmp.

| Field                | Value                                        |
| -------------------- | -------------------------------------------- |
| Baseline             | `cf648f1ff973d74c213bb125a6f5f5b9328e693b` (main; the #1663 merge) |
| Central checkpoint   | `9e344a57c9e10b3f5671e12f8b7937405aa9f36d`   |
| Topic head at start  | `6de5395cf4284e4b33b02df161c56e0b22585b80`   |
| Deno                 | 2.9.5                                        |
| Verdict              | **NEEDS_SCOPE_DECISION**                     |

## The deferred claim, re-derived rather than repeated

The parked L-2 note said: root `lint.exclude` contains `.llm/`, so `deno lint` silently drops every
`.llm` tooling file, and *"in a mixed wrapper batch the false-green guard cannot fire."*

That is **directionally right but imprecise**, and one of its supporting details no longer holds at
this baseline. Re-derived from source and executed commands, the situation separates into **three
distinct defects on four distinct surfaces**, only one of which is L-2 proper.

## Surface separation

### Already fixed by #1663 — not in scope, do not re-litigate

- `fmt:check` **task** no longer carries the doctor-family `--exclude` (cycle-2 advisory A1).
- Root `fmt.exclude` gained the doctor family for **raw-walk protection only**, deliberately not
  top-level `exclude` (cycle-3 F1).
- Both wrappers gained **child-only marker** semantics and **memoized nearest-config batching**.

The batching change matters here: it groups files by effective nearest config, which makes many
excluded sets land in their own batch — where the existing guard *does* fire. That incidentally
narrowed L-2's blast radius and is why the original claim over-states the failure.

### D1 — L-2 proper: partial-exclusion false green (wrapper behavior) — **LIVE**

`.llm/tools/run-deno-lint.ts:724` already refuses a false green:

> `N deno lint batch(es) matched the wrapper selection but were excluded by Deno; refusing a false-green gate.`

But that guard is **per batch and all-or-nothing**: it detects a batch in which *every* file was
excluded (Deno emits `No target files found`). A batch in which *some* files were excluded produces
normal output and exit 0, so the guard cannot fire and `filesSelected` overstates what Deno opened.

**Smallest honest defect statement:**

> `run-deno-lint.ts` reports `failedBatches: 0` and exits 0 for a batch in which Deno silently
> dropped some — but not all — of the files the wrapper selected, because the false-green guard only
> recognises a *wholly* excluded batch. Whether the guard fires therefore depends on batch
> composition, not on whether coverage was lost.

**Executed proof.** `.llm/tools/__l2probe.ts` containing `export function probe(x: any)`:

| Command                                                                              | Result |
| ------------------------------------------------------------------------------------- | ------ |
| Control — same code placed at `.github/scripts/`, `deno lint <file>`                  | `error[no-explicit-any]`, exit 1 — a genuine finding |
| `deno lint .llm/tools/__l2probe.ts` (root `lint.exclude` has `.llm/`)                 | `error: No target files found.`, exit 1 |
| Wrapper, **pure** `.llm` selection                                                    | exit **2** — guard fires |
| Wrapper, `--root .llm/tools --root .github/scripts` (328 files, 2 batches)            | exit **2** — guard fires, `excludedBatches: 1` |
| Wrapper, **`--file .llm/tools/__l2probe.ts --file .github/scripts/ci-classify-changes.ts`** | **`filesSelected: 2, batches: 1, failedBatches: 0`, EXIT 0** — **false green**; the `any` was never linted |
| Same two files with `--batch-size 1`                                                  | exit **2** — guard fires again |

The last two rows are the defect: **identical file set, opposite verdict, decided only by batch
size.** `.github/scripts/*.ts` is the reachable mixing partner because those files share the **root**
config with `.llm/` (no nested `deno.json` above them), so nearest-config batching does not separate
them.

### D2 — root `lint` task configuration over-exclusion — **LIVE, separate, cheap**

The root `lint` task still carries `packages/mcp/tests/fixtures/doctor/` in its `--exclude` regex —
the exact asymmetry #1663 removed from `fmt:check`. This is **honest but over-broad**: the files
leave the wrapper's own selection, so the count drops and nothing is misreported.

| Root `lint` task shape                    | Result                                        |
| ------------------------------------------ | --------------------------------------------- |
| As shipped (doctor `--exclude` present)   | `filesSelected: 2037`, 35 batches, 0 failed, exit 0 |
| Doctor `--exclude` removed                | `filesSelected: 2041`, 36 batches, 0 failed, **exit 0** |

**Removing it is a pure +4-file coverage gain with no remediation**: the four healthy doctor TS files
lint clean under their nested `doctor/healthy/deno.json`, and the gate stays green.

### D3 — config-level `lint.exclude` — partly inert, partly the enabler of D1

`lint.exclude = ['.llm/', 'tools/', 'packages/cli/', 'packages/mcp/tests/fixtures/doctor/']`.

- The **doctor** entry is **inert** for `doctor/healthy/**` under nested-config precedence (that
  directory's own `deno.json` becomes effective for explicitly named files), which is why D2's
  removal works at all.
- `.llm/` and `tools/` are what make D1 *reachable*: they are large trees whose nearest config is
  root, so wrapper selections over them are silently dropped by Deno while the wrapper counts them.

### Package-local lint — separate surface, not in scope

`packages/fresh-ui/deno.json` invokes the wrapper with an explicit `--config deno.json`, which
short-circuits nearest-config resolution. Package-local lint tasks are governed by their own configs
and are **not** implicated in D1/D2/D3. Any fix must not change their behaviour.

## What is *not* exposed today

The gate catalog (`.llm/tools/gates/catalog.ts:31`) maps `lint` → `deno task lint`, which roots only
at `packages` and `plugins`. **It never selects `.llm/` or `tools/`, so the CI lint gate is not
currently producing a false green.** D1 is a latent wrapper defect, not a live CI failure — that
bound should be stated in any issue so severity is not overclaimed.

## Why it still matters: the shipped consumer surface

`run-deno-lint.ts` is listed in `.llm/tools/consumer-tools.json` and embedded **5×** in the published
`packages/cli/src/kernel/assets/agent-tools.generated.ts`, and is referenced in
`skills.generated.ts`. The false-green semantics therefore **ship to consumers**, who run the tool
against their own projects with their own `exclude` lists — where mixed batches are ordinary. That
raises D1 above internal-tooling housekeeping.

It also fixes the publish consequence of any repair: **editing the wrapper regenerates the barrel and
changes `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`**, exactly the #1663 cycle-2 F1 lesson. `check:assets-barrel`
is therefore mandatory in the gate set, and the `@netscript/cli` JSR row must disclose the embedded
tool-text and hash delta with no export/API change.

## Issue ownership

**No open issue owns this.** The closest relative is **#1542** (*"quality:gate roots omit published
packages, so a green gate is not proof they were scanned"*) — same false-green family, but it is
**CLOSED/shipped** at 0.0.7 and mechanically different: #1542 was about *roots omitting* surfaces,
D1 is about *a selected file being dropped inside a batch*. #1328 is likewise closed and unrelated in
mechanism. **A new issue is required**; D2 can ride the same issue as a second acceptance box or be
split, at the coordinator's discretion.

## Candidate file envelope (recommendation, not a granted surface)

| Path                                                | Why                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| `.llm/tools/run-deno-lint.ts`                       | D1 — detect partial exclusion, not only whole-batch exclusion    |
| `.llm/tools/run-deno-lint_test.ts`                  | D1 — persistent coverage for the mixed-batch case                |
| `deno.json`                                         | D2 — remove the doctor `--exclude` from the root `lint` task     |
| `packages/cli/src/kernel/assets/agent-tools.generated.ts` | canonical regeneration only, never hand-edited             |

Four paths. **`.llm/tools/run-deno-fmt.ts` should be examined for the same partial-exclusion gap and
added only if it proves defective** — it was not tested here because fmt's finding model differs;
that determination belongs in the plan, not in this recommendation.

## Baseline and negative controls the plan must require

- **Baseline:** root `lint` task `filesSelected: 2037`, 35 batches, 0 failed, exit 0.
- **D2 after-state:** `2041` / 36 batches / 0 failed / exit 0 — the +4 healthy doctor files.
- **D1 negative control (must go red):** the two-file mixed batch above must exit non-zero, or report
  the dropped file, rather than exiting 0.
- **D1 must-not-regress:** the pure-`.llm` selection must still exit 2; `--batch-size 1` must still
  exit 2; the wrapper's existing empty-selection refusal must survive.
- **Idempotence:** unchanged inputs must produce identical selection counts; restore any mutated file
  byte-exactly and verify by hash.

## Applicable / non-applicable gates

**Applicable:** `check`, `test` (wrapper tests), `lint`, `quality-job` / `quality:scan`
(`allowCount` must remain **7**), **`check:assets-barrel`** (mandatory — published barrel),
`publish-dry-run` + per-member JSR audit for `@netscript/cli`.

**Not applicable:** `scaffold.runtime` (coordinator-waived for this surface class; no Aspire, Docker,
`e2e:cli`, or mutex), `docs:accuracy` and docs-source-format (no docs source in the envelope),
`@netscript/mcp` JSR audit (no MCP surface change).

## The design choice the coordinator must make

D1 has two honest repairs, and they are not equivalent:

1. **Fail closed on any partial exclusion** — compare the file set the wrapper passed against what
   Deno reports processing, and refuse when they differ. Strongest, matches the leaf's philosophy,
   but risks turning today's green root gate red if any legitimate exclusion is in play, and depends
   on parsing Deno's `Checked N files` reliably.
2. **Report the delta without failing** — surface `filesSelected` versus files actually linted in the
   structured report, and let the caller decide. Cannot produce a surprise red, but leaves a green
   gate that a reader must interpret.

**Recommendation: option 1**, scoped so it fires only when files were dropped *silently*, with D2
landing first so the root gate's coverage is already correct when the stricter guard arrives. But
this is a genuine trade and the choice is the coordinator's, not this lane's.

## Verdict

**NEEDS_SCOPE_DECISION.** The defect is real, reproduced, and precisely characterised, and the
smallest honest statement is available. It is not a live CI false green today, but it ships to
consumers, and its repair carries a published-surface consequence. No issue owns it, and the fix
shape is a real design choice — so this lane stops at recommendation and does not open the issue or
freeze a surface.
