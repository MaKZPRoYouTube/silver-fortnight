export interface WindRuntimeData {
  type: 'WIND';
  direction: -1 | 1;
  strength: number;
  variation: number;
}

export class WindModifier {
  private currentStrength: number;
  constructor(private readonly data: WindRuntimeData) {
    this.currentStrength = data.strength;
  }
  update(time: number): void {
    this.currentStrength = this.data.strength * (1 + Math.sin(time * 2) * this.data.variation);
  }
  getHorizontalVelocity(): number {
    return this.data.direction * this.currentStrength;
  }
  getStrength(): number { return this.currentStrength; }
}
