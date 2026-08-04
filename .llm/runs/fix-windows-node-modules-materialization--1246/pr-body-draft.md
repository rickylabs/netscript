## Summary

This draft classifies #1246 as an upstream Deno Windows npm materialization defect and plans the
0.0.5 NetScript mitigation. The project-local `node_modules/.deno` copy was missing a file that
remained present in Deno's shared cache, and a bare Deno npm import reproduced the failure outside
Aspire/Vite.

The closest open upstream report is [deno/deno#35804](https://github.com/denoland/deno/issues/35804),
with Windows auto-materialization failures on Deno 2.9.1 and 2.9.3. NetScript's independent capture
extends direct evidence to 2.9.4. The unresolved risk window is 2.9.1–2.9.4; this wording does not
claim a direct 2.9.2 reproduction. Deno 2.9.0 is the pre-window version already pinned in NetScript
CI and will be the generated Windows fallback.

## Scope

- Generate a fail-closed project-local npm materialization verifier.
- Run it before the generated Fresh/Vite development command.
- Print exact missing-file evidence and Windows/POSIX recovery commands.
- Pin generated projects to Deno 2.9.0 through `package.json` engines and document the preflight.
- Add a hermetic regression test that fails if detection silently becomes a no-op.

Refs #1246.

Remaining scope for 0.0.6/upstream tracking: a Deno root-cause release, native Windows proof that the
frontend starts without manual repair, and Windows CI covering init → Aspire → frontend serving.

## Harness

- Run: `.llm/runs/fix-windows-node-modules-materialization--1246/`
- Archetype: 6 (CLI/tooling), frontend consumer overlay
- PLAN-EVAL: `COMPOSED_WAIVER` per milestone ruling D6; no local evaluator verdict is claimed
- Status: research/plan locked; implementation pending

## Validation

- [ ] Generated verifier incomplete/complete execution tests
- [ ] Focused CLI scaffold/template tests
- [ ] Scoped TypeScript check/lint/fmt
- [ ] CLI quality and architecture gates
- [ ] Full `scaffold.runtime` one-pass smoke
- [ ] Native Windows acceptance (deferred/unclaimed)

## Acceptance evidence

```yaml
acceptance-evidence:
  classification:
    status: researched
    evidence:
      - https://github.com/rickylabs/netscript/issues/1246
      - https://github.com/denoland/deno/issues/35804
      - https://github.com/denoland/deno/issues/16062
  detects-incomplete-project-materialization:
    status: pending-implementation
  documents-upstream-recovery:
    status: pending-implementation
  windows-no-intervention-start:
    status: deferred-unclaimed
    target: 0.0.6
  windows-ci-init-aspire-frontend:
    status: deferred-unclaimed
    target: 0.0.6
```

## Drift / debt

- D6 local PLAN-EVAL waiver recorded in `drift.md`.
- No new architecture debt accepted.
- Pre-existing unrelated `deno.lock` change is excluded from this PR.
