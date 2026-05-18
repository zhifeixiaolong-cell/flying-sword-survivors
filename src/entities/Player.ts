import Phaser from 'phaser';
import { PLAYER_SIZE, PLAYER_COLOR } from '../config';

export class Player {
  x: number;
  readonly y: number;

  private graphics: Phaser.GameObjects.Graphics;

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
  }

  update(_deltaMs: number): void {
    // commit 3 实现:读 A/D + ←/→,匀速移动,夹紧到画布边界
  }
}
