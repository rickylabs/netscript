# Restack7 caller controls — measured contrast correction

## 1. Public surface

Use the existing shipped Button for the measured visible caller-owned controls
in browser DataGrid, StatsGrid and dynamic Shell fixtures. No framework, token,
contract, native event or keyboard behavior changes.

## 2. Vocabulary

Actual dark WebKit axe reports native widget white text on a light native button
background, ratio1.81 against4.5. The full cross run failed at the existing
Keyboard ownership Row action and Cell action controls, not the already-corrected
SharedTrackExamples. A direct actual-renderer audit also measured Before metrics,
Inspect metrics, After metrics, dynamic Account, Workspace settings and Send.

## 3. Ports

Reuse actual Utility Button, ghost small, preserving the existing native button
element, labels, onClick handlers, data markers and type=button or type=submit.
Leave inert decorative Stats controls, host drivers, and StaticShell no-JS inputs
unchanged. No generic CSS injection, raw colors, engine branching or axe exclusions.
The audit found no Message input contrast failure, so leave that input unchanged.

## 4. Invariants

Every existing event, focus, geometry, selection and native keyboard assertion
remains. The existing Keyboard fixture can change only these two measured button
expressions. Their event handlers remain byte-equivalent. Existing inert controls
stay adversarial bare buttons and must remain noninteractive through their owner.

## 5. Scope and validation

Add two browser fixture files to the twelve-file restack source scope, fourteen
source files total. Archive cross251PASS1FAIL68notrun and interrupted Chromium
without calling either green. The earlier focused36PASS remains historical proof
for its exact scope. First build and audit all actual affected scopes in dark
WebKit at390/1280, including all DataTable states, Stats and Shell closed/modal/chat.
Then run fresh full667Chromium and320Firefox/WebKit on frozen final source,
strict axe unchanged, zero retries/flaky. Refresh fixture/spec check/lint/fmt.
Framework bytes remain unchanged since package765PASS. All current-head broader
quality, publication and carrier requirements and independent reviews still apply.

## 6. Deferred scope

Do not expand this into a native-widget policy change or token/theme work.
Remaining11b/12/13 and final exact-head CI are required. No READY.

## 7. Contributor path

The real fixture modules import the shipped components; these tests demonstrate
caller composition rather than making layout components paint arbitrary children.
