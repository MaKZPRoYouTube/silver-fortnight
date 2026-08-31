import { SituationRuntime } from './core/SituationRuntime.js';
const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const startPanel = document.querySelector('#start-panel');
const resultPanel = document.querySelector('#result-panel');
const startButton = document.querySelector('#start-button');
const retryButton = document.querySelector('#retry-button');
const feedback = document.querySelector('#feedback');
const streakLabel = document.querySelector('#streak');
const scoreLabel = document.querySelector('#score');
const windArrow = document.querySelector('#wind-arrow');
const windFill = document.querySelector('#wind-fill');
const objective = document.querySelector('#objective');
const resultKicker = document.querySelector('#result-kicker');
const resultTitle = document.querySelector('#result-title');
const resultReward = document.querySelector('#result-reward');
const challenge = {
    id: 'wind-run-01', version: 1,
    pattern: { type: 'MOVING_PLATFORM', startX: 180, startY: 410, targetX: 530, targetY: 355, platformWidth: 174, platformHeight: 25, distance: 230, speed: 1.35, perfectWidth: 62, variant: 0, stepCount: 1, gapBetweenSteps: 0, riskRewardRatio: 1.5 },
    modifiers: [{ type: 'WIND', strength: 62, direction: -1, telegraphTime: 1 }],
    difficulty: { tier: 1, timingWindow: .9, reactionTime: 1.5, precisionRequired: .35, dangerLevel: 1, recoveryAvailable: true },
    reward: { baseCoins: 100, baseXp: 25, perfectBonus: 120, streakScaling: .18, cashOutEligible: false },
};
let runtime = new SituationRuntime(challenge);
let active = false, previous = 0, score = 0, slowMo = 0, shake = 0;
let resultTimer = null;
let particles = [];
function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
}
addEventListener('resize', resize);
resize();
function playTone(frequency, duration, type = 'sine') {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor)
        return;
    const audio = new AudioContextCtor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
}
function burst(x, y, color, count) { for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .5 + Math.random() * .4, max: 1, color, size: 2 + Math.random() * 4 });
} }
function showFeedback(text) { feedback.textContent = text; feedback.classList.remove('show'); void feedback.offsetWidth; feedback.classList.add('show'); }
function begin() {
    if (resultTimer !== null)
        window.clearTimeout(resultTimer);
    resultTimer = null;
    runtime = new SituationRuntime(challenge);
    runtime.start();
    active = true;
    slowMo = 0;
    particles = [];
    startPanel.classList.remove('visible');
    resultPanel.classList.remove('visible');
    objective.textContent = runtime.pattern.getObjective().title.toUpperCase();
}
function jump() { if (!active)
    return; if (runtime.jump()) {
    playTone(300, .09, 'triangle');
    burst(runtime.player.getCenterX(), runtime.player.getBottom(), '#81d9d0', 5);
} }
function finish() {
    active = false;
    const result = runtime.result;
    if (!result)
        return;
    const perfect = result.landingQuality === 'PERFECT';
    const good = result.landingQuality === 'GOOD';
    if (runtime.state === 'SUCCESS') {
        score += result.coins;
        if (perfect) {
            slowMo = .35;
            shake = 8;
            showFeedback('PERFECT!');
            burst(runtime.player.getCenterX(), runtime.player.getBottom(), '#ffd372', 28);
            playTone(660, .25, 'sine');
        }
        else if (good) {
            showFeedback('GOOD');
            burst(runtime.player.getCenterX(), runtime.player.getBottom(), '#81d9d0', 16);
            playTone(460, .16, 'sine');
        }
        else {
            showFeedback('EDGE HIT');
            burst(runtime.player.getCenterX(), runtime.player.getBottom(), '#91a2c8', 12);
            playTone(360, .12, 'triangle');
        }
        resultKicker.textContent = perfect ? 'CENTER CORE HIT' : good ? 'LANDING CONFIRMED' : 'JUST MADE IT';
        resultTitle.textContent = perfect ? 'PERFECT!' : good ? 'GOOD.' : 'EDGE HIT.';
        resultReward.textContent = `+${result.coins} COINS  ·  STREAK ×${result.streak}`;
    }
    else {
        shake = 10;
        showFeedback('MISSED');
        playTone(115, .3, 'sawtooth');
        resultKicker.textContent = 'RUN FAILED';
        resultTitle.textContent = 'TRY AGAIN.';
        resultReward.textContent = 'SAME WIND. BETTER TIMING.';
    }
    scoreLabel.textContent = String(score).padStart(4, '0');
    streakLabel.textContent = `STREAK ×${runtime.streak}`;
    resultTimer = window.setTimeout(() => { resultPanel.classList.add('visible'); resultTimer = null; }, 700);
}
function draw() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#121d3d');
    gradient.addColorStop(.58, '#0c1126');
    gradient.addColorStop(1, '#050714');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    const cameraX = Math.max(0, runtime.player.getCenterX() - width * .34);
    const baseY = height - 165;
    const offsetX = (Math.random() - .5) * shake;
    context.save();
    context.translate(offsetX - cameraX, baseY - 430);
    context.strokeStyle = 'rgba(135,185,212,.10)';
    context.lineWidth = 1;
    for (let x = -200; x < cameraX + width + 300; x += 54) {
        context.beginPath();
        context.moveTo(x, 70);
        context.lineTo(x - 120, 380);
        context.stroke();
    }
    for (const platform of runtime.platforms) {
        if (!platform.active)
            continue;
        const perfect = Math.min(runtime.data.pattern.perfectWidth, platform.width);
        const isTarget = platform.id === runtime.pattern.getObjective().currentTargetId;
        context.shadowBlur = isTarget ? 18 : 0;
        context.shadowColor = '#4ddbc9';
        context.fillStyle = isTarget ? '#77d9ce' : '#5379a2';
        context.fillRect(platform.x, platform.y, platform.width, platform.height);
        context.shadowBlur = 0;
        context.fillStyle = '#182849';
        context.fillRect(platform.x + 5, platform.y + 5, platform.width - 10, platform.height - 10);
        if (isTarget) {
            context.fillStyle = '#ffd372';
            context.fillRect(platform.x + platform.width / 2 - perfect / 2, platform.y + 5, perfect, 4);
        }
        context.fillStyle = 'rgba(255,255,255,.55)';
        context.fillRect(platform.x, platform.y, platform.width, 2);
    }
    const p = runtime.player.state;
    const airborne = !p.grounded;
    context.fillStyle = airborne ? '#fc7455' : '#ff896f';
    context.shadowColor = '#fc7455';
    context.shadowBlur = 20;
    context.beginPath();
    context.ellipse(p.x + p.width / 2, p.y + p.height / 2, airborne ? 13 : 17, airborne ? 21 : 17, 0, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.fillStyle = '#fff4df';
    context.fillRect(p.x + 10, p.y + 10, 5, 5);
    context.restore();
    for (const particle of particles) {
        context.globalAlpha = Math.max(0, particle.life / particle.max);
        context.fillStyle = particle.color;
        context.fillRect(particle.x - cameraX, baseY - 430 + particle.y, particle.size, particle.size);
    }
    context.globalAlpha = 1;
}
function loop(time) { const rawDt = Math.min(.033, (time - previous) / 1000 || 0); previous = time; const dt = rawDt * (slowMo > 0 ? .35 : 1); slowMo = Math.max(0, slowMo - rawDt); shake = Math.max(0, shake - rawDt * 24); if (active) {
    runtime.update(dt);
    if (runtime.state !== 'RUNNING')
        finish();
} for (const particle of particles) {
    particle.life -= rawDt;
    particle.x += particle.vx * rawDt;
    particle.y += particle.vy * rawDt;
    particle.vy += 260 * rawDt;
} particles = particles.filter((p) => p.life > 0); const wind = runtime.windStrength; const windModifier = runtime.data.modifiers.find((modifier) => modifier.type === 'WIND'); windArrow.textContent = windModifier?.direction === -1 ? '←' : '→'; windFill.style.width = `${Math.min(100, wind)}%`; draw(); requestAnimationFrame(loop); }
startButton.addEventListener('click', begin);
retryButton.addEventListener('click', begin);
canvas.addEventListener('pointerdown', jump);
addEventListener('keydown', (event) => { if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    jump();
} });
requestAnimationFrame(loop);
