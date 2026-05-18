import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Hello Phaser', {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#e6e6f0',
      })
      .setOrigin(0.5);
  }
}
