## Summary

One theme: **plugin install writes incomplete wiring, and nothing downstream notices.**

Installing a plugin writes `PluginReferences` exactly once — at the installing plugin's own install
time, onto its own `appsettings.json` entry. A later install of a dependency never revisits earlier
entries, so install order silently changes behaviour. A producer with no reachable streams URL then
*blocks* instead of failing, and warns only in a different process's startup log.

This PR makes wiring converge to the same bytes regardless of install order, makes a missing durable
stream fail fast and actionably in the dependent service, and gives `plugin doctor` runtime truth it
can actually fail on.

## Issues

Closes #1067
Closes #1014
Closes #1015
Closes #1017
Closes #1022

## Ground truth established before implementation

The merged PRs #1028 (#1017), #1043 (#1014) and #1031 (#1015) are already on `main`
(`2e188bc91`, `8b69d78f0`, `5a1a2d23b`). Those three issues stayed open because of their
**unchecked acceptance boxes**, not because the fix is missing — the boxes were written so a
happy-path test cannot close them. Work on those three is the missing *test* evidence.

Root cause for #1067, confirmed by reading the code rather than the issue text:

- `officialSource.dependencies: ["streams"]` **already existed and was already correct** on `workers`,
  `sagas` and `triggers` — and was **never consumed** by the reference wiring.
- `install-plugin.ts` merged only the *installing* plugin's `officialSource.pluginReferences`;
  `appsettings-entry-builders.ts` set `PluginReferences` only on the entry being built.

So the fix is a reconcile pass over every installed entry, deriving edges from declarations that
already exist — not a retro-wire patch and not new hand-written manifest edges:

```
PluginReferences(entry) = ( declared pluginReferences ∪ { serviceConfigKey(p) : p ∈ dependencies(entry) } ) ∩ installed resource keys
```

recomputed at both the install boundary and inside `regenerateAspireHelpers`, with references and
records sorted so the output is byte-stable. `streams` has `serviceConfigKey: "streams"` (not
`streams-api`); an edge written as `streams-api` would dangle silently.

## Commits

| Commit | Slice |
| --- | --- |
| `3e9abf10c` | #1067 — reconcile dependency wiring after install; fail-fast stream producers |
| `7168abd11` | #1022 — live AppHost truth in plugin doctor |
| `ba0bc937b` | residual acceptance for #1014 / #1015 |
| `003a0266a` | #1017 — prove `--no-samples` reaches every scaffolder |

## ⚠️ Breaking change — declared, not discovered

`ServiceStreamProducerOptions.assertResolvable` is **removed** from `@netscript/plugin-streams-core`.
Once the producer validates configuration in its constructor, `assertResolvable: false` could no
longer defer anything — keeping it would ship a flag that lies. No code called it; both streams docs
pages are corrected in this PR. **Please carry this into the 0.0.4 release notes.**

## Behaviour change worth a reviewer's eye

`plugin doctor` now reports AppHost **not running** as a `warning` rather than an `error`, so the
static checks stay usable before the AppHost is started. A missing or empty plugin registry remains
an `error` with a non-zero exit, so #1022's first acceptance box still holds. This landed inside a
commit labelled `test(…)` (`ba0bc937b`), which is easy to miss in the log.

## Notes for review

- The pre-existing test `DurableStreamProducer drops writes when streams URL is unavailable`
  **enshrined the defect** #1067 asks us to remove. It is now
  `…fails synchronously when streams URL is unavailable`. That inversion is the point of the fix.
- #1022's boxes 1, 2, 3 and 7 were verified already satisfied on `main` and deliberately not
  re-fixed. The genuine remaining work was live AppHost resource truth.
- Every red-proof in this PR was produced by the supervisor, not self-reported: the permutation test
  and all four `--no-samples` cases were each driven red before being accepted.

## Boundary

Does **not** absorb #1064/#1065/#1066 — the saga engine is owned by a concurrent slice (PR-A). No
saga engine/store/runtime file is touched here.

## Deferred to 0.0.5

- Durable-stream network connection timeout/retry lifecycle redesign. This PR fails fast on *absent*
  configuration; redesigning reconnection semantics is a separate change.
- The `true-userland` E2E suite's source-leak assertion fails on absolute `file:` doctor entrypoints
  persisted for local-path installs. Verified **pre-existing on `main`** (`install-plugin.ts:250` is
  unchanged here) — local-development provenance leaking into portable metadata.

## Gate evidence

Posted as commit-by-commit comments on this PR. Headline: `scaffold.plugins` E2E
`passed=16 failed=0`; `deno test packages/cli/src/` 465 passed 0 failed; `quality:scan`
`ok=true findings=0`; `arch:check` no `FAIL`; lint/fmt/check `0` across 667 files; **zero** new
`deno-lint-ignore` / `as unknown as` introduced.
