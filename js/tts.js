/**
 * tts.js
 * Hybrid Thai TTS Module for Math Workshop P.1 (ported from thai-worksheet-O3).
 * Uses Google Translate TTS proxy (/api/tts) with Web Audio WSOLA pitch-locked
 * time-stretching (1.25x Kawaii pitch) and automatic Web Speech API (th-TH) fallback.
 */
(function () {
  const TTS_SPEED_CONFIG = {
    lockedPitch: 1.25,
    wordSpeed: 1.15,
    spellingAndRiddleSpeed: 1.05,
    sentenceAndPraiseSpeed: 1.25
  };

  const DEFAULT_CHUNK_PAUSE_MS = 250;

  let currentThaiAudio = null;
  let currentBufferSource = null;
  let isTtsSpeaking = false;
  let ttsPlaySeq = 0;
  let chunkPauseTimer = null;

  let ttsAudioCtx = null;
  const decodedAudioCache = new Map();

  let onStartSpeakingCallback = null;
  let onEndSpeakingCallback = null;

  let activeUtterance = null;
  let currentThaiAudioCleanup = null;
  let ttsToggleBtn = null;

  function isTtsEnabled() {
    const saved = localStorage.getItem('tts_enabled');
    return saved === null ? true : saved === 'true';
  }

  function setBgmDuckingCallbacks(onStart, onEnd) {
    onStartSpeakingCallback = onStart;
    onEndSpeakingCallback = onEnd;
  }

  function triggerDuck() {
    isTtsSpeaking = true;
    if (typeof onStartSpeakingCallback === 'function') {
      onStartSpeakingCallback();
    } else if (typeof window.duckBGM === 'function') {
      window.duckBGM();
    }
  }

  function triggerUnduck() {
    isTtsSpeaking = false;
    if (typeof onEndSpeakingCallback === 'function') {
      onEndSpeakingCallback();
    } else if (typeof window.unduckBGM === 'function') {
      window.unduckBGM();
    }
  }

  function cancelAllAudio() {
    ttsPlaySeq++;

    if (chunkPauseTimer) {
      clearTimeout(chunkPauseTimer);
      chunkPauseTimer = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtterance = null;

    if (currentBufferSource) {
      try {
        currentBufferSource.onended = null;
        currentBufferSource.stop();
      } catch (_) {}
      currentBufferSource = null;
    }

    if (currentThaiAudio) {
      currentThaiAudio.isCancelled = true;
      currentThaiAudio.pause();
      if (typeof currentThaiAudioCleanup === 'function') {
        currentThaiAudioCleanup();
        currentThaiAudioCleanup = null;
      }
      currentThaiAudio = null;
    }

    isTtsSpeaking = false;
    triggerUnduck();
  }

  function splitTextChunks(text) {
    return String(text || '')
      .split(/[,|\r\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Classify spoken Thai math text into 3 speed tiers.
   */
  function classifyTtsTier(text) {
    const clean = String(text || '').trim();
    if (!clean) return 'word';

    if (clean.startsWith('แบบรูป') || clean.includes('อ่านว่า')) {
      return 'spelling';
    }

    if (
      /[\s,]/.test(clean) ||
      /(เท่ากับ|คูณ|บวก|ลบ|เหลือ|ทั้งหมด|เก่งมาก|ลองดู|มากกว่า|น้อยกว่า|ข้อ|คะแนน)/.test(clean) ||
      clean.length > 12
    ) {
      return 'sentence';
    }

    return 'word';
  }

  function resolveTtsSpeed(text, explicitSpeed = null) {
    if (typeof explicitSpeed === 'number' && Number.isFinite(explicitSpeed) && explicitSpeed > 0) {
      return explicitSpeed;
    }
    const tier = classifyTtsTier(text);
    if (tier === 'spelling') return TTS_SPEED_CONFIG.spellingAndRiddleSpeed;
    if (tier === 'sentence') return TTS_SPEED_CONFIG.sentenceAndPraiseSpeed;
    return TTS_SPEED_CONFIG.wordSpeed;
  }

  function ensureTtsAudioContext() {
    if (typeof window.getSharedAudioContext === 'function') {
      const shared = window.getSharedAudioContext();
      if (shared && typeof shared.decodeAudioData === 'function') {
        if (shared.state !== 'running' && typeof shared.resume === 'function') {
          return shared.resume().then(() => shared).catch(() => shared);
        }
        return Promise.resolve(shared);
      }
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || typeof AudioCtx.prototype.decodeAudioData !== 'function') {
      return Promise.resolve(null);
    }

    if ('audioSession' in navigator && navigator.audioSession.type !== 'playback') {
      try {
        navigator.audioSession.type = 'playback';
      } catch (_) {}
    }

    if (!ttsAudioCtx) {
      ttsAudioCtx = new AudioCtx();
    }

    if (ttsAudioCtx.state !== 'running' && typeof ttsAudioCtx.resume === 'function') {
      return ttsAudioCtx.resume().then(() => ttsAudioCtx).catch(() => ttsAudioCtx);
    }

    return Promise.resolve(ttsAudioCtx);
  }

  /**
   * Waveform Similarity Overlap-Add (WSOLA) pitch-preserving time-stretcher.
   */
  function wsolaTimeStretch(ctx, srcBuffer, alpha) {
    if (Math.abs(alpha - 1.0) < 0.005) {
      return srcBuffer;
    }

    const sampleRate = srcBuffer.sampleRate;
    const numChannels = srcBuffer.numberOfChannels;
    const inLen = srcBuffer.length;
    const winLen = Math.max(64, Math.round(0.028 * sampleRate) & ~1);
    const hs = winLen >> 1;

    if (inLen <= winLen * 2) {
      return srcBuffer;
    }

    const haNominal = hs / alpha;
    const searchRadius = Math.max(16, Math.round(0.012 * sampleRate));
    const outLen = Math.max(winLen, Math.round(inLen * alpha));

    const win = new Float32Array(winLen);
    for (let i = 0; i < winLen; i++) {
      win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / winLen));
    }

    const analysisCh = srcBuffer.getChannelData(0);
    const offsets = [0];
    let prevInOffset = 0;
    let outPos = 0;
    let step = 1;

    while (outPos + hs < outLen) {
      outPos += hs;
      const targetIn = Math.round(step * haNominal);
      const clampedTarget = Math.min(Math.max(0, targetIn), inLen - winLen);
      const naturalNext = prevInOffset + hs;

      let bestOffset = clampedTarget;
      const minSearch = Math.max(0, clampedTarget - searchRadius);
      const maxSearch = Math.min(inLen - winLen, clampedTarget + searchRadius);

      if (maxSearch > minSearch && naturalNext + hs <= inLen) {
        let energyRef = 0;
        for (let k = 0; k < hs; k += 2) {
          const a = analysisCh[naturalNext + k];
          energyRef += a * a;
        }

        if (energyRef > 1e-6) {
          let bestScore = -Infinity;
          for (let cand = minSearch; cand <= maxSearch; cand += 2) {
            let dot = 0;
            let e2 = 0;
            for (let k = 0; k < hs; k += 2) {
              const a = analysisCh[naturalNext + k];
              const b = analysisCh[cand + k];
              dot += a * b;
              e2 += b * b;
            }
            const score = dot / (Math.sqrt(energyRef * e2) + 1e-8);
            if (score > bestScore) {
              bestScore = score;
              bestOffset = cand;
            }
          }

          const fineStart = Math.max(minSearch, bestOffset - 1);
          const fineEnd = Math.min(maxSearch, bestOffset + 1);
          for (let cand = fineStart; cand <= fineEnd; cand++) {
            let dot = 0;
            let e2 = 0;
            for (let k = 0; k < hs; k++) {
              const a = analysisCh[naturalNext + k];
              const b = analysisCh[cand + k];
              dot += a * b;
              e2 += b * b;
            }
            const score = dot / (Math.sqrt(energyRef * e2) + 1e-8);
            if (score > bestScore) {
              bestScore = score;
              bestOffset = cand;
            }
          }
        }
      }

      offsets.push(bestOffset);
      prevInOffset = bestOffset;
      step++;
    }

    const outBuffer = ctx.createBuffer(numChannels, outLen, sampleRate);
    const norm = new Float32Array(outLen);

    for (let ch = 0; ch < numChannels; ch++) {
      const inputData = srcBuffer.getChannelData(ch);
      const outputData = outBuffer.getChannelData(ch);
      if (ch === 0) norm.fill(0);

      for (let f = 0; f < offsets.length; f++) {
        const frameOutStart = f * hs;
        const frameInStart = offsets[f];
        for (let i = 0; i < winLen; i++) {
          const oi = frameOutStart + i;
          const ii = frameInStart + i;
          if (oi >= outLen || ii >= inLen) break;
          outputData[oi] += inputData[ii] * win[i];
          if (ch === 0) norm[oi] += win[i];
        }
      }

      for (let i = 0; i < outLen; i++) {
        if (norm[i] > 1e-4) {
          outputData[i] /= norm[i];
        }
      }
    }

    return outBuffer;
  }

  function buildTtsUrl(apiBase, text) {
    return `${apiBase}/api/tts?q=${encodeURIComponent(text)}&tl=th`;
  }

  function startBufferSource(ctx, buffer, targetSpeed, pitchRatio, reqSeq, onEndedCallback) {
    if (reqSeq !== ttsPlaySeq) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitchRatio;
    source.connect(ctx.destination);
    currentBufferSource = source;

    source.onended = () => {
      if (currentBufferSource === source) {
        currentBufferSource = null;
      }
      if (reqSeq !== ttsPlaySeq) return;
      if (typeof onEndedCallback === 'function') {
        onEndedCallback();
      }
      if (!currentBufferSource && !currentThaiAudio && !activeUtterance) {
        triggerUnduck();
      }
    };

    source.start(0);
  }

  function playDecodedBuffer(ctx, decodedBuf, targetSpeed, pitchRatio, reqSeq, onEndedCallback) {
    if (reqSeq !== ttsPlaySeq) return;
    const stretchAlpha = pitchRatio / targetSpeed;
    const stretched = wsolaTimeStretch(ctx, decodedBuf, stretchAlpha);
    startBufferSource(ctx, stretched, targetSpeed, pitchRatio, reqSeq, onEndedCallback);
  }

  function concatenateAudioBuffers(ctx, buffers, pauseMs, pitchRatio) {
    const sampleRate = buffers[0].sampleRate;
    const numChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
    const gapFrames = Math.max(0, Math.round((pauseMs / 1000) * sampleRate * pitchRatio));

    let totalLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length;
      if (i < buffers.length - 1) {
        totalLength += gapFrames;
      }
    }

    const merged = ctx.createBuffer(numChannels, Math.max(1, totalLength), sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
      const outData = merged.getChannelData(ch);
      let offset = 0;
      for (let i = 0; i < buffers.length; i++) {
        const buf = buffers[i];
        const srcCh = Math.min(ch, buf.numberOfChannels - 1);
        outData.set(buf.getChannelData(srcCh), offset);
        offset += buf.length;
        if (i < buffers.length - 1) {
          offset += gapFrames;
        }
      }
    }

    return merged;
  }

  function playViaHtmlAudioElement(urlOrChunks, text, targetSpeed, reqSeq, onEndedCallback, apiBase = '') {
    if (reqSeq !== ttsPlaySeq) return;

    const chunks = Array.isArray(urlOrChunks) ? urlOrChunks : null;

    const playSingleUrl = (url, fallbackTarget, onSingleEnded) => {
      if (reqSeq !== ttsPlaySeq) return;

      const audioObj = new Audio(url);
      currentThaiAudio = audioObj;
      audioObj.playbackRate = targetSpeed;
      audioObj.preservesPitch = false;

      let fallbackTriggered = false;

      const cleanup = () => {
        audioObj.removeEventListener('ended', handleEnded);
        audioObj.removeEventListener('error', handleError);
        if (currentThaiAudioCleanup === cleanup) {
          currentThaiAudioCleanup = null;
        }
      };

      currentThaiAudioCleanup = cleanup;

      const triggerFallback = () => {
        if (audioObj.isCancelled || fallbackTriggered || reqSeq !== ttsPlaySeq) return;
        fallbackTriggered = true;
        cleanup();
        if (currentThaiAudio === audioObj) {
          currentThaiAudio = null;
        }
        speakWebSpeechThaiFallback(fallbackTarget, onEndedCallback, targetSpeed, reqSeq);
      };

      const handleEnded = () => {
        cleanup();
        if (currentThaiAudio === audioObj) {
          currentThaiAudio = null;
        }
        if (reqSeq !== ttsPlaySeq) return;
        onSingleEnded();
      };

      const handleError = () => {
        triggerFallback();
      };

      audioObj.addEventListener('ended', handleEnded);
      audioObj.addEventListener('error', handleError);

      audioObj.play().catch(() => {
        triggerFallback();
      });
    };

    const finishAll = () => {
      if (reqSeq !== ttsPlaySeq) return;
      if (typeof onEndedCallback === 'function') {
        onEndedCallback();
      }
      if (!currentBufferSource && !currentThaiAudio && !activeUtterance) {
        triggerUnduck();
      }
    };

    if (!chunks || chunks.length <= 1) {
      const singleUrl = chunks ? buildTtsUrl(apiBase, chunks[0]) : urlOrChunks;
      playSingleUrl(singleUrl, chunks || text, finishAll);
      return;
    }

    const playChunkAt = (idx) => {
      if (reqSeq !== ttsPlaySeq) return;
      const chunkUrl = buildTtsUrl(apiBase, chunks[idx]);
      playSingleUrl(chunkUrl, chunks.slice(idx), () => {
        if (reqSeq !== ttsPlaySeq) return;
        if (idx < chunks.length - 1) {
          chunkPauseTimer = setTimeout(() => {
            chunkPauseTimer = null;
            if (reqSeq !== ttsPlaySeq) return;
            playChunkAt(idx + 1);
          }, DEFAULT_CHUNK_PAUSE_MS);
        } else {
          finishAll();
        }
      });
    };

    playChunkAt(0);
  }

  function speakWebSpeechThaiFallback(textOrChunks, onEndedCallback = null, targetSpeed = null, reqSeq = ttsPlaySeq) {
    if (reqSeq !== ttsPlaySeq) return;

    const chunks = Array.isArray(textOrChunks)
      ? textOrChunks.map((s) => String(s || '').trim()).filter(Boolean)
      : splitTextChunks(textOrChunks);
    const fullText = Array.isArray(textOrChunks) ? chunks.join(', ') : String(textOrChunks || '');
    const resolvedSpeed = resolveTtsSpeed(fullText, targetSpeed);

    const finishFallback = () => {
      if (reqSeq !== ttsPlaySeq) return;
      if (typeof onEndedCallback === 'function') {
        onEndedCallback();
      }
      if (!currentBufferSource && !currentThaiAudio && !activeUtterance) {
        triggerUnduck();
      }
    };

    if ('speechSynthesis' in window) {
      const items = chunks.length > 0 ? chunks : [fullText];
      const voices = window.speechSynthesis.getVoices();
      const thVoice =
        voices.find(
          (v) =>
            v.lang.includes('th') &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('premwadee') ||
              v.name.toLowerCase().includes('narisa') ||
              v.name.toLowerCase().includes('achara') ||
              v.name.toLowerCase().includes('kanya') ||
              v.name.toLowerCase().includes('google') ||
              v.name.toLowerCase().includes('online'))
        ) || voices.find((v) => v.lang.includes('th'));

      const speakChunkAt = (idx) => {
        if (reqSeq !== ttsPlaySeq) return;

        const chunkText = items[idx];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = 'th-TH';
        utterance.rate = Math.max(0.5, Math.min(1.5, (resolvedSpeed / TTS_SPEED_CONFIG.lockedPitch) * 0.85));
        utterance.pitch = 1.4;
        if (thVoice) {
          utterance.voice = thVoice;
        }

        const advanceOrFinish = (isError) => {
          if (activeUtterance !== utterance) return;
          activeUtterance = null;
          if (reqSeq !== ttsPlaySeq) return;

          if (!isError && idx < items.length - 1) {
            chunkPauseTimer = setTimeout(() => {
              chunkPauseTimer = null;
              if (reqSeq !== ttsPlaySeq) return;
              speakChunkAt(idx + 1);
            }, DEFAULT_CHUNK_PAUSE_MS);
            return;
          }

          isTtsSpeaking = false;
          finishFallback();
        };

        utterance.onstart = () => {
          if (activeUtterance !== utterance || reqSeq !== ttsPlaySeq) return;
          isTtsSpeaking = true;
          triggerDuck();
        };
        utterance.onend = () => advanceOrFinish(false);
        utterance.onerror = () => advanceOrFinish(true);

        activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      };

      speakChunkAt(0);
    } else {
      finishFallback();
    }
  }

  function playThaiTTS(text, playbackRate = null, onEndedCallback = null) {
    if (typeof playbackRate === 'function') {
      onEndedCallback = playbackRate;
      playbackRate = null;
    }

    if (!isTtsEnabled()) {
      if (typeof onEndedCallback === 'function') onEndedCallback();
      return;
    }

    const cleanText = String(text || '').trim();
    if (!cleanText) {
      if (typeof onEndedCallback === 'function') onEndedCallback();
      return;
    }

    const targetSpeed = resolveTtsSpeed(cleanText, playbackRate);
    const pitchRatio = TTS_SPEED_CONFIG.lockedPitch;

    cancelAllAudio();
    triggerDuck();
    const reqSeq = ++ttsPlaySeq;

    const resumePromise = ensureTtsAudioContext();
    const apiBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
    const chunks = splitTextChunks(cleanText);

    if (chunks.length >= 2) {
      const playMultiChunkTts = async () => {
        const ctx = await Promise.race([
          resumePromise,
          new Promise((resolve) => setTimeout(() => resolve(ttsAudioCtx), 50))
        ]);
        if (reqSeq !== ttsPlaySeq) return;

        if (ctx && ctx.state === 'running') {
          try {
            const uniqueUncached = [...new Set(chunks)].filter((chunk) => !decodedAudioCache.has(chunk));
            if (uniqueUncached.length > 0) {
              await Promise.all(
                uniqueUncached.map(async (chunk) => {
                  const chunkUrl = buildTtsUrl(apiBase, chunk);
                  const response = await fetch(chunkUrl);
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                  }
                  const arrayBuf = await response.arrayBuffer();
                  if (reqSeq !== ttsPlaySeq) return;
                  const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
                  if (reqSeq !== ttsPlaySeq) return;
                  decodedAudioCache.set(chunk, decoded);
                })
              );
            }

            if (reqSeq !== ttsPlaySeq) return;
            const chunkBuffers = chunks.map((chunk) => decodedAudioCache.get(chunk));
            if (chunkBuffers.some((buf) => !buf)) {
              throw new Error('Missing decoded chunk buffer');
            }

            const stretchAlpha = pitchRatio / targetSpeed;
            const stretchedChunks = chunkBuffers.map((chunkBuf) => wsolaTimeStretch(ctx, chunkBuf, stretchAlpha));
            if (reqSeq !== ttsPlaySeq) return;

            const mergedBuffer = concatenateAudioBuffers(ctx, stretchedChunks, DEFAULT_CHUNK_PAUSE_MS, pitchRatio);
            startBufferSource(ctx, mergedBuffer, targetSpeed, pitchRatio, reqSeq, onEndedCallback);
            return;
          } catch (_) {
            // Fall through to HTMLAudioElement -> Web Speech
          }
        }

        if (reqSeq !== ttsPlaySeq) return;
        playViaHtmlAudioElement(chunks, cleanText, targetSpeed, reqSeq, onEndedCallback, apiBase);
      };

      playMultiChunkTts();
      return;
    }

    const singleText = chunks.length === 1 ? chunks[0] : cleanText;
    const url = buildTtsUrl(apiBase, singleText);
    const cacheKey = singleText;

    const startAudioFromArrayBuffer = async (arrayBuf) => {
      if (reqSeq !== ttsPlaySeq) return;
      const ctx = await Promise.race([
        resumePromise,
        new Promise((resolve) => setTimeout(() => resolve(ttsAudioCtx), 50))
      ]);
      if (reqSeq !== ttsPlaySeq) return;

      if (ctx && ctx.state === 'running') {
        try {
          const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
          decodedAudioCache.set(cacheKey, decoded);
          playDecodedBuffer(ctx, decoded, targetSpeed, pitchRatio, reqSeq, onEndedCallback);
          return;
        } catch (_) {
          // Fallback below
        }
      }

      playViaHtmlAudioElement(url, singleText, targetSpeed, reqSeq, onEndedCallback, apiBase);
    };

    if (decodedAudioCache.has(cacheKey)) {
      Promise.race([
        resumePromise,
        new Promise((resolve) => setTimeout(() => resolve(ttsAudioCtx), 50))
      ]).then((ctx) => {
        if (reqSeq !== ttsPlaySeq) return;
        if (ctx && ctx.state === 'running') {
          playDecodedBuffer(ctx, decodedAudioCache.get(cacheKey), targetSpeed, pitchRatio, reqSeq, onEndedCallback);
        } else {
          playViaHtmlAudioElement(url, singleText, targetSpeed, reqSeq, onEndedCallback, apiBase);
        }
      });
      return;
    }

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then(startAudioFromArrayBuffer)
      .catch(() => {
        if (reqSeq !== ttsPlaySeq) return;
        playViaHtmlAudioElement(url, singleText, targetSpeed, reqSeq, onEndedCallback, apiBase);
      });
  }

  function toggleTts() {
    const next = !isTtsEnabled();
    localStorage.setItem('tts_enabled', String(next));
    updateTtsToggleUI();
    window.dispatchEvent(new CustomEvent('tts:statechange', { detail: { enabled: next } }));
    if (!next) {
      cancelAllAudio();
    } else {
      playThaiTTS('เปิดเสียงอ่านแล้วค่ะ');
    }
    return next;
  }

  function updateTtsToggleUI() {
    if (!ttsToggleBtn) return;
    const enabled = isTtsEnabled();
    ttsToggleBtn.textContent = enabled ? '🗣️ เสียงอ่าน: เปิด' : '🔇 เสียงอ่าน: ปิด';
    ttsToggleBtn.classList.toggle('active', enabled);
    ttsToggleBtn.setAttribute('aria-pressed', String(enabled));
  }

  function createTtsWidget() {
    if (localStorage.getItem('tts_enabled') === null) {
      localStorage.setItem('tts_enabled', 'true');
    }

    const hasFloatingControls =
      Boolean(document.querySelector('script[src*="floating-controls.js"]')) ||
      typeof window.FloatingControls !== 'undefined';

    if (hasFloatingControls || document.querySelector('.tts-toggle')) return;

    ttsToggleBtn = document.createElement('button');
    ttsToggleBtn.type = 'button';
    ttsToggleBtn.className = 'tts-toggle';
    ttsToggleBtn.setAttribute('aria-label', 'เปิดหรือปิดเสียงอ่านโจทย์');
    updateTtsToggleUI();

    ttsToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTts();
    });

    document.body.appendChild(ttsToggleBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createTtsWidget);
  } else {
    createTtsWidget();
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  window.TTS_SPEED_CONFIG = TTS_SPEED_CONFIG;
  window.splitTextChunks = splitTextChunks;
  window.classifyTtsTier = classifyTtsTier;
  window.resolveTtsSpeed = resolveTtsSpeed;
  window.playThaiTTS = playThaiTTS;
  window.stopTTS = cancelAllAudio;
  window.setBgmDuckingCallbacks = setBgmDuckingCallbacks;
  window.isTtsEnabled = isTtsEnabled;
  window.TTSControl = {
    isEnabled: isTtsEnabled,
    toggle: toggleTts
  };

  Object.defineProperty(window, 'isTtsSpeaking', {
    get: function () {
      return isTtsSpeaking;
    },
    set: function (val) {
      isTtsSpeaking = val;
    }
  });
})();
