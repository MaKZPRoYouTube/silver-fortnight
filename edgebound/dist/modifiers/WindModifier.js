export class WindModifier {
    data;
    currentStrength;
    constructor(data) {
        this.data = data;
        this.currentStrength = data.strength;
    }
    update(time) {
        this.currentStrength = this.data.strength * (1 + Math.sin(time * 2) * this.data.variation);
    }
    getHorizontalVelocity() {
        return this.data.direction * this.currentStrength;
    }
    getStrength() { return this.currentStrength; }
}
