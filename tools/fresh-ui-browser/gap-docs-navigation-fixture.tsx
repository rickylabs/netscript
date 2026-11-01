import { useState } from 'preact/hooks';
import { Toc } from '../../packages/fresh-ui/registry/components/ui/toc.tsx';
import { AnchorNav } from '../../packages/fresh-ui/registry/components/ui/anchor-nav.tsx';
import { Button } from '../../packages/fresh-ui/registry/components/ui/button.tsx';
import { SidebarShell } from '../../packages/fresh-ui/registry/components/ui/sidebar-shell.tsx';

const compositionStyles = `
  html { scroll-padding-block-start:64px; }
  .composition-document h2 { scroll-margin-block-start:12px; }
  .composition-long { min-block-size:1000px; }
  .composition-short { min-block-size:72px; }
  .composition-frame { block-size:400px; }
  .composition-clip { overflow-x:hidden; scroll-padding-block-start:40px; }
  .composition-compact .composition-long { min-block-size:28px; }
  .composition-compact .composition-short { min-block-size:18px; }
`;

function CompositionItems({ prefix }: { prefix: string }) {
  return (
    <>
      {['overview', 'details', 'final'].map((id) => (
        <Toc.Item key={id} href={'#' + prefix + '-' + id}>
          {id === 'overview' ? 'Overview' : id === 'details' ? 'Details' : 'Final'}
        </Toc.Item>
      ))}
    </>
  );
}

/** Static Shell callers author each rail island independently; the Shell itself is not hydrated. */
export function InsetDesktopContents() {
  return (
    <Toc observe breakpoint='desktop' label='Inset desktop outline'>
      <CompositionItems prefix='inset' />
    </Toc>
  );
}

/** A forced native disclosure is useful before this small island hydrates. */
export function InsetMobileContents() {
  return (
    <Toc observe breakpoint='mobile' label='Inset mobile outline'>
      <CompositionItems prefix='inset' />
    </Toc>
  );
}

/** Only this section navigation island measures current/pinning; the Shell remains real SSR. */
export function InsetSections() {
  return (
    <AnchorNav observe label='Inset sections' style={{ top: 56 }}>
      <AnchorNav.Link href='#inset-overview'>Overview</AnchorNav.Link>
      <AnchorNav.Link href='#inset-details'>Details</AnchorNav.Link>
      <AnchorNav.Link href='#inset-final'>Final</AnchorNav.Link>
    </AnchorNav>
  );
}

function CompositionHeadings({ prefix }: { prefix: string }) {
  return (
    <>
      <h2 id={prefix + '-overview'}>Overview</h2>
      <div class='composition-long'>Introduction to the document.</div>
      <h2 id={prefix + '-details'}>Details</h2>
      <div class='composition-long'>Detailed document configuration.</div>
      <h2 id={prefix + '-final'}>Final</h2>
      <div class='composition-short'>End of the document.</div>
    </>
  );
}

/** Real inset styles apply to the server disclosure at both widths, without changing framework CSS. */
export function StaticInsetDocs() {
  return (
    <>
      <style>{compositionStyles}</style>
      <SidebarShell
        id='observed-inset-shell'
        layout='docs'
        sidebarVariant='inset'
        pathname='#inset-overview'
        navigation={[{ items: [{ href: '#inset-overview', label: 'Documentation' }] }]}
        brand={<a href='#inset-overview'>NetScript docs</a>}
        topbarBrand='Documentation'
        contentId='inset-content'
        rail
        railContent={
          <div id='inset-desktop-island'>
            <InsetDesktopContents />
          </div>
        }
        mobileRailContent={
          <div id='inset-mobile-island'>
            <InsetMobileContents />
          </div>
        }
      >
        <article class='composition-document'>
          <h1>Inset document navigation</h1>
          <Button variant='outline' id='inset-focus'>Keep document focus</Button>
          <div id='inset-sections-island'>
            <InsetSections />
          </div>
          <CompositionHeadings prefix='inset' />
        </article>
      </SidebarShell>
    </>
  );
}

