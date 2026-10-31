# Phase2b drift

No product-code drift yet. The approved whole plan already split these categories into the second stacked review unit. New owner additive x-extension decision must be incorporated into its detailed plan before PLAN-EVAL; it does not permit changing/removing base items. Phase2a source and runtime limits remain explicit, not reset by a new branch.


## PLAN-EVAL round1 correction

FAIL_PLAN: four additive-harness ambiguities corrected before any product code.
New identities use the strict checker from9a; synthetic extension fixtures stay
unregistered; only eligible source-style registry items can declare extensions
and every registered item goes through the reader; name normalization and exact
mapping/collision rules are deterministic. Explicit likely9c/12b split points
preserve the source-file budget. Await same evaluator round2; failure streak1.


Slice9a: Preact precompile turns static JSX children into template nodes, not
cloneable native HTML VNodes. Direction keeps the approved single-native-VNode
boundary and explicitly requires h() for that boundary under precompile; it
rejects template/custom/fragment nodes with an actionable diagnostic. Actual
installed SSR and public usage cover h(). No wrapper/global/context workaround.


Independent source review FAIL_FIX rejected h-only ergonomics. Added a JSX-safe
as form that renders the caller's single native container directly, forwards
native props/handlers and an explicit boundaryRef, and retains the clone form.
Closed native-container choices are documented. No extra wrapper/context/global
mutation. Installed tests must render actual precompiled JSX including nesting;
browser RTL scenarios use as. Failure streak1 until re-review PASS.


Slice9b native overflow found by strict axe: text-only panels can overflow at
minimum widths and need their own keyboard focus, even when no child control
exists. Both panels are consistently tabbable, named groups; endLabel defaults to
Secondary panel. Child controls retain native tab order around those panel stops.
SSR aria-hidden uses the explicit string true because precompile boolean values
otherwise serialize as a bare attribute. Tests preserve the strict axe verdict.


Shell9c0 negative control reproduced before production edits: the controlled
Dialog proposed false, the parent refused, but native Escape still closed the
modal. The visibility assertion failed (one expected negative). Canonical cancel
ownership is a supporting complete unit before shell integration, with no new API
or key map and no shell-local duplicate Escape handler.


9c0 checkpoint review round1 FAIL_FIX corrected before production edits: native
anti-trap double Escape must force closure and report native-close; a subsequent
accepted parent render must reconcile unchanged open=true. Primary standard and
real consecutive-key browser probe confirm cancelability true/false. No DOM
queries between Escapes: Playwright evaluation grants activation and obscures the
case. The native element is the physical source of truth, checked on each accepted
render without an internal forced-close re-render. Shared Dialog/Sheet policy,
consumer veto, no immediate reopen/new API and precise gates are now locked.
Await same evaluator round2; failure streak1.


9c-a implementation findings: native Tab can move into browser chrome (BODY
sentinel), while outside controls remain inert; no focus-trap clone was added.
Actual viewport test caught a hidden built-in trigger being chosen before the
connected custom control; a cancellable owned microtask selects a visible
trigger after child layout effects. CSS specificity now keeps desktop/none
custom buttons hidden despite later button CSS. SidebarToggle native typing
now uses ButtonHTMLAttributes, so disabled is accepted rather than merely spread
at runtime. Copied support dependencies and installed SSR checks pass; frozen
legacy snapshot remains unchanged. New canonical app-shell axis uses
 data-sidebar-presentation to avoid colliding with the legacy bare data-sidebar
selector on the actual aside. Native ::backdrop represents the app-shell
sidebar-backdrop part without a duplicate fake DOM layer.
