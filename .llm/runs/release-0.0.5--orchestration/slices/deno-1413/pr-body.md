## Summary

Standardizes NetScript's CI, release/publish workflows, and generated scaffold runtime on Deno
2.9.5. It also records the exact dependency-age behavior that makes this a release prerequisite:
2.9.3 rejects the flag, while 2.9.5 installs the explicitly pinned fresh canary.

## Scope

- Archetype / area: tooling + Archetype 6 CLI scaffold leaf
- Closes #1413

## Slices

- [x] S1 standardize and behaviorally prove Deno 2.9.5

## Exact RED → GREEN proof (verbatim)

Scratch root: `/tmp/netscript-deno-1413-proof.0m0OLw` (outside the repository).

### RED — Deno 2.9.3

```bash
cd /tmp/netscript-deno-1413-proof.0m0OLw/red
../deno-2.9.3 --version
../deno-2.9.3 add --minimum-dependency-age=0 jsr:@netscript/service@0.0.5-canary.17
```

```text
deno 2.9.3 (stable, release, x86_64-unknown-linux-gnu)
v8 14.9.207.2-rusty
typescript 6.0.3
error: unexpected argument '--minimum-dependency-age' found

  tip: to pass '--minimum-dependency-age' as a value, use '-- --minimum-dependency-age'

Usage: deno add [OPTIONS] [packages]...

RAW_EXIT_CODE=1
```

### GREEN — Deno 2.9.5

```bash
cd /tmp/netscript-deno-1413-proof.0m0OLw/green
/home/codex/.deno/bin/deno --version
/home/codex/.deno/bin/deno add --minimum-dependency-age=0 jsr:@netscript/service@0.0.5-canary.17
```

```text
deno 2.9.5 (stable, release, x86_64-unknown-linux-gnu)
v8 15.0.245.2-rusty
typescript 6.0.3
Created deno.json configuration file.
Add jsr:@netscript/service@0.0.5-canary.17
RAW_EXIT_CODE=0
{
  "imports": {
    "@netscript/service": "jsr:@netscript/service@0.0.5-canary.17"
  }
}
```

The bypass was used only in this scratch release-verification proof. No repository default gained
`--minimum-dependency-age=0`, and no command was switched to `@canary`.

## Validation

| Gate | Raw exit | Result |
| --- | ---: | --- |
| Focused scaffold tests | 0 | 31 passed, 0 failed |
| `deno task check` | 0 | 2,680 files; 23 batches; 0 findings |
| `deno task test` | 0 | 3,052 passed, 0 failed, 17 ignored |
| `deno task lint` + focused changed-CLI wrapper | 0 / 0 | no findings |
| `deno task fmt:check` + focused changed-CLI wrapper | 0 / 0 | no findings |
| `deno task quality:gate` | 0 | green; existing non-failing warnings only |
| `deno task arch:check` | 0 | green; existing non-failing warnings only |
| Claude mirror sync check + surface validator | 0 | 18 skills / 22 mirrors; all checks green |
| `.github` old-pin residue | 0 | zero 2.9.0/2.9.3 pins; 21 Deno 2.9.5 pins |
| Lockfile diff | 0 | no lockfile changed |
| `git diff --check` | 0 | clean |

An additional direct whole-CLI doctrine scan exits 1 on 50 existing findings in untouched files
(primarily its `describe/it/expect` detector over Deno tests). This did not alter the required
configured `arch:check`/`quality:gate` verdicts, and this PR adds no allowance or suppression.

## Audited literals

- Changed every Deno pin under `.github`, the canonical scaffold constant and its derived
  README/tests, and the canonical/generated toolchain skills.
- Left the three `npm:@opentelemetry/context-async-hooks@^2.9.0` imports unchanged: they are npm
  dependency versions, not Deno pins.
- Left the agentic runtime contract test's `2.9.0` mutation unchanged: it is an intentionally
  invalid negative fixture and passes.
- Left the skill's historical 2.9.0 catalog-verification note unchanged; the current repo pin now
  states 2.9.5.
- The carried-in environment note drifted: `/home/codex/.deno/bin/deno` was already user-owned
  2.9.5, so no privileged/system upgrade was required.

## Harness

- Run dir: `.llm/runs/release-0.0.5--orchestration/slices/deno-1413/`
- `PLAN-EVAL: N/A` recorded before implementation because the owner supplied the complete
  mechanical contract, exact behavioral proof, audited surface, exclusions, and gates.
- Phase: implementation complete; mandatory separate-session IMPL-EVAL, CI, and merge remain with
  the milestone orchestrator. Do not merge before IMPL-EVAL passes.

## Drift / Debt

- Minor environment drift recorded: installed Deno was already user-owned 2.9.5, not root-owned
  2.9.3.
- No new or deepened architecture debt.

## Definition of Done

- [x] Every `.github` Deno pin is 2.9.5 and old-pin count is zero.
- [x] Scaffold metadata, generated README/verifier output, and tests derive from the canonical 2.9.5 constant.
- [x] Canonical toolchain skill and generated Claude mirror document fresh-prerelease behavior and the `@canary` limitation.
- [x] Exact 2.9.3 RED and 2.9.5 GREEN proof is recorded with raw commands, versions, exits, and written specifier.
- [x] All owner-required local gates are green and lockfiles are unchanged.
- [ ] Mandatory separate-session IMPL-EVAL passes at this final head.

```acceptance-evidence
issue: 1413
entries:
  - box-index: 1
    evidence: "PR Validation and .llm/runs/release-0.0.5--orchestration/slices/deno-1413/worklog.md: zero old pins; 21 Deno 2.9.5 pins."
  - box-index: 2
    evidence: "SCAFFOLD_DEFAULTS.DENO_VERSION plus focused scaffold tests: raw exit 0, 31 passed."
  - box-index: 3
    evidence: "agentic:sync-claude:check and validate-claude-surface: raw exit 0, 18 skills / 22 mirrors."
  - box-index: 4
    evidence: "PR Exact RED → GREEN proof and red-green-proof.md: 2.9.3 exit 1; 2.9.5 exit 0; exact 0.0.5-canary.17 written."
  - box-index: 5
    evidence: "PR Validation and worklog.md: all owner-required gates raw exit 0; no lockfile diff."
  - box-index: 6
    evidence: "Pending milestone-orchestrator separate-session IMPL-EVAL after this draft handoff."
```
