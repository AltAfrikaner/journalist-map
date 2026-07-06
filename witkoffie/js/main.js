/* ==========================================================================
   WitKoffie — main site script
   Header, mobile menu, reveal-on-scroll, 3D card tilt, sound gate,
   preview buttons, releases rendering (music page) and the contact form.
   ========================================================================== */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

  /* ---- scroll progress bar ------------------------------------------------- */
  const progressBar = $('.scroll-progress');
  function onScrollProgress() {
    if (!progressBar) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? window.scrollY / h : 0;
    progressBar.style.transform = 'scaleX(' + Math.min(pct, 1) + ')';
  }

  /* ---- header: dark glass on scroll --------------------------------------- */
  const header = $('.site-header');
  function onScrollHeader() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 24);
    onScrollProgress();
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---- mobile menu --------------------------------------------------------- */
  const navToggle = $('.nav-toggle');
  const nav = $('.main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // close menu after choosing a link
    $$('.main-nav a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      })
    );
  }

  /* ---- reveal on scroll ----------------------------------------------------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      }),
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---- 3D hover tilt on cards ----------------------------------------------- */
  function attachTilt(card) {
    if (reducedMotion || !window.matchMedia('(hover: hover)').matches) return;
    const strength = 7;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.transform =
        'perspective(800px) rotateX(' + ((0.5 - py) * strength) + 'deg)' +
        ' rotateY(' + ((px - 0.5) * strength) + 'deg) translateY(-4px)';
      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  }
  $$('.tilt').forEach(attachTilt);

  /* ---- waveform bars: fill each .waveform with randomised spans -------------- */
  function buildWaveform(el) {
    if (el.childElementCount) return;
    const bars = parseInt(el.getAttribute('data-bars') || '18', 10);
    for (let i = 0; i < bars; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--i', i);
      s.style.setProperty('--h', (35 + Math.round(Math.random() * 55)) + '%');
      el.appendChild(s);
    }
  }
  $$('.waveform').forEach(buildWaveform);

  /* ---- sound gate: "Enter With Sound" ---------------------------------------- */
  // On the home page, capsules stay locked until the visitor opts into sound.
  // Nothing autoplays — the gate only unlocks the play buttons.
  const enterBtn = $('#enter-sound');
  const gated = $$('.play-btn[data-gated]');

  function setSoundOn(on, announce) {
    document.body.classList.toggle('sound-on', on);
    gated.forEach((btn) => btn.setAttribute('aria-disabled', on ? 'false' : 'true'));
    if (window.WKPortal) window.WKPortal.setSoundActive(on);
    try { sessionStorage.setItem('wk-sound-on', on ? '1' : ''); } catch (e) { /* private mode */ }
    if (on && announce) {
      const live = $('#sound-live');
      if (live) live.textContent = 'Sound on. Preview players are now active.';
    }
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => setSoundOn(true, true));
    let remembered = false;
    try { remembered = sessionStorage.getItem('wk-sound-on') === '1'; } catch (e) { /* ignore */ }
    setSoundOn(remembered, false);
  }

  /* ---- preview play buttons ---------------------------------------------------- */
  // Any element with data-audio-id + data-audio-src becomes a preview toggle.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-audio-id][data-audio-src]');
    if (!btn) return;
    if (btn.getAttribute('aria-disabled') === 'true') {
      const scope = btn.closest('[data-audio-scope]');
      const status = scope && scope.querySelector('.capsule-status');
      if (status) status.textContent = 'Click "Enter With Sound" above to activate previews.';
      return;
    }
    if (window.WKAudio) {
      window.WKAudio.playPreview(btn.getAttribute('data-audio-id'), btn.getAttribute('data-audio-src'));
    }
  });

  /* ---- releases (music page) ----------------------------------------------------- */
  const PLATFORMS = [
    { key: 'spotifyUrl', label: 'Spotify', icon: './assets/icons/spotify.svg' },
    { key: 'appleMusicUrl', label: 'Apple Music', icon: './assets/icons/apple-music.svg' },
    { key: 'youtubeUrl', label: 'YouTube', icon: './assets/icons/youtube.svg' },
    { key: 'distrokidUrl', label: 'DistroKid', icon: './assets/icons/distrokid.svg' }
  ];

  function platformButtons(release) {
    const wrap = document.createElement('div');
    wrap.className = 'platform-row';
    PLATFORMS.forEach((p) => {
      const url = release[p.key];
      if (!url) return; // empty -> hidden
      const img = '<img src="' + p.icon + '" alt="" aria-hidden="true">';
      if (url === '#') {
        // "#" -> visible but disabled "coming soon"
        const span = document.createElement('span');
        span.className = 'platform-btn disabled';
        span.setAttribute('aria-disabled', 'true');
        span.innerHTML = img + p.label;
        wrap.appendChild(span);
      } else {
        const a = document.createElement('a');
        a.className = 'platform-btn';
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', release.title + ' on ' + p.label);
        a.innerHTML = img + p.label;
        wrap.appendChild(a);
      }
    });
    return wrap;
  }

  function playerRow(id, src, label) {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.setAttribute('data-audio-scope', '');
    row.innerHTML =
      '<button class="play-btn" type="button" data-audio-id="' + id + '" data-audio-src="' + src + '"' +
      ' data-label="' + label + ' preview" aria-label="Play ' + label + ' preview" aria-pressed="false">' +
      '<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
      '<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>' +
      '</button>' +
      '<div class="waveform" data-bars="26" aria-hidden="true"></div>' +
      '<span class="capsule-status"></span>';
    buildWaveform(row.querySelector('.waveform'));
    return row;
  }

  function renderReleases() {
    const grid = $('#releases-grid');
    const featuredMount = $('#featured-release');
    const data = window.WK_RELEASES || [];
    if (!grid && !featuredMount) return;

    const featured = data.find((r) => r.featured) || data[0];

    if (featuredMount && featured) {
      const art = featuredMount.querySelector('[data-slot="cover"]');
      const title = featuredMount.querySelector('[data-slot="title"]');
      const date = featuredMount.querySelector('[data-slot="date"]');
      const desc = featuredMount.querySelector('[data-slot="desc"]');
      const player = featuredMount.querySelector('[data-slot="player"]');
      const links = featuredMount.querySelector('[data-slot="links"]');
      if (art) { art.src = featured.coverImage; art.alt = featured.title + ' cover art'; art.onerror = function() { this.onerror = null; this.src = './assets/images/release-placeholder.jpg'; }; }
      if (title) title.textContent = featured.title;
      if (date) date.textContent = featured.releaseDate;
      if (desc) desc.textContent = featured.description;
      if (player) player.appendChild(playerRow('featured-release', featured.previewAudio, featured.title));
      if (links) links.appendChild(platformButtons(featured));
    }

    if (grid) {
      data.forEach((r, i) => {
        const card = document.createElement('article');
        card.className = 'release-card glass-card tilt reveal';

        const cover = document.createElement('div');
        cover.className = 'cover';
        const img = document.createElement('img');
        img.src = r.coverImage;
        img.alt = r.title + ' cover art';
        img.loading = 'lazy';
        img.onerror = function() { this.onerror = null; this.src = './assets/images/release-placeholder.jpg'; };
        cover.appendChild(img);
        card.appendChild(cover);

        const body = document.createElement('div');
        body.className = 'body';
        const h3 = document.createElement('h3');
        h3.textContent = r.title;
        const date = document.createElement('span');
        date.className = 'release-date';
        date.textContent = r.releaseDate;
        const p = document.createElement('p');
        p.className = 'desc';
        p.textContent = r.description;
        body.appendChild(h3);
        body.appendChild(date);
        body.appendChild(p);
        body.appendChild(playerRow('release-' + i, r.previewAudio, r.title));
        body.appendChild(platformButtons(r));
        card.appendChild(body);

        grid.appendChild(card);
        attachTilt(card);
        card.classList.add('visible'); // already below the fold observer setup
      });
    }
  }
  renderReleases();

  /* ---- contact form: validated mailto ------------------------------------------ */
  const form = $('#contact-form');
  if (form) {
    const fields = {
      name: $('#cf-name'),
      email: $('#cf-email'),
      reason: $('#cf-reason'),
      message: $('#cf-message')
    };

    function setInvalid(input, invalid) {
      const field = input.closest('.field');
      if (field) field.classList.toggle('invalid', invalid);
      input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      return !invalid;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const okName = setInvalid(fields.name, fields.name.value.trim().length < 2);
      const okEmail = setInvalid(fields.email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim()));
      const okMsg = setInvalid(fields.message, fields.message.value.trim().length < 5);
      if (!okName || !okEmail || !okMsg) {
        const firstBad = form.querySelector('.field.invalid input, .field.invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      const reason = fields.reason.value || 'General';
      const subject = 'WitKoffie enquiry: ' + reason;
      const body =
        'Name: ' + fields.name.value.trim() + '\n' +
        'Email: ' + fields.email.value.trim() + '\n' +
        'Reason: ' + reason + '\n\n' +
        'Message:\n' + fields.message.value.trim();

      // Static site -> hand off to the visitor's own mail app.
      window.location.href =
        'mailto:witkoffie@outlook.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      const note = $('#form-status');
      if (note) note.textContent = 'Your email app should open now with the message pre-filled.';
    });

    // clear error state while typing
    Object.keys(fields).forEach((k) => {
      fields[k].addEventListener('input', () => setInvalid(fields[k], false));
    });
  }

  /* ---- footer bass pulse bars -------------------------------------------------- */
  $$('.footer-wave').forEach((el) => {
    for (let i = 0; i < 42; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--i', i);
      s.style.setProperty('--h', (30 + Math.round(Math.random() * 60)) + '%');
      el.appendChild(s);
    }
  });

  /* ---- footer year ---------------------------------------------------------------- */
  const yearEl = $('#footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
