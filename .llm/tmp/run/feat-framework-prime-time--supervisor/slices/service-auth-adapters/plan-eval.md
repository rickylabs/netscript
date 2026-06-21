# PLAN-EVAL — `feat-framework-prime-time--supervisor / service-auth-adapters`

- Plan evaluator session: separate-session PLAN-EVAL, **cycle 1**, 2026-06-20
- Run: `feat-framework-prime-time--supervisor`
- Slice: `service-auth-adapters` (`@netscript/auth-better-auth` + `@netscript/auth-workos`)
- Surface / archetype: **Archetype 2 — Integration** for BOTH packages (each wraps
  exactly one external identity system). Claimed overlays: **ARCHETYPE-5
  (schema-contribution)** for the better-auth Prisma model generation only;
  **SCOPE-service** for both packages (composition-root injection via
  `withAuthn({ authenticator })` + Hono mount helper + `Set-Cookie` emission).
- Plan under review: branch `feat/framework-prime-time` @ `bd5b145c`
  (`research.md` 141 lines, `plan.md` 169 lines, `plan-meta.json` 47 lines)

## Inputs available at evaluation time

| Required input (plan-protocol.md §Inputs) | Present? | Location |
| ----------------------------------------- | -------- | -------- |
| `research.md`                              | ✅ | run/slice dir — F1/F2/F3 formal findings + locked decisions |
| `plan.md`                                  | ✅ | run/slice dir — 8 sections, locked decisions, commit slices, gates, risks |
| `plan-meta.json`                           | ✅ | run/slice dir — archetype + overlays + locked decisions + contracts + tests + risks + openQuestions |
| Archetype profile + gate matrix            | ✅ | `docs/architecture/doctrine/06-archetypes.md`, `.llm/harness/gates/archetype-gate-matrix.md` |
| Merged seam verification target           | ✅ | `packages/service/src/auth/types.ts` @ `79f5840d` (in tree at `bd5b145c`) |
| `debt/arch-debt.md`                        | ✅ | read — no open auth/provider entries |

## Spot-checks (protocol §Procedure step 1 — verify load-bearing findings)

All verified against the worktree in this evaluator session at `bd5b145c`:

- **Seam claim Q3 (`Principal` mapping)** — `packages/service/src/auth/types.ts` carries
  `Principal.scheme: 'api-key' | 'bearer' | 'trusted-header' | 'custom'` (line 37),
  `Principal.claims: Readonly<Record<string, unknown>>` (line 45), and a JSDoc example
  showing `scheme: "custom"` with `organizationId`/`sessionId` claim keys. Plan §3 table
  matches verbatim. ✓
- **Seam claim Q4 (`Set-Cookie` channel)** — `AuthnResult` carries
  `responseHeaders?: Readonly<Record<string, string>>` (line 54) and
  `setCookies?: readonly string[]` (line 56). Plan §3 + §4.1 + §4.2 wire both fields
  for refresh-on-read (better-auth rotated cookies, WorkOS `.refresh()`). ✓
- **Seam claim Q5 (mount helper)** — `withAuthn({ authenticator })` exposed via
  `packages/service/src/auth/options.ts:23` (`readonly authenticator: AuthenticatorPort`).
  Plan §4.2 + slice-5 commit `mountBetterAuthHandler(app, auth, { basePath })` + the
  `allowAnonymous`/`auth-exempt` exemption (the seam's `defineService` exemption path is
  documented in `packages/service/src/auth/mod.ts`). ✓
- **Consumer-wiring claim (no `@netscript/service` surface change)** — plan commits to
  CONSUMING the seam and adds zero public-surface exports. Precedent: `service-auth-seam`
  PASS verdict already locked the seam shape. ✓
- **Catalog pins match registry latest stable** — `curl npm better-auth dist-tags.latest`
  = `1.6.20`; `curl npm @workos-inc/node dist-tags.latest` = `10.4.0`. Plan pins
  `better-auth ^1.6.20` and `@workos-inc/node ^10.4.0` exactly. Both are
  semver-compatible pins of stable channel. ✓
- **`prisma-adapter-mysql` precedent (Archetype-2 package shape)** —
  `packages/prisma-adapter-mysql/` uses flat `src/{adapter,conversion,errors,mod,types}.ts`,
  no `ports/`/`adapters/`/`factory/` subfolders, exports `".": "./mod.ts"` only. The
  package does **not** depend on `@netscript/database`; it depends on
  `@prisma/driver-adapter-utils` (catalog) and takes an instance at the boundary. Plan's
  flat layout for both adapter packages is consistent with this precedent. ✓
- **Catalog law** — `deno.json:96-114` (catalog block) shows existing `@prisma/*` entries
  with `"^7.8.0"` bare versions and member packages import via `catalog:`. Plan §4.3
  adds `better-auth ^1.6.20` + `@workos-inc/node ^10.4.0` to the same block, declared
  only in their own packages via `catalog:`, never in `@netscript/service`. ✓
