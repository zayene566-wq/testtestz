const API_BASE = '/api/admin';
const AUTH_API = '/api/auth';

// State
let currentUser = null;
let currentCategory = null;
let currentStage = null;

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    categories: document.getElementById('view-categories'),
    users: document.getElementById('view-users'),
    'daily-rewards': document.getElementById('view-daily-rewards'),
    'levels': document.getElementById('view-levels')
};

const authSection = document.getElementById('auth-section');
const appLayout = document.getElementById('app-layout');
const sidebar = document.getElementById('sidebar');
const pageTitle = document.getElementById('page-title');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const viewName = item.dataset.view;
            if (viewName) {
                switchView(viewName);
                // Close sidebar on mobile
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });

    // Mobile Menu
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    document.getElementById('close-sidebar').addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Login Form
    document.getElementById('login-form').addEventListener('submit', handleLogin);

    // Forms
    document.getElementById('category-form').addEventListener('submit', handleSaveCategory);
    document.getElementById('stage-form').addEventListener('submit', handleSaveStage);
    document.getElementById('question-form').addEventListener('submit', handleSaveQuestion);

    // Levels Form
    document.getElementById('level-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('level-id').value;
        const data = {
            level_number: document.getElementById('level-number').value,
            level_name: document.getElementById('level-name').value,
            xp_required: document.getElementById('level-xp').value
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/levels/${id}` : `${API_BASE}/levels`;

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                closeModal('level-modal');
                loadLevels();
            } else {
                const err = await res.json();
                alert(err.error || 'حدث خطأ');
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في الاتصال');
        }
    });
}

// Auth Functions
async function checkAuth() {
    try {
        const res = await fetch(`${AUTH_API}/check`);
        const data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            showApp();
        } else {
            showLogin();
        }
    } catch (err) {
        console.error('Auth check failed', err);
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
        const res = await fetch(`${AUTH_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;
            showApp();
        } else {
            alert('بيانات الدخول غير صحيحة');
        }
    } catch (err) {
        alert('حدث خطأ في الاتصال');
    }
}

async function logout() {
    await fetch(`${AUTH_API}/logout`, { method: 'POST' });
    window.location.reload();
}

function showLogin() {
    authSection.classList.remove('hidden');
    appLayout.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appLayout.classList.remove('hidden');
    switchView('dashboard');
}

// View Management
function switchView(viewName) {
    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) item.classList.add('active');
    });

    // Hide all views
    Object.values(views).forEach(el => el.classList.add('hidden'));

    // Show selected view
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }

    // Load Data
    if (viewName === 'dashboard') loadDashboard();
    if (viewName === 'categories') loadCategories();
    if (viewName === 'users') loadUsers();
    if (viewName === 'daily-rewards') loadDailyRewards();
    if (viewName === 'levels') loadLevels();

    // Set Title
    const titles = {
        dashboard: 'لوحة القيادة',
        categories: 'إدارة الكاتيغوري',
        users: 'إدارة اللاعبين',
        'daily-rewards': 'المكافآت اليومية',
        'levels': 'إدارة المستويات'
    };
    pageTitle.textContent = titles[viewName];
}

// Dashboard Logic
async function loadDashboard() {
    const res = await fetch(`${API_BASE}/stats`);
    const stats = await res.json();

    document.getElementById('stat-players').textContent = stats.players;
    document.getElementById('stat-stars').textContent = stats.totalStars;
    document.getElementById('stat-categories').textContent = stats.categories;
    document.getElementById('stat-stages').textContent = stats.stages;

    const tbody = document.querySelector('#top-players-table tbody');
    tbody.innerHTML = '';
    stats.topPlayers.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.username}</td><td>${p.stars} <i class="fas fa-star text-warning"></i></td>`;
        tbody.appendChild(tr);
    });
}

// Categories Logic
async function loadCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    const categories = await res.json();
    const tbody = document.querySelector('#categories-table tbody');
    tbody.innerHTML = '';

    categories.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat.sort_order}</td>
            <td style="color:${cat.color}"><i class="${cat.icon || 'fas fa-rocket'}"></i> ${cat.name}</td>
            <td><span style="display:inline-block;width:20px;height:20px;background:${cat.color};border-radius:50%"></span> ${cat.color}</td>
            <td>${cat.unlock_cost} ⭐</td>
            <td>${cat.is_active ? '<span class="text-success">مفعل</span>' : '<span class="text-danger">معطل</span>'}</td>
            <td>
                <button class="btn-sm btn-primary" onclick='editCategory(${JSON.stringify(cat)})'>تعديل</button>
                <button class="btn-sm btn-primary" onclick='loadStages(${cat.id}, "${cat.name}")'>المراحل</button>
                <button class="btn-sm btn-danger" onclick="deleteCategory(${cat.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Hide stages container when reloading categories list
    document.getElementById('stages-container').classList.add('hidden');
}

function openCategoryModal(cat = null) {
    const modal = document.getElementById('category-modal');
    modal.classList.remove('hidden');
    document.getElementById('cat-modal-title').textContent = cat ? 'تعديل كاتيغوري' : 'إضافة كاتيغوري';

    document.getElementById('cat-id').value = cat ? cat.id : '';
    document.getElementById('cat-name').value = cat ? cat.name : '';
    document.getElementById('cat-color').value = cat ? cat.color : '#3b82f6';
    document.getElementById('cat-cost').value = cat ? cat.unlock_cost : 0;
    document.getElementById('cat-order').value = cat ? cat.sort_order : 0;
    document.getElementById('cat-active').checked = cat ? !!cat.is_active : true;
}

window.editCategory = (cat) => openCategoryModal(cat);

async function handleSaveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const data = {
        name: document.getElementById('cat-name').value,
        color: document.getElementById('cat-color').value,
        unlock_cost: document.getElementById('cat-cost').value,
        sort_order: document.getElementById('cat-order').value,
        is_active: document.getElementById('cat-active').checked
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/categories/${id}` : `${API_BASE}/categories`;

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    closeModal('category-modal');
    loadCategories();
}

