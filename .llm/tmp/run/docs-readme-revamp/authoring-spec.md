# Authoring Spec — PR2 package READMEs (C1 contract)

Reconciles locked decision **D3** (plan.md) against the verified `sota-readme-dossier.md`
(Track 1, 63KB, run 28071679235). This is the authoritative skeleton + rules every C1 authoring
agent follows. Where the dossier exemplar and a locked NetScript decision conflict, the **NetScript
override wins** and is flagged `[OVERRIDE]` with the reason — these are the items PLAN-EVAL must
confirm are intentional, not drift.

## Canonical package-README skeleton (reconciled)

```markdown
# @netscript/<package-name>

[![JSR](https://jsr.io/badges/@netscript/<package-name>)](https://jsr.io/@netscript/<package-name>)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**<one-sentence technical definition: what it is, where it sits in NetScript, primary capability.
Under 3 lines. No marketing adjectives, no apology, no "honesty" framing.>**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/<package-name>

# Node.js / Bun
npx jsr add @netscript/<package-name>
bunx jsr add @netscript/<package-name>
```

### Usage

```typescript
import { <RealExport> } from "@netscript/<package-name>";

// realistic, grounded-in-deno-doc usage — no foo/bar, no invented signatures
```

---

## 📦 Key Capabilities

- **<Pillar>**: <one sentence, real capability, names real integration points>.
- … (3–5 items max; first term bold as scanning signpost)

---

## 📖 Documentation

