export const meta = {
  name: 'build-doc-site',
  description: 'Author the full NetScript documentation site, one grounded agent per page, build-verified',
  whenToUse: 'Pipeline step 4 (Claude authoring lane). Launch ONLY after PLAN-EVAL (minimax-m3) PASSES. Pass the approved page inventory as `args`.',
  phases: [
    { title: 'Author', detail: 'one authoring agent per page, grounded in ground-truth + anatomy + approved plan' },
    { title: 'Verify', detail: 'per-page accuracy + Vento-safety self-check as each page completes' },
    { title: 'Completeness', detail: 'critic pass: what zone/page/claim is missing or unverified' },
  ],
};

// ============================================================================
// build-doc-site.workflow.js — NetScript SOTA documentation authoring workflow
// ----------------------------------------------------------------------------
// LANE: Claude authoring workflow = PR #59 pipeline step 4. HARD-GATED: do not
// launch until PLAN-EVAL (OpenHands minimax-m3) returns PASS on the v2 plan.
// Touches ONLY docs/site/** (never docs/site/reference/**, packages/, plugins/).
//
// INVENTORY: passed as `args` = the approved plan's page list. Shape:
//   {
//     worktree: "<abs path to the docs worktree>",          // where files are written
//     planPath: ".llm/tmp/run/.../doc-architecture-v2.md",  // approved IA + per-page briefs
//     groundTruth: [".llm/tmp/run/.../ground-truth.md",
//                   ".llm/tmp/run/.../ground-truth-project-anatomy.md"],
//     zones: [
//       { zone: "tutorials", pages: [
//           { url: "/tutorials/build-a-service/", file: "docs/site/tutorials/build-a-service.md",
//             type: "tutorial", title: "Build a service",
//             prev: { label, href }, next: { label, href },
//             brief: "<what this page must teach, grounded sections, real commands/ports/code shapes>",
//             accuracyMarkers: ["localhost:3001", "defineService", "/rpc"] },
//           ...
//       ]},
//       ...
//     ]
//   }
// If `args` is undefined the script runs a tiny self-test inventory so a dry run
// doesn't fan out 60 agents by accident.
// ============================================================================

const inv = (args && args.zones) ? args : {
  worktree: 'SELFTEST',
  planPath: '(none)',
  groundTruth: [],
  zones: [{ zone: 'selftest', pages: [{
    url: '/selftest/', file: 'docs/site/_selftest.md', type: 'explanation', title: 'Self test',
    brief: 'SELF-TEST ONLY. Do not write files. Return a one-line manifest entry proving the schema works.',
    accuracyMarkers: [],
  }] }],
};

const allPages = inv.zones.flatMap((z) => z.pages.map((p) => ({ ...p, zone: z.zone })));
log(`build-doc-site: ${inv.zones.length} zones, ${allPages.length} pages, worktree=${inv.worktree}`);

// ---- Shared grounding every authoring + verify agent receives ---------------
const GROUNDING = `
You are authoring ONE page of the NetScript documentation website. NetScript is a Deno-native,
contracts-first backend framework. This site is the production/enterprise-grade deliverable — be
exhaustive, concrete, and content-rich; never minimalistic.

AUTHORITY FILES (read them; never invent surface that contradicts them):
- Approved IA + per-page brief: ${inv.planPath}
- Ground truth (verified by running the scaffold): ${inv.groundTruth.join(', ')}
Every command, path, port, endpoint, and code shape MUST match those files. If the brief and ground
truth disagree, ground truth wins and you note the discrepancy in your return.

HARD DOC RULES:
1. Aspire is step 2, not an afterthought: \`cd aspire && aspire run\` brings up Postgres/Garnet BEFORE
   any \`netscript db\` command. DB commands require Aspire running first — state that dependency.
2. Use the public \`netscript <cmd>\` form. Never the vendored \`packages/cli/...\` path; install is
   \`deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts\`.
3. Real endpoints/ports per capability (Workers :8091, Sagas :8092, Triggers :8093, Aspire :18888,
   example service :3001). Link to \`/reference/<unit>/\` for the full generated API — never duplicate it.
4. Canonical plugin location is \`plugins/<name>/\`. Triggers expose raw Hono routes, NOT oRPC. Streams
   producer/consumer are stubs (topic APIs deferred). Services use \`defineService(...)\` (one-shot) or
   the fluent \`createService(...).serve()\` builder. Contracts are \`@orpc/contract\` + zod with
   \`implement()\`. Match the anatomy file.

LUME/VENTO AUTHORING MODEL (the build aborts if violated):
- Front matter: \`layout: layouts/base.vto\`, a \`title\`, \`templateEngine: [vento, md]\`, and
  \`prev\`/\`next\` objects for the ladder. base.vto auto-injects breadcrumb + nextPrev for navSections pages.
- Body components: tag form \`{{ comp NAME { args } }}\` … body … \`{{ /comp }}\`, or self-close
  \`{{ comp NAME { args } /}}\`. No-body function form \`{{ comp.NAME({...}) }}\` returns a string.
- callout bodies are INLINE HTML (\`<strong>\`, \`<code>\`, \`<a>\`), not markdown.
- NEVER write the literal keyword \`function\` inside any comp-tag argument (it aborts the build) — use
  arrow/\`const\` form in code samples inside comps. The word \`function\` in page-level markdown prose is fine.
- Components available: hero, featureGrid, apiTable, tabbedCode, card, callout, learningPath
  (+ auto breadcrumb/nextPrev). Use any NEW components the approved plan introduced.

OUTPUT: write the file at its absolute path under ${inv.worktree} using the Write tool; if Write is
redirected away from that worktree, fall back to creating the file via a Bash heredoc at the absolute
path. Then return the structured manifest entry (do not paste the whole file).
`;

