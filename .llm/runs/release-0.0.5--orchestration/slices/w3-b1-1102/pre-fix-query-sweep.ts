import { FilesystemDocsCorpus } from '../../../../../packages/mcp/src/infrastructure/filesystem-docs-corpus.ts';

const intents = [
  'validated route-bound form',
  'keep server data fresh without polling',
  'add a capability NetScript does not ship',
  'use a Prisma-supported database NetScript does not wrap',
  'build a real service-backed UI',
  'avoid hitting my service every render',
] as const;

const corpus = new FilesystemDocsCorpus({ root: 'docs/site' });
for (const intent of intents) {
  const matches = (await corpus.search(intent)).slice(0, 5).map(({ slug, score }) => ({
    slug,
    score,
  }));
  console.log(JSON.stringify({ intent, matches }));
}
