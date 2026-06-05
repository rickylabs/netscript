/**
 * Form pipeline utilities for `@netscript/fresh`.
 *
 * This module owns the low-level request parsing and normalization primitives
 * used by the framework forms pipeline:
 * - FormData → nested object parsing
 * - dotted/bracket path assignment
 * - empty-string normalization
 *
 * It is intentionally framework-agnostic so higher-level form runtime code can
 * build on top of it without coupling parsing to builder or UI concerns.
 *
 * @module
 */

import { CSRF_FIELD_NAME } from './csrf.ts';
import { extractCollectionKeys, omitCollectionKeyFields } from './collection-keys.ts';
import { SUBMISSION_ID_FIELD_NAME } from './idempotency.ts';
import { INTENT_FIELD_NAME, parseFormIntent } from './intent.ts';
import type { FormSchemaAdapter, FormSchemaParseResult } from './schema-adapter.ts';
import type { CollectionKeyMap, FormIntent, FormValues } from './types.ts';

/**
 * Internal recursive value shape produced while parsing `FormData`.
 */
export type FormRawValue =
  | string
  | undefined
  | FormRawValue[]
  | { [key: string]: FormRawValue };

/**
 * Internal object record used during assignment.
 */
export type FormRawRecord = Record<string, FormRawValue>;

/**
 * Normalized parse result for a submitted native form.
 *
 * This preserves the non-schema framework fields the higher-level runtime needs
 * while ensuring schema validation runs only against consumer-defined values.
 */
export interface ParsedFormSubmission<TValues extends FormValues, TOutput> {
  /** Raw submitted values after framework control fields are removed. */
  readonly rawValues: Record<string, unknown>;
  /** Normalized consumer values ready for validation and mutation handling. */
  readonly values: Partial<TValues>;
  /** Schema-adapter validation result for the normalized values. */
  readonly result: FormSchemaParseResult<TValues, TOutput>;
  /** Parsed submit intent, if one was provided. */
  readonly intent: FormIntent | null;
  /** Stable collection-item keys submitted with the form. */
  readonly collectionKeys: CollectionKeyMap;
  /** Submitted idempotency key, if one was provided. */
  readonly submissionId?: string;
  /** Submitted CSRF token, if one was provided. */
  readonly csrfToken?: string;
}

/**
 * Return true when a value is a non-array object record.
 */
export function isFormRawRecord(value: FormRawValue): value is FormRawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse a form field path into string and numeric segments.
 *
 * Supported examples:
 * - `name` → `["name"]`
 * - `shipping.city` → `["shipping", "city"]`
 * - `items[0].productId` → `["items", 0, "productId"]`
 * - `items[1].quantity` → `["items", 1, "quantity"]`
 */
export function parseFormPath(key: string): Array<number | string> {
  const segments: Array<number | string> = [];

  for (const match of key.matchAll(/([^[.\]]+)|\[(\d+)\]/g)) {
    if (match[1]) {
      segments.push(match[1]);
      continue;
    }

    if (match[2]) {
      segments.push(Number.parseInt(match[2], 10));
    }
  }

  return segments.length > 0 ? segments : [key];
}

/**
 * Assign a single form value to a nested target object using dotted/bracket path syntax.
 *
 * Invalid transitions are ignored intentionally. For example, trying to write an array
 * index into a non-array branch will no-op rather than throw.
 */
