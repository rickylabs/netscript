import { relative } from '@std/path';
import { extractFencedBlocks, type FencedBlock } from './snippet-extractor.ts';

/** The issue-mandated Tier-1 source pages, including zero-fence index.vto. */
export const TIER_1_PAGES = [
  'quickstart.vto',
  'index.vto',
  'services-sdk/sdk.md',
  'services-sdk/how-to/add-a-service.md',
  'web-layer/query.md',
  'web-layer/examples.md',
  'web-layer/interactive.md',
  'web-layer/form.md',
  'web-layer/query-bridge.md',
] as const;

/** Initial coverage ratchet approved by PLAN-EVAL. */
export const TIER_1_FLOOR = {
  minimumCandidates: 35,
  minimumChecked: 21,
  maximumExempt: 14,
} as const;

/** Corpus and coverage totals printed by the documentation snippet gate. */
export interface SnippetCensus {
  scanned: number;
  ts: number;
  tsx: number;
  typescript: number;
  tsLike: number;
  tier1: number;
  checked: number;
  exempt: number;
  outsideFloor: number;
  malformed: number;
}

/** Extracted site state used by the compiler and other checked-in quality consumers. */
export interface SnippetSiteAnalysis {
  blocks: FencedBlock[];
  tier1Blocks: FencedBlock[];
  exemptions: FencedBlock[];
  census: SnippetCensus;
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory && !await isGeneratedOrIgnoredDirectory(path, entry.name)) {
      files.push(...await collectSourceFiles(path));
    } else if (entry.isFile && (entry.name.endsWith('.md') || entry.name.endsWith('.vto'))) {
      files.push(path);
    }
  }
  return files.sort();
}

async function isGeneratedOrIgnoredDirectory(path: string, name: string): Promise<boolean> {
  // `_site` is Lume's build output. Keep this fallback independent of Git so the gate remains
  // correct in source archives, containers, and other checkouts without repository metadata.
  if (name === '_site') return true;

  try {
    const result = await new Deno.Command('git', {
      args: ['check-ignore', '--quiet', '--', path],
      stdout: 'null',
      stderr: 'null',
    }).output();
    return result.code === 0;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function generatedPathDiagnostic(sourcePath: string, message: string): string {
  if (sourcePath.split('/').includes('_site')) {
    return `${message} (path is under generated Lume build output; the source walker must exclude _site)`;
  }
  return message;
}

function toSourcePath(siteRoot: string, path: string): string {
  return relative(siteRoot, path).replaceAll('\\', '/');
}

/** Scan a docs site and enforce the checked/exempt/candidate coverage ratchet. */
export async function analyzeSnippetSite(
  siteRoot: string,
  options: { enforceCoverage?: boolean } = {},
): Promise<SnippetSiteAnalysis> {
  const files = await collectSourceFiles(siteRoot);
  const sourcePaths = new Set(files.map((path) => toSourcePath(siteRoot, path)));
  if (options.enforceCoverage !== false) {
    for (const page of TIER_1_PAGES) {
      if (!sourcePaths.has(page)) throw new Error(`${page}: Tier-1 page missing from ${siteRoot}`);
    }
  }

  const blocks: FencedBlock[] = [];
  for (const path of files) {
    const sourcePath = toSourcePath(siteRoot, path);
    try {
      blocks.push(...extractFencedBlocks(await Deno.readTextFile(path), sourcePath));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(generatedPathDiagnostic(sourcePath, message));
    }
  }

  const tier1Pages = new Set<string>(TIER_1_PAGES);
  const tsLikeBlocks = blocks.filter((block) => block.checkedLanguage !== undefined);
  const tier1Blocks = options.enforceCoverage === false
    ? tsLikeBlocks
    : tsLikeBlocks.filter((block) => tier1Pages.has(block.sourcePath));
  const exemptions = tier1Blocks.filter((block) => block.exemptionReason !== undefined);
  const checked = tier1Blocks.length - exemptions.length;

  if (options.enforceCoverage !== false && tier1Blocks.length < TIER_1_FLOOR.minimumCandidates) {
    throw new Error(
      `Tier-1 candidate count ${tier1Blocks.length} is below floor ${TIER_1_FLOOR.minimumCandidates}`,
    );
  }
  if (options.enforceCoverage !== false && checked < TIER_1_FLOOR.minimumChecked) {
    throw new Error(
      `Tier-1 checked count ${checked} is below floor ${TIER_1_FLOOR.minimumChecked}`,
    );
  }
  if (options.enforceCoverage !== false && exemptions.length > TIER_1_FLOOR.maximumExempt) {
    throw new Error(
      `Tier-1 exemption count ${exemptions.length} exceeds budget ${TIER_1_FLOOR.maximumExempt}`,
    );
  }

  const census: SnippetCensus = {
    scanned: blocks.length,
    ts: blocks.filter((block) => block.checkedLanguage === 'ts').length,
    tsx: blocks.filter((block) => block.checkedLanguage === 'tsx').length,
    typescript: blocks.filter((block) => block.checkedLanguage === 'typescript').length,
    tsLike: tsLikeBlocks.length,
    tier1: tier1Blocks.length,
    checked,
    exempt: exemptions.length,
    outsideFloor: tsLikeBlocks.length - tier1Blocks.length,
    malformed: 0,
  };

  return { blocks, tier1Blocks, exemptions, census };
}

/** Render the stable one-line census used in local and CI evidence. */
export function formatSnippetCensus(
  census: SnippetCensus,
  status: 'PASS' | 'FAIL' = 'PASS',
): string {
  return `docs snippets: ${status} scanned=${census.scanned} ts=${census.ts} tsx=${census.tsx} typescript=${census.typescript} ts_like=${census.tsLike} tier1=${census.tier1} checked=${census.checked} exempt=${census.exempt} outside_floor=${census.outsideFloor} malformed=${census.malformed}`;
}
