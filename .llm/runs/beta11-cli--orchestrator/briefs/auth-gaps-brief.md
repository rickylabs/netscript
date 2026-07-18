use harness. You are the auth-gaps DISCOVERY agent (Codex · GPT-5.6 Sol · high,
`complex_implementation` lane used for deep research + board drafting) for run
`beta11-cli--orchestrator`, supervised by the Fable 5 orchestrator (session 86d308d5). This is a
PLANNING-ONLY slice: no product code changes, drafts only — the supervisor files after an
adversarial review.

## SKILL

Activate `netscript-harness`, `netscript-pr` (issue taxonomy — colon labels, `Part of #<epic>`,
never a closing keyword in issue bodies), `netscript-deno-toolchain` (`deno doc` first). Worktree:
`/home/codex/repos/wt-auth-gaps`, branch `plan/auth-gaps`. Run dir:
`.llm/runs/beta11-cli--orchestrator/slices/auth-gaps/` (create; research.md + drafts + worklog).

## Mission (owner-directed)

Produce the complete auth-layer gap inventory and an `epic: enterprise auth` board draft. The
owner's goal, verbatim spirit: ensure NetScript (a) covers ALL enterprise auth needs —
**particularly the Microsoft auth layers** — and (b) **fully leverages WorkOS's and Better
Auth's enormous capabilities** (today we barely scratch them).

## Discovery legs (all cited)

1. **Shipped inventory**: `deno doc` + focused reads over `packages/{auth-better-auth,
   auth-kv-oauth,auth-workos,plugin-auth-core}`, `plugins/auth`, the service auth subpath, and
   the auth CLI verbs (#709 shipped surface). What EXACTLY ships: flows, backends, session model,
   guards, config seams. Known limits to verify: one-active-backend, interactive flow only on
   kv-oauth, no audit surface, the `arch-debt: seamless-auth-roadmap` entry (find + quote it).
2. **Microsoft enterprise layer** (owner priority): what enterprise buyers need — Entra ID (OIDC/
   OAuth2, MSAL patterns), SAML federation, SCIM provisioning, conditional access implications,
   group/role claims mapping, on-prem AD FS realities. Map each need → shipped/partial/missing
   in NetScript, and WHICH backend should carry it (WorkOS's SSO/Directory Sync covers much of
   this — that's the leverage argument).
3. **WorkOS capability sweep** (live docs): SSO (SAML+OIDC), Directory Sync/SCIM, Admin Portal,
   Audit Logs, MFA, Organizations, RBAC/FGA, Vault... vs what our workos backend actually uses
   today. Table: capability × exposed-in-NetScript × gap.
4. **Better Auth capability sweep** (live docs): plugins ecosystem (2FA/passkeys/magic-link/
   organizations/admin/rate-limit...), database adapters, session management breadth vs our
   better-auth backend's use. Same table.
5. **Cross-cutting gaps**: multi-backend coexistence, RBAC/authz story (route guards vs policy),
   token/session audit, secrets lifecycle, multi-tenant orgs, testing/mocking surface for auth in
   scaffolds.

## Deliverables (drafts only — say so in each H1)

- `research.md` — the cited inventory + gap tables.
- `epic-and-issues.md` — the `epic: enterprise auth` draft + sub-issue drafts (title, body with
  `Part of #<epic-placeholder>`, colon labels incl. `area:auth`, acceptance `- [ ] gate:` boxes,
  suggested milestone Backlog/Triage unless a gap is release-critical), dependency notes, and a
  proposed phasing (what leverages WorkOS/Better-Auth config-first vs needs new adapter code).
- Commit + push (`git push origin HEAD:refs/heads/plan/auth-gaps`), then STOP — the supervisor
  dispatches the Fable adversarial. Do NOT create any GitHub issue/epic/label.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
