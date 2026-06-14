// arch:barrel-ok Aggregates schema adapter public contracts and implementations.
export type {
  FormSchemaAdapter,
  FormSchemaParseFailure,
  FormSchemaParseResult,
  FormSchemaParseSuccess,
} from './contract.ts';
export {
  createStandardSchemaAdapter,
  type StandardSchemaInput,
  type StandardSchemaIssue,
  type StandardSchemaOutput,
  type StandardSchemaPathSegment,
  type StandardSchemaResult,
  type StandardSchemaV1,
} from './standard.ts';
export { createZodAdapter } from './zod.ts';
