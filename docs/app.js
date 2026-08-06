import {
  animate, createTimeline, stagger, utils, svg, createSpring, splitText
} from './vendor/anime-subset.min.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// The document is gated hidden in the head so the plate text cannot paint once
// and then be yanked back to animate. This file is now here, so the gate comes
// off as soon as the hidden state has been taken over by inline values below —
// and the head's own fallback timer, which exists in case this file never
// arrived, is no longer needed.
clearTimeout(window.__revealFallback);
const ungate = () => document.documentElement.classList.remove('anim');
if (REDUCED) ungate();
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Play once, when the thing is actually on screen. IntersectionObserver rather
// than a scroll library because the trigger has one job and no options.
const whenSeen = (el, fn, margin = '0px 0px -14% 0px') => {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { io.disconnect(); fn(); }
  }, { rootMargin: margin });
  io.observe(el);
};

/* ------------------------------------------------------------------
   The switch. Its behaviour is the page's whole security model, so it
   is wired first and works whether or not anything below it runs.
------------------------------------------------------------------ */
const stage   = $('#stage');
const bIn     = $('#b-in');
const bOut    = $('#b-out');
const verdict = $('#verdict');
const seal    = $('#l-seal');

const COPY = {
  inside : ['Three services answer, and the address stays put whatever the broadband does.',
            "Access control is the network's job here, which is why an unauthenticated model endpoint is a reasonable thing to run."],
  outside: ['The same three services, from anywhere else. There is no port to knock on.',
            'This is what a scanner sees, and it is why the router forwards nothing.']
};

// The link is the one thing that crosses the wall, so it is the one thing
// that has to physically retract when the wall closes.
const linkDraw = svg.createDrawable('#link');
let state = 'inside';

function setState(next, animated = true) {
  state = next;
  const out = next === 'outside';
  const d   = animated && !REDUCED ? 1 : 0;

  stage.setAttribute('data-state', next);
  bIn.setAttribute('aria-pressed', String(!out));
  bOut.setAttribute('aria-pressed', String(out));
  seal.setAttribute('aria-hidden', String(!out));
  verdict.innerHTML = COPY[next][0] + '<span>' + COPY[next][1] + '</span>';

  // The route dies first, then the walls close over what it reached. The
  // blackout is total rather than dimmed: a dimmed estate still shows you the
  // shape of what is there, and the whole claim is that from outside there is
  // nothing to see. Anything short of zero would be illustrating the wrong thing.
  animate('#link-pulse', { opacity: out ? 0 : 0.5, duration: 200 * d });
  animate(linkDraw,      { draw: out ? '0 0' : '0 1', duration: 460 * d, ease: 'inOut(3)' });
  animate('#l-inner',    { opacity: out ? 0 : 1, duration: 460 * d, delay: out ? 140 * d : 0, ease: 'inOut(2)' });
  animate('#l-seams',    { opacity: out ? 0 : 1, duration: 460 * d, delay: out ? 140 * d : 0 });
  animate('.seal-panel', { opacity: out ? 1 : 0, duration: 380 * d, delay: out ? 260 * d : 0, ease: 'out(2)' });
  animate('.seal-txt',   { opacity: out ? 1 : 0, translateY: out ? [7, 0] : 0,
                           duration: 460 * d, delay: out ? 420 * d : 0, ease: 'out(3)' });
}

bIn .addEventListener('click', () => setState('inside'));
bOut.addEventListener('click', () => setState('outside'));
setState('inside', false);

