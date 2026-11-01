import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { chromium } from '../../../tools/fresh-ui-browser/node_modules/playwright-core/index.mjs';
import { compareCssRules } from './compare-css-rules.mjs';

const REPOSITORY = fileURLToPath(new URL('../../../', import.meta.url));
const DEFAULT_FIXTURE = fileURLToPath(new URL('./fixtures/utility-2558.json.gz', import.meta.url));
const SAFE_CSS_PATH =
  /^registry\/(?:components\/ui|islands|styles)\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.css$/;
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const EXPECTED_SCENES = ['light/390', 'light/1280', 'dark/390', 'dark/1280'];

/** Reject a partial sampler even if its own summary incorrectly claims success. */
export function assertCompleteVisualProof(visual, manifest) {
  const scenes = visual.results?.map((row) => `${row.scheme}/${row.width}`).sort();
  if (
    visual.specimens !== manifest.specimens || !Array.isArray(scenes) ||
    JSON.stringify(scenes) !== JSON.stringify([...EXPECTED_SCENES].sort()) ||
    !Array.isArray(manifest.proof?.properties) || manifest.proof.properties.length === 0 ||
    JSON.stringify(visual.properties) !== JSON.stringify(manifest.proof?.properties) ||
    !Number.isSafeInteger(manifest.proof?.comparisonsPerScene) ||
    manifest.proof.comparisonsPerScene <= 0 ||
    visual.results.some((row) =>
      row.styleComparisons !== manifest.proof.comparisonsPerScene ||
      !Array.isArray(row.differences) || typeof row.pixelsEqual !== 'boolean' ||
      !/^[a-f0-9]{64}$/.test(row.beforeSha256) || !/^[a-f0-9]{64}$/.test(row.afterSha256)
    )
  ) {
    throw new Error(
      'Incomplete visual proof: require the original four scenes, properties and comparison counts',
    );
  }
}

/** Load the immutable, self-contained original proof inputs with their provenance manifest. */
export async function loadBaseline(path) {
  const manifest = JSON.parse(
    await readFile(path.replace(/\.json\.gz$/, '.manifest.json'), 'utf8'),
  );
  const compressed = await readFile(path);
  if (sha(compressed) !== manifest.sha256) throw new Error('Baseline compressed SHA256 mismatch');
  const bytes = gunzipSync(compressed);
  if (sha(bytes) !== manifest.uncompressedSha256) {
    throw new Error('Baseline payload SHA256 mismatch');
  }
  const fixture = JSON.parse(bytes.toString('utf8'));
  if (
    fixture.schemaVersion !== 1 || !fixture.css || typeof fixture.baseTokens !== 'string' ||
    typeof fixture.utilityTokens !== 'string' || !Array.isArray(fixture.specimens) ||
    !fixture.specimens.length || Object.keys(fixture.css).length !== manifest.cssFiles ||
    fixture.specimens.length !== manifest.specimens
  ) throw new Error('Invalid baseline inventory');
  for (const [path, css] of Object.entries(fixture.css)) {
    if (!SAFE_CSS_PATH.test(path) || typeof css !== 'string') {
      throw new Error(`Unsafe baseline CSS path: ${path}`);
    }
  }
  for (const row of fixture.specimens) {
    if (typeof row.name !== 'string' || typeof row.html !== 'string' || !row.html) {
      throw new Error('Invalid baseline specimen');
    }
  }
  // Original contract/variant sets share some names; the browser's data-case index is identity.
  const html = JSON.stringify(fixture.specimens.map(({ name, html }) => ({ name, html })));
  if (
    manifest.schemaVersion !== 1 ||
    JSON.stringify(fixture.provenance) !== JSON.stringify(manifest.provenance) ||
    sha(html) !== manifest.inputs?.beforeHtml || sha(html) !== manifest.inputs?.afterHtml ||
    sha(fixture.utilityTokens) !== manifest.inputs?.utilityTokens
  ) {
    throw new Error('Baseline provenance or original proof input hashes do not match');
  }
  return { fixture, manifest };
}

async function candidateFiles(root) {
  const paths = [];
  async function visit(directory) {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
      if (entry.isSymbolicLink()) {
        throw new Error(`Unsupported candidate CSS symlink: ${entry.name}`);
      }
      if (entry.isDirectory()) await visit(`${directory}/${entry.name}`);
      if (entry.name.endsWith('.css')) {
        if (!entry.isFile()) throw new Error(`Unsupported candidate CSS entry: ${entry.name}`);
        paths.push(`${directory}/${entry.name}`);
      }
    }
  }
  for (const folder of ['components/ui', 'islands', 'styles']) await visit(`registry/${folder}`);
  return paths.sort();
}

