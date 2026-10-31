import { copiedProseHtml } from './test-results/prose-fixture.ts';

export function ProseExamples() {
  return (
    <section aria-label='Prose components'>
      <h2>Prose components</h2>
      <button type='button' id='before-prose'>Before prose</button>
      <div id='prose-installed' dangerouslySetInnerHTML={{ __html: copiedProseHtml }} />
      <button type='button' id='after-prose'>After prose</button>
      <div id='prose-host' class='ns-markdown'>
        <h2 id='prose-target'>
          Host heading<a
            class='ns-heading-anchor'
            href='#prose-target'
            aria-label='Link to host heading'
          >
            #
          </a>
        </h2>
        <p class='ns-lede'>Host-authored native HTML uses the same stylesheet.</p>
        <p>
          Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open the command palette.
        </p>
      </div>
    </section>
  );
}
