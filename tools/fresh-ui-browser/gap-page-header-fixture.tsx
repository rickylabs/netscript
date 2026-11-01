import { useState } from 'preact/hooks';
import { PageHeader } from '../../packages/fresh-ui/registry/components/ui/page-header.tsx';
import { Breadcrumb } from '../../packages/fresh-ui/registry/components/ui/breadcrumb.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { Tabs } from '../../packages/fresh-ui/interactive.ts';

/** Real component compositions, with application controls supplied through slots. */
export function PageHeaders() {
  const [actions, setActions] = useState(0);
  return (
    <>
      <h2>Page header examples</h2>
      {(['default', 'with-tabs', 'with-status'] as const).map((variant) => (
        <section key={variant} id={`page-header-${variant}`} aria-label={`${variant} page header`}>
          <Button type='button' data-before-header>Before header</Button>
          <Tabs.Root defaultValue='overview'>
            <PageHeader
              variant={variant}
              title='Overview'
              eyebrow='Commerce'
              description='Orders, revenue and customer activity for the last 30 days.'
              breadcrumb={
                <Breadcrumb
                  items={[{ label: 'Workspace', href: '#workspace' }, { label: 'Commerce' }]}
                />
              }
              actions={
                <>
                  <Button
                    variant='outline'
                    onClick={() =>
                      setActions((n) => n + 1)}
                  >
                    Export
                  </Button>
                  <Button
                    onClick={() =>
                      setActions((n) =>
                        n + 1
                      )}
                  >
                    Create order
                  </Button>
                </>
              }
              tabs={variant === 'with-tabs'
                ? (
                  <Tabs.List aria-label='Commerce sections'>
                    <Tabs.Trigger
                      class='ns-button'
                      data-variant='ghost'
                      data-size='sm'
                      value='overview'
                    >
                      Overview
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      class='ns-button'
                      data-variant='ghost'
                      data-size='sm'
                      value='orders'
                    >
                      Orders
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      class='ns-button'
                      data-variant='ghost'
                      data-size='sm'
                      value='archived'
                      disabled
                    >
                      Archived
                    </Tabs.Trigger>
                  </Tabs.List>
                )
                : undefined}
              status={variant === 'with-status'
                ? 'Operational · Synced 2 min ago · 3,182 orders · 30 days'
                : undefined}
            />
            {variant === 'with-tabs' && (
              <>
                <Tabs.Content value='overview'>Overview panel</Tabs.Content>
                <Tabs.Content value='orders'>Orders panel</Tabs.Content>
                <Tabs.Content value='archived'>Archived panel</Tabs.Content>
              </>
            )}
          </Tabs.Root>
          <Button type='button' data-after-header>After header</Button>
        </section>
      ))}
      <output aria-label='Page header actions'>{actions}</output>
      <section id='page-header-title-only' aria-label='Title-only page header'>
        <PageHeader title='Settings' />
      </section>
      <section id='page-header-composed' aria-label='Composed page header'>
        <PageHeader>
          <PageHeader.Layout>
            <PageHeader.Main>
              <PageHeader.Intro>
                <h1>Custom document heading</h1>
                <p>Legacy composed content</p>
              </PageHeader.Intro>
              <PageHeader.Actions>
                <Button onClick={() => setActions((n) => n + 1)}>Save custom header</Button>
              </PageHeader.Actions>
            </PageHeader.Main>
            <PageHeader.Aside>
              <PageHeader.Badges>Published</PageHeader.Badges>
            </PageHeader.Aside>
          </PageHeader.Layout>
          <PageHeader.Status>Ready</PageHeader.Status>
        </PageHeader>
      </section>
    </>
  );
}
