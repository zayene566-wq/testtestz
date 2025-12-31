const API_BASE = '/api/game';

export async function fetchJson(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });

        // Handle 401 globally
        if (res.status === 401 && !endpoint.includes('login')) {
            window.location.reload();
            return null;
        }

        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        console.error('API Error:', err);
        return { ok: false, error: err };
    }
}

export const api = {
    login: (username) => fetchJson('/login', { method: 'POST', body: JSON.stringify({ username }) }),
    getData: () => fetchJson('/data'),
    unlockCategory: (categoryId) => fetchJson('/unlock-category', { method: 'POST', body: JSON.stringify({ categoryId }) }),
    getStages: (categoryId) => fetchJson(`/stages/${categoryId}`),
    getQuestions: (stageId) => fetchJson(`/questions/${stageId}`),
    completeStage: (stageId, starsEarned) => fetchJson('/complete-stage', { method: 'POST', body: JSON.stringify({ stageId, starsEarned }) }),
    failStage: () => fetchJson('/fail-stage', { method: 'POST' }),
    getDailyReward: () => fetchJson('/daily-reward'),
    claimDailyReward: () => fetchJson('/claim-daily-reward', { method: 'POST' }),
    buyItem: (itemType) => fetchJson('/store/buy', { method: 'POST', body: JSON.stringify({ itemType }) }) // Note: Store route is /api/store but API_BASE is /api/game. Needs fix.
};

// Store route override
export async function buyStoreItem(itemType) {
    return fetch('/api/store/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType })
    }).then(res => res.json());
}
