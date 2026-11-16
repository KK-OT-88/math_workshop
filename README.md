# คณิตศาสตร์ ป.1 แสนสนุก (Christmas Edition + Hybrid Thai TTS)

แบบฝึกหัดคณิตศาสตร์ระดับชั้นประถมศึกษาปีที่ 1 (`ป.1`) ธีมคริสต์มาส สำหรับใช้งานบน iPad และคอมพิวเตอร์ รองรับทั้งการเล่นแบบโต้ตอบบนหน้าจอ (`🎮`) และการฝึกเขียนด้วยปากกา/Apple Pencil พร้อมพิมพ์ A4 (`✏️`) รวมถึงระบบอ่านออกเสียงภาษาไทย (TTS)

## บทเรียนและหน้าเว็บทั้งหมด

1. **ตอนที่ 1: จำนวนนับ 21–100** (`worksheet_numbers_interactive.html` / `worksheet_numbers_static.html`)
2. **ตอนที่ 2: แผนภูมิรูปภาพคริสต์มาส** (`worksheet_pictograph_interactive.html` / `worksheet_pictograph_static.html`)
3. **ตอนที่ 3: สูตรคูณ แม่ 2 และ แม่ 3** (`worksheet_multiply_interactive.html` / `worksheet_multiply_static.html`)
4. **ตอนที่ 4: โจทย์ปัญหา บวก-ลบ ≤ 100** (`worksheet_wordproblem_interactive.html` / `worksheet_wordproblem_static.html`)
5. **ใบงานรวม ป.1 (26 คะแนน)** (`worksheet_p1_full_static.html`) — รวมทั้ง 4 ตอนสำหรับทำรวดเดียวและพิมพ์ A4

## การเริ่มต้นใช้งาน (Local Server สำหรับ Google TTS)

```bash
npm start
```

จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:3000/index.html`

> **หมายเหตุการใช้งานแบบ Offline / `file://`**: สามารถเปิดไฟล์ HTML โดยตรงหรือใช้ `python3 -m http.server` ได้เช่นกัน แต่เสียงอ่าน TTS จะสลับไปใช้ Web Speech API (`th-TH`) ของเครื่องแทน Google TTS proxy อัตโนมัติ

## ระบบเพลง BGM และแผงควบคุม Liquid Glass (iOS 26)

- **เพลง BGM 6 แทร็ก (`bgm.js` + `assets/audio/`)**: รวมเพลงบรรเลงคริสต์มาส 5 เพลงจาก Kevin MacLeod (CC BY 4.0, ดูเครดิตใน [assets/audio/CREDITS.md](assets/audio/CREDITS.md)) พร้อมทำนองสังเคราะห์เดิม สุ่มเปลี่ยนเพลงที่ไม่ซ้ำเดิมอัตโนมัติเมื่อเปลี่ยนหน้า/หัวข้อ หรือสลับตอนในใบงานรวม และลดเสียงเพลงอัตโนมัติเมื่อพูด (iOS Safari compatible)
- **เอฟเฟกต์หิมะ (`js/christmas-fx.js`)**: เกล็ดหิมะตกหน้าสุด (`z-index: 9999; pointer-events: none;`) ไม่บังการแตะหรือเขียนด้วย Apple Pencil
- **แผงควบคุมแบบ iOS 26 Liquid Glass (`js/floating-controls.js`)**: รวมปุ่มควบคุม (ดนตรี, สุ่มเพลง, เสียงอ่าน, หิมะ) ไว้ใน Bubble เดียว ลากไปเกาะขอบ บน-ล่าง-ซ้าย-ขวา ได้ กดเพื่อเปิดแผงควบคุมและกดปุ่ม `✕` เพื่อย่อกลับ

## ระบบอ่านออกเสียง (Hybrid TTS)

- **Server Proxy**: `server.js` + `tts-handler.js` (และ `netlify/functions/tts.js` สำหรับ deploy บน Netlify) ให้บริการ `/api/tts?q=...&tl=th` (จำกัด `q <= 200` ตัวอักษร และรับเฉพาะ `tl` = `th` หรือ `en`)
- **Client Engine (`js/tts.js`)**: เล่นเสียงผ่าน Web Audio API + WSOLA time-stretching (pitch 1.25x) พร้อม cache ในหน่วยความจำ, ลดเสียงเพลงพื้นหลังอัตโนมัติ (`duckBGM` / `unduckBGM` ใน `bgm.js`) และสลับไปใช้ Web Speech API อัตโนมัติเมื่อออฟไลน์

## การทดสอบ

```bash
npm test
```

## การ Deploy บน Netlify

โปรเจกต์มีไฟล์ `netlify.toml` และ `netlify/functions/` (`tts.js`, `health.js`) พร้อมใช้งานสำหรับ route `/api/tts` และ `/api/health`
