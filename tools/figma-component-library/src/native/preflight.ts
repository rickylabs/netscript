import { validateFigmaSnapshot } from '../../../../packages/fresh-ui/src/tokens/domain/figma/figma-snapshot.ts';
import type { LibraryBundle, LibraryInput, TokenBinding } from '../contract.ts';
import { serializeLibrary } from '../validate-library.ts';
import type { FigmaComponentsPort, NativeContext, NativeVariable } from './figma-port.ts';

/** Stable key shared by generation, native preflight and the exporter. */
export function bindingIdentity(binding: TokenBinding): string {
  return `${binding.collection}/${binding.variable}`;
}

/** Resolve every required native identity/mode/type before creating a single page or node. */
export async function preflightVariables(
  api: FigmaComponentsPort,
  bundle: LibraryBundle,
  sources: LibraryInput,
  context: NativeContext,
): Promise<ReadonlyMap<string, NativeVariable>> {
  context.signal.throwIfAborted();
  if (context.provenance !== 'fixture' && context.provenance !== 'figma-editor') {
    throw new Error('Invalid native provenance');
  }
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(context.fileKey)) {
    throw new Error('Missing or invalid Figma file key');
  }
  if (api.fileKey && api.fileKey !== context.fileKey) throw new Error('Figma file key mismatch');
  const [collections, variables] = await Promise.all([
    api.variables.getLocalVariableCollectionsAsync(),
    api.variables.getLocalVariablesAsync(),
  ]);
  context.signal.throwIfAborted();
  const expected = validateFigmaSnapshot(sources.collections);
  const result = new Map<string, NativeVariable>();
  const bindings = bundle.components.flatMap((c) => c.bindings);
  for (const binding of bindings) {
    const key = bindingIdentity(binding);
    if (result.has(key)) continue;
    const matches = collections.filter((c) => c.name === binding.collection);
    if (matches.length !== 1) {
      throw new Error(`Missing or ambiguous native collection: ${binding.collection}`);
    }
    const collection = matches[0];
    const modes = expected.find((c) => c.collection === binding.collection)?.modes;
    if (serializeLibrary(collection.modes.map((m) => m.name)) !== serializeLibrary(modes)) {
      throw new Error(`Native mode mismatch: ${binding.collection}`);
    }
    const entries = variables.filter((v) =>
      v.variableCollectionId === collection.id && v.name === binding.variable
    );
    if (entries.length !== 1) throw new Error(`Missing or ambiguous native token binding: ${key}`);
    const variable = entries[0];
    if (variable.resolvedType !== binding.type || variable.codeSyntax.WEB !== binding.codeSyntax) {
      throw new Error(`Native token identity/type/WEB mismatch: ${key}`);
    }
    result.set(key, variable);
  }
  return result;
}
