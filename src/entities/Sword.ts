import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_SPEED,
  SWORD_DAMAGE_COEF,
  SWORD_INITIAL_SPEED,
  SWORD_MAX_DISTANCE,
  SWORD_MIN_SPEED,
  SWORD_PLACEHOLDER_COLOR,
  SWORD_PLACEHOLDER_CROSS,
  SWORD_PLACEHOLDER_LENGTH,
  SWORD_PLACEHOLDER_WIDTH,
  SWORD_SHARPNESS,
  SWORD_SPEED_FLOOR,
  SWORD_TURN_RATE,
} from '../config';
import { PlayerStats } from './PlayerStats';

// 飞剑基础属性接口. M5+ 多种飞剑武器复用此接口, 通过实例化不同 SwordConfig 实现差异化.
export interface SwordConfig {
  initialSpeed: number;
  minSpeed: number;
  maxDistance: number;
  speedFloor: number;
  sharpness: number;
  damageCoefficient: number;
  turnRate: number; // °/s, 追踪角速度上限
}

// M2 唯一一种基础剑配置. 通过 PlayerStats 倍率与此合并得到飞剑实际属性.
export const DEFAULT_SWORD_CONFIG: SwordConfig = {
  initialSpeed: SWORD_INITIAL_SPEED,
  minSpeed: SWORD_MIN_SPEED,
  maxDistance: SWORD_MAX_DISTANCE,
  speedFloor: SWORD_SPEED_FLOOR,
  sharpness: SWORD_SHARPNESS,
  damageCoefficient: SWORD_DAMAGE_COEF,
  turnRate: SWORD_TURN_RATE,
};

export class Sword {
  private x: number;
  private y: number;
  private readonly vx: number;
  private readonly vy: number;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly onDestroyed: () => void;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    config: SwordConfig,
    stats: PlayerStats,
    startX: number,
    startY: number,
    dirX: number,
    dirY: number,
    onDestroyed: () => void,
  ) {
    // INV-01 dev-time 断言: 一旦 PlayerStats / SwordConfig 任何一侧改值,
    // 都会被首次发射触发, 不依赖人工核对 PLAYER_SPEED 与 SWORD_MIN_SPEED.
    const effectiveMinSpeed = config.minSpeed * stats.minSpeedMul;
    if (PLAYER_SPEED >= effectiveMinSpeed) {
      throw new Error(
        `INV-01 violated: PLAYER_SPEED (${PLAYER_SPEED}) must be < effective V_min (${effectiveMinSpeed}). 见 docs/design-invariants.md`,
      );
    }

    const effectiveInitialSpeed = config.initialSpeed * stats.initialSpeedMul;
    this.x = startX;
    this.y = startY;
    this.vx = dirX * effectiveInitialSpeed;
    this.vy = dirY * effectiveInitialSpeed;
    this.onDestroyed = onDestroyed;

    const g = scene.add.graphics();
    g.fillStyle(SWORD_PLACEHOLDER_COLOR, 1);
    const len = SWORD_PLACEHOLDER_LENGTH;
    const cross = SWORD_PLACEHOLDER_CROSS;
    const w = SWORD_PLACEHOLDER_WIDTH;
    // 长轴 (剑身): 从局部 (0, 0) 到 (len, 0), 厚度 w. 剑柄在原点, 剑尖在 +x 端
    g.fillRect(0, -w / 2, len, w);
    // 短轴 (护手): 在 x = len/4 处 (1/4 靠剑柄端, 故意不居中避免 + 形)
    g.fillRect(len / 4 - w / 2, -cross / 2, w, cross);
    g.setPosition(startX, startY);
    // 一次性把"朝右画的十字"旋到 velocity 方向. Stage 2 接 homing 后会改成
    // 每帧 setRotation, 现在的绘制方式天然支持, 不需重构.
    g.setRotation(Math.atan2(dirY, dirX));
    this.graphics = g;
  }

  update(deltaMs: number): void {
    if (this.destroyed) return;
    const dt = deltaMs / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.graphics.setPosition(this.x, this.y);

    // Stage 1: 飞剑飞出画布即销毁. Stage 2 接物理后这条仍保留兜底
    // (理论上 Stage 2 之后飞剑会被远端转折抓住, 不再飞出画布).
    const out =
      this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT;
    if (out) this.destroy();
  }

  private destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.graphics.destroy();
    this.onDestroyed();
  }
}
