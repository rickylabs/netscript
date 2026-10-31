# Contextual contrast and browser color measurement

AlertDialog can use the canonical destructive fill/foreground pair on current
main. The generic Button hover still reads the raw red ramp; keep its dialog
hover scoped to the existing measured destructive-hover role. The global
active rule changes geometry/shadow only, so it does not replace that background.
Do not change shared token values to fix a component's context.

CodeBlock's seven syntax roles use component-local ink. Default rows use roles
directly; added/removed/highlighted rows mix80% syntax with20% existing text ink.
The Utility/studio-utility measurement is112 cells (7roles ×4surfaces ×4projects),
all at least4.5:1 with chromatic roles distinct from plain text. This evidence
is not certification of other token presets. No all-preset claim is permitted.

Use native canvas to resolve modern computed CSS colors into display RGB,
composite transparent backgrounds through the actual ancestor chain, then
compute WCAG luminance. Also run strict axe on the actual component. The old
monochrome fallback fails a real keyword-on-added browser assertion. No scanner
or axe allowance is needed. Keep the raw browser report private and public
captures/verdicts portable.

For a modal containing an informational HoverCard, open from a focused trigger
with Enter when measuring at-rest color. A pointer parked over where the modal
preview appears can open a legitimate preview that blocks pointer hover to the
action; forcing pointer actions hides that context. Existing overlay native
interaction tests still cover pointer behavior separately.

The canonical scaffold.runtime --cleanup one-pass attempt failed Aspire
preflight and Docker cleanup inspection here; runtime behavior never started.
Keep that gate UNPROVEN. Read-only leak-check results may retain only verdict
and counts in the public run; do not publish process/resource matched lines.

`maint:leak-check` writes leak-report.md into its slice directory even when
stdout is redirected. Inspect that side effect before an audit/push. Preserve
raw material only in the private project run, then retain verdict/counts only
in the public report. A failed whole-run audit must stop the push control flow;
never run audit and push as independent unconditional calls. The committed
added-line audit remained zero, and the untracked raw report was never pushed.
