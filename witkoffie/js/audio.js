/* ==========================================================================
   WitKoffie — Audio manager
   One shared preview player for the whole site.
   Rules: no autoplay, only one preview at a time, graceful handling of
   missing files ("Preview coming soon").
   Buttons opt in with:  data-audio-id  +  data-audio-src
   ========================================================================== */

(function () {
  'use strict';

  const WKAudio = {
    currentAudio: null,   // the <audio> element currently in use
    currentId: null,      // the data-audio-id currently playing

    /** Play a preview. If the same id is already playing, pause it instead. */
    playPreview(id, src) {
      // Toggling the capsule that is already playing -> pause it.
      if (this.currentId === id && this.currentAudio && !this.currentAudio.paused) {
        this.stopCurrent();
        return;
      }

      // A different preview was playing -> stop it first (never overlap).
      this.stopCurrent();

      const audio = new Audio(src);
      audio.preload = 'auto';
      this.currentAudio = audio;
      this.currentId = id;

      audio.addEventListener('ended', () => {
        if (this.currentId === id) this.stopCurrent();
      });

      // Missing / unloadable file -> friendly message instead of breaking.
      audio.addEventListener('error', () => {
        if (this.currentId === id) {
          this.currentAudio = null;
          this.currentId = null;
          this._setUI(id, false);
          this._markMissing(id);
        }
      });

      const started = audio.play();
      if (started && started.catch) {
        started
          .then(() => {
            this._setUI(id, true);
            this._emit('wk:audio-playing', id);
          })
          .catch(() => {
            // Autoplay policy or missing file — never leave a stuck UI.
            if (this.currentId === id) {
              this.currentAudio = null;
              this.currentId = null;
              this._setUI(id, false);
              this._markMissing(id);
            }
          });
      } else {
        this._setUI(id, true);
        this._emit('wk:audio-playing', id);
      }
    },

    /** Stop whatever is playing and reset its UI. */
    stopCurrent() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        try { this.currentAudio.currentTime = 0; } catch (e) { /* not seekable */ }
      }
      if (this.currentId !== null) this._setUI(this.currentId, false);
      this.currentAudio = null;
      this.currentId = null;
      this._emit('wk:audio-stopped');
    },

    /* ---- internal helpers ------------------------------------------------ */

    /** Toggle .playing on the button and its waveform, keep ARIA in sync. */
    _setUI(id, playing) {
      document.querySelectorAll('[data-audio-id="' + id + '"]').forEach((btn) => {
        btn.classList.toggle('playing', playing);
        btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
        const label = btn.getAttribute('data-label') || 'preview';
        btn.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + label);

        const scope = btn.closest('[data-audio-scope]') || btn.parentElement;
        if (scope) {
          const wave = scope.querySelector('.waveform');
          if (wave) wave.classList.toggle('playing', playing);
        }
      });
    },

    /** Show "Preview coming soon" next to a capsule whose file is missing. */
    _markMissing(id) {
      document.querySelectorAll('[data-audio-id="' + id + '"]').forEach((btn) => {
        const scope = btn.closest('[data-audio-scope]') || btn.parentElement;
        const status = scope ? scope.querySelector('.capsule-status') : null;
        if (status) {
          status.textContent = 'Preview coming soon';
          status.classList.add('missing');
        }
      });
    },

    /** Let the rest of the site (e.g. the 3D portal) react to playback. */
    _emit(name, id) {
      window.dispatchEvent(new CustomEvent(name, { detail: { id: id || null } }));
    }
  };

  // Pause previews when the tab is hidden — polite on mobile.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) WKAudio.stopCurrent();
  });

  window.WKAudio = WKAudio;
})();
