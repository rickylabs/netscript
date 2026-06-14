/** Generic constraint for form value objects. */
export type FormValues = object;

/** Mode used by page-owned create/edit forms in the playground consumer. */
export type FormPageMode = 'create' | 'edit';

/** Dot-path name for a field in nested form values. */
export type FormFieldPath = string;

/** Stable collection item keys by collection field path. */
export type CollectionKeyMap = Record<string, string>;

/** Ordered validation messages for a field or form. */
export type FormErrorMessages = readonly string[];

/** Canonical field and form error map for submitted values. */
export type FormFieldErrors<TValues extends FormValues> =
  & Partial<Record<Extract<keyof TValues, string>, string[]>>
  & {
    /** Form-level validation errors not tied to a single field. */
    _form: string[];
  };

/** HTML constraint attributes derived from a schema field. */
export interface FieldConstraints {
  /** Whether the field is required. */
  readonly required?: boolean;
  /** Minimum string length. */
  readonly minLength?: number;
  /** Maximum string length. */
  readonly maxLength?: number;
  /** Minimum collection item count. */
  readonly minItems?: number;
  /** Maximum collection item count. */
  readonly maxItems?: number;
  /** Minimum numeric or date-like value. */
  readonly min?: number | string;
  /** Maximum numeric or date-like value. */
  readonly max?: number | string;
  /** HTML pattern constraint. */
  readonly pattern?: string;
  /** HTML step constraint. */
  readonly step?: number | string;
  /** Whether the control accepts multiple values. */
  readonly multiple?: boolean;
}
