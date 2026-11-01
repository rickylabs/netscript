## IMPL-EVAL for PR #2422 at head 7dd579d7

**Short version:** I found no code blockers. The head still can't merge because required gate proof is missing at this exact head, and the protocol counts missing evidence as a finding. The same head can be re-evaluated to MERGE once the gates below are green.

### Blockers (all about gate proof, none need a code change)
1. **The required e2e-cli check is unproven.** Nobody has armed `e2e-cli-gate`, and the scaffold-runtime jobs show as skipping. This one matters here specifically: health routes now install after auth, and `scaffold.runtime` checks that `/health` returns 200 with ready state. I traced the code and expect it to pass: first-party plugins and scaffolds set no custom `allowAnonymous`, and `defineService` calls `withHealth()` last. But that's inference, not proof.
2. **close-gate is failing at this head.** No reviews exist, so the failing step is probably the referenced-issue acceptance step, not the review-thread step. I couldn't read the job log, so the exact cause is unconfirmed. The coordinator needs to resolve it.
3. **CI hasn't finished.** The check shards, `quality` and the docs browser lane are still pending. Earlier jobs passed: `breaking-migration`, `code-quality`, the docs build and the classifiers.

### Source safety
- **Exact anonymous rules:** Bad entries throw `TypeError` when the middleware is built, before anything is installed. Since `authInstalled` is only set after that succeeds, a failed build fails again on retry. Matching needs the method, the raw path and the decoded path all to match exactly, so a GET entry doesn't let HEAD through and encoded or slash variants don't get in. String prefixes and the default `/health` behaviour are unchanged.
- **Health after auth:** This closes the bypass where registration order let health skip auth. The breaking case (custom non-empty lists that leave out `/health`) is documented in the CHANGELOG, the README and the PR's breaking-migration section, and that check passes.
- **CORS:** The middleware saves all six access-control headers (including which are absent) before handlers run, then restores them on the final response. Preflight still returns early, `Vary` keeps tokens from both sides, and services without `withCors()` are untouched.
- **Body limit and database probe:** Chunked request bodies are now read lazily and the unread remainder is cancelled. The TCP timeout now actually aborts the connect and clears its timer. Both fixes are sound.
- **Docs tools and plugin test:** These are the Windows path and command-length fixes, plus a test updated to the new health behaviour. Fine.

### Debt
The builder file grew from 629 to 633 lines. That's inside the owner-approved +32 allowance on the existing builder-size debt, which carries an owner and a 2026-11-10 deadline. `types.ts` is unchanged at 335 lines and every changed test file is at or under 480 lines. No new kind of debt, and no redesign of #829 or #2364.

### Non-blocking notes
- The service reference docs still say to install rate limiting "before immediate health/info routes", and the pipeline-order table doesn't list health. Health is no longer immediate, so `use()` middleware added after `withHealth()` now also runs on health. The CHANGELOG only mentions the auth part of that change.
- Restoring CORS headers rewraps the finished response. Under `withCors()`, that could break a WebSocket upgrade response. I found no first-party WebSocket routes, and I couldn't check whether Hono's own CORS middleware already did this.
- A handler that keeps reading a chunked request body after it has returned a response would have that body cut off. Calling `withHealth()` after `build()` no longer installs the health routes. Both are edge cases.

### Evidence limits
This was read-only: I ran no builds or tests. I relied on the run's gate summary, which records results for the source merge commit 24c73ee2, and on the stated fact that every later commit only adds run records. I did not open each raw receipt. I couldn't read the close-gate log or the Hono library source.

VERDICT: CHANGES 7dd579d78bb7fe0cd498618b45f65f64e640ee69
