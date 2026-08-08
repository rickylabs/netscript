export const meta = {
  name: 'e-rfc-plan-eval-deep-dives',
  description: 'PLAN-EVAL deep dives for RFC-A (#1390) and RFC-B (#1389) — read-only, return-only',
  phases: [{ title: 'DeepDives', detail: 'three Opus xhigh verification agents' }],
}

const A = '/home/codex/repos/ns-rfc-sdk-client'
const B = '/home/codex/repos/ns-rfc-command-kit'

const COMMON = `You are an Opus deep-dive verifier assisting a PLAN-EVAL of an RFC. STRICTLY
READ-ONLY: write NO files anywhere, mutate NO GitHub state. You verify claims against source and
primary docs and RETURN findings only. Every finding: cited (file:line / URL / executed command +
output). Distinguish VERIFIED / REFUTED / UNPROVEN. Be adversarial: your job is to find where the
RFC is wrong, unimplementable, or hiding a decision that forces rework. Dense; <=120 lines back.
Web research via ToolSearch (firecrawl/WebFetch) is allowed for primary sources only.`

phase('DeepDives')

const jobs = [
  {
    label: 'dd:orpc-v2-audit',
    prompt: `${COMMON}
SUBJECT: RFC-A oRPC v2 audit amendment. Worktree ${A} (branch docs/rfc-sdk-client-contribution),
RFC at rfcs/0000-sdk-client-contributions.md — read its v2-related sections (search "v2", "beta",
"RequestHeaders", "migration") and commits 7a0d39808 + 7be129d80 (git show).
VERIFY against OFFICIAL primary sources (orpc.dev docs, github.com/dinwwwh/orpc releases/
changelogs, npm dist-tags for @orpc/client and @orpc/server):
1. Current v2 status TODAY (2026-08-08): latest v1 stable, latest v2 tag, is v2 still beta or
   released? Is "superseded beta" accurate?
2. v2 breaking changes the RFC claims (esp. RPC verb restriction / POST-only default, link/plugin
   API changes): quote the primary source for each.
3. RequestHeadersHandlerPlugin: what does it actually do per official docs — incoming SERVER-side
   header access, or an outbound CLIENT header seam? The RFC treats it as an incoming-server
   companion, NOT the outbound client seam — adjudicate that treatment.
4. The chosen decision: "co-design an upstream-major-neutral RFC-A now on stable v1; keep the
   ~60-file v2 migration as a separate RFC/spike". Adjudicate: is the RFC's protocol actually
   major-neutral (does any public protocol type/semantic depend on v1-only behavior, e.g.
   GET-based method inference)? What EXACT gates should the separate v2 RFC carry?
5. Check the pinned @orpc/* versions in ${A}/deno.lock and deno.json files.
RETURN: numbered verdicts with sources, + any misquote/staleness in the RFC's v2 sections.`,
  },
  {
    label: 'dd:rfc-a-types',
    prompt: `${COMMON}
SUBJECT: RFC-A type/protocol mechanics. Worktree ${A}. Read rfcs/0000-sdk-client-contributions.md
FULLY, then verify against packages/sdk (+ packages/service, packages/plugin) source:
1. UPSTREAM-TYPE LEAKAGE: does the proposed PUBLIC protocol (contribution interface, context,
   hooks) reference any @orpc/* type, TanStack type, or other upstream type — directly or through
   a type it embeds? List every public type in the protocol and its transitive upstream deps.
   The RFC claims zero upstream types in the public protocol — VERIFY or REFUTE precisely.
2. THREE PRIVATE ADAPTER PORTS: what are they, do they cover every place a contribution must
   touch (link construction, request context, query layer), and is "private" enforceable (not
   exported from any mod.ts / publishable entrypoint)?
3. PREPARE-EXACTLY-ONCE ACROSS RETRY: find the current retry implementation in packages/sdk
   (client retry loop — where does a retry re-enter?). Does the RFC's chosen design (outer
   wrapper vs immutable memoization — which did it choose?) actually guarantee prepare() runs
   exactly once per LOGICAL call across retries, including async credential refresh mid-retry?
   Any hole (e.g. per-attempt link invocation, AbortSignal reuse, header re-evaluation)?
4. CONTRIBUTION IDENTITY/ORDER/CONFLICTS: deterministic ordering? duplicate-id policy?
   conflict = compile-time, config-time, or silent last-wins?
5. ASYNC CREDENTIALS + REDACTION: can prepare() be async without breaking the memoization
   design? Is redaction (headers in traces/logs/diagnostics) specified with an enforceable
   surface or hand-waved?
6. CACHE PARTITION / DIRECT-ONLY SAFETY + QUERY PROPAGATION: does contributed identity partition
   the query cache correctly (key derivation), and is the direct-only (non-query) path prevented
   from poisoning cached identity? How does contribution context reach queryOptions?
7. INFERENCE BUDGET + GENERATED ERGONOMICS: instantiation-depth risk (chained generic builders),
   and does the generated module (T2-02 generator) stay writable by a machine (no hand-tuned
   generics)?
8. DIAGNOSTICS + MIGRATION: doctor/diagnostic surface named? migration path for existing
   createServiceClient callers (breaking or additive)?
RETURN: per-item VERIFIED/REFUTED/UNPROVEN with exact RFC section anchors + source citations.
Flag anything that forces rework if deferred (plan-gate standard).`,
  },
  {
    label: 'dd:rfc-b-semantics',
    prompt: `${COMMON}
SUBJECT: RFC-B command-kit semantics. Worktree ${B} (branch docs/rfc-command-composition-kit).
Read rfcs/0000-command-composition-kit.md FULLY, then verify against packages/database,
packages/queue, plugins/workers, plugins/sagas, plugins/triggers source:
1. PACKAGE OWNERSHIP + DEPENDENCY DIRECTION: which package owns the kit per the RFC; does its
   dependency arrow respect doctrine layering (service -> database? new package? does anything
   make @netscript/database depend on service-layer types)?
2. TRANSACTION-CLIENT BINDING: exactly how does a command's code get the transactional client?
   Check against packages/database reality (withTransaction at mod.ts:128 area, Prisma
   interactive transactions, IsolationLevel/TransactionOptions at ports/database-client.ts:59-77).
   Is the binding explicit-parameter or ambient/context? REJECT ambient per the eval charter —
   does the RFC hide ambient state anywhere (AsyncLocalStorage etc.)?
3. RECEIPT RACES + CANONICAL IDENTITY: idempotency key + request-hash design — what happens on
   concurrent duplicate submits (both miss the receipt, both run)? Is uniqueness enforced by a
   DB constraint in the SAME transaction, or check-then-act? Canonical receipt identity across
   retries with different request hashes?
4. CAS/ISOLATION/PROVIDER CLAIMS: expected-version CAS under each isolation level; are provider
   claims honest for postgres vs sqlite vs mysql (check adapters; e.g. #1293 MySQL surface)?
   Refusal matrix for providers that cannot deliver (sqlite concurrent writers)?
5. SAME-COMMIT INVARIANTS: business state + audit + outbox in one commit — does the design ever
   allow a code path where outbox write happens outside the transaction? Relay lease/terminal/
   crash semantics: at-least-once with lease takeover — is exactly-once ever implied (REJECT
   hidden exactly-once)? Crash between commit and relay?
6. RUNTIME BOUNDARY: workers/sagas/streams/webhooks — does the kit stay out of their delivery
   semantics (no second queue, no shadow saga)? Where does outbox relay run (worker? own
   process?) and does that conflict with plugins/workers lease/redelivery reality?
7. TYPED ERRORS: feasibility of the typed error surface given the current safe()/isDefinedError
   defect; is the RFC-A/#1350 dependency correctly declared and non-circular?
8. SECURITY/PRIVACY + TELEMETRY: payload/PII in receipts/audit/outbox — redaction specified?
   Telemetry cardinality (per-command labels) bounded?
9. STANDARD SCHEMA/CODECS + GENERATION OWNERSHIP + MIGRATIONS: who owns table DDL — REJECT
   hidden migrations (does the RFC create tables implicitly?); Standard Schema usage vs Zod
   pinning; which CLI generator owns emission and does that collide with T2-02/#1350-#1353?
10. FCP QUESTIONS: list the RFC's open/FCP questions verbatim and judge each: safe to defer, or
    forces rework (plan-gate standard)?
RETURN: per-item VERIFIED/REFUTED/UNPROVEN with exact RFC anchors + file:line citations.`,
  },
]

const results = await parallel(jobs.map(j => () =>
  agent(j.prompt, { label: j.label, phase: 'DeepDives', model: 'opus', effort: 'xhigh' })))

return { dives: results.filter(Boolean) }
