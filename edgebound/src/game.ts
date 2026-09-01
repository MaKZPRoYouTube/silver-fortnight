/**
 * EDGEBOUND — MASTER GAME ENGINE
 * Все системы объединены в одном файле: Физика + Паттерны + Звук + Яндекс SDK + UI
 */

// ==========================================
// 1. АУДИОСИСТЕМА (Web Audio API)
// ==========================================
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
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
    }

    public playJump(): void {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    public playGood(): void {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    public playPerfect(): void {
        if (this.isMuted || !this.ctx) return;
        [523.25, 659.25, 1046.5].forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.04);
            gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.35 + i * 0.04);
            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(this.ctx!.currentTime + i * 0.04);
            osc.stop(this.ctx!.currentTime + 0.35 + i * 0.04);
        });
    }

    public playFail(): void {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
    }
}

// ==========================================
// 2. МОСТ ЯНДЕКС ИГР (Yandex SDK)
// ==========================================
class YandexSDK {
    private ysdk: any = null;
    private lastAdTime = 0;

    public async init(): Promise<void> {
        const isInsideIframe = window.parent !== window;
        if ((window as any).YaGames && isInsideIframe) {
            try {
                this.ysdk = await (window as any).YaGames.init();
                this.ysdk.features.LoadingAPI?.ready();
                console.log('✅ Yandex Games SDK подключен!');
            } catch (e) {
                console.warn('SDK fallback');
            }
        }
    }

    public showFullscreen(): void {
        if (Date.now() - this.lastAdTime < 60000) return;
        if (this.ysdk) {
            this.ysdk.adv.showFullscreenAdv({
                callbacks: { onOpen: () => { this.lastAdTime = Date.now(); } }
            });
        }
    }

    public showRewarded(onRewarded: () => void): void {
        if (this.ysdk) {
            this.ysdk.adv.showRewardedVideo({
                callbacks: { onRewarded: () => onRewarded() }
            });
        } else {
            onRewarded();
        }
    }

    public submitScore(score: number): void {
        if (this.ysdk?.leaderboards) {
            try {
                this.ysdk.leaderboards.setLeaderboardScore('max_streak', score);
            } catch (e) {}
        }
    }
}

// ==========================================
// 3. ГЛАВНОЕ ПРИЛОЖЕНИЕ ИГРЫ
// ==========================================
interface Platform {
    id: 'start' | 'target';
    x: number;
    y: number;
    width: number;
    height: number;
    baseX?: number;
    speed?: number;
    range?: number;
    isFalling?: boolean;
    fallSpeed?: number;
}

class GameApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private audio = new AudioEngine();
    private yandex = new YandexSDK();

    // DOM элементы оригинального дизайна
    private startPanel = document.getElementById('start-panel')!;
    private resultPanel = document.getElementById('result-panel')!;
    private startButton = document.getElementById('start-button')!;
    private retryButton = document.getElementById('retry-button')!;
    private streakEl = document.getElementById('streak')!;
    private scoreEl = document.getElementById('score')!;
    private windArrow = document.getElementById('wind-arrow')!;
    private windFill = document.getElementById('wind-fill')!;
    private objectiveEl = document.getElementById('objective')!;
    private resultTitle = document.getElementById('result-title')!;
    private resultReward = document.getElementById('result-reward')!;
    private feedbackEl = document.getElementById('feedback')!;

    // Состояние игры
    private level = 1;
    private score = 0;
    private streak = 0;
    private maxStreak = 0;
    private gameState: 'MENU' | 'RUNNING' | 'SUCCESS' | 'FAILED' = 'MENU';
    private time = 0;

    // Juice-эффекты
    private shake = 0;
    private hitstop = 0;
    private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];
    private windStreaks: Array<{ x: number; y: number; len: number; speed: number; alpha: number }> = [];

    // Платформы
    private startPlatform: Platform = { id: 'start', x: 100, y: 380, width: 140, height: 16 };
    private targetPlatform: Platform = { id: 'target', x: 420, y: 380, width: 110, height: 16 };
    private patternType: 'STATIC' | 'MOVING' | 'FALLING' = 'STATIC';

    // Ветер
    private windDirection = -1;
    private windStrength = 40;
    private currentWind = 0;

    // Персонаж
    private player = {
        x: 140,
        y: 380 - 40,
        width: 30,
        height: 40,
        vx: 0,
        vy: 0,
        grounded: true,
        scaleX: 1,
        scaleY: 1
    };

    private lastTime = performance.now();

    constructor() {
        this.canvas = document.getElementById('game') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.canvas.width = 900;
        this.canvas.height = 550;

        this.initWindStreaks();
        this.yandex.init();
        this.setupSector(this.level);
        this.bindEvents();

        requestAnimationFrame((t) => this.loop(t));
    }

    private initWindStreaks(): void {
        this.windStreaks = [];
        for (let i = 0; i < 28; i++) {
            this.windStreaks.push({
                x: Math.random() * 900,
                y: 100 + Math.random() * 380,
                len: 30 + Math.random() * 70,
                speed: 0.8 + Math.random() * 0.6,
                alpha: 0.08 + Math.random() * 0.16
            });
        }
    }

    private setupSector(lvl: number): void {
        const sectorConfigs = [
            { type: 'STATIC' as const, title: 'SECTOR 01: BASIC STEP', width: 130, speed: 0, range: 0, targetX: 420 },
            { type: 'MOVING' as const, title: 'SECTOR 02: MOVING TARGET', width: 110, speed: 1.8, range: 60, targetX: 420 },
            { type: 'FALLING' as const, title: 'SECTOR 03: COLLAPSING LEDGE', width: 110, speed: 0, range: 0, targetX: 400 },
            { type: 'MOVING' as const, title: 'SECTOR 04: WIND STORM', width: 95, speed: 2.3, range: 75, targetX: 430 },
            { type: 'STATIC' as const, title: 'SECTOR 05: NARROW PRECISION', width: 55, speed: 0, range: 0, targetX: 420 },
        ];

        const cfg = sectorConfigs[(lvl - 1) % sectorConfigs.length];
        this.patternType = cfg.type;
        this.objectiveEl.innerText = cfg.title;

        // Настройка платформ
        this.startPlatform = { id: 'start', x: 100, y: 380, width: 140, height: 16 };
        this.targetPlatform = {
            id: 'target',
            x: cfg.targetX,
            y: 380,
            width: cfg.width,
            height: 16,
            baseX: cfg.targetX,
            speed: cfg.speed,
            range: cfg.range,
            isFalling: false,
            fallSpeed: 0
        };

        // Ветер
        const windCycle = Math.sin(lvl * 0.9);
        this.windDirection = windCycle >= 0 ? 1 : -1;
        this.windStrength = 30 + Math.abs(windCycle) * 80;

        // ✅ Игрок ГАРАНТИРОВАННО стоит на стартовой платформе
        this.player.x = this.startPlatform.x + (this.startPlatform.width - this.player.width) / 2;
        this.player.y = this.startPlatform.y - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.scaleX = 1;
        this.player.scaleY = 1;
    }

    private startRound(): void {
        this.startPanel.classList.remove('visible');
        this.resultPanel.classList.remove('visible');
        this.gameState = 'RUNNING';
    }

    private bindEvents(): void {
        this.startButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.startRound();
        });

        this.retryButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.resultPanel.classList.remove('visible');
            this.setupSector(this.level);
            this.startRound();
        });

        const performJump = () => {
            if (this.gameState === 'RUNNING' && this.player.grounded) {
                this.player.grounded = false;
                this.player.vy = -560;
                this.player.scaleX = 0.7;
                this.player.scaleY = 1.4; // Stretch
                this.audio.playJump();
                this.addDust(this.player.x + this.player.width / 2, this.player.y + this.player.height);
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.startPanel.classList.contains('visible')) {
                    this.startRound();
                } else if (this.resultPanel.classList.contains('visible')) {
                    this.retryButton.dispatchEvent(new PointerEvent('pointerdown'));
                } else {
                    performJump();
                }
            }
        });

        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            performJump();
        });

        document.addEventListener('visibilitychange', () => {
            this.audio.setMuted(document.hidden);
        });
    }

    private addDust(x: number, y: number): void {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 60,
                vy: -Math.random() * 30,
                life: 1.0,
                color: '#94a3b8'
            });
        }
    }

    private showFeedback(text: string, color: string): void {
        this.feedbackEl.innerText = text;
        this.feedbackEl.style.color = color;
        this.feedbackEl.style.opacity = '1';
        setTimeout(() => { this.feedbackEl.style.opacity = '0'; }, 800);
    }

    private update(dt: number): void {
        if (this.hitstop > 0) {
            this.hitstop -= dt;
            return;
        }

        this.time += dt;

        // 1. Обновление движущейся / падающей платформы
        if (this.patternType === 'MOVING' && this.targetPlatform.baseX) {
            this.targetPlatform.x = this.targetPlatform.baseX + Math.sin(this.time * this.targetPlatform.speed!) * this.targetPlatform.range!;
        } else if (this.targetPlatform.isFalling) {
            this.targetPlatform.fallSpeed! += 900 * dt;
            this.targetPlatform.y += this.targetPlatform.fallSpeed! * dt;
            if (this.player.grounded) {
                this.player.y = this.targetPlatform.y - this.player.height;
            }
        }

        // 2. Обновление ветра
        this.currentWind = this.windDirection * this.windStrength * (1 + Math.sin(this.time * 2) * 0.15);
        const absWind = Math.abs(this.currentWind);
        this.windArrow.innerText = this.currentWind >= 0 ? '→' : '←';
        this.windFill.style.width = `${Math.min(100, Math.max(15, (absWind / 120) * 100))}%`;

        // Линии ветра
        const windSpeedFactor = this.currentWind !== 0 ? this.currentWind * 1.6 : -50;
        for (const s of this.windStreaks) {
            s.x += windSpeedFactor * s.speed * dt;
            if (s.x > this.canvas.width + 100) s.x = -100;
            if (s.x < -100) s.x = this.canvas.width + 100;
        }

        // 3. Физика игрока
        if (this.gameState === 'RUNNING') {
            if (!this.player.grounded) {
                this.player.vy += 1250 * dt;
                this.player.vx = 340 + this.currentWind;
                this.player.x += this.player.vx * dt;
                this.player.y += this.player.vy * dt;

                // Восстановление формы
                this.player.scaleX += (1 - this.player.scaleX) * 10 * dt;
                this.player.scaleY += (1 - this.player.scaleY) * 10 * dt;

                // Проверка приземления
                this.checkCollisions(dt);

                // Падение в бездну
                if (this.player.y > 540) {
                    this.onFail();
                }
            }
        }

        // Частицы и шейк
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 20);
    }

    private checkCollisions(dt: number): void {
        if (this.player.vy <= 0) return; // Только при падении

        const bottom = this.player.y + this.player.height;
        const prevBottom = bottom - this.player.vy * dt;
        const px = this.player.x;
        const pw = this.player.width;

        const platforms = [this.startPlatform, this.targetPlatform];

        for (const p of platforms) {
            const overlapsX = (px + pw > p.x) && (px < p.x + p.width);
            const crossesY = (prevBottom <= p.y + 14) && (bottom >= p.y);

            if (overlapsX && crossesY) {
                // Посадка на платформу
                this.player.y = p.y - this.player.height;
                this.player.vy = 0;
                this.player.vx = 0;
                this.player.grounded = true;
                this.player.scaleX = 1.4; // Squash
                this.player.scaleY = 0.6;
                this.addDust(this.player.x + pw / 2, p.y);

                if (p.id === 'target') {
                    if (this.patternType === 'FALLING') {
                        this.targetPlatform.isFalling = true;
                        this.targetPlatform.fallSpeed = 60;
                    }
                    this.onSuccess(p);
                }
                return;
            }
        }
    }

    private onSuccess(target: Platform): void {
        this.gameState = 'SUCCESS';
        const center = target.x + target.width / 2;
        const dist = Math.abs((this.player.x + this.player.width / 2) - center);
        const perfectHalf = (target.width * 0.35) / 2;

        const isPerfect = dist <= perfectHalf;
        let earned = 100;

        if (isPerfect) {
            this.streak += 1;
            earned = 150 + this.streak * 50;
            this.audio.playPerfect();
            this.hitstop = 0.12;
            this.shake = 8;
            this.resultTitle.innerText = 'PERFECT!';
            this.resultTitle.style.color = '#fbbf24';
            this.showFeedback('PERFECT!', '#fbbf24');
        } else {
            this.streak = 0;
            earned = 100;
            this.audio.playGood();
            this.shake = 3;
            this.resultTitle.innerText = 'GOOD LANDING';
            this.resultTitle.style.color = '#38bdf8';
            this.showFeedback('GOOD', '#38bdf8');
        }

        this.score += earned;
        if (this.streak > this.maxStreak) {
            this.maxStreak = this.streak;
            this.yandex.submitScore(this.maxStreak);
        }

        this.streakEl.innerText = `STREAK ×${this.streak}`;
        this.scoreEl.innerText = String(this.score).padStart(4, '0');
        this.resultReward.innerText = `+${earned} COINS`;
        this.retryButton.innerHTML = `NEXT SECTOR <span>↗</span>`;
        this.resultPanel.classList.add('visible');

        this.level++;
    }

    private onFail(): void {
        this.gameState = 'FAILED';
        this.audio.playFail();
        this.shake = 9;
        this.resultTitle.innerText = 'VOID FALL';
        this.resultTitle.style.color = '#ef4444';
        this.resultReward.innerText = '+0 COINS';
        this.showFeedback('MISSED', '#ef4444');

        if (this.streak >= 3) {
            this.retryButton.innerHTML = `SAVE STREAK (AD) <span>★</span>`;
            this.retryButton.onclick = () => {
                this.yandex.showRewarded(() => {
                    this.resultPanel.classList.remove('visible');
                    this.setupSector(this.level);
                    this.startRound();
                });
            };
        } else {
            this.streak = 0;
            this.retryButton.innerHTML = `RUN IT BACK <span>↻</span>`;
            this.yandex.showFullscreen();
        }

        this.streakEl.innerText = `STREAK ×0`;
        this.resultPanel.classList.add('visible');
    }

    private draw(): void {
        this.ctx.save();

        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Потоки ветра
        this.ctx.save();
        for (const s of this.windStreaks) {
            this.ctx.strokeStyle = `rgba(56, 189, 248, ${s.alpha})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(s.x, s.y);
            this.ctx.lineTo(s.x + s.len, s.y);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 2. Платформы
        const platforms = [this.startPlatform, this.targetPlatform];
        for (const p of platforms) {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(p.x, p.y, p.width, p.height);

            const isTarget = p.id === 'target';
            this.ctx.fillStyle = isTarget ? '#0284c7' : '#64748b';
            this.ctx.fillRect(p.x, p.y, p.width, 3);

            if (isTarget) {
                const perfectW = p.width * 0.35;
                const perfectX = p.x + (p.width - perfectW) / 2;
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.fillRect(perfectX, p.y, perfectW, 4);
            }
        }

        // 3. Персонаж (со сквошем и стретчем)
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x + p.width / 2, p.y + p.height);
        this.ctx.scale(p.scaleX, p.scaleY);

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#0284c7';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);
        this.ctx.shadowBlur = 0;

        // Глаз персонажа
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(p.width / 2 - 10, -p.height + 8, 6, 6);
        this.ctx.restore();

        // 4. Частицы
        for (const pt of this.particles) {
            this.ctx.globalAlpha = Math.max(0, pt.life);
            this.ctx.fillStyle = pt.color;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private loop(currentTime: number): void {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        this.update(dt);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => new GameApp());
