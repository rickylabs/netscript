// arch:barrel-ok Aggregates the schema adapter public contract and Zod adapter implementation.
export type {
  FormSchemaAdapter,
  FormSchemaParseFailure,
  FormSchemaParseResult,
  FormSchemaParseSuccess,
} from './contract.ts';
export { createZodAdapter } from './zod.ts';
