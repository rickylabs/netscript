import { useEffect } from 'preact/hooks';

/**
 * Zero-UI island: delegated copy-to-clipboard for `[data-token-copy]` buttons.
 *
 * Any server-rendered element carrying `data-token-copy="<text>"` becomes a
 * copy control; a transient `data-copied` attribute drives the confirmation
 * styling in `assets/design.css`.
 */
export default function TokenClipboard(): null {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-token-copy]',
      );
      const text = trigger?.dataset.tokenCopy;
      if (!trigger || !text) return;
      void navigator.clipboard.writeText(text).then(() => {
        trigger.setAttribute('data-copied', 'true');
        setTimeout(() => trigger.removeAttribute('data-copied'), 1200);
      });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
