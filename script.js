// Theme: follows the phone until the visitor picks one.
const root = document.documentElement;
const dark = () =>
  root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;

document.getElementById('theme').addEventListener('click', () => {
  const next = dark() ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) { /* private window */ }
});

// A month of reading for the stats mockup; a fixed pattern, not real data.
const levels = [0, 2, 3, 0, 1, 3, 2, 1, 0, 3, 3, 2, 0, 1, 2, 3, 1, 0, 2, 3, 3, 1, 0, 2, 3, 2, 1, 3, 0, 2, 3];
document.getElementById('heat').innerHTML = levels
  .map((l) => `<i data-l="${l}"></i>`)
  .join('');

// No server: the form opens the visitor's own mail app, pre-filled.
const EMAIL = 'rate.code.115@gmail.com';
const hint = document.getElementById('hint');
document.getElementById('form').addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const name = String(data.get('name')).trim();
  const message = String(data.get('message')).trim();
  if (!name || !message) {
    hint.textContent = 'Add your name and a message, then try again.';
    hint.classList.add('err');
    return;
  }
  hint.classList.remove('err');
  const subject = `Books n Mee: ${data.get('kind')}`;
  const body = `${message}\n\n${name}`;
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  hint.textContent = 'Your email app should open with the message ready to send.';
});
