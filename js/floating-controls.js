/**
 * floating-controls.js
 * Consolidates BGM, TTS, and Snow controls into a single draggable iOS 26 Liquid Glass bubble
 * that snaps to any of the 4 viewport edges (top/bottom/left/right) and expands on tap.
 */
(function () {
  const BUBBLE_SIZE = 58;
  const EDGE_MARGIN = 14;
  const DRAG_THRESHOLD_PX = 8;
  const STORAGE_KEY = 'controls_dock';

  const ICONS = {
    sliders: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2.2" fill="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2.2" fill="currentColor"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="18" r="2.2" fill="currentColor"/></svg>',
    musicOn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    musicOff: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>',
    shuffle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    ttsOn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
    ttsOff: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    snow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/></svg>',
    close: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  let rootEl = null;
  let bubbleEl = null;
  let panelEl = null;
  let bgmBtn = null;
  let trackLabelEl = null;
  let shuffleBtn = null;
  let ttsBtn = null;
  let snowBtn = null;

  let currentDock = { edge: 'right', ratio: 0.88 };
  let bubblePos = { x: 0, y: 0 };

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function loadDockState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && ['left', 'right', 'top', 'bottom'].includes(parsed.edge)) {
          const ratio = typeof parsed.ratio === 'number' && Number.isFinite(parsed.ratio)
            ? clamp(parsed.ratio, 0, 1)
            : 0.88;
          return { edge: parsed.edge, ratio: ratio };
        }
      }
    } catch (_) {}
    return { edge: 'right', ratio: 0.88 };
  }

  function saveDockState(dock) {
    currentDock = dock;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dock));
    } catch (_) {}
  }

  function getViewportSize() {
    return {
      vw: (document.documentElement && document.documentElement.clientWidth) || window.innerWidth || 1024,
      vh: (document.documentElement && document.documentElement.clientHeight) || window.innerHeight || 768
    };
  }

  function computeCoordsFromDock(dock) {
    const { vw, vh } = getViewportSize();
    const maxX = Math.max(EDGE_MARGIN, vw - BUBBLE_SIZE - EDGE_MARGIN);
    const maxY = Math.max(EDGE_MARGIN, vh - BUBBLE_SIZE - EDGE_MARGIN);
    const spanX = Math.max(0, maxX - EDGE_MARGIN);
    const spanY = Math.max(0, maxY - EDGE_MARGIN);

    switch (dock.edge) {
      case 'left':
        return { x: EDGE_MARGIN, y: Math.round(EDGE_MARGIN + dock.ratio * spanY) };
      case 'top':
        return { x: Math.round(EDGE_MARGIN + dock.ratio * spanX), y: EDGE_MARGIN };
      case 'bottom':
        return { x: Math.round(EDGE_MARGIN + dock.ratio * spanX), y: maxY };
      case 'right':
      default:
        return { x: maxX, y: Math.round(EDGE_MARGIN + dock.ratio * spanY) };
    }
  }

  function applyBubblePosition(x, y) {
    bubblePos = { x: x, y: y };
    if (bubbleEl) {
      bubbleEl.style.left = `${x}px`;
      bubbleEl.style.top = `${y}px`;
    }
  }

  function snapToNearestEdge(x, y) {
    const { vw, vh } = getViewportSize();
    const maxX = Math.max(EDGE_MARGIN, vw - BUBBLE_SIZE - EDGE_MARGIN);
    const maxY = Math.max(EDGE_MARGIN, vh - BUBBLE_SIZE - EDGE_MARGIN);
    const clampedX = clamp(x, EDGE_MARGIN, maxX);
    const clampedY = clamp(y, EDGE_MARGIN, maxY);

    const distances = [
      { edge: 'left', dist: clampedX },
      { edge: 'right', dist: Math.max(0, vw - (clampedX + BUBBLE_SIZE)) },
      { edge: 'top', dist: clampedY },
      { edge: 'bottom', dist: Math.max(0, vh - (clampedY + BUBBLE_SIZE)) }
    ];
    distances.sort((a, b) => a.dist - b.dist);
    const nearest = distances[0].edge;

    let ratio = 0.5;
    if (nearest === 'left' || nearest === 'right') {
      const spanY = maxY - EDGE_MARGIN;
      ratio = spanY > 0 ? clamp((clampedY - EDGE_MARGIN) / spanY, 0, 1) : 0.5;
    } else {
      const spanX = maxX - EDGE_MARGIN;
      ratio = spanX > 0 ? clamp((clampedX - EDGE_MARGIN) / spanX, 0, 1) : 0.5;
    }

    const nextDock = { edge: nearest, ratio: ratio };
    saveDockState(nextDock);
    if (rootEl) rootEl.dataset.edge = nearest;

    const snapped = computeCoordsFromDock(nextDock);
    applyBubblePosition(snapped.x, snapped.y);
    return nextDock;
  }

  function positionPanelNearBubble() {
    if (!panelEl || panelEl.hidden) return;
    const { vw, vh } = getViewportSize();
    const pw = panelEl.offsetWidth || 280;
    const ph = panelEl.offsetHeight || 260;

    let px = bubblePos.x;
    let py = bubblePos.y;

    if (bubblePos.x + pw > vw - EDGE_MARGIN) {
      px = bubblePos.x + BUBBLE_SIZE - pw;
    }
    if (bubblePos.y >= vh / 2) {
      py = bubblePos.y + BUBBLE_SIZE - ph;
    }

    px = clamp(px, EDGE_MARGIN, Math.max(EDGE_MARGIN, vw - pw - EDGE_MARGIN));
    py = clamp(py, EDGE_MARGIN, Math.max(EDGE_MARGIN, vh - ph - EDGE_MARGIN));

    panelEl.style.left = `${Math.round(px)}px`;
    panelEl.style.top = `${Math.round(py)}px`;
  }

  function setPillContent(btn, iconSvg, label) {
    if (!btn) return;
    btn.innerHTML = `${iconSvg}<span class="liquid-btn-label">${label}</span>`;
  }

  function syncControlsUI() {
    if (bgmBtn && window.BGMControl) {
      const on = window.BGMControl.isEnabled();
      setPillContent(bgmBtn, on ? ICONS.musicOn : ICONS.musicOff, on ? 'ดนตรี: เปิด' : 'ดนตรี: ปิด');
      bgmBtn.classList.toggle('active', on);
      bgmBtn.setAttribute('aria-pressed', String(on));
    }

    if (trackLabelEl && window.BGMControl) {
      const title = window.BGMControl.getCurrentTrackTitle() || 'เพลงคริสต์มาส';
      const textEl = trackLabelEl.querySelector('.liquid-track-text');
      if (textEl) {
        textEl.textContent = title;
      } else {
        trackLabelEl.textContent = title;
      }
      trackLabelEl.title = title;
    }

    if (ttsBtn && window.TTSControl) {
      const on = window.TTSControl.isEnabled();
      setPillContent(ttsBtn, on ? ICONS.ttsOn : ICONS.ttsOff, on ? 'เสียงอ่าน: เปิด' : 'เสียงอ่าน: ปิด');
      ttsBtn.classList.toggle('active', on);
      ttsBtn.setAttribute('aria-pressed', String(on));
    }

    if (snowBtn && window.SnowControl) {
      const on = window.SnowControl.isEnabled();
      setPillContent(snowBtn, ICONS.snow, on ? 'หิมะ: เปิด' : 'หิมะ: ปิด');
      snowBtn.classList.toggle('active', on);
      snowBtn.setAttribute('aria-pressed', String(on));
    }

    if (bubbleEl) {
      const dot = bubbleEl.querySelector('.liquid-bubble-dot');
      if (dot) {
        const bgmOn = window.BGMControl && window.BGMControl.isEnabled();
        const ttsOn = window.TTSControl && window.TTSControl.isEnabled();
        dot.style.background = bgmOn ? '#B71C1C' : ttsOn ? '#2E7D32' : '#78909C';
      }
    }
  }

  function openPanel() {
    if (!panelEl || !bubbleEl) return;
    syncControlsUI();
    bubbleEl.hidden = true;
    bubbleEl.setAttribute('aria-expanded', 'true');
    panelEl.hidden = false;
    positionPanelNearBubble();
  }

  function closePanel() {
    if (!panelEl || !bubbleEl) return;
    panelEl.hidden = true;
    bubbleEl.hidden = false;
    bubbleEl.setAttribute('aria-expanded', 'false');
    const coords = computeCoordsFromDock(currentDock);
    applyBubblePosition(coords.x, coords.y);
  }

  function initFloatingControls() {
    if (document.getElementById('liquid-controls-root')) return;

    // Remove any legacy standalone fixed buttons if present
    document.querySelectorAll('body > .bgm-toggle, body > .tts-toggle, body > .snow-toggle').forEach((el) => el.remove());

    rootEl = document.createElement('div');
    rootEl.id = 'liquid-controls-root';
    rootEl.className = 'liquid-controls-root';

    const svgFilters = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgFilters.setAttribute('width', '0');
    svgFilters.setAttribute('height', '0');
    svgFilters.setAttribute('aria-hidden', 'true');
    svgFilters.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none;';
    svgFilters.innerHTML = '<defs><filter id="ios26-liquid-glass-filter" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.04" numOctaves="2" seed="3" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';

    bubbleEl = document.createElement('button');
    bubbleEl.type = 'button';
    bubbleEl.id = 'liquid-glass-bubble';
    bubbleEl.className = 'liquid-glass-bubble';
    bubbleEl.setAttribute('aria-label', 'เปิดแผงควบคุมเสียงและเอฟเฟกต์');
    bubbleEl.setAttribute('aria-expanded', 'false');
    bubbleEl.innerHTML = `<span class="liquid-glass-lens" aria-hidden="true"></span>${ICONS.sliders}<span class="liquid-bubble-dot" aria-hidden="true"></span>`;

    panelEl = document.createElement('div');
    panelEl.id = 'liquid-glass-panel';
    panelEl.className = 'liquid-glass-panel';
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-label', 'แผงควบคุมเสียงและเอฟเฟกต์');
    panelEl.hidden = true;

    panelEl.innerHTML = `
      <span class="liquid-glass-lens" aria-hidden="true"></span>
      <div class="liquid-panel-header">
        <span class="liquid-panel-title">${ICONS.sliders}<span>แผงควบคุม</span></span>
        <button type="button" id="btn-close-controls" class="liquid-close-btn" aria-label="ปิดแผงควบคุม">${ICONS.close}</button>
      </div>
      <button type="button" id="ctrl-bgm-toggle" class="bgm-toggle"></button>
      <div class="liquid-track-row">
        <span id="ctrl-bgm-track" class="liquid-track-name">${ICONS.musicOn}<span class="liquid-track-text">กำลังเตรียมเพลง...</span></span>
        <button type="button" id="ctrl-bgm-random" class="liquid-shuffle-btn" aria-label="สุ่มเพลงใหม่">${ICONS.shuffle}<span>สุ่มเพลง</span></button>
      </div>
      <button type="button" id="ctrl-tts-toggle" class="tts-toggle"></button>
      <button type="button" id="ctrl-snow-toggle" class="snow-toggle"></button>
    `;

    rootEl.appendChild(svgFilters);
    rootEl.appendChild(bubbleEl);
    rootEl.appendChild(panelEl);
    document.body.appendChild(rootEl);

    bgmBtn = document.getElementById('ctrl-bgm-toggle');
    trackLabelEl = document.getElementById('ctrl-bgm-track');
    shuffleBtn = document.getElementById('ctrl-bgm-random');
    ttsBtn = document.getElementById('ctrl-tts-toggle');
    snowBtn = document.getElementById('ctrl-snow-toggle');

    currentDock = loadDockState();
    rootEl.dataset.edge = currentDock.edge;
    const initCoords = computeCoordsFromDock(currentDock);
    applyBubblePosition(initCoords.x, initCoords.y);

    // Drag & tap detection using Pointer Events
    let dragState = null;
    let suppressNextClick = false;

    bubbleEl.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      e.stopPropagation();
      dragState = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: bubblePos.x,
        origTop: bubblePos.y,
        moved: false
      };
      if (typeof bubbleEl.setPointerCapture === 'function') {
        try {
          bubbleEl.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    });

    bubbleEl.addEventListener('pointermove', (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        dragState.moved = true;
        bubbleEl.classList.add('dragging');
      }
      if (dragState.moved) {
        const { vw, vh } = getViewportSize();
        const nextX = clamp(dragState.origLeft + dx, EDGE_MARGIN, Math.max(EDGE_MARGIN, vw - BUBBLE_SIZE - EDGE_MARGIN));
        const nextY = clamp(dragState.origTop + dy, EDGE_MARGIN, Math.max(EDGE_MARGIN, vh - BUBBLE_SIZE - EDGE_MARGIN));
        applyBubblePosition(nextX, nextY);
      }
    });

    const finishPointer = (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const wasMoved = dragState.moved;
      dragState = null;
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 0);
      bubbleEl.classList.remove('dragging');
      if (typeof bubbleEl.releasePointerCapture === 'function') {
        try {
          bubbleEl.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
      if (wasMoved) {
        snapToNearestEdge(bubblePos.x, bubblePos.y);
      } else {
        openPanel();
      }
    };

    bubbleEl.addEventListener('pointerup', finishPointer);
    bubbleEl.addEventListener('pointercancel', finishPointer);

    bubbleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (suppressNextClick) {
        suppressNextClick = false;
        return;
      }
      openPanel();
    });

    // Keyboard accessibility (Enter / Space)
    bubbleEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPanel();
      }
    });

    document.getElementById('btn-close-controls').addEventListener('click', (e) => {
      e.stopPropagation();
      closePanel();
    });

    bgmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.BGMControl) {
        window.BGMControl.toggle();
      }
      syncControlsUI();
    });

    shuffleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.BGMControl) {
        window.BGMControl.nextRandomTrack();
      }
      syncControlsUI();
    });

    ttsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.TTSControl) {
        window.TTSControl.toggle();
      }
      syncControlsUI();
    });

    snowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.SnowControl) {
        window.SnowControl.toggle();
      }
      syncControlsUI();
    });

    window.addEventListener('bgm:statechange', syncControlsUI);
    window.addEventListener('tts:statechange', syncControlsUI);
    window.addEventListener('snow:statechange', syncControlsUI);

    window.addEventListener('resize', () => {
      const coords = computeCoordsFromDock(currentDock);
      applyBubblePosition(coords.x, coords.y);
      positionPanelNearBubble();
    });

    syncControlsUI();
  }

  window.FloatingControls = {
    openPanel: openPanel,
    closePanel: closePanel,
    snapToNearestEdge: snapToNearestEdge,
    getDock: () => currentDock,
    syncUI: syncControlsUI
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingControls);
  } else {
    initFloatingControls();
  }
})();
