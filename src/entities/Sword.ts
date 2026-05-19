import Phaser from 'phaser';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER_SIZE,
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
  SWORD_SHEATHE_RADIUS_PAD,
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

// 一次发射的初始状态. 聚合 5 个字段, 方便 Stage 3+ 扩展 (例如分发射点/瞄准点).
export interface SwordSpawn {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  // 实时返回玩家身体中心 (用于距离衰减 / 回程目标 / 入鞘判定).
  getPlayerPos: () => { x: number; y: number };
}

export enum SwordState {
  OUTBOUND = 'OUTBOUND',
  TURNING = 'TURNING',
  RETURNING = 'RETURNING',
}

export class Sword {
  private x: number;
  private y: number;
  private dirX: number;
  private dirY: number;
  private speed: number;
  private state: SwordState = SwordState.OUTBOUND;

  // 发射时锁定的常量 (effective = 基础 × 倍率, INV-03):
  private readonly launchX: number;
  private readonly launchY: number;
  private readonly effectiveInitialSpeed: number;
  private readonly effectiveMinSpeed: number;
  private readonly effectiveMaxDistance: number;
  private readonly effectiveSpeedFloor: number;

  private readonly getPlayerPos: () => { x: number; y: number };
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly onDestroyed: () => void;
  private destroyed = false;

  constructor(
    scene: Phaser.Scene,
    config: SwordConfig,
    stats: PlayerStats,
    spawn: SwordSpawn,
    onDestroyed: () => void,
  ) {
    this.effectiveInitialSpeed = config.initialSpeed * stats.initialSpeedMul;
    this.effectiveMinSpeed = config.minSpeed * stats.minSpeedMul;
    this.effectiveMaxDistance = config.maxDistance * stats.maxDistanceMul;
    this.effectiveSpeedFloor = config.speedFloor; // floor 是物理兜底, 不参与倍率

    // INV-01 dev-time 断言: 一旦 PlayerStats / SwordConfig 任何一侧改值,
    // 都会被首次发射触发, 不依赖人工核对 PLAYER_SPEED 与 SWORD_MIN_SPEED.
    if (PLAYER_SPEED >= this.effectiveMinSpeed) {
      throw new Error(
        `INV-01 violated: PLAYER_SPEED (${PLAYER_SPEED}) must be < effective V_min (${this.effectiveMinSpeed}). 见 docs/design-invariants.md`,
      );
    }

    this.x = spawn.x;
    this.y = spawn.y;
    this.launchX = spawn.x;
    this.launchY = spawn.y;
    this.dirX = spawn.dirX;
    this.dirY = spawn.dirY;
    this.speed = this.effectiveInitialSpeed;
    this.getPlayerPos = spawn.getPlayerPos;
    this.onDestroyed = onDestroyed;

    const g = scene.add.graphics();
    g.fillStyle(SWORD_PLACEHOLDER_COLOR, 1);
    const len = SWORD_PLACEHOLDER_LENGTH;
    const cross = SWORD_PLACEHOLDER_CROSS;
    const w = SWORD_PLACEHOLDER_WIDTH;
    // 长轴 (剑身): 从局部 (0, 0) 到 (len, 0), 剑柄在原点, 剑尖在 +x 端
    g.fillRect(0, -w / 2, len, w);
    // 短轴 (护手): 在 x = len/4 处 (1/4 靠剑柄端, 故意不居中避免 + 形)
    g.fillRect(len / 4 - w / 2, -cross / 2, w, cross);
    g.setPosition(this.x, this.y);
    g.setRotation(Math.atan2(this.dirY, this.dirX));
    this.graphics = g;
  }

  update(deltaMs: number): void {
    if (this.destroyed) return;
    const dt = deltaMs / 1000;

    // ---- 1. 状态分支: 更新方向 / 切换状态 ----
    switch (this.state) {
      case SwordState.OUTBOUND: {
        // 方向锁定, 不动. 检查是否飞够 D_max (距发射点, 见 plan F.1).
        const distFromLaunch = Math.hypot(this.x - this.launchX, this.y - this.launchY);
        if (distFromLaunch >= this.effectiveMaxDistance) {
          this.state = SwordState.TURNING;
        }
        break;
      }
      case SwordState.TURNING: {
        // 单帧过渡: 把方向重设为"指向玩家当前位置", 立刻切 RETURNING.
        // Stage 4 这里会加 100ms 远端微颤, 把单帧延长成 timer-driven.
        this.aimAtPlayer();
        this.state = SwordState.RETURNING;
        break;
      }
      case SwordState.RETURNING: {
        // 朴素回程: 每帧直指玩家. Commit 2 改为带 turn rate 限制的 homing.
        this.aimAtPlayer();
        break;
      }
    }

    // ---- 2. 计算 speed (按距离衰减, 所有状态共用) ----
    this.speed = this.computeSpeed();

    // ---- 3. 推进位置 + 渲染 ----
    this.x += this.dirX * this.speed * dt;
    this.y += this.dirY * this.speed * dt;
    this.graphics.setPosition(this.x, this.y);
    this.graphics.setRotation(Math.atan2(this.dirY, this.dirX));

    // ---- 4. dev-time 断言: speed > effective V_min * 0.99 (1% 数值余量) ----
    if (this.speed < this.effectiveMinSpeed * 0.99) {
      throw new Error(
        `Sword speed (${this.speed}) dropped below 99% of effective V_min (${this.effectiveMinSpeed}). 见 docs/design-invariants.md INV-01`,
      );
    }

    // ---- 5. 入鞘判定 (非 OUTBOUND 状态, 避免出鞘瞬间自杀) ----
    if (this.state !== SwordState.OUTBOUND) {
      const player = this.getPlayerPos();
      const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
      // 碰撞圆底部溢出 5px (-29 到 +5), M4+ 场景复杂化 (穿墙敌人/复杂地形) 时 revisit
      const sheatheRadius = PLAYER_SIZE / 2 + SWORD_SHEATHE_RADIUS_PAD;
      if (distToPlayer < sheatheRadius) {
        this.destroy();
        return;
      }
    }

    // ---- 6. 出画布兜底 (Stage 1 fallback, 理论上 Stage 2 不会触发) ----
    if (this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT) {
      this.destroy();
    }
  }

  // 把 dirX/dirY 重设为"飞剑当前位置 → 玩家当前位置"的单位向量
  private aimAtPlayer(): void {
    const player = this.getPlayerPos();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return; // 几乎贴着玩家, 方向不变 (入鞘判定会处理)
    this.dirX = dx / mag;
    this.dirY = dy / mag;
  }

  // V(d) = V_min + (V_max - V_min) × (1 - d/D_max), 兜底 SWORD_SPEED_FLOOR.
  // d = 飞剑距玩家当前位置 (§3.6), 所有状态共用.
  private computeSpeed(): number {
    const player = this.getPlayerPos();
    const d = Math.hypot(this.x - player.x, this.y - player.y);
    const ratio = Math.min(1, d / this.effectiveMaxDistance); // 限 [0,1] 避免溢出
    const v =
      this.effectiveMinSpeed +
      (this.effectiveInitialSpeed - this.effectiveMinSpeed) * (1 - ratio);
    return Math.max(this.effectiveSpeedFloor, v);
  }

  private destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.graphics.destroy();
    this.onDestroyed();
  }
}
