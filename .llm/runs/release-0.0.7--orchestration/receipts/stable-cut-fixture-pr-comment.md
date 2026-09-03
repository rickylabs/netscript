## Stable-cut CI diagnosis — release held, no product defect found

CI [33766502843](https://github.com/rickylabs/netscript/actions/runs/33766502843) at
`b8fb15bc1` passed 5,269 tests and failed one: the public init conventions fixture invokes
the real resource generator, which imports the generated app's exact SDK pin.

The unmasked child error is:

```text
Could not find version of '@netscript/sdk' that matches specified version constraint '0.0.7'
```

Stable 0.0.7 is deliberately not published yet. The production resolver masks this import failure
as a missing `users.list` procedure. The same query-factory probe succeeds with checkout imports.

Candidate `6884b7548` on `fix/cli-prepublish-test-fixture` changes only the publish-excluded
test file: first assert the correct public exact-version pin, then use the existing local fixture
helper for the real subprocess calls. All original assertions remain. Focused full file **5/0**;
check, scoped lint and scoped fmt pass. No shipped file, manifest, or generated output changes.

The existing independent evaluator is reviewing the candidate. PR #1984 is unchanged and held.
Canary.10's actual product pair remains green. The current inheritance rule rejects even this
excluded-test delta; a narrow owner ruling to retain its proven product evidence has been requested,
not assumed. No manual green status, release publication, or new canary has been created.
