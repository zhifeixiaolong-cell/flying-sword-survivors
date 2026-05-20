import Phaser from 'phaser';
import { GAME_WIDTH, PLAYER_SIZE, PLAYER_COLOR, PLAYER_SPEED } from '../config';
import { PlayerStats } from './PlayerStats';

export class Player {
  x: number;
  readonly y: number;
  readonly stats = new PlayerStats();

  private graphics: Phaser.GameObjects.Graphics;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyLeft: Phaser.Input.Keyboard.Key;
  private keyRight: Phaser.Input.Keyboard.Key;
  private currentSpeed = 0; // 当前帧实际移动速度 (Debug HUD 用), 0 或 PLAYER_SPEED

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;

    const g = scene.add.graphics();
    g.fillStyle(PLAYER_COLOR, 1);
    // 身体方块的底边对齐 graphics 原点(局部 y=0),所以 "脚" 正好踩在传入的 y 坐标(城墙线)上
    g.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
    g.fillCircle(0, -PLAYER_SIZE - 8, 8);
    g.setPosition(x, y);
    this.graphics = g;

    const keyboard = scene.input.keyboard!;
    // 阻止方向键触发浏览器默认行为(否则按 ←/→ 玩家走位的同时页面也会滚动)
    keyboard.addCapture('LEFT,RIGHT');
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyLeft = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.keyRight = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  }

  update(deltaMs: number): void {
    const goLeft = this.keyA.isDown || this.keyLeft.isDown;
    const goRight = this.keyD.isDown || this.keyRight.isDown;
    // 同时按或都不按 → 不动;否则按 goRight 取 +1 / -1
    const direction = goLeft === goRight ? 0 : goRight ? 1 : -1;

    this.x += direction * PLAYER_SPEED * (deltaMs / 1000);
    const halfWidth = PLAYER_SIZE / 2;
    this.x = Phaser.Math.Clamp(this.x, halfWidth, GAME_WIDTH - halfWidth);
    this.graphics.setPosition(this.x, this.y);
    this.currentSpeed = direction === 0 ? 0 : PLAYER_SPEED;
  }

  getCurrentSpeed(): number {
    return this.currentSpeed;
  }
}
