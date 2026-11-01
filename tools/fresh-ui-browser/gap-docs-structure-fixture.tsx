import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { useState } from 'preact/hooks';
import { FilePathChip } from '../../packages/fresh-ui/registry/components/ui/file-path-chip.tsx';
import { AttributeChip } from '../../packages/fresh-ui/registry/components/ui/attribute-chip.tsx';
import {
  FileTree,
  type FileTreeEntry,
} from '../../packages/fresh-ui/registry/components/ui/file-tree.tsx';
import { Figure } from '../../packages/fresh-ui/registry/components/ui/figure.tsx';

const initialPath = 'packages/fresh-ui/hello <world> "quoted".tsx';
const image = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360"><title>Documentation architecture</title><path fill="currentColor" d="M40 40h640v280H40z"/></svg>',
);
const ownerships = ['none', 'owned', 'generated', 'guidance'] as const;
const items: readonly FileTreeEntry[] = [
  ...(['folder', 'file'] as const).flatMap((type) =>
    ownerships.map((ownership): FileTreeEntry => ({
      id: type + ownership,
      type,
      ownership,
      name: type + '-' + ownership,
      comment: ownership === 'owned' ? '# edit this configuration' : undefined,
    }))
  ),
  {
    id: 'source',
    type: 'folder',
    name: 'src',
    ownership: 'owned',
    tag: '[owned config]',
    children: [{
      id: 'page',
      type: 'file',
      name: <a href='#source-details'>Read source</a>,
      comment: <a href='#annotation-details'>Read annotation</a>,
      ownership: 'generated',
      tag: '[generated history]',
    }],
  },
  {
    id: 'long',
    type: 'file',
    name: 'long-documentation-filename-'.repeat(8) + '.tsx',
    comment: '# ' + 'annotation-'.repeat(12),
    ownership: 'guidance',
    tag: '[CLI-managed]',
  },
];

function PathExamples() {
  const [path, setPath] = useState(initialPath);
  const [copy, setCopy] = useState(true);
  const [mounted, setMounted] = useState(true);
  return (
    <section id='path-native' aria-label='Copyable path'>
      <Button type='button' data-before-path>Before path</Button>
      {mounted && <FilePathChip path={path} copy={copy} />}
      <Button type='button' data-after-path>After path</Button>
      <Button
        type='button'
        onClick={() => setPath(path === initialPath ? 'src/next.tsx' : initialPath)}
      >
        Change path
      </Button>
      <Button type='button' onClick={() => setCopy(!copy)}>Toggle copy</Button>
      <Button type='button' onClick={() => setMounted(!mounted)}>Toggle path mount</Button>
      <FilePathChip path='src/read-only.tsx' copy={false} />
    </section>
  );
}

/** Actual copied sources with caller-owned media and native child links/controls. */
export function DocsStructureExamples() {
  const [actions, setActions] = useState(0);
  return (
    <main>
      <h1>Docs structure examples</h1>
      <PathExamples />
      <section id='attribute-variants' aria-label='Attribute examples'>
        <Button type='button' data-before-attributes>Before attributes</Button>
        <AttributeChip name='data-variant' value='outline' size='md' />
        <AttributeChip name='data-variant' value='outline' size='sm' />
        {[0, false, null, '', '"<script>alert(1)</script>\n'].map((value, i) => (
          <AttributeChip key={i} name={'data-example-' + i} value={value} />
        ))}
        <AttributeChip name={'long-attribute-'.repeat(8)} value={'unbroken-value-'.repeat(15)} />
        <Button type='button' data-after-attributes>After attributes</Button>
      </section>
      <section id='tree-variants' aria-label='File lists'>
        <Button type='button' data-before-tree>Before file tree</Button>
        <FileTree label='Scaffold files' items={items} />
        <Button type='button' data-after-tree>After file tree</Button>
        <FileTree
          label='Hidden annotations'
          items={items.slice(0, 8)}
          tag={false}
          typeLabels={{ folder: 'Dossier', file: 'Fichier' }}
        />
      </section>
      <section id='figure-variants' aria-label='Figure examples'>
        <Button type='button' data-before-figures>Before figures</Button>
        {(['prose', 'wide'] as const).flatMap((width) =>
          (['image', 'diagram'] as const).map((media) => (
            <Figure
              key={width + media}
              width={width}
              media={media}
              caption={
                <>
                  <span>{width + ' ' + media + ' architecture'}</span>{' '}
                  <a href={'#figure-' + width + media}>Read diagram</a>
                  <Button type='button' onClick={() => setActions((n) => n + 1)}>
                    Inspect {width + ' ' + media}
                  </Button>
                </>
              }
            >
              {media === 'image'
                ? <img src={image} width={720} height={360} alt={width + ' architecture image'} />
                : (
                  <svg
                    role='img'
                    aria-label={width + ' architecture diagram'}
                    width='720'
                    height='360'
                    viewBox='0 0 720 360'
                  >
                    <rect
                      x='20'
                      y='20'
                      width='680'
                      height='320'
                      fill='none'
                      stroke='currentColor'
                    />
                    <text x='40' y='80' fill='currentColor'>Application → runtime → platform</text>
                  </svg>
                )}
            </Figure>
          ))
        )}
        <Button type='button' data-after-figures>After figures</Button>
        <output aria-label='Figure inspections'>{actions}</output>
      </section>
      <div id='source-details'>Source details</div>
      <div id='annotation-details'>Annotation details</div>
      {['proseimage', 'prosediagram', 'wideimage', 'widediagram'].map((name) => (
        <div id={'figure-' + name} key={name}>{name} details</div>
      ))}
    </main>
  );
}
