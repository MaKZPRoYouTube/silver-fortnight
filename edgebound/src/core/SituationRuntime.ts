import { Player } from './Player';
import { PatternRuntime, spawnPattern } from '../patterns/PatternRuntime';
import { WindModifier } from '../modifiers/WindModifier';
import { RewardCalculator } from '../economy/RewardCalculator';
import { DifficultyTier, SituationData, SituationResult, SituationState, LandingQuality } from './types';

export interface SituationRuntimeOptions {
  generator?: any;
  seed?: number;
  difficulty?: DifficultyTier;
  history?: readonly any[];
  currentStreak?: number;
}

export class SituationRuntime {
  public state: SituationState = 'INTRO';
  public readonly player = new Player();
  public result: SituationResult | null = null;
  public streak = 0;
  public elapsed = 0;
  public data: SituationData;
  public pattern: PatternRuntime;
  public wind: WindModifier | null = null;

  private readonly rewardCalculator = new RewardCalculator();

  constructor(dataOrOptions: SituationData | SituationRuntimeOptions) {
    if ('pattern' in dataOrOptions) {
      this.data = dataOrOptions;
      if ((dataOrOptions as any).currentStreak !== undefined) {
        this.streak = (dataOrOptions as any).currentStreak;
      }
    } else {
      this.streak = dataOrOptions.currentStreak ?? 0;
      if (!dataOrOptions.generator || dataOrOptions.seed === undefined || dataOrOptions.difficulty === undefined) {
        throw new Error('Generated SituationRuntime requires generator, seed and difficulty');
      }
      this.data = dataOrOptions.generator.generate(dataOrOptions.seed, dataOrOptions.difficulty, dataOrOptions.history ?? []).data;
    }

    this.pattern = spawnPattern(this.data.pattern);
    this.createModifiers();
  }

  private createModifiers(): void {
    const wind = this.data.modifiers?.find((m: any) => m.type === 'WIND');
    if (wind) {
      this.wind = new WindModifier({
        type: 'WIND',
        direction: wind.direction ?? 1,
        strength: wind.strength ?? 60,
        variation: 0.12,
      });
    }
  }

  public start(): void {
    this.state = 'RUNNING';
    this.result = null;
    this.elapsed = 0;

    const startP = this.pattern.getPlatforms().find((p: any) => p.id === 'start') || this.pattern.getPlatforms()[0];
    if (startP) {
      this.player.state.x = startP.x + 20;
      this.player.state.y = startP.y - this.player.state.height;
    } else {
      this.player.state.x = this.data.pattern.startX;
      this.player.state.y = this.data.pattern.startY - this.player.state.height;
    }

    this.player.state.velocityX = 0;
    this.player.state.velocityY = 0;
    this.player.state.grounded = true;
  }

  public update(dt: number): void {
    if (this.state !== 'RUNNING') return;

    this.elapsed += dt;
    this.pattern.update(dt, this.elapsed);
    this.wind?.update(this.elapsed);

    const windVelocity = this.wind?.getHorizontalVelocity() ?? 0;

    if (this.player.state.grounded) {
      this.player.setHorizontalVelocity(0);
    } else {
      const forwardSpeed = 340;
      const targetVx = forwardSpeed + windVelocity;
      this.player.setHorizontalVelocity(Math.max(-500, Math.min(500, targetVx)));
      this.checkLanding(dt);
    }

    this.player.update(dt);

    if (this.player.state.y > 650 || this.pattern.isFailed()) {
      this.fail();
    }
  }

  public jump(): boolean {
    if (this.state !== 'RUNNING') return false;
    return this.player.jump();
  }

  private checkLanding(dt: number): void {
    if (this.player.state.velocityY <= 0) return;

    const bottom = this.player.getBottom();
    const prevBottom = bottom - this.player.state.velocityY * dt;

    for (const p of this.pattern.getPlatforms()) {
      if (!p.active) continue;

      const overlapsX = (this.player.state.x + this.player.state.width > p.x) && 
                        (this.player.state.x < p.x + p.width);
      const crossesY = (prevBottom <= p.y + 14) && (bottom >= p.y);

      if (!overlapsX || !crossesY) continue;

      this.player.landOn(p.x, p.y);
      this.pattern.onPlayerLanded(p.id, this.elapsed);

      if (p.isTarget || p.id === 'target') {
        const accuracy = this.calculateAccuracy(p.x, p.width);
        const quality = this.getLandingQuality(p, accuracy);
        this.complete(accuracy, quality);
      }
      return;
    }
  }

  private calculateAccuracy(platformX: number, platformWidth: number): number {
    const distance = Math.abs(this.player.getCenterX() - (platformX + platformWidth / 2));
    return Math.max(0, 1 - distance / (platformWidth / 2));
  }

  private getLandingQuality(
    platform: { x: number; width: number },
    accuracy: number,
  ): LandingQuality {
    const perfectHalfWidth = Math.min(this.data.pattern.perfectWidth ?? (platform.width * 0.35), platform.width) / 2;
    const distance = Math.abs(this.player.getCenterX() - (platform.x + platform.width / 2));
    
    if (distance <= perfectHalfWidth) return 'PERFECT';
    if (accuracy >= 0.25) return 'GOOD';
    return 'NONE';
  }

  private complete(accuracy: number, quality: LandingQuality): void {
    if (quality === 'PERFECT') {
      this.streak += 1;
    } else {
      this.streak = 0;
    }

    const baseCoins = Number(this.data.reward?.baseCoins ?? (this.data.reward as any)?.coins ?? 100) || 100;
    const perfectBonus = quality === 'PERFECT' ? Number(this.data.reward?.perfectBonus ?? 150) || 150 : 0;
    const earnedCoins = baseCoins + perfectBonus + (this.streak > 1 ? this.streak * 50 : 0);

    this.state = 'SUCCESS';
    this.result = {
      state: 'SUCCESS',
      landingQuality: quality,
      accuracy,
      coins: earnedCoins,
      xp: 50,
      streak: this.streak,
    };
  }

  private fail(): void {
    if (this.state !== 'RUNNING') return;
    this.state = 'FAILED';
    this.streak = 0;
    this.result = {
      state: 'FAILED',
      landingQuality: 'NONE',
      accuracy: 0,
      coins: 0,
      xp: 0,
      streak: 0,
    };
  }

  public get windStrength(): number {
    return this.wind?.getStrength() ?? 0;
  }

  public get platforms() {
    return this.pattern.getPlatforms();
  }
}

export default SituationRuntime;
