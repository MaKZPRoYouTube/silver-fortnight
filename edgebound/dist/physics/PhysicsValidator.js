import { DEFAULT_PHYSICS, maxHorizontalTravel, maxJumpHeight, airtimeToHeight, simulateJump, } from './PhysicsModel';
export class PhysicsValidator {
    physics;
    constructor(physics = DEFAULT_PHYSICS) {
        this.physics = physics;
    }
    validateSituation(situation) {
        const issues = [];
        const p = situation.pattern;
        const wind = this.aggregateWind(situation.modifiers);
        const verticalDelta = p.startY - p.targetY;
        const reach = maxJumpHeight(this.physics);
        if (verticalDelta > reach) {
            issues.push({
                code: 'VERTICAL_UNREACHABLE',
                message: `Target is ${verticalDelta.toFixed(1)}px above start; max jump height is ${reach.toFixed(1)}px.`,
                severity: 'error',
            });
        }
        const effectiveTargetY = Math.min(p.targetY, p.startY + reach - 1);
        const airtime = airtimeToHeight(this.physics, p.startY - effectiveTargetY);
        const maxTravel = maxHorizontalTravel(this.physics, airtime, wind.initialVelocity);
        const required = Math.abs(p.targetX - p.startX);
        const simulated = simulateJump(this.physics, p.startX, p.startY, p.targetY, p.targetX, wind.acceleration);
        const landingMargin = p.platformWidth / 2 - Math.abs(simulated.x - p.targetX);
        const safetyMargin = maxTravel - Math.max(0, required - p.platformWidth / 2);
        if (required - p.platformWidth / 2 > maxTravel) {
            issues.push({
                code: 'HORIZONTAL_UNREACHABLE',
                message: `Required horizontal travel is ${(required - p.platformWidth / 2).toFixed(1)}px, available reach is ${maxTravel.toFixed(1)}px.`,
                severity: 'error',
            });
        }
        if (landingMargin < 0) {
            issues.push({
                code: 'SIMULATION_MISSED',
                message: `Simulated landing misses platform by ${Math.abs(landingMargin).toFixed(1)}px.`,
                severity: 'error',
            });
        }
        else if (landingMargin < Math.max(16, p.platformWidth * 0.12)) {
            issues.push({
                code: 'LOW_LANDING_MARGIN',
                message: `Simulated landing has only ${landingMargin.toFixed(1)}px of lateral margin.`,
                severity: 'warning',
            });
        }
        this.validateWind(p, situation.modifiers, issues);
        if (p.perfectWidth <= 0 || p.perfectWidth > p.platformWidth) {
            issues.push({
                code: 'INVALID_PERFECT_WINDOW',
                message: 'Perfect window must be greater than 0 and no wider than the platform.',
                severity: 'error',
            });
        }
        if (p.platformWidth < 40) {
            issues.push({
                code: 'PLATFORM_TOO_NARROW',
                message: 'Platform is narrower than the minimum safe production width of 40px.',
                severity: 'error',
            });
        }
        return {
            valid: !issues.some((x) => x.severity === 'error'),
            issues,
            metrics: {
                verticalReach: reach,
                requiredHorizontalDistance: required,
                maxHorizontalReach: maxTravel,
                margin: safetyMargin,
                simulatedLandingX: simulated.x,
            },
        };
    }
    aggregateWind(modifiers) {
        let acceleration = 0;
        let initialVelocity = 0;
        for (const modifier of modifiers) {
            if (modifier.type !== 'WIND')
                continue;
            const direction = modifier.direction ?? 1;
            acceleration += direction * modifier.strength;
        }
        return { acceleration, initialVelocity };
    }
    validateWind(pattern, modifiers, issues) {
        const wind = modifiers.filter((m) => m.type === 'WIND');
        if (wind.length === 0)
            return;
        const totalStrength = wind.reduce((sum, m) => sum + Math.abs(m.strength), 0);
        const required = Math.abs(pattern.targetX - pattern.startX);
        if (totalStrength > 220 && required < 160) {
            issues.push({
                code: 'WIND_DISPROPORTIONATE',
                message: 'Wind is too strong for the short horizontal transfer.',
                severity: 'error',
            });
        }
    }
}