window.deleteCategory = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الكاتيغوري؟')) {
        await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
        loadCategories();
    }
};

// Stages Logic
window.loadStages = async (catId, catName) => {
    currentCategory = { id: catId, name: catName };
    document.getElementById('current-category-name').textContent = catName;
    document.getElementById('stages-container').classList.remove('hidden');

    const res = await fetch(`${API_BASE}/stages?category_id=${catId}`);
    const stages = await res.json();
    const list = document.getElementById('stages-list');
    list.innerHTML = '';

    for (const stage of stages) {
        const div = document.createElement('div');
        div.className = 'stage-item';
        div.style.background = '#f8fafc';
        div.style.padding = '1rem';
        div.style.marginBottom = '1rem';
        div.style.borderRadius = '8px';
        div.style.border = '1px solid #e2e8f0';

        div.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>المرحلة ${stage.sort_order}</strong>
                <div>
                     ${stage.is_active ? '<span class="text-success">مفعل</span>' : '<span class="text-danger">معطل</span>'}
                     <button class="btn-sm btn-primary" onclick='editStage(${JSON.stringify(stage)})'>تعديل</button>
                     <button class="btn-sm btn-danger" onclick="deleteStage(${stage.id})">حذف</button>
                     <button class="btn-sm btn-primary" onclick="toggleQuestions(${stage.id}, this)">الأسئلة</button>
                </div>
            </div>
            <div id="questions-container-${stage.id}" class="hidden" style="margin-top:1rem;padding-right:1rem;border-right:2px solid #ddd;"></div>
        `;
        list.appendChild(div);
    }

    // Scroll to stages
    document.getElementById('stages-container').scrollIntoView({ behavior: 'smooth' });
};

function openStageModal(stage = null) {
    const modal = document.getElementById('stage-modal');
    modal.classList.remove('hidden');
    document.getElementById('stage-id').value = stage ? stage.id : '';
    document.getElementById('stage-order').value = stage ? stage.sort_order : 0;
    document.getElementById('stage-active').checked = stage ? !!stage.is_active : true;
}

window.editStage = (stage) => openStageModal(stage);

async function handleSaveStage(e) {
    e.preventDefault();
    const id = document.getElementById('stage-id').value;
    const data = {
        category_id: currentCategory.id,
        sort_order: document.getElementById('stage-order').value,
        is_active: document.getElementById('stage-active').checked
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/stages/${id}` : `${API_BASE}/stages`;

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    closeModal('stage-modal');
    loadStages(currentCategory.id, currentCategory.name);
}

window.deleteStage = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذه المرحلة؟')) {
        await fetch(`${API_BASE}/stages/${id}`, { method: 'DELETE' });
        loadStages(currentCategory.id, currentCategory.name);
    }
};

// Questions Logic
window.toggleQuestions = async (stageId, btn) => {
    const container = document.getElementById(`questions-container-${stageId}`);
    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    // Load questions
    const res = await fetch(`${API_BASE}/questions?stage_id=${stageId}`);
    const questions = await res.json();

    renderQuestionsList(stageId, questions);
};

