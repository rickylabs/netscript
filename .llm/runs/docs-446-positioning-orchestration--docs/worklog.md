# Worklog — issue #446: positioning: orchestration-runtime + CLI/scaffold + plugin-system (D7)

Branch: `docs/446-positioning-orchestration-runtime` (base `7f7ed76b`).
Run under the beta-7 docs release cut (epic #401), documentation-authoring exception lane.

## Plan

Scope (issue spec + `design/CD-docs/epic-and-issues.md` §4 D7 + `proposal.md` §4.2/§4.3):

- **`orchestration-runtime/cli-scaffold.md`** (T1, the #433 stub) — full story page per the
  template: elevator pitch → story spine (agent re-invents project structure every prompt;
  the scaffold has already made those decisions) → mechanism cross-linked into
  `cli-reference`, `/reference/cli/`, how-tos, quickstart (never duplicated) → **one**
  factual competitor comparison per feature: Encore file-count + AdonisJS ship-don't-assemble
  (CLI/scaffold), Medusa Agent Skills plugin=capability (plugin system) → cross-links.
- **`orchestration-runtime/index.md`** (T3) — elevator pitch for the pillar + the light
  Encore-dashboard comparison (Aspire dashboard = generated resource map, not hand-wired);
  add cards for the two leaf pages so the pillar hub reaches its own stories.
- **`orchestration-runtime/runtime-config.md`** (T3, already substantive) — minimal touch:
  cross-link into the new cli-scaffold page (registry/schema generation), no rewrite.

Constraints honored (authoring-constraints.md): build-efficiency framing only; no
throughput/benchmark; no superlatives; no honesty framing; no fabricated numbers; every
present-tense claim traces to the canonical CLI reference page (PR #610 lineage) or the
explanation essays; `@netscript/aspire` never conflated with the .NET Aspire runtime; no
`_plan/*` prose lifted.

## Accuracy sources (claim → source)

| Claim | Source |
|---|---|
| `netscript init` lays down contracts, example service, Fresh app, plugin registry, Aspire layer, default Redis cache | `docs/site/cli-reference.md` (Scaffold & project) |
| `--dry-run` prints every file, writes nothing | `docs/site/cli-reference.md` |
| `--db` + `--service` → Prisma-backed CRUD contract + handlers under `contracts/versions/v1/`, oRPC playground at `GET /` | `docs/site/cli-reference.md` (`init --model-name`) |
| plugin install adds dependency, emits workspace-owned glue, registers contributions; host app never changes; bare aliases | `docs/site/cli-reference.md` (Plugins) |
| `netscript generate plugins` / `generate runtime-schemas` | `docs/site/cli-reference.md` (Code generation) |
| `netscript plugin new` two-tier core+connector pair | `docs/site/cli-reference.md` |
| plugin API + background processors run as separate Aspire resources; ports 8091–8094, 4437 | `docs/site/explanation/plugin-system.md`, `docs/site/explanation/aspire.md` |
| Aspire resource graph generated from plugins, dashboard `:18888` | `docs/site/explanation/aspire.md` |
| `netscript service generate` regenerates Aspire helper files from service configuration | `docs/site/cli-reference.md` (Services & contracts) |
| Everyday flow order (init → aspire start → db → plugin install/generate) | `docs/site/cli-reference.md` (The everyday flow) |
| Encore "shouldn't require five files and a module registration"; AdonisJS "ship products, not assemble frameworks"; Medusa Agent Skills plugin=capability | `research/D-positioning/competitor-teardown.md` §2 (verbatim-sourced) |

## Evidence

Files changed:

- `docs/site/orchestration-runtime/cli-scaffold.md` — stub → full T1 story page. Elevator
  pitch (one command → complete workspace, decisions-made-once framing), story spine (the
  agent's structural-decision turns → generated conventions + regenerated registry/helpers),
  mechanism cross-linked (cli:reference, ref:cli, howto:database-migration, quickstart —
  no duplication), one factual comparison per feature: Encore file-count + AdonisJS
  ship-don't-assemble (CLI/scaffold, in a plain callout, verbatim quotes traceable to
  competitor-teardown §2) and Medusa Agent Skills plugin=capability (plugin system, one
  artifact / two framings). "Generated, then owned" section separates regenerated artifacts
  from emitted-then-owned glue. prev/next wired within the pillar.
- `docs/site/orchestration-runtime/index.md` — pillar elevator pitch (derived-not-
  hand-maintained fleet) + T3 Encore-dashboard comparison (Aspire dashboard `:18888` as the
  generated resource map); two new "Story" cards (cli-scaffold, runtime-config) in the hub
  grid; one "Start from the CLI" bullet in Where-to-go-next.
- `docs/site/orchestration-runtime/runtime-config.md` — minimal T3 touch: one cross-link
  tying `netscript generate runtime-schemas` to the cli-scaffold story. No other edits.

xref keys verified against `docs/site/_data/xref.ts`: `cli:reference`, `ref:cli`,
`concept:quickstart`, `howto:add-a-plugin`, `howto:author-a-plugin`,
`explain:plugin-system`, `howto:database-migration`, `cap:runtime-config`.
Nav: `/orchestration-runtime/cli-scaffold/` already present in `_data.ts` (from #433) — no
`_data.ts` change needed; no orphan page.

## Validation

`deno task verify` in `docs/site` — **green**:

- build: `500 files generated in 8.76 seconds`
- `check:links`: `23037 internal links across 162 pages — all resolve`
- `check:caveats`: `27 caveat markers across 22 pages — all references resolve`

Positioning-law grep over `docs/site/orchestration-runtime/*.md`
(`honest|candor|candid|throughput|% faster|world's|unbreakable|best-in-class|blazing`):
no matches (exit 1).
