import { collections } from '../assets/figma.generated.ts';
import type { FigmaCollection } from '../domain/token-contract.ts';

/** Original value/alias/scopes/syntax snapshots used by round-trip formats. */
export function figmaCollections(): readonly FigmaCollection[] {
  return collections;
}