const PAGE_SCHEMA = {
  type: 'object',
  required: ['file', 'written', 'headings', 'accuracyMarkersPresent', 'compTagsBalanced', 'functionKeywordInComp', 'notes'],
  properties: {
    file: { type: 'string' },
    written: { type: 'boolean', description: 'true if the file was created at the absolute worktree path' },
    headings: { type: 'integer', description: 'count of section headings authored' },
    accuracyMarkersPresent: { type: 'array', items: { type: 'string' }, description: 'which required accuracyMarkers actually appear in the page' },
    accuracyMarkersMissing: { type: 'array', items: { type: 'string' } },
    compTagsBalanced: { type: 'boolean', description: 'every {{ comp NAME {...} }} has a matching {{ /comp }} (or is self-closed)' },
    functionKeywordInComp: { type: 'boolean', description: 'true ONLY if the forbidden bare `function` keyword appears inside a comp arg (must be false)' },
    crossLinks: { type: 'array', items: { type: 'string' }, description: 'internal hrefs linked (fil dAriane / related pages)' },
    discrepancies: { type: 'array', items: { type: 'string' }, description: 'places the brief contradicted ground truth' },
    notes: { type: 'string' },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['file', 'accurate', 'buildSafe', 'verdict'],
  properties: {
    file: { type: 'string' },
    accurate: { type: 'boolean', description: 'commands/ports/endpoints/code shapes match ground truth' },
    buildSafe: { type: 'boolean', description: 'comp tags balanced AND no bare `function` keyword inside any comp arg' },
    depthOk: { type: 'boolean', description: 'page is exhaustive/enterprise-grade for its type, not a stub' },
    issues: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string', enum: ['PASS', 'FIX'] },
  },
};

// ---- Phase Author + Verify: pipeline so each page verifies as it completes ---
const authored = await pipeline(
  allPages,
  (p) => agent(
    `${GROUNDING}\n\n=== THIS PAGE ===\nzone: ${p.zone}\ntype: ${p.type}\nurl: ${p.url}\nabsolute target: ${inv.worktree}/${p.file}\ntitle: ${p.title}\nprev: ${JSON.stringify(p.prev || null)}\nnext: ${JSON.stringify(p.next || null)}\nrequired accuracy markers: ${JSON.stringify(p.accuracyMarkers || [])}\n\nBRIEF:\n${p.brief}`,
    { label: `author:${p.zone}/${p.title}`, phase: 'Author', schema: PAGE_SCHEMA },
  ),
  (res, p) => res && res.written
    ? agent(
        `Adversarially verify the page just authored at ${inv.worktree}/${p.file}.\nRead the file and the authority files (${inv.groundTruth.join(', ')}). Check: (1) every command/path/port/endpoint/code shape matches ground truth; (2) Lume build-safety — every \`{{ comp NAME {...} }}\` has a matching \`{{ /comp }}\` or is self-closed, and the bare keyword \`function\` does NOT appear inside any comp arg; (3) the page is exhaustive for a "${p.type}" page (not a stub) and carries the fil-dAriane (breadcrumb-eligible front matter, prev/next, related cross-links). Required accuracy markers: ${JSON.stringify(p.accuracyMarkers || [])}. Return the verdict.`,
        { label: `verify:${p.zone}/${p.title}`, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).then((v) => ({ page: p, author: res, verdict: v }))
    : { page: p, author: res, verdict: { file: p.file, accurate: false, buildSafe: false, verdict: 'FIX', issues: ['not written'] } },
);

const results = authored.filter(Boolean);
const failing = results.filter((r) => !r.verdict || r.verdict.verdict !== 'PASS');
log(`authored ${results.length}/${allPages.length}; ${failing.length} need a fix pass`);

// ---- Phase Completeness: critic over the whole manifest ---------------------
const manifest = results.map((r) => ({
  zone: r.page.zone, url: r.page.url, file: r.page.file,
  pass: r.verdict && r.verdict.verdict === 'PASS',
  issues: (r.verdict && r.verdict.issues) || [],
}));

const critique = await agent(
  `You are the completeness critic for the NetScript documentation build. The approved IA is at ${inv.planPath}. Here is the authored manifest:\n${JSON.stringify(manifest, null, 2)}\n\nAgainst the approved IA and the ground-truth feature set, identify: (1) any planned page/zone NOT authored or NOT PASS; (2) any capability/feature with no page or no working code sample; (3) any wayfinding gap (a page not reachable via sidebar/breadcrumb/prev-next/related links); (4) any claim that is unverified against ground truth. Return a prioritized backlog of concrete follow-ups (page+what's missing).`,
  { label: 'completeness-critic', phase: 'Completeness',
    schema: { type: 'object', required: ['backlog'], properties: {
      coveredPages: { type: 'integer' }, passPages: { type: 'integer' },
      backlog: { type: 'array', items: { type: 'object', required: ['item', 'priority'], properties: {
        item: { type: 'string' }, priority: { type: 'string', enum: ['P0', 'P1', 'P2'] }, page: { type: 'string' } } } },
    } } },
);

return {
  zones: inv.zones.length,
  pages: allPages.length,
  authored: results.length,
  passed: manifest.filter((m) => m.pass).length,
  failing: failing.map((r) => ({ file: r.page.file, issues: (r.verdict && r.verdict.issues) || [] })),
  manifest,
  completeness: critique,
  note: 'After this run: supervisor runs `deno task --cwd docs/site build`, reconciles any leaked edits per the workflow-subagent-worktree-pin lesson, commits per zone, pushes, comments PR #59, appends commits.md. Then IMPL-EVAL (minimax-m3). NEVER merge PR #59 without explicit authorization.',
};
