You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment run the AS4 IMPL-EVAL for this PR (durable `auth.*` streams runtime in `plugins/auth/streams/`).

**Execution-first — reproduce every gate and paste raw exit codes before any verdict.** Check out this PR branch (`feat/prime-time/auth-streams`, base `feat/prime-time/auth`) and run, from the repo root:

```
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root plugins/auth --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root plugins/auth --ext ts,tsx
deno test --unstable-kv --allow-all plugins/auth
deno check --unstable-kv plugins/auth/mod.ts
cd plugins/auth && deno task verify && deno task publish:dry-run
```

Then verify fitness from the code (cite `file:line`):

1. **Schema consumed, not redefined** — `streams/schema.ts` re-exports `authStreamSchema` /
   `AuthStreamSessionSchema` / `AuthStreamEvent` / `AuthStreamEventSchema` / `AUTH_STREAM_EVENT_TYPES`
   from `@netscript/plugin-auth-core/streams`; no new zod schema or `defineStreamSchema` call in
   `plugins/auth/streams/`.
2. **Producer correctness** — `getAuthStreamProducer()` is a memoized singleton over
   `createDurableStream({ streamPath: '/auth/sessions', schema: authStreamSchema, producerId:
   'auth-service' })`; emit helpers `upsert('authSession', …)` the correct state
   (oidc.completed→active, token.refreshed→`refreshedAt`, session.revoked→`state:'revoked'`) **and**
   return a typed `AuthStreamEvent`.
3. **Best-effort isolation** — emit helpers are guarded (try/catch + warn) so a producer/stream
   failure never throws out of the oRPC handler path; confirm the dedicated test asserts this, and
   that AS3's `auth-service_test.ts` round-trip still passes unchanged (the
   `[Auth Stream] … skipped: streams URL is not configured` warning is expected, not a failure).
4. **Wiring without contract drift** — `services/src/main.ts` starts the mirror best-effort on boot;
   `routers/v1-handlers.ts` emits at callback/signout/refresh-observe seams as side-effects placed
   **after** the response value, leaving AS3's asserted response shapes intact.
5. **Client factory** — `streams/factory.ts` `createAuthStreamDB` uses `createStreamDB` +
   `buildStreamUrl('/auth/sessions', baseUrl)` + `getStreamsAuth()` + `authStreamSchema`.
6. **Boundary** — diff confined to `plugins/auth/` + a 1-line `deno.lock` delta; no edits to
   `@netscript/plugin-auth-core`, `@netscript/plugin-streams-core`, `@netscript/cli`, aspire,
   scaffold-versions, root workspace/catalog, version pins, or the AS2 backends.

**Design point to validate (do not flag as a gap):** the durable subscribable surface is the
`authSession` **entity projection** — AS1's `authStreamSchema` is entity-only and
`DurableStreamProducer` exposes only `upsert`/`delete`/`flush`/`close` (no event-append primitive).
Discrete `AuthStreamEvent`s are typed payloads reflected as `authSession` state transitions. This is
the intended architecture, not a shortcut.

**Scope correctly deferred — do NOT penalize:**
- `startAuthStreamMirror()` is a **no-op** because AS3 backends expose no clean paged session-list
  surface (recorded as debt; real reconciliation port deferred).
- CLI + `database/auth.prisma` + scaffold/Aspire = **AS5**.
- e2e probes + honesty docs + debt consolidation (incl. the mirror reconciliation port and the
  auth-core `AuthSession` re-export gap) = **AS6**.

End with a single verdict token on its own line: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.
Preserve lock hygiene: do not commit `deno.lock` re-resolution or source churn unless an explicit,
reviewed fix is required.


Issue/PR title: AS4 — durable auth.* streams runtime (plugins/auth/streams/)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/27879065820-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/27879065820-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-90/run-27879065820-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 90
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/27879065820
