// Release-specific operational receipt: reuse the native note body and issue renderer.
// No package/source mutation and no release creation. Run from the exact clean release tree.
const [intro] = Deno.args;
if (!intro) throw new Error('An introduction path is required.');
const root = Deno.cwd();
const { formatClosedIssues } = await import(
  new URL(`file://${root}/.llm/tools/release/github-release.ts`).href
);
const native = await new Deno.Command('deno', {
  args: ['task', 'release:publish', '--', 'v0.0.7', '--notes-file', intro,
    '--prev-tag', 'v0.0.6', '--dry-run'],
  stdout: 'piped', stderr: 'piped',
}).output();
if (!native.success) throw new Error(new TextDecoder().decode(native.stderr));
const current = new TextDecoder().decode(native.stdout);
const previous = await new Deno.Command('gh', {
  args: ['api', 'repos/rickylabs/netscript/releases/tags/v0.0.6', '--jq', '.published_at'],
  stdout: 'piped', stderr: 'piped',
}).output();
if (!previous.success) throw new Error('Cannot resolve the previous stable release.');
const since = new TextDecoder().decode(previous.stdout).trim();
const fetched = await new Deno.Command('gh', {
  args: ['api', '--paginate', '--slurp', '-X', 'GET', 'search/issues', '-f',
    `q=repo:rickylabs/netscript is:issue is:closed closed:>${since}`,
    '-F', 'per_page=100', '-f', 'sort=updated', '-f', 'order=desc'],
  stdout: 'piped', stderr: 'piped',
}).output();
if (!fetched.success) throw new Error('Complete closed-issue collection failed.');
const pages = JSON.parse(new TextDecoder().decode(fetched.stdout));
if (!Array.isArray(pages) || pages.some((page) => page.incomplete_results === true)) {
  throw new Error('GitHub returned incomplete issue-search results.');
}
const issues = pages.flatMap((page) => page.items).map((issue) => {
  if (!Number.isInteger(issue.number) || typeof issue.title !== 'string' || issue.pull_request) {
    throw new Error('Invalid closed-issue entry.');
  }
  return { number: issue.number, title: issue.title };
});
if (issues.length !== pages[0]?.total_count || new Set(issues.map((i) => i.number)).size !== issues.length) {
  throw new Error('Pagination was incomplete or raced a concurrent update; do not publish this note.');
}
const marker = '\n## Closed Issues\n';
const index = current.indexOf(marker);
if (index < 0 || current.indexOf(marker, index + 1) >= 0) throw new Error('Ambiguous native note structure.');
const body = `${current.slice(0, index).trimEnd()}\n\n${formatClosedIssues(issues)}\n`;
console.log(JSON.stringify({ version: '0.0.7', previousTag: 'v0.0.6', since,
  closedIssueCount: issues.length, pages: pages.length, body }));
