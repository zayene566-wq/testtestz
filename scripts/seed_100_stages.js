const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

// --- DATA SOURCE ---

const generalQuestions = [
    { q: "ما هي عاصمة تونس؟", a: "تونس", options: ["صفاقس", "سوسة", "بنزرت"] },
    { q: "كم عدد أيام الأسبوع؟", a: "7", options: ["5", "6", "8"] },
    { q: "ما هو أكبر كوكب في النظام الشمسي؟", a: "المشتري", options: ["الأرض", "المريخ", "زحل"] },
    { q: "من هو مخترع المصباح الكهربائي؟", a: "إديسون", options: ["نيوتن", "آينشتاين", "غاليليو"] },
    { q: "كم عدد القارات في العالم؟", a: "7", options: ["5", "6", "8"] },
    { q: "ما هو الحيوان الملقّب بملك الغابة؟", a: "الأسد", options: ["النمر", "الفيل", "الذئب"] },
    { q: "ما هو البحر الذي يحد تونس شمالًا؟", a: "البحر الأبيض المتوسط", options: ["البحر الأحمر", "البحر الأسود", "بحر العرب"] },
    { q: "كم عدد الحروف في اللغة العربية؟", a: "28", options: ["26", "27", "29"] },
    { q: "ما هو أسرع حيوان بري؟", a: "الفهد", options: ["الحصان", "الغزال", "الكلب"] },
    { q: "ما هي عاصمة فرنسا؟", a: "باريس", options: ["روما", "مدريد", "برلين"] },
    { q: "ما هو الكوكب الأحمر؟", a: "المريخ", options: ["عطارد", "الزهراء", "نبتون"] },
    { q: "كم عدد أشهر السنة؟", a: "12", options: ["10", "11", "13"] },
    { q: "من هو أول نبي؟", a: "آدم", options: ["نوح", "إبراهيم", "موسى"] },
    { q: "ما هو أكبر محيط في العالم؟", a: "الهادئ", options: ["الأطلسي", "الهندي", "المتجمد"] },
    { q: "ما هو لون السماء في يوم صافٍ؟", a: "أزرق", options: ["أخضر", "أحمر", "أسود"] },
    { q: "كم عدد أرجل العنكبوت؟", a: "8", options: ["6", "10", "12"] },
    { q: "ما هو المعدن الذي يصدأ؟", a: "الحديد", options: ["الذهب", "الفضة", "النحاس"] },
    { q: "ما هي عاصمة مصر؟", a: "القاهرة", options: ["الإسكندرية", "الجيزة", "الأقصر"] },
    { q: "ما هو العضو المسؤول عن ضخ الدم؟", a: "القلب", options: ["الرئتان", "الدماغ", "المعدة"] },
    { q: "كم عدد أصابع اليد الواحدة؟", a: "5", options: ["3", "4", "6"] }
];

const countries = [
    { c: "السعودية", cap: "الرياض", w: ["جدة", "مكة", "الدمام"] },
    { c: "المغرب", cap: "الرباط", w: ["الدار البيضاء", "مراكش", "فاس"] },
    { c: "الجزائر", cap: "الجزائر", w: ["وهران", "قسنطينة", "عنابة"] },
    { c: "الإمارات", cap: "أبوظبي", w: ["دبي", "الشارقة", "عجمان"] },
    { c: "الأردن", cap: "عمان", w: ["العقبة", "إربد", "الزرقاء"] },
    { c: "لبنان", cap: "بيروت", w: ["طرابلس", "صيدا", "صور"] },
    { c: "العراق", cap: "بغداد", w: ["البصرة", "الموصل", "أربيل"] },
    { c: "السودان", cap: "الخرطوم", w: ["أم درمان", "بورتسودان", "كسلا"] },
    { c: "ليبيا", cap: "طرابلس", w: ["بنغازي", "مصراتة", "البيضاء"] },
    { c: "الكويت", cap: "الكويت", w: ["الجهراء", "حولي", "السالمية"] },
    { c: "قطر", cap: "الدوحة", w: ["الريان", "الوكرة", "الخور"] },
    { c: "البحرين", cap: "المنامة", w: ["المحرق", "الرفاع", "سترة"] },
    { c: "عمان", cap: "مسقط", w: ["صلالة", "صحار", "نزوى"] },
    { c: "اليمن", cap: "صنعاء", w: ["عدن", "تعز", "المكلا"] },
    { c: "فلسطين", cap: "القدس", w: ["غزة", "رام الله", "نابلس"] },
    { c: "ألمانيا", cap: "برلين", w: ["ميونخ", "هامبورغ", "فرانكفورت"] },
    { c: "إيطاليا", cap: "روما", w: ["ميلانو", "نابولي", "البندقية"] },
    { c: "إسبانيا", cap: "مدريد", w: ["برشلونة", "إشبيلية", "فالنسيا"] },
    { c: "بريطانيا", cap: "لندن", w: ["مانشستر", "ليفربول", "غلاسكو"] },
    { c: "اليابان", cap: "طوكيو", w: ["أوساكا", "كيوتو", "هيروشيما"] },
    { c: "الصين", cap: "بكين", w: ["شانغهاي", "غوانزو", "شينزين"] },
    { c: "روسيا", cap: "موسكو", w: ["سانت بطرسبرغ", "قازان", "سوتشي"] },
    { c: "الهند", cap: "نيودلهي", w: ["مومباي", "بنغالور", "تشيناي"] },
    { c: "الولايات المتحدة", cap: "واشنطن", w: ["نيويورك", "لوس أنجلوس", "شيكاغو"] },
    { c: "كندا", cap: "أوتاوا", w: ["تورونتو", "مونتريال", "فانكوفر"] },
    { c: "البرازيل", cap: "برازيليا", w: ["ريو دي جانيرو", "ساو باولو", "سلفادور"] },
    { c: "الأرجنتين", cap: "بوينس آيرس", w: ["قرطبة", "روزاريو", "ميندوزا"] },
    { c: "أستراليا", cap: "كانبرا", w: ["سيدني", "ملبورن", "بريزبان"] },
    { c: "تركيا", cap: "أنقرة", w: ["إسطنبول", "إزمير", "أنطاليا"] },
    { c: "إيران", cap: "طهران", w: ["مشهد", "أصفهان", "شيراز"] }
];

