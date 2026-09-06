/**
 * EDGEBOUND — MASTER PRODUCTION ENGINE
 * Полное соответствие требованиям Яндекс Игр:
 * 1. Облачные сохранения (Yandex Player Data + LocalStorage Fallback).
 * 2. Глушение звука и пауза игры во время рекламы и сворачивания вкладки.
 * 3. Локализация RU / EN на базе окружения Яндекса.
 * 4. Таблицы лидеров (max_streak, total_score).
 * 5. Атмосферный ветер со стратификацией слоев (нулевое наслоение и перекрытие!).
 * 6. Кампания 01-24 с честным выжиданием таймингов и наглядным RISK_SPLIT.
 */

// ============================================================================
// 1. СИСТЕМА ЛОКАЛИЗАЦИИ (RU / EN)
// ============================================================================
type Lang = 'ru' | 'en';

const TRANSLATIONS = {
    ru: {
        brand: 'EDGEBOUND ///',
        streak: 'СТРИК',
        coins: 'МОНЕТ',
        wind: 'ВЕТЕР',
        tapHint: 'НАЖМИТЕ ДЛЯ ПРЫЖКА',
        startTitle: 'НАЙДИ СВОЮ<br /><em>ГРАНЬ.</em>',
        startDesc: 'Одно касание. Один прыжок.<br />Попади в ядро для <b>ИДЕАЛЬНО.</b>',
        startButton: 'В БОЙ <span>↗</span>',
        nextButton: 'СЛЕДУЮЩИЙ СЕКТОР <span>↗</span>',
        retryButton: 'ПОВТОРИТЬ <span>↻</span>',
        saveStreakButton: '★ СПАСТИ СТРИК (РЕКЛАМА) ★',
        perfectTitle: 'ИДЕАЛЬНО!',
        goodTitle: 'ХОРОШЕЕ ПРИЗЕМЛЕНИЕ',
        failTitle: 'ПАДЕНИЕ В БЕЗДНУ',
        kickerConfirmed: 'ПРИЗЕМЛЕНИЕ ПОДТВЕРЖДЕНО',
        feedbackPerfect: 'ИДЕАЛЬНО!',
        feedbackGood: 'ХОРОШО',
        feedbackMissed: 'ПРОМАХ',
        feedbackStep: (cur: number, total: number) => `ШАГ ${cur}/${total}`,
        feedbackCollapsing: 'ПРЫГАЙ! ОНА ПАДАЕТ!',
        feedbackRiskPerfect: 'РИСК ОПРАВДАН!',
        feedbackRiskTaken: 'РИСК ВЗЯТ!',
        badgeRisk: '★ РИСК +250',
        badgeSafe: 'БЕЗОПАСНО +100',
        badgeCrack: 'ТРЕЩИТ',
        sectors: {
            1: 'СЕКТОР 01 /// ВВОДНЫЙ ПРЫЖОК',
            2: 'СЕКТОР 02 /// ЛЕГКИЙ ВЕТЕРОК',
            3: 'СЕКТОР 03 /// ПЛАВНАЯ ЦЕЛЬ',
            4: 'СЕКТОР 04 /// ПРОВЕРКА ДИСТАНЦИИ',
            5: 'СЕКТОР 05 /// ВЫЖИДАЙ ТАЙМИНГ!',
            6: 'СЕКТОР 06 /// УЗКИЕ ВОРОТА',
            7: 'СЕКТОР 07 /// ВСТРЕЧНЫЙ ПОТОК',
            8: 'СЕКТОР 08 /// ДВОЙНОЙ РИТМ',
            9: 'СЕКТОР 09 /// ВЕТРЯНОЙ ШТОРМ',
            10: 'СЕКТОР 10 /// ИГОЛЬНОЕ УШКО',
            11: 'СЕКТОР 11 /// РИСК ИЛИ НАДЕЖНОСТЬ',
            12: 'СЕКТОР 12 /// РУШАЩАЯСЯ ОПОРА',
            13: 'СЕКТОР 13 /// ДВОЙНОЙ ШАГ В ДВИЖЕНИИ',
            14: 'СЕКТОР 14 /// СОПРОТИВЛЕНИЕ БУРЕ',
            15: 'СЕКТОР 15 /// ВЫСОКАЯ СКОРОСТЬ',
            16: 'СЕКТОР 16 /// ИСПЫТАНИЕ ЖАДНОСТЬЮ',
            17: 'СЕКТОР 17 /// ПОДВИЖНАЯ ИГЛА',
            18: 'СЕКТОР 18 /// КАСКАДНЫЙ ОБВАЛ',
            19: 'СЕКТОР 19 /// ШТОРМОВОЙ ОБВАЛ',
            20: 'СЕКТОР 20 /// УРАГАННЫЙ КОРИДОР',
            21: 'СЕКТОР 21 /// ОПАСНОСТЬ И ТРИУМФ',
            22: 'СЕКТОР 22 /// НУЛЕВОЙ ЗАПАС (32PX)',
            23: 'СЕКТОР 23 /// ВРАТА СТРАЖА (МИНИ-БОСС)',
            24: 'СЕКТОР 24 /// ЯДРО (ФИНАЛ)'
        }
    },
    en: {
        brand: 'EDGEBOUND ///',
        streak: 'STREAK',
        coins: 'COINS',
        wind: 'WIND',
        tapHint: 'TAP ANYWHERE TO JUMP',
        startTitle: 'FIND THE<br /><em>EDGE.</em>',
        startDesc: 'One tap. One jump.<br />Land in the core for a <b>PERFECT.</b>',
        startButton: 'DROP IN <span>↗</span>',
        nextButton: 'NEXT CHALLENGE <span>↗</span>',
        retryButton: 'TRY AGAIN <span>↻</span>',
        saveStreakButton: '★ SAVE STREAK (AD) ★',
        perfectTitle: 'PERFECT!',
        goodTitle: 'GOOD LANDING',
        failTitle: 'RUN FAILED',
        kickerConfirmed: 'LANDING CONFIRMED',
        feedbackPerfect: 'PERFECT!',
        feedbackGood: 'GOOD',
        feedbackMissed: 'MISSED',
        feedbackStep: (cur: number, total: number) => `STEP ${cur}/${total}`,
        feedbackCollapsing: 'JUMP! IT FALLS!',
        feedbackRiskPerfect: 'RISK PERFECT!',
        feedbackRiskTaken: 'RISK TAKEN!',
        badgeRisk: '★ RISK +250',
        badgeSafe: 'SAFE +100',
        badgeCrack: 'CRACK',
        sectors: {
            1: 'SECTOR 01 /// WELCOME: TAP TO JUMP',
            2: 'SECTOR 02 /// GENTLE BREEZE',
            3: 'SECTOR 03 /// SLOW MOVING TARGET',
            4: 'SECTOR 04 /// DISTANCE CHECK',
            5: 'SECTOR 05 /// WAIT FOR THE TIMING!',
            6: 'SECTOR 06 /// NARROW PRECISION',
            7: 'SECTOR 07 /// HEADWIND DRIFT',
            8: 'SECTOR 08 /// DOUBLE RHYTHM',
            9: 'SECTOR 09 /// WIND STORM',
            10: 'SECTOR 10 /// NEEDLE EYE',
            11: 'SECTOR 11 /// RISK OR REWARD',
            12: 'SECTOR 12 /// COLLAPSING LEDGE',
            13: 'SECTOR 13 /// TWIN STEPS (MOVING)',
            14: 'SECTOR 14 /// GALE RESISTANCE',
            15: 'SECTOR 15 /// HYPER VELOCITY',
            16: 'SECTOR 16 /// GREED TEST',
            17: 'SECTOR 17 /// MOVING NEEDLE',
            18: 'SECTOR 18 /// CASCADE RHYTHM',
            19: 'SECTOR 19 /// HURRICANE COLLAPSE',
            20: 'SECTOR 20 /// HURRICANE',
            21: 'SECTOR 21 /// DANGER & GLORY',
            22: 'SECTOR 22 /// ZERO MARGIN (32PX)',
            23: 'SECTOR 23 /// GUARDIAN GATE (MINI-BOSS)',
            24: 'SECTOR 24 /// THE CORE (CLIMAX)'
        }
    }
};

