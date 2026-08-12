import { dirname, fromFileUrl, join } from '@std/path';
import { analyzeSnippetSite, formatSnippetCensus } from './snippet-policy.ts';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));

function argumentAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

async function main(args: string[]): Promise<void> {
  const negativeCase = argumentAfter(args, '--negative');
  const siteRoot = negativeCase
    ? join(repositoryRoot, '.llm/tools/docs/fixtures', negativeCase, 'docs/site')
    : argumentAfter(args, '--site-root') ?? join(repositoryRoot, 'docs/site');
  const analysis = await analyzeSnippetSite(siteRoot, {
    enforceCoverage: negativeCase === undefined,
  });

  if (!args.includes('--extract-only')) {
    throw new Error('snippet compiler is introduced by implementation slice 2');
  }

  console.log(formatSnippetCensus(analysis.census));
  for (const block of analysis.exemptions) {
    console.log(`${block.sourcePath}:${block.openingLine} — ${block.exemptionReason}`);
  }
}

if (import.meta.main) {
  try {
    await main(Deno.args);
  } catch (error) {
    console.error(`docs snippets: FAIL ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
