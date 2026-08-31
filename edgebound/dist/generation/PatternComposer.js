import { PATTERN_LIBRARY } from '../patterns/PatternLibrary.js';
const DEFAULT_RULES = {
    maxSamePatternInRow: 2,
    maxWindPatternsInLastN: 2,
    bossMinTier: 3,
    requireRecoveryAfterHard: true,
    maxModifiers: 2,
};
export class PatternComposer {
    rules;
    constructor(rules = DEFAULT_RULES) {
        this.rules = rules;
    }
    choosePattern(rng, tier, history) {
        let candidates = PATTERN_LIBRARY.filter((r) => tier >= r.minTier && tier <= r.maxTier);
        candidates = candidates.filter((recipe) => this.allowedAfter(recipe, history));
        if (candidates.length === 0) {
            candidates = PATTERN_LIBRARY.filter((r) => tier >= r.minTier && tier <= r.maxTier);
        }
        return this.weightedPick(rng, candidates);
    }
    createModifiers(rng, tier, recipe, history) {
        const modifiers = [];
        const recentWindCount = history
            .slice(-3)
            .filter((h) => h.tags.includes('wind')).length;
        const canWind = recentWindCount < this.rules.maxWindPatternsInLastN;
        const windProbability = recipe.tags.includes('wind')
            ? 0.95
            : tier <= 1 ? 0.2 : 0.35;
        if (canWind && rng.chance(windProbability)) {
            modifiers.push({
                type: 'WIND',
                strength: 45 + tier * 12 + rng.range(-8, 8),
                direction: rng.chance(0.5) ? -1 : 1,
                telegraphTime: Math.max(0.7, 1.2 - tier * 0.08),
            });
        }
        if (tier >= 2 && rng.chance(0.15 + tier * 0.05) && modifiers.length < this.rules.maxModifiers) {
            modifiers.push({
                type: 'SPEED_UP',
                strength: 0.08 + tier * 0.025,
                telegraphTime: 0.8,
            });
        }
        if (tier >= 3 && rng.chance(0.08) && modifiers.length < this.rules.maxModifiers) {
            modifiers.push({
                type: 'SHRINK_WINDOW',
                strength: 0.1 + tier * 0.03,
                telegraphTime: 0.6,
            });
        }
        return modifiers;
    }
    allowedAfter(recipe, history) {
        const last = history.at(-1);
        if (last?.pattern === recipe.type) {
            const streak = this.trailingCount(history, recipe.type);
            if (streak >= this.rules.maxSamePatternInRow)
                return false;
        }
        if (last && recipe.requiresPrior && !recipe.requiresPrior.includes(last.pattern)) {
            return false;
        }
        if (last && recipe.forbidsAfter?.includes(last.pattern)) {
            return false;
        }
        if (this.rules.requireRecoveryAfterHard &&
            last &&
            last.tags.some((t) => t === 'pressure' || t === 'boss') &&
            !recipe.tags.some((t) => t === 'recovery' || t === 'intro')) {
            return false;
        }
        return true;
    }
    trailingCount(history, type) {
        let count = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            const item = history[i];
            if (!item || item.pattern !== type)
                break;
            count++;
        }
        return count;
    }
    weightedPick(rng, recipes) {
        const total = recipes.reduce((sum, r) => sum + r.weight, 0);
        let cursor = rng.range(0, total);
        for (const recipe of recipes) {
            cursor -= recipe.weight;
            if (cursor <= 0)
                return recipe;
        }
        const fallback = recipes.at(-1);
        if (!fallback)
            throw new Error('No pattern recipes available');
        return fallback;
    }
}