// ============================================================================
// 2. АУДИОСИСТЕМА С ПОЛНЫМ ГЛУШЕНИЕМ ДЛЯ РЕКЛАМЫ (Web Audio API)
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
            if (this.ctx.state === 'suspended' && !this.isMuted) {
                this.ctx.resume();
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
        if (this.ctx) {
            if (muted && this.ctx.state === 'running') {
                this.ctx.suspend();
            } else if (!muted && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }
    }

    public playJump(): void {
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
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
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
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

    public playCollapse(): void {
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    public playLanding(isPerfect: boolean): void {
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
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
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
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
// 3. ПОЛНОФУНКЦИОНАЛЬНЫЙ МОСТ ЯНДЕКС ИГР (Yandex SDK)
// ============================================================================
interface SaveData {
    coins: number;
    maxStreak: number;
    maxSector: number;
}

class YandexBridge {
    private ysdk: any = null;
    private player: any = null;
    private lastAdTime = 0;
    public isAvailable = false;
    public lang: Lang = 'ru';

    public async init(): Promise<SaveData | null> {
        // Определение языка браузера по умолчанию
        const browserLang = navigator.language || (navigator as any).userLanguage || 'ru';
        this.lang = browserLang.startsWith('ru') ? 'ru' : 'en';

        const isInsideIframe = window.parent !== window;
        if ((window as any).YaGames && isInsideIframe) {
            try {
                this.ysdk = await (window as any).YaGames.init();
                this.isAvailable = true;

                // Определение языка из окружения Яндекса
                if (this.ysdk.environment?.i18n?.lang) {
                    this.lang = this.ysdk.environment.i18n.lang === 'ru' ? 'ru' : 'en';
                }

                // Загрузка игрока
                try {
                    this.player = await this.ysdk.getPlayer({ scopes: false });
                } catch (e) {
                    console.log('Гостевой режим игрока Яндекса');
                }

                // Сигнал готовности для модерации
                this.ysdk.features.LoadingAPI?.ready();
                console.log(`✅ Яндекс SDK подключен! Язык: ${this.lang}`);

                return await this.loadData();
            } catch (e) {
                console.warn('⚠️ Ошибка инициализации Яндекс SDK, локальный режим', e);
            }
        }

        return this.loadLocalFallback();
    }

    public async loadData(): Promise<SaveData | null> {
        if (this.player) {
            try {
                const data = await this.player.getData(['coins', 'maxStreak', 'maxSector']);
                if (data && typeof data.coins === 'number') {
                    return data as SaveData;
                }
            } catch (e) {}
        }
        return this.loadLocalFallback();
    }

    public async saveData(data: SaveData): Promise<void> {
        if (this.player) {
            try {
                await this.player.setData(data, true);
            } catch (e) {}
        }
        try {
            localStorage.setItem('edgebound_save', JSON.stringify(data));
        } catch (e) {}
    }

    private loadLocalFallback(): SaveData | null {
        try {
            const raw = localStorage.getItem('edgebound_save');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    public showFullscreen(onOpen: () => void, onClose: () => void): void {
        const now = Date.now();
        if (now - this.lastAdTime < 60000) {
            onClose();
            return;
        }

        if (this.ysdk) {
            this.ysdk.adv.showFullscreenAdv({
                callbacks: {
                    onOpen: () => {
                        this.lastAdTime = Date.now();
                        onOpen();
                    },
                    onClose: () => onClose(),
                    onError: () => onClose()
                }
            });
        } else {
            console.log('📺 [Реклама] Межстраничная реклама (тест)');
            onOpen();
            setTimeout(onClose, 500);
        }
    }

    public showRewarded(onOpen: () => void, onRewarded: () => void, onClose: () => void): void {
        if (this.ysdk) {
            this.ysdk.adv.showRewardedVideo({
                callbacks: {
                    onOpen: () => onOpen(),
                    onRewarded: () => onRewarded(),
                    onClose: () => onClose(),
                    onError: () => onClose()
                }
            });
        } else {
            console.log('🎁 [Реклама за вознаграждение] Стрик спасен (тест)');
            onOpen();
            setTimeout(() => {
                onRewarded();
                onClose();
            }, 500);
        }
    }

    public async submitScore(maxStreak: number, score: number): Promise<void> {
        if (this.ysdk) {
            try {
                const lb = await this.ysdk.getLeaderboards();
                await lb.setLeaderboardScore('max_streak', maxStreak);
                await lb.setLeaderboardScore('total_score', score);
            } catch (e) {}
        }
    }
}

// ============================================================================
// 4. СИСТЕМА ЭФФЕКТОВ (VFX)
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
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x + Math.random() * width,
                y: y + Math.random() * 8,
                vx: (Math.random() - 0.5) * 70,
                vy: 60 + Math.random() * 120,
                life: 0.5,
                maxLife: 0.5,
                size: 2.5 + Math.random() * 3,
                color: '#e2e8f0'
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
// 5. ТИПЫ ДЛЯ ПЛАТФОРМ И ВЕТРА
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
    phase?: number;
    isFalling?: boolean;
    fallSpeed?: number;
    isFinalTarget?: boolean;
    isRisk?: boolean;
}

// Стратифицированная частица ветра (гарантированное отсутствие наслоения)
interface StratifiedWindParticle {
    x: number;
    slotIndex: number;
    y: number;
    speed: number;
    len: number;
    life: number;
    maxLife: number;
    baseAlpha: number;
}

type GameState = 'MENU' | 'RUNNING' | 'LANDED_TRANSITION' | 'RESULT_SUCCESS' | 'RESULT_FAILED' | 'PAUSED';

// ============================================================================
// 6. ГЛАВНЫЙ ИГРОВОЙ ДВИЖОК
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

    // FSM и пауза
    private gameState: GameState = 'MENU';
    private previousState: GameState = 'MENU';
    private isTransitioning: boolean = false;
    private isPausedForAd: boolean = false;

    // Прогресс
    private streak = 0;
    private maxStreak = 0;
    private score = 0;
    private currentSector = 1;
    private currentSeed = 1001;

    // Таймеры
    private sectorTime = 0;
    private timeScale = 1.0;
    private targetTimeScale = 1.0;
    private lastFrameTime = performance.now();
    private feedbackTimeout: number | null = null;

    // Камера
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

    // ✅ СТРАТИФИЦИРОВАННЫЙ ВЕТЕР: 18 эшелонов с разделением по высоте (0 наслоений!)
    private wind = { direction: 1, strength: 0, current: 0 };
    private smoothWind = 0;
    private readonly TOTAL_WIND_SLOTS = 18;
    private windParticles: StratifiedWindParticle[] = [];

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
        this.initStratifiedWind();
        this.bindEvents();
        this.setupYandexSDK();

        requestAnimationFrame((t) => this.loop(t));
    }

    private get t() {
        return TRANSLATIONS[this.yandex.lang];
    }

    private async setupYandexSDK(): Promise<void> {
        const saved = await this.yandex.init();
        if (saved) {
            this.score = saved.coins || 0;
            this.maxStreak = saved.maxStreak || 0;
            this.currentSector = Math.max(1, saved.maxSector || 1);
        }

        this.applyLocalization();
        this.loadSector(this.currentSector, this.currentSeed);
    }

    private applyLocalization(): void {
        const tr = this.t;
        // Обновление статических элементов интерфейса
        const brand = document.querySelector('.brand');
        if (brand) brand.innerHTML = `EDGEBOUND <span>///</span>`;

        const windLabel = document.querySelector('.wind-label');
        if (windLabel) windLabel.textContent = tr.wind;

        const tapHint = document.querySelector('.tap-hint');
        if (tapHint) tapHint.textContent = tr.tapHint;

        const startH1 = this.startPanel.querySelector('h1');
        if (startH1) startH1.innerHTML = tr.startTitle;

        const startP = this.startPanel.querySelector('p:not(.eyebrow)');
        if (startP) startP.innerHTML = tr.startDesc;

        this.startButton.innerHTML = tr.startButton;
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

    /**
     * ✅ СТРАТИФИЦИРОВАННЫЙ ВЕТЕР:
     * Каждая частица жестко привязана к своему высотному слоту.
     * Расстояние между любыми полосами по высоте строго >= 18 пикселей.
     * Наслоение линий друг на друга математически невозможно!
     */
    private initStratifiedWind(): void {
        this.windParticles = [];
        const yStart = 65;
        const yEnd = 465;
        const slotHeight = (yEnd - yStart) / (this.TOTAL_WIND_SLOTS - 1);

        for (let i = 0; i < this.TOTAL_WIND_SLOTS; i++) {
            const maxLife = 1.6 + Math.random() * 1.2;
            const slotY = yStart + i * slotHeight + (Math.random() - 0.5) * 6; // контролируемый микро-разброс

            this.windParticles.push({
                x: Math.random() * this.V_WIDTH,
                slotIndex: i,
                y: slotY,
                speed: 0.95 + Math.random() * 0.15, // равные скорости потока
                len: 26 + Math.random() * 32,
                life: Math.random() * maxLife,
                maxLife,
                baseAlpha: 0.11 + Math.random() * 0.12
            });
        }
    }

    private handleAction(): void {
        if (this.isTransitioning || this.isPausedForAd) return;

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

        // ✅ ТРЕБОВАНИЕ МОДЕРАЦИИ: пауза и глушение звука при сворачивании вкладки
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.audio.setMuted(true);
                if (this.gameState === 'RUNNING') {
                    this.previousState = this.gameState;
                    this.gameState = 'PAUSED';
                }
            } else {
                if (!this.isPausedForAd) {
                    this.audio.setMuted(false);
                    if (this.gameState === 'PAUSED') {
                        this.gameState = this.previousState;
                    }
                }
            }
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

    private getPatternForSector(sec: number): { type: PatternType; title: string } {
        const tr = this.t;
        const localized = tr.sectors as Record<number, string>;

        const patterns: Record<number, PatternType> = {
            1: 'STATIC_STEP', 2: 'STATIC_STEP', 3: 'MOVING_PLATFORM', 4: 'STATIC_STEP',
            5: 'MOVING_PLATFORM', 6: 'NARROW_GATE', 7: 'MOVING_PLATFORM', 8: 'DOUBLE_STEP',
            9: 'WIND_CORRIDOR', 10: 'NARROW_GATE', 11: 'RISK_SPLIT', 12: 'FALLING_PLATFORM',
            13: 'DOUBLE_STEP', 14: 'WIND_CORRIDOR', 15: 'MOVING_PLATFORM', 16: 'RISK_SPLIT',
            17: 'NARROW_GATE', 18: 'DOUBLE_STEP', 19: 'FALLING_PLATFORM', 20: 'WIND_CORRIDOR',
            21: 'RISK_SPLIT', 22: 'NARROW_GATE', 23: 'GUARDIAN_SEQUENCE', 24: 'GUARDIAN_SEQUENCE'
        };

        const pType = patterns[sec] || 'MOVING_PLATFORM';
        const pTitle = localized[sec] || `SECTOR ${sec} /// [${pType}]`;

        return { type: pType, title: pTitle };
    }

    private loadSector(sector: number, seed: number): void {
        const { type, title } = this.getPatternForSector(sector);
        this.currentPattern = type;
        this.objectiveEl.innerText = title;

        this.sectorTime = 0;
        const tier = Math.min(5, Math.floor((sector - 1) / 4));

        const windCycle = Math.sin(seed * 0.77 + sector * 1.3);
        this.wind.direction = windCycle >= 0 ? 1 : -1;

        let windPower = 0;
        if (sector === 2) windPower = 12;
        else if (sector === 4) windPower = 16;
        else if (sector >= 5) {
            windPower = (type === 'WIND_CORRIDOR') ? 52 + tier * 4 : 22 + tier * 5;
        }
        this.wind.strength = windPower;

        const expectedVx = this.HORIZONTAL_SPEED + (this.wind.direction * this.wind.strength);
        const flightDistance = expectedVx * this.AIRTIME;

        this.platforms = [];
        const startP: Platform = { id: 'start', x: 100, y: 390, width: 130, height: 18, springY: 0 };
        this.platforms.push(startP);

        const targetBaseCenter = startP.x + (startP.width / 2) + flightDistance;

        switch (type) {
            case 'STATIC_STEP': {
                const w = sector === 1 ? 135 : (sector === 2 ? 115 : 100);
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
                const isIntro = sector === 3;
                const w = isIntro ? 100 : Math.max(65, 78 - tier * 4);
                const spd = isIntro ? 1.3 : 1.75 + tier * 0.22;
                const amp = isIntro ? 50 : 75 + tier * 4;
                const startPhase = isIntro ? 0 : (Math.PI / 2) - (spd * this.AIRTIME);

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
                    phase: startPhase,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'NARROW_GATE': {
                const w = sector === 6 ? 52 : Math.max(32, 45 - tier * 3);
                const isMoving = sector >= 6;
                const spd = 1.5 + tier * 0.2;
                const amp = 35 + tier * 4;
                const phase = (Math.PI / 2) - (spd * this.AIRTIME);

                this.platforms.push({
                    id: 'target',
                    x: targetBaseCenter - w / 2,
                    baseX: targetBaseCenter - w / 2,
                    y: 390,
                    width: w,
                    height: 18,
                    springY: 0,
                    speed: isMoving ? spd : 0,
                    amplitude: isMoving ? amp : 0,
                    phase,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'DOUBLE_STEP': {
                const w1 = Math.max(75, 90 - tier * 4);
                const w2 = Math.max(68, 80 - tier * 4);
                const step1Center = targetBaseCenter;
                const step2Center = step1Center + flightDistance;
                const step2Moving = sector >= 8;
                const spd2 = 1.6 + tier * 0.2;
                const amp2 = 60 + tier * 4;

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
                    baseX: step2Center - w2 / 2,
                    y: 390,
                    width: w2,
                    height: 18,
                    springY: 0,
                    speed: step2Moving ? spd2 : 0,
                    amplitude: step2Moving ? amp2 : 0,
                    phase: (Math.PI / 2) - (spd2 * this.AIRTIME),
                    isFinalTarget: true
                });
                this.stepTotal = 2;
                break;
            }

            case 'RISK_SPLIT': {
                // Синяя SAFE внизу + парящая золотая RISK в воздухе
                const safeW = sector === 11 ? 110 : Math.max(70, 90 - tier * 5);
                const riskW = 55;
                const riskSpd = 1.8 + tier * 0.2;

                this.platforms.push({
                    id: 'safe',
                    x: targetBaseCenter - safeW / 2,
                    y: 390,
                    width: safeW,
                    height: 18,
                    springY: 0,
                    isFinalTarget: true,
                    isRisk: false
                });

                this.platforms.push({
                    id: 'risk',
                    x: targetBaseCenter - 25 - riskW / 2,
                    baseX: targetBaseCenter - 25 - riskW / 2,
                    y: 350,
                    width: riskW,
                    height: 18,
                    springY: 0,
                    speed: riskSpd,
                    amplitude: 50,
                    isFinalTarget: true,
                    isRisk: true
                });

                this.stepTotal = 1;
                break;
            }

            case 'FALLING_PLATFORM': {
                const w1 = Math.max(75, 88 - tier * 3);
                const w2 = Math.max(75, 88 - tier * 3);
                const step1Center = targetBaseCenter;
                const step2Center = step1Center + flightDistance;

                this.platforms.push({
                    id: 'falling-step',
                    x: step1Center - w1 / 2,
                    y: 390,
                    width: w1,
                    height: 18,
                    springY: 0,
                    isFalling: false,
                    fallSpeed: 0,
                    isFinalTarget: false
                });

                this.platforms.push({
                    id: 'target',
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

            case 'WIND_CORRIDOR': {
                const w = Math.max(70, 85 - tier * 3);
                const spd = 1.7 + tier * 0.2;
                const amp = 55 + tier * 4;
                const phase = (Math.PI / 2) - (spd * this.AIRTIME);

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
                    phase,
                    isFinalTarget: true
                });
                this.stepTotal = 1;
                break;
            }

            case 'GUARDIAN_SEQUENCE': {
                this.stepTotal = 3;
                for (let i = 1; i <= 3; i++) {
                    const w = i === 3 ? 90 : 72;
                    const center = startP.x + (startP.width / 2) + flightDistance * i;
                    const spd = i === 3 ? 2.4 : 1.6;
                    const amp = i === 3 ? 65 : 40;
                    this.platforms.push({
                        id: `guardian-${i}`,
                        x: center - w / 2,
                        baseX: center - w / 2,
                        y: 390 - (i - 1) * 20,
                        width: w,
                        height: 18,
                        springY: 0,
                        speed: spd,
                        amplitude: amp,
                        phase: (Math.PI / 2) - (spd * this.AIRTIME),
                        isFinalTarget: i === 3
                    });
                }
                break;
            }
        }

        this.stepProgress = 0;

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

        // Облачное сохранение максимального сектора
        this.yandex.saveData({
            coins: this.score,
            maxStreak: this.maxStreak,
            maxSector: this.currentSector
        });

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
        if (this.gameState === 'PAUSED' || this.isPausedForAd) return;

        this.timeScale += (this.targetTimeScale - this.timeScale) * 8 * dt;
        const effectiveDt = dt * this.timeScale;
        this.sectorTime += effectiveDt;

        const shapeRecoveryDt = Math.max(effectiveDt, dt * 0.45);
        this.player.scaleX += (1 - this.player.scaleX) * 12 * shapeRecoveryDt;
        this.player.scaleY += (1 - this.player.scaleY) * 12 * shapeRecoveryDt;

        // Ветер
        this.wind.current = this.wind.direction * this.wind.strength * (1 + Math.sin(this.sectorTime * 2.2) * 0.12);
        this.smoothWind += (this.wind.current - this.smoothWind) * 4 * effectiveDt;

        const absWind = Math.abs(this.smoothWind);
        this.windArrow.innerText = this.smoothWind >= 0 ? '→' : '←';
        this.windFill.style.width = `${Math.min(100, Math.max(15, (absWind / 65) * 100))}%`;

        // ✅ ДВИЖЕНИЕ СТРАТИФИЦИРОВАННОГО ВЕТРА:
        const windFlowSpeed = this.smoothWind * 2.2;
        const windDir = this.smoothWind >= 0 ? 1 : -1;

        for (const p of this.windParticles) {
            p.life -= effectiveDt;
            p.x += windFlowSpeed * p.speed * effectiveDt;

            const isOut = windDir >= 0
                ? (p.x > this.camera.x + this.V_WIDTH + 60)
                : (p.x < this.camera.x - 60);

            // Респаун строго в своем высотном слоте
            if (p.life <= 0) {
                p.maxLife = 1.6 + Math.random() * 1.2;
                p.life = p.maxLife;
                p.x = this.camera.x + Math.random() * this.V_WIDTH;
            } else if (isOut) {
                p.maxLife = 1.6 + Math.random() * 1.2;
                p.life = p.maxLife;
                if (windDir >= 0) {
                    p.x = this.camera.x - 20 - Math.random() * 60;
                } else {
                    p.x = this.camera.x + this.V_WIDTH + 20 + Math.random() * 60;
                }
            }
        }

        // Обновление платформ по sectorTime
        for (const p of this.platforms) {
            if (p.baseX !== undefined && p.amplitude && p.speed) {
                const ph = p.phase || 0;
                p.x = p.baseX + Math.sin(this.sectorTime * p.speed + ph) * p.amplitude;
            }
            p.springY += (0 - p.springY) * 14 * dt;

            if (p.isFalling) {
                p.fallSpeed = (p.fallSpeed || 0) + 700 * dt;
                p.y += p.fallSpeed * dt;
                this.vfx.spawnDebris(p.x, p.y, p.width);

                if (this.player.grounded && this.attachedPlatform === p) {
                    this.shake = Math.min(8, this.shake + dt * 12);
                    if (p.y > 470) {
                        this.onFail();
                    }
                }
            }
        }

        // Игрок
        if (this.player.grounded && this.attachedPlatform) {
            this.player.x = this.attachedPlatform.x + this.platformOffsetX;
            this.player.y = this.attachedPlatform.y + this.attachedPlatform.springY - this.player.height;
        } else if (this.gameState === 'RUNNING' && !this.player.grounded) {
            this.player.vy += this.GRAVITY * effectiveDt;
            this.player.vx = this.HORIZONTAL_SPEED + this.smoothWind;

            this.player.x += this.player.vx * effectiveDt;
            this.player.y += this.player.vy * effectiveDt;

            this.checkCollisions(effectiveDt);

            if (this.player.y > this.V_HEIGHT + 60) {
                this.onFail();
            }
        }

        // Камера
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
        const sorted = [...this.platforms].sort((a, b) => a.y - b.y);

        for (const p of sorted) {
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
                    this.onLandedOnTarget(p);
                } else if (p.id === 'falling-step') {
                    p.isFalling = true;
                    p.fallSpeed = 60;
                    this.stepProgress = 1;
                    this.audio.playCollapse();
                    this.shake = 7;
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 10);
                    this.showFeedback(this.t.feedbackCollapsing, '#f97316');
                } else if (p.id.startsWith('step-') || p.id.startsWith('guardian-')) {
                    this.stepProgress++;
                    this.audio.playStep();
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 8);
                    this.showFeedback(this.t.feedbackStep(this.stepProgress, this.stepTotal), '#38bdf8');
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
        const tr = this.t;

        const playerCenter = this.player.x + this.player.width / 2;
        const targetCenter = target.x + target.width / 2;
        const dist = Math.abs(playerCenter - targetCenter);

        const perfectRadius = (target.width * 0.35) / 2;
        const isPerfect = dist <= perfectRadius;

        let reward = 100;
        if (target.isRisk) reward = 250;

        if (isPerfect) {
            this.streak++;
            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
                this.yandex.submitScore(this.maxStreak, this.score);
            }
            reward = (target.isRisk ? 350 : 200) + (this.streak - 1) * 50;

            this.timeScale = 0.18;
            this.targetTimeScale = 1.0;
            this.camera.targetZoom = 1.08;
            setTimeout(() => { this.camera.targetZoom = 1.0; }, 300);

            this.shake = 9;
            this.audio.playLanding(true);
            this.vfx.spawnPerfectBurst(playerCenter, target.y);
            this.showFeedback(target.isRisk ? tr.feedbackRiskPerfect : tr.feedbackPerfect, '#fbbf24');

            this.resultKicker.innerText = `${tr.streak} ×${this.streak}`;
            this.resultKicker.style.color = '#fbbf24';
            this.resultTitle.innerText = target.isRisk ? tr.feedbackRiskPerfect : tr.perfectTitle;
            this.resultTitle.style.color = '#fbbf24';
            this.resultReward.innerText = `+${reward} ${tr.coins}`;
        } else {
            this.streak = 0;
            this.shake = 3;
            this.audio.playLanding(false);
            this.vfx.spawnDust(playerCenter, target.y, 12);
            this.showFeedback(target.isRisk ? tr.feedbackRiskTaken : tr.feedbackGood, '#38bdf8');

            this.resultKicker.innerText = tr.kickerConfirmed;
            this.resultKicker.style.color = '#64748b';
            this.resultTitle.innerText = target.isRisk ? tr.feedbackRiskTaken : tr.goodTitle;
            this.resultTitle.style.color = '#38bdf8';
            this.resultReward.innerText = `+${reward} ${tr.coins}`;
        }

        this.score += reward;
        this.yandex.submitScore(this.maxStreak, this.score);
        this.yandex.saveData({
            coins: this.score,
            maxStreak: this.maxStreak,
            maxSector: this.currentSector
        });

        this.streakEl.innerText = `${tr.streak} ×${this.streak}`;
        this.scoreEl.innerText = String(this.score).padStart(4, '0');
        this.retryButton.innerHTML = tr.nextButton;

        setTimeout(() => {
            this.clearFeedback();
            this.resultPanel.classList.add('visible');
            this.gameState = 'RESULT_SUCCESS';
        }, 450);
    }

    private onFail(): void {
        this.gameState = 'LANDED_TRANSITION';
        const tr = this.t;
        const savedStreak = this.streak;
        this.streak = 0;
        this.streakEl.innerText = `${tr.streak} ×0`;
        this.shake = 12;
        this.audio.playFail();
        this.showFeedback(tr.feedbackMissed, '#ef4444');

        this.resultKicker.innerText = `SECTOR 0${this.currentSector}`;
        this.resultKicker.style.color = '#64748b';
        this.resultTitle.innerText = tr.failTitle;
        this.resultTitle.style.color = '#ef4444';
        this.resultReward.innerText = `+0 ${tr.coins}`;

        // Яндекс Игры: Спасение стрика за Rewarded Ad
        if (savedStreak >= 3) {
            this.retryButton.innerHTML = tr.saveStreakButton;
            this.retryButton.onclick = (e) => {
                e.stopPropagation();
                this.isPausedForAd = true;
                this.audio.setMuted(true);

                this.yandex.showRewarded(
                    () => {},
                    () => {
                        this.streak = savedStreak;
                        this.streakEl.innerText = `${tr.streak} ×${this.streak}`;
                        this.retryButton.onclick = null;
                        this.retrySameChallenge();
                    },
                    () => {
                        this.isPausedForAd = false;
                        this.audio.setMuted(false);
                    }
                );
            };
        } else {
            this.retryButton.innerHTML = tr.retryButton;
            this.retryButton.onclick = null;

            // Межстраничная реклама с глушением звука и паузой
            this.isPausedForAd = true;
            this.audio.setMuted(true);
            this.yandex.showFullscreen(
                () => {},
                () => {
                    this.isPausedForAd = false;
                    this.audio.setMuted(false);
                }
            );
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

        this.ctx.translate(-this.camera.x, 0);

        // 1. ✅ СТРАТИФИЦИРОВАННЫЙ ВЕТЕР (0 наслоений, чистое разделение слоев)
        this.ctx.save();
        this.ctx.lineCap = 'round';
        const windMag = Math.abs(this.smoothWind);
        const streakScale = Math.min(2.0, Math.max(0.35, windMag / 32));
        const windDir = this.smoothWind >= 0 ? 1 : -1;

        for (const p of this.windParticles) {
            const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
            const currentAlpha = Math.sin(lifeRatio * Math.PI) * p.baseAlpha;

            if (currentAlpha <= 0.01) continue;

            const streakLen = p.len * streakScale;
            this.ctx.strokeStyle = `rgba(56, 189, 248, ${currentAlpha})`;
            this.ctx.lineWidth = 1.6;

            this.ctx.beginPath();
            this.ctx.moveTo(p.x - windDir * streakLen, p.y);
            this.ctx.lineTo(p.x, p.y);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // 2. Платформы
        for (const p of this.platforms) {
            const py = p.y + p.springY;
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
            this.ctx.fillRect(p.x + 2, py + 8, p.width, p.height);

            if (p.id === 'falling-step') {
                this.ctx.fillStyle = p.isFalling ? '#7f1d1d' : '#334155';
            } else {
                this.ctx.fillStyle = p.isRisk ? '#78350f' : '#1e293b';
            }
            this.ctx.fillRect(p.x, py, p.width, p.height);

            let edgeColor = '#64748b';
            if (p.isFinalTarget) edgeColor = p.isRisk ? '#f59e0b' : '#0284c7';
            else if (p.id === 'falling-step') edgeColor = p.isFalling ? '#ef4444' : '#f97316';
            else if (p.id.startsWith('step-') || p.id.startsWith('guardian-')) edgeColor = '#38bdf8';

            this.ctx.fillStyle = edgeColor;
            this.ctx.fillRect(p.x, py, p.width, 3);

            if (p.isFinalTarget) {
                const pw = p.width * 0.35;
                const px = p.x + (p.width - pw) / 2;
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.shadowColor = '#fbbf24';
                this.ctx.shadowBlur = p.isRisk ? 12 : 8;
                this.ctx.fillRect(px, py, pw, 4);
                this.ctx.shadowBlur = 0;
            }

            if (p.isRisk) {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.font = '900 9px sans-serif';
                this.ctx.fillText(this.t.badgeRisk, p.x + p.width / 2 - 27, py + 13);
            } else if (p.id === 'safe') {
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.font = '900 9px sans-serif';
                this.ctx.fillText(this.t.badgeSafe, p.x + p.width / 2 - 24, py + 13);
            } else if (p.id === 'falling-step') {
                this.ctx.fillStyle = '#f97316';
                this.ctx.font = '900 9px sans-serif';
                this.ctx.fillText(this.t.badgeCrack, p.x + p.width / 2 - 17, py + 13);
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