/* ------------------------------------------------------------------
   Everything below is enhancement. Each block hides its own targets in
   script immediately before animating them, so a failure to load this
   file leaves the page complete rather than blank.
------------------------------------------------------------------ */
if (!REDUCED) {

  /* -- the plate. one masked line reveal, then the image settles. -- */
  const lead = splitText('#lead', { lines: { wrap: 'clip' } });
  utils.set(lead.lines, { opacity: 0, translateY: '100%' });
  utils.set('.sub, .plate-note', { opacity: 0, translateY: 12 });
  ungate();

  createTimeline({ defaults: { ease: 'out(3)' } })
    .add('#plate-img', { scale: [1.07, 1], duration: 2600, ease: 'out(2)' }, 0)
    .add(lead.lines,   { opacity: 1, translateY: '0%', duration: 1000, delay: stagger(95) }, 160)
    .add('.sub',       { opacity: 1, translateY: 0, duration: 800 }, 560)
    .add('.plate-note',{ opacity: 1, translateY: 0, duration: 800, delay: stagger(120) }, 760);

  /* -- the elevation draws itself, bottom up, in boot order. --
     The shelf exists first, then the machine on it, then the guest, then
     the services, then the mesh around all of it, then the one route out. */
  const draw  = svg.createDrawable('#elev .dr');
  const DRAW  = { draw: ['0 0', '0 1'], ease: 'inOut(3)' };
  const label = { opacity: [0, 1], translateY: [5, 0], ease: 'out(3)', duration: 520 };

  utils.set(draw, { draw: '0 0' });
  utils.set(linkDraw, { draw: '0 0' });
  utils.set('#elev .lb, #l-out text', { opacity: 0 });
  utils.set('#l-seams .mk', { opacity: 0, scale: 0 });

  // Absolute positions, so the sequence reads the same whatever anime does
  // with relative offsets. Roughly 3.4s end to end.
  whenSeen($('#stage'), () => {
    createTimeline({ defaults: { duration: 640 } })
      .add('#l-out text',    { opacity: [0, 1], duration: 700, ease: 'out(2)' },   0)
      .add([draw[0]],        { ...DRAW, duration: 620 },                         180)  // the shelf
      .add('#l-shelf .lb',   label,                                              560)
      .add([draw[1]],        { ...DRAW, duration: 560 },                         540)  // pve
      .add('#l-host .lb',    label,                                              860)
      .add([draw[2]],        { ...DRAW, duration: 320 },                        1020)  // the first join
      .add([draw[3]],        { ...DRAW, duration: 560 },                        1240)  // dockerser1
      .add('#l-vm .lb',      label,                                             1560)
      .add([draw[4]],        { ...DRAW, duration: 320 },                        1720)  // the second join
      .add([draw[5]],        { ...DRAW, duration: 560 },                        1940)  // llama-server
      .add('#l-svc .lb',     label,                                             2260)
      .add([draw[6]],        { ...DRAW, duration: 900 },                        2320)  // the envelope
      .add([draw[7]],        { ...DRAW, duration: 700 },                        2560)  // and around the laptop
      .add('#l-mesh .lb',    label,                                             2520)
      .add(linkDraw,         { ...DRAW, duration: 620 },                        2900)  // the one route out
      .add('#l-laptop .lb',  label,                                             3180)
      .add('#l-seams .mk', {
        opacity: 1, scale: 1, duration: 760, delay: stagger(80),
        ease: createSpring({ stiffness: 170, damping: 13 })
      },                                                                        3320);

    // The one ambient loop on the page. It says a single true thing: this
    // link is carrying something right now, and it is the only one that is.
    setTimeout(() => {
      animate('#link-pulse', { opacity: 0.5, duration: 500 });
      animate('#link-pulse', { strokeDashoffset: [0, -24], duration: 1600, ease: 'linear', loop: true });
    }, 3500);
  }, '0px 0px -12% 0px');

  /* -- each incident arrives as it is reached -- */
  $$('.inc').forEach(el => {
    const n = $('.inc-n', el);
    utils.set(el, { opacity: 0, translateY: 22 });
    utils.set(n, { scale: 0.4, opacity: 0 });
    whenSeen(el, () => {
      animate(el, { opacity: 1, translateY: 0, duration: 760, ease: 'out(3)' });
      animate(n,  { scale: 1, opacity: 1, duration: 700, delay: 90,
                    ease: createSpring({ stiffness: 150, damping: 12 }) });
    }, '0px 0px -12% 0px');
  });
}

/* ------------------------------------------------------------------
   The spine. Six marks, because there are six, and clicking one goes to
   it. Tracking is plain observation, so it also works reduced.
------------------------------------------------------------------ */
const spine = $('.spine');
const items = $$('.spine li');
const fill  = $('#spine-fill');
const incs  = $$('.inc');
const marks = $$('#l-seams .mk');

if (spine && items.length === incs.length && items.length) {
  const STEP = 100 / items.length;
  let active = -1;

  const setActive = i => {
    if (i === active) return;
    active = i;
    items.forEach((li, n) => li.classList.toggle('on', n === i));
    // The mark on the drawing and the entry being read are the same seam,
    // so lighting one lights the other.
    marks.forEach((mk, n) => animate(mk, {
      scale: n === i ? 1.3 : 1, duration: REDUCED ? 0 : 420,
      ease: createSpring({ stiffness: 200, damping: 14 })
    }));
    fill.style.height = ((i + 1) * STEP) + '%';
  };

  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) setActive(incs.indexOf(e.target));
  }, { rootMargin: '-25% 0px -55% 0px' });
  incs.forEach(el => io.observe(el));

  // it only means anything once the drawing it keys to is behind you
  const gate = new IntersectionObserver(([e]) => {
    spine.classList.toggle('live', e.boundingClientRect.top < 0 && !e.isIntersecting);
  }, { threshold: 0 });
  gate.observe($('#stage'));
}

// Clicking a mark on the drawing goes to the seam it names.
marks.forEach(mk => {
  mk.addEventListener('click', () => {
    const t = $('#seam-' + mk.dataset.n);
    if (t) t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  });
});
