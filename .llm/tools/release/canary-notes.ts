import { extractClosingIssues } from '../validation/acceptance-evidence.ts';
import type { CanaryPayload } from './canary-label.ts';

/** GitHub metadata consumed once per included PR. */
export interface CanaryPullRequestDetails {
  readonly title: string;
  readonly body: string;
  readonly labels: readonly string[];
}

/** Issue state observed while composing the release, never inferred from prose. */
export interface CanaryFollowUp {
  readonly number: number;
  readonly title: string;
  readonly state: 'open' | 'closed';
}

/** Exact publication context supplied by the canary workflow. */
export interface CanaryNoteContext {
  readonly latestStableTag: string;
  readonly publishedPackageCount: number;
  readonly publishRunId: string;
  readonly productionE2ERunId: string;
}

/** Recognize the two breaking-change conventions used by PR authors. */
export function isBreakingPullRequest(pr: CanaryPullRequestDetails): boolean {
  return pr.labels.includes('breaking') || /^[\w-]+(?:\([^\n)]+\))?!:/.test(pr.title);
}

/** Read a nonempty migration section, stopping at its next peer heading. */
export function migrationNote(body: string): string | undefined {
  const lines = body.split(/\r?\n/);
  let fence: string | undefined;
  let start = -1;
  let level = 0;
  let end = lines.length;
  for (const [index, line] of lines.entries()) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
      continue;
    }
    if (fence) continue;
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (!heading) continue;
    if (start >= 0 && heading[1].length <= level) {
      end = index;
      break;
    }
    if (start < 0 && /\bmigrat(?:ion|ing|e)\b/i.test(heading[2])) {
      start = index;
      level = heading[1].length;
    }
  }
  if (start < 0) return undefined;
  const note = lines.slice(start + 1, end).join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
  return note && !/^(?:n\/?a|none|todo|tbd|pending|migration note missing)[.!\s]*$/i.test(note)
    ? note
    : undefined;
}

/** Reuse the closing parser after removing explicit negations from explanatory prose. */
export function releaseClosingIssues(body: string): number[] {
  return extractClosingIssues(body.replace(
    /\b(?:does\s+not|do\s+not|did\s+not|will\s+not|must\s+not|cannot|can't|won't|doesn't|don't|not)\s+(?:close[sd]?|fix(?:es|ed)?|resolve[sd]?)\s+#\d+\b/gi,
    '',
  ));
}

