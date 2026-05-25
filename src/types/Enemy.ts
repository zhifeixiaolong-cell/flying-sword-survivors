// Enemy 接口契约. M3 敌人系统实现此接口, M2 只定义不实现.
// Sword.onHit(enemy) 通过此接口调用敌人方法, Sword 不依赖具体 Enemy 类.
export interface Enemy {
  takeDamage(damage: number): void;
  isAlive(): boolean;
}
