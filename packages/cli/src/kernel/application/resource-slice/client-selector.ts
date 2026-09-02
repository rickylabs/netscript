import { resolve } from '@std/path';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

const PREREQUISITE = 'netscript service add --name <service> --with-client';

/** Describes the generated query client selected for a data-bound web slice. */
export type ClientBinding = Readonly<{ path: string; queries: string; input: string }>;

type BindingCandidate = Readonly<{ path: string; source: string; service: string | undefined }>;

/** Selects exactly one conventional generated query client and its list input. */
export async function selectClientBinding(
  root: string,
  fs: FileSystemPort,
  client?: string,
): Promise<ClientBinding> {
  const candidates: string[] = [];
  const lib = resolve(root, 'lib');
  if (await fs.exists(lib)) {
    for (const entry of await fs.readDir(lib)) {
      const path = resolve(lib, entry.name);
      if (
        entry.isFile && entry.name.endsWith('.ts') &&
        (await fs.readFile(path)).includes('createQueryFactories(')
      ) candidates.push(path);
    }
  }
  const examples = resolve(root, 'routes', 'examples');
  if (!candidates.length && await fs.exists(examples)) {
    for (const entry of await fs.readDir(examples)) {
      if (!entry.isDirectory) continue;
      const fallback = resolve(examples, entry.name, '(_lib)', 'service-query.ts');
      if (await fs.exists(fallback)) candidates.push(fallback);
    }
  }
  let path: string;
  let source: string;
  if (client !== undefined) {
    const identified = await identifyCandidates(candidates, fs);
    const matches = identified.filter((candidate) => candidate.service === client);
    if (!matches.length) {
      bindingError(
        `selected client '${client}' matches no query client`,
        candidates,
        selectionRemedy(identified),
      );
    }
    if (matches.length > 1) {
      bindingError(
        `selected client '${client}' matches more than one query client`,
        matches.map((candidate) => candidate.path),
        ` More than one candidate declares service '${client}'.`,
      );
    }
    path = matches[0].path;
    source = matches[0].source;
  } else if (candidates.length !== 1) {
    const remedy = candidates.length > 1
      ? selectionRemedy(await identifyCandidates(candidates, fs))
      : '';
    bindingError(
      candidates.length ? 'multiple query clients are ambiguous' : 'no query client found',
      candidates,
      remedy,
    );
  } else {
    path = candidates[0];
    source = await fs.readFile(path);
  }
  const service = serviceIdentity(source);
  const queries = source.match(
    /export const (\w+Queries)\s*=\s*createQueryFactories\(/,
  )?.[1];
  if (!service || !queries) {
    bindingError('unsupported query client', candidates);
  }
  const contracts = resolve(root, '..', '..', 'contracts', 'versions', 'v1');
  const contractPath = resolve(contracts, `${service}.contract.ts`);
  if (!await fs.exists(contractPath)) {
    bindingError(`missing contract ${contractPath}`, candidates);
  }
  const contract = await fs.readFile(contractPath);
  const input = contract.includes('createCrudContract(')
    ? `{ limit: 20, page: 1, sortBy: 'id', sortOrder: 'asc' } as const`
    : /ListInputSchemaV1[\s\S]*offset\s*:/.test(contract)
    ? `{ limit: 20, offset: 0 } as const`
    : undefined;
  if (!input) {
    bindingError(`unsupported list contract ${contractPath}`, candidates);
  }
  return { path, queries, input };
}

async function identifyCandidates(
  paths: readonly string[],
  fs: FileSystemPort,
): Promise<readonly BindingCandidate[]> {
  return await Promise.all(paths.map(async (path) => {
    const source = await fs.readFile(path);
    return { path, source, service: serviceIdentity(source) };
  }));
}

function serviceIdentity(source: string): string | undefined {
  return source.match(/export const \w+Name\s*=\s*['"]([^'"]+)['"]/i)?.[1];
}

function selectionRemedy(candidates: readonly BindingCandidate[]): string {
  const services = [
    ...new Set(candidates.flatMap((candidate) => candidate.service ? [candidate.service] : [])),
  ].sort();
  const available = services.length ? services.join(', ') : '(none recognized)';
  return ` Available services: ${available}. Use --client <service> to select one.`;
}

function bindingError(reason: string, candidates: readonly string[], remedy = ''): never {
  const detail = candidates.length ? ` Candidates: ${candidates.join(', ')}.` : '';
  throw new Error(
    `Cannot scaffold a data-bound island: ${reason}.${detail}${remedy} Exactly one conventional generated client is required. Prerequisite: ${PREREQUISITE}.`,
  );
}
