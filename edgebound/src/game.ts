/**
 * EDGEBOUND — MASTER PRODUCTION ENGINE
 * Все 8 паттернов + 24 Сектора Кампании + Магазин Скинов + Jump Trail + Cloud Save
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

    public playCollapse(): void {
        if (this.isMuted || !this.ctx) return;
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
// 2. МОСТ ЯНДЕКС ИГР И ОБЛАЧНЫЕ СОХРАНЕНИЯ
// ============================================================================
class YandexBridge {
    private ysdk: any = null;
    private player: any = null;
    private lastAdTime = 0;

    public async init(onLoadedData?: (data: any) => void): Promise<void> {
        const isInsideIframe = window.parent !== window;
        if ((window as any).YaGames && isInsideIframe) {
            try {
                this.ysdk = await (window as any).YaGames.init();
                this.ysdk.features.LoadingAPI?.ready();
                try {
                    this.player = await this.ysdk.getPlayer({ scopes: false });
                    const cloudData = await this.player.getData();
                    if (cloudData && Object.keys(cloudData).length > 0) {
                        onLoadedData?.(cloudData);
                    }
                } catch (err) {}
                console.log('✅ Yandex Games SDK подключен!');
            } catch (e) {
                console.warn('⚠️ Яндекс SDK fallback', e);
            }
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
            onRewarded();
            onDismiss?.();
        }
    }

    public saveToCloud(data: any): void {
        if (this.player) {
            try {
                this.player.setData(data, true);
            } catch (e) {}
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

    public spawnDust(x: number, y: number, count = 10, color = '#94a3b8'): void {
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
                color
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

    public spawnPerfectBurst(x: number, y: number, color = '#fbbf24'): void {
        this.shockwaves.push({
            x, y,
            radius: 6,
            maxRadius: 85,
            alpha: 1.0,
            color
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
                color: Math.random() > 0.3 ? color : '#38bdf8'
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
// 4. КАТАЛОГ СКИНОВ (Мета-прогрессия)
// ============================================================================
export interface SkinDef {
    id: string;
    name: string;
    price: number;
    primaryColor: string;
    glowColor: string;
    eyeColor: string;
    trailColor: string;
}

export const SKINS: SkinDef[] = [
    {
        id: 'cyan',
        name: 'CYAN CORE',
        price: 0,
        primaryColor: '#38bdf8',
        glowColor: '#0284c7',
        eyeColor: '#ffffff',
        trailColor: 'rgba(56, 189, 248, 0.4)'
    },
    {
        id: 'magenta',
        name: 'NEON PULSE',
        price: 400,
        primaryColor: '#ec4899',
        glowColor: '#be185d',
        eyeColor: '#fdf2f8',
        trailColor: 'rgba(236, 72, 153, 0.4)'
    },
    {
        id: 'gold',
        name: 'SOLAR GOLD',
        price: 1000,
        primaryColor: '#fbbf24',
        glowColor: '#d97706',
        eyeColor: '#fffbeb',
        trailColor: 'rgba(251, 191, 36, 0.4)'
    },
    {
        id: 'matrix',
        name: 'EMERALD GLITCH',
        price: 2000,
        primaryColor: '#10b981',
        glowColor: '#047857',
        eyeColor: '#ecfdf5',
        trailColor: 'rgba(16, 185, 129, 0.4)'
    },
    {
        id: 'void',
        name: 'VOID REAPER',
        price: 3500,
        primaryColor: '#e11d48',
        glowColor: '#881337',
        eyeColor: '#ffe4e6',
        trailColor: 'rgba(225, 29, 72, 0.45)'
    }
];

// ============================================================================
// 5. ТИПЫ ПАТТЕРНОВ И СЦЕНЫ
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

interface WindStream {
    x: number;
    y: number;
    lane: number;
    alpha: number;
}

interface TrailPoint {
    x: number;
    y: number;
    alpha: number;
    scaleX: number;
    scaleY: number;
}

type GameState = 'MENU' | 'RUNNING' | 'LANDED_TRANSITION' | 'RESULT_SUCCESS' | 'RESULT_FAILED' | 'SHOP';

// ============================================================================
// 6. ГЛАВНОЕ ПРИЛОЖЕНИЕ
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
    private victoryPanel = document.getElementById('victory-panel')!;
    private shopPanel = document.getElementById('shop-panel')!;
    private startButton = document.getElementById('start-button')!;
    private retryButton = document.getElementById('retry-button')!;
    private endlessButton = document.getElementById('endless-button')!;
    private shopButton = document.getElementById('shop-btn')!;
    private closeShopButton = document.getElementById('close-shop-btn')!;
    private shopCoinsDisplay = document.getElementById('shop-coins-display')!;
    private skinsGrid = document.getElementById('skins-grid')!;
    private feedbackEl = document.getElementById('feedback')!;
    private resultKicker = document.getElementById('result-kicker')!;
    private resultTitle = document.getElementById('result-title')!;
    private resultReward = document.getElementById('result-reward')!;

    // FSM
    private gameState: GameState = 'MENU';
    private previousState: GameState = 'MENU';
    private isTransitioning: boolean = false;

    // Прогресс и экономика
    private streak = 0;
    private maxStreak = 0;
    private score = 0;
    private coins = 0;
    private currentSector = 1;
    private currentSeed = 1001;
    private isEndlessMode = false;

    // Скины
    private unlockedSkins: string[] = ['cyan'];
    private equippedSkinId: string = 'cyan';

    // Рантайм
    private sectorTime = 0;
    private timeScale = 1.0;
    private targetTimeScale = 1.0;
    private lastFrameTime = performance.now();
    private feedbackTimeout: number | null = null;

    // Камера и шлейф
    private camera = { x: 0, targetX: 0, zoom: 1.0, targetZoom: 1.0 };
    private shake = 0;
    private jumpTrail: TrailPoint[] = [];

    // Физика
    private readonly GRAVITY = 1250;
    private readonly JUMP_POWER = -560;
    private readonly AIRTIME = (2 * 560) / 1250;
    private readonly HORIZONTAL_SPEED = 340;

    // Сцена
    private currentPattern: PatternType = 'STATIC_STEP';
    private platforms: Platform[] = [];
    private stepProgress = 0;
    private stepTotal = 1;

    private attachedPlatform: Platform | null = null;
    private platformOffsetX = 0;

    // Ветер
    private wind = { direction: 1, strength: 0, current: 0 };
    private smoothWind = 0;
    private windStreams: WindStream[] = [];

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

        this.loadSaveData();
        this.initResize();
        this.initWindLanes();
        this.bindEvents();

        this.yandex.init((cloudData) => {
            this.applyLoadedData(cloudData);
        });

        this.loadSector(this.currentSector, this.currentSeed);
        requestAnimationFrame((t) => this.loop(t));
    }

    private loadSaveData(): void {
        try {
            const local = localStorage.getItem('edgebound_save');
            if (local) {
                const data = JSON.parse(local);
                this.applyLoadedData(data);
            }
        } catch (e) {}
    }

    private applyLoadedData(data: any): void {
        if (data.coins !== undefined) this.coins = data.coins;
        if (data.score !== undefined) this.score = data.score;
        if (data.maxStreak !== undefined) this.maxStreak = data.maxStreak;
        if (data.unlockedSkins) this.unlockedSkins = data.unlockedSkins;
        if (data.equippedSkinId) this.equippedSkinId = data.equippedSkinId;
        this.updateHUD();
    }

    private saveGame(): void {
        const data = {
            coins: this.coins,
            score: this.score,
            maxStreak: this.maxStreak,
            unlockedSkins: this.unlockedSkins,
            equippedSkinId: this.equippedSkinId
        };
        try {
            localStorage.setItem('edgebound_save', JSON.stringify(data));
        } catch (e) {}
        this.yandex.saveToCloud(data);
    }

    private get currentSkin(): SkinDef {
        const s = SKINS.find((sk) => sk.id === this.equippedSkinId);
        return s || SKINS[0]!;
    }

    private updateHUD(): void {
        this.streakEl.innerText = `STREAK ×${this.streak}`;
        this.scoreEl.innerText = String(this.coins).padStart(4, '0');
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

    private initWindLanes(): void {
        this.windStreams = [];
        const numLanes = 14;
        for (let lane = 0; lane < numLanes; lane++) {
            const laneY = 70 + lane * 26;
            for (let p = 0; p < 2; p++) {
                this.windStreams.push({
                    x: (p * 480 + lane * 55) % (this.V_WIDTH + 200) - 100,
                    y: laneY,
                    lane,
                    alpha: 0.08 + Math.random() * 0.12
                });
            }
        }
    }

    private handleAction(): void {
        if (this.isTransitioning || this.gameState === 'SHOP') return;

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

        this.endlessButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.victoryPanel.classList.remove('visible');
            this.isEndlessMode = true;
            this.nextChallenge();
        });

        // Открытие магазина скинов
        this.shopButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.openShop();
        });

        this.closeShopButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.closeShop();
        });
    }

    private openShop(): void {
        this.previousState = this.gameState;
        this.gameState = 'SHOP';
        this.renderShop();
        this.shopPanel.classList.add('visible');
    }

    private closeShop(): void {
        this.shopPanel.classList.remove('visible');
        this.gameState = this.previousState;
    }

    private renderShop(): void {
        this.shopCoinsDisplay.innerText = `COINS: ${this.coins}`;
        this.skinsGrid.innerHTML = '';

        for (const skin of SKINS) {
            const isOwned = this.unlockedSkins.includes(skin.id);
            const isEquipped = this.equippedSkinId === skin.id;

            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'equipped' : ''}`;

            card.innerHTML = `
                <div class="skin-preview" style="background: ${skin.primaryColor}; box-shadow: 0 0 10px ${skin.glowColor}">
                    <div class="skin-preview-eye"></div>
                </div>
                <div class="skin-name" style="color: ${skin.primaryColor}">${skin.name}</div>
            `;

            const actionBtn = document.createElement('button');
            actionBtn.className = 'skin-action-btn';

            if (isEquipped) {
                actionBtn.classList.add('active');
                actionBtn.innerText = 'EQUIPPED';
            } else if (isOwned) {
                actionBtn.classList.add('owned');
                actionBtn.innerText = 'EQUIP';
                actionBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.equippedSkinId = skin.id;
                    this.saveGame();
                    this.renderShop();
                };
            } else {
                actionBtn.innerText = `${skin.price} ◈`;
                if (this.coins < skin.price) {
                    actionBtn.style.opacity = '0.5';
                    actionBtn.style.cursor = 'not-allowed';
                } else {
                    actionBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.coins -= skin.price;
                        this.unlockedSkins.push(skin.id);
                        this.equippedSkinId = skin.id;
                        this.saveGame();
                        this.updateHUD();
                        this.renderShop();
                    };
                }
            }

            card.appendChild(actionBtn);
            this.skinsGrid.appendChild(card);
        }
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
        this.vfx.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10, this.currentSkin.primaryColor);
    }

    private getPatternForSector(sec: number): { type: PatternType; title: string } {
        const campaignMap: Record<number, { type: PatternType; title: string }> = {
            1: { type: 'STATIC_STEP', title: 'SECTOR 01 /// WELCOME: TAP TO JUMP' },
            2: { type: 'STATIC_STEP', title: 'SECTOR 02 /// GENTLE BREEZE' },
            3: { type: 'MOVING_PLATFORM', title: 'SECTOR 03 /// SLOW MOVING TARGET' },
            4: { type: 'STATIC_STEP', title: 'SECTOR 04 /// HEADWIND CHECK' },

            5: { type: 'MOVING_PLATFORM', title: 'SECTOR 05 /// WAIT FOR THE TIMING!' },
            6: { type: 'NARROW_GATE', title: 'SECTOR 06 /// NARROW PRECISION' },
            7: { type: 'MOVING_PLATFORM', title: 'SECTOR 07 /// HEADWIND DRIFT' },
            8: { type: 'DOUBLE_STEP', title: 'SECTOR 08 /// DOUBLE RHYTHM' },

            9: { type: 'WIND_CORRIDOR', title: 'SECTOR 09 /// WIND STORM' },
            10: { type: 'NARROW_GATE', title: 'SECTOR 10 /// NEEDLE EYE' },
            11: { type: 'RISK_SPLIT', title: 'SECTOR 11 /// RISK OR REWARD' },
            12: { type: 'FALLING_PLATFORM', title: 'SECTOR 12 /// COLLAPSING LEDGE' },

            13: { type: 'DOUBLE_STEP', title: 'SECTOR 13 /// TWIN STEPS (MOVING)' },
            14: { type: 'WIND_CORRIDOR', title: 'SECTOR 14 /// GALE RESISTANCE' },
            15: { type: 'MOVING_PLATFORM', title: 'SECTOR 15 /// HYPER VELOCITY' },
            16: { type: 'RISK_SPLIT', title: 'SECTOR 16 /// GREED TEST' },
            17: { type: 'NARROW_GATE', title: 'SECTOR 17 /// MOVING NEEDLE' },
            18: { type: 'DOUBLE_STEP', title: 'SECTOR 18 /// CASCADE RHYTHM' },

            19: { type: 'FALLING_PLATFORM', title: 'SECTOR 19 /// HURRICANE COLLAPSE' },
            20: { type: 'WIND_CORRIDOR', title: 'SECTOR 20 /// HURRICANE' },
            21: { type: 'RISK_SPLIT', title: 'SECTOR 21 /// DANGER & GLORY' },
            22: { type: 'NARROW_GATE', title: 'SECTOR 22 /// ZERO MARGIN (32PX)' },

            23: { type: 'GUARDIAN_SEQUENCE', title: 'SECTOR 23 /// GUARDIAN GATE (MINI-BOSS)' },
            24: { type: 'GUARDIAN_SEQUENCE', title: 'SECTOR 24 /// THE CORE (CLIMAX)' }
        };

        if (sec <= 24 && campaignMap[sec]) {
            return campaignMap[sec]!;
        }

        const endlessPatterns: PatternType[] = [
            'MOVING_PLATFORM', 'NARROW_GATE', 'DOUBLE_STEP', 'RISK_SPLIT', 'FALLING_PLATFORM', 'WIND_CORRIDOR', 'GUARDIAN_SEQUENCE'
        ];
        const pType = endlessPatterns[(sec - 25) % endlessPatterns.length]!;
        return { type: pType, title: `SECTOR ${sec} /// MASTER ENDLESS [${pType}]` };
    }

    private loadSector(sector: number, seed: number): void {
        const { type, title } = this.getPatternForSector(sector);
        this.currentPattern = type;
        this.objectiveEl.innerText = title;

        this.sectorTime = 0;
        this.jumpTrail = [];

        const tier = Math.min(5, Math.floor((sector - 1) / 4));

        // Ветер
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
        this.sectorTime += effectiveDt;

        // Восстановление формы
        const shapeRecoveryDt = Math.max(effectiveDt, dt * 0.45);
        this.player.scaleX += (1 - this.player.scaleX) * 12 * shapeRecoveryDt;
        this.player.scaleY += (1 - this.player.scaleY) * 12 * shapeRecoveryDt;

        // Ветер
        this.wind.current = this.wind.direction * this.wind.strength * (1 + Math.sin(this.sectorTime * 2.2) * 0.12);
        this.smoothWind += (this.wind.current - this.smoothWind) * 4 * effectiveDt;

        const absWind = Math.abs(this.smoothWind);
        this.windArrow.innerText = this.smoothWind >= 0 ? '→' : '←';
        this.windFill.style.width = `${Math.min(100, Math.max(15, (absWind / 65) * 100))}%`;

        // Ветер на фиксированных дорожках (Lanes)
        const flowVelocity = this.smoothWind * 2.0 * effectiveDt;
        const wrapBounds = this.V_WIDTH + 160;

        for (const stream of this.windStreams) {
            stream.x += flowVelocity;
            if (stream.x > this.camera.x + this.V_WIDTH + 80) {
                stream.x -= wrapBounds;
            } else if (stream.x < this.camera.x - 80) {
                stream.x += wrapBounds;
            }
        }

        // Обновление платформ
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

        // Позиция игрока и запись шлейфа (Jump Trail)
        if (this.player.grounded && this.attachedPlatform) {
            this.player.x = this.attachedPlatform.x + this.platformOffsetX;
            this.player.y = this.attachedPlatform.y + this.attachedPlatform.springY - this.player.height;
        } else if (this.gameState === 'RUNNING' && !this.player.grounded) {
            this.player.vy += this.GRAVITY * effectiveDt;
            this.player.vx = this.HORIZONTAL_SPEED + this.smoothWind;

            this.player.x += this.player.vx * effectiveDt;
            this.player.y += this.player.vy * effectiveDt;

            // Добавляем точку шлейфа
            this.jumpTrail.push({
                x: this.player.x,
                y: this.player.y,
                alpha: 0.65,
                scaleX: this.player.scaleX,
                scaleY: this.player.scaleY
            });

            this.checkCollisions(effectiveDt);

            if (this.player.y > this.V_HEIGHT + 60) {
                this.onFail();
            }
        }

        // Затухание шлейфа
        for (let i = this.jumpTrail.length - 1; i >= 0; i--) {
            const pt = this.jumpTrail[i]!;
            pt.alpha -= effectiveDt * 3.5;
            if (pt.alpha <= 0) {
                this.jumpTrail.splice(i, 1);
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
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 10, '#f97316');
                    this.showFeedback('JUMP! IT FALLS!', '#f97316');
                } else if (p.id.startsWith('step-') || p.id.startsWith('guardian-')) {
                    this.stepProgress++;
                    this.audio.playStep();
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 8, this.currentSkin.primaryColor);
                    this.showFeedback(`STEP ${this.stepProgress}/${this.stepTotal}`, '#38bdf8');
                } else {
                    this.audio.playLanding(false);
                    this.vfx.spawnDust(this.player.x + pw / 2, p.y, 8, this.currentSkin.primaryColor);
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
        if (target.isRisk) reward = 250;

        if (isPerfect) {
            this.streak++;
            if (this.streak > this.maxStreak) {
                this.maxStreak = this.streak;
            }
            reward = (target.isRisk ? 350 : 200) + (this.streak - 1) * 50;

            this.timeScale = 0.18;
            this.targetTimeScale = 1.0;
            this.camera.targetZoom = 1.08;
            setTimeout(() => { this.camera.targetZoom = 1.0; }, 300);

            this.shake = 9;
            this.audio.playLanding(true);
            this.vfx.spawnPerfectBurst(playerCenter, target.y, this.currentSkin.primaryColor);
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
            this.vfx.spawnDust(playerCenter, target.y, 12, this.currentSkin.primaryColor);
            this.showFeedback(target.isRisk ? 'RISK TAKEN' : 'GOOD', '#38bdf8');

            this.resultKicker.innerText = 'LANDING CONFIRMED';
            this.resultKicker.style.color = '#64748b';
            this.resultTitle.innerText = target.isRisk ? 'RISK TAKEN!' : 'GOOD LANDING';
            this.resultTitle.style.color = '#38bdf8';
            this.resultReward.innerText = `+${reward} COINS`;
        }

        this.coins += reward;
        this.score += reward;
        this.saveGame();
        this.updateHUD();
        this.yandex.submitScore(this.maxStreak, this.coins);

        // Проверка победы в кампании (Сектор 24)
        if (this.currentSector === 24 && !this.isEndlessMode) {
            setTimeout(() => {
                this.clearFeedback();
                this.coins += 1000;
                this.saveGame();
                this.updateHUD();
                this.victoryPanel.classList.add('visible');
            }, 500);
            return;
        }

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
        this.updateHUD();
        this.shake = 12;
        this.audio.playFail();
        this.showFeedback('MISSED', '#ef4444');

        this.resultKicker.innerText = `SECTOR 0${this.currentSector}`;
        this.resultKicker.style.color = '#64748b';
        this.resultTitle.innerText = 'RUN FAILED';
        this.resultTitle.style.color = '#ef4444';
        this.resultReward.innerText = '+0 COINS';

        if (savedStreak >= 3) {
            this.retryButton.innerHTML = `★ SAVE STREAK (AD) ★`;
            this.retryButton.onclick = (e) => {
                e.stopPropagation();
                this.yandex.showRewarded(() => {
                    this.streak = savedStreak;
                    this.updateHUD();
                    this.retryButton.onclick = null;
                    this.retrySameChallenge();
                });
            };
        } else {
            this.retryButton.innerHTML = `TRY AGAIN <span>↻</span>`;
            this.retryButton.onclick = null;
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

        this.ctx.translate(-this.camera.x, 0);

        // 1. Потоки ветра
        this.ctx.save();
        this.ctx.lineCap = 'round';
        const streakLen = Math.min(75, Math.max(8, Math.abs(this.smoothWind) * 1.4));
        const windDir = this.smoothWind >= 0 ? 1 : -1;

        for (const s of this.windStreams) {
            this.ctx.strokeStyle = `rgba(56, 189, 248, ${s.alpha})`;
            this.ctx.lineWidth = 1.8;
            this.ctx.beginPath();
            this.ctx.moveTo(s.x - windDir * streakLen, s.y);
            this.ctx.lineTo(s.x, s.y);
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
                this.ctx.fillText('★ RISK +250', p.x + p.width / 2 - 27, py + 13);
            } else if (p.id === 'safe') {
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.font = '900 9px sans-serif';
                this.ctx.fillText('SAFE +100', p.x + p.width / 2 - 24, py + 13);
            } else if (p.id === 'falling-step') {
                this.ctx.fillStyle = '#f97316';
                this.ctx.font = '900 9px sans-serif';
                this.ctx.fillText('CRACK', p.x + p.width / 2 - 17, py + 13);
            }
        }

        // 3. VFX
        this.vfx.draw(this.ctx);

        // 4. Неоновый Jump Trail (Шлейф за кубиком)
        const skin = this.currentSkin;
        for (const pt of this.jumpTrail) {
            this.ctx.save();
            this.ctx.translate(pt.x + this.player.width / 2, pt.y + this.player.height);
            this.ctx.scale(pt.scaleX, pt.scaleY);
            this.ctx.fillStyle = skin.trailColor;
            this.ctx.globalAlpha = Math.max(0, pt.alpha);
            this.ctx.fillRect(-this.player.width / 2, -this.player.height, this.player.width, this.player.height);
            this.ctx.restore();
        }

        // 5. Персонаж с экипированным скином
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x + p.width / 2, p.y + p.height);
        this.ctx.scale(p.scaleX, p.scaleY);

        this.ctx.fillStyle = skin.primaryColor;
        this.ctx.shadowColor = skin.glowColor;
        this.ctx.shadowBlur = 14;
        this.ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);
        this.ctx.shadowBlur = 0;

        // Глаз
        this.ctx.fillStyle = skin.eyeColor;
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
