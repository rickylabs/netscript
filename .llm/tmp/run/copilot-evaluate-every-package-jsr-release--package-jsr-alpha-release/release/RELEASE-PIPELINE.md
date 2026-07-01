# Release Pipeline Plan

> How 0.0.1-alpha.0 gets cut, verified, and repeated.

## Overview

This document defines the mechanical release process for `@netscript/*` packages to JSR at version `0.0.1-alpha.0`. It complements `PLAN.md` (wave ordering) and `context-pack.md` (run state).

## Dry-Run Matrix

Before any publish, verify every package passes `deno publish --dry-run --allow-dirty`:

```bash
# Run from repo root, for each package:
cd packages/<pkg>
deno publish --dry-run --allow-dirty
# Check exit code = 0, no slow-type errors, no import errors
```

**Evidence collection:** Each `plan_<pkg>.md` Slice "Final dry-run" must show:
- Command: `deno publish --dry-run --allow-dirty`
- Expected result: `Success`
- Actual result: logged in `audit/dry-run/<pkg>.txt`

**Automation (future):** `.llm/tools/fitness/audit-all-packages.ts` already produces batch dry-run output. A future `release/publish-all.ts` script should:
1. Read `PLAN.md` wave order
2. For each wave, in topological order:
   - `cd packages/<pkg> && deno publish --allow-dirty`
   - On failure: log to `drift.md`, rollback, halt
3. For each plugin in wave:
   - `cd plugins/<plugin> && deno publish --allow-dirty`
   - On failure: log to `drift.md`, rollback, halt

## Topological Publish Order

Derived from `PLAN.md` waves + dependency graph:

**Wave 0:** `@netscript/shared`
**Wave 1:** `@netscript/contracts`, `@netscript/config`, `@netscript/runtime-config`, `@netscript/streams`
**Wave 2:** `@netscript/logger`, `@netscript/telemetry`, `@netscript/aspire`
**Wave 3:** `@netscript/kv`, `@netscript/queue`, `@netscript/cron`, `@netscript/database`, `@netscript/prisma-adapter-mysql`
**Wave 4-prelude:** `plugins/hello-world`, `@netscript/plugin`
**Wave 4:** `@netscript/watchers`, `plugins/streams`, `@netscript/triggers`, `plugins/triggers`, `@netscript/workers`, `plugins/workers`, `@netscript/sagas`, `plugins/sagas`
**Wave 5:** `@netscript/service`, `@netscript/sdk`, `@netscript/fresh`, `@netscript/fresh-ui`
**Wave 6:** `@netscript/cli`

**Rule:** No package in Wave N+1 publishes until all packages in Wave ≤N are verified on JSR.

## Manual vs Automated Publish

**Current state (alpha.0):** Manual publish per package:
- Pro: Full control, easy debugging
- Con: Error-prone, slow, no rollback automation

**Future state (beta+):** Automated via GitHub Actions:
- Trigger: `release:alpha` label on PR merge
- Steps: test → dry-run → publish → verify → tag
- Rollback: `jsr:unpublish @netscript/<pkg>@0.0.1-alpha.0` (if within 72h)

**Decision for alpha.0:** Manual publish is acceptable operational debt. Automation is a Phase B task (post-alpha feedback).

## Retry / Rollback Policy

**Retry:**
- On dry-run failure: fix per `plan_<pkg>.md` gate matrix, re-run
- On publish failure (JSR error): check `drift.md` for similar issues, fix, re-publish

**Rollback (within 72h of publish):**
```bash
# Remove bad version from JSR
npx jsr unpublish @netscript/<pkg>@0.0.1-alpha.0
# Fix issue, bump to 0.0.1-alpha.1 (escape hatch — see below)
# Re-publish
```

**After 72h:** Cannot unpublish. Must release 0.0.1-alpha.1 with fix.

## Publish Permissions

**JSR scope trust model:**
- `@netscript/*` is a scoped namespace on JSR
- Only repository maintainers (GitHub team `netscript-maintainers`) have publish rights
- Each maintainer uses their own JSR token, stored as GitHub secret `JSR_TOKEN`

**Who can publish:**
- Manual: Any `netscript-maintainers` member
- Automated: GitHub Actions bot using `JSR_TOKEN` secret

**Package-level permissions:** Not yet implemented on JSR. All scope members can publish any package.

## Evidence Collection

After each publish, verify:
1. JSR page loads: `https://jsr.io/@netscript/<pkg>@0.0.1-alpha.0`
2. Doc score = 100 (check JSR dashboard)
3. `deno add jsr:@netscript/<pkg>@0.0.1-alpha.0` works from a test project
4. Log success to `commits.md` with JSR URL

## Failure Logging

On any release failure:
1. Create `DRIFT-XXX` entry in `drift.md`:
   - Date, severity (`significant` for blocking, `minor` for retry-able)
   - Source of truth (JSR error message, dry-run output)
   - Observed reality + mitigation
2. Update `context-pack.md` with new state
3. If failure blocks wave, halt all subsequent publishes

## Escape Hatch for Lockstep Cadence

**Problem:** All packages pinned to `0.0.1-alpha.0`. What if one package needs urgent bugfix?

**Solution:** Emergency escape hatch:
1. Fix bug in package X
2. Bump to `0.0.1-alpha.1` (only package X)
3. Publish `0.0.1-alpha.1`
4. All other packages stay at `0.0.1-alpha.0`
5. Next wave of packages can also jump to `0.0.1-alpha.1` if they depend on fixed package

**Rule:** Escape hatch is EXCEPTIONAL. Default is lockstep. Use only for:
- Security fixes
- Critical bugs blocking alpha testers
- NOT for new features (those wait for beta)

## Cross-Links

- Wave order: [`PLAN.md`](./PLAN.md) §"Wave Order"
- Per-package gates: [`plan_<pkg>.md`](./plan_<pkg>.md) §"Gate matrix" + §"Slice list"
- Dry-run evidence: [`audit/dry-run/<pkg>.txt`](./audit/dry-run/<pkg>.txt)
- Failure tracking: [`drift.md`](./drift.md)
- Run state: [`context-pack.md`](./context-pack.md)
- Breaking-change policy: [`release/BREAKING-CHANGE-POLICY.md`](./BREAKING-CHANGE-POLICY.md)
- Dependency ordering: [`release/DEPENDENCY-ORDERING.md`](./DEPENDENCY-ORDERING.md)

---

*This is operational debt for alpha.0. Automation (Phase B) will replace manual steps with GitHub Actions.*
