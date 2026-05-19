import Phaser from 'phaser';
import {
  GAME_WIDTH,
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
    const dx = pointer.x - this.player.x;
    const dy = pointer.y - this.player.y;
    const magSq = dx * dx + dy * dy;
    // 鼠标贴在玩家身上时跳过, 避免归一化产生 NaN
    if (magSq < 0.25) return;
    const inv = 1 / Math.sqrt(magSq);
    this.swordPool.tryFire(
      this,
      DEFAULT_SWORD_CONFIG,
      this.player.stats,
      this.player.x,
      this.player.y,
      dx * inv,
      dy * inv,
    );
  }
}
