import type { JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';
import type { FreshUiChildren } from '../_internal/public-props.ts';

export type AccordionRootElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type AccordionItemElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type AccordionItemTriggerElementProps =
  & JSX.HTMLAttributes<HTMLElement>
  & MachineDataAttributes;
export type AccordionItemIndicatorElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
  & MachineDataAttributes;
export type AccordionItemContentElementProps =
  & JSX.HTMLAttributes<HTMLDivElement>
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

export interface UseAccordionOptions {
  collapsible?: boolean;
  defaultValue?: string[];
  disabled?: boolean;
  id?: string;
  multiple?: boolean;
  onFocusChange?: (details: { value: string | null }) => void;
  onValueChange?: (details: { value: string[] }) => void;
  orientation?: 'horizontal' | 'vertical';
  value?: string[];
}

export interface UseAccordionReturn {
  focusedValue: string | null;
  getItemContentProps: (
    item: AccordionItemOptions,
    props?: JSX.HTMLAttributes<HTMLDivElement>,
  ) => AccordionItemContentElementProps;
  getItemIndicatorProps: (
    item: AccordionItemOptions,
    props?: JSX.HTMLAttributes<HTMLDivElement>,
  ) => AccordionItemIndicatorElementProps;
  getItemProps: (
    item: AccordionItemOptions,
    props?: JSX.HTMLAttributes<HTMLDivElement>,
  ) => AccordionItemElementProps;
  getItemState: (item: AccordionItemOptions) => AccordionItemState;
  getItemTriggerProps: (
    item: AccordionItemOptions,
    props?: JSX.HTMLAttributes<HTMLElement>,
  ) => AccordionItemTriggerElementProps;
  getRootProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => AccordionRootElementProps;
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
