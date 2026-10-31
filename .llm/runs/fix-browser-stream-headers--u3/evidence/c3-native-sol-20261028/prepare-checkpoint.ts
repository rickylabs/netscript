const native = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
const run = '.llm/runs/fix-browser-stream-headers--u3';
const target = `${run}/evidence/c3-native-sol-20261028`;
async function sha(bytes: Uint8Array) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((n) => n.toString(16).padStart(2, '0')).join('');
}
const entries = [];
async function copyTree(source: string, destination: string) {
  for await (const item of Deno.readDir(source)) {
    const from = `${source}/${item.name}`;
    const to = `${destination}/${item.name}`;
    if (item.isDirectory) await copyTree(from, to);
    else if (item.isFile) {
      const bytes = await Deno.readFile(from);
      if (/(?:sk-or-v1-|ghp_|github_pat_|sk-proj-)[A-Za-z0-9_-]{12}/.test(new TextDecoder().decode(bytes))) throw new Error('Credential-shaped evidence.');
      await Deno.mkdir(destination, { recursive: true });
      await Deno.writeFile(to, bytes, { createNew: true });
      const digest = await sha(bytes);
      if (digest !== await sha(await Deno.readFile(to))) throw new Error('Evidence copy mismatch.');
      entries.push({ source: from, copied: to, bytes: bytes.length, sha256: digest });
    }
  }
}
await copyTree(native, target);
await Deno.writeTextFile(`${target}/manifest.json`, JSON.stringify({ capturedAt: new Date().toISOString(), byteVerified: true, policy: 'Source/gate snapshots and scripts only; no private model sessions, reasoning, credentials or runtime profiles. Every earlier attempt retained.', entries }, null, 2), { createNew: true });
await Deno.writeTextFile(`${run}/c3-checkpoint.md`, `# Root-accepted C3 documentation checkpoint

The streams guide documents native string/sync/async reader headers, per-request resolution,
undefined-only legacy auth, explicit-record replacement and the Fresh custom-port migration.
Only the two stale generic factory/module introductions changed in source; their remaining
bytes are identical to accepted C2. [Root acceptance](root-c3-source-acceptance.md) independently
verified all six owners and seven protected hashes.

The exact new recipe compiles and its numeric-header variant fails TS2322. Global snippets
passes27checked/14exempt but does not cover this streams page. Source format passes2 and the
exact added Markdown section passes1. Full scoped Markdown format has the same two findings
reproduced from unchanged HEAD. Links fails5 installed Aspire-skill targets; export/reference
coverage and accuracy fail36 Windows path prerequisites; global JSDoc examples fails Windows
spawn error206. No global documentation or example-compiler PASS is claimed.

[Raw byte-verified manifest](evidence/c3-native-sol-20261028/manifest.json) and
[six-owner source/gate bindings](evidence/c3-native-sol-20261028/final-evidence-2.json) preserve
every attempt, including the seal's initial Git-LF/accepted-CRLF lock comparison. The lock bytes
were unchanged; the corrected audit uses accepted C2 working-byte hashes. Owned recipe sources
were removed and all compiler output awaited. No runtime/API/export/config/lock/debt change.

Fresh12/workers1 findings, failed F15 application and architecture prerequisites remain unwaived.
The two-native-type closure is a separate ignored-clone diagnostic pending corrective review.
This checkpoint remains DRAFT; no independent IMPL, ready/merge/close or actual publication.
`, { createNew: true });
console.log(JSON.stringify({ evidenceFiles: entries.length, byteVerified: true }));
