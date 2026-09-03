/**
 * EDGEBOUND — COMPLETE PRODUCTION ENGINE
 * Все 8 паттернов + Кампания на 24 сектора + Динамическая камера + Яндекс SDK
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

    public playStep(): void {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.09);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
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
// 2. МОСТ ЯНДЕКС ИГР (Yandex SDK)
// ============================================================================
class YandexBridge {
    private ysdk: any = null;
    private lastAdTime = 0;
    public isAvailable = false;

    public async init(): Promise<void> {
        const isInsideIframe = window.parent !== window;
        if ((window as any).YaGames && isInsideIframe) {
            try {
                this.ysdk = await (window as any).YaGames.init();
                this.ysdk.features.LoadingAPI?.ready();
                this.isAvailable = true;
                console.log('✅ Yandex Games SDK успешно подключен!');
            } catch (e) {
                console.warn('⚠️ Ошибка подключения к Яндекс SDK', e);
            }
        } else {
            console.log('🛠️ Локальный режим разработчика (Яндекс SDK сэмулирован)');
        }
    }

    public showFullscreen(onComplete?: () => void): void {
        const now = Date.now();
        if (now - this.lastAdTime < 60000) {
            onComplete?.();
            return;
        }

        if (this.ysdk) {
            this.ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => { this.lastAdTime = Date.now(); },
                    onClose: () => onComplete?.(),
                    onError: () => onComplete?.()
                }
            });
        } else {
            console.log('📺 [Реклама] Межстраничная реклама');
            onComplete?.();
        }
    }

    public showRewarded(onRewarded: () => void, onDismiss?: () => void): void {
        if (this.ysdk) {
            this.ysdk.adv.showRewardedVideo({
                callbacks: {
                    onRewarded: () => onRewarded(),
                    onClose: () => onDismiss?.(),
                    onError: () => onDismiss?.()
                }
            });
        } else {
            console.log('🎁 [Реклама за награду] Стрик сохранен!');
            onRewarded();
            onDismiss?.();
        }
    }

    public submitScore(maxStreak: number, score: number): void {
        if (this.ysdk?.leaderboards) {
            try {
                this.ysdk.leaderboards.setLeaderboardScore('max_streak', maxStreak);
                this.ysdk.leaderboards.setLeaderboardScore('total_score', score);
            } catch (e) {}
        }
    }
}

// ============================================================================
// 3. СИСТЕМА ЭФФЕКТОВ (VFX)
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

    public spawnDebris(x: number, y: number, width: number): void {
        for (let i = 0; i < 14; i++) {
            this.particles.push({
                x: x + Math.random() * width,
                y: y + Math.random() * 8,
                vx: (Math.random() - 0.5) * 80,
                vy: 40 + Math.random() * 120,
                life: 0.6,
                maxLife: 0.6,
                size: 3 + Math.random() * 3,
                color: '#64748b'
            });
        }
    }

    public spawnPerfectBurst(x: number, y: number): void {
        this.shockwaves.push({
            x, y,
            radius: 6,
            maxRadius: 85,
            alpha: 1.0,
            color: '#fbbf24'
        });

        for (let i = 0; i < 32; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 90 + Math.random() * 210;
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
// 4. ТИПЫ ПАТТЕРНОВ И КОНФИГУРАЦИИ
// ============================================================================
export type PatternType =
    | 'STATIC_STEP'
    | 'MOVING_PLATFORM'
    | 'NARROW_GATE'
    | 'DOUBLE_STEP'
    | 'RISK_SPLIT'
    | 'FALLING_PLATFORM'
    | 'WIND_CORRIDOR'
    | 'GUARDIAN_SEQUENCE';

interface Platform {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    springY: number;
    baseX?: number;
    speed?: number;
    amplitude?: number;
    isFalling?: boolean;
    fallSpeed?: number;
    isFinalTarget?: boolean;
    isRisk?: boolean;
}

type GameState = 'MENU' | 'RUNNING' | 'LANDED_TRANSITION' | 'RESULT_SUCCESS' | 'RESULT_FAILED';

// ============================================================================
// 5. ГЛАВНЫЙ ИГРОВОЙ ДВИЖОК
// ============================================================================
export class GameApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private audio = new AudioEngine();
    private yandex = new YandexBridge();
    private vfx = new VFXSystem();

    public readonly V_WIDTH = 960;
    public readonly V_HEIGHT = 540;

    // DOM элементы
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

    // FSM и защита от спама
    private gameState: GameState = 'MENU';
    private isTransitioning: boolean = false;

    // Прогресс
    private streak = 0;
    private maxStreak = 0;
    private score = 0;
    private currentSector = 1;
    private currentSeed = 1001;

    // Рантайм
    private time = 0;
    private timeScale = 1.0;
    private targetTimeScale = 1.0;
    private lastFrameTime = performance.now();
    private feedbackTimeout: number | null = null;

    // Камера со скроллом
    private camera = { x: 0, targetX: 0, zoom: 1.0, targetZoom: 1.0 };
    private shake = 0;

    // Физика
    private readonly GRAVITY = 1250;
    private readonly JUMP_POWER = -560;
    private readonly AIRTIME = (2 * 560) / 1250; // 0.896 с
    private readonly HORIZONTAL_SPEED = 340;

    // Сцена
    private currentPattern: PatternType = 'STATIC_STEP';
    private platforms: Platform[] = [];
    private stepProgress = 0;
    private stepTotal = 1;

    // Привязка
    private attachedPlatform: Platform | null = null;
    private platformOffsetX = 0;

    // Ветер
    private wind = { direction: 1, strength: 0, current: 0 };
    private windLines: Array<{ x: number; y: number; len: number; speed: number; alpha: number }> = [];

    // Игрок
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
        this.yandex.init();

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
        for (let i = 0; i < 32; i++) {
            this.windLines.push({
                x: Math.random() * this.V_WIDTH * 1.5,
                y: 70 + Math.random() * 400,
                len: 30 + Math.random() * 80,
                speed: 0.8 + Math.random() * 0.8,
                alpha: 0.08 + Math.random() * 0.18
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

        this.player.scaleX = 0.72;
        this.player.scaleY = 1.35;
        this.audio.playJump();
        this.vfx.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10);
    }

    /**
     * 24-Секторная кампания с кривой сложности по дизайн-документу
     */
    private getPatternForSector(sec: number): { type: PatternType; title: string } {
        const campaignMap: Record<number, { type: PatternType; title: string }> = {
            1: { type: 'STATIC_STEP', title: 'SECTOR 01 /// BASIC STEP' },
            2: { type: 'STATIC_STEP', title: 'SECTOR 02 /// GENTLE WIND' },
            3: { type: 'MOVING_PLATFORM', title: 'SECTOR 03 /// MOVING TARGET' },
            4: { type: 'STATIC_STEP', title: 'SECTOR 04 /// DISTANCE CHECK' },

            5: { type: 'MOVING_PLATFORM', title: 'SECTOR 05 /// TIMING DRILL' },
            6: { type: 'NARROW_GATE', title: 'SECTOR 06 /// NARROW PRECISION' },
            7: { type: 'MOVING_PLATFORM', title: 'SECTOR 07 /// HEADWIND CROSS' },
            8: { type: 'DOUBLE_STEP', title: 'SECTOR 08 /// DOUBLE RHYTHM' },

            9: { type: 'WIND_CORRIDOR', title: 'SECTOR 09 /// WIND STORM' },
            10: { type: 'NARROW_GATE', title: 'SECTOR 10 /// TIGHT CORRIDOR' },
            11: { type: 'RISK_SPLIT', title: 'SECTOR 11 /// CHOOSE YOUR LINE' },
            12: { type: 'FALLING_PLATFORM', title: 'SECTOR 12 /// COLLAPSING LEDGE' },
            13: { type: 'DOUBLE_STEP', title: 'SECTOR 13 /// TWIN STEPS' },
            14: { type: 'WIND_CORRIDOR', title: 'SECTOR 14 /// GALE RESISTANCE' },

            15: { type: 'MOVING_PLATFORM', title: 'SECTOR 15 /// HIGH VELOCITY' },
            16: { type: 'RISK_SPLIT', title: 'SECTOR 16 /// GREED TEST' },
            17: { type: 'NARROW_GATE', title: 'SECTOR 17 /// MOVING GATE' },
            18: { type: 'DOUBLE_STEP', title: 'SECTOR 18 /// CASCADE JUMP' },

            19: { type: 'FALLING_PLATFORM', title: 'SECTOR 19 /// ZERO MARGIN' },
            20: { type: 'WIND_CORRIDOR', title: 'SECTOR 20 /// HURRICANE' },
            21: { type: 'RISK_SPLIT', title: 'SECTOR 21 /// DANGER & GLORY' },
            22: { type: 'NARROW_GATE', title: 'SECTOR 22 /// NEEDLE EYE' },

            23: { type: 'GUARDIAN_SEQUENCE', title: 'SECTOR 23 /// GUARDIAN GATE (MINI-BOSS)' },
            24: { type: 'GUARDIAN_SEQUENCE', title: 'SECTOR 24 /// THE CORE (CLIMAX)' }
        };

        if (sec <= 24 && campaignMap[sec]) {
            return campaignMap[sec]!;
        }

        // Бесконечный мастер-режим после 24-го сектора
        const endlessPatterns: PatternType[] = [
            'MOVING_PLATFORM', 'NARROW_GATE', 'DOUBLE_STEP', 'RISK_SPLIT', 'FALLING_PLATFORM', 'WIND_CORRIDOR', 'GUARDIAN_SEQUENCE'
        ];
        const pType = endlessPatterns[(sec - 25) % endlessPatterns.length]!;
        return { type: pType, title: `SECTOR ${sec} /// MASTER MODE [${pType}]` };
    }

    private loadSector(sector: number, seed: number): void {
        const { type, title } = this.getPatternForSector(sector);
        this.currentPattern = type;
        this.objectiveEl.innerText = title;

        const tier = Math.min(5, Math.floor((sector - 1) / 4));

        // 1. Ветер
        const windCycle = Math.sin(seed * 0.77 + sector * 1.3);
        this.wind.direction = windCycle >= 0 ? 1 : -1;
        let windPower = (type === 'WIND_CORRIDOR') ? 50 + tier * 5 : 20 + tier * 6;
        if (type === 'STATIC_STEP' && sector === 1) windPower = 0;
        this.wind.strength = windPower;

        // Расчетная дальность прыжка
        const expectedVx = this.HORIZONTAL_SPEED + (this.wind.direction * this.wind.strength);
        const flightDistance = expectedVx * this.AIRTIME;

        // 2. Генерация платформ по паттерну
        this.platforms = [];
        const startP: Platform = { id: 'start', x: 100, y: 390, width: 130, height: 18, springY: 0 };
        this.platforms.push(startP);

        const targetBaseCenter = startP.x + (startP.width / 2) + flightDistance;

        switch (type) {
            case 'STATIC_STEP': {
                const w = Math.max(90, 140 - tier * 8);
                this.platforms.push({
                    id: 'target',
                    x: targetBaseCenter - w / 2,
                    y: 390,
                    width: w,
                    height: 18,
                    springY: 0,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'MOVING_PLATFORM': {
                const w = Math.max(85, 125 - tier * 8);
                const spd = 1.6 + tier * 0.22;
                const amp = 45 + tier * 6;
                this.platforms.push({
                    id: 'target',
                    x: targetBaseCenter - w / 2,
                    baseX: targetBaseCenter - w / 2,
                    y: 390,
                    width: w,
                    height: 18,
                    springY: 0,
                    speed: spd,
                    amplitude: amp,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'NARROW_GATE': {
                const w = Math.max(48, 75 - tier * 5); // Очень узкая платформа
                const isMoving = tier >= 3;
                this.platforms.push({
                    id: 'target',
                    x: targetBaseCenter - w / 2,
                    baseX: targetBaseCenter - w / 2,
                    y: 390,
                    width: w,
                    height: 18,
                    springY: 0,
                    speed: isMoving ? 1.5 : 0,
                    amplitude: isMoving ? 35 : 0,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'DOUBLE_STEP': {
                // Шаг 1 и Шаг 2
                const w1 = 100;
                const w2 = 95;
                const step1Center = targetBaseCenter;
                const step2Center = step1Center + flightDistance;

                this.platforms.push({
                    id: 'step-1',
                    x: step1Center - w1 / 2,
                    y: 390,
                    width: w1,
                    height: 18,
                    springY: 0,
                    isFinalTarget: false
                });

                this.platforms.push({
                    id: 'step-2',
                    x: step2Center - w2 / 2,
                    y: 390,
                    width: w2,
                    height: 18,
                    springY: 0,
                    isFinalTarget: true
                });
                this.stepTotal = 2;
                break;
            }

            case 'RISK_SPLIT': {
                // Две платформы: Safe (широкая, +100) и Risk (узкая, +250)
                const safeW = 120;
                const riskW = 55;
                this.platforms.push({
                    id: 'safe',
                    x: targetBaseCenter - safeW - 25,
                    y: 405, // чуть ниже
                    width: safeW,
                    height: 18,
                    springY: 0,
                    isFinalTarget: true,
                    isRisk: false
                });

                this.platforms.push({
                    id: 'risk',
                    x: targetBaseCenter + 25,
                    y: 375, // чуть выше
                    width: riskW,
                    height: 18,
                    springY: 0,
                    isFinalTarget: true,
                    isRisk: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'FALLING_PLATFORM': {
                const w = Math.max(80, 110 - tier * 6);
                this.platforms.push({
                    id: 'target',
                    x: targetBaseCenter - w / 2,
                    y: 390,
                    width: w,
                    height: 18,
                    springY: 0,
                    isFalling: false,
                    fallSpeed: 0,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'WIND_CORRIDOR': {
                const w = Math.max(85, 115 - tier * 6);
                this.platforms.push({
                    id: 'target',
                    x: targetBaseCenter - w / 2,
                    baseX: targetBaseCenter - w / 2,
                    y: 390,
                    width: w,
                    height: 18,
                    springY: 0,
                    speed: 1.8,
                    amplitude: 55,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'GUARDIAN_SEQUENCE': {
                // Mini-Boss: 3 последовательные платформы
                this.stepTotal = 3;
                for (let i = 1; i <= 3; i++) {
                    const w = i === 3 ? 110 : 80;
                    const center = startP.x + (startP.width / 2) + flightDistance * i;
                    this.platforms.push({
                        id: `guardian-${i}`,
                        x: center - w / 2,
                        baseX: center - w / 2,
                        y: 390 - (i - 1) * 20,
                        width: w,
                        height: 18,
                        springY: 0,
                        speed: i === 3 ? 2.2 : 1.4,
                        amplitude: i === 3 ? 65 : 35,
                        isFinalTarget: i === 3
                    });
                }
                break;
            }
        }

        this.stepProgress = 0;

        // Позиция игрока
        const playerStartX = startP.x + (startP.width - this.player.width) / 2;
        this.player.x = playerStartX;
        this.player.y = startP.y - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.scaleX = 1;
        this.player.scaleY = 1;

        this.attachedPlatform = startP;
        this.platformOffsetX = this.player.x - startP.x;

        this.camera.targetX = 0;
        this.camera.x = 0;
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

        // Плавное восстановление формы кубика
        const shapeRecoveryDt = Math.max(effectiveDt, dt * 0.45);
        this.player.scaleX += (1 - this.player.scaleX) * 12 * shapeRecoveryDt;
        this.player.scaleY += (1 - this.player.scaleY) * 12 * shapeRecoveryDt;

        // Ветер
        this.wind.current = this.wind.direction * this.wind.strength * (1 + Math.sin(this.time * 2.2) * 0.12);
        const absWind = Math.abs(this.wind.current);
        this.windArrow.innerText = this.wind.current >= 0 ? '→' : '←';
        this.windFill.style.width = `${Math.min(100, Math.max(15, (absWind / 65) * 100))}%`;

        for (const line of this.windLines) {
            line.x += (this.wind.current * 2.0) * line.speed * effectiveDt;
            if (line.x > this.camera.x + this.V_WIDTH + 100) line.x = this.camera.x - 100;
            if (line.x < this.camera.x - 100) line.x = this.camera.x + this.V_WIDTH + 100;
        }

        // Обновление платформ
        for (const p of this.platforms) {
            if (p.baseX !== undefined && p.amplitude && p.speed) {
                p.x = p.baseX + Math.sin(this.time * p.speed) * p.amplitude;
            }
            p.springY += (0 - p.springY) * 14 * dt;

            // Обрушение падающей платформы
            if (p.isFalling) {
                p.fallSpeed = (p.fallSpeed || 0) + 850 * dt;
                p.y += p.fallSpeed * dt;
                this.vfx.spawnDebris(p.x, p.y, p.width);
            }
        }

        // Позиция кубика
        if (this.player.grounded && this.attachedPlatform) {
            this.player.x = this.attachedPlatform.x + this.platformOffsetX;
            this.player.y = this.attachedPlatform.y + this.attachedPlatform.springY - this.player.height;
        } else if (this.gameState === 'RUNNING' && !this.player.grounded) {
            this.player.vy += this.GRAVITY * effectiveDt;
            this.player.vx = this.HORIZONTAL_SPEED + this.wind.current;

            this.player.x += this.player.vx * effectiveDt;
            this.player.y += this.player.vy * effectiveDt;

            this.checkCollisions(effectiveDt);

            if (this.player.y > this.V_HEIGHT + 60) {
                this.onFail();
            }
        }

        // Скролл камеры за игроком (для многоступенчатых секторов)
        this.camera.targetX = Math.max(0, this.player.x - 220);
        this.camera.x += (this.camera.targetX - this.camera.x) * 6 * dt;

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

        const footContactMargin = 8;

        for (const p of this.platforms) {
            const overlapsX = (px + pw - footContactMargin >= p.x) && (px + footContactMargin <= p.x + p.width);
            const crossesTop = prevBottom <= p.y + 16 && playerBottom >= p.y;

            if (overlapsX && crossesTop) {
                this.player.grounded = true;
                this.attachedPlatform = p;
                this.platformOffsetX = this.player.x - p.x;

                this.player.y = p.y - this.player.height;
                this.player.vy = 0;
                this.player.vx = 0;

                this.player.scaleX = 1.35;
                this.player.scaleY = 0.65;
                p.springY = 6;

                if (p.isFinalTarget) {
                    if (this.currentPattern === 'FALLING_PLATFORM') {
                        p.isFalling = true;
                    }
                    this.onLandedOnTarget(p);
                } else if (p.id.startsWith('step-') || p.id.startsWith('guardian-')) {
                    // Промежуточный шаг
                    this.stepProgress++;
                    this.audio.playStep();
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 8);
                    this.showFeedback(`STEP ${this.stepProgress}/${this.stepTotal}`, '#38bdf8');
                } else {
                    this.audio.playLanding(false);
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 8);
                }
                return;
            }
        }
    }

    private onLandedOnTarget(target: Platform): void {
        this.gameState = 'LANDED_TRANSITION';

        const playerCenter = this.player.x + this.player.width / 2;
        const targetCenter = target.x + target.width / 2;
        const dist = Math.abs(playerCenter - targetCenter);

        const perfectRadius = (target.width * 0.35) / 2;
        const isPerfect = dist <= perfectRadius;

        let reward = 100;
        if (target.isRisk) reward += 150; // Бонус за риск-платформу

        if (isPerfect) {
            this.streak++;
            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
                this.yandex.submitScore(this.maxStreak, this.score);
            }
            reward = 200 + (this.streak - 1) * 50 + (target.isRisk ? 150 : 0);

            this.timeScale = 0.18;
            this.targetTimeScale = 1.0;
            this.camera.targetZoom = 1.08;
            setTimeout(() => { this.camera.targetZoom = 1.0; }, 300);

            this.shake = 9;
            this.audio.playLanding(true);
            this.vfx.spawnPerfectBurst(playerCenter, target.y);
            this.showFeedback(target.isRisk ? 'RISK PERFECT!' : 'PERFECT!', '#fbbf24');

            this.resultKicker.innerText = `STREAK ×${this.streak}`;
            this.resultKicker.style.color = '#fbbf24';
            this.resultTitle.innerText = target.isRisk ? 'RISK MASTERED!' : 'PERFECT!';
            this.resultTitle.style.color = '#fbbf24';
            this.resultReward.innerText = `+${reward} COINS`;
        } else {
            this.streak = 0;
            this.shake = 3;
            this.audio.playLanding(false);
            this.vfx.spawnDust(playerCenter, target.y, 12);
            this.showFeedback(target.isRisk ? 'RISK TAKEN' : 'GOOD', '#38bdf8');

            this.resultKicker.innerText = 'LANDING CONFIRMED';
            this.resultKicker.style.color = '#64748b';
            this.resultTitle.innerText = target.isRisk ? 'RISK SUCCESS' : 'GOOD LANDING';
            this.resultTitle.style.color = '#38bdf8';
            this.resultReward.innerText = `+${reward} COINS`;
        }

        this.score += reward;
        this.yandex.submitScore(this.maxStreak, this.score);

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
        const savedStreak = this.streak;
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

        // Яндекс Игры: Спасение стрика за Rewarded Ad при серии от 3+ Perfect
        if (savedStreak >= 3) {
            this.retryButton.innerHTML = `★ SAVE STREAK (AD) ★`;
            this.retryButton.onclick = (e) => {
                e.stopPropagation();
                this.yandex.showRewarded(() => {
                    this.streak = savedStreak;
                    this.streakEl.innerText = `STREAK ×${this.streak}`;
                    this.retryButton.onclick = null;
                    this.retrySameChallenge();
                });
            };
        } else {
            this.retryButton.innerHTML = `TRY AGAIN <span>↻</span>`;
            this.retryButton.onclick = null;
            // Полноэкранная реклама с кулдауном
            this.yandex.showFullscreen();
        }

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

        // Смещение камеры при скролле
        this.ctx.translate(-this.camera.x, 0);

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
        for (const p of this.platforms) {
            const py = p.y + p.springY;
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
            this.ctx.fillRect(p.x + 2, py + 8, p.width, p.height);

            // Тело
            this.ctx.fillStyle = p.isRisk ? '#78350f' : '#1e293b';
            this.ctx.fillRect(p.x, py, p.width, p.height);

            // Верхняя кромка
            let edgeColor = '#64748b';
            if (p.isFinalTarget) edgeColor = p.isRisk ? '#f59e0b' : '#0284c7';
            else if (p.id.startsWith('step-') || p.id.startsWith('guardian-')) edgeColor = '#38bdf8';

            this.ctx.fillStyle = edgeColor;
            this.ctx.fillRect(p.x, py, p.width, 3);

            // Зона Perfect
            if (p.isFinalTarget) {
                const pw = p.width * 0.35;
                const px = p.x + (p.width - pw) / 2;
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.shadowColor = '#fbbf24';
                this.ctx.shadowBlur = p.isRisk ? 12 : 8;
                this.ctx.fillRect(px, py, pw, 4);
                this.ctx.shadowBlur = 0;
            }

            // Метка RISK
            if (p.isRisk) {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.font = '900 10px sans-serif';
                this.ctx.fillText('RISK +250', p.x + p.width / 2 - 25, py + 14);
            }
        }

        // 3. VFX
        this.vfx.draw(this.ctx);

        // 4. Игрок
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x + p.width / 2, p.y + p.height);
        this.ctx.scale(p.scaleX, p.scaleY);

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);
        this.ctx.shadowBlur = 0;

        // Глаз
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
