# Drift Log

## 2026-09-01 — generated-app discriminator

- **Significant:** the real generated HTML contains the exact
  `<!--frsh:island:ServiceShowcaseLab:1:-->` boundary, its server-rendered initial row, and the client
  boot mapping. The active investigation is client-side; loader/layer null rendering and module
  identity are no longer live branches.
- **Coverage hole, deferred:** `probe-app-reference.ts:26-61` checks SSR-visible markers only, so a
  fully non-hydrating app can pass `behavior.app-reference`. This slice records but does not fix that
  separate gate defect, per the S2 brief.
- **Process:** the latest supervisor direction supersedes the prior S2 handoff's “do not open a PR”
  note and requires a draft PR immediately after this discriminator is recorded. Evaluator
  separation and the prohibition on self-certification remain unchanged.

## 2026-09-01 — hosted package-browser result

- **Significant:** hosted `fresh-browser` run `33539774285` exercised the package fixture in a real
  browser. Both `fresh:client-entry` and `fresh-island::ServiceShowcaseLab` returned 200; the island
  module, provider child, singleton query client, `useQueryClient`, and `useQuery` all resolved; the
  hydration effect ran; and the click changed `Server row` to `Hydrated row`. The fixture therefore
  refutes #1845's non-hydration premise at the package/`definePage`-layout level. No Fresh runtime or
  scaffold product edit is supported by this result.
- **Assertion correction:** the browser-side comment-marker assertion sampled after Fresh had
  replaced its comment markers with hidden text nodes, while served HTML already proved marker
  emission. The post-click query-client assertion also expected the pre-click value. The test now
  retains served-marker proof and records query-client data on both sides of the click.
- **Open measurement:** the browser emitted `Failed to load resource: the server responded with a
  status of 404 ()`, but the first run captured URLs only for the two Fresh entries. Both were 200.
  The browser test now records every response with status >= 400, including URL, status, and resource
  type. Until that receipt lands, the 404 is unattributed and is not defect evidence.
- **Response-ledger result:** run `33541399005` repeated successful hydration and interaction. Its
  all-response ledger was empty for status >= 400, so the browser's console-only 404 did not have a
  page-observed failing HTTP response. The measurement now captures console source location, every
  request URL/resource type, and every request-failure URL/error to attribute the message without
  guessing.
- **404 attribution:** run `33542591593` located the console error at
  `http://127.0.0.1:38455/favicon.ico`. There were no response-status failures or request failures,
  and all hydration/provider/query/interaction observations passed. This is browser-fixture noise,
  not a Fresh entry, island chunk, query provider, or scaffold defect. The fixture now returns 204
  for its incidental favicon request and retains strict zero-error assertions for application code.
- **Scope consequence:** if the unattributed 404 is incidental, the remaining discrepancy is
  generated-scaffold-specific or the carried #1845 receipt is stale relative to current sources.
  The package fixture does not yet establish which; hosted generated-app proof remains authoritative.

## 2026-09-02 — IMPL-EVAL FAIL_RESCOPE → plan v2

- Verdict `FAIL_RESCOPE` at `dd039a791` (comment 5515285439): v1 stop clause fired; premise undetermined; hosted receipt stale.
- Drift from v1: the CLI collision boundary (#1773) no longer exists (merged); v2 opens `packages/cli/e2e/**` for the discriminator and `.github/workflows/e2e-cli.yml` for the browser install step only.
- `desktop-native-linux` red at `dd039a791`: out of scope (#1926, `@orpc/contract` isolated install), cleared by `main ≥ 09c07fd4e`; main merged into this branch on 2026-09-02.
- Sqlite tier reds at `dd039a791`: `runtime.wait.auth` (run `33656167222` era) and `runtime.wait.workers-api` (run `33663531932`) — Aspire startup flakes, same tier passed at the same head earlier; unattributable.
