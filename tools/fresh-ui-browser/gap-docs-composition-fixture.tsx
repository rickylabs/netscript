import { useState } from 'preact/hooks';
import { Hero } from '../../packages/fresh-ui/registry/components/ui/hero.tsx';
import { RuledGrid } from '../../packages/fresh-ui/registry/components/ui/ruled-grid.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { CodeBlock } from '../../packages/fresh-ui/registry/components/ui/code-block.tsx';
import { FilePathChip } from '../../packages/fresh-ui/registry/components/ui/file-path-chip.tsx';
import { Figure } from '../../packages/fresh-ui/registry/components/ui/figure.tsx';
import { SidebarShell } from '../../packages/fresh-ui/registry/components/ui/sidebar-shell.tsx';

/** Caller content is shared by both responsive layout blocks and their real Shell composition. */
export function DocsCompositionExamples(
  { embedded = false }: { embedded?: boolean },
) {
  const [actions, setActions] = useState(0);
  return (
    <div id={embedded ? 'embedded-composition' : 'docs-composition-examples'}>
      {!embedded && <h1>Docs composition examples</h1>}
      <Button type='button' id='before-composition'>Before composition</Button>
      <div id='geometry-host' style={{ inlineSize: '100%', minInlineSize: 0 }}>
        {(['ruled', 'feature'] as const).flatMap((variant) =>
          (['2', '3', '4'] as const).map((columns) => (
            <RuledGrid
              key={variant + columns}
              id={'grid-' + variant + '-' + columns}
              variant={variant}
              columns={columns}
              style={{ marginBlock: 32 }}
            >
              {Array.from(
                { length: 8 },
                (_, i) => (
                  <RuledGrid.Cell
                    key={i}
                    eyebrow={variant === 'feature' ? 'CONTRACT' : undefined}
                    icon={variant === 'ruled' ? 'CLI' : undefined}
                    title={
                      <a href={'#cell-' + i}>
                        The contract is the spine {i + 1}
                      </a>
                    }
                    action={
                      <Button
                        type='button'
                        onClick={() => setActions((n) => n + 1)}
                      >
                        Inspect {i + 1}
                      </Button>
                    }
                  >
                    One public boundary carries documentation and native controls through the stack.
                    {i === 7 && 'long_unbroken_contract_identifier_'.repeat(6)}
                  </RuledGrid.Cell>
                ),
              )}
            </RuledGrid>
          ))
        )}
        {(['ruled', 'feature'] as const).flatMap((variant) =>
          (['2', '3', '4'] as const).map((columns) => (
            <RuledGrid
              key={'reference-' + variant + columns}
              id={'reference-grid-' + variant + '-' + columns}
              variant={variant}
              columns={columns}
              style={{ marginBlock: 32 }}
            >
              {Array.from(
                { length: variant === 'feature' ? Number(columns) : Number(columns) * 2 },
                (_, i) => (
                  <RuledGrid.Cell
                    key={i}
                    eyebrow={variant === 'feature' ? 'CONTRACT' : undefined}
                    icon={variant === 'ruled' ? 'CLI' : undefined}
                    title={variant === 'feature' ? 'The contract is the spine' : 'CLI and scaffold'}
                    action={variant === 'feature'
                      ? <a href='#why'>How the type flows →</a>
                      : undefined}
                  >
                    {variant === 'feature'
                      ? 'One operation, one boundary for handlers, documentation and clients.'
                      : 'Create, generate and inspect a workspace.'}
                  </RuledGrid.Cell>
                ),
              )}
            </RuledGrid>
          ))
        )}
        {(['split', 'centered'] as const).map((layout) => (
          <Hero
            key={layout}
            id={'hero-' + layout}
            layout={layout}
            headingLevel='2'
            eyebrow='DENO META-FRAMEWORK'
            title='Define the public boundary once. NetScript carries it through the stack.'
            actions={
              <>
                <Button onClick={() => setActions((n) => n + 1)}>
                  Start a workspace
                </Button>
                <Button type='link' href='#why' variant='outline'>Why NetScript</Button>
              </>
            }
            aside={
              <>
                <div class='ns-eyebrow'>INSTALL THE CLI</div>
                <CodeBlock
                  filename='bash'
                  lang='Shell'
                  code='deno task start'
                />
              </>
            }
            paths={
              <>
                <FilePathChip path='components/ui/button.tsx' />
                <FilePathChip path='contracts/versions/v1/users.contract.ts' />
              </>
            }
          >
            NetScript is a meta-framework for Deno. It composes Fresh, Hono and native controls.
          </Hero>
        ))}
        {(['desktop', 'mobile'] as const).flatMap((breakpoint) =>
          (['split', 'centered'] as const).map((layout) => (
            <Hero
              key={breakpoint + layout}
              id={'hero-' + breakpoint + '-' + layout}
              breakpoint={breakpoint}
              layout={layout}
              headingLevel='3'
              title='Reference presentation'
              actions={
                <Button
                  type='button'
                  onClick={() => setActions((n) => n + 1)}
                >
                  Reference action
                </Button>
              }
              aside={
                <Figure media='diagram' caption='Caller diagram'>
                  <svg
                    role='img'
                    aria-label='Boundary diagram'
                    viewBox='0 0 100 40'
                  >
                    <path d='M1 1h98v38H1z' />
                  </svg>
                </Figure>
              }
            >
              Caller-owned content.
            </Hero>
          ))
        )}
        <Hero
          id='hero-paths-only'
          title='Owned paths'
          headingLevel='3'
          paths={<a href='#owned'>Owned file</a>}
        />
        <Hero id='hero-minimal' title='Minimal introduction' headingLevel='3' />
        <Hero
          id='hero-containment'
          title='Outer mobile presentation'
          breakpoint='mobile'
          headingLevel='3'
          aside={
            <>
              <RuledGrid id='contained-grid' variant='feature'>
                <RuledGrid.Cell title='Nested contract'>
                  Native content
                </RuledGrid.Cell>
              </RuledGrid>
              <Hero
                id='contained-desktop-hero'
                title='Independent desktop presentation'
                breakpoint='desktop'
                headingLevel='4'
              />
            </>
          }
        />
      </div>
      <output aria-label='Composition actions'>{actions}</output>
      <Button type='button' id='after-composition'>After composition</Button>
      <div id='why'>Why NetScript</div>
      <div id='owned'>Owned files</div>
      {Array.from(
        { length: 8 },
        (_, i) => <div id={'cell-' + i} key={i}>Section {i + 1}</div>,
      )}
    </div>
  );
}

/** The real docs Shell constrains both blocks to its content column beside a rail. */
export function StaticDocsCompositionShell() {
  return (
    <SidebarShell
      layout='docs'
      pathname='/docs-composition-shell'
      rail
      brand={<a href='/'>NetScript</a>}
      navigation={[{
        label: 'Docs',
        items: [{ href: '/docs-composition-shell', label: 'Composition' }],
      }]}
      railContent={
        <nav aria-label='Article contents'>
          <a href='#embedded-composition'>Composition</a>
        </nav>
      }
    >
      <h1>Real Shell composition</h1>
      <div id='composition-island'>
        <DocsCompositionExamples embedded />
      </div>
    </SidebarShell>
  );
}
