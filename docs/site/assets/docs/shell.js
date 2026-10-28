// Native dialogs own focus trapping, Escape handling and the mobile navigation lifecycle.
const root = document.documentElement;
const schemeToggle = document.querySelector('[data-theme-toggle]');
const preference = matchMedia('(prefers-color-scheme: dark)');
let savedScheme;
try {
  savedScheme = localStorage.getItem('ns-theme');
} catch { /* Storage is optional. */ }
function setScheme(scheme) {
  root.dataset.scheme = scheme;
  schemeToggle?.setAttribute(
    'aria-label',
    `Switch to ${scheme === 'dark' ? 'light' : 'dark'} scheme`,
  );
}
setScheme(root.dataset.scheme === 'dark' ? 'dark' : 'light');
schemeToggle?.addEventListener('click', () => {
  savedScheme = root.dataset.scheme === 'dark' ? 'light' : 'dark';
  setScheme(savedScheme);
  try {
    localStorage.setItem('ns-theme', savedScheme);
  } catch { /* Keep the live choice. */ }
});
preference.addEventListener('change', (event) => {
  if (savedScheme !== 'light' && savedScheme !== 'dark') {
    setScheme(event.matches ? 'dark' : 'light');
  }
});

const sidebar = document.querySelector('[data-sidebar]');
const drawer = document.querySelector('#navigation-dialog');
const trigger = document.querySelector('[data-sidebar-toggle]');
const mobile = matchMedia('(max-width: 960px)');
if (sidebar && drawer instanceof HTMLDialogElement && trigger) {
  const slot = document.createComment('Desktop navigation position');
  sidebar.before(slot);
  const positionNavigation = () => {
    if (!mobile.matches && drawer.open) drawer.close();
    if (mobile.matches) drawer.append(sidebar);
    else slot.after(sidebar);
    sidebar.open = true;
  };
  positionNavigation();
  mobile.addEventListener('change', positionNavigation);
  trigger.addEventListener('click', () => {
    drawer.showModal();
    trigger.setAttribute('aria-expanded', 'true');
  });
  drawer.addEventListener('close', () => trigger.setAttribute('aria-expanded', 'false'));
  drawer.querySelector('[data-sidebar-close]')?.addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer) drawer.close();
  });
}
root.classList.add('js');
