# Drift

- Owner routes override current matrix (recorded verbatim in worklog).
- rtk unavailable; direct commands used.
- Manifest and template-loader files under `kernel/adapters/templates/` are added
  to the authorized surface because new template registration requires them.
- The specific operator process overrides generic dispatcher boilerplate: Refs-only,
  no labels, draft until verified gates, final report publication handoff.

PLAN-EVAL round 1: FAIL_PLAN (B1–B6). Corrected commands, request-time capability
projection, memory-vs-database procedures, runtime compatibility invariants,
command-palette registry install and full acceptance mapping. Source changes remain
unstarted. Optional capability discovery stays server-side and never claims health
from installation. Added `kernel/adapters/templates/scaffold-template-assets.ts`
and `kernel/assets/manifest.ts` to registration scope. No e2e probe changes planned.

S1 inventory: 29 owning source/test/documentation files plus the embedded carrier.
This meets the target for the owning slice; carrier regenerated in the same commit
so the CLI's emitted scaffold matches the template source. No unrelated source.

S2 research correction: current AI plugin is in-process. Its configured model
registry and existing app chat flow replace the plan's assumed remote models read.
Use the shipped composition root; do not introduce a gateway or showcase plumbing.

S2 adds SDK discovery and workers contract import-map entries to keep local-source
and public JSR scaffolds equivalent. No package versions change. These are server
read dependencies; optional auth and AI app modules remain glob-discovered.

Generated memory-service type checking exposed an existing canonical resource
example defect: its shared list input was `{}` while the contract requires limit
and offset. Extend the resource-slice procedure selection with optional primitive
initial arguments; init supplies the memory pagination input. Keep the canonical
leaves and their runtime markers, and leave service contracts unchanged. This is
necessary for the requested with-service scaffold gate, not showcase plumbing.

CLI grammar correction to B2: `plugin doctor` takes no positional name; its
`--resource` option labels diagnostic evidence, not plugin selection. All rendered
diagnostic commands now use `netscript plugin doctor`. The plan review accepted a
named form that the actual parser rejects; the parser is authoritative.

S2 review FAIL_DEBT resolved by explicitly accepting
CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY with cost, mitigation, owner, target and
closing gate in the canonical ledger and plan. Version-parity test is required.
B2's optional safe post-install connection is implemented for newly generated
memory clients only, guarded by exact formatted-placeholder equality.

S2 correction extends the declared resolver surface to public/adapters/jsr-import-resolver.ts and maintainer/adapters/local-import-resolver.ts: public service-add fixture exposed missing direct-import entries. Both use existing release constants; version parity now exercises the actual public resolver.

S3 browser probe: Ctrl+K, type Settings, ArrowDown, Enter leaves URL unchanged and
dialog open. Existing shared CommandPalette has a no-op onValueChange, with only
pointer onClick dispatch. Fix the shared callback seam and remove duplicate pointer
dispatch; validate both in the generated app. This is a small existing-component
bug fix needed for the approved keyboard acceptance, not a copied gap component.

S3 shared CommandPalette correction also covers caller-owned filtering, conditional
empty rendering, reset on reopen and top offset in its existing CSS. L1 Combobox
explicitly leaves filtering to callers; this block previously omitted that work.
No API expansion. CSS budget measurement includes the changed offset bytes.

S3 code review PASS. Final browser refresh already completed after mobile CSS;
its receipt now records the verified source/emission SHA256 and byte count. The
carrier generator is silent on success; S4 will retain explicit decoded-byte
comparison and command receipts. Reconcile palette selection/filter/reset behavior
with #2488 when merged, keeping equivalent upstream fixes if already present.

S3 visual round1 FAIL: all page classes pass except command (7/7.5). Corrections
remain in the existing shared palette: native Dialog.Close with visible Esc/Close,
keyboard-help footer,16px SVG search and highlighted-row rule. No prop changes.
Capture a real ArrowDown active state and prove visible-close behavior. Reuse the
same Astra reviewer for round2; a second terminal visual failure ends the loop.

## S4 template assertion alignment

The full CLI suite found one obsolete layout assertion (301 pass/1 fail):
f-client-nav on the old custom shell. Document _app already owns conditional
client navigation, while the new SidebarShell is inside Partial. Replace the
old class-adjacency assertion with both actual contracts; no emitted source change.

## S5 — full CI found omitted template test coverage

Test-shard4 reports web-scaffold_test.ts canonical formatting failures for layout
and navigation. Test-shard6 reports generators-config_test.ts stale first8imports
assertion after capability imports were added. The prior43-file local suite omitted
these modules;302PASS was true but insufficient coverage. Expand inventory to cover
web-page scaffolding and app template generators. Preserve canonical-source tests;
fix emitted source formatting, do not relax them. A separate template assertion
must tolerate canonical whitespace while preserving Partial/SidebarShell nesting.