function renderQuestionsList(stageId, questions) {
    const container = document.getElementById(`questions-container-${stageId}`);
    container.innerHTML = `<button class="btn-sm btn-primary" onclick="openQuestionModal(${stageId})" style="margin-bottom:0.5rem;">+ إضافة سؤال</button>`;

    questions.forEach((q, idx) => {
        const div = document.createElement('div');
        div.style.marginBottom = '0.5rem';
        div.style.background = 'white';
        div.style.padding = '0.5rem';
        div.innerHTML = `
            <div><strong>س ${idx + 1}:</strong> ${q.question_text}</div>
            <div style="font-size:0.9em;color:#666;">
                1: ${q.answer_1} | 2: ${q.answer_2} | 3: ${q.answer_3} | 4: ${q.answer_4} <br>
                <strong>الصحيح: ${q.correct_answer}</strong>
            </div>
            <div style="margin-top:0.25rem;">
                <button class="btn-sm btn-primary" onclick='editQuestion(${JSON.stringify(q)}, ${stageId})'>تعديل</button>
                <button class="btn-sm btn-danger" onclick="deleteQuestion(${q.id}, ${stageId})">حذف</button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.openQuestionModal = (stageId, q = null) => {
    const modal = document.getElementById('question-modal');
    modal.classList.remove('hidden');

    // Store stageId in a way we can access on save if new
    // We can put it in a data attribute of the form or a hidden input?
    // But the form submits, so we need to know stageId if creating.
    // Let's use a global variable or modify the form to include stage_id input if needed.
    // Simplest: put it in the q-id data attribute logic or a separate var.

    currentStage = { id: stageId }; // Track current stage for question creation

    document.getElementById('q-id').value = q ? q.id : '';
    document.getElementById('q-text').value = q ? q.question_text : '';
    document.getElementById('q-ans1').value = q ? q.answer_1 : '';
    document.getElementById('q-ans2').value = q ? q.answer_2 : '';
    document.getElementById('q-ans3').value = q ? q.answer_3 : '';
    document.getElementById('q-ans4').value = q ? q.answer_4 : '';
    document.getElementById('q-correct').value = q ? q.correct_answer : 1;
};

window.editQuestion = (q, stageId) => openQuestionModal(stageId, q);

async function handleSaveQuestion(e) {
    e.preventDefault();
    const id = document.getElementById('q-id').value;
    const stageId = currentStage.id;

    const data = {
        stage_id: stageId,
        question_text: document.getElementById('q-text').value,
        answer_1: document.getElementById('q-ans1').value,
        answer_2: document.getElementById('q-ans2').value,
        answer_3: document.getElementById('q-ans3').value,
        answer_4: document.getElementById('q-ans4').value,
        correct_answer: document.getElementById('q-correct').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/questions/${id}` : `${API_BASE}/questions`;

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    closeModal('question-modal');
    // Reload questions for that stage
    // We need to trigger the toggle or reload manually
    // Simplest is to find the container and reload
    const res = await fetch(`${API_BASE}/questions?stage_id=${stageId}`);
    const questions = await res.json();
    renderQuestionsList(stageId, questions);
}

window.deleteQuestion = async (id, stageId) => {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
        const res = await fetch(`${API_BASE}/questions?stage_id=${stageId}`);
        const questions = await res.json();
        renderQuestionsList(stageId, questions);
    }
};

// Users Logic
let allUsers = [];

async function loadUsers() {
    const res = await fetch(`${API_BASE}/users`);
    allUsers = await res.json();
    renderUsersTable(allUsers);

    // Setup search listener if not already done
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        // Remove old listener to avoid duplicates if any (simple way is to overwrite onchange or just ensure one-time setup)
        // Better: just set onkeyup
        searchInput.onkeyup = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => u.username.toLowerCase().includes(term));
            renderUsersTable(filtered);
        };
    }
}

window.deleteAllUsers = async () => {
    if (!confirm('⚠️ تحذير: هل أنت متأكد من حذف جميع اللاعبين؟ لا يمكن التراجع عن هذا الإجراء!')) {
        return;
    }

    if (!confirm('تأكيد نهائي: سيتم مسح كل تقدم اللاعبين ومشترياتهم. هل تريد الاستمرار؟')) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/users/all`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            alert('تم حذف جميع اللاعبين بنجاح.');
            loadUsers(); // Refresh list
        } else {
            alert('فشل الحذف: ' + (data.error || 'خطأ غير معروف'));
        }
    } catch (e) {
        console.error(e);
        alert('حدث خطأ في الاتصال');
    }
};

function renderUsersTable(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.username}</td>
            <td>${u.stars} <i class="fas fa-star text-warning"></i></td>
            <td>${u.hearts} <i class="fas fa-heart text-danger"></i></td>
            <td>${u.is_banned ? '<span class="text-danger">محظور</span>' : '<span class="text-success">نشط</span>'}</td>
            <td style="display:flex;gap:0.5rem;align-items:center;">
                <button class="btn-sm btn-warning" onclick="userAction(${u.id}, 'add_stars', 100)" title="إضافة 100 نجمة">
                    <i class="fas fa-plus"></i> <i class="fas fa-star"></i> 100
                </button>
                <button class="btn-sm btn-danger" onclick="userAction(${u.id}, 'add_hearts', 5)" title="إضافة 5 قلوب">
                    <i class="fas fa-plus"></i> <i class="fas fa-heart"></i> 5
                </button>
                ${u.is_banned
                ? `<button class="btn-sm btn-success" onclick="userAction(${u.id}, 'unban')">فك الحظر</button>`
                : `<button class="btn-sm btn-danger" onclick="userAction(${u.id}, 'ban')">حظر</button>`
            }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.userAction = async (id, action, value = 0) => {
    if (!confirm('هل تريد تنفيذ هذا الإجراء؟')) return;

    await fetch(`${API_BASE}/users/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value })
    });
    loadUsers();
};

