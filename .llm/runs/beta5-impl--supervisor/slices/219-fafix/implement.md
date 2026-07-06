use harness

## SKILL

Read these repo skills before any work (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — run mechanics, slice/commit-trail rules
- `netscript-doctrine` — public-surface law
- `deno-fresh` — the `@netscript/fresh` surface you are editing
- `netscript-tools` — scoped wrappers, gate-evidence rules, lock hygiene
- `netscript-pr` — branch/PR/label/milestone process
- `rtk` — prefix read-heavy git/grep with `rtk`

## Identity & scope

You are a WSL Codex implementation slice for the **#219 AI-anchor unblock: make
`@netscript/fresh/ai` (FA1 `createNetScriptChatConnection` #250, FA2 chat-stream proxy #251)
actually adoptable by the reference production consumer eis-chat** (beta.5 feature wave, run
`beta5-impl--supervisor`).

Worktree: `/home/codex/repos/netscript-219-fafix` · branch `fix/219-fresh-ai-proxy`
(cut from origin/main `1c175990`, NO upstream — keep it that way).

Context (from the committed production analysis
`.llm/runs/beta5-impl--supervisor/eischat-seam-analysis.md` §3 — read it first): eis-chat
imports six `@netscript/fresh/*` subpaths but ZERO of `@netscript/fresh/ai`, for two verified
reasons. Your deliverables fix both:

1. **Configurable stream subpath.** FA1/FA2 hardcode the `/ai/chat` durable-stream subpath with
   no override. Add an override hook (e.g. `streamPath` / path-builder option) to
   `NetScriptChatConnectionOptions` AND the FA2 proxy-handler options, defaulting to the current
   `/ai/chat` (non-breaking). eis-chat's convention is `/eischat/sessions/{id}/messages` — the
   option must support per-session dynamic paths, not just a static prefix.
2. **Fix the decode-time crash flavor of the #219 gzip mislabel.** The durable-streams runtime
   can mislabel a plain-JSON body (`[{`, not gzip magic `1f 8b`) with `content-encoding: gzip`;
   standards-compliant auto-decompressing readers crash BEFORE a usable response exists (Deno
   fetch: "Invalid gzip header"). FA2's current `sanitizeUpstreamResponse` strips headers only
   AFTER `doFetch` resolves — insufficient. Fix: the proxy's upstream request must send
   `Accept-Encoding: identity` (and/or defensively detect the mislabel), so the decode-time
   crash cannot occur. Add a test that reproduces the mislabeled response (plain JSON body +
   `content-encoding: gzip` header) and proves the proxy survives and forwards clean output.
3. **Acceptance bar:** after your change, eis-chat's 3 workaround sites
   (`apps/dashboard/routes/api/chat-stream.ts:72`, `lib/stream-loaders.ts:82`,
   `routes/api/streams/[...path].ts:77` — all tagged `netscript#219 pt.3`) must be REPLACEABLE
   by FA1/FA2 imports. You cannot edit eis-chat; instead add a test mirroring its shape
   (custom per-session subpath + mislabeled-gzip upstream) as the proof.
4. If root-causing shows the mislabel should ALSO be fixed at the durable-streams runtime
   source, record that in `notes.md` as a follow-up candidate — do NOT expand into
   plugin-streams-core in this slice.

Run artifacts: write YOUR slice artifacts ONLY under
`.llm/runs/beta5-impl--supervisor/slices/219-fafix/` — NEVER at the run-dir root.

## Validation

- Scoped check/lint/fmt wrappers on `packages/fresh` (and any touched siblings); package tests
  incl. your new mislabel + subpath tests.
- Full `deno task check` + `deno task test` at the end.
- Public surface changes: full-export-map `deno doc --lint` on `@netscript/fresh` +
  `deno task publish:dry-run` stays clean; the new options need JSDoc.
- Do NOT run `deno task e2e:cli`.

## Process

- Commits in reviewable slices; push ONLY via `git push origin HEAD:refs/heads/fix/219-fresh-ai-proxy`.
- Never force-push, never `git add -A`, zero `deno.lock` churn.
- Open a **draft PR** early: base `main`, title
  `fix(fresh/ai): #219 unblock — configurable stream subpath + identity-encoding proxy fix`.
  Body: **`Refs #219`** (NOT closing — #219 closes only via the eis-chat validation gate).
  Labels: `type:fix`, `area:packages`, `priority:high`, `epic:road-to-stable`, `status:impl`;
  milestone `0.0.1-beta.5`.
- Comment per pushed slice with commit hash + evidence. End with a `SLICE-COMPLETE` comment.
