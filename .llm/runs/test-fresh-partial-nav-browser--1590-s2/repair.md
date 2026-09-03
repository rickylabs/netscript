use harness

# Repair — hosted browser proof times out at `waitForResponse` (#1590 Slice 2 / PR #1895)

## SKILL

- `netscript-harness` — slice discipline, worklog/drift, gate evidence.
- `deno-fresh` — Fresh 2.3.3 partial fetch semantics and the `f-partial` request shape.

## Where things stand — read before changing anything

Your branch `test/fresh-partial-nav-browser-proof` is at `fd8e0f5be` and **already contains the
#1904 fetch-binding fix** (`platformFetch = originalFetch.bind(globalThis)`), merged in by the
supervisor.

**Progress is real:** the earlier hosted failure
`TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation` is **gone**, and the run now
reaches 1m5s instead of aborting at 29s. Your proof caught a genuine P1 defect in merged production
code; that fix has shipped as PR #1904.

## The remaining failure — exact

Hosted `fresh-browser` gate, run `33591947512`, job `100127639255`, head `fd8e0f5be`:

```
TimeoutError: page.waitForResponse: Timeout 30000ms exceeded while waiting for event "response"
FAILED | 2 passed | 1 failed (1m5s)
browser: ordered partial navigation drains stale A/B bodies and keeps final A
  => ./tests/form-navigation_browser.ts:93:6
```

The wait that expires is one of the stale-response matchers at
`tests/form-navigation_browser.ts:178-188`:

```ts
page.waitForResponse(r => r.url().includes('hold=old-region') && r.url().includes('fresh-partial=true'))
```

## What to establish first — do not guess

Playwright's `response` event fires when **headers** arrive, not at EOF. Your fixture's
`gatedResponse` enqueues a prefix chunk before awaiting the barrier, so headers should already be
flushed. So the likely cause is that **no request matching that predicate is ever issued** — not that
the response is held too long. Determine which, from evidence:

1. Capture every request/response URL the page actually issues during the stale phase and compare
   against the predicate. Does a `hold=old-region` request appear at all? Does it carry
   `fresh-partial=true`?
2. `coordinator.ts:236` **reads** `fresh-partial` from the URL; it does not add it. Confirm what
   actually appends that parameter for an `f-partial` button versus an `f-partial` link, and whether
   the held `hold=old-region` partial at `app.tsx:88` is triggered through a path that appends it.
3. Check whether the coordinator's interception rewrites or strips the parameter before the request
   reaches the network (see `coordinator.ts:467`, which deletes `fresh-partial` from a copied URL).

Fix the mismatch you actually find. If the predicate is wrong, correct the predicate; if the fixture
never issues the request, correct the fixture. **Do not lengthen the timeout to make it pass** — a
30-second wait that only succeeds when lucky is worse than a failing gate.

## Hard boundaries

- **No `packages/fresh/src` edits.** This is the proof slice; the production coordinator is merged and
  separately evaluated. If you conclude the product is still wrong, **stop** and record it in
  `drift.md` for the supervisor to file — do not repair it here.
- Keep the assertions that matter: **overlay absence** (not just final HTML), **0 cancellations**,
  drain-to-EOF, and last-intent-wins A→B→A.
- Determinism: release barriers explicitly. No sleeps tuned until green.
- **Do not run Chromium, Docker, Aspire, or `e2e:cli` locally** — this NAS lane has no browser and a
  prior worker leaked three containers doing exactly that. The supervisor runs the hosted proof.

Commit and push to `test/fresh-partial-nav-browser-proof`. Keep `worklog.md` and `drift.md` current
under `.llm/runs/test-fresh-partial-nav-browser--1590-s2/`.
