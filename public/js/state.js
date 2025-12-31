// Global State
export const state = {
    user: null,
    levelProgress: null,
    currentCategory: null,
    currentStage: null,
    currentQuestions: [],
    currentQuestionIndex: 0,
    correctAnswersCount: 0,
    timerInterval: null
};

export function setState(key, value) {
    state[key] = value;
}

export function resetGameState() {
    state.currentQuestions = [];
    state.currentQuestionIndex = 0;
    state.correctAnswersCount = 0;
    if (state.timerInterval) clearInterval(state.timerInterval);
}
