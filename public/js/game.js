import { state, setState } from './state.js';
import { api } from './api.js';
import { showView, openModal, closeModal, renderStars, playSound, stopMusic, playMusic } from './utils.js';
import { updateHUD, loadStages } from './ui.js';

const QUESTION_TIME = 15;

export async function startStage(stage) {
    const { user } = state;
    const now = new Date();
    const hasInfiniteHearts = user.infinite_hearts_until && new Date(user.infinite_hearts_until) > now;

    if (user.hearts <= 0 && !hasInfiniteHearts) {
        alert('No hearts left!');
        return;
    }

    setState('currentStage', stage);
    const res = await api.getQuestions(stage.id);

    if (!res.ok) {
        if (res.status === 401) window.location.reload();
        return;
    }

    const questions = res.data;
    if (!questions.length) {
        alert('No questions in this stage');
        return;
    }

    setState('currentQuestions', questions);
    setState('currentQuestionIndex', 0);
    setState('correctAnswersCount', 0);

    showView('quiz');
    renderQuestion();
}

function renderQuestion() {
    const { currentQuestionIndex, currentQuestions } = state;
    if (currentQuestionIndex >= currentQuestions.length) {
        finishStage();
        return;
    }

    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('q-counter').textContent = `${currentQuestionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex) / currentQuestions.length) * 100}%`;
    document.getElementById('question-text').textContent = q.question_text;

    const container = document.getElementById('answers-container');
    container.innerHTML = '';

    const answers = [
        { text: q.answer_1, index: 1 },
        { text: q.answer_2, index: 2 },
        { text: q.answer_3, index: 3 },
        { text: q.answer_4, index: 4 }
    ];

    answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = ans.text;
        btn.onclick = (e) => handleAnswer(ans.index, q.correct_answer, e.target);
        container.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(state.timerInterval);
    let timeLeft = QUESTION_TIME;
    const timerEl = document.getElementById('timer');
    const timerBar = document.getElementById('timer-bar');

    timerEl.textContent = timeLeft + 's';
    timerEl.classList.remove('timer-danger');
    timerBar.style.width = '100%';
    timerBar.style.backgroundColor = 'var(--warning)';

    const interval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft + 's';
        const percentage = (timeLeft / QUESTION_TIME) * 100;
        timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 5) {
            timerEl.classList.add('timer-danger');
            timerBar.style.backgroundColor = 'var(--danger)';
        }

        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            handleTimeout();
        }
    }, 1000);

    setState('timerInterval', interval);
}

function handleTimeout() {
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
    setTimeout(() => {
        state.currentQuestionIndex++;
        renderQuestion();
    }, 1500);
}

function handleAnswer(selectedIndex, correctIndex, btn) {
    clearInterval(state.timerInterval);
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

    if (selectedIndex == correctIndex) { // loose equality for string/num
        btn.classList.add('correct');
        state.correctAnswersCount++;
    } else {
        btn.classList.add('wrong');
    }

    setTimeout(() => {
        state.currentQuestionIndex++;
        renderQuestion();
    }, 1000);
}

async function finishStage() {
    const { correctAnswersCount, currentQuestions, currentStage } = state;

    console.log(`[FINISH] Correct: ${correctAnswersCount}/${currentQuestions.length}`);

    if (correctAnswersCount < 5) {
        stopMusic();
        playSound('lose');
        await api.failStage();

        // Refresh User
        window.checkSession();
        openModal('modal-fail');
        return;
    }

    // Success
    const accuracy = correctAnswersCount / currentQuestions.length;
    let starsEarned = 0;
    if (accuracy >= 0.9) starsEarned = 3;
    else if (accuracy >= 0.7) starsEarned = 2;
    else if (accuracy >= 0.5) starsEarned = 1;

    let xpAdded = 0;
    let levelUps = [];

    if (starsEarned > 0) {
        const res = await api.completeStage(currentStage.id, starsEarned);
        if (res.ok && res.data.success) {
            xpAdded = res.data.xpAdded;
            levelUps = res.data.levelUps || [];
            window.pendingLevelUps = levelUps;
            window.checkSession(); // Refresh HUD
        }
    }

    stopMusic();
    playSound('win');
    openModal('modal-success');
    document.getElementById('stars-result').innerHTML = renderStars(starsEarned);
    if (xpAdded > 0) {
        document.getElementById('stars-result').innerHTML += `<div style="margin-top:10px; font-weight:bold; color:#4facfe; font-size:1.2rem; animation: pulse 1s infinite">+${xpAdded} XP</div>`;
    }
}

export function retryStage() {
    closeModal('modal-fail');
    const { user, currentStage } = state;
    const now = new Date();
    const hasInfinite = user.infinite_hearts_until && new Date(user.infinite_hearts_until) > now;

    if (user.hearts > 0 || hasInfinite) {
        playMusic();
        startStage(currentStage);
    } else {
        alert('Not enough hearts');
        backToStages();
    }
}

export function backToStages() {
    closeModal('modal-success');
    closeModal('modal-fail');

    if (window.pendingLevelUps && window.pendingLevelUps.length > 0) {
        checkNextLevelUp();
        return;
    }

    playMusic();
    if (state.currentCategory) {
        loadStages(state.currentCategory);
    } else {
        showView('categories');
    }
}

function checkNextLevelUp() {
    closeModal('modal-level-up');
    if (window.pendingLevelUps && window.pendingLevelUps.length > 0) {
        const lvl = window.pendingLevelUps.shift();
        document.getElementById('new-level-num').textContent = lvl;
        openModal('modal-level-up');
        playSound('win');
    } else {
        playMusic();
        if (state.currentCategory) loadStages(state.currentCategory);
    }
}
