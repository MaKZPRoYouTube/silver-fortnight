function platform(id, x, y, width, height) {
    return { id, x, y, width, height, velocityX: 0, active: true };
}
class BasePatternRuntime {
    completed = false;
    failed = false;
    platforms = [];
    targetPlatformId = 'target';
    objective = {
        type: 'LAND_ON_TARGET',
        title: 'Land on the target',
        progress: 0,
        required: 1,
        currentTargetId: 'target',
        completed: false,
        failed: false,
    };
    update(_dt, _elapsed) { }
    getPlatforms() { return this.platforms; }
    getTargetPlatform() {
        const target = this.platforms.find((p) => p.id === this.targetPlatformId && p.active);
        if (!target)
            throw new Error(`Target platform ${this.targetPlatformId} does not exist or is inactive`);
        return target;
    }
    getObjective() { return this.objective; }
    isComplete() { return this.completed; }
    isFailed() { return this.failed; }
    completeObjective() {
        this.completed = true;
        this.objective = { ...this.objective, progress: this.objective.required, completed: true };
        return [{ type: 'OBJECTIVE_COMPLETE', progress: this.objective.required }];
    }
    failObjective() {
        this.failed = true;
        this.objective = { ...this.objective, failed: true };
        return [{ type: 'OBJECTIVE_FAILED' }];
    }
    onPlayerLanded(platformId, _elapsed) {
        if (platformId === this.targetPlatformId)
            return this.completeObjective();
        return [];
    }
    snapshot() {
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
    type = 'STATIC_STEP';
    constructor(data) {
        super();
        this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
        this.objective = { type: 'LAND_ON_TARGET', title: 'Land on the platform', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
    }
}
class MovingPlatformRuntime extends BasePatternRuntime {
    data;
    type = 'MOVING_PLATFORM';
    phase = 0;
    constructor(data) {
        super();
        this.data = data;
        this.platforms = [platform('target', data.startX, data.targetY, data.platformWidth, data.platformHeight)];
        this.objective = { type: 'LAND_ON_TARGET', title: 'Time the moving platform', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
    }
    update(dt) {
        this.phase += dt * this.data.speed;
        const target = this.platforms[0];
        if (!target)
            return;
        const oldX = target.x;
        const normalized = (Math.sin(this.phase) + 1) / 2;
        const nextX = this.data.startX + normalized * this.data.distance;
        target.x = nextX;
        target.velocityX = (nextX - oldX) / Math.max(dt, 1e-6);
    }
}
class NarrowGateRuntime extends BasePatternRuntime {
    type = 'NARROW_GATE';
    constructor(data) {
        super();
        this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
        this.objective = { type: 'LAND_ON_TARGET', title: 'Hit the narrow gate', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
    }
}
class DoubleStepRuntime extends BasePatternRuntime {
    type = 'DOUBLE_STEP';
    currentStep = 0;
    constructor(data) {
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
    onPlayerLanded(platformId) {
        const expected = this.platforms[this.currentStep];
        if (!expected || platformId !== expected.id)
            return [];
        this.currentStep++;
        if (this.currentStep >= this.platforms.length)
            return this.completeObjective();
        this.targetPlatformId = this.platforms[this.currentStep].id;
        this.objective = { ...this.objective, progress: this.currentStep, currentTargetId: this.targetPlatformId };
        return [
            { type: 'LANDING', platformId },
            { type: 'OBJECTIVE_PROGRESS', platformId, progress: this.currentStep },
        ];
    }
}
class RiskSplitRuntime extends BasePatternRuntime {
    type = 'RISK_SPLIT';
    chosen = null;
    constructor(data) {
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
    getTargetPlatform() {
        // Steering points between both choices until the player commits by landing.
        const safe = this.platforms[0];
        const risk = this.platforms[1];
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
        return this.platforms.find((p) => p.id === this.chosen);
    }
    onPlayerLanded(platformId) {
        if (platformId !== 'safe' && platformId !== 'risk')
            return [];
        this.chosen = platformId;
        this.targetPlatformId = platformId;
        return this.completeObjective();
    }
}
class FallingPlatformRuntime extends BasePatternRuntime {
    data;
    type = 'FALLING_PLATFORM';
    landedAt = null;
    survivalTime = 0.75;
    baseY;
    constructor(data) {
        super();
        this.data = data;
        this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
        this.baseY = data.targetY;
        this.objective = { type: 'LAND_AND_SURVIVE', title: 'Land and stay on it', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
    }
    update(_dt, elapsed) {
        const target = this.platforms[0];
        if (!target || this.landedAt === null || !target.active || this.completed)
            return;
        const age = elapsed - this.landedAt;
        target.y = this.baseY + age * 180;
        if (age >= this.survivalTime)
            this.completeObjective();
        if (age > this.survivalTime + 0.2) {
            target.active = false;
            this.failed = true;
            this.objective = { ...this.objective, failed: true };
        }
    }
    onPlayerLanded(platformId, elapsed) {
        if (platformId !== 'target' || this.landedAt !== null)
            return [];
        this.landedAt = elapsed;
        this.objective = { ...this.objective, progress: 0.5 };
        return [
            { type: 'LANDING', platformId },
            { type: 'OBJECTIVE_PROGRESS', platformId, progress: 0.5 },
        ];
    }
}
class WindCorridorRuntime extends BasePatternRuntime {
    type = 'WIND_CORRIDOR';
    constructor(data) {
        super();
        this.platforms = [platform('target', data.targetX, data.targetY, data.platformWidth, data.platformHeight)];
        this.objective = { type: 'LAND_ON_TARGET', title: 'Cross the wind corridor', progress: 0, required: 1, currentTargetId: 'target', completed: false, failed: false };
    }
}
class GuardianSequenceRuntime extends BasePatternRuntime {
    type = 'GUARDIAN_SEQUENCE';
    currentStep = 0;
    constructor(data) {
        super();
        const count = Math.max(3, data.stepCount);
        for (let i = 0; i < count; i++) {
            this.platforms.push(platform(`guardian-${i}`, data.targetX + i * data.gapBetweenSteps, data.targetY - i * 40, data.platformWidth, data.platformHeight));
        }
        this.targetPlatformId = 'guardian-0';
        this.objective = { type: 'REACH_GUARDIAN_SEQUENCE', title: `Defeat the guardian sequence`, progress: 0, required: count, currentTargetId: 'guardian-0', completed: false, failed: false };
    }
    onPlayerLanded(platformId) {
        const expected = this.platforms[this.currentStep];
        if (!expected || platformId !== expected.id)
            return [];
        this.currentStep++;
        if (this.currentStep >= this.platforms.length)
            return this.completeObjective();
        this.targetPlatformId = this.platforms[this.currentStep].id;
        this.objective = { ...this.objective, progress: this.currentStep, currentTargetId: this.targetPlatformId };
        return [
            { type: 'LANDING', platformId },
            { type: 'OBJECTIVE_PROGRESS', platformId, progress: this.currentStep },
        ];
    }
}
export function spawnPattern(data) {
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
