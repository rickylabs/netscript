# Worklog

## Design

1. Public surface: plugin install/update/remove, local plugin install, service
   add/remove preserve browser files and expose an informational DoctorReport in
   their existing structured results and normal command text.
2. Vocabulary: written paths; current exact canonical file (no finding); skipped
   authored topology; skipped already-present divergent file. Use existing
   DoctorReport/DoctorCheck rather than a separate diagnostic hierarchy.
3. Ports: existing FileSystemPort and GeneratedSourceFormatterPort only.
4. Constants: named browser-auth report identity and finite skip reasons, defined
   with the report contract. Existing template keys remain authoritative.
5. Commit slices: S0 plan bootstrap; S1 reporting contract/adapter, six result
   producers, six command renderers, focused regression/negative tests and docs;
   S2 closeout evidence. Each includes this worklog and context-pack.
6. Deferred scope: runtime auth, templates/presets, dependency changes and auto-repair.
   Local expensive E2E is prohibited; coordinator arms CI e2e-cli-gate.
7. Contributor path: browser-auth-reconciler.ts is the place to extend candidate
   comparison/ownership behavior; tests alongside it prove preservation.

## Bootstrap

Resolved feature matrix via JSON; recorded exact owner evaluator override in
supervisor.md. Requested effort high. PLAN-EVAL required before source edits.
RTK unavailable (command-not-found); direct shell inspection used. No lock edits.
PR references issue 2384; no labels/milestones changed, per owner override.
