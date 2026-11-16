(function () {
  let audioCtx = null;
  let isPlaying = false;
  let nextNoteTime = 0.0;
  let noteIdx = 0;
  let timerId = null;

  // Cute bubbly melody: [note, duration_in_beats]
  // F Major pentatonic for a sweet, cute Japanese theme style (My Melody theme feeling)
  const melody = [
    ["C5", 0.5], ["E5", 0.5], ["G5", 0.5], ["C6", 0.5],
    ["A5", 0.5], ["F5", 0.5], ["G5", 1.0],
    ["D5", 0.5], ["F5", 0.5], ["A5", 0.5], ["D6", 0.5],
    ["B5", 0.5], ["G5", 0.5], ["C6", 1.0],
    ["C5", 0.5], ["E5", 0.5], ["G5", 0.5], ["C6", 0.5],
    ["A5", 0.5], ["C6", 0.5], ["F6", 1.0],
    ["E6", 0.5], ["D6", 0.5], ["C6", 0.5], ["A5", 0.5],
    ["G5", 0.5], ["A5", 0.5], ["F5", 1.0]
  ];

  const noteFreqs = {
    "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46,
    "G5": 783.99, "A5": 880.00, "B5": 987.77, "C6": 1046.50,
    "D6": 1174.66, "E6": 1318.51, "F6": 1396.91
  };

  const tempo = 135; // Cute bouncy tempo
  const beatDuration = 60 / tempo;

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playNote(freq, startTime, duration) {
    if (!audioCtx) return;
    
    // Triangle wave gives a cute woodwind/flute-like sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    
    // Short release envelope for a bubbly, staccato feel
    gain.gain.setValueAtTime(0.08, startTime); // Keep BGM soft
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - 0.02);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function scheduler() {
    if (!isPlaying) return;
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

  function startBGM() {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!isPlaying) {
      isPlaying = true;
      nextNoteTime = audioCtx.currentTime + 0.05;
      noteIdx = 0;
      scheduler();
    }
  }

  function stopBGM() {
    if (isPlaying) {
      isPlaying = false;
      clearTimeout(timerId);
    }
  }

  function updateButtonUI(btn) {
    if (localStorage.getItem('bgm_enabled') === 'true') {
      btn.textContent = '🎵 ดนตรี: เปิด';
      btn.classList.add('active');
    } else {
      btn.textContent = '🔇 ดนตรี: ปิด';
      btn.classList.remove('active');
    }
  }

  function createBGMWidget() {
    const btn = document.createElement('button');
    btn.className = 'bgm-toggle';
    btn.setAttribute('aria-label', 'เปิดหรือปิดดนตรีประกอบ');
    
    const savedState = localStorage.getItem('bgm_enabled');
    if (savedState === null) {
      // Default to off to respect user autoplay restrictions
      localStorage.setItem('bgm_enabled', 'false');
    }
    
    updateButtonUI(btn);
    document.body.appendChild(btn);

    // Auto-attempt playing on first user click if enabled in storage
    const playAttempt = () => {
      if (localStorage.getItem('bgm_enabled') === 'true') {
        startBGM();
      }
      document.removeEventListener('click', playAttempt);
      document.removeEventListener('touchstart', playAttempt);
    };
    document.addEventListener('click', playAttempt);
    document.addEventListener('touchstart', playAttempt);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      
      if (localStorage.getItem('bgm_enabled') === 'true') {
        localStorage.setItem('bgm_enabled', 'false');
        stopBGM();
      } else {
        localStorage.setItem('bgm_enabled', 'true');
        startBGM();
      }
      updateButtonUI(btn);
    });
  }

  // Load widget once DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBGMWidget);
  } else {
    createBGMWidget();
  }
})();
