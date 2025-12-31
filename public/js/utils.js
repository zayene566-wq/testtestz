export function showView(name) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    const view = document.getElementById(`view-${name}`);
    if (view) view.classList.remove('hidden');
    else console.warn(`View ${name} not found`);
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

export function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

export function renderStars(count) {
    let html = '';
    for (let i = 0; i < 3; i++) {
        html += i < count ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return html;
}

export function playSound(id) {
    const audio = document.getElementById(`audio-${id}`);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed', e));
    }
}

export function stopMusic() {
    const bgm = document.getElementById('audio-bgm');
    if (bgm) {
        bgm.pause();
        bgm.currentTime = 0;
    }
}

export function playMusic() {
    const bgm = document.getElementById('audio-bgm');
    // Check setting
    const musicEnabled = localStorage.getItem('setting_music') !== 'false';
    if (bgm && musicEnabled) {
        bgm.play().catch(() => { });
    }
}
