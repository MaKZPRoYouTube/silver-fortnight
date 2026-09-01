import { SituationRuntime } from './core/SituationRuntime';
import { AudioSystem } from './core/AudioSystem';
import { YandexBridge } from './core/YandexBridge';

class GameApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    // Системы
    private audio: AudioSystem = new AudioSystem();
    private yandex: YandexBridge = new YandexBridge();
    private runtime!: SituationRuntime;

    // DOM Элементы
    private startPanel: HTMLElement;
    private resultPanel: HTMLElement;
    private startButton: HTMLButtonElement;
    private retryButton: HTMLButtonElement;
    private streakEl: HTMLElement;
    private scoreEl: HTMLElement;
    private windArrow: HTMLElement;
    private windFill: HTMLElement;
    private objectiveEl: HTMLElement;
    private resultTitle: HTMLElement;
    private resultReward: HTMLElement;
    private feedbackEl: HTMLElement;

    // Состояние
    private levelIndex: number = 1;
    private score: number = 0;
    private streak: number = 0;
    private maxStreak: number = 0;
    private hitstop: number = 0;
    private shake: number = 0;
    private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

    private lastTime: number = 0;

    constructor() {
        // Инициализация Canvas
        this.canvas = document.getElementById('game') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.resizeCanvas();

        // Поиск DOM элементов
        this.startPanel = document.getElementById('start-panel')!;
        this.resultPanel = document.getElementById('result-panel')!;
        this.startButton = document.getElementById('start-button') as HTMLButtonElement;
        this.retryButton = document.getElementById('retry-button') as HTMLButtonElement;
        this.streakEl = document.getElementById('streak')!;
        this.scoreEl = document.getElementById('score')!;
        this.windArrow = document.getElementById('wind-arrow')!;
        this.windFill = document.getElementById('wind-fill')!;
        this.objectiveEl = document.getElementById('objective')!;
        this.resultTitle = document.getElementById('result-title')!;
        this.resultReward = document.getElementById('result-reward')!;
        this.feedbackEl = document.getElementById('feedback')!;

        // Инициализация сервисов
        this.yandex.init();
        this.setupSituation();
        this.bindEvents();

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    private resizeCanvas(): void {
        this.canvas.width = 900;
        this.canvas.height = 550;
    }

    private setupSituation(): void {
        const startX = 140;
        const targetX = 620;

        const situationData = {
            pattern: {
                type: 'MOVING_PLATFORM',
                startX: startX,
                startY: 380,
                targetX: targetX,
                targetY: 380,
                platformWidth: Math.max(70, 130 - this.levelIndex * 4),
                speed: 1.8 + this.levelIndex * 0.15,
                range: 90
            },
            modifiers: [
                { type: 'WIND', direction: -1, strength: 60 + this.levelIndex * 12 }
            ],
            difficulty: this.levelIndex,
            reward: { baseCoins: 100, perfectBonus: 150, xp: 50 }
        };

        this.runtime = new SituationRuntime(situationData);
        this.runtime.streak = this.streak;
    }

    private startRound(): void {
        this.startPanel.classList.remove('visible');
        this.resultPanel.classList.remove('visible');
        this.runtime.start();
    }

    private bindEvents(): void {
        // Кнопка СТАРТ
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startRound();
        });

        // Кнопка РЕТРАЙ / СЛЕДУЮЩИЙ
        this.retryButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resultPanel.classList.remove('visible');
            this.setupSituation();
            this.startRound();
        });

        // Прыжок по клику на Canvas / пробелу
        const handleJump = () => {
            if (this.runtime.state === 'RUNNING') {
                if (this.runtime.jump()) {
                    this.audio.playJump();
                    this.addDust(this.runtime.player.getCenterX(), this.runtime.player.getBottom());
                }
            }
        };

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.startPanel.classList.contains('visible')) {
                    this.startRound();
                } else if (this.resultPanel.classList.contains('visible')) {
                    this.retryButton.click();
                } else {
                    handleJump();
                }
            }
        });

        this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
            e.preventDefault();
            handleJump();
        });

        // Авто-пауза звука при переключении вкладки
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
        setTimeout(() => {
            this.feedbackEl.style.opacity = '0';
        }, 800);
    }

    private update(dt: number): void {
        if (this.hitstop > 0) {
            this.hitstop -= dt;
            return;
        }

        const prevState = this.runtime.state;
        this.runtime.update(dt);

        // Обновление HUD (Ветромер)
        const windVel = this.runtime.wind?.getHorizontalVelocity() ?? 0;
        this.windArrow.innerText = windVel >= 0 ? '→' : '←';
        const windPct = Math.min(100, Math.abs(windVel) / 1.8);
        this.windFill.style.width = `${windPct}%`;

        // Обработка успеха
        if (prevState === 'RUNNING' && this.runtime.state === 'SUCCESS') {
            const res = this.runtime.result!;
            this.streak = res.streak;
            this.score += res.coins;

            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
                this.yandex.submitScore('max_streak', this.maxStreak);
            }

            if (res.landingQuality === 'PERFECT') {
                this.audio.playPerfect();
                this.hitstop = 0.12;
                this.shake = 8;
                this.resultTitle.innerText = 'PERFECT!';
                this.resultTitle.style.color = '#fbbf24';
                this.showFeedback('PERFECT!', '#fbbf24');
            } else {
                this.audio.playGood();
                this.shake = 3;
                this.resultTitle.innerText = 'GOOD LANDING';
                this.resultTitle.style.color = '#38bdf8';
                this.showFeedback('GOOD', '#38bdf8');
            }

            this.resultReward.innerText = `+${res.coins} COINS (STREAK ×${this.streak})`;
            this.retryButton.innerHTML = `NEXT SECTOR <span>↗</span>`;
            this.resultPanel.classList.add('visible');

            this.streakEl.innerText = `STREAK ×${this.streak}`;
            this.scoreEl.innerText = String(this.score).padStart(4, '0');
            this.levelIndex++;
        } 
        // Обработка провала
        else if (prevState === 'RUNNING' && this.runtime.state === 'FAILED') {
            this.audio.playFail();
            this.shake = 9;
            this.resultTitle.innerText = 'VOID FALL';
            this.resultTitle.style.color = '#ef4444';
            this.resultReward.innerText = '+0 COINS';
            this.showFeedback('MISSED', '#ef4444');

            if (this.streak >= 3) {
                this.retryButton.innerHTML = `SAVE STREAK (AD) <span>★</span>`;
                this.retryButton.onclick = () => {
                    this.yandex.showRewardedAd(() => {
                        this.resultPanel.classList.remove('visible');
                        this.runtime.start();
                    });
                };
            } else {
                this.streak = 0;
                this.retryButton.innerHTML = `RUN IT BACK <span>↻</span>`;
                this.yandex.showFullscreenAd();
            }

            this.resultPanel.classList.add('visible');
            this.streakEl.innerText = `STREAK ×0`;
        }

        // Обновление частиц
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 20);
    }

    private draw(): void {
        this.ctx.save();

        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Отрисовка ветра на фоне
        this.drawWindVFX();

        // 2. Отрисовка платформ
        for (const p of this.runtime.platforms) {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(p.x, p.y, p.width, p.height || 16);

            this.ctx.fillStyle = p.isTarget ? '#0284c7' : '#64748b';
            this.ctx.fillRect(p.x, p.y, p.width, 3);

            if (p.isTarget) {
                const perfectW = p.width * 0.35;
                const perfectX = p.x + (p.width - perfectW) / 2;
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.fillRect(perfectX, p.y, perfectW, 4);
            }
        }

        // 3. Игрок
        const player = this.runtime.player.state;
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#0284c7';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        this.ctx.shadowBlur = 0;

        // Глаз персонажа
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(player.x + player.width - 9, player.y + 8, 6, 6);

        // 4. Частицы
        for (const p of this.particles) {
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    private drawWindVFX(): void {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        this.ctx.lineWidth = 1.5;
        const wStr = this.runtime.wind?.getHorizontalVelocity() ?? 0;
        const offset = (this.runtime.elapsed * wStr * 2) % 50;

        for (let y = 120; y < 460; y += 45) {
            this.ctx.beginPath();
            for (let x = -50; x < this.canvas.width + 50; x += 60) {
                this.ctx.moveTo(x + offset, y);
                this.ctx.lineTo(x + offset + 20 * Math.sign(wStr || 1), y);
            }
            this.ctx.stroke();
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
