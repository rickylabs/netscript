import { INSPECTION_STATUS } from '../domain/constants.ts';

/** Finite status values emitted by shared inspection reports. */
export type InspectionStatus = 'ok' | 'warning' | 'error';

/** Values accepted by `inspectShared`. */
export type SharedInspectionTarget = unknown;

/** JSON-stable report emitted by `inspectShared`. */
export type InspectionReport = Readonly<{
  packageName: '@netscript/shared';
  status: InspectionStatus;
  summary: string;
  details: Readonly<Record<string, string | number | boolean>>;
}>;

/** Builds a JSON-stable inspection report for a shared primitive. */
export function inspectShared(target: SharedInspectionTarget): InspectionReport {
  const targetType = target === null ? 'null' : typeof target;

  return Object.freeze({
    packageName: '@netscript/shared' as const,
    status: INSPECTION_STATUS.ok,
    summary: 'Shared primitive is inspectable.',
    details: Object.freeze({
      targetType,
      isObject: targetType === 'object' || targetType === 'function',
    }),
  });
}
