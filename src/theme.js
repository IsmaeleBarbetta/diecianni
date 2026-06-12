// Minimal theme manager. State lives in memory (a class on <html>), so it
// persists across the multi-stage screens but resets on a full reload —
// exactly the requested behaviour.

const listeners = new Set();
let theme = 'light'; // 'light' | 'goth'

function apply() {
  document.documentElement.classList.toggle('theme-goth', theme === 'goth');
}

export function getTheme() {
  return theme;
}

export function setTheme(t) {
  if (t === theme) return;
  theme = t;
  apply();
  listeners.forEach((fn) => fn(theme));
}

export function toggleTheme() {
  setTheme(theme === 'light' ? 'goth' : 'light');
}

// Subscribe to changes. Returns an unsubscribe function.
export function onThemeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Fixed bottom-right toggle, shared across every screen.
export function mountThemeToggle() {
  apply();
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Cambia tema');
  btn.innerHTML = `
    <svg class="i-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.8A8.5 8.5 0 1111.2 3a6.7 6.7 0 109.8 9.8z" fill="currentColor"/>
    </svg>
    <svg class="i-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.4" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9"/>
      </g>
    </svg>
  `;
  btn.addEventListener('click', toggleTheme);
  document.body.appendChild(btn);
  return btn;
}
