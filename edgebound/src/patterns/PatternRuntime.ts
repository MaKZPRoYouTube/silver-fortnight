import { PatternData, PatternType } from '../core/types';

export type PatternObjectiveType =
  | 'LAND_ON_TARGET'
  | 'LAND_ON_ANY'
  | 'LAND_SEQUENCE'
  | 'CHOOSE_AND_LAND'
  | 'LAND_AND_SURVIVE'
  | 'REACH_GUARDIAN_SEQUENCE';

export interface PatternObjective {
  readonly type: PatternObjectiveType;
  readonly title: string;
  readonly progress: number;
  readonly required: number;
  readonly currentTargetId: string | null;
  readonly completed: boolean;
  readonly failed: boolean;
}

export interface PatternEvent {
  type: 'LANDING' | 'OBJECTIVE_PROGRESS' | 'OBJECTIVE_COMPLETE' | 'OBJECTIVE_FAILED';
  platformId?: string;
  progress?: number;
}

export interface PlatformInstance {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  active: boolean;
  lethalAfter?: number;
}

export interface PatternRuntimeSnapshot {
  type: PatternType;
  platforms: readonly PlatformInstance[];
  targetPlatformId: string;
  completed: boolean;
  failed: boolean;
  objective: PatternObjective;
}

export interface PatternRuntime {
  readonly type: PatternType;
  update(dt: number, elapsed: number): void;
  getPlatforms(): readonly PlatformInstance[];
  getTargetPlatform(): PlatformInstance;
  getObjective(): PatternObjective;
  isComplete(): boolean;
  isFailed(): boolean;
  onPlayerLanded(platformId: string, elapsed: number): PatternEvent[];
  snapshot(): PatternRuntimeSnapshot;
}

function platform(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
): PlatformInstance {
  return { id, x, y, width, height, velocityX: 0, active: true };
}

abstract class BasePatternRuntime implements PatternRuntime {
  abstract readonly type: PatternType;
  protected completed = false;
  protected failed = false;
  protected platforms: PlatformInstance[] = [];
  protected targetPlatformId = 'target';
  protected objective: PatternObjective = {
    type: 'LAND_ON_TARGET',
    title: 'Land on the target',
    progress: 0,
    required: 1,
    currentTargetId: 'target',
    completed: false,
    failed: false,
  };

  update(_dt: number, _elapsed: number): void {}

  getPlatforms(): readonly PlatformInstance[] { return this.platforms; }

  getTargetPlatform(): PlatformInstance {
    const target = this.platforms.find((p) => p.id === this.targetPlatformId && p.active);
    if (!target) throw new Error(`Target platform ${this.targetPlatformId} does not exist or is inactive`);
    return target;
  }

  getObjective(): PatternObjective { return this.objective; }
  isComplete(): boolean { return this.completed; }
  isFailed(): boolean { return this.failed; }

  protected completeObjective(): PatternEvent[] {
    this.completed = true;
    this.objective = { ...this.objective, progress: this.objective.required, completed: true };
    return [{ type: 'OBJECTIVE_COMPLETE', progress: this.objective.required }];
  }

  protected failObjective(): PatternEvent[] {
    this.failed = true;
    this.objective = { ...this.objective, failed: true };
    return [{ type: 'OBJECTIVE_FAILED' }];
  }

  onPlayerLanded(platformId: string, _elapsed: number): PatternEvent[] {
    if (platformId === this.targetPlatformId) return this.completeObjective();
    return [];
  }

  snapshot(): PatternRuntimeSnapshot {
    return {
      type: this.type,
      platforms: this.platforms.map((p) => ({ ...p })),
      targetPlatformId: this.targetPlatformId,
      completed: this.completed,
      failed: this.failed,
      objective: this.objective,
    };
  }
}

class StaticStepRuntime extends BasePatternRuntime {
  readonly type = 'STATIC_STEP' as const;
  constructor(data: PatternData) {
    super();
    this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
    this.objective = { type: 'LAND_ON_TARGET', title: 'Land on the platform', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
  }
}

class MovingPlatformRuntime extends BasePatternRuntime {
  readonly type = 'MOVING_PLATFORM' as const;
  private phase = 0;

