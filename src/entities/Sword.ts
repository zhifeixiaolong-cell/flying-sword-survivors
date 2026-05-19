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
  SWORD_TURNING_MAX_MS,
  SWORD_TURN_RATE,
} from '../config';
import { Enemy } from '../types/Enemy';
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
  private turningElapsedMs = 0; // TURNING 持续时间累加, 进 TURNING 时重置语义靠 state 单向迁移
  private hitCount = 0; // 已穿透敌人数, 用于伤害衰减跟踪 + dev 兜底

  // 发射时锁定的常量 (effective = 基础 × 倍率, INV-03):
  private readonly launchX: number;
  private readonly launchY: number;
  private readonly effectiveInitialSpeed: number;
  private readonly effectiveMinSpeed: number;
  private readonly effectiveMaxDistance: number;
  private readonly effectiveSpeedFloor: number;
  private readonly effectiveTurnRateRad: number; // 弧度/秒
  private readonly effectiveDamageCoefficient: number;
  private readonly effectiveSharpness: number;

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
    // turnRate 配置单位是 °/s, 内部存弧度/秒方便每帧直接乘 dt
    this.effectiveTurnRateRad =
      ((config.turnRate * stats.turnRateMul) * Math.PI) / 180;
    this.effectiveDamageCoefficient =
      config.damageCoefficient * stats.damageCoefficientMul;
    this.effectiveSharpness = config.sharpness * stats.sharpnessMul;

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
        // 进入 TURNING 时不重置 dir, 让 homing 从 OUTBOUND 末段方向连续转向"指向玩家",
        // 转向过程物理连续 — 远端不再"啪"地反方向.
        const distFromLaunch = Math.hypot(this.x - this.launchX, this.y - this.launchY);
        if (distFromLaunch >= this.effectiveMaxDistance) {
          this.state = SwordState.TURNING;
        }
        break;
      }
      case SwordState.TURNING: {
        this.turningElapsedMs += deltaMs;
        // 兜底: TURNING 持续不超过 SWORD_TURNING_MAX_MS. 极端 180° 转向 @ 180°/s
        // 理论 972ms, 1500ms 给 50% 余量. 触发说明 homing 不收敛, 是 bug.
        if (this.turningElapsedMs > SWORD_TURNING_MAX_MS) {
          throw new Error(
            `Sword TURNING 持续 > ${SWORD_TURNING_MAX_MS}ms (${this.turningElapsedMs}ms), homing 可能不收敛. ` +
              `dir=(${this.dirX.toFixed(3)}, ${this.dirY.toFixed(3)})`,
          );
        }
        const target = this.computeTargetDirToPlayer();
        if (target === null) {
          // 几乎贴着玩家, 转向无意义, 直接进 RETURNING (入鞘判定接管)
          this.state = SwordState.RETURNING;
          break;
        }
        this.applyHoming(dt, target.x, target.y);
        // 退出条件: 当前方向与目标方向夹角 < 5° (约 0.087 弧度)
        const cross = this.dirX * target.y - this.dirY * target.x;
        const dot = this.dirX * target.x + this.dirY * target.y;
        const angleDiff = Math.atan2(cross, dot);
        if (Math.abs(angleDiff) < (5 * Math.PI) / 180) {
          this.state = SwordState.RETURNING;
        }
        break;
      }
      case SwordState.RETURNING: {
        // 带角速度限制的 homing — 飞剑画"柔和 C 弧"追玩家, 不机械直追.
        const target = this.computeTargetDirToPlayer();
        if (target !== null) {
          this.applyHoming(dt, target.x, target.y);
        }
        break;
      }
    }

    // ---- 2. 计算 speed (按距离衰减, 所有状态共用) ----
    this.speed = this.computeSpeed();
    // TURNING 期间强制 V_min: 切断 "d 缩小 → speed 升高 → orbit lock" 的耦合.
    // 详见 Commit 4 修复 (`614cdaf` 触发的 orbit dynamic bug).
    // 物理: arc 半径 = V_min/ω = 64px, 远小于 d ≈ 600 起点, 不会进入 orbit 临界
    // (d < ~223px). 设计意义: 直接对应 §3.3 "速度自然衰减到最低值 (V_min)".
    if (this.state === SwordState.TURNING) {
      this.speed = this.effectiveMinSpeed;
    }

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

    // ---- 6. 出画布处理 ----
    // OUTBOUND 出画布 → 切 TURNING (degenerate case: 朝下/边缘发射时飞行距离
    // < D_max 就出画布, Stage 1 的"出画布 destroy"会跳过 TURNING/RETURNING
    // 让玩家看到"飞剑消失"). TURNING/RETURNING 期间允许短暂在画布外, homing 会带回.
    const outOfBounds =
      this.x < 0 ||
      this.x > GAME_WIDTH ||
      this.y < 0 ||
      this.y > GAME_HEIGHT;
    if (outOfBounds && this.state === SwordState.OUTBOUND) {
      this.state = SwordState.TURNING;
    }

    // 极端兜底: 飞剑距画布中心 > 2 × diagonal 时强制 destroy. 正常路径不触发,
    // 触发 = NaN/Infinity bug 信号 (开发期 console.error).
    const distFromCenter = Math.hypot(
      this.x - GAME_WIDTH / 2,
      this.y - GAME_HEIGHT / 2,
    );
    const escapeThreshold = 2 * Math.hypot(GAME_WIDTH, GAME_HEIGHT);
    if (distFromCenter > escapeThreshold) {
      // eslint-disable-next-line no-console
      console.error(
        `Sword escaped to (${this.x}, ${this.y}), distance from center ${distFromCenter}px, force destroying. This is a bug.`,
      );
      this.destroy();
    }
  }

  // 返回"飞剑当前位置 → 玩家当前位置"的单位向量. 贴近玩家时返回 null,
  // 调用方按各自语义处理 (TURNING: 转 RETURNING; RETURNING: 跳过, 入鞘判定接管).
  private computeTargetDirToPlayer(): { x: number; y: number } | null {
    const player = this.getPlayerPos();
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return null;
    return { x: dx / mag, y: dy / mag };
  }

  // 角速度限制下的方向修正: 当前方向 → 目标方向, 每帧最多旋转
  // effectiveTurnRateRad * dt 弧度. atan2(cross, dot) 自带 360° 边界处理.
  // 参数化目标方向, TURNING / RETURNING 都用此 helper.
  private applyHoming(dt: number, targetDirX: number, targetDirY: number): void {
    // 当前方向到目标方向的有符号最短旋转角 (弧度, 范围 (-π, π])
    const cross = this.dirX * targetDirY - this.dirY * targetDirX;
    const dot = this.dirX * targetDirX + this.dirY * targetDirY;
    const delta = Math.atan2(cross, dot);

    const maxRot = this.effectiveTurnRateRad * dt;
    const actualRot = Phaser.Math.Clamp(delta, -maxRot, maxRot);

    // 2D 旋转矩阵旋转 (dirX, dirY) 一个 actualRot 角度
    const cosR = Math.cos(actualRot);
    const sinR = Math.sin(actualRot);
    const newDirX = this.dirX * cosR - this.dirY * sinR;
    const newDirY = this.dirX * sinR + this.dirY * cosR;
    this.dirX = newDirX;
    this.dirY = newDirY;
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

  // 穿透命中: 计算伤害 → 通知敌人 → 速度按锋利度衰减 → hitCount++.
  // M2 不触发 (无敌人), M3 敌人系统在碰撞检测中调用此方法.
  onHit(enemy: Enemy): void {
    if (this.speed <= 0) {
      throw new Error(
        `Sword.onHit called with non-positive speed: ${this.speed}`,
      );
    }
    if (this.hitCount >= 100) {
      throw new Error(
        `Sword.hitCount exceeded 100, possible perforation bug`,
      );
    }

    // 瞬时伤害 = 当前速度 × 伤害系数 (设计文档 §4.1). INV-03 倍率已锁进 effective.
    const damage = this.speed * this.effectiveDamageCoefficient;
    enemy.takeDamage(damage);

    // 穿透代价 = 速度衰减 (§4.2 锋利度系数).
    this.speed *= this.effectiveSharpness;
    this.hitCount++;
  }

  private destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.graphics.destroy();
    this.onDestroyed();
  }
}
