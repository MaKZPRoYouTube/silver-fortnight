import { spawnPattern } from './PatternRuntime';
const common = (tier) => ({
    startX: 180,
    startY: 410,
    targetX: 520,
    targetY: 350,
    platformWidth: Math.max(60, 180 - tier * 18),
    platformHeight: 24,
    distance: Math.max(120, 260 + tier * 35),
    speed: 1.2 + tier * 0.22,
    perfectWidth: Math.max(28, 90 - tier * 12),
    variant: 0,
    stepCount: 1,
    gapBetweenSteps: 0,
    riskRewardRatio: 1.2,
});
export const PATTERN_LIBRARY = [
    {
        type: 'STATIC_STEP', minTier: 0, maxTier: 5,
        tags: ['intro', 'recovery', 'precision'], weight: 20,
        createsRecovery: true,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'STATIC_STEP',
            targetX: 430 + rng.range(-45, 45),
            targetY: 360 + rng.range(-10, 15),
            platformWidth: Math.max(80, 190 - tier * 15),
            distance: 220 + rng.range(-20, 60),
            speed: 0,
        }),
    },
    {
        type: 'MOVING_PLATFORM', minTier: 0, maxTier: 5,
        tags: ['timing'], weight: 18,
        createsRecovery: false,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'MOVING_PLATFORM',
            targetX: 500 + rng.range(-55, 55),
            speed: 1.2 + tier * 0.22 + rng.range(-0.08, 0.08),
            distance: 180 + tier * 45 + rng.range(-25, 35),
        }),
    },
    {
        type: 'NARROW_GATE', minTier: 1, maxTier: 5,
        tags: ['precision', 'pressure'], weight: 10,
        createsRecovery: false,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'NARROW_GATE',
            targetX: 500 + rng.range(-30, 30),
            platformWidth: Math.max(48, 115 - tier * 13),
            perfectWidth: Math.max(24, 55 - tier * 6),
        }),
    },
    {
        type: 'DOUBLE_STEP', minTier: 1, maxTier: 4,
        tags: ['chain', 'skill'], weight: 9,
        createsRecovery: false,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'DOUBLE_STEP',
            targetX: 430,
            targetY: 360,
            stepCount: 2,
            gapBetweenSteps: 110 + rng.range(-10, 20),
            platformWidth: Math.max(70, 150 - tier * 12),
        }),
    },
    {
        type: 'RISK_SPLIT', minTier: 1, maxTier: 5,
        tags: ['choice', 'reward'], weight: 8,
        createsRecovery: true,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'RISK_SPLIT',
            variant: rng.int(0, 2),
            riskRewardRatio: 1.4 + tier * 0.2,
            targetX: 430 + rng.range(-40, 40),
            platformWidth: Math.max(70, 150 - tier * 10),
        }),
    },
    {
        type: 'FALLING_PLATFORM', minTier: 2, maxTier: 5,
        tags: ['pressure', 'speed'], weight: 7,
        createsRecovery: false,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'FALLING_PLATFORM',
            targetX: 480 + rng.range(-40, 40),
            platformWidth: Math.max(58, 125 - tier * 12),
            speed: 1.3 + tier * 0.25,
        }),
    },
    {
        type: 'WIND_CORRIDOR', minTier: 1, maxTier: 5,
        tags: ['wind', 'prediction'], weight: 8,
        createsRecovery: false,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'WIND_CORRIDOR',
            targetX: 490 + rng.range(-45, 45),
            platformWidth: Math.max(65, 155 - tier * 12),
            distance: 240 + tier * 38,
        }),
    },
    {
        type: 'GUARDIAN_SEQUENCE', minTier: 3, maxTier: 5,
        tags: ['boss', 'sequence'], weight: 3,
        createsRecovery: false,
        build: (rng, tier) => ({
            ...common(tier),
            type: 'GUARDIAN_SEQUENCE',
            variant: rng.int(0, 3),
            stepCount: 3,
            gapBetweenSteps: 120 + tier * 12,
            platformWidth: Math.max(58, 120 - tier * 10),
            perfectWidth: Math.max(22, 48 - tier * 5),
        }),
    },
];
export function getRecipe(type) {
    const recipe = PATTERN_LIBRARY.find((r) => r.type === type);
    if (!recipe)
        throw new Error(`Unknown pattern: ${type}`);
    return recipe;
}
export function spawnPatternRuntime(data, rng) {
    void rng;
    return spawnPattern(data);
}
export function getAvailableRecipes(tier) {
    return PATTERN_LIBRARY.filter((r) => tier >= r.minTier && tier <= r.maxTier);
}