  constructor(private readonly data: PatternData) {
    super();

    // Целевая координата (если в data нет targetX, берем со смещением от старта)
    const targetBaseX = data.targetX ?? (data.startX + 260);
    const startPlatformWidth = 120;

    this.platforms = [
      // 1. Стартовая платформа (неподвижная опора под ногами игрока)
      platform('start', data.startX - 30, data.startY ?? data.targetY, startPlatformWidth, data.platformHeight ?? 16),

      // 2. Целевая платформа (которая будет летать)
      platform('target', targetBaseX, data.targetY, data.platformWidth, data.platformHeight ?? 16),
    ];

    this.objective = {
      type: 'LAND_ON_TARGET',
      title: 'Time the moving platform',
      progress: 0,
      required: 1,
      currentTargetId: 'target',
      completed: false,
      failed: false,
    };
  }

  update(dt: number): void {
    this.phase += dt * this.data.speed;
    
    // Ищем целевую платформу по id
    const target = this.platforms.find((p) => p.id === 'target');
    if (!target) return;

    const oldX = target.x;
    const normalized = (Math.sin(this.phase) + 1) / 2;
    
    // Движение целевой платформы вокруг targetX (или дистанции)
    const baseTargetX = this.data.targetX ?? (this.data.startX + 260);
    const range = this.data.distance ?? 100;
    const nextX = baseTargetX + (normalized - 0.5) * range * 2;

    target.x = nextX;
    target.velocityX = (nextX - oldX) / Math.max(dt, 1e-6);
  }
}

class NarrowGateRuntime extends BasePatternRuntime {
  readonly type = 'NARROW_GATE' as const;
  constructor(data: PatternData) {
    super();
    this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
    this.objective = { type: 'LAND_ON_TARGET', title: 'Hit the narrow gate', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
  }
}

class DoubleStepRuntime extends BasePatternRuntime {
  readonly type = 'DOUBLE_STEP' as const;
  private currentStep = 0;

  constructor(data: PatternData) {
    super();
    const count = Math.max(2, data.stepCount);
    for (let i = 0; i < count; i++) {
      this.platforms.push(platform(`step-${i}`, data.targetX + i * data.gapBetweenSteps, data.targetY - i * 35, data.platformWidth, data.platformHeight));
    }
    this.targetPlatformId = 'step-0';
    this.objective = {
      type: 'LAND_SEQUENCE',
      title: `Reach all ${count} steps`,
      progress: 0,
      required: count,
      currentTargetId: this.targetPlatformId,
      completed: false,
      failed: false,
    };
  }

  onPlayerLanded(platformId: string): PatternEvent[] {
    const expected = this.platforms[this.currentStep];
    if (!expected || platformId !== expected.id) return [];
    this.currentStep++;
    if (this.currentStep >= this.platforms.length) return this.completeObjective();
    this.targetPlatformId = this.platforms[this.currentStep]!.id;
    this.objective = { ...this.objective, progress: this.currentStep, currentTargetId: this.targetPlatformId };
    return [
      { type: 'LANDING', platformId },
      { type: 'OBJECTIVE_PROGRESS', platformId, progress: this.currentStep },
    ];
  }
}

class RiskSplitRuntime extends BasePatternRuntime {
  readonly type = 'RISK_SPLIT' as const;
  private chosen: 'safe' | 'risk' | null = null;

  constructor(data: PatternData) {
    super();
    const safeWidth = data.platformWidth * 1.15;
    const riskWidth = data.platformWidth * 0.72;
    this.platforms = [
      platform('safe', data.targetX - 80, data.targetY + 20, safeWidth, data.platformHeight),
      platform('risk', data.targetX + 85, data.targetY - 5, riskWidth, data.platformHeight),
    ];
    this.targetPlatformId = 'safe';
    this.objective = { type: 'CHOOSE_AND_LAND', title: 'Choose your line', progress: 0, required: 1, currentTargetId: null, completed: false, failed: false };
  }

  getTargetPlatform(): PlatformInstance {
    // Steering points between both choices until the player commits by landing.
    const safe = this.platforms[0]!;
    const risk = this.platforms[1]!;
    if (!this.chosen) {
      return {
        id: 'choice',
        x: (safe.x + risk.x) / 2,
        y: Math.min(safe.y, risk.y),
        width: Math.abs(risk.x - safe.x) + risk.width,
        height: Math.max(safe.height, risk.height),
        velocityX: 0,
        active: true,
      };
    }
    return this.platforms.find((p) => p.id === this.chosen)!;
  }

