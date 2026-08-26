export const DEFAULT_PHYSICS = {
    gravity: 1250,
    jumpVelocity: -560,
    horizontalControl: 850,
    maxHorizontalSpeed: 480,
    playerWidth: 32,
    playerHeight: 42,
};
export function timeToApex(params) {
    return -params.jumpVelocity / params.gravity;
}
export function airtimeToHeight(params, heightDelta) {
    // Solve y(t) = v0*t + .5*g*t^2 = -heightDelta for the descending positive root.
    const a = 0.5 * params.gravity;
    const b = params.jumpVelocity;
    const c = heightDelta;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0)
        return 0;
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    return Math.max(root1, root2, 0);
}
export function maxJumpHeight(params) {
    return (params.jumpVelocity * params.jumpVelocity) / (2 * params.gravity);
}
export function maxHorizontalTravel(params, airtime, initialVelocity = 0) {
    const accelDistance = 0.5 * params.horizontalControl * airtime * airtime;
    const speedCap = Math.max(0, Math.abs(params.maxHorizontalSpeed) - Math.abs(initialVelocity));
    const speedCapTime = speedCap / params.horizontalControl;
    if (speedCapTime >= airtime) {
        return Math.abs(initialVelocity) * airtime + accelDistance;
    }
    const accelerated = Math.abs(initialVelocity) * speedCapTime + 0.5 * params.horizontalControl * speedCapTime ** 2;
    const cruise = Math.abs(params.maxHorizontalSpeed) * (airtime - speedCapTime);
    return accelerated + cruise;
}
export function simulateJump(params, startX, startY, targetY, targetX, windAcceleration, dt = 1 / 120) {
    let t = 0;
    let x = startX;
    let y = startY;
    let vx = 0;
    let vy = params.jumpVelocity;
    const direction = Math.sign(targetX - startX) || 1;
    const maxTime = 2.5;
    while (t < maxTime) {
        const desired = direction * params.maxHorizontalSpeed;
        const steering = Math.sign(desired - vx) * params.horizontalControl;
        vx += steering * dt;
        vx = Math.max(-params.maxHorizontalSpeed, Math.min(params.maxHorizontalSpeed, vx));
        vx += windAcceleration * dt;
        vy += params.gravity * dt;
        x += vx * dt;
        y += vy * dt;
        t += dt;
        if (vy >= 0 && y >= targetY) {
            return { t, x, y, vx, vy };
        }
    }
    return { t: maxTime, x, y, vx, vy };
}
