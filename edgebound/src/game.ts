/**
 * EDGEBOUND — MASTER GAME ENGINE
 * Исправления:
 * 1. Восстановление высоты персонажа: squash/stretch плавно возвращается к 1.0 в любом состоянии.
 * 2. Полное устранение телепортации на краю платформы: координата контакта фиксируется точно в месте касания.
 * 3. Честный порог касания подошвы (8px) без прилипания к пустоте.
 * 4. Защита от спам-кликов и накрутки уровней.
 */

// ============================================================================
// 1. АУДИОСИСТЕМА (Web Audio API)
// ============================================================================
class AudioEngine {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        const unlock = () => {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
    }

    public playJump(): void {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    public playLanding(isPerfect: boolean): void {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(110, now);
        bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

        bassGain.gain.setValueAtTime(0.4, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.18);

        if (isPerfect) {
            const freqs = [523.25, 659.25, 783.99, 1046.5];
            freqs.forEach((freq, idx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                osc.type = 'sine';
                const start = now + idx * 0.035;
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.22, start);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
                osc.connect(gain);
                gain.connect(this.ctx!.destination);
                osc.start(start);
                osc.stop(start + 0.45);
            });
        }
    }

    public playFail(): void {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }
}

// ============================================================================
// 2. СИСТЕМА ЭФФЕКТОВ (VFX)
// ============================================================================
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

interface Shockwave {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    alpha: number;
    color: string;
}

class VFXSystem {
    public particles: Particle[] = [];
    public shockwaves: Shockwave[] = [];

    public spawnDust(x: number, y: number, count = 10): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
            const speed = 30 + Math.random() * 80;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.5,
                life: 0.4,
                maxLife: 0.4,
                size: 2 + Math.random() * 2,
                color: '#94a3b8'
            });
        }
    }

    public spawnPerfectBurst(x: number, y: number): void {
        this.shockwaves.push({
            x, y,
            radius: 6,
            maxRadius: 80,
            alpha: 1.0,
            color: '#fbbf24'
        });

        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 90 + Math.random() * 200;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                life: 0.6,
                maxLife: 0.6,
                size: 3 + Math.random() * 3,
                color: Math.random() > 0.3 ? '#fbbf24' : '#38bdf8'
            });
        }
    }

    public update(dt: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]!;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 450 * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i]!;
            s.radius += (s.maxRadius - s.radius) * 12 * dt;
            s.alpha -= dt * 2.5;
            if (s.alpha <= 0) this.shockwaves.splice(i, 1);
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        for (const s of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = Math.max(0, s.alpha);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        for (const p of this.particles) {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }
}

// ============================================================================
// 3. ОСНОВНОЙ ДВИЖОК ИГРЫ
// ============================================================================
interface Platform {
    x: number;
    y: number;
    width: number;
    height: number;
    springY: number;
    baseX?: number;
    speed?: number;
    amplitude?: number;
}

type GameState = 'MENU' | 'RUNNING' | 'LANDED_TRANSITION' | 'RESULT_SUCCESS' | 'RESULT_FAILED';

