import { PhysicsValidator } from '../physics/PhysicsValidator';
import { PatternComposer } from './PatternComposer';
import { AdvancedSituationGenerator } from './AdvancedSituationGenerator';
const generator = new AdvancedSituationGenerator(new PatternComposer(), new PhysicsValidator());
const seen = new Set();
let history = [];
for (let i = 0; i < 50; i++) {
    const tier = (Math.min(5, Math.floor(i / 10)));
    const result = generator.generate(9000 + i * 37, tier, history);
    seen.add(result.data.pattern.type);
    history = [...history, result.history];
    console.log(i + 1, tier, result.data.pattern.type, result.data.modifiers.map(m => m.type).join('+') || 'none');
}
console.log('PATTERNS', [...seen].join(', '));
