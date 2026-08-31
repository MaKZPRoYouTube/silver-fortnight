import { Difficulty, DifficultyTier } from '../core/types.js';

export class DifficultyScaler {
  create(tier: DifficultyTier): Difficulty {
    const t = tier / 5;
    return {
      tier,
      timingWindow: 1 - t * 0.45,
      reactionTime: 1.8 - t * 0.7,
      precisionRequired: 0.25 + t * 0.55,
      dangerLevel: Math.min(4, Math.floor(tier * 0.8)) as 0 | 1 | 2 | 3 | 4,
      recoveryAvailable: tier <= 2,
    };
  }

  perfectWidth(tier: DifficultyTier): number {
    return 90 - tier * 12;
  }

  platformWidth(tier: DifficultyTier): number {
    return 180 - tier * 18;
  }

  platformDistance(tier: DifficultyTier): number {
    return 180 + tier * 45;
  }

  platformSpeed(tier: DifficultyTier): number {
    return 1.25 + tier * 0.25;
  }
}
