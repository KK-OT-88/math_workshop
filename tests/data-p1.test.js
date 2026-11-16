const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadP1DataInVm() {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'data-p1.js'), 'utf8');
  const sandbox = { window: {}, globalThis: {} };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox);
  return sandbox.window.p1Data;
}

function countTokens(template) {
  const matches = String(template || '').match(/\{\{[^}]+\}\}/g);
  return matches ? matches.length : 0;
}

function assertValidTts(tts, label) {
  assert.equal(typeof tts, 'string', `${label}: tts must be a string`);
  assert.ok(tts.trim().length > 0, `${label}: tts must be non-empty`);
  const chunks = tts.split(/[,|\r\n]+/).map((s) => s.trim()).filter(Boolean);
  assert.ok(chunks.length > 0, `${label}: tts must have at least one chunk`);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 200, `${label}: tts chunk exceeds 200 chars (${chunk.length})`);
  }
}

test('p1Data loads in browser-like window context with all 4 topics', () => {
  const data = loadP1DataInVm();
  assert.ok(data);
  for (const key of ['numbers', 'pictograph', 'multiplication', 'wordproblems']) {
    assert.ok(data[key], `Missing topic: ${key}`);
  }
});

test('interactive questions have expected counts, unique options, valid answers, and valid TTS', () => {
  const data = loadP1DataInVm();

  assert.equal(data.numbers.interactive.length, 5);
  assert.equal(data.pictograph.interactive.questions.length, 4);
  assert.equal(data.multiplication.interactive.length, 10);
  assert.equal(data.wordproblems.interactive.length, 5);

  const allInteractive = [
    ...data.numbers.interactive.map((q) => ({ topic: 'numbers', q })),
    ...data.pictograph.interactive.questions.map((q) => ({ topic: 'pictograph', q })),
    ...data.multiplication.interactive.map((q) => ({ topic: 'multiplication', q })),
    ...data.wordproblems.interactive.map((q) => ({ topic: 'wordproblems', q }))
  ];

  for (const { topic, q } of allInteractive) {
    assert.ok(Array.isArray(q.options) && q.options.length >= 2, `${topic}#${q.id}: options must be array`);
    assert.equal(new Set(q.options).size, q.options.length, `${topic}#${q.id}: duplicate options found`);
    assert.ok(q.options.includes(q.answer), `${topic}#${q.id}: answer "${q.answer}" not in options`);
    assertValidTts(q.tts, `${topic}.interactive#${q.id}`);
  }
});

test('math correctness checks for pictograph, multiplication, and word problems', () => {
  const data = loadP1DataInVm();

  // Multiplication interactive & static
  for (const q of data.multiplication.interactive) {
    assert.equal(Number(q.answer), q.a * q.b, `mult interactive ${q.a}x${q.b}`);
  }
  for (const row of [...data.multiplication.static.table2, ...data.multiplication.static.table3]) {
    const m = row.html.match(/\{\{(\d+)\}\}/);
    assert.ok(m, `mult static missing token: ${row.html}`);
    assert.equal(Number(m[1]), row.a * row.b, `mult static ${row.a}x${row.b}`);
  }

  // Pictograph interactive chart calculations
  const iRows = data.pictograph.interactive.chart.rows;
  const iCounts = Object.fromEntries(iRows.map((r) => [r.label, r.count]));
  const iTotal = iRows.reduce((s, r) => s + r.count, 0);
  const iMax = iRows.reduce((best, r) => (r.count > best.count ? r : best), iRows[0]);
  assert.equal(Number(data.pictograph.interactive.questions[0].answer), iCounts['ต้นสนจิ๋ว']);
  assert.equal(data.pictograph.interactive.questions[1].answer, iMax.label);
  assert.equal(Number(data.pictograph.interactive.questions[2].answer), iCounts['กระดิ่งทอง'] - iCounts['ตุ๊กตาหิมะ']);
  assert.equal(Number(data.pictograph.interactive.questions[3].answer), iTotal);

  // Pictograph static chart calculations
  const sRows = data.pictograph.static.chart.rows;
  const sCounts = Object.fromEntries(sRows.map((r) => [r.label, r.count]));
  const sTotal = sRows.reduce((s, r) => s + r.count, 0);
  const sMax = sRows.reduce((best, r) => (r.count > best.count ? r : best), sRows[0]);
  assert.equal(sCounts['กล่องของขวัญ'], 7);
  assert.equal(sMax.label, 'ลูกกวาด');
  assert.equal(sCounts['กระดิ่ง'] - sCounts['ดาว'], 2);
  assert.equal(sTotal, 24);

  // Word problems interactive & static <= 100
  for (const q of data.wordproblems.interactive) {
    const expected = q.op === '+' ? q.a + q.b : q.a - q.b;
    assert.equal(Number(q.answer), expected, `wp interactive #${q.id}`);
    assert.ok(expected >= 0 && expected <= 100, `wp interactive #${q.id} out of range`);
  }
  for (const item of data.wordproblems.static.items) {
    const expected = item.op === '+' ? item.a + item.b : item.a - item.b;
    const m = item.answerHtml.match(/\{\{(\d+)\}\}/);
    assert.ok(m, `wp static #${item.id} missing token`);
    assert.equal(Number(m[1]), expected, `wp static #${item.id}`);
    assert.ok(expected >= 0 && expected <= 100, `wp static #${item.id} out of range`);
  }
});

test('static worksheets have all 26 inputs (7 + 4 + 10 + 5) and valid TTS', () => {
  const data = loadP1DataInVm();

  const numCount = data.numbers.static.items.reduce((s, it) => {
    assertValidTts(it.tts, `numbers.static#${it.id}`);
    return s + countTokens(it.html);
  }, 0);
  const picCount = data.pictograph.static.items.reduce((s, it) => {
    assertValidTts(it.tts, `pictograph.static#${it.id}`);
    return s + countTokens(it.html);
  }, 0);
  const mulItems = [...data.multiplication.static.table2, ...data.multiplication.static.table3];
  const mulCount = mulItems.reduce((s, it) => {
    assertValidTts(it.tts, `multiplication.static#${it.num}`);
    return s + countTokens(it.html);
  }, 0);
  const wpCount = data.wordproblems.static.items.reduce((s, it) => {
    assertValidTts(it.tts, `wordproblems.static#${it.id}`);
    return s + countTokens(it.answerHtml);
  }, 0);

  assert.equal(numCount, 7);
  assert.equal(picCount, 4);
  assert.equal(mulCount, 10);
  assert.equal(wpCount, 5);
  assert.equal(numCount + picCount + mulCount + wpCount, 26);

  assert.ok(
    data.pictograph.static.headerTts.includes(
      'พิจารณารูปภาพแสดงจำนวนของขวัญคริสต์มาสที่ใบบัวสะสมได้ แล้วตอบคำถาม (กำหนดให้ รูปภาพ 1 รูป แทนจำนวน 1 ชิ้น)'
    ),
    'pictograph.static.headerTts must include full chart instruction'
  );
  assertValidTts(data.pictograph.static.headerTts, 'pictograph.static.headerTts');

  assert.ok(
    data.multiplication.static.headerTts.includes('เติมผลลัพธ์ของการคูณลงในช่องว่างให้ถูกต้อง (10 คะแนน)'),
    'multiplication.static.headerTts must include multiplication instruction'
  );
  assertValidTts(data.multiplication.static.headerTts, 'multiplication.static.headerTts');
});
