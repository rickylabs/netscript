import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

interface FilterFormProps {
  children: Renderable;
  class?: string;
  action?: string;
  method?: string;
  id?: string;
  ['f-client-nav']?: boolean;
}

interface FilterFormSectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  children: Renderable;
  class?: string;
}

type FilterFormComponent = ((props: FilterFormProps) => VNode) & {
  Body: (props: FilterFormSectionProps) => VNode;
  Actions: (props: FilterFormSectionProps) => VNode;
};

function FilterFormRoot({ children, class: className, ...props }: FilterFormProps): VNode {
  return <form {...props} class={cn('ns-card', className)}>{children}</form>;
}

function FilterFormBody({ children, class: className, ...props }: FilterFormSectionProps): VNode {
  return (
    <div {...props} class={cn('ns-card__body ns-filter-form__body', className)}>{children}</div>
  );
}

function FilterFormActions(
  { children, class: className, ...props }: FilterFormSectionProps,
): VNode {
  return (
    <div {...props} class={cn('ns-filter-form__actions', className)}>
      {children}
    </div>
  );
}

/**
 * Card-backed filter form with body and action regions.
 */
export const FilterForm: FilterFormComponent = Object.assign(FilterFormRoot, {
  Body: FilterFormBody,
  Actions: FilterFormActions,
});
