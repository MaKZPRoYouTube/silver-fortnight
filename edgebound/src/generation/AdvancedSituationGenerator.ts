import { DifficultyScaler } from './DifficultyScaler';
import { DifficultyTier, SituationData } from '../core/types';
import { SeededRandom } from './Random';
import { PatternComposer, SegmentHistoryItem } from './PatternComposer';
import { PhysicsValidator } from '../physics/PhysicsValidator';
import { RewardFactory } from './RewardFactory';

export interface GeneratedSegment {
  data: SituationData;
  history: SegmentHistoryItem;
}

export class AdvancedSituationGenerator {
  private readonly scaler = new DifficultyScaler();
  private readonly rewardFactory = new RewardFactory();

  constructor(
    private readonly composer: PatternComposer,
    private readonly validator: PhysicsValidator,
  ) {}

  generate(
    seed: number,
    tier: DifficultyTier,
    history: readonly SegmentHistoryItem[],
  ): GeneratedSegment {
    const rootRng = new SeededRandom(seed);

    for (let attempt = 0; attempt < 30; attempt++) {
      const attemptSeed = rootRng.int(1, 0x7fffffff);
      const rng = new SeededRandom(attemptSeed);
      const recipe = this.composer.choosePattern(rng, tier, history);
      const pattern = recipe.build(rng, tier);
      const modifiers = this.composer.createModifiers(rng, tier, recipe, history);

      const data: SituationData = {
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
