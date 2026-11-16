/**
 * christmas-fx.js
 * Gentle CSS snowfall overlay with toggle button and reduced-motion support.
 */
(function () {
  const SNOW_COUNT = 28;
  const GLYPHS = ['❄', '❅', '❆'];
  let snowLayer = null;
  let toggleBtn = null;

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function isSnowEnabled() {
    if (prefersReducedMotion()) return false;
    const saved = localStorage.getItem('snow_enabled');
    return saved === null ? true : saved === 'true';
  }

  function buildSnowflakes() {
    if (!snowLayer) return;
    snowLayer.innerHTML = '';
    for (let i = 0; i < SNOW_COUNT; i++) {
      const flake = document.createElement('span');
      flake.className = 'snowflake';
      flake.textContent = GLYPHS[i % GLYPHS.length];
      flake.style.left = `${((i * 37) % 98) + 1}%`;
      flake.style.fontSize = `${14 + (i % 4) * 5}px`;
      flake.style.animationDuration = `${7 + (i % 6) * 2.1}s`;
      flake.style.animationDelay = `${-(i % 7) * 1.4}s`;
      snowLayer.appendChild(flake);
    }
  }

  function syncSnowUI() {
    const enabled = isSnowEnabled();
    if (snowLayer) {
      snowLayer.style.display = enabled ? 'block' : 'none';
    }
    if (toggleBtn) {
      toggleBtn.textContent = enabled ? '❄️ หิมะ: เปิด' : '❄️ หิมะ: ปิด';
      toggleBtn.classList.toggle('active', enabled);
      toggleBtn.setAttribute('aria-pressed', String(enabled));
    }
  }

  function toggleSnow() {
    if (prefersReducedMotion()) return false;
    const next = !isSnowEnabled();
    localStorage.setItem('snow_enabled', String(next));
    syncSnowUI();
    window.dispatchEvent(new CustomEvent('snow:statechange', { detail: { enabled: next } }));
    return next;
  }

  function initChristmasFX() {
    if (document.getElementById('christmas-snow-layer')) return;

    if (localStorage.getItem('snow_enabled') === null) {
      localStorage.setItem('snow_enabled', 'true');
    }

    snowLayer = document.createElement('div');
    snowLayer.id = 'christmas-snow-layer';
    snowLayer.className = 'snow-layer';
    snowLayer.setAttribute('aria-hidden', 'true');
    buildSnowflakes();
    document.body.prepend(snowLayer);

    const hasFloatingControls =
      Boolean(document.querySelector('script[src*="floating-controls.js"]')) ||
      typeof window.FloatingControls !== 'undefined';

    if (!hasFloatingControls) {
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'snow-toggle';
      toggleBtn.setAttribute('aria-label', 'เปิดหรือปิดหิมะตก');
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSnow();
      });
      document.body.appendChild(toggleBtn);
    }

    syncSnowUI();
  }

  window.SnowControl = {
    isEnabled: isSnowEnabled,
    isReducedMotion: prefersReducedMotion,
    toggle: toggleSnow
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChristmasFX);
  } else {
    initChristmasFX();
  }
})();
