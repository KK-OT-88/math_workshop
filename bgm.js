(function () {
  const TRACKS = [
    { id: 'jingle-bells', title: 'Jingle Bells', type: 'mp3', src: 'assets/audio/jingle-bells.mp3' },
    { id: 'we-wish', title: 'We Wish You a Merry Christmas', type: 'mp3', src: 'assets/audio/we-wish-you-a-merry-christmas.mp3' },
    { id: 'deck-the-halls', title: 'Deck the Halls', type: 'mp3', src: 'assets/audio/deck-the-halls.mp3' },
    { id: 'up-on-a-housetop', title: 'Up on a Housetop', type: 'mp3', src: 'assets/audio/up-on-a-housetop.mp3' },
    { id: 'synth-bubbly', title: 'ทำนองคริสต์มาสแสนสนุก', type: 'synth' }
  ];

  let audioCtx = null;
  let masterGain = null;
  let mediaElementSource = null;
  let useDirectVolumeDucking = false;
  let isDucked = false;

  let isPlaying = false;
  let nextNoteTime = 0.0;
  let noteIdx = 0;
  let timerId = null;

  let currentTrack = null;
  let activeSectionKey = null;

  const bgmAudioEl = new Audio();
  bgmAudioEl.loop = true;
  bgmAudioEl.preload = 'auto';

  // Original cute bubbly melody (Track #6 fallback / synth track)
  const melody = [
    ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5],
    ['A5', 0.5], ['F5', 0.5], ['G5', 1.0],
    ['D5', 0.5], ['F5', 0.5], ['A5', 0.5], ['D6', 0.5],
    ['B5', 0.5], ['G5', 0.5], ['C6', 1.0],
    ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5],
    ['A5', 0.5], ['C6', 0.5], ['F6', 1.0],
    ['E6', 0.5], ['D6', 0.5], ['C6', 0.5], ['A5', 0.5],
    ['G5', 0.5], ['A5', 0.5], ['F5', 1.0]
  ];

  const noteFreqs = {
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
    G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5,
    D6: 1174.66, E6: 1318.51, F6: 1396.91
  };

  const tempo = 135;
  const beatDuration = 60 / tempo;

  function isEnabled() {
    return localStorage.getItem('bgm_enabled') === 'true';
  }

  function emitStateChange() {
    window.dispatchEvent(
      new CustomEvent('bgm:statechange', {
        detail: { enabled: isEnabled(), track: currentTrack }
      })
    );
  }

  function initAudio() {
    if (!audioCtx) {
      if ('audioSession' in navigator && navigator.audioSession.type !== 'playback') {
        try {
          navigator.audioSession.type = 'playback';
        } catch (_) {}
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isDucked ? 0.25 : 1.0, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }

    if (audioCtx && !mediaElementSource && !useDirectVolumeDucking) {
      if (window.location.protocol === 'file:') {
        useDirectVolumeDucking = true;
      } else {
        try {
          mediaElementSource = audioCtx.createMediaElementSource(bgmAudioEl);
          mediaElementSource.connect(masterGain);
        } catch (_) {
          useDirectVolumeDucking = true;
        }
      }
    }
  }

  function playNote(freq, startTime, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.08, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.02);

    osc.connect(gain);
    gain.connect(masterGain || audioCtx.destination);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function scheduler() {
    if (!isPlaying || !currentTrack || currentTrack.type !== 'synth') return;
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
      const currentNote = melody[noteIdx];
      const freq = noteFreqs[currentNote[0]];
      const duration = currentNote[1] * beatDuration;
      playNote(freq, nextNoteTime, duration);
      nextNoteTime += duration;
      noteIdx = (noteIdx + 1) % melody.length;
    }
    timerId = setTimeout(scheduler, 25);
  }

  function stopSynth() {
    isPlaying = false;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function pickRandomTrack(excludeId) {
    const candidates = TRACKS.filter((t) => t.id !== excludeId);
    const pool = candidates.length > 0 ? candidates : TRACKS;
    currentTrack = pool[Math.floor(Math.random() * pool.length)];
    localStorage.setItem('bgm_last_track', currentTrack.id);
    emitStateChange();
    return currentTrack;
  }

  function startSynth() {
    bgmAudioEl.pause();
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (!isPlaying) {
      isPlaying = true;
      nextNoteTime = audioCtx.currentTime + 0.05;
      noteIdx = 0;
      scheduler();
    }
  }

  function startBGM() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (!currentTrack) {
      pickRandomTrack(localStorage.getItem('bgm_last_track'));
    }

    if (currentTrack.type === 'mp3') {
      stopSynth();
      if (bgmAudioEl.getAttribute('data-track-id') !== currentTrack.id) {
        bgmAudioEl.src = currentTrack.src;
        bgmAudioEl.setAttribute('data-track-id', currentTrack.id);
      }
      bgmAudioEl.volume = useDirectVolumeDucking && isDucked ? 0.25 : 1.0;
      const playPromise = bgmAudioEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((err) => {
          if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
            return;
          }
          // Media/network fallback to local synth melody
          const synthTrack = TRACKS.find((t) => t.type === 'synth');
          if (synthTrack && isEnabled()) {
            currentTrack = synthTrack;
            emitStateChange();
            startSynth();
          }
        });
      }
    } else {
      startSynth();
    }
  }

  function stopBGM() {
    stopSynth();
    bgmAudioEl.pause();
  }

  function nextRandomTrack() {
    const prevId = currentTrack ? currentTrack.id : localStorage.getItem('bgm_last_track');
    pickRandomTrack(prevId);
    if (isEnabled()) {
      startBGM();
    }
    return currentTrack;
  }

  function onSectionChange(sectionKey) {
    if (!sectionKey || sectionKey === activeSectionKey) return;
    activeSectionKey = sectionKey;
    sessionStorage.setItem('bgm_last_context', sectionKey);
    nextRandomTrack();
  }

  function toggleBGM() {
    initAudio();
    const next = !isEnabled();
    localStorage.setItem('bgm_enabled', String(next));
    if (next) {
      startBGM();
    } else {
      stopBGM();
    }
    emitStateChange();
    return next;
  }

  function initBGMContext() {
    if (localStorage.getItem('bgm_enabled') === null) {
      localStorage.setItem('bgm_enabled', 'false');
    }

    const body = document.body;
    const ctxKey = (body && (body.dataset.topic || body.dataset.topics)) || 'home';
    activeSectionKey = body && body.dataset.topic ? body.dataset.topic : null;

    const lastCtx = sessionStorage.getItem('bgm_last_context');
    const lastTrackId = localStorage.getItem('bgm_last_track');

    if (!lastCtx || lastCtx !== ctxKey) {
      pickRandomTrack(lastTrackId);
      sessionStorage.setItem('bgm_last_context', ctxKey);
    } else {
      currentTrack = TRACKS.find((t) => t.id === lastTrackId) || pickRandomTrack(null);
    }

    const hasFloatingControls =
      Boolean(document.querySelector('script[src*="floating-controls.js"]')) ||
      typeof window.FloatingControls !== 'undefined';

    if (!hasFloatingControls) {
      const btn = document.createElement('button');
      btn.className = 'bgm-toggle';
      btn.setAttribute('aria-label', 'เปิดหรือปิดดนตรีประกอบ');
      const updateLegacyUI = () => {
        if (isEnabled()) {
          btn.textContent = '🎵 ดนตรี: เปิด';
          btn.classList.add('active');
        } else {
          btn.textContent = '🔇 ดนตรี: ปิด';
          btn.classList.remove('active');
        }
      };
      updateLegacyUI();
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBGM();
        updateLegacyUI();
      });
      document.body.appendChild(btn);
    }

    const playAttempt = () => {
      if (isEnabled()) {
        startBGM();
      }
      document.removeEventListener('click', playAttempt);
      document.removeEventListener('touchstart', playAttempt);
    };
    document.addEventListener('click', playAttempt);
    document.addEventListener('touchstart', playAttempt);

    emitStateChange();
  }

  window.duckBGM = function () {
    isDucked = true;
    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(0.25, audioCtx.currentTime, 0.05);
    }
    if (useDirectVolumeDucking) {
      bgmAudioEl.volume = 0.25;
    }
  };

  window.unduckBGM = function () {
    isDucked = false;
    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.15);
    }
    if (useDirectVolumeDucking) {
      bgmAudioEl.volume = 1.0;
    }
  };

  window.getSharedAudioContext = function () {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  };

  window.BGMControl = {
    tracks: TRACKS,
    isEnabled: isEnabled,
    getCurrentTrack: () => currentTrack,
    getCurrentTrackTitle: () => (currentTrack ? currentTrack.title : ''),
    toggle: toggleBGM,
    nextRandomTrack: nextRandomTrack,
    onSectionChange: onSectionChange,
    unlockAndResume: () => {
      initAudio();
      if (isEnabled()) startBGM();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBGMContext);
  } else {
    initBGMContext();
  }
})();
