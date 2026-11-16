/**
 * play-engine.js
 * Shared engine for interactive P.1 math games (🎮 เล่นบนหน้าจอ) with TTS and Christmas visuals.
 */
(function () {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function speakText(text) {
    if (typeof window.playThaiTTS === 'function' && text) {
      window.playThaiTTS(text);
    }
  }

  function renderChart(chart) {
    const rowsHtml = chart.rows
      .map((row) => {
        const icons = Array.from({ length: row.count })
          .map(() => `<img src="${escapeHtml(row.icon)}" alt="${escapeHtml(row.label)}">`)
          .join('');
        return `
          <tr>
            <td class="pictograph-label">${escapeHtml(row.emoji)} ${escapeHtml(row.label)}</td>
            <td><div class="pictograph-icons">${icons}</div></td>
          </tr>
        `;
      })
      .join('');
    return `
      <p style="margin:0 0 8px 0;"><strong>${escapeHtml(chart.title)}</strong></p>
      <table class="pictograph-table">${rowsHtml}</table>
    `;
  }

  function renderVisualHelper(q, chart) {
    if (chart) {
      return `<div class="visual-helper">${renderChart(chart)}</div>`;
    }

    const v = q.visual;
    if (!v) return '';

    if (v.type === 'place-value') {
      const tensHtml = Array.from({ length: v.tens })
        .map(
          () => `
            <span class="ten-bundle">
              <img src="assets/christmas/gift.svg" alt="10">
              <span>10</span>
            </span>
          `
        )
        .join('');
      const onesHtml = Array.from({ length: v.ones })
        .map(() => `<img src="assets/christmas/candy.svg" alt="1">`)
        .join('');
      return `
        <div class="visual-helper">
          <div style="font-size:1.5rem; font-weight:700; color:var(--primary); margin-bottom:10px;">จำนวน: ${v.number}</div>
          <div class="place-value-grid">
            <div class="pv-box">
              <div class="pv-label">หลักสิบ (${v.tens} กลุ่มสิบ)</div>
              <div class="pv-icons">${tensHtml}</div>
            </div>
            <div class="pv-box">
              <div class="pv-label">หลักหน่วย (${v.ones} หน่วย)</div>
              <div class="pv-icons">${onesHtml}</div>
            </div>
          </div>
        </div>
      `;
    }

    if (v.type === 'card-text') {
      return `
        <div class="visual-helper">
          <div style="display:inline-flex; align-items:center; gap:12px; font-size:2rem; font-weight:700; color:var(--primary);">
            <img src="${escapeHtml(v.icon)}" alt="" style="width:48px; height:48px;">
            <span>"${escapeHtml(v.text)}"</span>
          </div>
        </div>
      `;
    }

    if (v.type === 'compare') {
      return `
        <div class="visual-helper">
          <div style="font-size:2.4rem; font-weight:700; color:var(--secondary); letter-spacing:4px;">
            ${v.left} <span style="display:inline-block; min-width:52px; border:3px dashed var(--primary); border-radius:10px; color:var(--primary);">?</span> ${v.right}
          </div>
        </div>
      `;
    }

    if (v.type === 'pattern') {
      const tiles = v.seq
        .map((item) => {
          const isQ = item === '?';
          return `<span style="display:inline-flex; align-items:center; justify-content:center; min-width:54px; height:54px; border-radius:12px; border:3px solid ${isQ ? 'var(--primary)' : 'var(--border)'}; background:${isQ ? '#FFF5F5' : '#FFFFFF'}; color:${isQ ? 'var(--primary)' : 'var(--text)'}; font-weight:700; font-size:1.4rem; padding:0 10px;">${escapeHtml(item)}</span>`;
        })
        .join('');
      return `
        <div class="visual-helper">
          <div style="display:flex; justify-content:center; gap:10px; flex-wrap:wrap;">${tiles}</div>
        </div>
      `;
    }

    if (v.type === 'groups') {
      const groupsHtml = Array.from({ length: v.groups })
        .map(() => {
          const items = Array.from({ length: v.perGroup })
            .map(() => `<img src="${escapeHtml(v.icon)}" alt="">`)
            .join('');
          return `<div class="group-box">${items}</div>`;
        })
        .join('');
      return `
        <div class="visual-helper">
          <div style="font-size:0.95rem; color:var(--muted); margin-bottom:8px; font-weight:700;">ภาพช่วยนับ: ${v.groups} กลุ่ม กลุ่มละ ${v.perGroup} ชิ้น</div>
          <div class="groups-wrap">${groupsHtml}</div>
        </div>
      `;
    }

    if (v.type === 'word-problem') {
      return `
        <div class="visual-helper">
          <div style="display:inline-flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:center;">
            <img src="${escapeHtml(v.icon)}" alt="" style="width:48px; height:48px;">
            <span style="font-size:1.65rem; font-weight:700; color:var(--primary);">${v.left} ${escapeHtml(v.op)} ${v.right} = ? ${escapeHtml(v.unit)}</span>
          </div>
        </div>
      `;
    }

    return '';
  }

  function initPlayPage() {
    const root = document.getElementById('app') || document.body;
    const topicKey = (document.body.dataset.topic || '').trim();

    if (typeof window.p1Data === 'undefined' || !window.p1Data[topicKey]) {
      root.innerHTML = `<div class="container"><h1 class="title">❌ เกิดข้อผิดพลาดในการโหลดข้อมูลบทเรียน</h1><a href="index.html" class="btn">กลับหน้าหลัก</a></div>`;
      return;
    }

    const topic = window.p1Data[topicKey];
    const isPictograph = topicKey === 'pictograph';
    const chart = isPictograph ? topic.interactive.chart : null;
    const questions = isPictograph ? topic.interactive.questions : topic.interactive;

    let currentIdx = 0;
    let gameStarted = false;
    let isTransitioning = false;

    root.innerHTML = `
      <div class="container candy-border play-shell" id="game-container">
        <div class="back-nav">
          <a href="index.html" class="btn btn-green">⬅️ กลับหน้าหลัก</a>
          <span style="font-weight:700; color:var(--muted);" id="question-counter">ข้อที่ 1 / ${questions.length}</span>
        </div>
        <div class="header">
          <div class="header-ornaments">
            <img src="${escapeHtml(topic.icon)}" alt="">
          </div>
          <h1 class="title">${escapeHtml(topic.title)}</h1>
          <p class="subtitle">${escapeHtml(topic.description)}</p>
        </div>

        <div class="progress-stars" id="progress-stars"></div>
        <div id="visual-area"></div>

        <div class="question-prompt-row">
          <h2 id="question-prompt" class="question-prompt"></h2>
          <button type="button" id="btn-speak-question" class="tts-inline-btn" aria-label="ฟังโจทย์ซ้ำ">🔊 ฟังโจทย์</button>
        </div>

        <div id="options-area" class="options-row"></div>
        <div id="feedback-message"></div>
      </div>

      <div id="start-overlay" class="start-overlay show">
        <div class="modal-card">
          <img src="assets/christmas/santa.svg" alt="ซานตาคลอส">
          <h2 style="color:var(--primary); margin:8px 0;">${escapeHtml(topic.shortTitle)}</h2>
          <p style="color:var(--muted); margin-bottom:22px;">มีทั้งหมด ${questions.length} ข้อ พร้อมเสียงอ่านโจทย์และภาพช่วยคิด!</p>
          <button type="button" class="btn" id="btn-start-game" style="font-size:1.3rem; padding:14px 32px;">▶️ เริ่มเกม</button>
        </div>
      </div>

      <div id="celebration" class="celebration">
        <div class="modal-card">
          <img src="assets/christmas/tree.svg" alt="ต้นคริสต์มาส">
          <h2 style="font-size:2rem; color:var(--success); margin:8px 0;">🎄 ถูกต้องแล้ว! เก่งมากๆ เลย 🎅</h2>
          <p style="color:var(--muted); margin-bottom:20px;" id="celebration-sub">ไปลุยข้อต่อไปกันเลย!</p>
          <button type="button" class="btn btn-green" id="btn-next-question" style="font-size:1.25rem; padding:14px 28px;">ทำข้อต่อไป ➡️</button>
        </div>
      </div>
    `;

    const gameContainer = document.getElementById('game-container');
    const starsEl = document.getElementById('progress-stars');
    const visualArea = document.getElementById('visual-area');
    const promptEl = document.getElementById('question-prompt');
    const optionsArea = document.getElementById('options-area');
    const feedbackEl = document.getElementById('feedback-message');
    const counterEl = document.getElementById('question-counter');
    const startOverlay = document.getElementById('start-overlay');
    const celebration = document.getElementById('celebration');
    const btnSpeak = document.getElementById('btn-speak-question');

    function renderStars() {
      starsEl.innerHTML = questions
        .map((_, idx) => {
          const cls = idx < currentIdx ? 'star-pip earned' : idx === currentIdx ? 'star-pip current' : 'star-pip';
          return `<span class="${cls}" aria-hidden="true">⭐</span>`;
        })
        .join('');
    }

    function loadQuestion(shouldSpeak) {
      isTransitioning = false;
      celebration.classList.remove('show');
      feedbackEl.textContent = '';
      feedbackEl.className = '';

      if (currentIdx >= questions.length) {
        renderStars();
        counterEl.textContent = `เสร็จสิ้น ${questions.length} / ${questions.length}`;
        gameContainer.innerHTML = `
          <div class="back-nav">
            <a href="index.html" class="btn btn-green">⬅️ กลับหน้าหลัก</a>
          </div>
          <div class="header" style="padding:24px 0;">
            <img src="assets/christmas/santa.svg" alt="ซานตาคลอส" style="width:110px; height:110px;">
            <h1 class="title" style="color:var(--success);">🎉 ยินดีด้วย! ทำครบทั้งหมด ${questions.length} ข้อแล้ว 🎉</h1>
            <p class="subtitle" style="font-size:1.3rem;">ได้รับดาวคริสต์มาส ${questions.length} ดวง ⭐</p>
            <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-top:24px;">
              <button type="button" class="btn" id="btn-replay">🔄 เล่นอีกครั้ง</button>
              <a href="index.html" class="btn btn-green">🏠 กลับหน้าหลัก</a>
            </div>
          </div>
        `;
        document.getElementById('btn-replay').addEventListener('click', () => {
          window.location.reload();
        });
        if (shouldSpeak) {
          speakText('ยินดีด้วยค่ะ, ทำครบทั้งหมดแล้ว, เก่งมากค่ะ');
        }
        return;
      }

      const q = questions[currentIdx];
      renderStars();
      counterEl.textContent = `ข้อที่ ${currentIdx + 1} / ${questions.length}`;
      visualArea.innerHTML = renderVisualHelper(q, chart);
      promptEl.textContent = q.prompt;

      optionsArea.innerHTML = q.options
        .map((opt) => `<button type="button" class="option-btn" data-opt="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`)
        .join('');

      if (shouldSpeak) {
        speakText(q.tts);
      }
    }

    optionsArea.addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn || isTransitioning) return;

      const selected = btn.getAttribute('data-opt');
      const q = questions[currentIdx];

      if (selected === q.answer) {
        isTransitioning = true;
        btn.classList.add('correct');
        const pips = starsEl.querySelectorAll('.star-pip');
        if (pips[currentIdx]) {
          pips[currentIdx].classList.remove('current');
          pips[currentIdx].classList.add('earned');
        }
        speakText('เก่งมากค่ะ, ถูกต้องแล้ว');
        celebration.classList.add('show');
      } else {
        btn.classList.add('wrong');
        feedbackEl.textContent = 'ลองดูใหม่อีกทีนะจ๊ะ! 🎅';
        feedbackEl.className = 'feedback-error';
        speakText('ลองดูใหม่อีกทีนะจ๊ะ');
        setTimeout(() => {
          btn.classList.remove('wrong');
        }, 600);
      }
    });

    btnSpeak.addEventListener('click', () => {
      if (questions[currentIdx]) {
        speakText(questions[currentIdx].tts);
      }
    });

    document.getElementById('btn-start-game').addEventListener('click', () => {
      if (typeof window.getSharedAudioContext === 'function') {
        window.getSharedAudioContext();
      }
      gameStarted = true;
      startOverlay.classList.remove('show');
      loadQuestion(true);
    });

    document.getElementById('btn-next-question').addEventListener('click', () => {
      currentIdx++;
      loadQuestion(gameStarted);
    });

    loadQuestion(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayPage);
  } else {
    initPlayPage();
  }
})();
