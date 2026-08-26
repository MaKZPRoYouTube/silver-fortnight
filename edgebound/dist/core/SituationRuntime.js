import { Player } from './Player';
import { spawnPattern } from '../patterns/PatternRuntime';
import { WindModifier } from '../modifiers/WindModifier';
import { RewardCalculator } from '../economy/RewardCalculator';
export class SituationRuntime {
    state = 'INTRO';
    player = new Player();
    result = null;
    streak = 0;
    elapsed = 0;
    data;
    pattern;
    rewardCalculator = new RewardCalculator();
    wind = null;
    generator;
    seed;
    difficulty;
    history;
    constructor(dataOrOptions) {
        if ('pattern' in dataOrOptions) {
            this.data = dataOrOptions;
            this.history = [];
        }
        else {
            this.generator = dataOrOptions.generator;
            this.seed = dataOrOptions.seed;
            this.difficulty = dataOrOptions.difficulty;
            this.history = dataOrOptions.history ?? [];
            if (!this.generator || this.seed === undefined || this.difficulty === undefined) {
                throw new Error('Generated SituationRuntime requires generator, seed and difficulty');
            }
            this.data = this.generator.generate(this.seed, this.difficulty, this.history).data;
        }
        this.pattern = spawnPattern(this.data.pattern);
        this.createModifiers();
    }
    createModifiers() {
        const wind = this.data.modifiers.find((m) => m.type === 'WIND');
        if (wind) {
            this.wind = new WindModifier({
                type: 'WIND',
                direction: wind.direction ?? 1,
                strength: wind.strength,
                variation: 0.12,
            });
        }
    }
    start() {
        this.state = 'RUNNING';
        this.result = null;
        this.elapsed = 0;
        this.player.state.x = this.data.pattern.startX - 30;
        this.player.state.y = this.data.pattern.startY - this.player.state.height;
        this.player.state.velocityX = 0;
        this.player.state.velocityY = 0;
        this.player.state.grounded = true;
    }
    update(dt) {
        if (this.state !== 'RUNNING')
            return;
        this.elapsed += dt;
        this.pattern.update(dt, this.elapsed);
        this.wind?.update(this.elapsed);
        const windVelocity = this.wind?.getHorizontalVelocity() ?? 0;
        const target = this.pattern.getTargetPlatform();
        if (this.player.state.grounded) {
            this.player.setHorizontalVelocity(0);
        }
        else {
            const direction = Math.sign(target.x + target.width / 2 - this.player.getCenterX()) || 1;
            this.player.setHorizontalVelocity(Math.max(-480, Math.min(480, direction * 220 + windVelocity)));
        }
        this.player.update(dt);
        this.checkLanding(dt);
        // Some objectives (e.g. FALLING_PLATFORM) complete after landing
        // and a short survival window, without another landing event.
        if (this.pattern.isComplete() && this.state === 'RUNNING') {
            this.complete(1, 'GOOD');
        }
        if (this.player.state.y > 700 || this.pattern.isFailed()) {
            this.fail();
        }
    }
    jump() {
        if (this.state !== 'RUNNING')
            return false;
        return this.player.jump();
    }
    checkLanding(dt) {
        if (this.player.state.velocityY < 0)
            return;
        const bottom = this.player.getBottom();
        const previousBottom = bottom - this.player.state.velocityY * dt;
        for (const p of this.pattern.getPlatforms()) {
            if (!p.active)
                continue;
            const overlapsX = this.player.state.x + this.player.state.width > p.x && this.player.state.x < p.x + p.width;
            const crossesY = previousBottom <= p.y && bottom >= p.y;
            if (!overlapsX || !crossesY)
                continue;
            this.player.landOn(p.x, p.y);
            const accuracy = this.calculateAccuracy(p.x, p.width);
            const quality = this.getLandingQuality(p, accuracy);
            const events = this.pattern.onPlayerLanded(p.id, this.elapsed);
            // A pattern owns its objective. Runtime only resolves the
            // situation when that objective is actually complete.
            if (this.pattern.isComplete()) {
                this.complete(accuracy, quality);
            }
            void events;
            return;
        }
    }
    calculateAccuracy(platformX, platformWidth) {
        const distance = Math.abs(this.player.getCenterX() - (platformX + platformWidth / 2));
        return Math.max(0, 1 - distance / (platformWidth / 2));
    }
    getLandingQuality(platform, accuracy) {
        const perfectHalfWidth = Math.min(this.data.pattern.perfectWidth, platform.width) / 2;
        const distance = Math.abs(this.player.getCenterX() - (platform.x + platform.width / 2));
        if (distance <= perfectHalfWidth)
            return 'PERFECT';
        if (accuracy >= 0.25)
            return 'GOOD';
        return 'NONE';
    }
    complete(accuracy, quality) {
        if (quality === 'PERFECT')
            this.streak += 1;
        else
            this.streak = 0;
        const reward = this.rewardCalculator.calculate(this.data.reward, quality, this.streak);
        this.state = 'SUCCESS';
        this.result = {
            state: 'SUCCESS',
            landingQuality: quality,
            accuracy,
            coins: reward.coins,
            xp: reward.xp,
            streak: this.streak,
        };
    }
    fail() {
        if (this.state !== 'RUNNING')
            return;
        this.state = 'FAILED';
        this.result = {
            state: 'FAILED',
            landingQuality: 'NONE',
            accuracy: 0,
            coins: 0,
            xp: 0,
            streak: 0,
        };
    }
    get windStrength() {
        return this.wind?.getStrength() ?? 0;
    }
    get platforms() {
        return this.pattern.getPlatforms();
    }
}
