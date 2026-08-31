import { LandingQuality, Reward } from '../core/types.js';

export class RewardCalculator {
  calculate(reward: Reward, quality: LandingQuality, streak: number) {
    const perfect = quality === 'PERFECT';
    const multiplier = 1 + (perfect ? 0.5 : 0) + streak * reward.streakScaling;
    return {
      coins: Math.round((reward.baseCoins + (perfect ? reward.perfectBonus : 0)) * multiplier),
      xp: Math.round(reward.baseXp * multiplier),
      multiplier,
    };
  }
}
