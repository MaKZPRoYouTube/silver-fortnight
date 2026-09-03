/**
 * EDGEBOUND — VERTICAL SLICE (MOVING PLATFORM + WIND)
 * Фокус: Game Feel, упругая физика, кинематографичный Perfect, Slow-Mo и Mobile-first.
 */

// ============================================================================
// 1. АУДИОДВИЖОК (Web Audio API сочный саунд-дизайн)
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

        // Щелчок/панч
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(460, now + 0.14);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    public playLanding(isPerfect: boolean): void {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Басовый удар веса
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(120, now);
        bassOsc.frequency.exponentialRampToValueAtTime(30, now + 0.18);

        bassGain.gain.setValueAtTime(0.4, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.18);

        if (isPerfect) {
            // Эйфорический трезвучный аккорд
            const freqs = [523.25, 659.25, 783.99, 1046.5]; // C - E - G - C
            freqs.forEach((freq, idx) => {
                const osc = this.ctx!.createOscillator();
                const gain = this.ctx!.createGain();
                osc.type = 'sine';
                const startTime = now + idx * 0.035;
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

                osc.connect(gain);
                gain.connect(this.ctx!.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.45);
            });
        }
    }

    public playFail(): void {
        if (this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
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

    public spawnDust(x: number, y: number, count = 12): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
            const speed = 40 + Math.random() * 90;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.5,
                life: 0.4 + Math.random() * 0.2,
                maxLife: 0.6,
                size: 2 + Math.random() * 3,
                color: '#94a3b8'
            });
        }
    }

    public spawnPerfectBurst(x: number, y: number): void {
        this.shockwaves.push({
            x,
            y,
            radius: 5,
            maxRadius: 75,
            alpha: 1.0,
            color: '#fbbf24'
        });

        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 240;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                life: 0.5 + Math.random() * 0.35,
                maxLife: 0.85,
                size: 3 + Math.random() * 3,
                color: Math.random() > 0.3 ? '#fbbf24' : '#38bdf8'
            });
        }
    }

    public update(dt: number): void {
        // Обновление частиц
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]!;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 400 * dt; // легкая гравитация для частиц
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Обновление колец шоквейва
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const s = this.shockwaves[i]!;
            s.radius += (s.maxRadius - s.radius) * 12 * dt;
            s.alpha -= dt * 2.2;
            if (s.alpha <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }
    }

    public draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        // Рендер шоквейвов
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

        // Рендер частиц
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
// 3. ОСНОВНОЙ КЛАСС ИГРЫ
// ============================================================================
export class GameApp {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private audio = new AudioEngine();
    private vfx = new VFXSystem();

    // Виртуальное разрешение холста
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
    private resultTitle = document.getElementById('result-title')!;
    private resultReward = document.getElementById('result-reward')!;

    // Игровой цикл и прогресс
    private gameState: 'MENU' | 'RUNNING' | 'SUCCESS' | 'FAILED' = 'MENU';
    private streak = 0;
    private score = 0;
    private currentSector = 1;
    private challengeSeed = 42; // Для строгого повтора испытания при ошибке
    private timeScale = 1.0;
    private targetTimeScale = 1.0;
    private time = 0;
    private lastFrameTime = performance.now();

    // Камера и тряска
    private camera = { x: 0, y: 0, zoom: 1.0, targetZoom: 1.0 };
    private shake = 0;

    // Платформы
    private startPlatform = { x: 100, y: 390, width: 140, height: 18, springY: 0 };
    private targetPlatform = {
        x: 520,
        y: 390,
        baseX: 520,
        width: 120,
        height: 18,
        speed: 2.2,
        amplitude: 85,
        springY: 0
    };

    // Ветер
    private wind = { direction: 1, strength: 55, current: 0 };
    private windLines: Array<{ x: number; y: number; len: number; speed: number; alpha: number }> = [];

    // Игрок
    private player = {
        x: 150,
        y: 390 - 42,
        width: 32,
        height: 42,
        vx: 0,
        vy: 0,
        grounded: true,
        scaleX: 1,
        scaleY: 1,
        jumpPower: -580,
        gravity: 1350,
        horizontalSpeed: 330
    };

