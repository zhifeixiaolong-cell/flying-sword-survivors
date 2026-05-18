import Phaser from 'phaser';
import { GAME_WIDTH, WALL_Y, WALL_COLOR, WALL_THICKNESS } from '../config';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    const wall = this.add.graphics();
    wall.lineStyle(WALL_THICKNESS, WALL_COLOR, 1);
    wall.lineBetween(0, WALL_Y, GAME_WIDTH, WALL_Y);
  }
}
