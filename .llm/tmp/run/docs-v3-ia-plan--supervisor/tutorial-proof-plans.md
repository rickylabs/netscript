# Tutorial-Track Proof Plans

Closes Codex panel **blocker #3** ("Tracks B and C are claimed as playground-validated, but the grounding
artifact says the opposite"). The `netscript-start/apps/playground` showcase explicitly has **no user-auth
surface** and **no demonstrated non-TS polyglot tasks** (`ground/playground-showcase-map.md` §1.5, §6). So
Tracks B and C cannot be grounded in the playground.

**Rule (binds WS2 acceptance):** No tutorial-track prose is authored in the build run until that track's
**proof gate** below passes — a real scaffold + minimal skeleton + smoke command that demonstrates the track's
spine on `origin/main`. The proof run writes evidence to `.llm/tmp/run/docs-v3-build--*/proof/<track>.md`. A
track whose proof gate cannot pass is **rescoped or cut**, not authored speculatively.

---

## Track A — Storefront (sagas/payments) · grounding: **DIRECT (playground)**
- **Source:** `apps/playground` dashboard/orders + `sagas/order-saga.ts` + `workers/jobs/process-payment.ts`
  + `triggers/payment-status-webhook.ts`. Fully demonstrated end-to-end (showcase §3, §4.2).
- **Proof gate:** none beyond scaffold-output verification — the pattern is live in the showcase. Verify the
  scaffolded saga/worker/webhook wiring still type-checks on `origin/main`.

## Track D — Live Dashboard (Fresh + SDK + streams) · grounding: **DIRECT (playground)**
- **Source:** `dashboard/framework/{streamdb,tanstack}`, `islands/SagasLiveIsland.tsx`, `lib/api-clients.ts`,
  `sdk/{client,query,cache,discovery,query-client}`, `fresh/{builders,query,defer,streams}`. The signature
  contract→client→query-factory→`definePage`→`QueryIsland`→`useLiveQuery` flow is the showcase spine.
- **Proof gate:** scaffold-output type-check only; pattern is live.

---

## Track B — Team Workspace (auth + multi-tenant data) · grounding: **NOT in playground → proof gate REQUIRED**

The playground has zero user-auth. But the auth program **is shipped** on `origin/main` (`plugins/auth`,
`packages/{plugin-auth-core, auth-kv-oauth, auth-workos, auth-better-auth}`, `service/auth`, `#103` AS8). The
track must be grounded in that surface + scaffold output, not the playground.

**Pre-authoring proof gate (must pass before Track B prose):**
1. **Scaffold:** `netscript create workspace-demo` → `netscript plugin add auth` (verify the auth plugin
   scaffolds DB schema `auth.prisma`, Aspire wiring, and the `:8094` auth service).
2. **APIs the track will teach (must exist via `deno doc`):** `plugin-auth-core` `domain`/`ports`/`presets`;
   `service/auth` `.withAuthn()/.withAuthz()` middleware seam; one concrete backend (`auth-kv-oauth` interactive
   `flow`/`backend`/`providers`, or `auth-workos`/`auth-better-auth`).
3. **Minimal skeleton:** one `defineService` with an authenticated route guarded by `.withAuthz()`, a second
   org-scoped table (multi-tenant), and a provisioning `defineJobHandler` on org-create.
4. **Smoke gate:** `deno task e2e:cli run scaffold.runtime` already exercises the auth path on scaffold; the
   proof run additionally asserts an authenticated request succeeds and an unauthenticated one is rejected
   (capture both responses). **Multi-tenant "orgs/RBAC" claims are limited to what the backends actually
   expose** — if org/role primitives are not first-class in `plugin-auth-core`, the track teaches
   session+route-authz only and the "orgs" framing is dropped to match reality.
- **Rescope trigger:** if step 4 cannot demonstrate org-scoping, Track B becomes "Authenticated SaaS"
  (auth + session + route authz) and multi-tenant orgs move to a clearly-marked "advanced / extend" aside.
- **Recorded decision (mandatory):** `proof/track-b.md` MUST end with an explicit verdict line —
  `SCOPE: full-multitenant` (org-scoping demonstrated) or `SCOPE: authenticated-saas` (rescoped) — plus the
  captured authenticated/unauthenticated responses that justify it. The build run reads this line to pick the
  Track B outline; absent or unproven org-scoping is **not** allowed to default to the multi-tenant framing.
  This makes the fallback an exercised branch, not a latent escape hatch.

## Track C — ERP Sync (jobs + polyglot tasks) · grounding: **partial → proof gate REQUIRED for polyglot**

The job/queue/cron/trigger spine **is** demonstrated (TS jobs in `workers/jobs/`, `defineFileWatch` CSV import
in `triggers/product-import.ts`, topic config). But **non-TS polyglot tasks are asserted, not demonstrated** in
playground code (showcase §6). `TASK_TYPES = deno|python|dotnet|cmd|powershell|shell|executable` exists in
`plugin-workers-core/src/domain/constants.ts`, but example task code must come from elsewhere.

**Pre-authoring proof gate (must pass before Track C's polyglot chapter):**
1. **Locate a real non-TS task example** on `origin/main` (search `plugin-workers-core` tests/examples and any
   `examples/*` for a `python`/`shell` task definition + `TaskPermissionsSchema` usage). If none exists, the
   build run **authors a minimal runnable one** (a `python` or `shell` task with explicit
   net/read/write/run permissions) and proves it executes via the worker subprocess runtime.
2. **Smoke gate:** scaffold a project, define one `shell` (portable) + one `python` task, run the worker in
   `subprocess` mode, and capture the task output + the traceparent propagation into the child process.
3. **Rescope trigger:** if the polyglot subprocess runtime cannot be demonstrated on the doc author's platform,
   the polyglot chapter is documented from the **capability hub** (`capabilities/polyglot-tasks`) with the task
   schema + permission matrix and a clearly-marked "runtime support matrix" rather than a hands-on tutorial
   step; the ERP track's hands-on spine stays TS jobs + queue + cron + file-watch trigger (all demonstrated).

---

## Why this satisfies the panel

- Tracks B/C no longer **claim** playground grounding they don't have; each names its real source and a
  concrete proof-or-rescope gate.
- The gates run on `origin/main` before prose, so the build run cannot "rediscover the gap after prose and
  components already exist."
- Each gate has an explicit rescope fallback, so a track can't silently overpromise auth-orgs or polyglot that
  the framework doesn't yet support.
