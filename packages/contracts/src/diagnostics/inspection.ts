import { INSPECTION_STATUS } from '../domain/constants.ts';

/** Finite status values emitted by contract inspection reports. */
export type InspectionStatus = 'ok' | 'warning' | 'error';

/** Values accepted by `inspectContracts`. */
export type ContractsInspectionTarget = unknown;

/** JSON-stable report emitted by `inspectContracts`. */
export type InspectionReport = Readonly<{
  packageName: '@netscript/contracts';
  status: InspectionStatus;
  summary: string;
  details: Readonly<Record<string, string | number | boolean>>;
}>;

/** Builds a JSON-stable inspection report for a contract primitive. */
export function inspectContracts(target: ContractsInspectionTarget): InspectionReport {
  const targetType = target === null ? 'null' : typeof target;

  return Object.freeze({
    packageName: '@netscript/contracts' as const,
    status: INSPECTION_STATUS.ok,
    summary: 'Contract primitive is inspectable.',
    details: Object.freeze({
      targetType,
      isObject: targetType === 'object' || targetType === 'function',
    }),
  });
}
