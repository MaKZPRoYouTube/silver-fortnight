export class Player {
    state = {
        x: 150, y: 300, velocityX: 0, velocityY: 0,
        width: 32, height: 42, grounded: true,
    };
    gravity = 1250;
    jumpVelocity = -560;
    update(dt) {
        this.state.velocityY += this.gravity * dt;
        this.state.x += this.state.velocityX * dt;
        this.state.y += this.state.velocityY * dt;
    }
    jump() {
        if (!this.state.grounded)
            return false;
        this.state.velocityY = this.jumpVelocity;
        this.state.grounded = false;
        return true;
    }
    setHorizontalVelocity(v) { this.state.velocityX = v; }
    landOn(_x, y) {
        this.state.y = y - this.state.height;
        this.state.velocityY = 0;
        this.state.grounded = true;
    }
    getCenterX() { return this.state.x + this.state.width / 2; }
    getBottom() { return this.state.y + this.state.height; }
}