  onPlayerLanded(platformId: string): PatternEvent[] {
    if (platformId !== 'safe' && platformId !== 'risk') return [];
    this.chosen = platformId;
    this.targetPlatformId = platformId;
    return this.completeObjective();
  }
}

class FallingPlatformRuntime extends BasePatternRuntime {
  readonly type = 'FALLING_PLATFORM' as const;
  private landedAt: number | null = null;
  private readonly survivalTime = 0.75;
  private readonly baseY: number;

  constructor(private readonly data: PatternData) {
    super();
    this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
    this.baseY = data.targetY;
    this.objective = { type: 'LAND_AND_SURVIVE', title: 'Land and stay on it', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
  }

  update(_dt: number, elapsed: number): void {
    const target = this.platforms[0];
    if (!target || this.landedAt === null || !target.active || this.completed) return;
    const age = elapsed - this.landedAt;
    target.y = this.baseY + age * 180;
    if (age >= this.survivalTime) this.completeObjective();
    if (age > this.survivalTime + 0.2) {
      target.active = false;
      this.failed = true;
      this.objective = { ...this.objective, failed: true };
    }
  }

  onPlayerLanded(platformId: string, elapsed: number): PatternEvent[] {
    if (platformId !== 'target' || this.landedAt !== null) return [];
    this.landedAt = elapsed;
    this.objective = { ...this.objective, progress: 0.5 };
    return [
      { type: 'LANDING', platformId },
      { type: 'OBJECTIVE_PROGRESS', platformId, progress: 0.5 },
    ];
  }
}

class WindCorridorRuntime extends BasePatternRuntime {
  readonly type = 'WIND_CORRIDOR' as const;
  constructor(data: PatternData) {
    super();
    this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
    this.objective = { type: 'LAND_ON_TARGET', title: 'Cross the wind corridor', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
  }
}

class GuardianSequenceRuntime extends BasePatternRuntime {
  readonly type = 'GUARDIAN_SEQUENCE' as const;
  private currentStep = 0;

  constructor(data: PatternData) {
    super();
    const count = Math.max(3, data.stepCount);
    for (let i = 0; i < count; i++) {
      this.platforms.push(platform(`guardian-${i}`, data.targetX + i * data.gapBetweenSteps, data.targetY - i * 40, data.platformWidth, data.platformHeight));
    }
    this.targetPlatformId = 'guardian-0';
    this.objective = { type: 'REACH_GUARDIAN_SEQUENCE', title: `Defeat the guardian sequence`, progress: 0, required: count, currentTargetId: 'guardian-0', completed: false, failed: false };
  }

  onPlayerLanded(platformId: string): PatternEvent[] {
    const expected = this.platforms[this.currentStep];
    if (!expected || platformId !== expected.id) return [];
    this.currentStep++;
    if (this.currentStep >= this.platforms.length) return this.completeObjective();
    this.targetPlatformId = this.platforms[this.currentStep]!.id;
    this.objective = { ...this.objective, progress: this.currentStep, currentTargetId: this.targetPlatformId };
    return [
      { type: 'LANDING', platformId },
      { type: 'OBJECTIVE_PROGRESS', platformId, progress: this.currentStep },
    ];
  }
}

export function spawnPattern(data: PatternData): PatternRuntime {
  switch (data.type) {
    case 'STATIC_STEP': return new StaticStepRuntime(data);
    case 'MOVING_PLATFORM': return new MovingPlatformRuntime(data);
    case 'NARROW_GATE': return new NarrowGateRuntime(data);
    case 'DOUBLE_STEP': return new DoubleStepRuntime(data);
    case 'RISK_SPLIT': return new RiskSplitRuntime(data);
    case 'FALLING_PLATFORM': return new FallingPlatformRuntime(data);
    case 'WIND_CORRIDOR': return new WindCorridorRuntime(data);
    case 'GUARDIAN_SEQUENCE': return new GuardianSequenceRuntime(data);
  }
}
