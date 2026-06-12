// Journey screen: a 3D alpine terrain with a red train tracing the Bernina
// route from Tirano up to Sankt Moritz. On arrival: fireworks + hearts + the
// final message.

import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D(() => 0.42); // fixed seed -> same mountains every load

// Fractal noise, returns roughly -1..1
function fbm(x, z) {
  let amp = 1,
    freq = 1,
    sum = 0,
    norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += amp * noise2D(x * freq * 0.014, z * freq * 0.014);
    norm += amp;
    amp *= 0.5;
    freq *= 2.05;
  }
  return sum / norm;
}

// Terrain height at world (x, z). Bowl of peaks around a calmer middle valley.
function heightAt(x, z) {
  const n = fbm(x, z) * 0.5 + 0.5; // 0..1
  const r = Math.sqrt(x * x + z * z) / 130; // 0 center -> ~1 edge
  const rim = 0.45 + 0.85 * Math.min(1, r); // taller toward the rim
  const h = Math.pow(n, 1.25) * 34 * rim;
  return h - 6;
}

const SIZE = 240;
const SEG = 128;

const C_FOREST = new THREE.Color('#3c6b46');
const C_MEADOW = new THREE.Color('#5d864f');
const C_ROCK = new THREE.Color('#7d6f60');
const C_SNOW = new THREE.Color('#f3f1ec');

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function colorForHeight(h, target) {
  const c = target;
  if (h < 6) {
    c.copy(C_FOREST).lerp(C_MEADOW, smoothstep(-6, 6, h));
  } else if (h < 16) {
    c.copy(C_MEADOW).lerp(C_ROCK, smoothstep(6, 16, h));
  } else {
    c.copy(C_ROCK).lerp(C_SNOW, smoothstep(16, 26, h));
  }
  return c;
}

