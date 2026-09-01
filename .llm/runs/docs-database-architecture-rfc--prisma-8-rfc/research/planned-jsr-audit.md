# Prospective JSR Audit — Planned Database Surface

> Scope: Plan-Gate audit of the proposed packages, not an audit of implemented packages.\
> Verdict: **PASS-AS-PLANNED**; **NOT ACTUAL PUBLISH READINESS**.

The planned database graph satisfies the JSR rubric if the implementation preserves the boundaries
below. The six new packages do not exist, so running `deno publish --dry-run`, `deno doc --lint`, or
a packed/remote install against them is currently **N/A**, not a pass. Actual readiness begins only
when each package has a real manifest, export graph, source surface, and publish file list.

## Planned surface

| Unit                                  | Status / archetype                  | Intended exports and boundary                                                                                                | JSR obligations and principal risk                                                                                                                             |
| ------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@netscript/database-contract`        | Public, A1                          | Root for small identities/invariants; split focused subpaths only if the root approaches 20 symbols.                         | Zero provider dependencies; explicit annotations; no Prisma types.                                                                                             |
| `@netscript/database`                 | Public, A4                          | Root `defineDatabase` authoring surface; focused definition/compiler subpaths only when responsibilities require them.       | Frozen plain definitions and explicit public return types. Native Prisma contracts are accepted without being re-exported.                                     |
| `@netscript/database-runtime`         | Public, A3                          | Root lifecycle factory and small session handles; validation or connection-source subpaths only if independently consumable. | Public generics remain narrow. Concrete inferred query/session bindings are generated **app-locally**, never exported here.                                    |
| `@netscript/database-control`         | Public, A2                          | Root programmatic operations; focused catalog/testing subpaths if needed.                                                    | Plain plans, receipts, diagnostics, and ports; no provider control types or terminal-text contract.                                                            |
| `@netscript/database-prisma-postgres` | Public only after certification, A2 | Experimental provider root, with narrowly justified authoring/runtime/control subpaths.                                      | Sole framework Prisma import boundary. It must not re-export Prisma, expose private/deep-import types, or make moving upstream types part of NetScript semver. |
| `@netscript/database-testkit`         | Public tooling, A6                  | Root library plus binary only if provider certification genuinely needs one.                                                 | Never a runtime dependency; machine receipts and fixtures excluded or deliberately published. Reconsider the package split before W1 if no binary exists.      |
| `@netscript/plugin`                   | Existing public A4, changed         | Add one documented database-space/contribution subpath; remove legacy copied-schema abstractions in the clean break.         | Plain descriptor types only; no runtime/control/provider dependency. Breaking surface accounting required.                                                     |
| first-party `plugins/*`               | Existing public A5, changed         | Thin root plus established service/contract/scaffold surfaces; publish descriptors and generated contract/lineage assets.    | Provider-native authoring stays in controlled build input. Deployment must work from pinned plain artifacts without importing plugin code.                     |
| `@netscript/aspire`                   | Existing public A2, changed         | Add a narrow connection-source/provisioning adapter on an existing relevant subpath.                                         | Deno/Aspire edge only; must not become required by pure database packages.                                                                                     |
| `@netscript/cli`                      | Existing public A6, changed         | Existing binary/root project the operation catalog; no new database logic export.                                            | Generated help/agent assets require freshness checks and production remote-graph E2E.                                                                          |

Each unit has exactly one archetype. The testkit exception is explicitly conditional before public
release, so the one-package/one-archetype law is satisfied as planned.

## Non-negotiable publish rules

- Every package gets one `deno.json` with scoped name, synchronized version, license, a concise
  description/tagline under 250 bytes, explicit exports, and an `include` whitelist plus test and
  fixture exclusions. Every entrypoint has `@module` documentation, a runnable example, and full
  symbol JSDoc; stable surfaces target a 100% JSR documentation score.
- Root and subpath surfaces remain skimmable. Cross-package imports use declared `jsr:`/`npm:`/
  `node:` specifiers under repository dependency policy. Imports within the same package are
  relative, preventing JSR self-referential-subpath resolution against an older published version.
- All published code is ESM and Deno-compatible. Node/Bun/browser compatibility is claimed only
  after its matrix passes; default JSR settings may claim Deno alone. No CommonJS, HTTP imports,
  top-level filesystem assumptions, or unconditional `fromFileUrl(import.meta.url)` are allowed.
- No database package receives the doctrine's oRPC-only slow-type carve-out. Public declarations
  must satisfy root `isolatedDeclarations`; `--allow-slow-types` is a failure. Application-specific
  `typeof contract`, Prisma query types, and inferred `TargetBinding` values terminate in generated
  application files. Direct application authoring may import Prisma's public builder; NetScript
  packages neither vendor nor re-export it.
- Publishable generated assets are checked-in TypeScript constants with deterministic
  regeneration-plus-diff gates. Runtime file reads and text/JSON import attributes are forbidden
  until an authenticated registry canary proves the known JSR limitation resolved. Contract JSON,
  declarations, lineage, and provenance are explicit whitelisted artifacts, content-addressed and
  atomically generated—not patched source.

## Implementation and release gates

W1–W6 must add each new unit to the publish denominator and require, per unit: scoped
check/lint/fmt, `deno doc --lint` with zero diagnostics across every export,
`deno publish --dry-run` without slow types, inspected publish file list, README/tagline checks,
`quality:scan`, `arch:check`, generated asset freshness, public import tests, and a clean packed
consumer install. W3 additionally requires an exact Prisma import allowlist, one resolved component
set, Deno import purity, and real PostgreSQL conformance before the provider package is advertised.

W7–W9 apply the same gates to the changed plugin/CLI/Aspire surfaces, plus breaking-surface diff,
plugin thinness/seam checks, package-free artifact consumption, and executed generated examples. W10
requires release preflight, authenticated canary publish with GitHub OIDC/SLSA provenance, registry
settings reconciliation, and the production `e2e-cli-prod` path against exact published JSR
versions. A local dry-run or packed install cannot substitute for this remote-graph verdict.

## Blocking findings / kill criteria

Plan Gate remains satisfied only while implementation proves all of the following. Kill or split a
surface if Prisma types leak into a public declaration, app inference requires a published slow
type, any unit needs `--allow-slow-types`, the provider requires private/deep imports or upstream
re-exports, internal bare self-imports appear, generated assets need runtime filesystem access, a
package combines two archetypes, or a clean remote consumer resolves duplicate/off-allowlist Prisma
components. Do not publish the Prisma adapter if its dry-run, docs, Deno graph, packed consumer,
provenance, canary, or production E2E gate is red.

**Final audit verdict:** the proposed boundaries provide enough explicit mitigation for a
**PASS-AS-PLANNED** at PLAN-EVAL. They provide no evidence of actual publish readiness until the
implementation-time and release-time commands above produce green receipts.
