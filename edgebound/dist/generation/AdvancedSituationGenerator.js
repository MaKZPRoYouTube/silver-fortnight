import { DifficultyScaler } from './DifficultyScaler.js';
import { SeededRandom } from './Random.js';
import { RewardFactory } from './RewardFactory.js';
export class AdvancedSituationGenerator {
    composer;
    validator;
    scaler = new DifficultyScaler();
    rewardFactory = new RewardFactory();
    constructor(composer, validator) {
        this.composer = composer;
        this.validator = validator;
    }
    generate(seed, tier, history) {
        const rootRng = new SeededRandom(seed);
        for (let attempt = 0; attempt < 30; attempt++) {
            const attemptSeed = rootRng.int(1, 0x7fffffff);
            const rng = new SeededRandom(attemptSeed);
            const recipe = this.composer.choosePattern(rng, tier, history);
            const pattern = recipe.build(rng, tier);
            const modifiers = this.composer.createModifiers(rng, tier, recipe, history);
            const data = {
                id: `generated_${seed}_${attempt}`,
                version: 2,
                pattern,
                modifiers,
                difficulty: this.scaler.create(tier),
                reward: this.rewardFactory.create(tier),
            };
            const validation = this.validator.validateSituation(data);
            if (validation.valid) {
                return {
                    data,
                    history: {
                        pattern: recipe.type,
                        tags: recipe.tags,
                    },
                };
            }
        }
        throw new Error(`Could not generate a valid situation for seed=${seed}, tier=${tier}`);
    }
}
