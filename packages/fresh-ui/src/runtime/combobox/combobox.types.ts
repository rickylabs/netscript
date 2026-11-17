import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

/** DOM attributes returned for the combobox root part. */
export type ComboboxRootElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the combobox input part. */
export type ComboboxInputElementProps =
  & preact.JSX.InputHTMLAttributes<HTMLInputElement>
  & MachineDataAttributes;
/** DOM attributes returned for the combobox content part. */
export type ComboboxContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the combobox item part. */
export type ComboboxItemElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;

/** Controlled and initial state for the combobox hook. */
export interface UseComboboxOptions {
  /** Stable base identifier for accessible part relationships. */
  id?: string;
  /** Selected value (controlled). */
  value?: string;
  /** Initial selection when value is uncontrolled. */
  defaultValue?: string;
  /** Receives the selected option value. */
  onValueChange?: (value: string) => void;
  /** Open state (controlled). */
  open?: boolean;
  /** Initial open state when open is uncontrolled. */
  defaultOpen?: boolean;
  /** Receives controlled or uncontrolled open-state transitions. */
  onOpenChange?: (open: boolean) => void;
  /** Query/input text (controlled). */
  inputValue?: string;
  /** Initial query text when inputValue is uncontrolled. */
  defaultInputValue?: string;
  /** Receives changes to the query text. */
  onInputValueChange?: (inputValue: string) => void;
  /** Wrap highlight at the list ends. */
  loop?: boolean;
}

/** State and prop getters returned by the combobox hook. */
export interface UseComboboxReturn {
  /** Builds accessible attributes for the combobox root. */
  getRootProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => ComboboxRootElementProps;
  /** Builds input attributes and query/navigation handlers. */
  getInputProps: (
    props?: preact.JSX.InputHTMLAttributes<HTMLInputElement>,
  ) => ComboboxInputElementProps;
  /** Builds accessible attributes for the listbox. */
  getContentProps: (
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => ComboboxContentElementProps;
  /** Builds attributes and selection handlers for one option. */
  getItemProps: (
    value: string,
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => ComboboxItemElementProps;
  /** Controlled open state. */
  open: boolean;
  /** Controlled combobox query text. */
  inputValue: string;
  /** Controlled selected item value. */
  value: string;
  /** Value of the currently highlighted option. */
  highlighted: string;
  /** Requests an open-state transition. */
  setOpen: (open: boolean) => void;
}

/** Props for the compound combobox root component. */
export type ComboboxRootProps = UseComboboxOptions & {
  children: FreshUiChildren;
};

/** Props for the combobox input. */
export type ComboboxInputProps = preact.JSX.InputHTMLAttributes<HTMLInputElement>;

/** Props for the combobox listbox content. */
export type ComboboxContentProps = preact.JSX.HTMLAttributes<HTMLDivElement> & {
  children: FreshUiChildren;
};

/** Props for a combobox option. */
export type ComboboxItemProps = preact.JSX.HTMLAttributes<HTMLDivElement> & {
  children: FreshUiChildren;
  value: string;
};

/** Props for the empty-state slot shown when no options match. */
export type ComboboxEmptyProps = preact.JSX.HTMLAttributes<HTMLDivElement> & {
  children: FreshUiChildren;
};
