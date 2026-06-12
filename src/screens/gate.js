// Step 0: the very first gate. A password ("trenino") hidden inside an
// origami heart, over a cream backdrop, with a continuous rain of little
// hearts. No clues of any kind.

import { getTheme, onThemeChange } from '../theme.js';

const PASSWORD = 'trenino';

// paper-fold tones per theme
const HEART_TONES = {
  light: ['#e63946', '#ff5a6a', '#d62839', '#ff7184', '#f0455a', '#ff6378'],
  goth: ['#7a0d1b', '#9b1023', '#5e0a16', '#a31226', '#6b0f1d', '#871020'],
};
const HEART_BASE = { light: '#e63946', goth: '#7a0d1b' };
const HEART_STROKE = { light: 'rgba(139,14,24,0.45)', goth: 'rgba(10,4,8,0.6)' };

// falling-heart particle colours per theme
const RAIN_COLORS = {
  light: ['#e63946', '#ff5a6a', '#ff8aa3', '#ffb3c1', '#c1121f'],
  goth: ['#9b1023', '#c41e3a', '#7a0d1b', '#6b2d5c', '#3a0d1a'],
};

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9àèéìòù]/g, '');
}

// Build a faceted (origami) heart as an SVG string. Straight folded panels
// fan out from the bottom tip — that gives the paper look.
function origamiHeartSVG(theme = 'light') {
  // heart outline, clockwise from the bottom tip (viewBox 0 0 200 200)
  const V = [
    [100, 182],
    [140, 150],
    [172, 108],
    [184, 70],
    [176, 46],
    [156, 34],
    [132, 34],
    [112, 46],
    [100, 62], // top center dip
    [88, 46],
    [68, 34],
    [44, 34],
    [24, 46],
    [16, 70],
    [28, 108],
    [60, 150],
  ];
  const tip = V[0];
  // alternating paper tones for the current theme
  const tones = HEART_TONES[theme] || HEART_TONES.light;
  const base = HEART_BASE[theme] || HEART_BASE.light;
  const stroke = HEART_STROKE[theme] || HEART_STROKE.light;

  let facets = '';
  for (let i = 1; i < V.length - 1; i++) {
    const a = V[i];
    const b = V[i + 1];
    const col = tones[i % tones.length];
    facets += `<polygon points="${tip[0]},${tip[1]} ${a[0]},${a[1]} ${b[0]},${b[1]}" fill="${col}"/>`;
  }
  // crease lines from the tip to each outline vertex
  let creases = '';
  for (let i = 1; i < V.length; i++) {
    creases += `<line x1="${tip[0]}" y1="${tip[1]}" x2="${V[i][0]}" y2="${V[i][1]}" stroke="rgba(255,255,255,0.18)" stroke-width="0.8"/>`;
  }
  const outline = V.map((p) => p.join(',')).join(' ');

  return `
  <svg class="origami" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="hsheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g>
      <polygon points="${outline}" fill="${base}"/>
      ${facets}
      ${creases}
      <polygon points="${outline}" fill="url(#hsheen)"/>
      <polygon points="${outline}" fill="none" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

function startHeartRain(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  let colors = RAIN_COLORS[getTheme()] || RAIN_COLORS.light;
  let hearts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(46, Math.max(24, w / 11)));
    hearts = Array.from({ length: count }, () => spawn(true));
  }

  function spawn(initial) {
    const size = 7 + Math.random() * 16;
    return {
      x: Math.random() * w,
      y: initial ? Math.random() * h : -size - Math.random() * 80,
      size,
      vy: 18 + Math.random() * 34, // px/s
      sway: 12 + Math.random() * 26,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 0.6 + Math.random() * 1.2,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 0.8,
      color: colors[(Math.random() * colors.length) | 0],
      alpha: 0.45 + Math.random() * 0.5,
    };
  }

  function drawHeart(x, y, s, rot, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(s / 28, s / 28);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(0, 0, -14, -2, -14, 8);
    ctx.bezierCurveTo(-14, 18, 0, 24, 0, 32);
    ctx.bezierCurveTo(0, 24, 14, 18, 14, 8);
    ctx.bezierCurveTo(14, -2, 0, 0, 0, 8);
    ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  let raf = 0;
  let running = true;
  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, w, h);
    for (const p of hearts) {
      p.y += p.vy * dt;
      p.phase += p.swaySpeed * dt;
      p.rot += p.vrot * dt;
      const x = p.x + Math.sin(p.phase) * p.sway;
      drawHeart(x, p.y, p.size, p.rot, p.color, p.alpha);
      if (p.y - p.size > h) Object.assign(p, spawn(false));
    }
    raf = requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(frame);

  return {
    setColors(next) {
      colors = next;
      for (const p of hearts) p.color = next[(Math.random() * next.length) | 0];
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    },
  };
}

export function mountGate(root, onSolved) {
  root.innerHTML = `
    <canvas class="hearts-canvas" id="hearts-canvas"></canvas>
    <div class="gate-stage">
      <div class="origami-slot">${origamiHeartSVG(getTheme())}</div>
      <div class="gate-field" id="gate-field">
        <input
          id="gate-input"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          aria-label="Parola d'ordine"
          placeholder="• • •"
        />
        <button class="gate-go" id="gate-go" aria-label="Avvia">
          <svg width="20" height="18" viewBox="0 0 24 22" fill="none">
            <path d="M12 20.5C6 16 2 12.5 2 8.2 2 5 4.4 3 7.2 3c1.9 0 3.6 1 4.8 2.6C13.2 4 14.9 3 16.8 3 19.6 3 22 5 22 8.2c0 4.3-4 7.8-10 12.3z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const rain = startHeartRain(root.querySelector('#hearts-canvas'));
  const slot = root.querySelector('.origami-slot');
  const field = root.querySelector('#gate-field');
  const input = root.querySelector('#gate-input');
  const go = root.querySelector('#gate-go');
  let solved = false;

  // restyle the heart + the rain when the theme changes
  const offTheme = onThemeChange((theme) => {
    slot.innerHTML = origamiHeartSVG(theme);
    rain.setColors(RAIN_COLORS[theme] || RAIN_COLORS.light);
  });

  function fail() {
    field.classList.remove('error');
    void field.offsetWidth;
    field.classList.add('error');
    if (navigator.vibrate) navigator.vibrate(70);
  }

  function attempt() {
    if (solved) return;
    const v = normalize(input.value);
    if (!v) return;
    if (v === PASSWORD) {
      solved = true;
      input.disabled = true;
      go.disabled = true;
      field.classList.add('ok');
      if (navigator.vibrate) navigator.vibrate([30, 50, 40]);
      setTimeout(() => {
        rain.stop();
        offTheme();
        onSolved();
      }, 850);
    } else {
      fail();
    }
  }

  go.addEventListener('click', attempt);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attempt();
  });
  input.addEventListener('input', () => field.classList.remove('error'));
}
