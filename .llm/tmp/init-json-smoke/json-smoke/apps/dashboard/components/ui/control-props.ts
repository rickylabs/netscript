import type { JSX } from 'preact';

interface ControlPropSource {
  controlProps(overrides?: Record<string, unknown>): Record<string, unknown>;
}

interface InputControlProps {
  readonly id?: string;
  readonly name?: string;
  readonly form?: string;
  readonly type?: JSX.HTMLInputTypeAttribute;
  readonly defaultValue?: string;
  readonly defaultChecked?: boolean;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-required'?: boolean;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly pattern?: string;
  readonly step?: number | string;
  readonly multiple?: boolean;
  readonly placeholder?: string;
  readonly autocomplete?: string;
}

interface SelectControlProps {
  readonly id?: string;
  readonly name?: string;
  readonly form?: string;
  readonly defaultValue?: string;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-required'?: boolean;
  readonly required?: boolean;
  readonly multiple?: boolean;
}

interface TextareaControlProps {
  readonly id?: string;
  readonly name?: string;
  readonly form?: string;
  readonly defaultValue?: string;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-required'?: boolean;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly placeholder?: string;
  readonly rows?: number;
  readonly cols?: number;
}

/**
 * Narrow descriptor control props for the Input wrapper component.
 */
export function getInputProps(
  field: ControlPropSource,
  overrides?: JSX.InputHTMLAttributes<HTMLInputElement>,
): InputControlProps {
  const props = field.controlProps(overrides ? { ...overrides } : undefined);

  return {
    id: readString(props.id),
    name: readString(props.name),
    form: readString(props.form),
    type: readInputType(props.type),
    defaultValue: readString(props.defaultValue),
    defaultChecked: readBoolean(props.defaultChecked),
    'aria-invalid': readBoolean(props['aria-invalid']),
    'aria-describedby': readString(props['aria-describedby']),
    'aria-required': readBoolean(props['aria-required']),
    required: readBoolean(props.required),
    minLength: readNumber(props.minLength),
    maxLength: readNumber(props.maxLength),
    min: readNumberish(props.min),
    max: readNumberish(props.max),
    pattern: readString(props.pattern),
    step: readNumberish(props.step),
    multiple: readBoolean(props.multiple),
    placeholder: readString(props.placeholder),
    autocomplete: readString(props.autocomplete),
  };
}

/**
 * Narrow descriptor control props for the Select wrapper component.
 */
export function getSelectProps(
  field: ControlPropSource,
  overrides?: JSX.SelectHTMLAttributes<HTMLSelectElement>,
): SelectControlProps {
  const props = field.controlProps(overrides ? { ...overrides } : undefined);

  return {
    id: readString(props.id),
    name: readString(props.name),
    form: readString(props.form),
    defaultValue: readString(props.defaultValue),
    'aria-invalid': readBoolean(props['aria-invalid']),
    'aria-describedby': readString(props['aria-describedby']),
    'aria-required': readBoolean(props['aria-required']),
    required: readBoolean(props.required),
    multiple: readBoolean(props.multiple),
  };
}

/**
 * Narrow descriptor control props for the Textarea wrapper component.
 */
export function getTextareaProps(
  field: ControlPropSource,
  overrides?: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
): TextareaControlProps {
  const props = field.controlProps(overrides ? { ...overrides } : undefined);

  return {
    id: readString(props.id),
    name: readString(props.name),
    form: readString(props.form),
    defaultValue: readString(props.defaultValue),
    'aria-invalid': readBoolean(props['aria-invalid']),
    'aria-describedby': readString(props['aria-describedby']),
    'aria-required': readBoolean(props['aria-required']),
    required: readBoolean(props.required),
    minLength: readNumber(props.minLength),
    maxLength: readNumber(props.maxLength),
    placeholder: readString(props.placeholder),
    rows: readNumber(props.rows),
    cols: readNumber(props.cols),
  };
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readInputType(value: unknown): JSX.HTMLInputTypeAttribute | undefined {
  return typeof value === 'string' ? value as JSX.HTMLInputTypeAttribute : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function readNumberish(value: unknown): number | string | undefined {
  return typeof value === 'number' || typeof value === 'string' ? value : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