// Utils
window.closeModal = (id) => {
    document.getElementById(id).classList.add('hidden');
};

// ==================== DAILY REWARDS MANAGEMENT ====================

async function loadDailyRewards() {
    const res = await fetch(`${API_BASE}/daily-rewards`);
    const rewards = await res.json();

    const tbody = document.querySelector('#daily-rewards-table tbody');
    tbody.innerHTML = '';

    rewards.forEach(reward => {
        const typeLabels = {
            'stars': 'نجوم',
            'hearts': 'قلوب',
            'boost_15m': 'تعزيز 15د',
            'boost_5h': 'تعزيز 5س'
        };

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>اليوم ${reward.day_number}</td>
            <td>${typeLabels[reward.reward_type] || reward.reward_type}</td>
            <td>${reward.reward_value}</td>
            <td>${reward.sort_order}</td>
            <td>${reward.is_active ? '✓ مفعّلة' : '✗ معطّلة'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editDailyReward(${reward.id})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteDailyReward(${reward.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.openDailyRewardModal = (id = null) => {
    const modal = document.getElementById('daily-reward-modal');
    const form = document.getElementById('daily-reward-form');

    form.reset();
    document.getElementById('reward-id').value = '';
    document.getElementById('reward-modal-title').textContent = 'إضافة مكافأة يومية';

    modal.classList.remove('hidden');
};

window.editDailyReward = async (id) => {
    const res = await fetch(`${API_BASE}/daily-rewards`);
    const rewards = await res.json();
    const reward = rewards.find(r => r.id === id);

    if (reward) {
        document.getElementById('reward-id').value = reward.id;
        document.getElementById('reward-day').value = reward.day_number;
        document.getElementById('reward-type').value = reward.reward_type;
        document.getElementById('reward-value').value = reward.reward_value;
        document.getElementById('reward-order').value = reward.sort_order;
        document.getElementById('reward-active').checked = reward.is_active === 1;
        document.getElementById('reward-modal-title').textContent = 'تعديل المكافأة';

        document.getElementById('daily-reward-modal').classList.remove('hidden');
    }
};

window.deleteDailyReward = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه المكافأة؟')) return;

    await fetch(`${API_BASE}/daily-rewards/${id}`, { method: 'DELETE' });
    loadDailyRewards();
};

document.getElementById('daily-reward-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('reward-id').value;
    const data = {
        day_number: parseInt(document.getElementById('reward-day').value),
        reward_type: document.getElementById('reward-type').value,
        reward_value: parseInt(document.getElementById('reward-value').value),
        sort_order: parseInt(document.getElementById('reward-order').value),
        is_active: document.getElementById('reward-active').checked ? 1 : 0
    };

    if (id) {
        // Update
        await fetch(`${API_BASE}/daily-rewards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } else {
        // Create
        await fetch(`${API_BASE}/daily-rewards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    closeModal('daily-reward-modal');
    loadDailyRewards();
});

// ==================== LEVEL MANAGEMENT ====================

async function loadLevels() {
    const res = await fetch(`${API_BASE}/levels`);
    const levels = await res.json();

    const tbody = document.querySelector('#levels-table tbody');
    tbody.innerHTML = '';

    levels.forEach(lvl => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${lvl.level_number}</td>
            <td>${lvl.level_name}</td>
            <td>${lvl.xp_required} XP</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick='openLevelModal(${JSON.stringify(lvl)})'>تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteLevel(${lvl.id})">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

window.openLevelModal = (lvl = null) => {
    const modal = document.getElementById('level-modal');
    modal.classList.remove('hidden');
    document.getElementById('level-modal-title').textContent = lvl ? 'تعديل مستوى' : 'إضافة مستوى';

    document.getElementById('level-id').value = lvl ? lvl.id : '';
    document.getElementById('level-number').value = lvl ? lvl.level_number : '';
    document.getElementById('level-name').value = lvl ? lvl.level_name : '';
    document.getElementById('level-xp').value = lvl ? lvl.xp_required : '';
};

window.deleteLevel = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستوى؟')) return;

    try {
        await fetch(`${API_BASE}/levels/${id}`, { method: 'DELETE' });
        loadLevels();
    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء الحذف');
    }
};
