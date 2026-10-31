# Slice9c0 contract checkpoint — native modal Escape ownership

1. Public surface stays the existing Dialog/Sheet controlled or uncontrolled open
   ports. A cancelable Escape proposes closing and the parent may refuse. A
   platform-forced native close stands immediately and reports native-close.
   The library never reopens from its cancel/close handler. On a subsequent
   accepted parent render, an unchanged open=true can request opening again;
   parents must accept native-close=false to keep the modal closed. No new prop,
   public symbol, key mapping or close-reason enum is introduced.
2. Vocabulary: cancelable close proposal, non-cancelable platform close, accepted
   parent render and state-to-native synchronization. The native element's open
   state is the physical truth; do not duplicate it with a forced-close render loop.
3. Ports remain open/onOpenChange/closeOnEscape and the existing native dialog
   synchronizer. Dialog and Sheet share that synchronizer, so their existing
   identical cancel handlers receive the same policy. Consumer onCancel vetoes
   continue to win through composeEventHandlers when the event is cancelable.
4. Reasons remain escape-key and native-close. Non-cancelable cancel must not
   emit an escape-key proposal; the ensuing real close emits one native-close.
   No new protocol, token values, dependency or overlay engine.
5. Source unit: the two existing modal hooks and shared native synchronizer,
   actual browser fixtures/spec and registration, scoped run evidence and a short
   contributor note. First preserve real negatives before production edits.
   On cancelable events prevent native default, then propose false only when
   closeOnEscape permits. On non-cancelable events let the platform close and
   report it through the existing close handler. The synchronizer checks actual
   native state on each subsequent accepted component render, with its existing
   open/:modal guards preventing redundant native calls. Preserve attachment
   identity state for new content; never replace it with an incrementing counter
   that could loop as composed refs reattach. A forced native close itself does
   not schedule a controlled hook render or call showModal. Uncontrolled state
   follows the close as before. No separate close epoch is needed because the
   next render reads the actual native open state directly.
6. Tests cover first Escape refusal/acceptance, uncontrolled close, disabled
   Escape, consumer veto, real adjacent double Escape and exactly one native-close,
   native focus return, and a parent re-render with unchanged accepted open=true.
   No DOM assertions/evaluations may occur between the double-Escape key presses:
   automation Runtime evaluation supplies user activation and invalidates the
   intended platform case. Preserve control coverage for both shared consumers.
   Run scoped source/browser wrappers, relevant existing dialog/overlay and
   synchronizer regressions, quality/architecture, unchanged publication baseline,
   carriers after SOURCE commit and independent source/evidence sign-off. Under
   30 source files. No unrelated callback deduplication, new imperative close
   observer, shell-local Escape clone or layout code in this prerequisite unit.
7. Contributor path: packages/fresh-ui/src/contracts/README.md documents cancelable
   refusal, unavoidable native-close ownership and subsequent accepted rendering.

## Verified before production edits

The original controlled Escape case failed after observing a false proposal: the
parent refused but the modal physically closed. A second real-keyboard negative
uses a consumer veto and two adjacent Escapes. The browser reported true then
false cancelability, physically closed and emitted one native-close; the current
hook also wrongly emitted escape-key for the non-cancelable request. The next
accepted-parent-render control additionally checks recovery without changing the
open prop. All raw traces stay private; public evidence contains counts/verdicts.

The [HTML CloseWatcher standard](https://html.spec.whatwg.org/dev/interaction.html)
and [Chrome's native dialog guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-components/dialog)
confirm that repeated close requests without intervening activation can bypass
cancel prevention. The forced close is not trapped or immediately reopened.

The source scope is explicitly the related Dialog/Sheet hooks and their shared
native synchronizer. Implementation waits for the corrected independent checkpoint
PASS. Complete source/evidence commits, carriers, privacy audit, push and PR comment
before starting the shell family itself.
