/* ==========================================================================
   WitKoffie — 3D Sound Portal (Three.js)
   A top-down coffee cup built like a piece of audio gear:
   glowing outer ring (the cup circle of the brand mark), white ceramic rim,
   speaker-cone coffee surface with vinyl grooves, gold record label,
   bass pulse rings and rising steam.

   Mounts into #sound-portal. If Three.js or WebGL is unavailable, the
   .portal-stage gets a "no-webgl" class and the CSS fallback is shown.
   ========================================================================== */

(function () {
  'use strict';

  const COLORS = {
    amber: 0xd69a3a,
    gold: 0xb9822b,
    cream: 0xf5e8d0,
    warmWhite: 0xfff8ea,
    saucer: 0x0b0907
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const container = document.getElementById('sound-portal');
  if (!container) return;
  const stage = container.closest('.portal-stage') || container;

  function showFallback() { stage.classList.add('no-webgl'); }

  if (typeof THREE === 'undefined') { showFallback(); return; }

  /* ---- renderer / scene -------------------------------------------------- */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    showFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 0, 7.2);

  const portal = new THREE.Group();
  scene.add(portal);

  /* ---- canvas texture: coffee surface with cream swirl + grooves --------- */
  function makeCoffeeTexture() {
    const S = 1024;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const c = S / 2;

    // cream at the edge -> warm tan at the centre (white coffee)
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, '#9c6b42');
    grad.addColorStop(0.45, '#bd8f5e');
    grad.addColorStop(0.85, '#e3cba3');
    grad.addColorStop(1, '#eedec0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();

    // vinyl grooves — alternating soft cream / coffee rings
    const labelR = S * 0.17;
    const n = 22;
    for (let i = 0; i < n; i++) {
      const r = labelR + ((c - 14 - labelR) * (i + 1)) / n;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 ? 'rgba(100, 62, 34, 0.5)' : 'rgba(255, 250, 238, 0.6)';
      ctx.lineWidth = i % 2 ? 2.5 : 4;
      ctx.stroke();
    }

    // gold record label with fine decorative rings
    const lab = ctx.createRadialGradient(c, c, 0, c, c, labelR);
    lab.addColorStop(0, '#d0a049');
    lab.addColorStop(1, '#a9772a');
    ctx.fillStyle = lab;
    ctx.beginPath();
    ctx.arc(c, c, labelR, 0, Math.PI * 2);
    ctx.fill();
    [0.94, 0.78].forEach((f, i) => {
      ctx.beginPath();
      ctx.arc(c, c, labelR * f, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250, 232, 190,' + (0.85 - i * 0.3) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // spindle
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.arc(c, c, labelR * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2712';
    ctx.beginPath();
    ctx.arc(c, c, labelR * 0.07, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace; // keep authored colours
    return tex;
  }

  /* ---- canvas texture: soft radial glow (for halos) ----------------------- */
  function makeGlowTexture(inner, outer) {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const tex = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- build the portal --------------------------------------------------- */

  // warm ambient halo behind everything
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6), // stays inside the camera view so no square edge shows
    new THREE.MeshBasicMaterial({
      map: makeGlowTexture('rgba(214,154,58,0.25)', 'rgba(214,154,58,0)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  halo.position.z = -0.6;
  portal.add(halo);

  // dark saucer disc inside the outer ring
  const saucer = new THREE.Mesh(
    new THREE.CircleGeometry(2.42, 96),
    new THREE.MeshBasicMaterial({ color: COLORS.saucer })
  );
  saucer.position.z = -0.25;
  portal.add(saucer);

  // glowing outer ring — the "cup circle" of the brand mark
  const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.45, 0.022, 12, 160),
    new THREE.MeshBasicMaterial({ color: COLORS.amber })
  );
  portal.add(outerRing);

  const outerRingGlow = new THREE.Mesh(
    new THREE.RingGeometry(2.28, 2.62, 128),
    new THREE.MeshBasicMaterial({
      color: COLORS.amber,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  );
  outerRingGlow.position.z = -0.01;
  portal.add(outerRingGlow);

  // white ceramic cup rim (a real torus, so mouse tilt reveals depth)
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.13, 24, 128),
    new THREE.MeshBasicMaterial({ color: COLORS.warmWhite })
  );
  rim.position.z = 0.1;
  portal.add(rim);

  // cup handle: half torus lying flat on the right, like the logo
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.1, 16, 48, Math.PI),
    new THREE.MeshBasicMaterial({ color: COLORS.warmWhite })
  );
  handle.position.set(1.5, 0, 0.1);
  handle.rotation.z = -Math.PI / 2; // opening faces the cup
  portal.add(handle);

  // coffee surface: a circle whose vertices dip toward the centre —
  // the speaker-cone. Planar UVs keep the swirl texture perfectly mapped.
  const coneGeo = new THREE.CircleGeometry(1.44, 96, 0, Math.PI * 2);
  {
    const pos = coneGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y) / 1.44;
      pos.setZ(i, -0.42 * (1 - r) * (1 - r)); // parabolic dip = cone depth
    }
    coneGeo.computeVertexNormals();
  }
  const coffee = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({ map: makeCoffeeTexture() })
  );
  coffee.position.z = 0.16;
  portal.add(coffee);

  // bass pulse rings — expand outward from the rim and fade
  const PULSES = 3;
  const pulses = [];
  for (let i = 0; i < PULSES; i++) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1.0, 96),
      new THREE.MeshBasicMaterial({
        color: COLORS.amber,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    m.position.z = 0.05;
    m.userData.t = i / PULSES; // stagger
    portal.add(m);
    pulses.push(m);
  }

  // steam — a few soft particles rising from the cup
  const steamCount = 26;
  const steamGeo = new THREE.BufferGeometry();
  const steamPos = new Float32Array(steamCount * 3);
  const steamSeed = new Float32Array(steamCount);
  for (let i = 0; i < steamCount; i++) {
    steamSeed[i] = Math.random();
    steamPos[i * 3] = (Math.random() - 0.5) * 0.8;
    steamPos[i * 3 + 1] = Math.random() * 2.2;
    steamPos[i * 3 + 2] = 0.4;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  const steam = new THREE.Points(
    steamGeo,
    new THREE.PointsMaterial({
      color: COLORS.cream,
      size: 0.14,
      map: makeGlowTexture('rgba(255,248,234,0.8)', 'rgba(255,248,234,0)'),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  portal.add(steam);

  /* ---- state / interaction ------------------------------------------------ */
  // Pick up the gate state if main.js already restored it this session.
  let soundActive = document.body.classList.contains('sound-on');
  let audioPlaying = false;  // true while a preview plays
  let targetRX = 0, targetRY = 0;
  let scrollDepth = 0;
  let running = true;

  window.addEventListener('pointermove', (e) => {
    if (reducedMotion) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRY = nx * 0.35;
    targetRX = ny * 0.3;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if (reducedMotion) return;
    scrollDepth = Math.min(window.scrollY / window.innerHeight, 1);
  }, { passive: true });

  // pause rendering when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reducedMotion) requestAnimationFrame(tick);
  });

  window.addEventListener('wk:audio-playing', () => { audioPlaying = true; });
  window.addEventListener('wk:audio-stopped', () => { audioPlaying = false; });

  /* ---- sizing ------------------------------------------------------------- */
  function resize() {
    const w = container.clientWidth || 300;
    const h = container.clientHeight || w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderer.render(scene, camera);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---- animation ---------------------------------------------------------- */
  let t = 0;
  function tick() {
    if (!running) return;
    t += 0.016;

    // slow vinyl spin
    coffee.rotation.z -= 0.0035 + (audioPlaying ? 0.006 : 0);

    // breathing pulse on the whole portal
    const energy = soundActive ? (audioPlaying ? 1 : 0.55) : 0.25;
    const breathe = 1 + Math.sin(t * 1.4) * 0.012 * (1 + energy);
    portal.scale.setScalar(breathe);

    // mouse tilt (eased) + scroll pushes the portal gently away
    portal.rotation.x += (targetRX - portal.rotation.x) * 0.05;
    portal.rotation.y += (targetRY - portal.rotation.y) * 0.05;
    portal.rotation.z += 0.0006;
    camera.position.z = 7.2 + scrollDepth * 1.6;
    portal.position.y = scrollDepth * 0.7;

    // glow strength — stronger once sound is on
    const glowBase = soundActive ? 0.3 : 0.14;
    outerRingGlow.material.opacity = glowBase + Math.sin(t * 2.1) * 0.05 * (1 + energy);
    halo.material.opacity = 0.55 + energy * 0.35;

    // bass pulse rings
    const pulseSpeed = audioPlaying ? 0.55 : (soundActive ? 0.3 : 0.16);
    pulses.forEach((p) => {
      p.userData.t += 0.016 * pulseSpeed;
      if (p.userData.t > 1) p.userData.t -= 1;
      const f = p.userData.t;
      const s = 1.55 + f * 1.05; // rim -> just inside outer ring
      p.scale.setScalar(s);
      p.material.opacity = (1 - f) * 0.32 * (0.4 + energy);
    });

    // steam drift
    const sp = steam.geometry.attributes.position;
    for (let i = 0; i < steamCount; i++) {
      let y = sp.getY(i) + 0.006 + steamSeed[i] * 0.004;
      if (y > 2.4) y = 0.2;
      sp.setY(i, y);
      sp.setX(i, Math.sin(t * 0.8 + steamSeed[i] * 6.28 + y) * 0.28 * (y / 2.4 + 0.2));
    }
    sp.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    // calm mode: one static, fully-lit frame — no motion
    outerRingGlow.material.opacity = 0.22;
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(tick);
  }

  /* ---- public API ---------------------------------------------------------- */
  window.WKPortal = {
    /** Called when the visitor clicks "Enter With Sound". */
    setSoundActive(on) {
      soundActive = !!on;
      if (reducedMotion) {
        outerRingGlow.material.opacity = on ? 0.4 : 0.22;
        renderer.render(scene, camera);
      }
    }
  };
})();
