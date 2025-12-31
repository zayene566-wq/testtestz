import { state } from './state.js';
import { renderStars, showView, openModal, closeModal, playSound } from './utils.js';
import { api, buyStoreItem } from './api.js';
import { startStage } from './game.js';

export function updateHUD() {
    const { user } = state;
    if (!user) return;

    const starsEl = document.getElementById('hud-stars');
    if (starsEl) starsEl.textContent = user.stars;

    const heartsEl = document.getElementById('hud-hearts');
    if (heartsEl) {
        const now = new Date();
        const infinite = user.infinite_hearts_until && new Date(user.infinite_hearts_until) > now;

        if (infinite) {
            heartsEl.innerHTML = '<i class="fas fa-infinity"></i>';
            heartsEl.parentElement.classList.add('infinite-active');
        } else {
            heartsEl.textContent = user.hearts;
            heartsEl.parentElement.classList.remove('infinite-active');
        }
    }
}

export function renderCategories(categories) {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = `card ${cat.is_unlocked ? '' : 'locked'}`;
        card.style.borderColor = cat.color;
        card.innerHTML = `
            <div class="cat-icon" style="color:${cat.color}">
                <i class="${cat.icon || 'fas fa-star'}"></i>
            </div>
            <h3>${cat.name}</h3>
            ${!cat.is_unlocked ? `<small>${cat.unlock_cost} ⭐</small>` : ''}
        `;
        card.onclick = () => handleCategoryClick(cat);
        grid.appendChild(card);
    });
}

function handleCategoryClick(cat) {
    if (cat.is_unlocked) {
        loadStages(cat);
    } else {
        document.getElementById('unlock-cost').textContent = cat.unlock_cost;
        openModal('modal-unlock');
        document.getElementById('confirm-unlock').onclick = async () => {
            const res = await api.unlockCategory(cat.id);
            if (res.ok && res.data.success) {
                closeModal('modal-unlock');
                window.checkSession(); // Trigger refresh (exposed in main)
            } else {
                alert(res.data?.error || 'Cannot unlock');
                closeModal('modal-unlock');
            }
        };
    }
}

export async function loadStages(cat) {
    state.currentCategory = cat;
    showView('stages');
    document.getElementById('stage-cat-title').textContent = cat.name;

    const res = await api.getStages(cat.id);
    if (!res.ok) return;

    const list = document.getElementById('stages-list');
    list.innerHTML = '';

    res.data.forEach(stage => {
        const div = document.createElement('div');
        div.className = `stage-item ${stage.is_locked ? 'locked' : ''}`;
        div.innerHTML = `
            <span>
                ${stage.is_locked ? '<i class="fas fa-lock"></i> ' : ''} 
                المرحلة ${stage.sort_order}
            </span>
            <div class="stars-earned">
                ${renderStars(stage.stars_earned)}
            </div>
        `;

        if (!stage.is_locked) {
            div.onclick = () => startStage(stage);
        } else {
            div.onclick = () => alert('Complete previous stages first');
        }
        list.appendChild(div);
    });
}

export function loadProfile() {
    const { user, levelProgress } = state;
    if (!user) return;

    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-stars').textContent = user.stars;
    document.getElementById('profile-hearts').textContent = user.hearts;

    if (levelProgress) {
        document.getElementById('profile-level').textContent = levelProgress.level;
        document.getElementById('profile-current-xp').textContent = levelProgress.current;
        document.getElementById('profile-next-xp').textContent = levelProgress.required;

        let percent = 0;
        if (levelProgress.required > 0 && levelProgress.required < 900000) {
            percent = Math.min(100, Math.max(0, (levelProgress.current / levelProgress.required) * 100));
        } else if (levelProgress.required >= 900000) {
            percent = 100;
            document.getElementById('profile-next-xp').textContent = 'MAX';
        }
        document.getElementById('profile-xp-bar').style.width = `${percent}%`;
    }

    if (user.last_login) {
        const date = new Date(user.last_login);
        document.getElementById('profile-last-login').textContent = date.toLocaleDateString('ar-EG');
    }
}
