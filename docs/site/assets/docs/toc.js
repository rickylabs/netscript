// Both TOC views and reference section anchors share one heading/scroll-spy model.
const headings = [...document.querySelectorAll('.ns-prose h2[id], .ns-prose h3[id]')];
const desktop = document.querySelector('[data-toc]');
const mobile = document.querySelector('[data-mobile-toc]');
const reference = document.querySelector('[data-reference-nav]');
const isReference = document.body.dataset.docsKind === 'reference';
const isHome = document.body.dataset.docsKind === 'home';
const links = new Map();
function linkTo(heading) {
  const a = document.createElement('a');
  a.className = 'ns-toc__link';
  a.href = `#${heading.id}`;
  a.textContent = heading.textContent.trim();
  const targets = links.get(heading.id) || [];
  targets.push(a);
  links.set(heading.id, targets);
  return a;
}
if (headings.length >= 2 && !isHome) {
  for (const selector of ['[data-toc-list]', '[data-mobile-toc-list]']) {
    const list = document.querySelector(selector);
    if (!list) continue;
    for (const heading of headings) {
      const li = document.createElement('li');
      li.className = `ns-toc__item--${heading.tagName.toLowerCase()}`;
      li.append(linkTo(heading));
      list.append(li);
    }
  }
  if (desktop && !isReference) desktop.hidden = false;
  if (mobile && !isReference) mobile.hidden = false;
  if (isReference && reference) {
    for (const heading of headings.filter((h) => h.tagName === 'H2')) {
      reference.append(linkTo(heading));
    }
    reference.hidden = false;
  }
  mobile?.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      mobile.open = false;
    })
  );
  let scheduled = false;
  const update = () => {
    scheduled = false;
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= 180) current = heading;
      else break;
    }
    for (const [id, targets] of links) {
      for (const a of targets) {
        if (id === current.id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      }
    }
    const label = document.querySelector('[data-toc-current]');
    if (label) label.textContent = current.textContent.trim();
  };
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
}
