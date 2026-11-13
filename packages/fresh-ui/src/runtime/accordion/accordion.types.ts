import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

/** DOM attributes returned for the accordion root part. */
export type AccordionRootElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the accordion item part. */
export type AccordionItemElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the accordion item trigger part. */
export type AccordionItemTriggerElementProps =
  & preact.JSX.HTMLAttributes<HTMLElement>
  & MachineDataAttributes;
/** DOM attributes returned for the accordion item indicator part. */
export type AccordionItemIndicatorElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
/** DOM attributes returned for the accordion item content part. */
export type AccordionItemContentElementProps =
  & preact.JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;

export type AccordionOrientation = 'horizontal' | 'vertical';

export interface AccordionItemOptions {
  disabled?: boolean;
  value: string;
}

export interface AccordionItemState {
  disabled: boolean;
  expanded: boolean;
  focused: boolean;
}

export interface AccordionValueChangeDetails {
  value: string[];
}

export interface AccordionFocusChangeDetails {
  value: string | null;
}

/** Controlled and initial state for the accordion hook. */
export interface UseAccordionOptions {
  /** Whether the final expanded accordion item may be collapsed. */
  collapsible?: boolean;
  /** Initial selection when value is uncontrolled. */
  defaultValue?: string[];
  /** Disables interaction for this component. */
  disabled?: boolean;
  /** Stable base identifier for accessible part relationships. */
  id?: string;
  /** Whether more than one accordion item may be expanded. */
  multiple?: boolean;
  /** Receives the newly focused accordion item value. */
  onFocusChange?: (details: { value: string | null }) => void;
  /** Receives selection changes requested by user interaction. */
  onValueChange?: (details: { value: string[] }) => void;
  /** Sets the axis used for layout and keyboard navigation. */
  orientation?: 'horizontal' | 'vertical';
  /** Controlled selected item value or values. */
  value?: string[];
}

export interface UseAccordionReturn {
  focusedValue: string | null;
  getItemContentProps: (
    item: AccordionItemOptions,
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => AccordionItemContentElementProps;
  getItemIndicatorProps: (
    item: AccordionItemOptions,
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => AccordionItemIndicatorElementProps;
  getItemProps: (
    item: AccordionItemOptions,
    props?: preact.JSX.HTMLAttributes<HTMLDivElement>,
  ) => AccordionItemElementProps;
  getItemState: (item: AccordionItemOptions) => AccordionItemState;
  getItemTriggerProps: (
    item: AccordionItemOptions,
    props?: preact.JSX.HTMLAttributes<HTMLElement>,
  ) => AccordionItemTriggerElementProps;
  getRootProps: (props?: preact.JSX.HTMLAttributes<HTMLDivElement>) => AccordionRootElementProps;
  orientation: AccordionOrientation;
  value: string[];
}

/** Props for the compound accordion root component. */
export type AccordionRootProps = UseAccordionOptions & {
  children?: FreshUiChildren;
};

/** Props for an accordion item component. */
export type AccordionItemProps = AccordionItemElementProps & {
  children: FreshUiChildren;
  disabled?: boolean;
  value: string;
};

/** Props for an accordion item trigger component. */
export type AccordionItemTriggerProps = AccordionItemTriggerElementProps & {
  children: FreshUiChildren;
};

/** Props for an accordion item indicator component. */
export type AccordionItemIndicatorProps = AccordionItemIndicatorElementProps & {
  children?: FreshUiChildren;
};

/** Props for an accordion item content component. */
export type AccordionItemContentProps = AccordionItemContentElementProps & {
  children?: FreshUiChildren;
};
