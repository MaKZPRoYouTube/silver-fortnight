import { PlayerState } from './types.js';

export class Player {
  public readonly state: PlayerState = {
    x: 150, y: 300, velocityX: 0, velocityY: 0,
    width: 32, height: 42, grounded: true,
  };

  private readonly gravity = 1250;
  private readonly jumpVelocity = -560;

  update(dt: number): void {
    this.state.velocityY += this.gravity * dt;
    this.state.x += this.state.velocityX * dt;
    this.state.y += this.state.velocityY * dt;
  }

  jump(): boolean {
    if (!this.state.grounded) return false;
    this.state.velocityY = this.jumpVelocity;
    this.state.grounded = false;
    return true;
  }

  setHorizontalVelocity(v: number): void { this.state.velocityX = v; }
  landOn(_x: number, y: number): void {
    this.state.y = y - this.state.height;
    this.state.velocityY = 0;
    this.state.grounded = true;
  }
  getCenterX(): number { return this.state.x + this.state.width / 2; }
  getBottom(): number { return this.state.y + this.state.height; }
}
