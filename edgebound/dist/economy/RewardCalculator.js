export class RewardCalculator {
    calculate(reward, quality, streak) {
        const perfect = quality === 'PERFECT';
        const multiplier = 1 + (perfect ? 0.5 : 0) + streak * reward.streakScaling;
        return {
            coins: Math.round((reward.baseCoins + (perfect ? reward.perfectBonus : 0)) * multiplier),
            xp: Math.round(reward.baseXp * multiplier),
            multiplier,
        };
    }
}
