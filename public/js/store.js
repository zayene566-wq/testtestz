import { api, buyStoreItem } from './api.js';
import { openModal, closeModal, playSound } from './utils.js';

export async function loadDailyRewardsView() {
    const res = await api.getDailyReward();
    if (!res.ok) return;

    const data = res.data;
    document.getElementById('streak-count').textContent = data.currentStreak || 0;
    renderDailyRewardsGrid(data);
}

function renderDailyRewardsGrid(data) {
    const grid = document.getElementById('daily-rewards-grid');
    grid.innerHTML = '';

    const typeLabels = { 'stars': 'نجوم', 'hearts': 'قلوب', 'boost_15m': 'تعزيز 15د', 'boost_5h': 'تعزيز 5س' };
    const icons = { 'stars': 'fa-star', 'hearts': 'fa-heart', 'boost_15m': 'fa-bolt', 'boost_5h': 'fa-fire' };

    data.rewards.forEach(reward => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';

        if (data.claimedDays.includes(reward.day_number)) {
            dayCard.classList.add('completed');
        } else if (reward.day_number === data.currentDay && data.canClaim) {
            dayCard.classList.add('available');
            dayCard.onclick = () => claimDailyRewardFromGrid(reward.day_number);
        } else {
            dayCard.classList.add('locked');
        }

        dayCard.innerHTML = `
            <div class="day-number">يوم ${reward.day_number}</div>
            <div class="day-icon"><i class="fas ${icons[reward.reward_type]} fa-2x"></i></div>
            <div class="day-value">${reward.reward_value}</div>
            <div class="day-type">${typeLabels[reward.reward_type]}</div>
            ${data.claimedDays.includes(reward.day_number) ? '<i class="fas fa-check-circle check-icon"></i>' : ''}
            ${reward.day_number === data.currentDay && data.canClaim ? '<div class="pulse-ring"></div>' : ''}
        `;
        grid.appendChild(dayCard);
    });
}

async function claimDailyRewardFromGrid() {
    const res = await api.claimDailyReward();
    if (res.ok && res.data.success) {
        playSound('collect');
        alert(res.data.message);
        window.checkSession();
        loadDailyRewardsView();
    } else {
        alert(res.data?.error || 'Claim failed');
    }
}

export async function checkDailyRewardPopup() {
    const res = await api.getDailyReward();
    if (res.ok && res.data.canClaim && res.data.currentDay) {
        // Find current reward
        const currentReward = res.data.rewards.find(r => r.day_number === res.data.currentDay);
        if (currentReward) {
            // Show popup logic here if desired, or relying on grid
            // We can just log it or show modal
            // For brevity, skipping auto-popup in favor of "Awards" tab badge or notification
            const badge = document.getElementById('daily-badge');
            if (badge) badge.classList.remove('hidden');
        }
    }
}

export async function buyItem(itemType) {
    if (!confirm('Buy item?')) return;
    try {
        const data = await buyStoreItem(itemType);
        if (data.success) {
            playSound('collect');
            alert(data.message);
            window.checkSession();
        } else {
            alert(data.error || 'Failed');
        }
    } catch {
        alert('Error');
    }
}
