# Proposed inventory-aware CSS budget — independent review required

New main0af8fd9e adds an absolute220000raw/27000gzip guard for its52CSS files.
The rebased parent ships74CSS files, including22added CSS files for21approved
new components/support. The actual configured gate fails at281179raw/36011gzip;
the five-MB package gate still passes. The old66-component inventory and the
approved87-parent/104-full inventories are materially different. Simply raising
an unconditional limit would obscure that difference. No budget code is changed
yet; the same independent plan review must ratify the policy first.

1. Public surface: no component/API/token/value/lock change. Extend the existing
 CSS regression guard to account for the already-approved S3 additions, counting
 every authored and shipped non-theme CSS byte exactly as before. Preserve the
220000/27000 baseline constants and five-MB package cap.
2. Vocabulary: a budget credit is one actually shipped, explicitly approved new
 component identity, not a file, style, variant or mutable shipped flag. Use the
 independent existing POST_V1_COMPONENTS inventory plus the actual canonical
 registry and copied CSS entries. Existing audits earn no credit. Missing,
 duplicate, unregistered, empty or unsupported entries must not create credits.
3. Ports: existing registry manifest, frozen-v1/addition census and actual
 FRESH_UI_REGISTRY_CONTENT/source equality; native CompressionStream. No new
 runtime helper, dependency, skip, file exclusion or synthetic success.
4. Constants: baseline220000raw/27000gzip; bounded per-approved-component
 allowance3500raw/500gzip. Both incremental rates are below the baseline average
 per CSS source file. Parent21 credits yields293500raw/37500gzip. Full38 credits
 yields353000raw/46000gzip. Zero approved additions keeps the original exact
 limits. There is no credit for adding support files, splitting files or
 reclassifying styles. The maximum approved addition set remains38.
5. Ordered implementation/gates: first finish lossless native nesting on any
 reviewed CSS whose historical patch restored flat roots; preserve specificity
 and ordered rule contracts, with3locks unchanged. Implement the reviewed
 allowance in the existing size test, retain exact authored/shipped inventory
 and source/carrier equality and both raw/gzip checks. Tie credit to real
 approved component registry/CSS closure; existing frozen inventory/install/
 contract gates remain active. Run the configured gate, then meaningful
 negative controls: restore the original unconsolidated baseline CSS alongside
 current additions and require overall failure; independently force raw and gzip
 overruns and require failure; fake metadata/file-only credits must not raise the
 allowance. Restore the candidate and prove hashes/positive gate. Preserve
 main's baseline negative control at zero credits as well. Then run fresh
 integrated package/check/quality/publication/CLI/carrier/browser/docs gates and
 SAME source/evidence review. No old-base proof substitution.
6. Deferred: no new component, real style or future promotion beyond the
 existing approved21+17. A future inventory expansion requires explicit
 ratification; it cannot earn budget by arbitrary files or metadata. If the
 evaluator finds this policy unacceptable, stop on the prescribed verdict rather
 than silently widening a threshold. No READY or push before review/gate closure.
7. Contributor path:packages/fresh-ui/tests/publish-size.test.ts explains the
 inventory and per-identity bound;packages/fresh-ui/README.md points contributors
 to the actual gate. Keep every byte counted, the canonical output exact and the
 original baseline visible.

Evidence: the parent non-CSS/main-only preservation check is clean except the
intentional run checkpoint. Browser CSSOM expands all74files/1589rules with0
ordered selector/declaration/media differences from the reviewed old parent.
Read-only full-child composition estimate is90CSS files/344825raw/44998gzip,
before further equivalent nesting; it is an estimate, not a gate verdict.
The allocation remains bounded and visible rather than concealing additional
components from the measured payload.

## Measured follow-up — scope decision required before implementation

The first same-evaluator PLAN-EVAL returned FAIL_PLAN. The configured guard has
not changed. Its comment explicitly says to keep both limits below PR #2503's
payload. The following use the guard's exact sorted non-theme CSS inventory,
newline join, UTF-8 encoding and native CompressionStream gzip algorithm:

| Tree | CSS files | Raw bytes | Gzip bytes |
| --- | ---: | ---: | ---: |
| PR #2503 final head 028cfa15 | 52 | 270183 | 27152 |
| Main 0af8fd9e | 52 | 215981 | 26527 |
| Rebased parent, actual configured gate | 74 | 281179 | 36011 |
| Read-only full-child composition, estimate only | 90 | 344825 | 44998 |

The initial proposal's parent ceilings 293500/37500 and full ceilings
353000/46000 both exceed PR #2503's raw and gzip payload. That proposal does
not satisfy the existing guard's stated absolute bound.

Main has 66 baseline component identities. Flooring its actual payload divided
by 66 gives 3272 raw / 401 gzip bytes per component, below the initially proposed
3500/500. Applied to the original baseline caps, these derived rates give parent
ceilings 288712/35421 and full ceilings 344336/42238. These also exceed both
PR #2503 bounds. They are measurements for review, not implemented thresholds;
the present parent gzip measurement also exceeds the derived parent ceiling.
Further lossless nesting has not yet been performed, and no negative-control or
revised positive gate is falsely claimed. The already measured ordered CSSOM
parity is 74 files, 1589 rules, zero differences against the prior parent.

The exact owner-approved additions are frozen here for the decision. Parent 21:

`button-group`, `toggle`, `toggle-group`, `radio-group`, `input-group`, `input-otp`, `slider`, `calendar`, `date-picker`, `location-marker`, `navigation-menu`, `stepper`, `menubar`, `alert-dialog`, `hover-card`, `context-menu`, `item`, `kbd`, `collapsible`, `chart`, `carousel`.

Child additional 17:

`scroll-area`, `aspect-ratio`, `direction`, `resizable`, `marker`, `trace`, `attachment`, `message-scroller`, `questionnaire`, `file-path-chip`, `attribute-chip`, `file-tree`, `figure`, `toc`, `anchor-nav`, `ruled-grid`, `hero`.

If a later owner decision permits an inventory-aware guard, credit would require
membership in this frozen list AND POST_V1_COMPONENTS AND canonical registration
AND non-empty copied CSS matching the carrier. Support files, arbitrary metadata,
styles and file splitting grant no credit. The proposal would retain every-byte
measurement, original caps at zero credits, the five-MB gate, and raw/gzip plus
unconsolidated-baseline and metadata-only negative controls. Any such gate-policy
change must be disclosed in both PR bodies with these actual baselines, approved
inventory, derived rates and controls, without implying owner approval.

Current action under the first evaluator's explicit instruction: return these
measurements to the SAME reviewer for a scope verdict. No budget code is changed.
If FAIL_RESCOPE is confirmed, write the decision record and phase state, stop
implementation, and surface the conflict to the owner. No third round, new
reviewer, next component group, gate waiver, READY, final report or merge.
