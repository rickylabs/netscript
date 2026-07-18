# DRAFT ONLY — Auth-gap discovery worklog

## Slice identity

- Run: `beta11-cli--orchestrator`
- Slice: `auth-gaps`
- Role/lane: discovery and board drafting; `complex_implementation`
- Worktree: `/home/codex/repos/wt-auth-gaps`
- Branch: `plan/auth-gaps`
- Inspected baseline: `fbb32119e4b8877ce32a07ccb1de3f252020f436`
- Status: discovery complete; drafts prepared for supervisor-dispatched Fable
  adversarial review

## Scope guard

This slice is planning-only. It creates `research.md`, `epic-and-issues.md`, and
this worklog. It does not change product code or create/update any GitHub issue,
epic, label, milestone, pull request, or release object. The supervisor files only
after adversarial review and owner ratification.

No sub-agents were dispatched from this Codex session. Therefore no sub-agent
brief was created. The owner-supplied merge, release, milestone, and #824
stop-lines remain in force.

## Skills and authority chain used

- `netscript-harness`: run artifacts, drafts-only seed-run rule, separate
  adversarial evaluator, and no self-certification.
- `netscript-pr`: issue taxonomy, colon labels, milestone mapping, epic/sub-issue
  linkage, acceptance gates, and issue-body non-closing policy.
- `netscript-deno-toolchain`: public API inspection began with `deno doc`.
- `netscript-doctrine`: package/plugin boundaries, vendor wrapping, public
  contracts, and architecture-debt reconciliation.
- `netscript-tools` and `rtk`: focused repository evidence and git verification.
- `claude-manager`: restored the exact Fable orchestrator session and re-enabled
  mobile Remote Control when requested by the owner.

## Discovery log

### 1. Public API inventory

Ran `deno doc` first against the entrypoints for:

- `packages/plugin-auth-core`
- `packages/auth-kv-oauth`
- `packages/auth-workos`
- `packages/auth-better-auth`
- `plugins/auth`
- the `packages/service` auth subpath

Then used focused source reads to establish runtime construction, unsupported
operations, CLI persistence, route capability reporting, telemetry/stream events,
and test helpers. The principal evidence and line references are recorded inline
in `research.md`.

### 2. Shipped-history and debt verification

- Inspected closed issue #709 and its implementation reference PR #720 to verify
  the shipped auth CLI command surface and acceptance boundary.
- Located `seamless-auth-roadmap` in
  `.llm/harness/debt/arch-debt.md:1237-1293` and quoted its current Better Auth
  statement.
- Verified that R0 (`plugins` and `betterAuthOptions` passthrough) has shipped,
  while R1–R5 remain; recorded the debt text as stale rather than repeating it as
  current behavior.
- Verified `auth-single-active-backend-boundary` and the one-entry service
  registry construction.

### 3. Live Microsoft research

Read official Microsoft documentation for identity-platform OAuth/OIDC, MSAL
client models, tokens/claims, Entra provisioning/SCIM, Conditional Access claims
challenges, app roles, group-claim limits, AD FS application migration, and hybrid
authentication choices. Mapped each enterprise need to direct KV OAuth, WorkOS,
shared NetScript contracts, or an explicit missing seam.

### 4. Live WorkOS capability sweep

Read official WorkOS documentation for AuthKit, SSO, Directory Sync, Admin Portal,
Audit Logs, Log Streams, MFA, users/organizations, RBAC, FGA, and Vault. Compared
each upstream capability with the current WorkOS authenticator/backend. The
existing adapter is primarily request-session verification; the enterprise
control-plane features are not exposed.

### 5. Live Better Auth capability sweep

Read official Better Auth documentation for the plugin catalog/architecture,
2FA, passkeys, magic links, organizations, admin, database/schema management,
sessions, rate limits, and server options. Confirmed that typed plugin/options
passthrough now ships, but schema generation, handler mounting, client plugin
scaffolding, normalized lifecycle operations, and supported capability profiles
do not.

### 6. Cross-cutting synthesis

Recorded gaps for multi-backend coexistence, organization-aware authorization,
enterprise audit, secrets lifecycle, tenant ownership, capability truth, and
testing/mocking/scaffold conformance. Proposed the ownership model:

- direct OAuth/OIDC → KV OAuth;
- enterprise federation/directory/control plane → WorkOS;
- application auth modalities → Better Auth upstream plugins;
- composition, normalized contracts, policy, audit, secrets, diagnostics, and
  conformance → NetScript.

## Key corrections to initial assumptions

- “No audit surface” was too absolute. Auth instrumentation and five durable
  events ship; the gap is an enterprise audit-log contract/product surface.
- “Better Auth plugins are only available through an undocumented escape hatch”
  is stale. Typed `plugins` and `betterAuthOptions` passthrough ships; operational
  integration remains incomplete.
- A core registry map type is not multi-backend support. Runtime builds one
  backend, and service capabilities currently overstate what ships.
- Direct Entra OAuth/OIDC support is not MSAL parity. Conditional Access claims
  challenges, confidential-client/OBO/Graph acquisition, and cache semantics need
  explicit contracts.

## Draft board decisions

- Epic: `Epic: Enterprise auth`
- Draft grouping label: `epic:enterprise-auth` (not present in the inspected label
  catalog; it must be created only during an owner-ratified filing pass).
- Fourteen sub-issues, EA-00 through EA-13.
- Every sub-issue includes `Part of #<epic-placeholder>`, `area:auth`, exactly one
  `status:triage`, a suggested milestone, dependencies, delivery shape, and
  acceptance boxes prefixed `gate:`.
- EA-00 capability truthfulness is the only proposed `0.0.1-beta.1` item. All
  other work is suggested for `Backlog / Triage` pending owner triage.
- No issue body uses an automatic issue-closing instruction.

## Orchestrator recovery requested during the slice

The owner asked for mobile reachability. The prior `beta11-orch` tmux process had
disappeared, so the exact Claude session
`86d308d5-c761-4e5d-a41f-8be959bc46d2` was resumed in tmux rather than replaced.
`/rc` was sent and the existing Remote Control endpoint was verified:

`https://claude.ai/code/session_01Li9hR82jgy6Y6468Svbswd`

After a second process exit, the same session was restored again with tmux
`remain-on-exit` enabled, and the `/rc` screen was left active at the owner's
request.

## Validation and handoff checklist

- [x] research starts from `deno doc` and focused repository evidence
- [x] every discovery leg has repository or official live documentation citations
- [x] Microsoft, WorkOS, Better Auth, and cross-cutting gap tables are present
- [x] each deliverable H1 says `DRAFT ONLY`
- [x] sub-issues use colon-label taxonomy and `Part of #<epic-placeholder>`
- [x] no product code or GitHub board object was changed
- [x] mechanical Markdown/draft invariants checked: 14 titles, 14 epic links,
  one `status:` and milestone per issue, valid catalog labels except the explicitly
  proposed epic label, 98 issue acceptance gates, and no automatic issue-closing
  instruction
- [x] branch committed and pushed to `origin/plan/auth-gaps`
- [ ] supervisor dispatches separate Fable adversarial review

This discovery session does not issue PLAN-EVAL or implementation verdicts.
