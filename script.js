const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Theme: follows the phone until the visitor picks one. */
const dark = () =>
  root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
$('#theme').addEventListener('click', () => {
  const next = dark() ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) { /* private window */ }
});

/* Intro: the cover opens once per visit, and a tap skips it. */
const splash = $('#splash');
if (root.classList.contains('splash-on')) {
  const done = () => {
    root.classList.remove('splash-on');
    try { sessionStorage.setItem('seen', '1'); } catch (e) { /* private window */ }
  };
  const open = () => {
    splash.classList.add('open');
    setTimeout(done, 1150);
  };
  const timer = setTimeout(open, 1700);
  splash.addEventListener('click', () => { clearTimeout(timer); open(); });
}

/* Header: tightens on scroll and shows how far through the page you are. */
const bar = $('#top-bar');
const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.classList.toggle('small', scrollY > 40);
  bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* A month of reading for the mockups: a fixed pattern, not real data. */
const levels = [0, 2, 3, 0, 1, 3, 2, 1, 0, 3, 3, 2, 0, 1, 2, 3, 1, 0, 2, 3, 3, 1, 0, 2, 3, 2, 1, 3, 0, 2, 3];
$$('[data-heat]').forEach((el) => {
  el.innerHTML = levels.map((l, i) => `<i data-l="${l}" style="--i:${i}"></i>`).join('');
});

/* Counters */
const pad = (n) => String(n).padStart(2, '0');
const clock = (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (calm) { el.textContent = target + suffix; return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 1400);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* Live clocks: the hero timer, the offline chapter, and the timer tile. */
function runClock(el, start, onTick) {
  let s = start;
  el.textContent = clock(s);
  return setInterval(() => { s += 1; el.textContent = clock(s); onTick && onTick(s - start); }, 1000);
}
const hero = $('.hero-phone');
runClock($('[data-tick]', hero), 42 * 60 + 18, (n) => {
  if (n % 18 === 0) $('[data-pages]', hero).textContent = 118 + n / 18;
  $('[data-bar]', hero).style.width = Math.min(100, 42 + n / 6) + '%';
});

let storyClock = null;
function startStoryClock(screen) {
  stopStoryClock();
  const p2 = $('[data-pages2]', screen), prog = $('[data-bar]', screen);
  let pages = 118;
  p2.textContent = pages; prog.style.width = '30%';
  storyClock = runClock($('[data-tick]', screen), 41 * 60 + 52, (n) => {
    if (n % 3 === 0 && pages < 131) { pages += 1; p2.textContent = pages; prog.style.width = 30 + (pages - 118) * 3 + '%'; }
  });
}
function stopStoryClock() { clearInterval(storyClock); storyClock = null; }

/* Story: the phone follows whichever chapter is in view. */
const story = $('#story');
const screens = $$('.scr', story);
const chapters = $$('.chapter', story);
function show(n) {
  if (story.dataset.s === String(n) && $('.scr.on')) return;
  story.dataset.s = n;
  chapters.forEach((c) => c.classList.toggle('on', c.dataset.s === String(n)));
  screens.forEach((s) => {
    const on = s.dataset.s === String(n);
    s.classList.toggle('on', on);
    if (on) $$('[data-count]', s).forEach(countUp);
  });
  const first = $('.scr[data-s="1"]', story);
  if (String(n) === '1') startStoryClock(first); else stopStoryClock();
}
show(1);
const narrow = matchMedia('(max-width: 900px)').matches;
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) show(e.target.dataset.s); }),
  { rootMargin: narrow ? '-62% 0px -8% 0px' : '-45% 0px -45% 0px' },
);
chapters.forEach((c) => io.observe(c));

/* Tiles come in as they are reached; the ones with numbers start counting. */
let tileClock = null;
const tiles = $$('.tile');
tiles.forEach((t, i) => t.style.setProperty('--d', (i % 3) * 0.12 + 's'));
const tio = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  const t = e.target;
  t.classList.add('in');
  tio.unobserve(t);
  $$('[data-count]', t).forEach(countUp);
  const tick = $('[data-tick2]', t);
  if (tick) tileClock = runClock(tick, 25 * 60 + 41);
}), { threshold: 0.25 });
tiles.forEach((t) => tio.observe(t));

/* No server: the form opens the visitor's own mail app, pre-filled. */
const EMAIL = 'rate.code.115@gmail.com';
const hint = $('#hint');
$('#form').addEventListener('submit', (event) => {
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
  location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n${name}`)}`;
  hint.textContent = 'Your email app should open with the message ready to send.';
});