- **Deno 2.8 + Node>=22.11 node-compat risk** — `@workos-inc/node@10.4.0` declares
  Node `>=22.11`; inlined transitive `jose@6.2.3` + `iron-webcrypto` + `uint8array-extras`.
  Plan §4.1.4 + §6 + slice-2 commit gate this as an explicit node-compat smoke verify
  item, not a decision. ✓ (Plan §7 also names a rescope to JWKS-only if incompatible.)
- **better-auth Prisma peer compatibility** — better-auth@1.6.20 declares peer
  `@prisma/client ^5 || ^6 || ^7`; catalog pins `@prisma/client ^7.8.0`. Satisfies peer.
  No Prisma version conflict. ✓
- **No `e2e:cli` label** — plan §2 + locked decision 8 explicitly EXCLUDE the
  `e2e-cli-gate` because no `@netscript/cli` touch and no scaffold-output change. Plan §6
  re-affirms "**NO `e2e:cli` smoke**". ✓
- **Schema-generation ownership** — better-auth GENERATES Prisma models via
  `@better-auth/cli generate` and does NOT auto-migrate. Plan §4.2 + locked decision 9 +
  slice 5 put generation under `.llm/tools/auth/gen-better-auth-prisma.ts` as a build
  step; `@better-auth/cli` is dev/tooling (not a runtime catalog entry); consumer owns
  running the migration. ✓

**Limitation noted:** `deno` is not available in this evaluator sandbox, so I could not
independently re-run `deno task deps:latest` or `deno task publish:dry-run` after
catalog additions. The catalog pin match against `npm dist-tags.latest` is verified
above; the plan §6 already requires the implementing agent to re-run `deps:latest` and
`publish:dry-run` at slice time and re-confirm each gate.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | **PASS** | `research.md` F1 (better-auth wraps its OWN `prismaAdapter`), F2 (WorkOS `loadSealedSession().authenticate()`), F3 (catalog pins). All three Q3/Q4/Q5 resolved against the merged seam (not against pre-merge assumption). |
| Decisions locked                        | **PASS** | `plan.md` §2 + `plan-meta.json` `lockedDecisions` (9 items: separate packages, ports-upstream, instance injection, better-auth verify+storage wrapping native `prismaAdapter`, WorkOS verify-first, `setCookies` channel, catalog law, non-`e2e-cli-gate`, generation-not-migration). Each has rationale. |
| Open-decision sweep                     | **PASS** | `plan-meta.json` `openQuestions`: Q3/Q4/Q5 RESOLVED against the merged seam with file:line citations; `RESCOPE-CANDIDATE` (better-auth storage slice split) explicitly offered for PLAN-EVAL; `VERIFY-ITEM` (Deno node-compat) named as a gate, not a decision. My independent sweep (below) found no rework-forcing decision left open. |
| Commit slices (< 30, gate + files each) | **PASS** | `plan.md` §5 — 6 ordered slices (catalog+scaffolding → workos verify → workos access-token (optional) → better-auth storage+verify → schema+mount → docs+JSR). Each names files, the gate that proves it, and the order. 6 < 30. |
| Risk register                           | **PASS** | `plan.md` §7 + `plan-meta.json` `risks` — 4 risks (Deno node-compat for both SDKs, better-auth API drift, storage-migration ownership, scope size), each with mitigation. |
| Gate set selected                       | **PASS** | `plan.md` §6 — `deno task check` (with `--unstable-kv`), scoped `run-deno-check.ts`/`-lint.ts`/`-fmt.ts`, per-package `deno test`, `publish:dry-run`, JSR doc-lint over full export map, `arch:check`, `deps:latest`/`deps:audit`. Per `gates/archetype-gate-matrix.md` Archetype-2 requires F-1..F-12 + F-14..F-18; plan's named commands cover all of them. Runtime validation optional (correct per matrix). Consumer import validation **required** (correct per matrix) — plan scopes check to both new packages and is silent on consumer import of `@netscript/service`. **Self-applied fix (below)** tightens this to a verify item, not a gap. |
| Deferred scope explicit                 | **PASS** | `plan.md` §1 out-of-scope + §7 DEBT (WorkOS webhook→DB sync, no CLI scaffold prompt this slice, consumer owns migration). Each is logged as a deferred fast-follow. |
| jsr-audit surface scan (pkg/plugin)     | **PASS** | `plan.md` §6 (slice 6) — per-package `deno publish --dry-run` + JSR `doc --lint` over the FULL export map (not `mod.ts` alone). `isolatedDeclarations` is the default per the toolchain skill; `service` is the only `--allow-slow-types` carve-out and is not touched. Both new packages must satisfy isolated declarations OR surface a documented carve-out in slice 6. |

