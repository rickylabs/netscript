use harness

## SKILL

Read these repo skills before reviewing (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — review-phase context
- `netscript-doctrine` — public-surface law
- `deno-fresh` — the `@netscript/fresh` surface under review
- `rtk` — prefix read-heavy git/grep with `rtk`

## Role

You are an **unoriented adversarial reviewer** for draft PR #488 (`fix/219-fresh-ai-proxy`,
head b30fd82c) in rickylabs/netscript. You did NOT implement it; approach it as a skeptic
trying to find real defects. READ-ONLY: never commit, push, or edit files.

Your clone: `/home/codex/repos/netscript-rev488` (fetch the PR branch yourself:
`git fetch origin fix/219-fresh-ai-proxy && git checkout fix/219-fresh-ai-proxy`).

The PR claims to make `@netscript/fresh/ai` (FA1 createNetScriptChatConnection, FA2
chat-stream proxy) adoptable by real consumers:
1. Configurable stream subpath (static-prefix string OR per-request full-path resolver
   function) on both FA1 and FA2, default `/ai/chat` (non-breaking).
2. Decode-time gzip-mislabel fix: proxy upstream requests send `Accept-Encoding: identity`
   so an auto-decompressor can never crash on a plain-JSON body mislabeled
   `content-encoding: gzip`; plus a repro test for exactly that mislabel.
3. Side effect (drift-logged): full export-map doc-lint fixes — `EmptySegment` made public,
   `NetScriptVitePlugin` re-typed from Vite's private `Plugin` alias to a package-owned
   structural interface.

Attack surfaces to probe (non-exhaustive — find your own):
- Function-vs-string `streamPath` semantics: double-appended session id, trailing-slash
  handling, URL-encoding of session ids, query-string preservation.
- Does the identity-encoding fix actually cover ALL upstream fetches (SSR bootstrap path,
  resume path), or just the main proxy?
- Is the mislabel repro test honest (does it fail on the OLD code)? Verify by mentally (or
  actually) reverting the fix and re-running the test.
- Backward compatibility: existing consumers with default options — byte-identical behavior?
- The `NetScriptVitePlugin` structural re-type: is the structural interface actually
  assignable both ways with Vite's real Plugin type, or does it silently narrow/widen the
  public surface? Any downstream compile break?
- Acceptance bar: could eis-chat's 3 workaround sites (custom per-session subpath
  `/eischat/sessions/{id}/messages` + mislabeled-gzip upstream) genuinely be replaced by
  these APIs? Trace it concretely.

Re-run the relevant tests yourself (`deno test` on the touched test files, scoped check
wrappers). Do not trust the PR's claims.

Verdict: post ONE PR comment on #488 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with
verdict `CLEAN` or `CAVEATS` (numbered, each with file:line evidence and why it's a real
defect, not style). Style nits don't count.
