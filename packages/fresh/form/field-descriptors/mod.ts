// arch:barrel-ok Aggregates descriptor construction from focused field-descriptor role files.
import { cloneCollectionKeys, createCollectionDescriptor } from './collection.ts';
import { cloneConstraints, collectChildKeys } from './constraints.ts';
import {
  type CreateDescriptorOptions,
  createFieldDescriptor,
  type CreateFieldDescriptorsOptions,
  isArrayLike,
  isObjectLike,
  readObjectValue,
  toFieldErrorRecord,
} from './descriptor.ts';
import type { CollectionItem, FieldDescriptorMap, FormValues } from '../types.ts';

export function createFieldDescriptors<TValues extends FormValues>(
  options: CreateFieldDescriptorsOptions<TValues>,
): FieldDescriptorMap<TValues> {
  const constraints = cloneConstraints(options.constraints ?? {});
  const fieldErrors = toFieldErrorRecord(options.fieldErrors);
  const fields = createObjectDescriptorMap({
    formId: options.formId,
    path: '',
    value: options.values,
    initialValue: options.initialValues,
    defaultValue: options.defaultValues,
    fieldErrors,
    constraints,
    collectionKeys: cloneCollectionKeys(options.collectionKeys ?? {}),
  });

  return fields as FieldDescriptorMap<TValues>;
}

function createObjectDescriptorMap(options: CreateDescriptorOptions): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (
    const key of collectChildKeys(
      options.path,
      options.value,
      options.initialValue,
      options.defaultValue,
      options.constraints,
    )
  ) {
    const nextPath = options.path ? `${options.path}.${key}` : key;
    fields[key] = createDescriptorNode({
      ...options,
      path: nextPath,
      value: readObjectValue(options.value, key),
      initialValue: readObjectValue(options.initialValue, key),
      defaultValue: readObjectValue(options.defaultValue, key),
    });
  }

  return fields;
}

function createDescriptorNode(options: CreateDescriptorOptions): unknown {
  if (isArrayLike(options.value, options.initialValue, options.defaultValue)) {
    return createCollectionDescriptor(options, {
      createFieldDescriptor,
      createCollectionItemFields,
    });
  }

  const descriptor = createFieldDescriptor(options);

  if (isObjectLike(options.value, options.initialValue, options.defaultValue)) {
    return {
      ...createObjectDescriptorMap(options),
      ...descriptor,
    };
  }

  return descriptor;
}

function createCollectionItemFields(
  options: CreateDescriptorOptions,
): CollectionItem<unknown>['fields'] {
  const fields = isObjectLike(options.value, options.initialValue, options.defaultValue)
    ? createObjectDescriptorMap(options)
    : createFieldDescriptor(options);

  return fields as CollectionItem<unknown>['fields'];
}