export class GameApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private audio = new AudioEngine();
    private vfx = new VFXSystem();

    public readonly V_WIDTH = 960;
    public readonly V_HEIGHT = 540;

    // DOM Элементы
    private streakEl = document.getElementById('streak')!;
    private scoreEl = document.getElementById('score')!;
    private windArrow = document.getElementById('wind-arrow')!;
    private windFill = document.getElementById('wind-fill')!;
    private objectiveEl = document.getElementById('objective')!;
    private startPanel = document.getElementById('start-panel')!;
    private resultPanel = document.getElementById('result-panel')!;
    private startButton = document.getElementById('start-button')!;
    private retryButton = document.getElementById('retry-button')!;
    private feedbackEl = document.getElementById('feedback')!;
    private resultKicker = document.getElementById('result-kicker')!;
    private resultTitle = document.getElementById('result-title')!;
    private resultReward = document.getElementById('result-reward')!;

    // Машина состояний
    private gameState: GameState = 'MENU';
    private isTransitioning: boolean = false;

    private streak = 0;
    private score = 0;
    private currentSector = 1;
    private currentSeed = 1001;
    private time = 0;
    private timeScale = 1.0;
    private targetTimeScale = 1.0;
    private lastFrameTime = performance.now();
    private feedbackTimeout: number | null = null;

    private camera = { zoom: 1.0, targetZoom: 1.0 };
    private shake = 0;

    // Параметры физики
    private readonly GRAVITY = 1250;
    private readonly JUMP_POWER = -560;
    private readonly AIRTIME = (2 * 560) / 1250;
    private readonly HORIZONTAL_SPEED = 340;

    // Платформы
    private startPlatform: Platform = { x: 100, y: 390, width: 130, height: 18, springY: 0 };
    private targetPlatform: Platform = {
        x: 480,
        y: 390,
        baseX: 480,
        width: 120,
        height: 18,
        speed: 1.8,
        amplitude: 65,
        springY: 0
    };

    // Привязка кубика к платформе
    private attachedPlatform: Platform | null = null;
    private platformOffsetX = 0;

    // Ветер
    private wind = { direction: 1, strength: 0, current: 0 };
    private windLines: Array<{ x: number; y: number; len: number; speed: number; alpha: number }> = [];

    // Персонаж
    private player = {
        x: 149,
        y: 390 - 42,
        width: 32,
        height: 42,
        vx: 0,
        vy: 0,
        grounded: true,
        scaleX: 1,
        scaleY: 1
    };

    constructor() {
        this.canvas = document.getElementById('game') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        this.initResize();
        this.initWindLines();
        this.bindEvents();
        this.loadSector(this.currentSector, this.currentSeed);

        requestAnimationFrame((t) => this.loop(t));
    }

    private initResize(): void {
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    private initWindLines(): void {
        this.windLines = [];
        for (let i = 0; i < 26; i++) {
            this.windLines.push({
                x: Math.random() * this.V_WIDTH,
                y: 80 + Math.random() * 380,
                len: 30 + Math.random() * 70,
                speed: 0.8 + Math.random() * 0.7,
                alpha: 0.08 + Math.random() * 0.16
            });
        }
    }

    private handleAction(): void {
        if (this.isTransitioning) return;

        if (this.gameState === 'MENU') {
            this.startRound();
        } else if (this.gameState === 'RUNNING') {
            this.jump();
        } else if (this.gameState === 'RESULT_SUCCESS') {
            this.nextChallenge();
        } else if (this.gameState === 'RESULT_FAILED') {
            this.retrySameChallenge();
        }
    }

    private bindEvents(): void {
        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.handleAction();
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.handleAction();
            }
        });

        this.startButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.handleAction();
        });

        this.retryButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.handleAction();
        });
    }

    private startRound(): void {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.clearFeedback();
        this.startPanel.classList.remove('visible');
        this.resultPanel.classList.remove('visible');
        this.gameState = 'RUNNING';

        setTimeout(() => {
            this.isTransitioning = false;
        }, 150);
    }

    private jump(): void {
        if (!this.player.grounded) return;

        this.player.grounded = false;
        this.attachedPlatform = null;
        this.player.vy = this.JUMP_POWER;

        // Стретч при взлете
        this.player.scaleX = 0.72;
        this.player.scaleY = 1.35;
        this.audio.playJump();
        this.vfx.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10);
    }

    private loadSector(sector: number, seed: number): void {
        const tier = Math.min(5, Math.floor((sector - 1) / 4));

        this.objectiveEl.innerText = `SECTOR 0${sector} /// MOVING PLATFORM + WIND`;

        const windCycle = Math.sin(seed * 0.77 + sector * 1.3);
        this.wind.direction = windCycle >= 0 ? 1 : -1;
        this.wind.strength = 20 + Math.min(30, tier * 6);

        this.targetPlatform.width = Math.max(85, 130 - tier * 9);
        this.targetPlatform.speed = 1.6 + tier * 0.25;
        this.targetPlatform.amplitude = 50 + tier * 6;

        const expectedVx = this.HORIZONTAL_SPEED + (this.wind.direction * this.wind.strength);
        const flightDistance = expectedVx * this.AIRTIME;
        const playerStartX = this.startPlatform.x + (this.startPlatform.width - this.player.width) / 2;

        const landingCenterX = playerStartX + (this.player.width / 2) + flightDistance;

        this.targetPlatform.baseX = landingCenterX - (this.targetPlatform.width / 2);
        this.targetPlatform.x = this.targetPlatform.baseX;

        this.player.x = playerStartX;
        this.player.y = this.startPlatform.y - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.scaleX = 1;
        this.player.scaleY = 1;

        this.attachedPlatform = this.startPlatform;
        this.platformOffsetX = this.player.x - this.startPlatform.x;

        this.targetTimeScale = 1.0;
        this.timeScale = 1.0;
        this.camera.targetZoom = 1.0;
    }

    private retrySameChallenge(): void {
        if (this.isTransitioning || this.gameState !== 'RESULT_FAILED') return;
        this.isTransitioning = true;

        this.clearFeedback();
        this.resultPanel.classList.remove('visible');
        this.loadSector(this.currentSector, this.currentSeed);
        this.gameState = 'RUNNING';

        setTimeout(() => {
            this.isTransitioning = false;
        }, 200);
    }

    private nextChallenge(): void {
        if (this.isTransitioning || this.gameState !== 'RESULT_SUCCESS') return;
        this.isTransitioning = true;

        this.clearFeedback();
        this.resultPanel.classList.remove('visible');
        this.currentSector++;
        this.currentSeed = Math.floor(Math.random() * 100000);
        this.loadSector(this.currentSector, this.currentSeed);
        this.gameState = 'RUNNING';

        setTimeout(() => {
            this.isTransitioning = false;
        }, 200);
    }

    private clearFeedback(): void {
        if (this.feedbackTimeout) {
            clearTimeout(this.feedbackTimeout);
            this.feedbackTimeout = null;
        }
        this.feedbackEl.innerText = '';
        this.feedbackEl.style.opacity = '0';
    }

    private showFeedback(text: string, color: string): void {
        this.clearFeedback();
        this.feedbackEl.innerText = text;
        this.feedbackEl.style.color = color;
        this.feedbackEl.style.opacity = '1';
        this.feedbackTimeout = window.setTimeout(() => {
            this.feedbackEl.style.opacity = '0';
        }, 320);
    }

    private update(dt: number): void {
        this.timeScale += (this.targetTimeScale - this.timeScale) * 8 * dt;
        const effectiveDt = dt * this.timeScale;
        this.time += effectiveDt;

        // 1. ПЛАВНОЕ ВОССТАНОВЛЕНИЕ ФОРМЫ КУБИКА (работает ВСЕГДА: и на земле, и в воздухе)
        // Math.max гарантирует красивый динамичный возврат даже во время медленного слоу-мо
        const shapeRecoveryDt = Math.max(effectiveDt, dt * 0.45);
        this.player.scaleX += (1 - this.player.scaleX) * 12 * shapeRecoveryDt;
        this.player.scaleY += (1 - this.player.scaleY) * 12 * shapeRecoveryDt;

        // 2. Ветер
        this.wind.current = this.wind.direction * this.wind.strength * (1 + Math.sin(this.time * 2.2) * 0.12);
        const absWind = Math.abs(this.wind.current);
        this.windArrow.innerText = this.wind.current >= 0 ? '→' : '←';
        this.windFill.style.width = `${Math.min(100, Math.max(20, (absWind / 60) * 100))}%`;

        for (const line of this.windLines) {
            line.x += (this.wind.current * 2.0) * line.speed * effectiveDt;
            if (line.x > this.V_WIDTH + 80) line.x = -80;
            if (line.x < -80) line.x = this.V_WIDTH + 80;
        }

        // 3. Движение целевой платформы
        if (this.targetPlatform.baseX !== undefined && this.targetPlatform.amplitude !== undefined && this.targetPlatform.speed !== undefined) {
            this.targetPlatform.x = this.targetPlatform.baseX + Math.sin(this.time * this.targetPlatform.speed) * this.targetPlatform.amplitude;
        }

        this.startPlatform.springY += (0 - this.startPlatform.springY) * 14 * dt;
        this.targetPlatform.springY += (0 - this.targetPlatform.springY) * 14 * dt;

        // 4. Физика персонажа
        if (this.player.grounded && this.attachedPlatform) {
            // Кубик точно следует за платформой
            this.player.x = this.attachedPlatform.x + this.platformOffsetX;
            this.player.y = this.attachedPlatform.y + this.attachedPlatform.springY - this.player.height;
        } else if (this.gameState === 'RUNNING' && !this.player.grounded) {
            this.player.vy += this.GRAVITY * effectiveDt;
            this.player.vx = this.HORIZONTAL_SPEED + this.wind.current;

            this.player.x += this.player.vx * effectiveDt;
            this.player.y += this.player.vy * effectiveDt;

            this.checkCollisions(effectiveDt);

            if (this.player.y > this.V_HEIGHT + 50) {
                this.onFail();
            }
        }

        // 5. Камера и VFX
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 6 * dt;
        if (this.shake > 0) {
            this.shake = Math.max(0, this.shake - dt * 25);
        }

        this.vfx.update(effectiveDt);
    }

    private checkCollisions(dt: number): void {
        if (this.player.vy <= 0) return;

        const playerBottom = this.player.y + this.player.height;
        const prevBottom = playerBottom - this.player.vy * dt;
        const px = this.player.x;
        const pw = this.player.width;

        const platforms = [
            { p: this.startPlatform, isTarget: false },
            { p: this.targetPlatform, isTarget: true }
        ];

        // Честный порог контакта: кубик должен зайти на платформу хотя бы на 8px (1/4 подошвы)
        const footContactMargin = 8;

        for (const { p, isTarget } of platforms) {
            const overlapsX = (px + pw - footContactMargin >= p.x) && (px + footContactMargin <= p.x + p.width);
            const crossesTop = prevBottom <= p.y + 16 && playerBottom >= p.y;

            if (overlapsX && crossesTop) {
                this.player.grounded = true;
                this.attachedPlatform = p;

                // ✅ БЕЗ ТЕЛЕПОРТАЦИИ: сохраняем точный локальный отступ точки касания
                this.platformOffsetX = this.player.x - p.x;

                this.player.y = p.y - this.player.height;
                this.player.vy = 0;
                this.player.vx = 0;

                // Упругий сквош (сплющивание)
                this.player.scaleX = 1.35;
                this.player.scaleY = 0.65;
                p.springY = 6;

                if (isTarget) {
                    this.onLandedOnTarget();
                } else {
                    this.audio.playLanding(false);
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 8);
                }
                return;
            }
        }
    }

    private onLandedOnTarget(): void {
        this.gameState = 'LANDED_TRANSITION';

        const target = this.targetPlatform;
        const playerCenter = this.player.x + this.player.width / 2;
        const targetCenter = target.x + target.width / 2;
        const dist = Math.abs(playerCenter - targetCenter);

        const perfectRadius = (target.width * 0.35) / 2;
        const isPerfect = dist <= perfectRadius;

        let reward = 100;

        if (isPerfect) {
            this.streak++;
            reward = 200 + (this.streak - 1) * 50;

            this.timeScale = 0.18;
            this.targetTimeScale = 1.0;
            this.camera.targetZoom = 1.08;
            setTimeout(() => { this.camera.targetZoom = 1.0; }, 300);

            this.shake = 9;
            this.audio.playLanding(true);
            this.vfx.spawnPerfectBurst(playerCenter, target.y);
            this.showFeedback('PERFECT!', '#fbbf24');

            this.resultKicker.innerText = `STREAK ×${this.streak}`;
            this.resultKicker.style.color = '#fbbf24';
            this.resultTitle.innerText = 'PERFECT!';
            this.resultTitle.style.color = '#fbbf24';
            this.resultReward.innerText = `+${reward} COINS`;
        } else {
            this.streak = 0;
            reward = 100;

            this.shake = 3;
            this.audio.playLanding(false);
            this.vfx.spawnDust(playerCenter, target.y, 12);
            this.showFeedback('GOOD', '#38bdf8');

            this.resultKicker.innerText = 'LANDING CONFIRMED';
            this.resultKicker.style.color = '#64748b';
            this.resultTitle.innerText = 'GOOD LANDING';
            this.resultTitle.style.color = '#38bdf8';
            this.resultReward.innerText = '+100 COINS';
        }

        this.score += reward;
        this.streakEl.innerText = `STREAK ×${this.streak}`;
        this.scoreEl.innerText = String(this.score).padStart(4, '0');
        this.retryButton.innerHTML = `NEXT CHALLENGE <span>↗</span>`;

        setTimeout(() => {
            this.clearFeedback();
            this.resultPanel.classList.add('visible');
            this.gameState = 'RESULT_SUCCESS';
        }, 450);
    }

    private onFail(): void {
        this.gameState = 'LANDED_TRANSITION';
        this.streak = 0;
        this.streakEl.innerText = 'STREAK ×0';
        this.shake = 12;
        this.audio.playFail();
        this.showFeedback('MISSED', '#ef4444');

        this.resultKicker.innerText = `SECTOR 0${this.currentSector}`;
        this.resultKicker.style.color = '#64748b';
        this.resultTitle.innerText = 'RUN FAILED';
        this.resultTitle.style.color = '#ef4444';
        this.resultReward.innerText = '+0 COINS';
        this.retryButton.innerHTML = `TRY AGAIN <span>↻</span>`;

        setTimeout(() => {
            this.clearFeedback();
            this.resultPanel.classList.add('visible');
            this.gameState = 'RESULT_FAILED';
        }, 400);
    }

    private draw(): void {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const scale = Math.min(this.canvas.width / this.V_WIDTH, this.canvas.height / this.V_HEIGHT);
        const offsetX = (this.canvas.width - this.V_WIDTH * scale) / 2;
        const offsetY = (this.canvas.height - this.V_HEIGHT * scale) / 2;

        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(scale, scale);

        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        if (this.camera.zoom !== 1.0) {
            this.ctx.translate(this.V_WIDTH / 2, this.V_HEIGHT / 2);
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-this.V_WIDTH / 2, -this.V_HEIGHT / 2);
        }

        // 1. Ветер
        this.ctx.save();
        for (const line of this.windLines) {
            this.ctx.strokeStyle = `rgba(56, 189, 248, ${line.alpha})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(line.x, line.y);
            this.ctx.lineTo(line.x + line.len, line.y);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 2. Платформы
        const drawPlatform = (p: Platform, isTarget: boolean) => {
            const py = p.y + p.springY;
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
            this.ctx.fillRect(p.x + 2, py + 8, p.width, p.height);

            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(p.x, py, p.width, p.height);

            this.ctx.fillStyle = isTarget ? '#0284c7' : '#64748b';
            this.ctx.fillRect(p.x, py, p.width, 3);

            if (isTarget) {
                const pw = p.width * 0.35;
                const px = p.x + (p.width - pw) / 2;
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.shadowColor = '#fbbf24';
                this.ctx.shadowBlur = 8;
                this.ctx.fillRect(px, py, pw, 4);
                this.ctx.shadowBlur = 0;
            }
        };

        drawPlatform(this.startPlatform, false);
        drawPlatform(this.targetPlatform, true);

        // 3. VFX
        this.vfx.draw(this.ctx);

        // 4. Персонаж
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x + p.width / 2, p.y + p.height);
        this.ctx.scale(p.scaleX, p.scaleY);

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);
        this.ctx.shadowBlur = 0;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(p.width / 2 - 10, -p.height + 8, 6, 6);
        this.ctx.restore();

        this.ctx.restore();
    }

    private loop(now: number): void {
        const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