export function mountJourney(root) {
  root.innerHTML = `
    <div class="map-label start" id="label-start">Tirano</div>
    <div class="map-label" id="label-end">Sankt Moritz</div>
    <div class="finale" id="finale">
      <div class="small">Capolinea · per sempre</div>
      <h2>Auguri di 10 anni<br/>insieme <span class="heart">❤</span></h2>
      <div class="route">
        <span>Tirano</span><span class="dot"></span><span>Sankt Moritz</span>
      </div>
    </div>
    <div class="loading" id="loading">preparo le montagne…</div>
  `;

  const labelStart = root.querySelector('#label-start');
  const labelEnd = root.querySelector('#label-end');
  const finale = root.querySelector('#finale');
  const loading = root.querySelector('#loading');

  // ---- renderer / scene / camera ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  root.insertBefore(renderer.domElement, root.firstChild);

  const scene = new THREE.Scene();
  const fogColor = new THREE.Color('#b5707a');
  scene.fog = new THREE.Fog(fogColor, 150, 360);

  const camera = new THREE.PerspectiveCamera(
    52,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const camTarget = new THREE.Vector3(-4, 2, -2);

  // ---- lights ----
  const ambient = new THREE.HemisphereLight(0xffe6c4, 0x40304a, 0.95);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffd9a0, 1.25);
  sun.position.set(-60, 70, 40);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xff9d7a, 0.5);
  rim.position.set(70, 30, -60);
  scene.add(rim);

  // ---- terrain ----
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = [];
  const tmpColor = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    colorForHeight(h, tmpColor);
    colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: false,
  });
  const terrain = new THREE.Mesh(geo, terrainMat);
  scene.add(terrain);

  // ---- route curve (Tirano -> Sankt Moritz), hugging the terrain ----
  const waypoints2D = [
    [-22, 58], // Tirano (foreground)
    [-34, 38],
    [-8, 28],
    [-26, 8],
    [6, -6],
    [-6, -28],
    [26, -44],
    [40, -64], // Sankt Moritz (background)
  ];
  const CLEAR = 1.6; // float above ground
  const flat = new THREE.CatmullRomCurve3(
    waypoints2D.map(([x, z]) => new THREE.Vector3(x, 0, z))
  );
  const dense = flat.getPoints(220).map((p) => {
    p.y = heightAt(p.x, p.z) + CLEAR;
    return p;
  });
  const route = new THREE.CatmullRomCurve3(dense);

  const startPt = route.getPointAt(0);
  const endPt = route.getPointAt(1);

  // frame the camera on the middle of the route so both stations stay in view
  camTarget.copy(startPt).add(endPt).multiplyScalar(0.5);
  camTarget.y = 6;

  // route tube, revealed progressively via drawRange
  const tubeGeo = new THREE.TubeGeometry(route, 260, 0.6, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: 0xff3b4e,
    transparent: true,
    opacity: 0.95,
  });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  const tubeIndexCount = tubeGeo.index.count;
  tubeGeo.setDrawRange(0, 0);
  scene.add(tube);

  // soft glow underlay for the route
  const glowGeo = new THREE.TubeGeometry(route, 260, 1.5, 8, false);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff6b7d,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glowGeo.setDrawRange(0, 0);
  scene.add(glow);

  // station markers
  function marker(point, color) {
    const g = new THREE.Group();
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.4,
      })
    );
    g.add(pin);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.8, 2.4, 24),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1;
    g.add(ring);
    g.position.copy(point);
    scene.add(g);
    return g;
  }
  marker(startPt, new THREE.Color('#2a2320'));
  marker(endPt, new THREE.Color('#ff3b4e'));

  // ---- the little red train ----
  const train = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe63946,
    roughness: 0.45,
    metalness: 0.1,
    emissive: 0x5a0d14,
    emissiveIntensity: 0.3,
  });
  const cabMat = new THREE.MeshStandardMaterial({
    color: 0xc1121f,
    roughness: 0.5,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.5), bodyMat);
  body.position.y = 0.9;
  train.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 1.4), cabMat);
  cab.position.set(-0.9, 1.95, 0);
  train.add(cab);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.25, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x8b0e18, roughness: 0.6 })
  );
  roof.position.y = 1.7;
  train.add(roof);
  const headlight = new THREE.PointLight(0xffd27a, 6, 24, 2);
  headlight.position.set(1.6, 1.1, 0);
  train.add(headlight);
  const glowSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  glowSphere.position.set(1.5, 1.0, 0);
  train.add(glowSphere);
  train.scale.setScalar(1.1);
  scene.add(train);

  // place train at start
  const up = new THREE.Vector3(0, 1, 0);
  const lookM = new THREE.Matrix4();
  function placeTrain(t) {
    const p = route.getPointAt(t);
    const tan = route.getTangentAt(t).normalize();
    train.position.copy(p);
    lookM.lookAt(new THREE.Vector3(0, 0, 0), tan, up);
    train.quaternion.setFromRotationMatrix(lookM);
  }
  placeTrain(0);

  // ---------- celebration particles ----------
  const bursts = [];
  const PALETTE = [0xff3b4e, 0xff7a90, 0xffd1dc, 0xffc857, 0xffffff];

  function spawnFirework(origin) {
    const N = 70;
    const positions = new Float32Array(N * 3);
    const cols = new Float32Array(N * 3);
    const vel = [];
    const base = new THREE.Color(PALETTE[(Math.random() * PALETTE.length) | 0]);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      const speed = 8 + Math.random() * 12;
      vel.push(dir.multiplyScalar(speed));
      const c = base.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const m = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pts = new THREE.Points(g, m);
    scene.add(pts);
    bursts.push({ pts, vel, life: 0, max: 1.8, kind: 'firework' });
  }

  // heart sprite texture
  function heartTexture() {
    const s = 64;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    const x = s / 2,
      y = s * 0.36,
      w = s * 0.42;
    ctx.moveTo(x, y + w * 0.3);
    ctx.bezierCurveTo(x, y, x - w, y - w * 0.1, x - w, y + w * 0.35);
    ctx.bezierCurveTo(x - w, y + w * 0.8, x, y + w * 1.05, x, y + w * 1.4);
    ctx.bezierCurveTo(x, y + w * 1.05, x + w, y + w * 0.8, x + w, y + w * 0.35);
    ctx.bezierCurveTo(x + w, y - w * 0.1, x, y, x, y + w * 0.3);
    ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    return tex;
  }
  const heartTex = heartTexture();

  function spawnHearts(origin, count) {
    const positions = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x + (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = origin.y + Math.random() * 4;
      positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 10;
      vel.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          6 + Math.random() * 6,
          (Math.random() - 0.5) * 2
        )
      );
      const c = new THREE.Color(
        Math.random() < 0.5 ? 0xff3b4e : 0xff8aa3
      );
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const m = new THREE.PointsMaterial({
      size: 5.5,
      map: heartTex,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      alphaTest: 0.1,
    });
    const pts = new THREE.Points(g, m);
    scene.add(pts);
    bursts.push({ pts, vel, life: 0, max: 3.2, kind: 'heart' });
  }

  function updateBursts(dt) {
    for (let b = bursts.length - 1; b >= 0; b--) {
      const burst = bursts[b];
      burst.life += dt;
      const arr = burst.pts.geometry.attributes.position.array;
      const gravity = burst.kind === 'firework' ? 9 : 1.5;
      const drag = burst.kind === 'firework' ? 1.8 : 0.6;
      for (let i = 0; i < burst.vel.length; i++) {
        const v = burst.vel[i];
        v.y -= gravity * dt;
        v.multiplyScalar(1 - drag * dt * 0.16);
        arr[i * 3] += v.x * dt;
        arr[i * 3 + 1] += v.y * dt;
        arr[i * 3 + 2] += v.z * dt;
      }
      burst.pts.geometry.attributes.position.needsUpdate = true;
      burst.pts.material.opacity = Math.max(0, 1 - burst.life / burst.max);
      if (burst.life >= burst.max) {
        scene.remove(burst.pts);
        burst.pts.geometry.dispose();
        burst.pts.material.dispose();
        bursts.splice(b, 1);
      }
    }
  }

  // ---- label projection ----
  const proj = new THREE.Vector3();
  function projectLabel(el, point) {
    proj.copy(point).project(camera);
    const x = (proj.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-proj.y * 0.5 + 0.5) * window.innerHeight;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.display = proj.z > 1 ? 'none' : 'block';
  }

  // ---- camera framing ----
  function setCamera(time) {
    const angle = -0.55 + Math.sin(time * 0.08) * 0.06;
    const radius = 165;
    const height = 108;
    camera.position.set(
      Math.sin(angle) * radius,
      height,
      Math.cos(angle) * radius + 18
    );
    camera.lookAt(camTarget);
  }

  // ---- timeline ----
  const clock = new THREE.Clock();
  let elapsed = 0;
  let phase = 'idle';
  let travelT = 0;
  const TRAVEL = 8.5; // seconds
  const START_DELAY = 1.1;
  let celebrating = false;
  let celebrateTime = 0;
  let lastFirework = 0;
  let heartTimer = 0;
  let running = false;

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    setCamera(elapsed);

    if (phase === 'travel') {
      const raw = Math.min(1, (elapsed - START_DELAY) / TRAVEL);
      travelT = easeInOut(raw);
      placeTrain(travelT);
      const idx = Math.floor((tubeIndexCount * travelT) / 3) * 3;
      tubeGeo.setDrawRange(0, idx);
      glowGeo.setDrawRange(0, idx);
      // bob + headlight flicker
      train.position.y += Math.sin(elapsed * 14) * 0.05;
      if (raw >= 1) {
        phase = 'arrived';
        celebrating = true;
        celebrateTime = 0;
        finale.classList.add('show');
        if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 60]);
      }
    }

    if (celebrating) {
      celebrateTime += dt;
      lastFirework -= dt;
      heartTimer -= dt;
      const burstOrigin = endPt.clone().add(new THREE.Vector3(0, 12, 0));
      if (lastFirework <= 0 && celebrateTime < 7.5) {
        spawnFirework(
          burstOrigin
            .clone()
            .add(
              new THREE.Vector3(
                (Math.random() - 0.5) * 26,
                Math.random() * 16,
                (Math.random() - 0.5) * 26
              )
            )
        );
        lastFirework = 0.4 + Math.random() * 0.35;
      }
      if (heartTimer <= 0 && celebrateTime < 9.5) {
        spawnHearts(endPt.clone().add(new THREE.Vector3(0, 5, 0)), 18);
        heartTimer = 0.5;
      }
    }

    updateBursts(dt);

    projectLabel(labelStart, startPt);
    projectLabel(labelEnd, endPt);

    renderer.render(scene, camera);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function start() {
    running = true;
    clock.start();
    loop();
    // hide loader and kick off the trip once the first frames are up
    requestAnimationFrame(() => {
      loading.classList.add('gone');
      labelStart.classList.add('show');
      setTimeout(() => labelEnd.classList.add('show'), 600);
      phase = 'travel';
      elapsed = 0;
    });
  }

  return { start, resize };
}
