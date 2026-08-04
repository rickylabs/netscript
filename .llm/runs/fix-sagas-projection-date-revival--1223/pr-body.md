## Summary

Revives valid date strings returned from JSON-backed saga persistence at the private
instance-projection boundary. This prevents real Redis-backed runners from dying before
`saga_instances` is written while preserving the strict projection contract and rejecting malformed
persisted dates.

Closes #1223

Refs #1190

## Scope

- Archetype / area: plugin package; sagas runtime projection and database read model
- No public exports or contracts changed.

## Slices

- [x] S1 Real-Redis RED regression — `b5349c459`
- [x] S2 Private projection-boundary date revival — `28152c77e`
- [x] S3 Full quality and architecture gate column
- [x] S4 Fresh-scaffold seven-point protocol on Redis/Garnet and Deno KV
- [x] S5 Issue evidence and ready-for-review handoff

## Validation

- Real Redis RED — `FAILED | 0 passed | 1 failed`;
  `metadata.createdAt.toISOString is not a function`
- Real Redis GREEN — `ok | 1 passed | 0 failed`
- `plugins/sagas` suite — `49 passed | 0 failed | 1 ignored`; the gated real-Redis test passed
  separately above
- Scoped check/lint/fmt — 83 files, zero findings
- `deno task quality:gate` / `deno task arch:check` — PASS; baseline warnings only
- Redis/Garnet and Deno KV fresh-scaffold protocol — PASS, including populated health reports,
  publish→runner→projection→GET, compensation, OTEL correlation, and restart durability
- Full evidence: https://github.com/rickylabs/netscript/issues/1223#issuecomment-5178895344
- Related post-fix recording:
  https://github.com/rickylabs/netscript/issues/1190#issuecomment-5178899824

## Harness

- Run dir: `.llm/runs/fix-sagas-projection-date-revival--1223/`
- Phase: review
- PLAN-EVAL: composed per `milestone-run.md` (orchestrator waiver)

## Drift / Debt

- None.

## Definition of Done

- [x] Branch name and labels follow the taxonomy (exactly one `status:` label).
- [x] Every referenced issue's acceptance + `gate:` boxes are checked with linked evidence (required
      before `status:ready-merge`).
- [x] Docs/reference updated if public surface changed (not applicable: no public surface changed).
- [x] Breaking changes are labelled `breaking` and, if substantial, backed by an RFC (not
      applicable: no breaking change).
- [x] No lock-file or unrelated churn committed (`deno.lock` unchanged).
