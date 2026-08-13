# Evidence — issue #1631

## Pre-fix discriminating run

Command (baseline implementation; tests added, parser not changed):

```text
deno test --allow-read --allow-write --allow-run .llm/tools/validation/check-netscript-jsr-specifiers_test.ts .llm/tools/release/publish-readiness_test.ts
exit code: 1
running 10 tests from ./.llm/tools/validation/check-netscript-jsr-specifiers_test.ts
embedded MCP documentation is allowed without weakening MCP source checks ... ok
a pin from a previous release fails, naming the version the workspace ships ... ok
a current pin naming a real export passes ... ok
sentence punctuation terminates an exact prerelease specifier ... FAILED
a genuinely versionless specifier remains release-blocking ... ok
stale exact and range pins remain release-blocking ... ok
a subpath the package does not export fails even when the version is current ... ok
range pins fail while template placeholders remain version-neutral ... ok
an allowance marker exempts a versioned specifier from every rule ... ok
a package outside the workspace is skipped rather than guessed at ... ok
running 16 tests from ./.llm/tools/release/publish-readiness_test.ts
publish readiness emits ordered structured evidence for every composed check ... ok
reference-page audit resolves the four deployable aliases and name-exact core peers ... ok
publish readiness fails when a published effective member has no reference page ... ok
publish readiness fails on a seeded workspace member omitted from the publish set ... ok
publish readiness preserves the seeded stale Markdown pin gate ... ok
lockstep and residue audit fails on seeded manifest and internal specifier versions ... ok
lockstep audit ignores seeded fixture scaffold versions outside the release surface ... ok
publish readiness fails on a pin the release no longer ships ... ok
publish readiness fails on a seeded versionless framework specifier ... ok
publish readiness fails on every first-party range pin ... FAILED
first-publish checklist fails on a seeded missing README ... ok
first-publish checklist fails over-cap tagline and missing license/exports ... ok
publish readiness fails when seeded first-publish provisioning dry-check fails ... ok
new-package evidence enumerates only registry-absent members ... ok
registry failure skips dependent first-publish checks instead of using a partial set ... ok
publish readiness exercises the real preflight for a seeded text import and carries #810 sunset ... ok

sentence punctuation terminates an exact prerelease specifier:
Assertion `result.staleVersions === []` failed. Actual pinned value was
`0.0.1-beta.11.` and actual displayed specifier was
`jsr:@netscript/sdk@0.0.1-beta.11.`.

a genuinely versionless specifier remains release-blocking:
No assertion failed: this strictness control was already green before the fix, proving the existing
scanner rejected the bare specifier. This is the truthful pre-fix result; making this test RED would
require asserting the opposite of the required behavior.

stale exact and range pins remain release-blocking:
The scanner-level stale/range assertions were already green. The composed readiness assertion
`versionless-specifiers.status === FAIL` failed for the first `^` range case; actual status was
`PASS`, so the loop did not proceed to `~` or `>=` in that pre-fix run.

FAILED | 24 passed | 2 failed
```

## Focused post-fix tests

```text
deno test --allow-read --allow-write --allow-run .llm/tools/validation/check-netscript-jsr-specifiers_test.ts .llm/tools/release/publish-readiness_test.ts .llm/tools/deps/bump-version_test.ts
exit code: 0
ok | 37 passed | 0 failed
```

The punctuation table covers `.`, `,`, `)`, and newline. The strictness table covers bare,
stale-exact, `^`, `~`, and `>=` pins. Existing `<version>`, `${…}`, `{{…}}`, and diagnostic
trailing-`@` forms remain non-failing controls.

## Required gates

### `rtk proxy deno task check`

```text
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w8"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2917,"batches":25,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
exit code: 0
```

### `rtk proxy deno task test`

The exact task emitted 5,801 lines. The terminal verdict was:

```text
ok | 3401 passed (624 steps) | 0 failed | 17 ignored (3m26s)
exit code: 0
```

Final-state rerun used Deno's dot reporter to retain the full progress stream compactly:

```text
rtk proxy deno task test --reporter=dot
Task test deno test --allow-all '--reporter=dot'
ok | 3401 passed (624 steps) | 0 failed | 17 ignored (3m22s)
exit code: 0
```

### `rtk proxy deno task lint`

```text
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w8","exitCode":0},"selection":{"filesSelected":2034,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
exit code: 0
```

### `rtk proxy deno task fmt:check`

```text
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w8","mode":"check","summary":{"filesSelected":2034,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
exit code: 0
```

### `deno task publish:readiness`

```text
Task publish:readiness deno run --allow-read --allow-run --allow-net=jsr.io,api.jsr.io .llm/tools/release/publish-readiness.ts
release:preflight text-imports — PASS
release:preflight import-attributes — PASS (0 findings)
release:preflight file-url-import-meta — PASS (0 findings)
release:preflight self-imports — PASS (0 findings)
Task release:preflight deno run --allow-read .llm/tools/release/preflight-text-imports.ts
{"gate":"publish-readiness","id":"publish-set","status":"PASS","summary":"35 effective members match workspace declarations"}
{"gate":"publish-readiness","id":"docs-reference","status":"PASS","summary":"35 publishable package reference page(s) present"}
{"gate":"publish-readiness","id":"markdown-pins","status":"PASS","summary":"no stale NetScript version pins","details":[]}
{"gate":"publish-readiness","id":"lockstep-residue","status":"PASS","summary":"all release version surfaces are 0.0.5","details":[]}
{"gate":"publish-readiness","id":"versionless-specifiers","status":"PASS","summary":"2359 framework source files carry only versioned, current NetScript JSR specifiers","details":["packages/cli/src/kernel/constants/scaffold/scaffold-packages.ts:29 ALLOW import-map alias key maps to an exact release target."]}
{"gate":"publish-readiness","id":"new-packages","status":"PASS","summary":"0 first-publish package(s) detected from JSR metadata","details":[]}
{"gate":"publish-readiness","id":"first-publish","status":"PASS","summary":"0 first-publish package(s) satisfy the production checklist","details":[]}
{"gate":"publish-readiness","id":"provisioning-dry-check","status":"PASS","summary":"no new packages require provisioning","details":[]}
{"gate":"publish-readiness","id":"import-attribute-preflight","status":"PASS","summary":"canonical release:preflight passed"}
{"gate":"publish-readiness","ok":true,"version":"0.0.5"}
exit code: 0
```

No publication, release cut, canary dispatch, tag, or release branch was created.
