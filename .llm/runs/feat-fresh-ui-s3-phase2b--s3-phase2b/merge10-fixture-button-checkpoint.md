# Caller button fixture correction before integration freeze

Focused all3engine AI run is terminal168PASS/1FAIL/23notrun,0flaky/retry.
Dark WebKit strict axe catches caller plain native buttons: white foreground on
platform gray background at1.81contrast. These are fixture-supplied actions and
external controls, not MessageScroller or Questionnaire-generated controls.
Readerwheel/nativeHome cases pass through the failing project. Do not call this
run green or change/exclude the strict accessibility assertion.

1. Public surface: no package API/source/CSS change. Correct the consuming fixture
   to use its already imported Fresh UI Button for caller buttons; same native
   button types/labels/handlers/default form behavior/disabled inputs.
2. Vocabulary: caller-owned actions use actual shipped Button, not a new mock or
   fixture CSS reset overriding the component; platform radio reference unchanged.
3. Ports: existing Button import, Preact/native button forms, same native browser
   keyboard and axe. No replacement of native behavior or new dependency.
4. Constants: existing Button default styling/tokens; no raw colors, timeout,
   tolerance, retries, new axe allowance or hidden node.
5. One extra maintained fixture file before freeze. Replace plain button tags in
   gap-ai-interaction-fixture.tsx with Button, retain all attributes/handlers/
   children and native types. Existing already-Button host-flow controls unchanged.
   Scoped fixture check/lint/fmt, rebuild, SAME complete192focused AI cases all3
   engines/bothschemes/3901280; then all previously bound fresh integration gates.
   Record intentional consuming-fixture exception to non-CSS byte preservation.
6. Deferred: no product/global reset change, token change or test skip. All remaining
   Desktop/productionx/allstyle/finalruntime scope remains mandatory. No READY.
7. Contributor path: gap-ai-interaction-fixture.tsx demonstrates caller composition;
   existing strict accessibility/native keyboard specs verify it.
