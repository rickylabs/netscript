## Summary

This PR classifies #1246 as an upstream Deno Windows npm materialization defect and implements the
0.0.5 NetScript mitigation. The project-local `node_modules/.deno` copy was missing a file that
remained present in Deno's shared cache, and a bare Deno npm import reproduced the failure outside
Aspire/Vite.

The closest open upstream report is [deno/deno#35804](https://github.com/denoland/deno/issues/35804),
with Windows auto-materialization failures on Deno 2.9.1 and 2.9.3. NetScript's independent capture
extends direct evidence to 2.9.4. The unresolved risk window is 2.9.1–2.9.4; this wording does not
claim a direct 2.9.2 reproduction. Deno 2.9.0 is the pre-window version already pinned in NetScript
CI and will be the generated Windows fallback.

## Scope

- Generates a fail-closed project-local npm materialization verifier.
- Runs it before generated root and Fresh/Vite development commands.
- Prints exact missing-file evidence and Windows/POSIX recovery commands.
- Pins generated projects to Deno 2.9.0 through `package.json` engines and documents the preflight.
- Executes hermetic incomplete/complete fixtures so detection cannot silently become a no-op.

Refs #1246.

Remaining scope for 0.0.6/upstream tracking: a Deno root-cause release, native Windows proof that the
frontend starts without manual repair, and Windows CI covering init → Aspire → frontend serving.

## Harness

- Run: `.llm/runs/fix-windows-node-modules-materialization--1246/`
- Archetype: 6 (CLI/tooling), frontend consumer overlay
- PLAN-EVAL: `COMPOSED_WAIVER` per milestone ruling D6; no local evaluator verdict is claimed
- Status: implementation and WSL consumer proof complete; composed milestone evaluation pending

## Validation

- [x] Generated verifier incomplete/complete execution tests — 2 passed, 0 failed
- [x] Focused CLI scaffold/template tests — 33 passed (19 steps), 0 failed
- [x] Full CLI package suite — 595 passed (484 steps), 0 failed
- [x] Scoped TypeScript check/lint/fmt — zero findings
- [x] CLI quality and architecture gates — quality clean; recorded CLI doctrine baseline debt only
- [x] Full `scaffold.runtime` one-pass smoke — 71 passed, 0 failed, cleanup passed
- [ ] Native Windows acceptance (deferred/unclaimed)

## Acceptance evidence

```yaml
acceptance-evidence:
  classification:
    status: satisfied
    evidence:
      - https://github.com/rickylabs/netscript/issues/1246
      - https://github.com/denoland/deno/issues/35804
      - https://github.com/denoland/deno/issues/16062
  detects-incomplete-project-materialization:
    status: satisfied
    evidence:
      - strict executable fixture fails on missing @babel/core file
      - strict executable complete fixture passes
      - generated root and Fresh dev tasks invoke deps:verify
      - scaffold.runtime project-boundary Fresh dev gate passed
  documents-upstream-recovery:
    status: satisfied
    evidence:
      - generated verifier prints PowerShell and POSIX reinstall commands
      - generated README pins Deno 2.9.0 and links deno/deno#35804
  wsl-runtime-integration:
    status: satisfied
    evidence:
      - scaffold.runtime passed=71 failed=0 with cleanup
  windows-no-intervention-start:
    status: deferred-unclaimed
    target: 0.0.6
  windows-ci-init-aspire-frontend:
    status: deferred-unclaimed
    target: 0.0.6
```

## Drift / debt

- D6 local PLAN-EVAL waiver recorded in `drift.md`.
- First consumer run exposed a Deno-owned `.scripts-warned-*` cache-marker false positive; the exact
  marker exclusion and retained real-file failure are recorded in `drift.md` and tested.
- No new architecture debt accepted.
- Pre-existing unrelated `deno.lock` change is excluded from this PR.
