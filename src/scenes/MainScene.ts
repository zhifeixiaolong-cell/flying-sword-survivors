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
import { SwordPool } from '../entities/SwordPool';

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private swordPool!: SwordPool;
  private keySpace!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('MainScene');
  }

  create(): void {
    const wall = this.add.graphics();
    wall.lineStyle(WALL_THICKNESS, WALL_COLOR, 1);
    wall.lineBetween(0, WALL_Y, GAME_WIDTH, WALL_Y);

    this.player = new Player(this, GAME_WIDTH / 2, WALL_Y);
    this.swordPool = new SwordPool(SWORD_POOL_CAPACITY);

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
  }

  private tryFireSword(): void {
    const pointer = this.input.activePointer;
    // 发射点 = 玩家身体中心 (与入鞘判定同基准, 避免发射后立即触发自杀判定)
    const fromX = this.player.x;
    const fromY = this.player.y - PLAYER_SIZE / 2;
    const dx = pointer.x - fromX;
    const dy = pointer.y - fromY;
    const magSq = dx * dx + dy * dy;
    // 鼠标贴在玩家身上时跳过, 避免归一化产生 NaN
    if (magSq < 0.25) return;
    const inv = 1 / Math.sqrt(magSq);
    this.swordPool.tryFire(this, DEFAULT_SWORD_CONFIG, this.player.stats, {
      x: fromX,
      y: fromY,
      dirX: dx * inv,
      dirY: dy * inv,
      getPlayerPos: () => ({
        x: this.player.x,
        y: this.player.y - PLAYER_SIZE / 2,
      }),
    });
  }
}