/** A caller clipping wrapper can grow with its content while the real document scrolls. */
export function ClippedDocsComposition() {
  const compact = new URLSearchParams(location.search).get('compact') === 'true';
  return (
    <main>
      <style>{compositionStyles}</style>
      <h1>Clipped document navigation</h1>
      <Button variant='outline' id='clip-focus'>Keep document focus</Button>
      <div class='composition-frame'>
        <article
          class={'composition-clip composition-document' + (compact ? ' composition-compact' : '')}
          id='clip-wrapper'
        >
          <Toc observe breakpoint='desktop' label='Clipped outline'>
            <CompositionItems prefix='clip' />
          </Toc>
          <AnchorNav observe label='Clipped sections'>
            <AnchorNav.Link href='#clip-overview'>Overview</AnchorNav.Link>
            <AnchorNav.Link href='#clip-details'>Details</AnchorNav.Link>
            <AnchorNav.Link href='#clip-final'>Final</AnchorNav.Link>
          </AnchorNav>
          <CompositionHeadings prefix='clip' />
        </article>
      </div>
    </main>
  );
}

/** The same real unforced/forced source is served without scripts for SSR acceptance. */
export function StaticDocsNavigation() {
  return (
    <main>
      <h1>Server document navigation</h1>
      <Toc label='Static outline'>
        <Toc.Item href='#static-installation'>Installation</Toc.Item>
        <Toc.Item href='#static-configuration' level='3'>Configuration</Toc.Item>
      </Toc>
      <Toc label='Static mobile outline' breakpoint='mobile'>
        <Toc.Item href='#static-installation'>Installation</Toc.Item>
      </Toc>
      <h2 id='static-installation'>Installation</h2>
      <p>Native section navigation remains useful without client code.</p>
      <h2 id='static-configuration'>Configuration</h2>
    </main>
  );
}

