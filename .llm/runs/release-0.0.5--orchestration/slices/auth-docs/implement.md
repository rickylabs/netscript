use harness

# Slice W2 (docs lane): operational auth session lifecycles — #1106

You are the documentation-authoring agent for the PR closing #1106 (milestone 0.0.5, run
`release-0.0.5--orchestration`). Read the issue body first: six acceptance boxes, all
docs/example work. You author documentation only — **no `packages/` or `plugins/` source
changes of any kind** (the changed-file audit at the orchestrator's pre-merge gate rejects
them from this lane).

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `docs/site` conventions as practiced by the existing auth manual pages.

## Evaluator rule

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol (orchestrator ruling D6): no
local formal PLAN-EVAL for a per-PR slice — evaluation composes draft→ready review + the
orchestrator's pre-merge gate. Write a short plan in your slice worklog, then author.

## Deliverable (from #1106's boxes)

Auth manual coverage of operational session lifecycles for the three adapters:

1. `auth-better-auth`: mounting `auth.handler`, `responseHeaders`/`setCookies` forwarding.
2. `auth-kv-oauth`: sign-in/callback/session/sign-out flow, `allowedReturnTo`.
3. `auth-workos`: `createWorkosAccessTokenAuthenticator`, JWKS/audience/issuer, Principal
   mapping.

Every example compiles against the **published adapter entrypoints** (exact subpath imports;
type-check your examples with the scoped wrapper `deno run --allow-read --allow-run
.llm/tools/run-deno-check.ts --root <example dir> --ext ts,tsx` or the docs suite's own check).
Out of scope, explicitly: changing providers, token/session cryptography, any adapter source.

## Verification before handoff

- Docs link checks green (`deno task` docs checks as mapped in `.llm/harness/workflow/tooling.md`).
- Examples type-check; quote the command + result in your slice worklog.
- No `packages/**`/`plugins/**` files in your diff (self-audit with `git diff --name-only`).

## PR contract

Branch `docs/auth-session-lifecycles` (worktree provided), target `main`. Labels: `type:docs`,
`area:auth`, `area:docs`, exactly one `status:`; milestone `0.0.5`. Body: `Closes #1106` only
with every box truthfully ticked and evidence quoted; authoritative `## Definition of Done`
section per the shipped PR template. Push via explicit refspec
(`git push origin HEAD:refs/heads/docs/auth-session-lifecycles`), open the PR as draft, and
record a handoff note in `worklog.md` in this slice dir. The orchestrator holds merge.