/** Collect only explicit reference declarations outside code fences. */
export function referencedIssues(body: string): number[] {
  const text = body.replace(/^\s*```[^\n]*\n[\s\S]*?^\s*```\s*$/gm, '');
  return [
    ...new Set([...text.matchAll(/\bRefs\s+((?:#\d+\b[\s,]*)+)/gi)]
      .flatMap((match) => [...match[1].matchAll(/#(\d+)/g)].map((issue) => Number(issue[1])))),
  ];
}

/** Render deterministic introductions using metadata and fixed prose only. */
export function renderCanaryIntroduction(
  version: string,
  payload: CanaryPayload,
  repo: string,
  context: CanaryNoteContext,
): string {
  if (!/^v\d+\.\d+\.\d+$/.test(context.latestStableTag)) {
    throw new Error('Latest stable tag required.');
  }
  if (!Number.isSafeInteger(context.publishedPackageCount) || context.publishedPackageCount < 1) {
    throw new Error('Published package count must be positive.');
  }
  for (const id of [context.publishRunId, context.productionE2ERunId]) {
    if (!/^\d+$/.test(id)) throw new Error('Exact workflow run IDs required.');
  }
  const [target, ordinal] = version.split('-canary.');
  const lines = [
    `**What this canary is for.** canary.${ordinal} is release candidate ${ordinal} for NetScript ${target}. It bundles ${payload.pullRequests.length} pull requests since the previous canary point so downstream apps can try the published packages before ${target} ships. It is a **pre-release**: normal semver resolution never selects it, and **Latest stays ${context.latestStableTag}**. All ${context.publishedPackageCount} \`@netscript/*\` packages are published at exactly \`${version}\`. The canary publish and version-pinned production E2E both passed ([publish](https://github.com/${repo}/actions/runs/${context.publishRunId}), [production E2E](https://github.com/${repo}/actions/runs/${context.productionE2ERunId})).`,
    '',
    '## Highlights',
    '',
  ];
  lines.push(
    renderHighlights(payload, repo),
    renderBreakingChanges(payload, repo),
    renderFollowUps(payload, repo),
  );
  lines.push(
    '',
    '## Trying this canary',
    '',
    `Pin exact versions, for example \`jsr:@netscript/service@${version}\`. Deno applies a default 24-hour minimum dependency age. For testing a newer canary, set \`minimumDependencyAge: 0\` in the consumer configuration; this changes admission timing, not versions.`,
    '',
    'PRs listed below as "closes no linked issues" may deliver partial scope. Their explicitly referenced open issues are listed above; remaining scope stays tracked on those issues.',
    '',
    '---',
    '',
  );
  return lines.join('\n');
}

function renderHighlights(payload: CanaryPayload, repo: string): string {
  const lines: string[] = [];
  const groups = new Map<string, number[]>();
  for (const number of payload.pullRequests) {
    const pr = payload.pullRequestDetails?.[number];
    const title = pr?.title ?? payload.pullRequestTitles[number];
    const area = pr?.labels.filter((label) => label.startsWith('area:')).sort()[0]?.slice(5) ??
      title.match(/^[\w-]+\(([^)]+)\)!?:/)?.[1] ?? 'other';
    const group = groups.get(area) ?? [];
    group.push(number);
    groups.set(area, group);
  }
  for (
    const [area, numbers] of [...groups].sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0
    )
  ) {
    lines.push(`### ${area}`, '');
    for (const number of numbers) {
      const title = payload.pullRequestTitles[number].replace(/^[\w-]+(?:\([^)]+\))?!?:\s*/, '');
      lines.push(`- ${title} ([#${number}](https://github.com/${repo}/pull/${number}))`);
    }
    lines.push('');
  }
  if (!groups.size) lines.push('_No included pull requests._', '');
  return lines.join('\n');
}

function renderBreakingChanges(payload: CanaryPayload, repo: string): string {
  const lines = ['## Breaking changes and migration', ''];
  const breaking = payload.pullRequests.filter((number) => {
    const pr = payload.pullRequestDetails?.[number];
    return pr && isBreakingPullRequest(pr);
  });
  for (const number of breaking) {
    const pr = payload.pullRequestDetails![number];
    lines.push(
      `- [#${number}](https://github.com/${repo}/pull/${number}): ${
        pr.title.replace(/^[\w-]+(?:\([^)]+\))?!?:\s*/, '')
      }`,
    );
    const note = migrationNote(pr.body);
    lines.push(...(note ?? 'migration note missing').split('\n').map((line) => `  ${line}`));
  }
  if (!breaking.length) lines.push('_No breaking changes declared by included PRs._');
  return lines.join('\n');
}

function renderFollowUps(payload: CanaryPayload, repo: string): string {
  const lines = ['', '## Known open follow-ups', ''];
  const closing = new Set(
    Object.values(payload.pullRequestDetails ?? {}).flatMap((pr) => releaseClosingIssues(pr.body)),
  );
  const references = new Set(
    Object.values(payload.pullRequestDetails ?? {}).flatMap((pr) => referencedIssues(pr.body)),
  );
  const followUps = (payload.followUps ?? []).filter((issue) =>
    issue.state === 'open' && references.has(issue.number) && !closing.has(issue.number)
  ).sort((left, right) => left.number - right.number);
  for (const issue of followUps) {
    lines.push(
      `- [#${issue.number}](https://github.com/${repo}/issues/${issue.number}) ${issue.title}`,
    );
  }
  if (!followUps.length) lines.push('_No referenced issues remain open._');
  return lines.join('\n');
}

/** Remove private execution context while retaining public release text and links. */
export function publicReleaseText(text: string): string {
  return text
    .replace(
      /(?:~\/|\/(?:home|Users|ephemeral|tmp|mnt|root|var|opt|workspace|srv|etc)\/|[A-Z]:\\)[^\s\x60<>"']*/gi,
      '[private path]',
    )
    .replace(/\b(?:session|thread)[-_ ]?id\s*[:=]\s*[^\s,;]+/gi, '[private identifier]')
    .replace(/\b(?:session|thread)[-_][a-z0-9-]{8,}\b/gi, '[private identifier]')
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      '[private identifier]',
    )
    .replace(/\b(?:hostname|host)\s*[:=]\s*[^\s,;]+/gi, '[private host]')
    .replace(/https?:\/\/[^\s)\]<>]+/gi, (address) => {
      try {
        const hostname = new URL(address).hostname;
        return ['github.com', 'jsr.io'].includes(hostname) ? address : '[external address]';
      } catch {
        return '[external address]';
      }
    })
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '[private host]')
    .replace(/\b(?:localhost|[\w-]+\.(?:local|internal|lan))(?::\d+)?\b/gi, '[private host]');
}
