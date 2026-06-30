import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

export type ComboboxRootElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type ComboboxInputElementProps =
  & JSX.InputHTMLAttributes<HTMLInputElement>
  & MachineDataAttributes;
export type ComboboxContentElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
export type ComboboxItemElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;

export interface UseComboboxOptions {
  id?: string;
  /** Selected value (controlled). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Open state (controlled). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Query/input text (controlled). */
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (inputValue: string) => void;
  /** Wrap highlight at the list ends. */
  loop?: boolean;
}

export interface UseComboboxReturn {
  getRootProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => ComboboxRootElementProps;
  getInputProps: (
    props?: JSX.InputHTMLAttributes<HTMLInputElement>,
  ) => ComboboxInputElementProps;
  getContentProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => ComboboxContentElementProps;
  getItemProps: (
    value: string,
    props?: JSX.HTMLAttributes<HTMLDivElement>,
  ) => ComboboxItemElementProps;
  open: boolean;
  inputValue: string;
  value: string;
  highlighted: string;
  setOpen: (open: boolean) => void;
}

/** Props for the compound combobox root component. */
export type ComboboxRootProps = UseComboboxOptions & {
  children: FreshUiChildren;
};

/** Props for the combobox input. */
export type ComboboxInputProps = JSX.InputHTMLAttributes<HTMLInputElement>;

/** Props for the combobox listbox content. */
export type ComboboxContentProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: FreshUiChildren;
};

/** Props for a combobox option. */
export type ComboboxItemProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: FreshUiChildren;
  value: string;
};

/** Props for the empty-state slot shown when no options match. */
export type ComboboxEmptyProps = JSX.HTMLAttributes<HTMLDivElement> & {
  children: FreshUiChildren;
};
