const db = require('./database');

db.all('SELECT id, question_text, answer_1, correct_answer FROM questions WHERE stage_id=1', (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Total Questions in Stage 1:', rows.length);
    console.log('------------------------------------------------');
    console.log('Sample Questions (First 10):');
    rows.slice(0, 10).forEach(q => {
        console.log(`- [ID: ${q.id}] ${q.question_text}`);
        console.log(`  Option 1: ${q.answer_1}`);
        console.log(`  Correct Answer Index: ${q.correct_answer}`);
    });
    console.log('------------------------------------------------');
});