- **Reference**: [rickylabs.github.io/netscript/reference/<page>/](https://rickylabs.github.io/netscript/reference/<page>/)
- **<Capability pillar>**: [rickylabs.github.io/netscript/<pillar>/](https://rickylabs.github.io/netscript/<pillar>/)
- **<How-to / tutorial that actually uses this package>**: [<absolute url>](<absolute url>)  ← only if one genuinely exists

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE).
Published to JSR with cryptographically verified provenance.
```

## Adopted from the dossier (additions to D3)

1. **`# @netscript/<package-name>` h1** matching the JSR namespace exactly. No nickname headings.
2. **3-badge row** (JSR · CI · Docs) — the dossier's "no badge soup" minimum, not D3's badge-free
   line. The JSR badge 404s until first publish; that is the universal pre-publish pattern and is
   acceptable (PR2 merges before the release tag; badge resolves at publish).
3. **3-runtime install block** (deno add / npx jsr add / bunx jsr add) — broadens adoption beyond
   D3's deno-only line. SOTA pattern (Zod/Valibot).
4. **Emoji signposts on `##` headers only** (🚀 📦 📖 📝). Banned in body copy (a11y).
5. **Key Capabilities** = 3–5 bold-lead bullets; **Documentation** delegates, never duplicates;
   no API tables / option dumps inside the README (dossier anti-pattern "Documentation Rot").

## NetScript overrides (conflict resolutions — PLAN-EVAL must confirm intentional)

- **[OVERRIDE-1] Unversioned imports.** Dossier Usage sample pins `jsr:@netscript/<pkg>@^0.0.1`.
  D6 mandates **zero version literals** in READMEs (drift-free). Install via
  `deno add jsr:@netscript/<pkg>`, then import the **bare mapped specifier**
  `@netscript/<pkg>`. No `@^x` anywhere. Reason: any literal drifts the moment we bump past alpha.1.
- **[OVERRIDE-2] Documentation section = D4's stricter 3-target, not the dossier's 2-link + Discord.**
  Each README links (a) its reference page, (b) its capability pillar hub, (c) a how-to/tutorial that
  genuinely uses it (omit (c) only if none exists). All absolute `https://rickylabs.github.io/netscript/…`,
  all verified to resolve AND to discuss the package (not a regex name-match). **No Discord link** —
  the invite is a placeholder (`<netscript-discord-invite>`); a placeholder/fake link is a broken
  link. Omit until a real invite exists.
- **[OVERRIDE-3] No per-package maturity callout.** The dossier package skeleton already omits it;
  the alpha-maturity statement lives on the **root README (PR3)**, stated once. 31× repetition on
  package READMEs is noise. Package READMEs carry no version/maturity prose.

## Per-archetype usage-sample guidance

NetScript packages are mostly framework-internal, not standalone-runnable like Hono. The Usage block
shows the **most representative real exported primitive**, grounded in `deno doc jsr:@netscript/<pkg>`:

- **Runnable surface** (cli, fresh, service, sdk, aspire): a real entrypoint/config snippet.
- **Contract/type surface** (contracts, config, runtime-config): the real schema/type the package
  exports, in a realistic definition context (clearly snippet-marked, not a fake `main()`).
- **Plugin / `-core` surface** (plugin, plugin-*-core, plugins/*): the real registration/factory call
  as a host app actually wires it, naming the real sibling primitives.
- Never invent signatures. If `deno doc` shows the only export is types, show a type-usage snippet —
  do not fabricate a runnable demo.

## Cross-ref map (from research.md — authoritative targets)

Same-name `/reference/<pkg>/` for all except the **4 `-core` packages** (no own ref page → use sibling
plugin reference + pillar hub):

| package | reference target | pillar hub |
| --- | --- | --- |
| plugin-workers-core | ⛔ none → /reference/workers/ | /background-processing/ |
| plugin-sagas-core | ⛔ none → /reference/sagas/ | /durable-workflows/ |
| plugin-triggers-core | ⛔ none → /reference/triggers/ | /durable-workflows/ |
| plugin-streams-core | ⛔ none → /reference/streams/ | /background-processing/ |

Pillars by family: orchestration-runtime (aspire, config, runtime-config, plugin), identity-access
(auth-*, plugin-auth-core, plugins/auth), services-sdk (contracts, sdk, service), background-processing
(cron, queue, watchers, workers, streams-core), data-persistence (database, kv, prisma-adapter-mysql),
web-layer (fresh, fresh-ui), observability (logger, telemetry), durable-workflows (sagas, triggers).

## `/docs` removal (D5) — per-agent action

Each agent, for its package: (1) strip any dangling `./docs/*.md` link from the README; (2) if the
package `deno.json` `publish.include` lists `docs/**/*.md`, remove that glob (config edit, the ONLY
non-README touch allowed). No folder deletion (none exist on disk). Dead-link scan candidates:
service, plugin-sagas-core, plugin-workers-core, plugin-auth-core, plugins/workers, plugins/sagas —
verify exact set during authoring.

## Quality checklist (gate — from dossier, NetScript-tuned)

- [ ] h1 == JSR namespace exactly.
- [ ] Value prop ≤ 3 lines, technical, no marketing/apology/"honesty" framing.
- [ ] JSR badge → `https://jsr.io/@netscript/<pkg>`; 3 badges only, no soup.
- [ ] Install: deno + npx jsr + bunx jsr, **unversioned**.
- [ ] Usage compiles against the **real** exported surface (`deno doc`-grounded); no foo/bar, no
      invented signatures, no version literal.
- [ ] Key Capabilities ≤ 5, bold lead terms.
- [ ] Documentation links: reference + pillar (+ how-to where real), all absolute, all resolve, all
      meaningful; no placeholder Discord; the 4 `-core` packages use sibling+pillar targets.
- [ ] Zero relative `./docs/*.md` links; publish globs cleaned where the files don't exist.
- [ ] Emoji only on `##` headers, never body.

## Anti-patterns (reject at eval)

Badge soup · pseudocode/invented signatures · relative `./docs/*.md` links (break on JSR) ·
"honesty/candor" framing · apologetic alpha statements · API-table duplication (doc rot) ·
placeholder/fake links (Discord invite, non-existent how-to) · name-match cross-refs that don't
actually discuss the package.