/** Run ordered rule contracts and the same 2.4M-comparison Utility screenshot proof as #2558. */
export async function replay(
  { baseline = DEFAULT_FIXTURE, candidate = join(REPOSITORY, 'packages/fresh-ui'), output },
) {
  if (!output) throw new Error('An output directory is required');
  const { fixture, manifest } = await loadBaseline(baseline);
  const paths = await candidateFiles(candidate);
  if (JSON.stringify(paths) !== JSON.stringify(Object.keys(fixture.css).sort())) {
    throw new Error(
      'CSS inventory differs from baseline; review and refresh the fixture deliberately',
    );
  }
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const rules = [];
  try {
    const page = await browser.newPage();
    for (const path of paths) {
      rules.push({
        path,
        ...await compareCssRules(
          page,
          fixture.css[path],
          await readFile(join(candidate, path), 'utf8'),
        ),
      });
    }
    if (!rules.reduce((n, row) => n + row.beforeRules, 0)) throw new Error('Empty rule comparison');
  } finally {
    await browser.close();
  }
  const differences = rules.flatMap((row) =>
    row.differences.map((difference) => ({ path: row.path, ...difference }))
  );
  await writeFile(
    join(output, 'rules.json'),
    JSON.stringify({ files: paths.length, rules, differences }, null, 2) + '\n',
  );

  // Only fixture CSS/markup is materialized; no historical clone or package build is required.
  const temporary = await mkdtemp(join(tmpdir(), 'netscript-css-parity-'));
  let visual;
  try {
    const before = join(temporary, 'before');
    for (const [path, css] of Object.entries(fixture.css)) {
      const target = join(before, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, css);
    }
    await mkdir(join(before, 'registry/theme'), { recursive: true });
    await writeFile(join(before, 'registry/theme/tokens.css'), fixture.baseTokens);
    const specimens = join(temporary, 'specimens.json'), tokens = join(temporary, 'utility.css');
    await writeFile(specimens, JSON.stringify(fixture.specimens));
    await writeFile(tokens, fixture.utilityTokens);
    await rm(join(output, 'utility/parity.json'), { force: true });
    const result = spawnSync(process.execPath, [
      join(REPOSITORY, 'tools/fresh-ui-browser/variant-parity.ts'),
      before,
      candidate,
      specimens,
      specimens,
      tokens,
      join(output, 'utility'),
    ], { stdio: 'inherit' });
    visual = JSON.parse(await readFile(join(output, 'utility/parity.json'), 'utf8'));
    if (result.error || result.status !== 0) visual.ok = false;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  assertCompleteVisualProof(visual, manifest);
  const visualOk = visual.ok === true &&
    visual.results.every((row) =>
      row.differences.length === 0 && row.pixelsEqual && row.beforeSha256 === row.afterSha256
    );
  const baselineInputsMatch = ['beforeHtml', 'afterHtml', 'beforeCss', 'utilityTokens'].every((
    key,
  ) => visual.inputs[key] === manifest.inputs[key]);
  const result = {
    schemaVersion: 1,
    baseline: manifest.provenance,
    baselineSha256: manifest.sha256,
    baselineInputsMatch,
    inputs: visual.inputs,
    browser: visual.browser,
    files: paths.length,
    rules: rules.reduce((n, row) => n + row.beforeRules, 0),
    ruleDifferences: differences.length,
    specimens: visual.specimens,
    styleComparisons: visual.results.reduce((n, row) => n + row.styleComparisons, 0),
    visualOk,
    ok: differences.length === 0 && visualOk && baselineInputsMatch,
  };
  await writeFile(join(output, 'parity.json'), JSON.stringify(result, null, 2) + '\n');
  if (!result.ok) {
    throw new Error('Component CSS parity failed; inspect rules.json and utility/parity.json');
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {};
  const keys = { '--baseline': 'baseline', '--candidate': 'candidate', '--output': 'output' };
  for (let i = 2; i < process.argv.length; i++) {
    const key = keys[process.argv[i]], value = process.argv[++i];
    if (!key || !value) {
      throw new Error(
        'Usage: check-component-css-parity [--baseline file.json.gz] [--candidate package-root] --output directory',
      );
    }
    options[key] = resolve(value);
  }
  console.log(JSON.stringify(await replay(options)));
}
