/* ==========================================================================
   WitKoffie — 3D Sound Portal (Three.js)
   Interactive coffee cup with ripple effect — move the mouse over the
   coffee surface and the concentric grooves distort like a spoon stirring.
   ========================================================================== */

(function () {
  'use strict';

  var COLORS = {
    amber: 0xd69a3a,
    gold: 0xb9822b,
    cream: 0xf5e8d0,
    warmWhite: 0xfff8ea,
    saucer: 0x0b0907
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var container = document.getElementById('sound-portal');
  if (!container) return;
  var stage = container.closest('.portal-stage') || container;

  function showFallback() { stage.classList.add('no-webgl'); }

  if (typeof THREE === 'undefined') { showFallback(); return; }

  /* ---- renderer / scene -------------------------------------------------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    showFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 8.2);

  var portal = new THREE.Group();
  scene.add(portal);

  /* ---- canvas texture: coffee surface ------------------------------------- */
  function makeCoffeeTexture() {
    var S = 1024, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var ctx = cv.getContext('2d'), c = S / 2;

    var grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, '#9c6b42');
    grad.addColorStop(0.45, '#bd8f5e');
    grad.addColorStop(0.85, '#e3cba3');
    grad.addColorStop(1, '#eedec0');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();

    var labelR = S * 0.17, n = 22;
    for (var i = 0; i < n; i++) {
      var r = labelR + ((c - 14 - labelR) * (i + 1)) / n;
      ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 ? 'rgba(100,62,34,0.5)' : 'rgba(255,250,238,0.6)';
      ctx.lineWidth = i % 2 ? 2.5 : 4;
      ctx.stroke();
    }

    var lab = ctx.createRadialGradient(c, c, 0, c, c, labelR);
    lab.addColorStop(0, '#d0a049'); lab.addColorStop(1, '#a9772a');
    ctx.fillStyle = lab;
    ctx.beginPath(); ctx.arc(c, c, labelR, 0, Math.PI * 2); ctx.fill();
    [0.94, 0.78].forEach(function (f, i) {
      ctx.beginPath(); ctx.arc(c, c, labelR * f, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(250,232,190,' + (0.85 - i * 0.3) + ')';
      ctx.lineWidth = 2; ctx.stroke();
    });
    ctx.fillStyle = '#fff8ea';
    ctx.beginPath(); ctx.arc(c, c, labelR * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2712';
    ctx.beginPath(); ctx.arc(c, c, labelR * 0.07, 0, Math.PI * 2); ctx.fill();

    var tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- glow texture ------------------------------------------------------- */
  function makeGlowTexture(inner, outer) {
    var S = 256, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    var ctx = cv.getContext('2d');
    var g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    var tex = new THREE.CanvasTexture(cv);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---- high-detail disc geometry ------------------------------------------ */
  function makeDiscGeometry(radius, rings, segments) {
    var verts = [], uvs = [], idx = [];
    verts.push(0, 0, 0); uvs.push(0.5, 0.5);
    for (var r = 1; r <= rings; r++) {
      var rad = (r / rings) * radius, uvR = r / rings * 0.5;
      for (var s = 0; s < segments; s++) {
        var theta = (s / segments) * Math.PI * 2;
        var ct = Math.cos(theta), st = Math.sin(theta);
        verts.push(ct * rad, st * rad, 0);
        uvs.push(0.5 + ct * uvR, 0.5 + st * uvR);
      }
    }
    for (var s = 0; s < segments; s++) {
      idx.push(0, 1 + s, 1 + (s + 1) % segments);
    }
    for (var r = 1; r < rings; r++) {
      var off0 = 1 + (r - 1) * segments, off1 = 1 + r * segments;
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
    geo.computeBoundingSphere();
    return geo;
  }

  /* ---- build the portal --------------------------------------------------- */
  var halo = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6),
    new THREE.MeshBasicMaterial({
      map: makeGlowTexture('rgba(214,154,58,0.25)', 'rgba(214,154,58,0)'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
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
      color: COLORS.amber, transparent: true, opacity: 0.16,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
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

  // Coffee surface
  var COFFEE_R = 1.44;
  var DISC_RINGS = 40;
  var DISC_SEGS = 80;
  var coneGeo = makeDiscGeometry(COFFEE_R, DISC_RINGS, DISC_SEGS);

  var pos = coneGeo.attributes.position;
  var vertCount = pos.count;
  var baseZ = new Float32Array(vertCount);
  for (var i = 0; i < vertCount; i++) {
    var x = pos.getX(i), y = pos.getY(i);
    var r = Math.sqrt(x * x + y * y) / COFFEE_R;
    var z = -0.42 * (1 - r) * (1 - r);
    pos.setZ(i, z);
    baseZ[i] = z;
  }
  coneGeo.computeVertexNormals();
  coneGeo.computeBoundingSphere();

  var coffee = new THREE.Mesh(
    coneGeo,
    new THREE.MeshBasicMaterial({ map: makeCoffeeTexture() })
  );
  coffee.position.z = 0.16;
  portal.add(coffee);

  // Bass pulse rings
  var PULSES = 3, pulses = [];
  for (var i = 0; i < PULSES; i++) {
    var m = new THREE.Mesh(
      new THREE.RingGeometry(0.96, 1.0, 96),
      new THREE.MeshBasicMaterial({
        color: COLORS.amber, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    );
    m.position.z = 0.05;
    m.userData.t = i / PULSES;
    portal.add(m);
    pulses.push(m);
  }

  // Steam
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
      color: COLORS.cream, size: 0.14,
      map: makeGlowTexture('rgba(255,248,234,0.8)', 'rgba(255,248,234,0)'),
      transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending
    })
  );
  portal.add(steam);

  /* ---- ripple system (direct coordinate mapping — no raycasting) ---------- */
  var MAX_RIPPLES = 10;
  var ripples = [];
  var lastRipX = 999, lastRipY = 999;
  var mouseOverCup = false;
  var mouseLocalX = 0, mouseLocalY = 0;
  var containerMX = 9, containerMY = 9;

  container.addEventListener('pointermove', function (e) {
    var rect = container.getBoundingClientRect();
    containerMX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    containerMY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }, { passive: true });

  container.addEventListener('pointerleave', function () {
    containerMX = 9; containerMY = 9;
    mouseOverCup = false;
  }, { passive: true });

  /* ---- state -------------------------------------------------------------- */
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

    coffee.rotation.z -= 0.0035 + (audioPlaying ? 0.006 : 0);

    var energy = soundActive ? (audioPlaying ? 1 : 0.55) : 0.25;
    var breathe = 1 + Math.sin(t * 1.4) * 0.012 * (1 + energy);
    portal.scale.setScalar(breathe);

    portal.rotation.x += (targetRX - portal.rotation.x) * 0.05;
    portal.rotation.y += (targetRY - portal.rotation.y) * 0.05;
    portal.rotation.z += 0.0006;
    camera.position.z = 7.2 + scrollDepth * 1.6;
    portal.position.y = scrollDepth * 0.7;

    var glowBase = soundActive ? 0.3 : 0.14;
    outerRingGlow.material.opacity = glowBase + Math.sin(t * 2.1) * 0.05 * (1 + energy);
    halo.material.opacity = 0.55 + energy * 0.35;

    var pulseSpeed = audioPlaying ? 0.55 : (soundActive ? 0.3 : 0.16);
    pulses.forEach(function (p) {
      p.userData.t += 0.016 * pulseSpeed;
      if (p.userData.t > 1) p.userData.t -= 1;
      var f = p.userData.t;
      p.scale.setScalar(1.55 + f * 1.05);
      p.material.opacity = (1 - f) * 0.32 * (0.4 + energy);
    });

    var sp = steam.geometry.attributes.position;
    for (var i = 0; i < steamCount; i++) {
      var y = sp.getY(i) + 0.006 + steamSeed[i] * 0.004;
      if (y > 2.4) y = 0.2;
      sp.setY(i, y);
      sp.setX(i, Math.sin(t * 0.8 + steamSeed[i] * 6.28 + y) * 0.28 * (y / 2.4 + 0.2));
    }
    sp.needsUpdate = true;

    /* ---- ripple: direct coordinate mapping ---- */
    if (!reducedMotion && Math.abs(containerMX) <= 1.1 && Math.abs(containerMY) <= 1.1) {
      var camZ = camera.position.z;
      var fovRad = camera.fov * Math.PI / 180;
      var halfH = Math.tan(fovRad * 0.5) * camZ;
      var halfW = halfH * camera.aspect;

      var worldX = containerMX * halfW;
      var worldY = containerMY * halfH;

      worldY -= portal.position.y;
      var sc = portal.scale.x;
      if (sc > 0) { worldX /= sc; worldY /= sc; }

      var dist = Math.sqrt(worldX * worldX + worldY * worldY);
      mouseOverCup = dist < COFFEE_R * 0.92;

      if (mouseOverCup) {
        var angle = -coffee.rotation.z;
        var cosA = Math.cos(angle), sinA = Math.sin(angle);
        mouseLocalX = worldX * cosA - worldY * sinA;
        mouseLocalY = worldX * sinA + worldY * cosA;

        var dx = mouseLocalX - lastRipX;
        var dy = mouseLocalY - lastRipY;
        if (dx * dx + dy * dy > 0.008) {
          ripples.push({ x: mouseLocalX, y: mouseLocalY, birth: t });
          if (ripples.length > MAX_RIPPLES) ripples.shift();
          lastRipX = mouseLocalX;
          lastRipY = mouseLocalY;
        }
      }
    } else {
      mouseOverCup = false;
    }

    while (ripples.length && t - ripples[0].birth > 3.5) ripples.shift();

    var cpos = coffee.geometry.attributes.position;
    var hasRipples = ripples.length > 0;
    for (var i = 0; i < vertCount; i++) {
      var z = baseZ[i];
      if (hasRipples) {
        var vx = cpos.getX(i), vy = cpos.getY(i);
        for (var j = 0; j < ripples.length; j++) {
          var rip = ripples[j];
          var rdx = vx - rip.x, rdy = vy - rip.y;
          var d = Math.sqrt(rdx * rdx + rdy * rdy);
          var age = t - rip.birth;
          var waveFront = age * 0.7;
          var distFromFront = Math.abs(d - waveFront);
          var ringFalloff = Math.exp(-distFromFront * distFromFront * 5);
          var timeFade = Math.exp(-age * 0.9);
          var wave = Math.sin(d * 12 - age * 5) * 0.06;
          z += wave * ringFalloff * timeFade;
        }
      }
      cpos.setZ(i, z);
    }
    if (hasRipples) {
      cpos.needsUpdate = true;
      coffee.geometry.computeVertexNormals();
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
