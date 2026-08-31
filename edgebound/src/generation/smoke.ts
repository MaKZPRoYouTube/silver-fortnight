import { PhysicsValidator } from '../physics/PhysicsValidator.js';
import { PatternComposer } from './PatternComposer.js';
import { AdvancedSituationGenerator } from './AdvancedSituationGenerator.js';

const generator = new AdvancedSituationGenerator(
  new PatternComposer(),
  new PhysicsValidator(),
);

const seen = new Set<string>();
let history: any[] = [];

for (let i = 0; i < 50; i++) {
  const tier = (Math.min(5, Math.floor(i / 10))) as 0 | 1 | 2 | 3 | 4 | 5;
  const result = generator.generate(9000 + i * 37, tier, history);
  seen.add(result.data.pattern.type);
  history = [...history, result.history];
  console.log(i + 1, tier, result.data.pattern.type, result.data.modifiers.map(m => m.type).join('+') || 'none');
}
console.log('PATTERNS', [...seen].join(', '));
