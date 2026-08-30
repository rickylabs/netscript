# Aspire 13.5 S5 repair worklog

Branch: `fix/aspire-13-5-s5-literal-ports`
Baseline: `0bd8ba832625655aa42d1a803a8b5b1aca021c37`
PR: #1740
Issue: #1717
Implementation lane: Codex GPT-5.6 Sol; Tier-A review and IMPL-EVAL remain separate-session supervisor work.

PLAN-EVAL: N/A — this is an owner-locked repair cycle after an earlier independent IMPL-EVAL; the
four defects, dispositions, slice order, and gates were supplied as fixed inputs. This lane does not
re-open architecture decisions or self-certify.

## Design

### Public surface

- Keep the plugin manifest protocol and install result data shape intact.
- Restore the existing optional `baseUrl` contract in the auth, sagas, triggers, and workers stream
  factories by delegating discovery to `@netscript/plugin-streams-core`'s `buildStreamUrl` and
  `getStreamsUrl` chain.
- Change only CLI completion presentation: an explicit pinned `hostPort` may be printed; a template
  `servicePort` must not be presented as an allocated live endpoint.
- Harden the existing `check:aspire-host-ports` scanner without changing unrelated matcher semantics.

### Domain vocabulary and ports

- `baseUrl`: optional explicit caller override.
- Aspire discovery: `DURABLE_STREAMS_URL` → `services__streams__http__0` on the server →
  `VITE_services__streams__http__0` / `VITE_STREAMS_URL` in browser builds.
- `hostPort`: an explicitly pinned concrete endpoint port.
- `servicePort`: deterministic scaffold/template data retained in results, not a live allocation.
- No new port abstraction is introduced. Plugin factories remain thin wiring over the core resolver.

### Constants

- No new runtime port constant. D-14 remains locked: `SAGAS_API_DEFAULT_PORT` stays an unchanged,
  deprecated compatibility export and is never restored as a runtime fallback.
- D-16 remains intact: no research/evaluator evidence is rewritten for parity.

### Commit slices

1. F-1 manifest/test contract realignment and six-manifest stale-assertion sweep.
2. F-2 stream-factory discovery restoration with four-plugin regression coverage.
3. F-3 CLI completion port honesty with omitted/explicit host-port coverage.
4. F-4 multiline contribution-fallback detection with scanner self-tests.
5. Configured, scoped, quality, and architecture gates with final evidence.

Each slice updates this repair run directory, commits, pushes with the explicit branch refspec, and
posts immutable commit/gate evidence to PR #1740 before the next slice begins.

### Deferred scope

- No `packages/aspire` public-surface, version-pin, fixture, health-check, teardown, resource-command,
  AppHost, Docker, or full CLI E2E work.
- No PR taxonomy, draft/ready state, acceptance checkbox, merge, or issue-close mutation.
- Runtime lease-backed verification remains supervisor/CI work.

### Contributor path

- Stream URL behavior is extended in `packages/plugin-streams-core/src/application/stream-url-resolver.ts`;
  plugin factories only pass optional overrides through.
- Plugin install completion behavior is extended beside the existing output branch in
  `install-plugin.ts` and its focused tests.
- New host-port source shapes are protected with fixtures in `check-aspire-host-ports_test.ts`.

## Slice 1 — F-1 manifest contract

### RED

| Command | Exit | Evidence |
| --- | ---: | --- |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/ai/tests/manifest_test.ts` | 1 | Existing assertion expected `8095`; parsed value was `0` after the manifest literal had been removed. |

### Cross-plugin stale-assertion sweep

Enumeration used `git diff origin/main...HEAD --name-only -- 'plugins/**'`, then the manifest diff,
then `rg -n "backgroundPort|servicePort|809[1-5]|4437" plugins/*/tests plugins/*/scaffold.plugin.json`.

| Manifest changed by S5 | Test search result | Disposition |
| --- | --- | --- |
| `plugins/ai/scaffold.plugin.json` | stale `backgroundPort === 8095` in `plugins/ai/tests/manifest_test.ts` | Fixed: raw `officialSource.backgroundPort` is absent/undefined and serialized manifest contains no `8095`. |
| `plugins/auth/scaffold.plugin.json` | only deprecated compatibility-port test; no manifest assertion for removed keys | No change needed. |
| `plugins/sagas/scaffold.plugin.json` | only deprecated compatibility-port test; no manifest assertion for removed keys | No change needed. |
| `plugins/streams/scaffold.plugin.json` | no removed-key/literal assertion in tests | No change needed. |
| `plugins/triggers/scaffold.plugin.json` | compatibility-port test plus unrelated public manifest test; no removed-key assertion | No change needed. |
| `plugins/workers/scaffold.plugin.json` | no removed-key/literal assertion in tests | No change needed. |

### Implementation

- Renamed the AI test to describe the new no-runtime-service-or-port contract.
- Preserved the manifest parse/identity checks.
- Asserted against the raw scaffold manifest so the protocol parser's existing `backgroundPort: 0`
  normalization is not mistaken for a literal port declaration.

### GREEN

| Command | Exit | Result |
| --- | ---: | --- |
| `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/ai/tests/manifest_test.ts` | 0 | 5 passed, 0 failed. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/ai --ext ts,tsx` | 0 | 39 files, 1 batch, 0 diagnostics. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/ai --ext ts,tsx` | 0 | 39 files, 0 findings. |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/ai --ext ts,tsx` | 0 | 39 files, 0 findings. |
| `deno task quality:scan` | 0 | Repository scan has 0 findings; 7 pre-existing bounded allowances. |
| `deno task arch:check` | 0 | Doctrine scan has 0 failures; warnings are the existing repository baseline. |

### Reconcile

- Live issue #1717 and PR #1740 were read at repair activation; the branch and remote PR head were
  both `0bd8ba832`. No new comment changes the locked disposition. PR labels, milestone, readiness,
  acceptance evidence, and issue state were intentionally not mutated.
