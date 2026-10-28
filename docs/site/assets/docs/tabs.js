// Tabs enhance visible HTML panels; runtime choices synchronize across groups and navigation.
const RUNTIME_KEY = 'ns-runtime';
const groups = [...document.querySelectorAll('.ns-tabbed')];
const activators = new Map();
function rememberRuntime(label, except) {
  try {
    localStorage.setItem(RUNTIME_KEY, label);
  } catch { /* Persistence is optional. */ }
  for (const [group, activate] of activators) {
    if (group === except || !group.hasAttribute('data-ns-runtime-group')) continue;
    const index = [...group.querySelectorAll('[role="tab"]')].findIndex((tab) =>
      tab.dataset.nsRuntime === label
    );
    if (index >= 0) activate(index, false);
  }
}
for (const group of groups) {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = [...group.querySelectorAll('[role="tabpanel"]')];
  if (!tabs.length || tabs.length !== panels.length) continue;
  const activate = (index, persist = true) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    if (persist && group.hasAttribute('data-ns-runtime-group')) {
      rememberRuntime(tabs[index].dataset.nsRuntime, group);
    }
  };
  activators.set(group, activate);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        next = (index + tabs.length - 1) % tabs.length;
      }
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      activate(next);
      tabs[next].focus();
    });
  });
  group.classList.add('is-enhanced');
  let selected = 0;
  if (group.hasAttribute('data-ns-runtime-group')) {
    try {
      const stored = localStorage.getItem(RUNTIME_KEY);
      const index = tabs.findIndex((tab) => tab.dataset.nsRuntime === stored);
      if (index >= 0) selected = index;
    } catch { /* Use first runtime. */ }
  }
  activate(selected, false);
}
for (const comparison of document.querySelectorAll('[data-ns-comparison]')) {
  const select = comparison.querySelector('[data-ns-comparison-select]');
  if (!select) continue;
  const update = () => {
    comparison.querySelectorAll('[data-ns-competitor]').forEach((node) => {
      node.hidden = node.dataset.nsCompetitor !== select.value;
    });
    comparison.querySelectorAll('[data-ns-competitor-label]').forEach((node) => {
      node.textContent = select.selectedOptions[0]?.textContent || 'Comparison';
    });
  };
  select.addEventListener('change', update);
  comparison.classList.add('is-enhanced');
  update();
}

// Ordinary Markdown fences receive the same path header and non-copying line-number gutter.
for (const pre of document.querySelectorAll('.ns-prose pre')) {
  const code = pre.querySelector('code');
  if (!code) continue;
  pre.tabIndex = 0;
  if (pre.closest('[data-code-block]')) continue;
  const frame = document.createElement('div');
  frame.className = 'ns-code-block';
  frame.dataset.codeBlock = '';
  const header = document.createElement('div');
  header.className = 'ns-code-header';
  const path = document.createElement('span');
  path.className = 'ns-code-path';
  path.textContent = code.textContent.match(
    /(?:\/\/|#)\s+([\w./()-]+\.(?:tsx?|json|prisma|sql|sh|cs|py|go|yaml|yml))\b/,
  )?.[1] || code.className.match(/language-(\S+)/)?.[1] || 'Code';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ns-copy-btn';
  button.dataset.codeCopy = '';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', `Copy ${path.textContent} code`);
  header.append(path, button);
  const body = document.createElement('div');
  body.className = 'ns-code-body';
  const gutter = document.createElement('div');
  gutter.className = 'ns-code-gutter';
  gutter.setAttribute('aria-hidden', 'true');
  gutter.textContent = code.textContent.trimEnd().split('\n').map((_, i) => i + 1).join('\n');
  pre.before(frame);
  body.append(gutter, pre);
  frame.append(header, body);
}
const status = document.createElement('span');
status.className = 'ns-sr-only';
status.setAttribute('role', 'status');
document.body.append(status);
async function copy(text, button) {
  const previous = [...button.childNodes].map((node) => node.cloneNode(true));
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied';
    status.textContent = 'Copied to clipboard';
  } catch {
    button.textContent = 'Copy unavailable';
    status.textContent = 'Clipboard unavailable. Select the text and copy it.';
  }
  setTimeout(() => {
    button.replaceChildren(...previous);
  }, 1800);
}
for (const button of document.querySelectorAll('[data-code-copy]')) {
  button.addEventListener(
    'click',
    () => copy(button.closest('[data-code-block]').querySelector('pre code').textContent, button),
  );
}
for (const button of document.querySelectorAll('[data-copy-path]')) {
  button.addEventListener(
    'click',
    () =>
      copy(
        button.closest('.ns-file-path').querySelector('.ns-file-path__value').textContent,
        button,
      ),
  );
}
for (const table of document.querySelectorAll('.ns-prose table')) table.tabIndex = 0;
