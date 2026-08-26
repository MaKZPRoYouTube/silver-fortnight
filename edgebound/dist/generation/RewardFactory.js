export class RewardFactory {
    create(tier) {
        return {
            baseCoins: 80 + tier * 35,
            baseXp: 20 + tier * 10,
            perfectBonus: 60 + tier * 25,
            streakScaling: 0.15 + tier * 0.04,
            cashOutEligible: tier >= 3,
        };
    }
}
