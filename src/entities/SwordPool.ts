import Phaser from 'phaser';
import { PlayerStats } from './PlayerStats';
import { Sword, SwordConfig } from './Sword';

// 飞剑资源池. INV-02 (docs/design-invariants.md): 同时存在的飞剑数 ≤ capacity.
// 池满时 tryFire 返回 false, 调用方按"空响应"处理 — 不排队/不缓冲/不延迟.
export class SwordPool {
  private readonly capacity: number;
  private readonly flying: Sword[] = [];

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  tryFire(
    scene: Phaser.Scene,
    config: SwordConfig,
    stats: PlayerStats,
    startX: number,
    startY: number,
    dirX: number,
    dirY: number,
  ): boolean {
    if (this.flying.length >= this.capacity) return false;
    const sword = new Sword(scene, config, stats, startX, startY, dirX, dirY, () => {
      const idx = this.flying.indexOf(sword);
      if (idx >= 0) this.flying.splice(idx, 1);
    });
    this.flying.push(sword);
    return true;
  }

  update(deltaMs: number): void {
    // 飞剑可能在自己的 update 中触发销毁回调改 flying 数组, slice 拷贝避免迭代异常
    for (const s of this.flying.slice()) s.update(deltaMs);
  }
}
