import type {
  CollectionKeyInputProps,
  ControlProps,
  DescriptionProps,
  ErrorProps,
  IntentButtonProps,
  LabelProps,
} from './prop-types.ts';
import type { FieldConstraints, FormFieldPath } from './value-types.ts';

/** Descriptor for one form field and its generated props. */
export interface FieldDescriptor<TValue = unknown> {
  /** Submitted field name. */
  readonly name: FormFieldPath;
  /** DOM id for the field control. */
  readonly id: string;
  /** Stable render key for repeated fields. */
  readonly key: string;
  /** Owning form id. */
  readonly formId: string;
  /** Current field value. */
  readonly value: TValue | undefined;
  /** Initial field value. */
  readonly initialValue: TValue | undefined;
  /** Default field value. */
  readonly defaultValue: TValue | undefined;
  /** Validation errors for this field. */
  readonly errors: readonly string[];
  /** First validation error for this field. */
  readonly error: string | undefined;
  /** Whether the field is invalid. */
  readonly invalid: boolean;
  /** Whether the field is valid. */
  readonly valid: boolean;
  /** Whether the field is required. */
  readonly required: boolean;
  /** Whether the current value differs from the initial value. */
  readonly dirty: boolean;
  /** HTML constraints derived from schema metadata. */
  readonly constraints: FieldConstraints;
  /** DOM id for the error element. */
  readonly errorId: string;
  /** DOM id for the description element. */
  readonly descriptionId: string;
  /** Build control props with optional overrides. */
  controlProps<TOverrides extends Record<string, unknown> = Record<string, never>>(
    overrides?: TOverrides,
  ): ControlProps & TOverrides;
  /** Props for the field label. */
  readonly labelProps: LabelProps;
  /** Props for the field error element. */
  readonly errorProps: ErrorProps;
  /** Props for the field description element. */
  readonly descriptionProps: DescriptionProps;
}

/** Descriptor for one item in a collection field. */
export interface CollectionItem<TItem> {
  /** Stable item key. */
  readonly key: string;
  /** Current item index. */
  readonly index: number;
  /** Props for the hidden item key input. */
  readonly keyInputProps: CollectionKeyInputProps;
  /** Field descriptors for the collection item. */
  readonly fields: TItem extends object ? FieldDescriptorMap<TItem>
    : FieldDescriptor<TItem>;
}

/** Descriptor for a collection field and its item intent buttons. */
export interface CollectionDescriptor<TItem> {
  /** Collection field name. */
  readonly name: string;
  /** Ordered collection items. */
  readonly list: ReadonlyArray<CollectionItem<TItem>>;
  /** Current collection length. */
  readonly length: number;
  /** Collection-level errors. */
  readonly errors: readonly string[];
  /** First collection-level error. */
  readonly error: string | undefined;
  /** Minimum item count constraint. */
  readonly minItems?: number;
  /** Maximum item count constraint. */
  readonly maxItems?: number;
  /** DOM id for the collection error element. */
  readonly errorId: string;
  /** DOM id for the collection description element. */
  readonly descriptionId: string;
  /** Props for the collection error element. */
  readonly errorProps: ErrorProps;
  /** Props for the collection description element. */
  readonly descriptionProps: DescriptionProps;
  /** Build props for an add-item intent button. */
  addButtonProps(opts?: { defaultValue?: Partial<TItem> }): IntentButtonProps;
  /** Build props for a remove-item intent button. */
  removeButtonProps(index: number): IntentButtonProps;
  /** Build props for a reorder-item intent button. */
  reorderButtonProps(from: number, to: number): IntentButtonProps;
  /** Build props for a duplicate-item intent button. */
  duplicateButtonProps(index: number): IntentButtonProps;
}

/** Field descriptors keyed by form value path. */
export type FieldDescriptorMap<T> = {
  [K in keyof T & string]: T[K] extends Array<infer U>
    ? CollectionDescriptor<U> & FieldDescriptor<T[K]>
    : T[K] extends object ? FieldDescriptorMap<T[K]> & FieldDescriptor<T[K]>
    : FieldDescriptor<T[K]>;
};
