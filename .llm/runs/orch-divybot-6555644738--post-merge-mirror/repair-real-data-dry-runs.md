# Repair-round live dry-runs

Each command omitted `--apply`, returned exit 1, and made no issue mutation. The
new ownership/association guards accept the live PR/issue metadata; the existing
data refusals still apply.

## PR 2558 → issue 2524

`deno run --allow-env --allow-net .llm/tools/validation/mirror-acceptance-evidence.ts --repo rickylabs/netscript --issue 2524 --pr 2558 --pretty`

```text
acceptance-mirror DRY-RUN: FAILED
provenance: head=5f837c0aab0b5479b9bd81571066f83b9d25b3c8 evaluated=2026-11-01T09:58:32.852Z
snapshot: #2524 updated=2026-11-01T09:31:13Z bodySha256=bd6798a2ca438d451927854a6e7e1c739df92849ce0978ca3356897d5ac45ae3
error: Issue #2524 has zero close-gated markdown checkboxes; remove its acceptance-evidence block or convert the issue acceptance list to markdown checkboxes.
```

## PR 2549 → issue 2548

`deno run --allow-env --allow-net .llm/tools/validation/mirror-acceptance-evidence.ts --repo rickylabs/netscript --issue 2548 --pr 2549 --pretty`

```text
acceptance-mirror DRY-RUN: FAILED
provenance: head=4ce4f06a557d18a43a196a5f0e4362c401727b5c evaluated=2026-11-01T09:58:32.842Z
snapshot: #2548 updated=2026-10-31T23:24:01Z bodySha256=5c651025badc3bd77a656cd1d33fc5ebd4aa78e7b2c409853fc005ef77f9f385
error: Cited SHA 4ce4f06a5 is not reachable from main.
```

## PR 2507 → issue 2450

`deno run --allow-env --allow-net .llm/tools/validation/mirror-acceptance-evidence.ts --repo rickylabs/netscript --issue 2450 --pr 2507 --pretty`

```text
acceptance-mirror DRY-RUN: FAILED
provenance: head=34b4877e4973f815f163c5b8c8715d180c1443de evaluated=2026-11-01T09:58:32.823Z
snapshot: #2450 updated=2026-10-31T07:40:52Z bodySha256=d4478768badbaa7df25ed1d5bdf764cfc1cb9f9bdabbc569b2cb10c2cda02027
error: Cited SHA 34b4877e4 is not reachable from main.
```
