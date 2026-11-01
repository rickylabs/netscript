# Restack7 fluid-track correction — source review round1

1. Surface: fluid DataGrid columns must wrap inside their wide container while
   fixed columns and intrinsic actions retain intentional horizontal scrolling.
   Existing table semantics, APIs, tokens and selected-state behavior remain.
2. Vocabulary: max-content on the whole table floors every fr track at its
   longest content. This is a material consumer regression. Source review is
   FAIL_FIX, streak1; no source commit or push is authorized yet.
3. Ports: native grid/subgrid intrinsic sizing. Test the actual DataGrid, default
   and fr columns, long wrapping content, both directions, at641/900and the
   available content width of the1280viewport. No framework JS measurement,
   new API, token or engine branch.
4. Constants: keep0.75px alignment, fixed420/380tracks, native query partition,
   full status spans, selected rail device pixels/tolerance1 and both negatives.
5. Scope and order: same fourteen source/carrier files. Add one fixture and
   one regression to the existing modules first; prove max-content red. Prototype
   min-content for the table and, if required, a non-shrinkable intrinsic action
   cell floor. Diagnose the original fixed-overflow coverage rather than restore
   the whole-table max-content floor. Keep every existing assertion. Then canonical
   generation/build, focused72and24axe-bearingWebKit, fresh765package/full675
   Chromium/full336Firefox-WebKit, wrappers0drop and broad gates/doclint baseline,
   followed by the SAME substantive source review. Every prior run becomes
   historical after the framework CSS change.
6. Deferred: no next feature, base write, commit, READY or final publication.
   Two consecutive terminal evaluator failures end this leaf; the next source
   review must resolve this blocker. No fresh evaluator or artificial reset.
7. Contributor path: this checkpoint and the current source summary explain
   the regression and proof. Raw logs/measurements remain private; public records
   retain portable facts and counts. Full11b/12/13 remains mandatory.
