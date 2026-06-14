import { parseFormPath } from '../validation/pipeline.ts';
import type { FieldConstraints } from '../runtime/types.ts';
import { isRecord } from './descriptor.ts';

export function collectChildKeys(
  path: string,
  value: unknown,
  initialValue: unknown,
  defaultValue: unknown,
  constraints: Record<string, FieldConstraints>,
): string[] {
  const keys = new Set<string>();

  for (const source of [value, initialValue, defaultValue]) {
    if (isRecord(source)) {
      for (const key of Object.keys(source)) {
        if (key === '__key') {
          continue;
        }
        keys.add(key);
      }
    }
  }

  const normalizedPath = normalizeConstraintPath(path);
  const pathSegments = normalizedPath ? parseFormPath(normalizedPath) : [];

  for (const constraintPath of Object.keys(constraints)) {
    const constraintSegments = parseFormPath(normalizeConstraintPath(constraintPath));
    if (!hasSegmentPrefix(constraintSegments, pathSegments)) {
      continue;
    }

    const nextSegment = constraintSegments[pathSegments.length];
    if (typeof nextSegment === 'string') {
      keys.add(nextSegment);
    }
  }

  return [...keys].sort();
}

export function readConstraints(
  path: string,
  constraints: Record<string, FieldConstraints>,
): FieldConstraints {
  const direct = constraints[path];
  if (direct) {
    return direct;
  }

  const normalized = constraints[normalizeConstraintPath(path)];
  return normalized ?? {};
}

export function cloneConstraints(
  constraints: Record<string, FieldConstraints>,
): Record<string, FieldConstraints> {
  return Object.fromEntries(
    Object.entries(constraints).map(([key, value]) => [key, { ...value }]),
  );
}

function normalizeConstraintPath(path: string): string {
  return path.replace(/\[\d+\]/g, '[0]');
}

function hasSegmentPrefix(
  segments: Array<number | string>,
  prefix: Array<number | string>,
): boolean {
  return prefix.every((segment, index) => segment === segments[index]);
}
