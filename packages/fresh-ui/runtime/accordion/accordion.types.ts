import type { ComponentChildren, JSX } from 'preact';
import type { MachineDataAttributes } from '../_internal/dom-types.ts';

export type AccordionRootElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type AccordionItemElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type AccordionItemTriggerElementProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & MachineDataAttributes;
export type AccordionItemIndicatorElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;
export type AccordionItemContentElementProps = JSX.HTMLAttributes<HTMLDivElement> & MachineDataAttributes;

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
  onFocusChange?: (details: AccordionFocusChangeDetails) => void;
  onValueChange?: (details: AccordionValueChangeDetails) => void;
  orientation?: AccordionOrientation;
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
  getItemProps: (item: AccordionItemOptions, props?: JSX.HTMLAttributes<HTMLDivElement>) => AccordionItemElementProps;
  getItemState: (item: AccordionItemOptions) => AccordionItemState;
  getItemTriggerProps: (
    item: AccordionItemOptions,
    props?: JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => AccordionItemTriggerElementProps;
  getRootProps: (props?: JSX.HTMLAttributes<HTMLDivElement>) => AccordionRootElementProps;
  orientation: AccordionOrientation;
  value: string[];
}

export interface AccordionRootProps extends UseAccordionOptions {
  children: ComponentChildren;
}

export interface AccordionItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children: ComponentChildren;
  disabled?: boolean;
  value: string;
}

export interface AccordionItemTriggerProps extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children: ComponentChildren;
  type?: 'button' | 'submit' | 'reset';
}

export interface AccordionItemIndicatorProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}

export interface AccordionItemContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  children?: ComponentChildren;
}