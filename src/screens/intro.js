// Intro screen: a little red train crosses the screen, then the call-to-action
// rises into view.

const TRAIN_SVG = `
<svg class="train" viewBox="0 0 150 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <!-- puff of smoke -->
  <g opacity="0.5" fill="#cdbfae">
    <circle cx="34" cy="8" r="5"/>
    <circle cx="26" cy="5" r="4"/>
    <circle cx="42" cy="4" r="3.4"/>
  </g>
  <!-- carriage -->
  <rect x="2" y="20" width="78" height="24" rx="4" fill="#e63946"/>
  <rect x="2" y="20" width="78" height="9" rx="4" fill="#ff5a6a"/>
  <rect x="10" y="26" width="13" height="11" rx="2" fill="#fff3e6"/>
  <rect x="31" y="26" width="13" height="11" rx="2" fill="#fff3e6"/>
  <rect x="52" y="26" width="13" height="11" rx="2" fill="#fff3e6"/>
  <!-- locomotive -->
  <rect x="82" y="16" width="56" height="28" rx="5" fill="#c1121f"/>
  <rect x="82" y="16" width="56" height="9" rx="5" fill="#e63946"/>
  <rect x="118" y="24" width="16" height="13" rx="2" fill="#fff3e6"/>
  <rect x="100" y="8" width="11" height="12" rx="2" fill="#8b0e18"/>
  <circle cx="132" cy="20" r="3" fill="#ffd76a"/>
  <!-- undercarriage + wheels -->
  <rect x="2" y="44" width="136" height="4" rx="2" fill="#3a2326"/>
  <g fill="#2a2320">
    <circle cx="18" cy="49" r="5"/>
    <circle cx="46" cy="49" r="5"/>
    <circle cx="74" cy="49" r="5"/>
    <circle cx="100" cy="49" r="6"/>
    <circle cx="126" cy="49" r="6"/>
  </g>
  <g fill="#6b5d54">
    <circle cx="18" cy="49" r="1.8"/>
    <circle cx="46" cy="49" r="1.8"/>
    <circle cx="74" cy="49" r="1.8"/>
    <circle cx="100" cy="49" r="2.2"/>
    <circle cx="126" cy="49" r="2.2"/>
  </g>
</svg>`;

export function mountIntro(root, onContinue) {
  root.innerHTML = `
    <div class="rail"></div>
    ${TRAIN_SVG}
    <div class="intro-content" id="intro-content">
      <div class="eyebrow">Un piccolo viaggio</div>
      <h1>Sali a bordo,<br /><em>si parte</em></h1>
      <p class="lede">Risolvi l'indovinello per continuare. Il binario è pronto, manca solo la chiave giusta.</p>
      <button class="btn" id="start-btn">
        Inizia il viaggio
        <svg class="arrow" width="18" height="14" viewBox="0 0 18 14" fill="none">
          <path d="M1 7h15M11 2l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  const train = root.querySelector('.train');
  const content = root.querySelector('#intro-content');
  const btn = root.querySelector('#start-btn');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animate the train across the viewport, then reveal the content.
  function runTrain() {
    const w = window.innerWidth;
    const distance = w + 320;
    const duration = reduce ? 400 : 3200;

    const anim = train.animate(
      [
        { transform: 'translateX(0px)' },
        { transform: `translateX(${distance}px)` },
      ],
      { duration, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' }
    );

    // subtle bobbing while it rolls
    if (!reduce) {
      train.animate(
        [
          { translate: '0 0' },
          { translate: '0 -1.5px' },
          { translate: '0 0' },
        ],
        { duration: 320, iterations: Math.round(duration / 320) }
      );
    }

    anim.onfinish = () => content.classList.add('show');
  }

  btn.addEventListener('click', () => {
    btn.disabled = true;
    onContinue();
  });

  // The train only rolls once this screen is actually shown (after the gate).
  let started = false;
  function start() {
    if (started) return;
    started = true;
    requestAnimationFrame(() => requestAnimationFrame(runTrain));
  }

  return { start };
}
