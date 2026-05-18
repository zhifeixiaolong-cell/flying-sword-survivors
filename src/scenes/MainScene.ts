import Phaser from 'phaser';
import { GAME_WIDTH, WALL_Y, WALL_COLOR, WALL_THICKNESS } from '../config';
import { Player } from '../entities/Player';

export class MainScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super('MainScene');
  }

  create(): void {
    const wall = this.add.graphics();
    wall.lineStyle(WALL_THICKNESS, WALL_COLOR, 1);
    wall.lineBetween(0, WALL_Y, GAME_WIDTH, WALL_Y);

    this.player = new Player(this, GAME_WIDTH / 2, WALL_Y);
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);
  }
}
