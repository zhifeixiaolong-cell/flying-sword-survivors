import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { GAME_WIDTH, GAME_HEIGHT, BG_COLOR } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: BG_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
};

new Phaser.Game(config);
