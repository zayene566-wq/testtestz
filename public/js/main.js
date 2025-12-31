import { state, setState } from './state.js';
import { api } from './api.js';
import { showView, closeModal, openModal, playMusic } from './utils.js';
import { updateHUD, renderCategories, loadProfile } from './ui.js';
import { retryStage, backToStages } from './game.js';
import { loadDailyRewardsView, checkDailyRewardPopup, buyItem } from './store.js';

console.log('🚀 Main.js loaded');

// Expose globals for HTML onclicks (legacy support)
window.showView = showView;
window.closeModal = closeModal;
window.retryStage = retryStage;
window.backToStages = backToStages;
window.buyItem = buyItem;
window.claimDailyReward = () => { /* Handled in store.js logic mostly */ };
window.checkNextLevelUp = () => { /* Logic in game.js now */ };

// Navigation
window.switchBottomNav = (section) => {
    if (section === 'events') { alert('Coming soon!'); return; }

    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === section) item.classList.add('active');
    });

    if (section === 'categories') {
        showView('categories');
    } else if (section === 'store') {
        showView('store');
    } else if (section === 'profile') {
        showView('profile');
        loadProfile();
    } else if (section === 'daily') {
        showView('daily-rewards');
        loadDailyRewardsView();
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Event Listeners
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username-input').value;
        const res = await api.login(username);
        if (res.ok && res.data.success) {
            checkSession();
        } else {
            alert('Login failed');
        }
    });

    // Initial Check
    checkSession();

    // Global click for music
    document.body.addEventListener('click', () => {
        playMusic();
    }, { once: true });
});

window.checkSession = async function () {
    const res = await api.getData();
    if (res.ok && res.data.user) {
        const { user, categories, levelProgress } = res.data;
        setState('user', user);
        setState('levelProgress', levelProgress);

        updateHUD();
        renderCategories(categories);

        document.getElementById('view-login').classList.add('hidden');
        document.getElementById('game-header').classList.remove('hidden');
        document.getElementById('view-categories').classList.remove('hidden');
        document.getElementById('bottom-nav').classList.remove('hidden'); // Show nav

        checkDailyRewardPopup();
    } else {
        document.getElementById('view-login').classList.remove('hidden');
        document.getElementById('game-header').classList.add('hidden');
        document.getElementById('bottom-nav').classList.add('hidden');
    }
}
