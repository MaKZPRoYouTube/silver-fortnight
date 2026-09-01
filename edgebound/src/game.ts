import { SituationRuntime } from './core/SituationRuntime';
import { AudioSystem } from './core/AudioSystem';
import { YandexBridge } from './core/YandexBridge';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

interface PopupText {
    text: string;
    x: number;
    y: number;
    color: string;
    life: number;
    vy: number;
}

class GameApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private audio: AudioSystem = new AudioSystem();
    private yandex: YandexBridge = new YandexBridge();

    private runtime!: SituationRuntime;
    private levelIndex: number = 1;
    private score: number = 0;
    private streak: number = 0;
    private maxStreak: number = 0;

    private cameraX: number = 0;
    private targetCameraX: number = 0;

    private hitstop: number = 0;
    private shake: number = 0;
    private particles: Particle[] = [];
    private popups: PopupText[] = [];

    private lastTime: number = 0;

    constructor() {
        this.canvas = document.getElementById('viewport') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        this.yandex.init();
        this.loadNextSituation();
        this.initInput();

        // Авто-пауза при сворачивании вкладки
        document.addEventListener('visibilitychange', () => {
            this.audio.setMuted(document.hidden);
        });

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    private loadNextSituation(): void {
        const patterns = ['STATIC_STEP', 'MOVING_PLATFORM', 'FALLING_PLATFORM', 'MOVING_PLATFORM'];
        const currentType = patterns[(this.levelIndex - 1) % patterns.length];

        const startX = (this.levelIndex - 1) * 350 + 100;
        const targetX = startX + 240 + Math.min(100, this.levelIndex * 8);

        const situationData = {
            pattern: {
                type: currentType,
                startX: startX,
                startY: 380,
                targetX: targetX,
                targetY: 380,
                platformWidth: Math.max(70, 130 - this.levelIndex * 4),
                speed: 1.8 + this.levelIndex * 0.15,
                range: 90
            },
            modifiers: [
                { type: 'WIND', direction: Math.random() > 0.5 ? 1 : -1, strength: 60 + this.levelIndex * 10 }
            ],
            difficulty: this.levelIndex,
            reward: { baseCoins: 100, perfectBonus: 150, xp: 50 }
        };

        this.runtime = new SituationRuntime(situationData);
        this.runtime.streak = this.streak;
        this.runtime.start();
        this.targetCameraX = startX - 120;
    }

    private initInput(): void {
        const handleAction = () => {
            if (this.runtime.state === 'RUNNING') {
                if (this.runtime.jump()) {
                    this.audio.playJump();
                    this.addDust(this.runtime.player.getCenterX(), this.runtime.player.getBottom());
                }
            } else if (this.runtime.state === 'SUCCESS') {
                this.levelIndex++;
                this.loadNextSituation();
            } else if (this.runtime.state === 'FAILED') {
                // Если стрик был высоким (>= 3), предлагаем спасти за рекламу
                if (this.streak >= 3) {
                    this.yandex.showRewardedAd(() => {
                        // Спасение стрика
                        this.addPopup('STREAK SAVED!', this.runtime.player.getCenterX(), 350, '#38bdf8');
                        this.runtime.start();
                    }, () => {
                        this.streak = 0;
                        this.runtime.start();
                    });
                } else {
                    this.streak = 0;
                    this.yandex.showFullscreenAd();
                    this.runtime.start();
                }
            }
        };

        window.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handleAction();
            }
        });

        this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
            e.preventDefault();
            handleAction();
        });
    }

    private addDust(x: number, y: number): void {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 60,
                vy: -Math.random() * 30,
                life: 1.0,
                color: '#94a3b8'
            });
        }
    }

    private addPopup(text: string, x: number, y: number, color: string): void {
        this.popups.push({ text, x, y, color, life: 1.0, vy: -50 });
    }

    private update(dt: number): void {
        if (this.hitstop > 0) {
            this.hitstop -= dt;
            return;
        }

        this.cameraX += (this.targetCameraX - this.cameraX) * 8 * dt;

        const prevState = this.runtime.state;
        this.runtime.update(dt);

        if (prevState === 'RUNNING' && this.runtime.state === 'SUCCESS') {
            const res = this.runtime.result!;
            this.streak = res.streak;
            this.score += res.coins;

            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
                this.yandex.submitScore('max_streak', this.maxStreak);
            }

            const px = this.runtime.player.getCenterX();
            const py = this.runtime.player.getBottom();

            if (res.landingQuality === 'PERFECT') {
                this.audio.playPerfect();
                this.hitstop = 0.12;
                this.shake = 8;
                this.addPopup(`PERFECT! +${res.coins}`, px, py - 40, '#fbbf24');
            } else {
                this.audio.playGood();
                this.shake = 3;
                this.addPopup(`GOOD +${res.coins}`, px, py - 30, '#38bdf8');
            }

            document.getElementById('hudStreak')!.innerText = String(this.streak);
            document.getElementById('hudScore')!.innerText = String(this.score);
            document.getElementById('hudHint')!.innerText = 'УСПЕХ! НАЖМИТЕ ДЛЯ СЛЕДУЮЩЕГО ПРЫЖКА';
        } else if (prevState === 'RUNNING' && this.runtime.state === 'FAILED') {
            this.audio.playFail();
            this.shake = 9;
            this.addPopup('VOID FALL', this.runtime.player.getCenterX(), 420, '#ef4444');
            document.getElementById('hudStreak')!.innerText = '0';
            document.getElementById('hudHint')!.innerText = this.streak >= 3 
                ? 'НАЖМИТЕ, ЧТОБЫ СПАСТИ СТРИК ЗА РЕКЛАМУ' 
                : 'ПАДЕНИЕ. НАЖМИТЕ ДЛЯ RETRY';
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.popups.length - 1; i >= 0; i--) {
            const t = this.popups[i];
            t.y += t.vy * dt;
            t.life -= dt * 1.5;
            if (t.life <= 0) this.popups.splice(i, 1);
        }

        if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 20);
    }

    private draw(): void {
        this.ctx.save();

        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(-this.cameraX, 0);

        // Платформы
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

        // Игрок
        const player = this.runtime.player.state;
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#0284c7';
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        this.ctx.shadowBlur = 0;

        // Глаз
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(player.x + player.width - 9, player.y + 8, 6, 6);

        // Частицы
        for (const p of this.particles) {
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Текст
        for (const t of this.popups) {
            this.ctx.globalAlpha = Math.max(0, t.life);
            this.ctx.font = '800 20px -apple-system, sans-serif';
            this.ctx.fillStyle = t.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(t.text, t.x, t.y);
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