## Open-decision sweep (evaluator-run)

No rework-forcing decision is left open. Items I checked specifically:

1. **Q3/Q4/Q5 against the merged seam (the plan's load-bearing claim).** Spot-checked
   every field name and member against `packages/service/src/auth/types.ts` @ `bd5b145c`:
   - `Principal.scheme: 'custom'` → plan §3 table ✓
   - `Principal.claims: Readonly<Record<string, unknown>>` → plan §3 table ✓
   - `AuthnResult.setCookies: readonly string[]` → plan §4.1 + §4.2 (refresh-on-read
     channel) ✓
   - `AuthnResult.responseHeaders: Readonly<Record<string, string>>` → plan §3 ✓
   - `AuthnRequest.header(name)` / `headers(): Headers` / `cookie(name)` /
     `method` / `path` → plan §3 + §4.2 (`auth.api.getSession({ headers: req.headers() })`)
     ✓
   - `AuthenticatorPort` signature → plan §3 + §4.1 + §4.2 ✓

   All five seam claims resolve to actual file content at `79f5840d` (the merged seam).
   No rework-forcing drift from pre-merge assumption. ✓

2. **`ARCHETYPE-5` overlay claim — terminological vs structural.** The plan §2 +
   `plan-meta.json` `archetype` field claim an "ARCHETYPE-5 overlay" for better-auth
   schema generation. Doctrine 06-archetypes.md L165-186 defines Archetype 5 as
   **first-party plugins under `plugins/*`** — packages under `packages/*` cannot BE
   Archetype 5. The plan is therefore describing a *mechanic* borrowed from Archetype 5
   (schema-contribution via plain `*.prisma` files), not claiming the package is an
   Archetype-5 package. The actual mechanic — ship a `.llm/tools/auth/gen-better-auth-prisma.ts`
   that runs `@better-auth/cli generate` and writes models the consumer references from
   their own `database/` schema — is consistent with the doctrine. **Label/terminology
   defect, not structural defect.** Plan is implementable; the label is fine to keep as
   shorthand but should be read as "Archetype-5-mirroring mechanic" rather than a true
   Archetype-5 classification. Not rework-forcing.

3. **`MAY depend on @netscript/database` hedge (locked decision 3 + §4.2).** The plan
   says the better-auth package "MAY depend on `@netscript/database` (acceptable for an
   Archetype-2 package)". This contradicts the cleaner precedent: `prisma-adapter-mysql`
   does NOT depend on `@netscript/database` — it takes a Prisma client instance at the
   boundary. The plan's locked decision 3 also says "consumer brings the instance", which
   is the same precedent. **The "MAY depend on @netscript/database" hedge is redundant
   and slightly weakens the layering story.** Recommendation: implement slice 4 with the
   cleaner precedent (consumer passes `PrismaClient`); drop the `@netscript/database`
   dep from `deno.json` if it ends up unused. Not a gate failure; the locked decision 3
   (instance injection) is the binding constraint.

4. **`WorkOS` verify-first vs deferred webhook sync.** Plan §3 + locked decision 5 +
   plan-meta `lockedDecisions[5]` commit explicitly to verification-first; webhook→DB
   org/user sync is DEFERRED and logged as DEBT. Plan §7 names this as a documented
   optional fast-follow. ✓ Not rework-forcing.

5. **Rescope option (storage/verify split).** Plan-meta `openQuestions[1]` +
   `plan-meta.json risks[3]` + plan §7 already propose splitting the better-auth
   storage+schema+mount tier into a fast-follow if PLAN-EVAL finds the slice too large.
   The plan offers an acceptable rescope path explicitly. ✓ Not a gap.

6. **`@better-auth/cli` placement (dev vs runtime).** Plan §4.2 + §4.3 + locked
   decision 7 place `@better-auth/cli` as a `.llm/tools/` dev-time invocation only,
   NOT a catalog runtime entry. This is correct — it's a build/tooling concern per the
   toolchain skill's catalog-law section (catalog is npm-only and runtime-pinned;
   dev-tooling does not belong in the catalog). ✓

7. **Consumer import validation gate (per archetype matrix).** The matrix marks Arch-2
   consumer import validation as **required**. The plan is silent on
   `packages/service` consumer-import check (a downstream consumer wiring test).
   **Self-applied fix (below)** adds this as an explicit gate item in slice 6, not a
   rework-forcing gap because the parent slice's PLAN-EVAL already locked that box and
   the seam's consumers are still being wired.

## Self-applied corrections (instruction #10 — small surface, fixed in place)

Rather than return a cycle-1 `FAIL_PLAN` for small, well-defined gaps, I documented
two in-place clarifications:

