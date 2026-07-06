/* ==========================================================================
   WitKoffie — 3D Sound Portal (Three.js)
   A top-down coffee cup built like a piece of audio gear:
   glowing outer ring (the cup circle of the brand mark), white ceramic rim,
   speaker-cone coffee surface with vinyl grooves, gold record label,
   bass pulse rings and rising steam.

   Interactive: moving the mouse over the coffee surface creates ripples
   that disturb the concentric grooves — like a spoon stirring the cup.

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
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 8.2);

  const portal = new THREE.Group();
  scene.add(portal);

  /* ---- canvas texture: coffee surface with cream swirl + grooves --------- */
  function makeCoffeeTexture() {
    var S = 1024;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var ctx = cv.getContext('2d');
    var c = S / 2;

    var grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, '#9c6b42');
    grad.addColorStop(0.45, '#bd8f5e');
    grad.addColorStop(0.85, '#e3cba3');
    grad.addColorStop(1, '#eedec0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c, c, c, 0, Math.PI * 2);
    ctx.fill();

    var labelR = S * 0.17;
    var n = 22;
    for (var i = 0; i < n; i++) {
      var r = labelR + ((c - 14 - labelR) * (i + 1)) / n;
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 ? 'rgba(100, 62, 34, 0.5)' : 'rgba(255, 250, 238, 0.6)';
      ctx.lineWidth = i % 2 ? 2.5 : 4;
      ctx.stroke();
    }

    var lab = ctx.createRadialGradient(c, c, 0, c, c, labelR);
    lab.addColorStop(0, '#d0a049');
    lab.addColorStop(1, '#a9772a');
    ctx.fillStyle = lab;
    ctx.beginPath();
    ctx.arc(c, c, labelR, 0, Math.PI * 2);
    ctx.fill();
    [0.94, 0.78].forEach(function (f, i) {
      ctx.beginPath();
      ctx.arc(c, c, labelR * f, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250, 232, 190,' + (0.85 - i * 0.3) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = '#fff8ea';
    ctx.beginPath();
    ctx.arc(c, c, labelR * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2712';
    ctx.beginPath();
    ctx.arc(c, c, labelR * 0.07, 0, Math.PI * 2);
    ctx.fill();

    var tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- canvas texture: soft radial glow (for halos) ----------------------- */
  function makeGlowTexture(inner, outer) {
    var S = 256;
    var cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var ctx = cv.getContext('2d');
    var g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    var tex = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- high-detail disc geometry (concentric rings for ripple vertex displacement) */
  function makeDiscGeometry(radius, rings, segments) {
    var verts = [];
    var uvs = [];
    var idx = [];

    verts.push(0, 0, 0);
    uvs.push(0.5, 0.5);

    for (var r = 1; r <= rings; r++) {
      var rad = (r / rings) * radius;
      var uvR = r / rings * 0.5;
      for (var s = 0; s < segments; s++) {
        var theta = (s / segments) * Math.PI * 2;
        var cosT = Math.cos(theta);
        var sinT = Math.sin(theta);
        verts.push(cosT * rad, sinT * rad, 0);
        uvs.push(0.5 + cosT * uvR, 0.5 + sinT * uvR);
      }
    }

    for (var s = 0; s < segments; s++) {
      idx.push(0, 1 + s, 1 + (s + 1) % segments);
    }

    for (var r = 1; r < rings; r++) {
      var off0 = 1 + (r - 1) * segments;
      var off1 = 1 + r * segments;
      for (var s = 0; s < segments; s++) {
        var s1 = (s + 1) % segments;
        idx.push(off0 + s, off1 + s, off1 + s1);
        idx.push(off0 + s, off1 + s1, off0 + s1);
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  /* ---- build the portal --------------------------------------------------- */

  var halo = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6),
    new THREE.MeshBasicMaterial({
      map: makeGlowTexture('rgba(214,154,58,0.25)', 'rgba(214,154,58,0)'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  halo.position.z = -0.6;
  portal.add(halo);

  var saucer = new THREE.Mesh(
    new THREE.CircleGeometry(2.42, 96),
    new THREE.MeshBasicMaterial({ color: COLORS.saucer })
  );
  saucer.position.z = -0.25;
  portal.add(saucer);

  var outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.45, 0.022, 12, 160),
    new THREE.MeshBasicMaterial({ color: COLORS.amber })
  );
  portal.add(outerRing);

  var outerRingGlow = new THREE.Mesh(
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

  var rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.13, 24, 128),
    new THREE.MeshBasicMaterial({ color: COLORS.warmWhite })
  );
  rim.position.z = 0.1;
  portal.add(rim);

  var handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.1, 16, 48, Math.PI),
    new THREE.MeshBasicMaterial({ color: COLORS.warmWhite })
  );
  handle.position.set(1.5, 0, 0.1);
  handle.rotation.z = -Math.PI / 2;
  portal.add(handle);

  // Coffee surface — high-detail disc for ripple vertex displacement
  var COFFEE_R = 1.44;
  var DISC_RINGS = 36;
  var DISC_SEGS = 72;
  var coneGeo = makeDiscGeometry(COFFEE_R, DISC_RINGS, DISC_SEGS);

  // Apply the parabolic speaker-cone dip and store base Z positions
  var pos = coneGeo.attributes.position;
  var vertCount = pos.count;
  var baseZ = new Float32Array(vertCount);
  for (var i = 0; i < vertCount; i++) {
    var x = pos.getX(i);
    var y = pos.getY(i);
    var r = Math.sqrt(x * x + y * y) / COFFEE_R;
    var z = -0.42 * (1 - r) * (1 - r);
    pos.setZ(i, z);
    baseZ[i] = z;
  }
  coneGeo.computeVertexNormals();

  var coffee = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({ map: makeCoffeeTexture() })
  );
  coffee.position.z = 0.16;
  portal.add(coffee);

  // Bass pulse rings
  var PULSES = 3;
  var pulses = [];
  for (var i = 0; i < PULSES; i++) {
    var m = new THREE.Mesh(
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
    m.userData.t = i / PULSES;
    portal.add(m);
    pulses.push(m);
  }

  // Steam particles
  var steamCount = 26;
  var steamGeo = new THREE.BufferGeometry();
  var steamPos = new Float32Array(steamCount * 3);
  var steamSeed = new Float32Array(steamCount);
  for (var i = 0; i < steamCount; i++) {
    steamSeed[i] = Math.random();
    steamPos[i * 3] = (Math.random() - 0.5) * 0.8;
    steamPos[i * 3 + 1] = Math.random() * 2.2;
    steamPos[i * 3 + 2] = 0.4;
  }
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
  var steam = new THREE.Points(
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

  /* ---- ripple interaction ------------------------------------------------- */
  var raycaster = new THREE.Raycaster();
  var pointerNDC = new THREE.Vector2(9, 9); // off-screen default
  var MAX_RIPPLES = 8;
  var ripples = [];       // { x, y, birth }  — positions in coffee local space
  var lastRipX = 999;
  var lastRipY = 999;
  var mouseOverCup = false;

  container.addEventListener('pointermove', function (e) {
    var rect = container.getBoundingClientRect();
    pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }, { passive: true });

  container.addEventListener('pointerleave', function () {
    pointerNDC.set(9, 9);
    mouseOverCup = false;
  }, { passive: true });

  /* ---- state / interaction ------------------------------------------------ */
  var soundActive = document.body.classList.contains('sound-on');
  var audioPlaying = false;
  var targetRX = 0, targetRY = 0;
  var scrollDepth = 0;
  var running = true;

  window.addEventListener('pointermove', function (e) {
    if (reducedMotion) return;
    var nx = (e.clientX / window.innerWidth) * 2 - 1;
    var ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRY = nx * 0.18;
    targetRX = ny * 0.15;
  }, { passive: true });

  window.addEventListener('scroll', function () {
    if (reducedMotion) return;
    scrollDepth = Math.min(window.scrollY / window.innerHeight, 1);
  }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running && !reducedMotion) requestAnimationFrame(tick);
  });

  window.addEventListener('wk:audio-playing', function () { audioPlaying = true; });
  window.addEventListener('wk:audio-stopped', function () { audioPlaying = false; });

  /* ---- sizing ------------------------------------------------------------- */
  function resize() {
    var w = container.clientWidth || 300;
    var h = container.clientHeight || w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (reducedMotion) renderer.render(scene, camera);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---- animation ---------------------------------------------------------- */
  var t = 0;
  function tick() {
    if (!running) return;
    t += 0.016;

    // slow vinyl spin
    coffee.rotation.z -= 0.0035 + (audioPlaying ? 0.006 : 0);

    // breathing pulse
    var energy = soundActive ? (audioPlaying ? 1 : 0.55) : 0.25;
    var breathe = 1 + Math.sin(t * 1.4) * 0.012 * (1 + energy);
    portal.scale.setScalar(breathe);

    // mouse tilt + scroll
    portal.rotation.x += (targetRX - portal.rotation.x) * 0.05;
    portal.rotation.y += (targetRY - portal.rotation.y) * 0.05;
    portal.rotation.z += 0.0006;
    camera.position.z = 7.2 + scrollDepth * 1.6;
    portal.position.y = scrollDepth * 0.7;

    // glow
    var glowBase = soundActive ? 0.3 : 0.14;
    outerRingGlow.material.opacity = glowBase + Math.sin(t * 2.1) * 0.05 * (1 + energy);
    halo.material.opacity = 0.55 + energy * 0.35;

    // bass pulse rings
    var pulseSpeed = audioPlaying ? 0.55 : (soundActive ? 0.3 : 0.16);
    pulses.forEach(function (p) {
      p.userData.t += 0.016 * pulseSpeed;
      if (p.userData.t > 1) p.userData.t -= 1;
      var f = p.userData.t;
      var s = 1.55 + f * 1.05;
      p.scale.setScalar(s);
      p.material.opacity = (1 - f) * 0.32 * (0.4 + energy);
    });

    // steam drift
    var sp = steam.geometry.attributes.position;
    for (var i = 0; i < steamCount; i++) {
      var y = sp.getY(i) + 0.006 + steamSeed[i] * 0.004;
      if (y > 2.4) y = 0.2;
      sp.setY(i, y);
      sp.setX(i, Math.sin(t * 0.8 + steamSeed[i] * 6.28 + y) * 0.28 * (y / 2.4 + 0.2));
    }
    sp.needsUpdate = true;

    /* ---- ripple: raycast + vertex displacement ---- */
    if (!reducedMotion) {
      raycaster.setFromCamera(pointerNDC, camera);
      var hits = raycaster.intersectObject(coffee);
      mouseOverCup = hits.length > 0;

      if (mouseOverCup) {
        var hitLocal = coffee.worldToLocal(hits[0].point.clone());
        var dx = hitLocal.x - lastRipX;
        var dy = hitLocal.y - lastRipY;
        if (dx * dx + dy * dy > 0.02) {
          ripples.push({ x: hitLocal.x, y: hitLocal.y, birth: t });
          if (ripples.length > MAX_RIPPLES) ripples.shift();
          lastRipX = hitLocal.x;
          lastRipY = hitLocal.y;
        }
      }

      // expire old ripples
      while (ripples.length && t - ripples[0].birth > 3) ripples.shift();

      // displace vertices
      var cpos = coffee.geometry.attributes.position;
      var hasRipples = ripples.length > 0;
      for (var i = 0; i < vertCount; i++) {
        var z = baseZ[i];
        if (hasRipples) {
          var vx = cpos.getX(i);
          var vy = cpos.getY(i);
          for (var j = 0; j < ripples.length; j++) {
            var rip = ripples[j];
            var rdx = vx - rip.x;
            var rdy = vy - rip.y;
            var dist = Math.sqrt(rdx * rdx + rdy * rdy);
            var age = t - rip.birth;
            // expanding ring wave
            var waveFront = age * 0.8;
            var distFromFront = Math.abs(dist - waveFront);
            var ringFalloff = Math.exp(-distFromFront * distFromFront * 8);
            var timeFade = Math.exp(-age * 1.2);
            var wave = Math.sin(dist * 14 - age * 5) * 0.035;
            z += wave * ringFalloff * timeFade;
          }
        }
        cpos.setZ(i, z);
      }
      if (hasRipples) {
        cpos.needsUpdate = true;
        coffee.geometry.computeVertexNormals();
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  if (reducedMotion) {
    outerRingGlow.material.opacity = 0.22;
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(tick);
  }

  /* ---- public API ---------------------------------------------------------- */
  window.WKPortal = {
    setSoundActive: function (on) {
      soundActive = !!on;
      if (reducedMotion) {
        outerRingGlow.material.opacity = on ? 0.4 : 0.22;
        renderer.render(scene, camera);
      }
    }
  };
})();