// --- HELPER FUNCTIONS ---

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateMathQuestion(difficulty) {
    let a, b, op, ans, text;
    const ops = ['+', '-', '*'];

    // Scale difficulty
    const max = difficulty * 5 + 10; // Level 1: ~15, Level 100: ~500

    op = ops[Math.floor(Math.random() * (difficulty > 50 ? 3 : 2))]; // Introduce * later

    if (op === '*') {
        a = Math.floor(Math.random() * (difficulty / 2)) + 2;
        b = Math.floor(Math.random() * 10) + 2;
    } else {
        a = Math.floor(Math.random() * max) + 1;
        b = Math.floor(Math.random() * max) + 1;
        if (op === '-' && b > a) [a, b] = [b, a]; // Ensure positive result
    }

    if (op === '+') ans = a + b;
    if (op === '-') ans = a - b;
    if (op === '*') ans = a * b;

    text = `${a} ${op} ${b} = ?`;

    // Generate wrong answers
    const wrongs = new Set();
    while (wrongs.size < 3) {
        let w = ans + Math.floor(Math.random() * 10) - 5;
        if (w !== ans && w >= 0) wrongs.add(w.toString());
    }

    return { q: text, a: ans.toString(), options: Array.from(wrongs) };
}

function generateGeographyQuestion() {
    const item = countries[Math.floor(Math.random() * countries.length)];
    return {
        q: `ما هي عاصمة ${item.c}؟`,
        a: item.cap,
        options: item.w
    };
}

// --- MAIN EXECUTION ---

db.serialize(() => {
    console.log("Starting 100 Stage Generation...");

    // 1. Cleanup Category 1
    console.log("Cleaning up old data for Category 1...");
    db.run("DELETE FROM stages WHERE category_id = 1");
    db.run("DELETE FROM questions WHERE stage_id IN (SELECT id FROM stages WHERE category_id = 1)"); // Redundant if cascade works, but safer

    // 2. Loop 100 times
    const stmtStage = db.prepare("INSERT INTO stages (category_id, sort_order, is_active) VALUES (?, ?, ?)");
    const stmtQuestion = db.prepare("INSERT INTO questions (stage_id, question_text, answer_1, answer_2, answer_3, answer_4, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)");

    let stagesCreated = 0;

    for (let i = 1; i <= 100; i++) {
        // Run synchronously-ish using serialize logic or callbacks?
        // db.run is async. For a loop, we need to be careful with 'this.lastID'.
        // Better to use a recursive function or promise chain if not using serialize.
        // Actually, inside .serialize(), operations are sequential.

        db.run("INSERT INTO stages (category_id, sort_order, is_active) VALUES (1, ?, 1)", [i], function (err) {
            if (err) {
                console.error(`Error creating stage ${i}:`, err);
                return;
            }

            const stageId = this.lastID;
            // Generate 6 Questions per stage
            const questions = [];
            const usedQuestions = new Set();

            // Mix content based on stage number
            let attempts = 0;
            while (questions.length < 6 && attempts < 50) {
                attempts++;
                let quest;

                // Content Strategy
                if (i <= 20) {
                    // Mix General + Math if needed to ensure 6 unique
                    if (Math.random() > 0.3) quest = generalQuestions[Math.floor(Math.random() * generalQuestions.length)];
                    else quest = generateGeographyQuestion();
                } else if (i <= 50) {
                    quest = generateGeographyQuestion();
                } else {
                    quest = generateMathQuestion(i);
                }

                // Avoid duplicates in this stage
                if (usedQuestions.has(quest.q)) continue;
                usedQuestions.add(quest.q);
                questions.push(quest);

                // Shuffle options
                const allOpts = [...quest.options, quest.a];
                shuffle(allOpts);

                const correctIdx = allOpts.indexOf(quest.a) + 1;

                stmtQuestion.run(
                    stageId,
                    quest.q,
                    allOpts[0], allOpts[1], allOpts[2], allOpts[3],
                    correctIdx
                );
            }

            stagesCreated++;
            if (stagesCreated % 10 === 0) console.log(`Created Stage ${i}...`);

            if (stagesCreated === 100) {
                stmtStage.finalize();
                stmtQuestion.finalize();
                console.log("All statement finalized. Done.");
            }
        });
    }

    console.log("Seeding queued. Waiting for completion...");
});

// Wait a bit before closing to allow queue to flush
setTimeout(() => {
    db.close(() => {
        console.log("Database closed. Done.");
    });
}, 5000);