    constructor() {
        this.canvas = document.getElementById('game') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        this.initResizeObserver();
        this.initWindDecorations();
        this.bindInput();
        this.loadSector(this.currentSector, this.challengeSeed);

        requestAnimationFrame((t) => this.loop(t));
    }

    private initResizeObserver(): void {
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    private initWindDecorations(): void {
        this.windLines = [];
        for (let i = 0; i < 30; i++) {
            this.windLines.push({
                x: Math.random() * this.V_WIDTH,
                y: 80 + Math.random() * 380,
                len: 30 + Math.random() * 80,
                speed: 0.8 + Math.random() * 0.7,
                alpha: 0.08 + Math.random() * 0.16
            });
        }
    }

    private bindInput(): void {
        const doAction = () => {
            if (this.gameState === 'MENU') {
                this.startRound();
            } else if (this.gameState === 'RUNNING') {
                this.jump();
            } else if (this.gameState === 'FAILED') {
                this.retrySameChallenge();
            } else if (this.gameState === 'SUCCESS') {
                this.nextChallenge();
            }
        };

        this.canvas.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            doAction();
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                doAction();
            }
        });

        this.startButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.startRound();
        });

        this.retryButton.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (this.gameState === 'FAILED') {
                this.retrySameChallenge();
            } else {
                this.nextChallenge();
            }
        });
    }

    private startRound(): void {
        this.startPanel.classList.remove('visible');
        this.resultPanel.classList.remove('visible');
        this.gameState = 'RUNNING';
    }

    private jump(): void {
        if (!this.player.grounded) return;

        this.player.grounded = false;
        this.player.vy = this.player.jumpPower;
        // Стретч при взлете
        this.player.scaleX = 0.7;
        this.player.scaleY = 1.35;
        this.audio.playJump();
        this.vfx.spawnDust(this.player.x + this.player.width / 2, this.player.y + this.player.height, 10);
    }

    private loadSector(sector: number, seed: number): void {
        // Простая детерминированная псевдослучайность от seed
        const pseudoRand = Math.sin(seed) * 10000;
        const offset = (pseudoRand - Math.floor(pseudoRand)) * 40 - 20;

        this.objectiveEl.innerText = `SECTOR 0${sector} /// MOVING PLATFORM + WIND`;

        // Ветер меняет силу и вектор в зависимости от сектора
        const isHeadwind = sector % 2 === 0;
        this.wind.direction = isHeadwind ? -1 : 1;
        this.wind.strength = 45 + Math.min(60, sector * 8);

        // Положение движущейся платформы
        this.targetPlatform.baseX = 490 + offset;
        this.targetPlatform.width = Math.max(75, 125 - sector * 5);
        this.targetPlatform.speed = 1.8 + Math.min(1.5, sector * 0.2);
        this.targetPlatform.amplitude = 70 + Math.min(30, sector * 4);

        // Возврат игрока на стартовую платформу
        this.player.x = this.startPlatform.x + (this.startPlatform.width - this.player.width) / 2;
        this.player.y = this.startPlatform.y - this.player.height;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = true;
        this.player.scaleX = 1;
        this.player.scaleY = 1;

        this.targetTimeScale = 1.0;
        this.timeScale = 1.0;
        this.camera.targetZoom = 1.0;
    }

    private retrySameChallenge(): void {
        this.resultPanel.classList.remove('visible');
        this.loadSector(this.currentSector, this.challengeSeed);
        this.gameState = 'RUNNING';
    }

    private nextChallenge(): void {
        this.resultPanel.classList.remove('visible');
        this.currentSector++;
        this.challengeSeed = Date.now(); // Новый вызов
        this.loadSector(this.currentSector, this.challengeSeed);
        this.gameState = 'RUNNING';
    }

    private update(dt: number): void {
        // Плавное слоу-мо
        this.timeScale += (this.targetTimeScale - this.timeScale) * 8 * dt;
        const effectiveDt = dt * this.timeScale;

        this.time += effectiveDt;

        // 1. Обновление ветра
        this.wind.current = this.wind.direction * this.wind.strength * (1 + Math.sin(this.time * 2.5) * 0.18);
        const absWind = Math.abs(this.wind.current);
        this.windArrow.innerText = this.wind.current >= 0 ? '→' : '←';
        this.windFill.style.width = `${Math.min(100, (absWind / 120) * 100)}%`;

        for (const line of this.windLines) {
            line.x += (this.wind.current * 1.8) * line.speed * effectiveDt;
            if (line.x > this.V_WIDTH + 80) line.x = -80;
            if (line.x < -80) line.x = this.V_WIDTH + 80;
        }

        // 2. Движение целевой платформы
        this.targetPlatform.x = this.targetPlatform.baseX + Math.sin(this.time * this.targetPlatform.speed) * this.targetPlatform.amplitude;

        // Пружинящие платформы
        this.startPlatform.springY += (0 - this.startPlatform.springY) * 14 * dt;
        this.targetPlatform.springY += (0 - this.targetPlatform.springY) * 14 * dt;

        // 3. Физика игрока
        if (this.gameState === 'RUNNING' && !this.player.grounded) {
            this.player.vy += this.player.gravity * effectiveDt;
            this.player.vx = this.player.horizontalSpeed + this.wind.current;

            this.player.x += this.player.vx * effectiveDt;
            this.player.y += this.player.vy * effectiveDt;

            // Возврат деформации формы в воздухе
            this.player.scaleX += (1 - this.player.scaleX) * 9 * effectiveDt;
            this.player.scaleY += (1 - this.player.scaleY) * 9 * effectiveDt;

            this.checkCollisions(effectiveDt);

            // Падение в бездну
            if (this.player.y > this.V_HEIGHT + 60) {
                this.onFail();
            }
        }

        // 4. Камера
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 6 * dt;
        if (this.shake > 0) {
            this.shake = Math.max(0, this.shake - dt * 25);
        }

        this.vfx.update(effectiveDt);
    }

    private checkCollisions(dt: number): void {
        if (this.player.vy <= 0) return; // Проверяем только при движении вниз

        const playerBottom = this.player.y + this.player.height;
        const prevBottom = playerBottom - this.player.vy * dt;
        const px = this.player.x;
        const pw = this.player.width;

        const platforms = [
            { p: this.startPlatform, isTarget: false },
            { p: this.targetPlatform, isTarget: true }
        ];

        for (const { p, isTarget } of platforms) {
            const overlapsX = px + pw > p.x && px < p.x + p.width;
            const crossesTop = prevBottom <= p.y + 16 && playerBottom >= p.y;

            if (overlapsX && crossesTop) {
                // Приземление
                this.player.y = p.y - this.player.height;
                this.player.vy = 0;
                this.player.vx = 0;
                this.player.grounded = true;

                // Squash эффект игрока и пружина платформы
                this.player.scaleX = 1.38;
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
        this.gameState = 'SUCCESS';
        const target = this.targetPlatform;
        const playerCenter = this.player.x + this.player.width / 2;
        const targetCenter = target.x + target.width / 2;
        const distFromCenter = Math.abs(playerCenter - targetCenter);

        // Зона Perfect — центральные 32% платформы
        const perfectRadius = (target.width * 0.32) / 2;
        const isPerfect = distFromCenter <= perfectRadius;

        let reward = 100;

        if (isPerfect) {
            this.streak++;
            reward = 200 + this.streak * 50;

            // КИНЕМАТОГРАФИЧНЫЙ СОК (JUICE)
            this.timeScale = 0.15; // Замедление времени
            this.targetTimeScale = 1.0;
            this.camera.targetZoom = 1.08; // Микро-зум
            setTimeout(() => { this.camera.targetZoom = 1.0; }, 320);

            this.shake = 10;
            this.audio.playLanding(true);
            this.vfx.spawnPerfectBurst(playerCenter, target.y);

            this.feedbackEl.innerText = 'PERFECT!';
            this.feedbackEl.style.color = '#fbbf24';
            this.feedbackEl.style.opacity = '1';
            setTimeout(() => { this.feedbackEl.style.opacity = '0'; }, 800);

            this.resultTitle.innerText = 'PERFECT!';
            this.resultTitle.style.color = '#fbbf24';
        } else {
            this.streak = 0;
            reward = 100;
            this.shake = 4;
            this.audio.playLanding(false);
            this.vfx.spawnDust(playerCenter, target.y, 14);

            this.feedbackEl.innerText = 'GOOD';
            this.feedbackEl.style.color = '#38bdf8';
            this.feedbackEl.style.opacity = '1';
            setTimeout(() => { this.feedbackEl.style.opacity = '0'; }, 700);

            this.resultTitle.innerText = 'GOOD LANDING';
            this.resultTitle.style.color = '#38bdf8';
        }

        this.score += reward;
        this.streakEl.innerText = `STREAK ×${this.streak}`;
        this.scoreEl.innerText = String(this.score).padStart(4, '0');
        this.resultReward.innerText = `+${reward} COINS`;
        this.retryButton.innerHTML = `NEXT CHALLENGE <span>↗</span>`;

        setTimeout(() => {
            this.resultPanel.classList.add('visible');
        }, 500);
    }

    private onFail(): void {
        this.gameState = 'FAILED';
        this.streak = 0;
        this.streakEl.innerText = 'STREAK ×0';
        this.shake = 12;
        this.audio.playFail();

        this.feedbackEl.innerText = 'MISSED';
        this.feedbackEl.style.color = '#ef4444';
        this.feedbackEl.style.opacity = '1';
        setTimeout(() => { this.feedbackEl.style.opacity = '0'; }, 700);

        this.resultTitle.innerText = 'VOID FALL';
        this.resultTitle.style.color = '#ef4444';
        this.resultReward.innerText = '+0 COINS';
        this.retryButton.innerHTML = `RETRY SAME <span>↻</span>`;

        setTimeout(() => {
            this.resultPanel.classList.add('visible');
        }, 400);
    }

    private draw(): void {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = this.canvas.getBoundingClientRect();

        // Сброс контекста под текущий размер экрана
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Масштабирование виртуальных 960x540 под реальный canvas
        const scale = Math.min(this.canvas.width / this.V_WIDTH, this.canvas.height / this.V_HEIGHT);
        const offsetX = (this.canvas.width - this.V_WIDTH * scale) / 2;
        const offsetY = (this.canvas.height - this.V_HEIGHT * scale) / 2;

        this.ctx.translate(offsetX, offsetY);
        this.ctx.scale(scale, scale);

        // Тряска и зум камеры
        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Центрированный зум
        if (this.camera.zoom !== 1.0) {
            this.ctx.translate(this.V_WIDTH / 2, this.V_HEIGHT / 2);
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
            this.ctx.translate(-this.V_WIDTH / 2, -this.V_HEIGHT / 2);
        }

        // 1. Нити ветра
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
        const renderPlatform = (p: { x: number; y: number; width: number; height: number; springY: number }, isTarget: boolean) => {
            const py = p.y + p.springY;
            // Тень
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
            this.ctx.fillRect(p.x + 2, py + 8, p.width, p.height);

            // Тело платформы
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(p.x, py, p.width, p.height);

            // Верхняя кромка
            this.ctx.fillStyle = isTarget ? '#0284c7' : '#64748b';
            this.ctx.fillRect(p.x, py, p.width, 3);

            // Зона PERFECT для целевой платформы
            if (isTarget) {
                const perfectW = p.width * 0.32;
                const perfectX = p.x + (p.width - perfectW) / 2;
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.shadowColor = '#fbbf24';
                this.ctx.shadowBlur = 8;
                this.ctx.fillRect(perfectX, py, perfectW, 4);
                this.ctx.shadowBlur = 0;
            }
        };

        renderPlatform(this.startPlatform, false);
        renderPlatform(this.targetPlatform, true);

        // 3. VFX
        this.vfx.draw(this.ctx);

        // 4. Персонаж со Squash & Stretch
        const p = this.player;
        this.ctx.save();
        this.ctx.translate(p.x + p.width / 2, p.y + p.height);
        this.ctx.scale(p.scaleX, p.scaleY);

        // Свечение и тело
        this.ctx.fillStyle = '#38bdf8';
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);
        this.ctx.shadowBlur = 0;

        // Неоновый визор
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(p.width / 2 - 10, -p.height + 8, 6, 6);
        this.ctx.restore();

        this.ctx.restore(); // Сброс камеры
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
