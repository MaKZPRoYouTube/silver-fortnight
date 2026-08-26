export class SeededRandom {
    state;
    constructor(seed) {
        this.state = seed >>> 0;
    }
    next() {
        this.state += 0x6d2b79f5;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(min, max) {
        return min + this.next() * (max - min);
    }
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
    chance(probability) {
        return this.next() < probability;
    }
    pick(items) {
        if (items.length === 0)
            throw new Error('Cannot pick from empty array');
        const item = items[this.int(0, items.length - 1)];
        if (item === undefined)
            throw new Error('Cannot pick from empty array');
        return item;
    }
}
