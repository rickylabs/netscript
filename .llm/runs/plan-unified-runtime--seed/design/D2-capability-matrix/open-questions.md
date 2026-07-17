# D2 — Open questions (owner forks only)

Numbered owner forks surfaced by the D2 capability-matrix pack. These are decisions the supervisor
must NOT take silently; they feed the Stage-E owner-fork sweep and the Stage-H decision brief. Not
implementation TODOs — those live in the issue drafts.

1. **Isolate/serverless representative cell.** The synthesis fixes the fourth cell as "one
   isolate/serverless preset"; this pack picks `cloudflare_module` (provider page names it,
   recommended, richest hook surface: scheduled/queue/tail/email — `nitro-v3.md` Cloudflare row).
   Owner fork: accept `cloudflare_module` as the v1 representative, or substitute another named
   isolate preset (e.g. `vercel`, `netlify_edge`, `aws_lambda`)? Choice changes S3/S6 mappings.

2. **Epic slug + label for #823.** Titles/labels use `unified-runtime` (`epic:unified-runtime`).
   The existing taxonomy example is `epic:deployment`. Owner/D3 fork: confirm the epic slug so
   `epic-and-issues.md` titles and labels match the filed epic. (D3 board-mechanics owns final
   decomposition; D2 defers.)

3. **Milestone train split.** Suggested milestones are `0.0.1-beta.12` (S1–S4) and `0.0.1-beta.13`
   (S5–S6), S7 deferred. Synthesis leaves the exact milestone split as a Stage-E output. Owner
   fork: ratify the beta.12/beta.13 split, or compress/expand the train?

4. **`deno_deploy` / `cloudflare_module` sagas: default to `externalized` or `rejected`?** Both
   bounded-window cells can either auto-externalize to a macro-service (needs a configured target)
   or hard-reject at build. Owner fork: is v1 shipping the macro-service externalization path, or
   is v1 **reject-only** (externalization deferred to a later wave)? This sizes S2 materially.

5. **`@netscript/data` facade.** #823 names `@netscript/data`; the shipped surface is
   `@netscript/database` (`drift-ledger.md` D-12). D2 normalizes to `@netscript/database`. Owner
   fork: confirm no new `@netscript/data` facade is intended for v1 (if it is, it needs its own
   contract card, out of D2 scope).

6. **Offline-sync scheduling (S7).** Modeled as a `wave:defer` database-target profile consumed by
   the D-04 desktop adapter. Owner fork: keep offline sync track-only for v1, or pull it into the
   beta.12/13 train alongside the desktop wave?
