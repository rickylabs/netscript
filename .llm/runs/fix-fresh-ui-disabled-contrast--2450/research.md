# Research

Baseline d25f65b5ead991c372592afb08b13621b5dfda46 merges #2495. #2450 remains open; owner comment 6539499855 requests the next code subtask: inactive-component exemptions while the Figma value pass proceeds. No duplicate disabled-contrast PR or sibling issue was found. Epic #2412 includes other active lanes; this leaf owns only this requested token-quality unit.

Six disabled pair definitions produce 58 measurements, of which 56 currently fail. The existing 9132 measured uses include 531 source failures; this change should leave 475 active source failures and explicitly report 58 exemptions. Measurements and coverage must remain intact. All Figma snapshots/values and non-disabled exclusions stay exact.

W3C WCAG 2.2 SC 1.4.3 exempts text in inactive UI components; SC 1.4.11 separately exempts inactive controls. This leaf annotates the six known disabled text uses under SC 1.4.3, not arbitrary muted/hover/read-only text. Sources: https://www.w3.org/TR/WCAG22/#contrast-minimum and https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (checked 2026-10-31).

Archetype: existing @netscript/fresh-ui hybrid package, pure token domain + color port/adapters. No new dependency or public barrel export. Internal report contract is additive. Contributor entry: tokens/README.md. Existing pure coverage, stale-exclusion, command negative-control and maintainer-report tests provide extension points.

PLAN-EVAL independently audited consumers: no rendered component uses these four disabled text tokens, and no active role aliases them. Existing Tailwind alias exports a name only. Require audit again for any new annotation. The default-token-quality adapter needs explicit narrowing because generated JSON widens string literals.
