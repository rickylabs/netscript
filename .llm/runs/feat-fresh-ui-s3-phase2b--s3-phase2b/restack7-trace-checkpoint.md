# Restack7 native Escape trace refinement — before instrumentation edits

## 1. Public surface

No component API, native policy, assertion or keyboard mapping changes. Preserve
real double-Escape platform closure, controlled refusal, exactly one native-close
proposal, unchanged-parent-intent reopening and isolated Toggle state. Change only
the trace instrumentation surrounding the existing three native-close tests.

## 2. Vocabulary

A trace snapshot is an automation DOM inspection. Native activation history
controls whether the second Escape cancel event is cancelable. An observation
that grants activation changes the behavior being measured.

## 3. Ports and measured evidence

Use the installed Playwright trace object options, verified in its local types.
Six bare native-dialog controls cover Chromium/Firefox/WebKit, each with trace
snapshots enabled and disabled. All use reduced motion and adjacent physical
Escapes, with a native cancel listener preventing only cancelable events.
Firefox with snapshots reports[true,true] and stays open; without snapshots it
reports[true,false] and closes. Chromium/WebKit report[true,false] and close in
both modes. Three direct Firefox Shell controls without snapshots also close,
reporting one escape proposal and one native-close proposal. Raw traces stay
private; portable controls are in restack7-native-trace-control.json.

## 4. Constants and invariants

Keep trace mode retain-on-failure, screenshots and sources. Disable only DOM
snapshots for these tests through a nested describe/test.use scope. Do not change
the whole configuration or sibling tests. Do not introduce a browser branch,
forced-close fallback, retry, sleep, synthetic cancel event or application change.
Keep both Escapes adjacent and every existing assertion unchanged. Test execution
remains real on every engine; failure traces retain action/screenshot evidence.

## 5. Commit slice and gates

The existing Shell forced-native-close case and the equivalent Dialog/Sheet
ownership cases need this same narrow trace scope. Two existing spec files;
no new helper or provider. Scoped check/lint/fmt0drop; all three original cases
in all three engines and schemes/widths, full current browser matrices, existing
package and broader gates. Same independent design review precedes trace edits;
same source/evidence review and committed-source carriers follow as already
required. There is no evaluator failure or assertion waiver.

The full Chromium pass stopped158passed/1failed/508notrun on the new RTL link
assertion because it incorrectly requested exact name Overview; expanded nav
includes the visible count, so its actual accessible name is Overview12 with
separating whitespace. Correct that newly introduced locator to the actual exact
name and retain the viewport assertion. Actual geometry shows the corrected
transform has already placed navigation inside the modal; the problem is in the
new locator. A scoped-removal negative control independently checks the legacy
RTL transform fix. This is distinct from the Firefox trace failure, which
reproduced in29passed/1failed/274notrun and an isolated unchanged repeat.

## 6. Deferred scope

No component-runtime fix is justified by this instrumentation failure. The full
11b/12/13 scope remains required. Declared x extensions and immutable base
contracts remain the owner decision. No READY, labels or early base promotions.

## 7. Contributor path

The two existing browser specs explain why this exact native-policy observation
must avoid snapshot activation. The canonical shared fixture provider/renderer
and normal trace policy stay unchanged. Retain raw evidence privately, publish
only repo-relative explanations and portable verdict/counts.


Scoped-removal control is now terminal PASS: exactly one new RTL correction
removed in the private browser page makes the actual Overview12 link leave the
viewport. The unchanged source places it inside. The first control attempt
matched no CSSOM selector because CSSOM normalized quotes; the corrected control
normalizes quotes and asserts exactly one match before checking its negative.
Final post-fix package suite765PASS/0failed/0ignored. No production mutation
since those source runs; only the new RTL fixture locator has been corrected.

## Executable placement correction — before moving tests

The approved nested describe placement is rejected by the installed Playwright
runner before any case executes: trace is worker-scoped and cannot be overridden
inside a describe. Type checking accepts the option shape but cannot prove this
runtime placement. The failed collection is recorded as0executed cases, not a
native assertion failure or a green run.

Refine only the placement: move the three existing native-close cases into one
focused native-close.spec.ts file with the same trace object at file top level.
Keep every original test body/assertion and both Dialog/Sheet per-kind navigation
beforeEach blocks. Remove those three originals from their old files so counts
cannot double. Other cases stay in their original files with default tracing.
The native-close file imports only the existing test/expect surface, without a
shared helper or product change. This is a cohesive executable test-policy unit.

Scoped check/lint/fmt includes the new file. The full Chromium matrix remains667
cases. The actual complete targeted cross-engine set will now include the two
Dialog/Sheet native cases alongside Shell, increasing304 to320 cases; the focused
all-engine control stays36. Record actual terminal counts,0retries/flaky, full
original assertions and source-independent package765 proof. The same evaluator
reviews this placement correction before tests move. Raw collection errors stay
private; no global trace change or assertion waiver is introduced.