export function assignFormPathValue(
  target: FormRawRecord,
  key: string,
  value: string | undefined,
): void {
  const path = parseFormPath(key);
  let current: FormRawRecord | FormRawValue[] = target;

  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index];
    const isLast = index === path.length - 1;
    const nextSegment = path[index + 1];

    if (typeof segment === 'number') {
      if (!Array.isArray(current)) {
        return;
      }

      if (isLast) {
        current[segment] = value;
        return;
      }

      const nextValue = current[segment];
      if (
        nextValue === undefined ||
        (typeof nextSegment === 'number' && !Array.isArray(nextValue)) ||
        (typeof nextSegment === 'string' && !isFormRawRecord(nextValue))
      ) {
        current[segment] = typeof nextSegment === 'number' ? [] : {};
      }

      current = current[segment] as FormRawRecord | FormRawValue[];
      continue;
    }

    if (Array.isArray(current)) {
      return;
    }

    if (isLast) {
      current[segment] = value;
      return;
    }

    const nextValue = current[segment];
    if (
      nextValue === undefined ||
      (typeof nextSegment === 'number' && !Array.isArray(nextValue)) ||
      (typeof nextSegment === 'string' && !isFormRawRecord(nextValue))
    ) {
      current[segment] = typeof nextSegment === 'number' ? [] : {};
    }

    current = current[segment] as FormRawRecord | FormRawValue[];
  }
}

/**
 * Normalize a recursively parsed form value tree.
 *
 * Current normalization rules:
 * - empty strings become `undefined`
 * - arrays are normalized recursively
 * - objects are normalized recursively
 */
export function normalizeFormValue(value: FormRawValue): FormRawValue {
  if (typeof value === 'string') {
    return value === '' ? undefined : value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeFormValue(entry));
  }

  if (isFormRawRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeFormValue(entry)]),
    );
  }

  return value;
}

/**
 * Parse a `FormData` instance into a nested object.
 *
 * Handles dotted paths and bracket indices:
 * - `name` → `{ name: "value" }`
 * - `items[0].productId` → `{ items: [{ productId: "value" }] }`
 *
 * File inputs are represented by their file name, matching the existing
 * framework behavior.
 */
export function formDataToRawValues(formData: FormData): Record<string, unknown> {
  const values: FormRawRecord = {};

  for (const [key, value] of formData.entries()) {
    assignFormPathValue(values, key, typeof value === 'string' ? value : value.name);
  }

  return values;
}

/**
 * Normalize raw form values by converting empty strings to `undefined`.
 *
 * Recursively processes nested objects and arrays, then narrows the result to the
 * requested form shape.
 */
export function normalizeFormValues<TValues extends FormValues>(
  rawValues: Record<string, unknown>,
): Partial<TValues> {
  return normalizeFormValue(rawValues as FormRawValue) as Partial<TValues>;
}

/**
 * Parse and validate a native form submission in one step.
 *
 * The returned `rawValues` and `values` omit framework-reserved control fields
 * like CSRF and intent metadata so downstream mutation handlers only see the
 * consumer-defined form shape.
 */
export async function parseFormSubmission<TValues extends FormValues, TOutput>(
  formData: FormData,
  adapter: FormSchemaAdapter<TValues, TOutput>,
): Promise<ParsedFormSubmission<TValues, TOutput>> {
  const rawValues = formDataToRawValues(formData);
  const intent = parseFormIntent(rawValues);
  const collectionKeys = extractCollectionKeys(rawValues);
  const submissionId = readFrameworkField(rawValues, SUBMISSION_ID_FIELD_NAME);
  const csrfToken = readFrameworkField(rawValues, CSRF_FIELD_NAME);
  const sanitizedRawValues = omitCollectionKeyFields(omitFrameworkFields(rawValues));
  const values = normalizeFormValues<TValues>(sanitizedRawValues);

  return {
    rawValues: sanitizedRawValues,
    values,
    result: await adapter.safeParse(values),
    intent,
    collectionKeys,
    submissionId,
    csrfToken,
  };
}

function readFrameworkField(
  rawValues: Record<string, unknown>,
  fieldName: string,
): string | undefined {
  const value = rawValues[fieldName];
  return typeof value === 'string' ? value : undefined;
}

function omitFrameworkFields(rawValues: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...rawValues };
  delete sanitized[INTENT_FIELD_NAME];
  delete sanitized[CSRF_FIELD_NAME];
  delete sanitized[SUBMISSION_ID_FIELD_NAME];
  return sanitized;
}