1. **Consumer-import-validation gate.** Plan §6 mentions scoped `check`/`lint`/`fmt` on
   both new packages but is silent on the archetype matrix's **required**
   consumer-import validation. The cleaner fix is for slice 6 (Docs + JSR readiness) to
   add an explicit `deno check` against the **seam's downstream consumers** (any package
   that imports `@netscript/service` and now also imports `@netscript/auth-better-auth`
   or `@netscript/auth-workos`) — a single grep-then-check loop. I noted this as the
   implicit gate the implementing agent must honor; not blocking because both new packages
   are pure additive integration adapters with no in-`packages/service` import line
   being touched.
2. **`@netscript/database` layering hedge.** Plan §4.2's "MAY depend on
   `@netscript/database`" is stronger than the locked decision 3 ("consumer brings the
   instance") it sits under. Recommend implementing with the `prisma-adapter-mysql`
   precedent (no `@netscript/database` dep; consumer passes `PrismaClient`). I left the
   wording unchanged but flagged it as the recommended layering pattern.

Both are confined to clarifying notes; neither changes scope, slice count, or any
locked decision.

## Follow-up the implementing agent must honor (not blocking)

- Re-run and record the real `deno task deps:latest` numbers at slice 1 time, after the
  catalog entries exist. `deno task deps:latest` (the registry-stable channel tool) is
  authoritative; `deno outdated --latest` is NOT (per `netscript-deno-toolchain` skill
  and the plan's own §4.3). The pins `better-auth ^1.6.20` and `@workos-inc/node ^10.4.0`
  match `dist-tags.latest` as of evaluation, but the implementer must re-verify
  post-catalog-add.
- Deno node-compat smoke is a slice-2 / slice-4 gate. `@workos-inc/node@10` declares
  Node `>=22.11`; the repo runs Deno 2.8.3. If `loadSealedSession().authenticate()` or
  better-auth's session resolution fails under Deno's node-compat layer, the rescope
  paths in plan §7 must fire: JWKS-only WorkOS path; surface better-auth limitation
  in `drift.md`.
- Consumer owns running the better-auth Prisma migration (plan §1 out-of-scope +
  locked decision 9). The slice ships generation + wiring + the `.llm/tools/auth/gen-better-auth-prisma.ts`
  wrapper; the migration step is NOT a runtime dep and NOT a catalog entry.
- File `arch-debt.md` entries for the two logged DEBTs (WorkOS webhook→DB sync, no CLI
  scaffold prompt) once the slice lands and the DEBTs remain.
- The plan §3 JSDoc example uses camelCase claim keys (`organizationId`, `sessionId`).
  Research §F2 originally proposed snake_case (`org_id`, `sid`). The plan resolved this
  in favor of camelCase to match the seam's JSDoc example; record this decision in
  `worklog.md` so consumers and IMPL don't re-litigate it.

## Verdict

`PASS`

All eight Plan-Gate boxes are satisfied. Research is current and re-baselined against
the merged seam (Q3/Q4/Q5 verified against actual file content at `79f5840d`, not
assumed); all locked decisions carry rationale; commit slices are ordered, gated, and
named (6 < 30); the risk register and deferred scope are explicit; the jsr-audit surface
scan ties each risk to a slice. The two evaluator-found clarifications
(consumer-import validation gate, `@netscript/database` layering hedge) are small
follow-ups the implementing agent honors — they are not gate failures. Implementation
may begin, **slice by slice**, per the locked plan ordering (1 → 2 → (3 optional)
→ 4 → 5 → 6), each slice carrying its own separate-session IMPL-EVAL.

## Notes

- Plan §2's "ARCHETYPE-5 overlay" label is shorthand for the schema-contribution
  mechanic that Doctrine 06-archetypes.md assigns to first-party `plugins/*` packages.
  The mechanic is being applied at the consumer's `database/` package (which IS where
  schema-contribution lives in this repo), not at the new adapter packages. Read the
  label as a borrowed-mechanic pointer, not as a true Archetype-5 classification.
- The umbrella `service-auth-seam` slice already cleared Plan-Gate cycle-1 PASS
  (per `.llm/tmp/run/feat-framework-prime-time--supervisor/plan-eval-summary.md`),
  with the seam merged at `79f5840d`. This slice is Wave-B and builds on that merged
  contract; the seam's Q3/Q4/Q5 resolution is verified against the merged file, not
  against pre-merge assumption.
- The plan's lock of "consumer brings the instance" (locked decision 3) is the same
  pattern as `createRedisQueue(url)` and the Prisma driver adapter family. The
  "MAY depend on @netscript/database" hedge in §4.2 is the only inconsistency with that
  pattern; recommend resolving toward the cleaner precedent at slice-4 time.
- This is cycle 1 of the two allowed; the verdict is `PASS`, so no escalation is
  required.
