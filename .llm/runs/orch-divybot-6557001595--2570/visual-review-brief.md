# Independent S3 visual acceptance — #2570

You are the independent visual reviewer, not the implementer. Read-only. Do not
edit files, run generators, launch agents, post comments or read profiles/ files.
Use image viewing tools to compare actual screenshots with Figma. Report honest
fidelity and quality scores, each out of 10. Every page must reach 8 in both;
do not inflate or average away a failure. Output repo-relative paths only and no
session identifiers. The caller saves your final report.

Reference root:
.llm/runs/design-system-s4--language-review/figma-library/
- review/screens/utility/{dashboard,orders,settings,sign-in,command}-{light,dark}.png
- locked/studio--neutral-ink--{light,dark}.png
- component-spec.md; contract-proposals.md.

Actual evidence root: .llm/runs/orch-divybot-6557001595--2570/
- screens/{empty,service,plugins}-{dashboard,dashboard-alias,records,detail,settings,sign-in,command}-{1440,390}-{light,dark}.png
- settings-saved captures show the real success state.
- s3-browser.json lists rendered routes, states and interactions.
- plan.md defines approved capability-aware adaptations.

Map dashboard/alias to dashboard; records and its detail composition to orders;
settings to settings; sign-in to sign-in; command to command. There is no separate
Figma detail/mobile file, so judge adaptation of the same system at mobile widths,
and identify that limitation. Inspect every page in both schemes and widths,
including no-service, live service and installed-plugin variants. A concise matrix
can group identical chrome when the report states which images were viewed and
keeps per-page worst-case scores visible. Do not substitute source inspection for
image review.

Semantics: no fake revenue/orders/users. The app uses its generated project/theme/
route metadata, existing typed service data, and designed missing-capability states.
Live service records are fetched from the existing generated memory service, not
invented by the page. Plugins are installed and app-linked; absent workers/streams
runtime is visibly unavailable, no-samples AI has model config but no runtime, and
auth uses the actual OAuth BFF rather than fictional password fields. #2571 demo
plumbing is excluded. Assess visual layout, hierarchy, type, geometry, spacing,
contrast, consistency and responsive usability within those honest adaptations.

Give PASS or FAIL with concrete actionable findings and the score matrix. This is
visual acceptance only, not final implementation or merge-readiness certification.
