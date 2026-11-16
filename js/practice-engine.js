/**
 * practice-engine.js
 * Shared engine for static/writable P.1 math worksheets (✏️ เขียนด้วยปากกา + A4 Print).
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

  function normalizeAnswer(val) {
    const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
    let out = String(val || '').trim();
    out = out.replace(/[๐-๙]/g, (ch) => String(thaiDigits.indexOf(ch)));
    out = out.replace(/＜/g, '<').replace(/＞/g, '>').replace(/＝/g, '=');
    out = out.replace(/\s+/g, ' ');
    if (out === '🍬' || out === 'ลูกอม') {
      out = 'ลูกกวาด';
    }
    return out;
  }

  function renderInputMarkup(template) {
    return String(template).replace(/\{\{([^}]+)\}\}/g, (_, token) => {
      const parts = token.split('|');
      const answer = parts[0].trim();
      const isWide = parts.includes('wide');
      const isNumeric = /^\d+$/.test(answer);
      const classes = isWide ? 'ans-input wide' : 'ans-input';
      const inputMode = isNumeric ? 'inputmode="numeric"' : '';
      return `<input type="text" class="${classes}" data-answer="${escapeHtml(answer)}" ${inputMode} autocomplete="off" aria-label="ช่องคำตอบ">`;
    });
  }

  function renderChart(chart) {
    if (!chart) return '';
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
      <p style="margin-top:0;"><strong>${escapeHtml(chart.title)}</strong></p>
      <table class="pictograph-table">${rowsHtml}</table>
    `;
  }

  function renderSection(topic, index) {
    const altClass = index % 2 === 1 ? ' alt-green' : '';
    const st = topic.static;
    let bodyHtml = '';

    if (topic.key === 'multiplication') {
      const renderCol = (rows) =>
        rows
          .map(
            (r) => `
              <div class="mult-item">
                ${renderInputMarkup(r.html)}
                <span class="answer-hint">${escapeHtml(r.hint)}</span>
                <button type="button" class="tts-inline-btn" data-tts="${escapeHtml(r.tts)}" aria-label="ฟังข้อ ${r.num}">🔊</button>
              </div>
            `
          )
          .join('');

      bodyHtml = `
        <p style="margin-top:0;">${escapeHtml(st.subtitle)}</p>
        <div class="mult-grid">
          <div class="mult-col">
            <h3>✖️ สูตรคูณ แม่ 2</h3>
            ${renderCol(st.table2)}
          </div>
          <div class="mult-col gold">
            <h3>✖️ สูตรคูณ แม่ 3</h3>
            ${renderCol(st.table3)}
          </div>
        </div>
      `;
    } else if (topic.key === 'wordproblems') {
      const itemsHtml = st.items
        .map(
          (item) => `
            <li style="margin-bottom:14px;">
              ${item.storyHtml}
              <button type="button" class="tts-inline-btn" data-tts="${escapeHtml(item.tts)}" aria-label="ฟังโจทย์ข้อ ${item.id}">🔊 ฟังโจทย์</button>
              <br>
              ประโยคสัญลักษณ์: <input type="text" class="expr-input" placeholder="${escapeHtml(item.exprPlaceholder)}" aria-label="ประโยคสัญลักษณ์ข้อ ${item.id}"> |
              <strong>ตอบ:</strong> ${renderInputMarkup(item.answerHtml)}
              <span class="answer-hint">${escapeHtml(item.hint)}</span>
            </li>
          `
        )
        .join('');
      bodyHtml = `<ol class="practice-list">${itemsHtml}</ol>`;
    } else {
      const chartHtml = st.chart ? renderChart(st.chart) : '';
      const itemsHtml = st.items
        .map(
          (item) => `
            <li>
              ${renderInputMarkup(item.html)}
              <span class="answer-hint">${escapeHtml(item.hint)}</span>
              <button type="button" class="tts-inline-btn" data-tts="${escapeHtml(item.tts)}" aria-label="ฟังข้อ ${item.id}">🔊</button>
            </li>
          `
        )
        .join('');
      bodyHtml = `${chartHtml}<ol class="practice-list">${itemsHtml}</ol>`;
    }

    return `
      <section class="section-card${altClass}" id="sec-${escapeHtml(topic.key)}">
        <h2 class="section-title">
          <span>${escapeHtml(topic.title)}</span>
          <button type="button" class="tts-inline-btn" data-tts="${escapeHtml(topic.title)}" aria-label="ฟังชื่อตอน">🔊 ฟังหัวข้อ</button>
        </h2>
        ${bodyHtml}
      </section>
    `;
  }

  function speakText(text) {
    if (typeof window.playThaiTTS === 'function' && text) {
      window.playThaiTTS(text);
    }
  }

  function initPracticePage() {
    const root = document.getElementById('app') || document.body;
    const rawTopics = (document.body.dataset.topics || '').split(',').map((s) => s.trim()).filter(Boolean);

    if (typeof window.p1Data === 'undefined') {
      root.innerHTML = `<div class="container"><h1 class="title">❌ ไม่พบข้อมูลบทเรียน ป.1</h1></div>`;
      return;
    }

    const topics = rawTopics.map((key) => window.p1Data[key]).filter(Boolean);
    if (topics.length === 0) {
      root.innerHTML = `<div class="container"><h1 class="title">❌ ไม่พบหัวข้อแบบฝึกหัด</h1></div>`;
      return;
    }

    const isCombined = topics.length > 1;
    const pageHeading = isCombined
      ? 'แบบฝึกหัดพัฒนาทักษะคณิตศาสตร์ ชั้นประถมศึกษาปีที่ 1'
      : `ใบงานฝึกเขียน: ${topics[0].shortTitle} (ป.1)`;
    const pageSub = isCombined
      ? 'ครอบคลุมเนื้อหา: จำนวนนับ 21-100 | แผนภูมิรูปภาพ | สูตรคูณแม่ 2 และ 3 | โจทย์ปัญหาบวกลบไม่เกิน 100'
      : `${topics[0].description} — ใช้ Apple Pencil เขียนเติม หรือพิมพ์คำตอบลงในช่องว่าง`;

    const sectionsHtml = topics.map((t, idx) => renderSection(t, idx)).join('');

    root.innerHTML = `
      <div class="back-nav" style="width:100%; max-width:920px;">
        <a href="index.html" class="btn btn-green">⬅️ กลับหน้าหลัก</a>
        <button type="button" class="tts-inline-btn" data-tts="${escapeHtml(pageHeading + ', ' + pageSub)}">🔊 ฟังคำชี้แจง</button>
      </div>
      <div class="toolbar">
        <div id="score-banner" style="font-weight:700; font-size:1.05rem;">คะแนนรวม: - / 0</div>
        <div class="toolbar-actions">
          <button type="button" class="btn-check" id="btn-check">ตรวจคำตอบ</button>
          <button type="button" class="btn-key" id="btn-toggle-key">ดูเฉลย / ซ่อนเฉลย</button>
          <button type="button" class="btn-reset" id="btn-reset">ล้างข้อมูล</button>
          <button type="button" class="btn-print" id="btn-print">พิมพ์ใบงาน (A4)</button>
        </div>
      </div>
      <div class="worksheet-container" id="worksheet-container">
        <div class="header-box">
          <div class="header-ornaments">
            <img src="assets/christmas/tree.svg" alt="ต้นคริสต์มาส">
            <img src="assets/christmas/santa.svg" alt="ซานตาคลอส">
            <img src="assets/christmas/star.svg" alt="ดาวคริสต์มาส">
          </div>
          <h1 class="title">${escapeHtml(pageHeading)}</h1>
          <p class="subtitle">${escapeHtml(pageSub)}</p>
          <div class="student-info">
            <label>ชื่อ-นามสกุล: <input type="text" placeholder="ด.ช. / ด.ญ. ..."></label>
            <label>ชั้น: <input type="text" value="ป.1/1"></label>
            <label>เลขที่: <input type="text" placeholder="..."></label>
          </div>
        </div>
        ${sectionsHtml}
      </div>
    `;

    const totalInputs = root.querySelectorAll('input.ans-input').length;
    const scoreBanner = document.getElementById('score-banner');
    const wsContainer = document.getElementById('worksheet-container');
    scoreBanner.textContent = `คะแนนรวม: - / ${totalInputs}`;

    document.getElementById('btn-check').addEventListener('click', () => {
      const inputs = root.querySelectorAll('input.ans-input');
      let score = 0;
      inputs.forEach((input) => {
        const expected = normalizeAnswer(input.getAttribute('data-answer'));
        const actual = normalizeAnswer(input.value);
        input.classList.remove('correct', 'wrong');
        if (actual === expected) {
          input.classList.add('correct');
          score++;
        } else {
          input.classList.add('wrong');
        }
      });
      scoreBanner.textContent = `คะแนนรวม: ${score} / ${inputs.length}`;
      if (score === inputs.length) {
        speakText(`เก่งมากค่ะ, ได้คะแนนเต็ม ${score} คะแนน`);
      } else {
        speakText(`ได้คะแนน ${score} จาก ${inputs.length} คะแนน, ลองตรวจทานข้อที่ยังไม่ถูกนะคะ`);
      }
    });

    document.getElementById('btn-toggle-key').addEventListener('click', () => {
      wsContainer.classList.toggle('show-keys');
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      root.querySelectorAll('input.ans-input, input.expr-input').forEach((input) => {
        input.value = '';
        input.classList.remove('correct', 'wrong');
      });
      wsContainer.classList.remove('show-keys');
      scoreBanner.textContent = `คะแนนรวม: - / ${totalInputs}`;
    });

    document.getElementById('btn-print').addEventListener('click', () => {
      window.print();
    });

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.tts-inline-btn[data-tts]');
      if (btn) {
        speakText(btn.getAttribute('data-tts'));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPracticePage);
  } else {
    initPracticePage();
  }
})();
