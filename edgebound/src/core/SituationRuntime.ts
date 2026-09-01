export interface Platform {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    active: boolean;
    isTarget: boolean;
    velocityX?: number;
    velocityY?: number;
}

export interface PatternData {
    type: 'STATIC_STEP' | 'MOVING_PLATFORM' | 'FALLING_PLATFORM' | string;
    startX: number;
    startY: number;
    targetX?: number;
    targetY: number;
    platformWidth?: number;
    perfectWidth?: number;
    speed?: number;
    range?: number;
}

export interface PatternRuntime {
    platforms: Platform[];
    getPlatforms(): Platform[];
    getTargetPlatform(): Platform;
    update(dt: number, time: number): void;
    onPlayerLanded(platformId: string, time?: number): void;
    isComplete(): boolean;
    isFailed(): boolean;
}

function createPlatform(id: string, x: number, y: number, width: number, height: number = 16, isTarget: boolean = false): Platform {
    return { id, x, y, width, height, active: true, isTarget, velocityX: 0, velocityY: 0 };
}

// 1. STATIC_STEP: Старт слева + Цель справа (неподвижная)
export class StaticStepRuntime implements PatternRuntime {
    public platforms: Platform[];
    private completed: boolean = false;

    constructor(public readonly data: PatternData) {
        const startX = data.startX ?? 120;
        const targetX = data.targetX ?? 420;

        this.platforms = [
            createPlatform('start', startX, data.startY, 120, 16, false),
            createPlatform('target', targetX, data.targetY, data.platformWidth ?? 110, 16, true)
        ];
    }

    public update(_dt: number, _time: number): void {}
    public getPlatforms(): Platform[] { return this.platforms; }
    public getTargetPlatform(): Platform { return this.platforms.find(p => p.isTarget) ?? this.platforms[1]; }
    public onPlayerLanded(id: string): void { if (id === 'target') this.completed = true; }
    public isComplete(): boolean { return this.completed; }
    public isFailed(): boolean { return false; }
}

// 2. MOVING_PLATFORM: Старт слева + Цель справа (летает влево-вправо)
export class MovingPlatformRuntime implements PatternRuntime {
    public platforms: Platform[];
    private phase: number = 0;
    private baseTargetX: number;
    private completed: boolean = false;

    constructor(public readonly data: PatternData) {
        const startX = data.startX ?? 120;
        this.baseTargetX = data.targetX ?? 420;

        this.platforms = [
            createPlatform('start', startX, data.startY, 120, 16, false),
            createPlatform('target', this.baseTargetX, data.targetY, data.platformWidth ?? 100, 16, true)
        ];
    }

    public update(dt: number, _time: number): void {
        this.phase += dt * (this.data.speed ?? 1.8);
        const target = this.platforms.find(p => p.isTarget);
        if (!target) return;

        const range = this.data.range ?? 65;
        const oldX = target.x;
        target.x = this.baseTargetX + Math.sin(this.phase) * range;
        target.velocityX = (target.x - oldX) / dt;
    }

    public getPlatforms(): Platform[] { return this.platforms; }
    public getTargetPlatform(): Platform { return this.platforms.find(p => p.isTarget) ?? this.platforms[1]; }
    public onPlayerLanded(id: string): void { if (id === 'target') this.completed = true; }
    public isComplete(): boolean { return this.completed; }
    public isFailed(): boolean { return false; }
}

// 3. FALLING_PLATFORM: Старт слева + Цель справа (падает после посадки)
export class FallingPlatformRuntime implements PatternRuntime {
    public platforms: Platform[];
    private isFalling: boolean = false;
    private fallSpeed: number = 0;
    private completed: boolean = false;

    constructor(public readonly data: PatternData) {
        const startX = data.startX ?? 120;
        const targetX = data.targetX ?? 400;

        this.platforms = [
            createPlatform('start', startX, data.startY, 120, 16, false),
            createPlatform('target', targetX, data.targetY, data.platformWidth ?? 110, 16, true)
        ];
    }

    public update(dt: number, _time: number): void {
        if (this.isFalling) {
            this.fallSpeed += 900 * dt;
            const target = this.platforms.find(p => p.isTarget);
            if (target) target.y += this.fallSpeed * dt;
        }
    }

    public getPlatforms(): Platform[] { return this.platforms; }
    public getTargetPlatform(): Platform { return this.platforms.find(p => p.isTarget) ?? this.platforms[1]; }
    public onPlayerLanded(id: string): void {
        if (id === 'target') {
            this.isFalling = true;
            this.completed = true;
        }
    }
    public isComplete(): boolean { return this.completed; }
    public isFailed(): boolean { return false; }
}

// Фабрика спавна
export function spawnPattern(data: PatternData): PatternRuntime {
    switch (data.type) {
        case 'MOVING_PLATFORM': return new MovingPlatformRuntime(data);
        case 'FALLING_PLATFORM': return new FallingPlatformRuntime(data);
        case 'STATIC_STEP':
        default:
            return new StaticStepRuntime(data);
    }
}
