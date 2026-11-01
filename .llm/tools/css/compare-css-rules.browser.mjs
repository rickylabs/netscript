import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import { compareCssRules } from './compare-css-rules.mjs';
import { assertCompleteVisualProof, loadBaseline, replay } from './check-component-css-parity.mjs';
import { fileURLToPath } from 'node:url';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { Buffer } from 'node:buffer';

let browser, page;
before(async () => {
  browser = await chromium.launch();
  page = await browser.newPage();
});
after(async () => {
  await browser?.close();
});
const ROOT = ':root:is([data-theme="utility"], [data-theme="studio"][data-flavor="utility"])';
const flat =
  `${ROOT} .card { color: red; } @media (width < 600px) { ${ROOT} .card { padding: 2px; } }`;
const nested =
  `${ROOT} { & .card { color: red; } @media (width < 600px) { & .card { padding: 2px; } } }`;

test('original and nested selector/media contracts are equivalent', async () => {
  const result = await compareCssRules(page, flat, nested);
  assert.equal(result.beforeRules, 2);
  assert.equal(result.afterRules, 2);
  assert.deepEqual(result.differences, []);
});

for (
  const [name, change] of [
    ['declaration', nested.replace('color: red', 'color: blue')],
    ['selector', nested.replaceAll('.card', '.panel')],
    ['media condition', nested.replace('600px', '601px')],
    ['removal', ''],
  ]
) {
  test(`comparison detects ${name} drift`, async () => {
    assert.notEqual((await compareCssRules(page, flat, change)).differences.length, 0);
  });
}

test('comparison preserves rule order and quoted content whitespace', async () => {
  assert.notEqual(
    (await compareCssRules(page, '.a{color:red}.b{color:blue}', '.b{color:blue}.a{color:red}'))
      .differences.length,
    0,
  );
  assert.notEqual(
    (await compareCssRules(page, '.a::before{content:"a  b"}', '.a::before{content:"a b"}'))
      .differences.length,
    0,
  );
});

test('a nested selector list shares the same single parent without losing descendants', async () => {
  const result = await compareCssRules(
    page,
    `${ROOT} .a, ${ROOT} .b{color:red}`,
    `${ROOT}{& .a, & .b{color:red}}`,
  );
  assert.deepEqual(result.differences, []);
});

test('ambiguous parent lists and unsupported ampersand placement fail closed', async () => {
  await assert.rejects(
    compareCssRules(page, '.a{color:red}', '.a,#strong{& .b{color:red}}'),
    /Unsupported nesting/,
  );
  await assert.rejects(
    compareCssRules(page, '.a{color:red}', '.a{.b &{color:red}}'),
    /Unsupported nesting/,
  );
});

for (const block of ['@media (width < 600px){color:red}', '& .x{color:blue} color:red']) {
  test(`implicit parent declarations fail closed: ${block}`, async () => {
    await assert.rejects(
      compareCssRules(page, `.a{${block}}`, `.b{${block}}`),
      /Unsupported nesting: declarations require an explicit style rule/,
    );
  });
}

test('committed replay fixture is self-contained with the original 52 sheets and 265 specimens', async () => {
  const { fixture, manifest } = await loadBaseline(
    fileURLToPath(new URL('./fixtures/utility-2558.json.gz', import.meta.url)),
  );
  assert.equal(Object.keys(fixture.css).length, 52);
  assert.equal(fixture.specimens.length, 265);
  assert.equal(manifest.provenance.pullRequest, 2558);
  assert.ok(fixture.baseTokens.includes('--ns-'));
  assert.ok(fixture.utilityTokens.includes('studio-utility'));
});

test('corrupt archive, unsafe CSS paths and mismatched provenance fail closed', async () => {
  const archive = new URL('./fixtures/utility-2558.json.gz', import.meta.url);
  const manifest = JSON.parse(
    await readFile(new URL('./fixtures/utility-2558.manifest.json', import.meta.url), 'utf8'),
  );
  const { fixture } = await loadBaseline(fileURLToPath(archive));
  const root = await mkdtemp(join(tmpdir(), 'css-fixture-validation-'));
  const target = join(root, 'baseline.json.gz');
  const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
  try {
    await writeFile(target, 'corrupt');
    await writeFile(join(root, 'baseline.manifest.json'), JSON.stringify(manifest));
    await assert.rejects(loadBaseline(target), /compressed SHA256 mismatch/);
    const unsafe = structuredClone(fixture);
    const original = Object.keys(unsafe.css)[0];
    unsafe.css['registry/components/ui/../../outside.css'] = unsafe.css[original];
    delete unsafe.css[original];
    const payload = Buffer.from(JSON.stringify(unsafe)), packed = gzipSync(payload);
    await writeFile(target, packed);
    await writeFile(
      join(root, 'baseline.manifest.json'),
      JSON.stringify({ ...manifest, sha256: digest(packed), uncompressedSha256: digest(payload) }),
    );
    await assert.rejects(loadBaseline(target), /Unsafe baseline CSS path/);
    await writeFile(target, await readFile(archive));
    await writeFile(
      join(root, 'baseline.manifest.json'),
      JSON.stringify({
        ...manifest,
        provenance: { ...manifest.provenance, beforeCommit: 'different' },
      }),
    );
    await assert.rejects(loadBaseline(target), /provenance or original proof input hashes/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('new nested CSS cannot escape the replay inventory', async () => {
  const { fixture } = await loadBaseline(
    fileURLToPath(new URL('./fixtures/utility-2558.json.gz', import.meta.url)),
  );
  const root = await mkdtemp(join(tmpdir(), 'css-candidate-inventory-'));
  try {
    for (const [path, css] of Object.entries(fixture.css)) {
      await mkdir(dirname(join(root, path)), { recursive: true });
      await writeFile(join(root, path), css);
    }
    await mkdir(join(root, 'registry/components/ui/nested'));
    await writeFile(join(root, 'registry/components/ui/nested/added.css'), '.added{color:red}');
    await assert.rejects(
      replay({ candidate: root, output: join(root, 'report') }),
      /CSS inventory differs/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('a successful summary cannot hide an empty or narrowed computed-style sampler', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('./fixtures/utility-2558.manifest.json', import.meta.url), 'utf8'),
  );
  const complete = {
    ok: true,
    specimens: manifest.specimens,
    properties: manifest.proof.properties,
    results: ['light', 'dark'].flatMap((scheme) =>
      [390, 1280].map((width) => ({
        scheme,
        width,
        styleComparisons: manifest.proof.comparisonsPerScene,
        differences: [],
        pixelsEqual: true,
        beforeSha256: '0'.repeat(64),
        afterSha256: '0'.repeat(64),
      }))
    ),
  };
  assert.doesNotThrow(() => assertCompleteVisualProof(complete, manifest));
  for (
    const partial of [
      { ...complete, results: [] },
      { ...complete, results: complete.results.slice(1) },
      { ...complete, properties: complete.properties.slice(1) },
      { ...complete, specimens: complete.specimens - 1 },
      { ...complete, results: complete.results.map((row) => ({ ...row, styleComparisons: 0 })) },
    ]
  ) assert.throws(() => assertCompleteVisualProof(partial, manifest), /Incomplete visual proof/);
});
