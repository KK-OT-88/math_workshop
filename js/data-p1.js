/**
 * data-p1.js
 * Grade 1 (ป.1) Math Workshop dataset - Christmas Edition.
 * Supports browser global (window.p1Data) for offline file:// and CommonJS for tests.
 */
(function (root) {
  const p1Data = {
    numbers: {
      key: 'numbers',
      sectionNumber: 1,
      title: 'ตอนที่ 1: จำนวนนับ 21 ถึง 100',
      shortTitle: 'จำนวนนับ 21–100',
      description: 'หลักสิบ หลักหน่วย รูปกระจาย เปรียบเทียบ และแบบรูป',
      icon: 'assets/christmas/star.svg',
      themeClass: 'theme-red',
      interactive: [
        {
          id: 1,
          prompt: '57 มีค่าเท่ากับกี่สิบ กี่หน่วย?',
          tts: 'ห้าสิบเจ็ด มีค่าเท่ากับกี่สิบ, กี่หน่วย',
          visual: { type: 'place-value', tens: 5, ones: 7, number: 57 },
          options: ['5 สิบ กับ 7 หน่วย', '7 สิบ กับ 5 หน่วย', '50 สิบ กับ 7 หน่วย'],
          answer: '5 สิบ กับ 7 หน่วย'
        },
        {
          id: 2,
          prompt: 'เขียน 84 ในรูปกระจายได้อย่างไร?',
          tts: 'เขียน แปดสิบสี่ ในรูปกระจายได้อย่างไร',
          visual: { type: 'place-value', tens: 8, ones: 4, number: 84 },
          options: ['80 + 4', '8 + 40', '80 + 40'],
          answer: '80 + 4'
        },
        {
          id: 3,
          prompt: 'คำอ่าน "หกสิบเก้า" เขียนเป็นตัวเลขฮินดูอารบิกได้อย่างไร?',
          tts: 'คำอ่าน หกสิบเก้า, เขียนเป็นตัวเลขฮินดูอารบิกได้อย่างไร',
          visual: { type: 'card-text', text: 'หกสิบเก้า', icon: 'assets/christmas/star.svg' },
          options: ['69', '96', '609'],
          answer: '69'
        },
        {
          id: 4,
          prompt: 'เติมเครื่องหมายเปรียบเทียบให้ถูกต้อง: 73 □ 58',
          tts: 'เปรียบเทียบจำนวน, เจ็ดสิบสาม มากกว่า น้อยกว่า หรือเท่ากับ ห้าสิบแปด',
          visual: { type: 'compare', left: 73, right: 58 },
          options: ['>', '<', '='],
          answer: '>'
        },
        {
          id: 5,
          prompt: 'เติมตัวเลขที่หายไปในแบบรูป: 25, 35, 45, □, 65',
          tts: 'เติมตัวเลขที่หายไปในแบบรูป, ยี่สิบห้า, สามสิบห้า, สี่สิบห้า, ตัวเลขต่อไปคืออะไร, หกสิบห้า',
          visual: { type: 'pattern', seq: ['25', '35', '45', '?', '65'] },
          options: ['50', '55', '60'],
          answer: '55'
        }
      ],
      static: {
        subtitle: 'เติมคำตอบในช่องว่างให้ถูกต้อง (7 คะแนน)',
        headerTts: 'ตอนที่ 1 จำนวนนับ 21 ถึง 100, เติมคำตอบในช่องว่างให้ถูกต้อง (7 คะแนน)',
        items: [
          {
            id: 1,
            html: 'จำนวน <strong>48</strong> มีค่าเท่ากับ {{4}} สิบ กับ {{8}} หน่วย',
            hint: '(เฉลย: 4 สิบ กับ 8 หน่วย)',
            tts: 'ข้อ 1, จำนวน สี่สิบแปด มีค่าเท่ากับ กี่สิบ กับ กี่หน่วย'
          },
          {
            id: 2,
            html: 'เขียนในรูปกระจาย: <strong>75</strong> = {{70}} + {{5}}',
            hint: '(เฉลย: 70 + 5)',
            tts: 'ข้อ 2, เขียน เจ็ดสิบห้า ในรูปกระจาย'
          },
          {
            id: 3,
            html: 'คำอ่าน <strong>"เก้าสิบสาม"</strong> เขียนเป็นตัวเลขฮินดูอารบิกได้คือ {{93}}',
            hint: '(เฉลย: 93)',
            tts: 'ข้อ 3, คำอ่าน เก้าสิบสาม เขียนเป็นตัวเลขฮินดูอารบิกได้คืออะไร'
          },
          {
            id: 4,
            html: 'เปรียบเทียบจำนวน (เติมเครื่องหมาย <code>&gt;</code>, <code>&lt;</code> หรือ <code>=</code>): <strong>64</strong> {{<}} <strong>81</strong>',
            hint: '(เฉลย: <)',
            tts: 'ข้อ 4, เปรียบเทียบจำนวน หกสิบสี่ กับ แปดสิบเอ็ด'
          },
          {
            id: 5,
            html: 'เติมตัวเลขที่หายไปในแบบรูป: 32, 42, 52, {{62}}, 72',
            hint: '(เฉลย: 62)',
            tts: 'ข้อ 5, เติมตัวเลขที่หายไปในแบบรูป สามสิบสอง, สี่สิบสอง, ห้าสิบสอง, อะไร, เจ็ดสิบสอง'
          }
        ]
      }
    },

    pictograph: {
      key: 'pictograph',
      sectionNumber: 2,
      title: 'ตอนที่ 2: แผนภูมิรูปภาพ',
      shortTitle: 'แผนภูมิรูปภาพ',
      description: 'อ่านข้อมูลจากรูปภาพคริสต์มาสและเปรียบเทียบจำนวน',
      icon: 'assets/christmas/gift.svg',
      themeClass: 'theme-green',
      interactive: {
        chart: {
          title: 'จำนวนของตกแต่งต้นคริสต์มาสที่ซานต้าเตรียมไว้ (กำหนดให้ 1 รูป แทน 1 ชิ้น)',
          rows: [
            { label: 'ต้นสนจิ๋ว', emoji: '🎄', icon: 'assets/christmas/tree.svg', count: 6 },
            { label: 'ตุ๊กตาหิมะ', emoji: '⛄', icon: 'assets/christmas/snowman.svg', count: 4 },
            { label: 'กระดิ่งทอง', emoji: '🔔', icon: 'assets/christmas/bell.svg', count: 8 },
            { label: 'กวางเรนเดียร์', emoji: '🦌', icon: 'assets/christmas/reindeer.svg', count: 5 }
          ]
        },
        questions: [
          {
            id: 1,
            prompt: 'ซานต้ามี ต้นสนจิ๋ว ทั้งหมดกี่ชิ้น?',
            tts: 'ซานต้ามี ต้นสนจิ๋ว ทั้งหมดกี่ชิ้น',
            options: ['5', '6', '7'],
            answer: '6'
          },
          {
            id: 2,
            prompt: 'ของตกแต่งที่มีจำนวน มากที่สุด คืออะไร?',
            tts: 'ของตกแต่งที่มีจำนวน มากที่สุด คืออะไร',
            options: ['ต้นสนจิ๋ว', 'กระดิ่งทอง', 'กวางเรนเดียร์'],
            answer: 'กระดิ่งทอง'
          },
          {
            id: 3,
            prompt: 'ซานต้ามี กระดิ่งทอง มากกว่า ตุ๊กตาหิมะ กี่ชิ้น?',
            tts: 'ซานต้ามี กระดิ่งทอง มากกว่า ตุ๊กตาหิมะ กี่ชิ้น',
            options: ['3', '4', '5'],
            answer: '4'
          },
          {
            id: 4,
            prompt: 'รวมทั้งหมดซานต้ามีของตกแต่งกี่ชิ้น?',
            tts: 'รวมทั้งหมดซานต้ามีของตกแต่งกี่ชิ้น',
            options: ['21', '23', '25'],
            answer: '23'
          }
        ]
      },
      static: {
        subtitle: 'ดูแผนภูมิรูปภาพแล้วตอบคำถาม (4 คะแนน)',
        headerTts: 'ตอนที่ 2 แผนภูมิรูปภาพ, พิจารณารูปภาพแสดงจำนวนของขวัญคริสต์มาสที่ใบบัวสะสมได้ แล้วตอบคำถาม (กำหนดให้ รูปภาพ 1 รูป แทนจำนวน 1 ชิ้น)',
        chart: {
          title: 'พิจารณารูปภาพแสดงจำนวนของขวัญคริสต์มาสที่ใบบัวสะสมได้ แล้วตอบคำถาม (กำหนดให้ รูปภาพ 1 รูป แทนจำนวน 1 ชิ้น)',
          rows: [
            { label: 'กล่องของขวัญ', emoji: '🎁', icon: 'assets/christmas/gift.svg', count: 7 },
            { label: 'กระดิ่ง', emoji: '🔔', icon: 'assets/christmas/bell.svg', count: 5 },
            { label: 'ดาว', emoji: '⭐', icon: 'assets/christmas/star.svg', count: 3 },
            { label: 'ลูกกวาด', emoji: '🍬', icon: 'assets/christmas/candy.svg', count: 9 }
          ]
        },
        items: [
          {
            id: 1,
            html: 'ใบบัวสะสม <strong>กล่องของขวัญ</strong> ได้ทั้งหมด {{7}} ชิ้น',
            hint: '(เฉลย: 7)',
            tts: 'ข้อ 1, ใบบัวสะสม กล่องของขวัญ ได้ทั้งหมดกี่ชิ้น'
          },
          {
            id: 2,
            html: 'สิ่งของที่ใบบัวสะสมได้ <strong>มากที่สุด</strong> คือ {{ลูกกวาด|wide}}',
            hint: '(เฉลย: ลูกกวาด)',
            tts: 'ข้อ 2, สิ่งของที่ใบบัวสะสมได้ มากที่สุด คืออะไร'
          },
          {
            id: 3,
            html: 'ใบบัวสะสม <strong>กระดิ่ง</strong> ได้มากกว่า <strong>ดาว</strong> อยู่ {{2}} ชิ้น',
            hint: '(เฉลย: 2)',
            tts: 'ข้อ 3, ใบบัวสะสม กระดิ่ง ได้มากกว่า ดาว อยู่กี่ชิ้น'
          },
          {
            id: 4,
            html: 'รวมทั้งหมดใบบัวสะสมของคริสต์มาสได้ {{24}} ชิ้น',
            hint: '(เฉลย: 24)',
            tts: 'ข้อ 4, รวมทั้งหมดใบบัวสะสมของคริสต์มาสได้กี่ชิ้น'
          }
        ]
      }
    },

    multiplication: {
      key: 'multiplication',
      sectionNumber: 3,
      title: 'ตอนที่ 3: สนุกกับสูตรคูณ แม่ 2 และ แม่ 3',
      shortTitle: 'สูตรคูณ แม่ 2 และ 3',
      description: 'ฝึกท่องและคำนวณผลคูณแม่ 2 กับแม่ 3 พร้อมภาพช่วยนับ',
      icon: 'assets/christmas/bell.svg',
      themeClass: 'theme-gold',
      interactive: [
        { id: 1, a: 2, b: 1, prompt: '2 × 1 = ?', tts: 'สอง คูณ หนึ่ง เท่ากับเท่าไร', visual: { type: 'groups', groups: 1, perGroup: 2, icon: 'assets/christmas/candy.svg' }, options: ['2', '3', '4'], answer: '2' },
        { id: 2, a: 2, b: 3, prompt: '2 × 3 = ?', tts: 'สอง คูณ สาม เท่ากับเท่าไร', visual: { type: 'groups', groups: 3, perGroup: 2, icon: 'assets/christmas/candy.svg' }, options: ['5', '6', '8'], answer: '6' },
        { id: 3, a: 2, b: 5, prompt: '2 × 5 = ?', tts: 'สอง คูณ ห้า เท่ากับเท่าไร', visual: { type: 'groups', groups: 5, perGroup: 2, icon: 'assets/christmas/gift.svg' }, options: ['8', '10', '12'], answer: '10' },
        { id: 4, a: 2, b: 7, prompt: '2 × 7 = ?', tts: 'สอง คูณ เจ็ด เท่ากับเท่าไร', visual: { type: 'groups', groups: 7, perGroup: 2, icon: 'assets/christmas/bell.svg' }, options: ['12', '14', '16'], answer: '14' },
        { id: 5, a: 2, b: 10, prompt: '2 × 10 = ?', tts: 'สอง คูณ สิบ เท่ากับเท่าไร', visual: { type: 'groups', groups: 10, perGroup: 2, icon: 'assets/christmas/star.svg' }, options: ['12', '20', '22'], answer: '20' },
        { id: 6, a: 3, b: 1, prompt: '3 × 1 = ?', tts: 'สาม คูณ หนึ่ง เท่ากับเท่าไร', visual: { type: 'groups', groups: 1, perGroup: 3, icon: 'assets/christmas/tree.svg' }, options: ['3', '4', '6'], answer: '3' },
        { id: 7, a: 3, b: 4, prompt: '3 × 4 = ?', tts: 'สาม คูณ สี่ เท่ากับเท่าไร', visual: { type: 'groups', groups: 4, perGroup: 3, icon: 'assets/christmas/gingerbread.svg' }, options: ['9', '12', '15'], answer: '12' },
        { id: 8, a: 3, b: 6, prompt: '3 × 6 = ?', tts: 'สาม คูณ หก เท่ากับเท่าไร', visual: { type: 'groups', groups: 6, perGroup: 3, icon: 'assets/christmas/snowman.svg' }, options: ['16', '18', '21'], answer: '18' },
        { id: 9, a: 3, b: 8, prompt: '3 × 8 = ?', tts: 'สาม คูณ แปด เท่ากับเท่าไร', visual: { type: 'groups', groups: 8, perGroup: 3, icon: 'assets/christmas/reindeer.svg' }, options: ['21', '24', '27'], answer: '24' },
        { id: 10, a: 3, b: 10, prompt: '3 × 10 = ?', tts: 'สาม คูณ สิบ เท่ากับเท่าไร', visual: { type: 'groups', groups: 10, perGroup: 3, icon: 'assets/christmas/gift.svg' }, options: ['27', '30', '33'], answer: '30' }
      ],
      static: {
        subtitle: 'เติมผลลัพธ์ของการคูณลงในช่องว่างให้ถูกต้อง (10 คะแนน)',
        headerTts: 'ตอนที่ 3 สนุกกับสูตรคูณ แม่ 2 และ แม่ 3, เติมผลลัพธ์ของการคูณลงในช่องว่างให้ถูกต้อง (10 คะแนน)',
        table2: [
          { num: 1, a: 2, b: 2, html: '1) 2 × 2 = {{4}}', hint: '(4)', tts: 'ข้อ 1, สอง คูณ สอง เท่ากับเท่าไร' },
          { num: 2, a: 2, b: 4, html: '2) 2 × 4 = {{8}}', hint: '(8)', tts: 'ข้อ 2, สอง คูณ สี่ เท่ากับเท่าไร' },
          { num: 3, a: 2, b: 6, html: '3) 2 × 6 = {{12}}', hint: '(12)', tts: 'ข้อ 3, สอง คูณ หก เท่ากับเท่าไร' },
          { num: 4, a: 2, b: 8, html: '4) 2 × 8 = {{16}}', hint: '(16)', tts: 'ข้อ 4, สอง คูณ แปด เท่ากับเท่าไร' },
          { num: 5, a: 2, b: 9, html: '5) 2 × 9 = {{18}}', hint: '(18)', tts: 'ข้อ 5, สอง คูณ เก้า เท่ากับเท่าไร' }
        ],
        table3: [
          { num: 6, a: 3, b: 2, html: '6) 3 × 2 = {{6}}', hint: '(6)', tts: 'ข้อ 6, สาม คูณ สอง เท่ากับเท่าไร' },
          { num: 7, a: 3, b: 3, html: '7) 3 × 3 = {{9}}', hint: '(9)', tts: 'ข้อ 7, สาม คูณ สาม เท่ากับเท่าไร' },
          { num: 8, a: 3, b: 5, html: '8) 3 × 5 = {{15}}', hint: '(15)', tts: 'ข้อ 8, สาม คูณ ห้า เท่ากับเท่าไร' },
          { num: 9, a: 3, b: 7, html: '9) 3 × 7 = {{21}}', hint: '(21)', tts: 'ข้อ 9, สาม คูณ เจ็ด เท่ากับเท่าไร' },
          { num: 10, a: 3, b: 9, html: '10) 3 × 9 = {{27}}', hint: '(27)', tts: 'ข้อ 10, สาม คูณ เก้า เท่ากับเท่าไร' }
        ]
      }
    },

    wordproblems: {
      key: 'wordproblems',
      sectionNumber: 4,
      title: 'ตอนที่ 4: โจทย์ปัญหาการบวกและการลบ ไม่เกิน 100',
      shortTitle: 'โจทย์ปัญหา บวก-ลบ ≤ 100',
      description: 'วิเคราะห์โจทย์ปัญหาและหาคำตอบไม่เกิน 100',
      icon: 'assets/christmas/santa.svg',
      themeClass: 'theme-pine',
      interactive: [
        {
          id: 1,
          a: 32,
          b: 25,
          op: '+',
          prompt: 'ซานต้ามีของขวัญในถุง 32 กล่อง เอลฟ์นำมาเพิ่มอีก 25 กล่อง รวมมีของขวัญทั้งหมดกี่กล่อง?',
          tts: 'ซานต้ามีของขวัญในถุง สามสิบสอง กล่อง, เอลฟ์นำมาเพิ่มอีก ยี่สิบห้า กล่อง, รวมมีของขวัญทั้งหมดกี่กล่อง',
          visual: { type: 'word-problem', left: 32, op: '+', right: 25, unit: 'กล่อง', icon: 'assets/christmas/gift.svg' },
          options: ['55', '57', '67'],
          answer: '57'
        },
        {
          id: 2,
          a: 68,
          b: 24,
          op: '-',
          prompt: 'ต้นคริสต์มาสมีไฟประดับ 68 ดวง ดับไป 24 ดวง เหลือไฟที่ยังสว่างอยู่กี่ดวง?',
          tts: 'ต้นคริสต์มาสมีไฟประดับ หกสิบแปด ดวง, ดับไป ยี่สิบสี่ ดวง, เหลือไฟที่ยังสว่างอยู่กี่ดวง',
          visual: { type: 'word-problem', left: 68, op: '-', right: 24, unit: 'ดวง', icon: 'assets/christmas/tree.svg' },
          options: ['34', '44', '46'],
          answer: '44'
        },
        {
          id: 3,
          a: 41,
          b: 38,
          op: '+',
          prompt: 'แซนดี้ทำคุกกี้ผิงไฟได้ 41 ชิ้น ทำเพิ่มอีก 38 ชิ้น แซนดี้มีคุกกี้ทั้งหมดกี่ชิ้น?',
          tts: 'แซนดี้ทำคุกกี้ผิงไฟได้ สี่สิบเอ็ด ชิ้น, ทำเพิ่มอีก สามสิบแปด ชิ้น, แซนดี้มีคุกกี้ทั้งหมดกี่ชิ้น',
          visual: { type: 'word-problem', left: 41, op: '+', right: 38, unit: 'ชิ้น', icon: 'assets/christmas/gingerbread.svg' },
          options: ['69', '78', '79'],
          answer: '79'
        },
        {
          id: 4,
          a: 95,
          b: 52,
          op: '-',
          prompt: 'ร้านขายการ์ดคริสต์มาสมี 95 ใบ ขายไปแล้ว 52 ใบ เหลือการ์ดกี่ใบ?',
          tts: 'ร้านขายการ์ดคริสต์มาสมี เก้าสิบห้า ใบ, ขายไปแล้ว ห้าสิบสอง ใบ, เหลือการ์ดกี่ใบ',
          visual: { type: 'word-problem', left: 95, op: '-', right: 52, unit: 'ใบ', icon: 'assets/christmas/bell.svg' },
          options: ['43', '45', '53'],
          answer: '43'
        },
        {
          id: 5,
          a: 40,
          b: 30,
          op: '+',
          prompt: 'กวางเรนเดียร์วิ่งรอบหมู่บ้านวันแรก 40 รอบ วันที่สองวิ่งอีก 30 รอบ รวมสองวันวิ่งได้กี่รอบ?',
          tts: 'กวางเรนเดียร์วิ่งรอบหมู่บ้านวันแรก สี่สิบ รอบ, วันที่สองวิ่งอีก สามสิบ รอบ, รวมสองวันวิ่งได้กี่รอบ',
          visual: { type: 'word-problem', left: 40, op: '+', right: 30, unit: 'รอบ', icon: 'assets/christmas/reindeer.svg' },
          options: ['60', '70', '80'],
          answer: '70'
        }
      ],
      static: {
        subtitle: 'เขียนประโยคสัญลักษณ์และหาคำตอบ (5 คะแนน)',
        headerTts: 'ตอนที่ 4 โจทย์ปัญหาการบวกและการลบ ไม่เกิน 100, เขียนประโยคสัญลักษณ์และหาคำตอบ (5 คะแนน)',
        items: [
          {
            id: 1,
            a: 24,
            b: 15,
            op: '+',
            storyHtml: 'มีนะอ่านหนังสือวันแรกได้ <strong>24</strong> หน้า วันที่สองอ่านได้อีก <strong>15</strong> หน้า รวมสองวันมีนะอ่านหนังสือได้กี่หน้า?',
            exprPlaceholder: 'เช่น 24 + 15 = □',
            answerHtml: '{{39}} หน้า',
            hint: '(เฉลย: 39)',
            tts: 'ข้อ 1, มีนะอ่านหนังสือวันแรกได้ ยี่สิบสี่ หน้า, วันที่สองอ่านได้อีก สิบห้า หน้า, รวมสองวันมีนะอ่านหนังสือได้กี่หน้า'
          },
          {
            id: 2,
            a: 58,
            b: 23,
            op: '-',
            storyHtml: 'คุณแม่มีไข่ไก่ <strong>58</strong> ฟอง นำไปทำขนม <strong>23</strong> ฟอง คุณแม่เหลือไข่ไก่กี่ฟอง?',
            exprPlaceholder: 'เขียนประโยคสัญลักษณ์',
            answerHtml: '{{35}} ฟอง',
            hint: '(เฉลย: 35)',
            tts: 'ข้อ 2, คุณแม่มีไข่ไก่ ห้าสิบแปด ฟอง, นำไปทำขนม ยี่สิบสาม ฟอง, คุณแม่เหลือไข่ไก่กี่ฟอง'
          },
          {
            id: 3,
            a: 36,
            b: 42,
            op: '+',
            storyHtml: 'ในตะกร้ามีลูกบอลสีแดง <strong>36</strong> ลูก และลูกบอลสีฟ้า <strong>42</strong> ลูก มีลูกบอลทั้งหมดกี่ลูก?',
            exprPlaceholder: 'เขียนประโยคสัญลักษณ์',
            answerHtml: '{{78}} ลูก',
            hint: '(เฉลย: 78)',
            tts: 'ข้อ 3, ในตะกร้ามีลูกบอลสีแดง สามสิบหก ลูก, และลูกบอลสีฟ้า สี่สิบสอง ลูก, มีลูกบอลทั้งหมดกี่ลูก'
          },
          {
            id: 4,
            a: 89,
            b: 45,
            op: '-',
            storyHtml: 'ร้านค้ามีดินสอ <strong>89</strong> แท่ง ขายไป <strong>45</strong> แท่ง ร้านค้าเหลือดินสอกี่แท่ง?',
            exprPlaceholder: 'เขียนประโยคสัญลักษณ์',
            answerHtml: '{{44}} แท่ง',
            hint: '(เฉลย: 44)',
            tts: 'ข้อ 4, ร้านค้ามีดินสอ แปดสิบเก้า แท่ง, ขายไป สี่สิบห้า แท่ง, ร้านค้าเหลือดินสอกี่แท่ง'
          },
          {
            id: 5,
            a: 50,
            b: 30,
            op: '+',
            storyHtml: 'พ่อปลูกต้นไม้ไว้ <strong>50</strong> ต้น วันนี้ปลูกเพิ่มอีก <strong>30</strong> ต้น พ่อมีต้นไม้ทั้งหมดกี่ต้น?',
            exprPlaceholder: 'เขียนประโยคสัญลักษณ์',
            answerHtml: '{{80}} ต้น',
            hint: '(เฉลย: 80)',
            tts: 'ข้อ 5, พ่อปลูกต้นไม้ไว้ ห้าสิบ ต้น, วันนี้ปลูกเพิ่มอีก สามสิบ ต้น, พ่อมีต้นไม้ทั้งหมดกี่ต้น'
          }
        ]
      }
    }
  };

  root.p1Data = p1Data;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = p1Data;
  }
})(typeof window !== 'undefined' ? window : globalThis);
