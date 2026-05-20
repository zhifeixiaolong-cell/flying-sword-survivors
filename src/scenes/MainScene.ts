import Phaser from 'phaser';
import {
  GAME_WIDTH,
  PLAYER_SIZE,
  SWORD_POOL_CAPACITY,
  WALL_COLOR,
  WALL_THICKNESS,
  WALL_Y,
} from '../config';
import { Player } from '../entities/Player';
import { DEFAULT_SWORD_CONFIG } from '../entities/Sword';
import { SwordHover } from '../entities/SwordHover';
import { SwordPool } from '../entities/SwordPool';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private swordPool!: SwordPool;
  private swordHover!: SwordHover;
  private keySpace!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('MainScene');
  }

  create(): void {
    // 深蓝夜空背景 (Stage 5 视觉收尾): 替换 Phaser 默认黑色, 修真夜战氛围.
    this.cameras.main.setBackgroundColor('#0A1428');

    const wall = this.add.graphics();
    wall.lineStyle(WALL_THICKNESS, WALL_COLOR, 1);
    wall.lineBetween(0, WALL_Y, GAME_WIDTH, WALL_Y);

    this.player = new Player(this, GAME_WIDTH / 2, WALL_Y);
    this.swordPool = new SwordPool(SWORD_POOL_CAPACITY);
    this.swordHover = new SwordHover(this);

    const keyboard = this.input.keyboard!;
    this.keySpace = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // 阻止空格触发浏览器默认行为(滚动页面)
    keyboard.addCapture('SPACE');

    // 出鞘 / 入鞘瞬间在玩家身上闪一下 (Stage 4 视觉反馈, 设计文档 §6.4).
    // 出 / 入对称: 同色 / 同半径 / 同时长.
    this.events.on('sword-spawn', ({ x, y }: { x: number; y: number }) =>
      this.flashAt(x, y),
    );
    this.events.on('sword-sheathe', ({ x, y }: { x: number; y: number }) =>
      this.flashAt(x, y),
    );
  }

  // 在指定位置画一个短促白光闪光圈, 100ms 淡出后自销毁.
  private flashAt(x: number, y: number): void {
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(x, y, 20);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => flash.destroy(),
    });
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.tryFireSword();
    }

    this.swordPool.update(delta);

    // 悬浮剑每帧更新位置 / 朝向 / 显隐. 玩家身体中心 + 鼠标位置 + 池状态.
    const pointer = this.input.activePointer;
    this.swordHover.update(
      this.player.x,
      this.player.y - PLAYER_SIZE / 2,
      pointer.x,
      pointer.y,
      this.swordPool.hasCapacity(),
    );
  }

  private tryFireSword(): void {
    const pointer = this.input.activePointer;
    // 出鞘点 = 悬浮剑 pivot 位置 (玩家身边 ANCHOR_DIR × DISTANCE 处),
    // 不再用玩家身体中心 — 让实战剑从浮游炮位置"嗖"出去, 视觉连贯.
    const bodyX = this.player.x;
    const bodyY = this.player.y - PLAYER_SIZE / 2;
    const pivot = this.swordHover.getPivotPosition(bodyX, bodyY);
    // 朝向也从 pivot 算, 让"剑指鼠标"的瞄准方向以浮游炮位置为基准
    const dx = pointer.x - pivot.x;
    const dy = pointer.y - pivot.y;
    const magSq = dx * dx + dy * dy;
    // 鼠标贴在 pivot 时跳过, 避免归一化产生 NaN
    if (magSq < 0.25) return;
    const inv = 1 / Math.sqrt(magSq);
    this.swordPool.tryFire(this, DEFAULT_SWORD_CONFIG, this.player.stats, {
      x: pivot.x,
      y: pivot.y,
      dirX: dx * inv,
      dirY: dy * inv,
      // getPlayerPos 返回 hover pivot (而非身体中心) — 入鞘判定 / 回程 homing
      // 目标 / distance 衰减 d 全部以 pivot 为参考, 几何统一. pivot 距身体
      // 中心 40px << D_max=600, 速度公式输出差异 < 5% 几乎不可感知.
      getPlayerPos: () =>
        this.swordHover.getPivotPosition(
          this.player.x,
          this.player.y - PLAYER_SIZE / 2,
        ),
    });
  }
}
