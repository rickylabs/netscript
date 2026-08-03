# BLOCKING — Slice 2 regressed `plugin doctor` in any environment without the Aspire CLI

CI is red on your own branch and it is a real defect, not flakiness. Do not dismiss it.

## The failure

`scaffold-static (deno-only)` on `ba0bc937b`:

```
> behavior.plugins-health: Check installed plugin health
  FAILED 497ms
Summary: passed=15 failed=1
```

`scaffold-runtime` fails the same gate (`passed=26 failed=1`).

Both of us ran `scaffold.plugins` locally and got `passed=16 failed=0`. **We were both wrong, for the
same reason:** this machine has `aspire` at `/usr/local/bin/aspire`. The CI **deno-only** lane does
not. Our green was an artifact of the environment, which is exactly the failure mode the release
brief warns about — verify the artefact, and do not trust a gate that only ever ran in one place.

## The cause — I read it, I did not infer it

`AspireAppHostDoctorInspector.inspect` shells out to `aspire ps`. `DenoProcess.exec` uses
`Deno.Command(...).output()`, which **throws `Deno.errors.NotFound`** when the binary is not on PATH
(it does not return a non-zero code). That throw lands in:

```ts
} catch (error) {
  return workspaceErrorReport('apphost:inspection', 'Could not inspect Aspire AppHost.', error);
}
```

`workspaceErrorReport` produces `status: 'error'` → `plugin doctor` exits non-zero → the gate fails.

So `netscript plugin doctor` now **fails outright whenever the Aspire CLI is not installed**, and the
same applies if `<projectRoot>/aspire/` does not exist, since that is passed as `cwd`.

## Why this is wrong on the merits, not just for CI

`plugin doctor` is a diagnostic. It has to keep working on a machine that has never installed Aspire
— that is precisely when a developer reaches for it. #1022 exists because a doctor reported healthy
when it had no evidence; the fix is not a doctor that reports **failure** when it has no evidence.
Both are the same error: **conflating "I could not observe this" with "this is broken."**

You already drew this distinction correctly once, when you split `not-running` from
`running-but-unhealthy`. This is the third arm you are missing: **inspection unavailable.**

## Required

Three distinguishable outcomes, not two:

| Condition | Status |
| --- | --- |
| Aspire CLI absent / not executable / `aspire/` dir missing — cannot observe | **`warning`**, message naming that AppHost inspection was skipped and why |
| AppHost inspected, not running | `warning` (as you have it now) |
| AppHost running, resource missing or unhealthy | `error` (as you have it now) |

Distinguish "cannot execute `aspire`" from "`aspire` ran and returned a genuine failure". A non-zero
exit from a **working** `aspire` is still worth surfacing; a missing binary is not an error about the
project.

Add a test with an inspector/process whose exec throws `Deno.errors.NotFound`, asserting doctor
reports `warning` and exits **zero**. Without that test this regresses again the moment someone
refactors, and it will keep passing on this machine.

## Verify it the way CI does, not the way this machine does

After fixing, prove it in an environment without the binary — e.g. run the doctor path with `PATH`
stripped of `/usr/local/bin`, or inject a process port that throws `NotFound`. A local
`scaffold.plugins` green on this box does **not** demonstrate the fix; that is what misled us.

## Scope discipline

This is a regression in your own slice, so it is in scope. Do **not** take the opportunity to expand
the AppHost checks. Fix the third arm, add the test, commit, push, report the hash.
