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

3. **Milestone train split.** *(RESOLVED by Stage-F rework → fork F-9: one train.)* All UR-0…UR-12
   land at `0.0.1-beta.13`; deferred cells/impl (DD-RESEARCH, #455 offline-sync impl) split into
   separately-milestoned successors at `0.0.1-stable`. The prior beta.12/beta.13 split is withdrawn.

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
   beta.13 train alongside the desktop wave?

7. **(Stage-F F1) v1 cell set — 3-cell vs re-proven `deno_deploy`.** `deno_deploy` (C2) is withdrawn
   from v1: the corpus validated Deno Deploy **Classic** + `deployctl`, both sunset **2026-07-20**;
   the surviving `deno deploy` platform has a different model and no Deno queues. Owner fork
   (**F-2**): ship the **3-cell** v1 (`deno_server`, `node_server`, `cloudflare_module`) with C2
   deferred to the DD-RESEARCH successor card, or gate v1 on re-proving `deno_deploy` on the new
   platform first. Default: 3-cell v1; DD-RESEARCH at `0.0.1-stable`.