/** This fixture owns acceptance and document content; the components own no routing or scroll commands. */
export function DocsNavigationExamples() {
  const [current, setCurrent] = useState<string | null>('doc-overview');
  const [accept, setAccept] = useState(false);
  const [revision, setRevision] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [late, setLate] = useState(false);
  const [proposals, setProposals] = useState<string[]>([]);
  const [passiveProposals, setPassiveProposals] = useState<string[]>([]);
  const [observedProposals, setObservedProposals] = useState<string[]>([]);
  const [outerProposals, setOuterProposals] = useState<string[]>([]);
  const [innerProposals, setInnerProposals] = useState<string[]>([]);
  return (
    <main>
      <style>
        {`
        html { scroll-padding-block-start: 48px; }
        .docs-nav-host { display:flex; flex-wrap:wrap; gap:12px; margin-block:16px; }
        .docs-nav-frame { min-inline-size:0; max-inline-size:720px; }
        .docs-nav-frame > h2 { scroll-margin-block-start:12px; }
        .docs-nav-section { min-block-size:1000px; }
        .docs-nav-nested { block-size:280px; overflow:auto; border:1px solid var(--ns-border-subtle); scroll-padding-block-start:44px; }
        .docs-nav-nested h2 { scroll-margin-block-start:12px; }
        .docs-nav-nested .docs-nav-section { min-block-size:350px; }
        .docs-nav-short { min-block-size:72px; }
        .docs-nav-outline { max-inline-size:360px; margin-block:24px; }
      `}
      </style>
      <h1>Docs navigation examples</h1>
      <div class='docs-nav-host'>
        <Button variant='outline' onClick={() => setAccept((v) => !v)}>
          {accept ? 'Refuse current' : 'Accept current'}
        </Button>
        <Button variant='outline' onClick={() => setRevision((v) => v + 1)}>Refresh host</Button>
        <Button variant='outline' onClick={() => setMounted((v) => !v)}>
          Toggle outline mount
        </Button>
        <Button variant='outline' onClick={() => setCurrent(null)}>Clear current</Button>
        <Button variant='outline' onClick={() => setLate(true)}>Add late heading</Button>
        <a href='#doc-details' id='external-native-link'>External native section link</a>
        <output aria-label='Current proposals'>{JSON.stringify(proposals)}</output>
        <output aria-label='Responsive proposals'>{JSON.stringify(passiveProposals)}</output>
        <output aria-label='Observed proposals'>{JSON.stringify(observedProposals)}</output>
        <output aria-label='Outer proposals'>{JSON.stringify(outerProposals)}</output>
        <output aria-label='Inner proposals'>{JSON.stringify(innerProposals)}</output>
      </div>
      <div class='docs-nav-outline' id='native-outline' title={'Revision ' + revision}>
        <Button variant='outline' id='before-outline'>Before outline</Button>
        <Toc
          breakpoint='mobile'
          label='Controlled outline'
          currentId={current}
          onCurrentChange={(id, details) => {
            setProposals((previous) => [...previous, id + ':' + details.reason]);
            if (accept) setCurrent(id);
          }}
          links={<a href='#top'>Back to top</a>}
        >
          <Toc.Item href='#doc-overview'>Overview</Toc.Item>
          <Toc.Item href='#doc-details' level='3'>Details</Toc.Item>
          <Toc.Item href='#missing-target'>Missing target</Toc.Item>
          <Toc.Item href='https://example.invalid/#doc-details'>Foreign document</Toc.Item>
        </Toc>
        <Button variant='outline' id='after-outline'>After outline</Button>
      </div>
      {mounted && (
        <div class='docs-nav-outline' id='responsive-outline'>
          <Toc
            label='Responsive outline'
            defaultCurrentId='doc-overview'
            onCurrentChange={(id, details) =>
              setPassiveProposals((previous) => [...previous, id + ':' + details.reason])}
          >
            <Toc.Item href='#doc-overview'>Overview</Toc.Item>
            <Toc.Item href='#doc-details' level='3'>Details</Toc.Item>
            <Toc.Item href='#doc-final'>
              A long final section label that remains readable in either direction
            </Toc.Item>
            <Toc.Item href='#encoded%20%22%5B%5D'>Encoded section</Toc.Item>
          </Toc>
        </div>
      )}
      <div class='docs-nav-outline'>
        <Toc
          breakpoint='desktop'
          label='Outer outline'
          defaultCurrentId='doc-overview'
          onCurrentChange={(id) => setOuterProposals((previous) => [...previous, id])}
        >
          <Toc.Item href='#doc-overview'>Outer overview</Toc.Item>
          <Toc
            breakpoint='desktop'
            label='Inner outline'
            onCurrentChange={(id) => setInnerProposals((previous) => [...previous, id])}
          >
            <Toc.Item href='#doc-details'>Inner details</Toc.Item>
          </Toc>
        </Toc>
      </div>
      <div
        class='docs-nav-nested docs-nav-frame'
        id='nested-scroll'
        tabIndex={0}
        role='region'
        aria-label='Nested documentation'
      >
        <AnchorNav observe label='Nested sections'>
          <AnchorNav.Link href='#nested-overview'>Nested overview</AnchorNav.Link>
          <AnchorNav.Link href='#nested-details'>Nested details</AnchorNav.Link>
          <AnchorNav.Link href='#nested-final'>Nested final</AnchorNav.Link>
        </AnchorNav>
        <h2 id='nested-overview'>Nested overview</h2>
        <div class='docs-nav-section'>Introduction to the nested document.</div>
        <h2 id='nested-details'>Nested details</h2>
        <div class='docs-nav-section'>Configuration within a native scroll region.</div>
        <h2 id='nested-final'>Nested final</h2>
        <div class='docs-nav-short'>End of the nested document.</div>
      </div>
      <article class='docs-nav-frame' id='window-document'>
        {mounted && (
          <AnchorNav
            observe
            label='Document sections'
            onCurrentChange={(id) => setObservedProposals((previous) => [...previous, id])}
          >
            <AnchorNav.Link href='#doc-overview'>Overview</AnchorNav.Link>
            <AnchorNav.Link href='#doc-details'>Details</AnchorNav.Link>
            <AnchorNav.Link href='#doc-final'>Final</AnchorNav.Link>
            <AnchorNav.Link href='#late-heading'>Late heading</AnchorNav.Link>
          </AnchorNav>
        )}
        <h2 id='doc-overview'>Overview</h2>
        <div class='docs-nav-section'>Start of the document.</div>
        <h2 id='doc-details'>Details</h2>
        <div class='docs-nav-section'>Detailed configuration and example content.</div>
        {late && (
          <>
            <h2 id='late-heading'>Late heading</h2>
            <div class='docs-nav-section'>Inserted after observation started.</div>
          </>
        )}
        <h2 id='doc-final'>Final</h2>
        <div class='docs-nav-short'>End of the document.</div>
        <h2 id='encoded "[]'>Encoded section</h2>
      </article>
    </main>
  );
}
