import Phaser from 'phaser';
import { SWORD_COLOR_BLADE } from '../config';

// 自定义准星 (Stage 6 Commit 1): 同心圆 + 八点, 设计文档 §8 候选 5.
// 替换浏览器系统鼠标光标, 颜色与剑色统一 (SWORD_COLOR_BLADE 白银).
//
// 两态:
// - ready (池非满, 可发射): 完整准星 — 内圈 + 外圈 + 8 点, 高 alpha
// - cooldown (池满, 飞剑在外): 简化 — 仅外圈 + 4 点, 低 alpha, 提示"不能发射"
//
// 状态切换通过比较 prev/current 触发 redraw (避免每帧重绘).
type CrosshairState = 'ready' | 'cooldown';

export class Crosshair {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private currentState: CrosshairState = 'ready';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1000); // 准星在最顶层, 永远在所有游戏元素之上
    this.draw('ready');

    // 隐藏浏览器系统鼠标光标 (注: 部分 OS / 浏览器仍可能显示残留光标)
    scene.input.setDefaultCursor('none');
  }

  private draw(state: CrosshairState): void {
    this.graphics.clear();
    const color = SWORD_COLOR_BLADE;
    const innerR = 2;
    const outerR = 14;
    const dotR = 1.5;
    const dotDist = 10;

    if (state === 'ready') {
      // 完整准星: 内圈 + 外圈 + 8 点 (八方)
      this.graphics.lineStyle(1, color, 1.0);
      this.graphics.strokeCircle(0, 0, innerR);
      this.graphics.lineStyle(1, color, 0.6);
      this.graphics.strokeCircle(0, 0, outerR);
      this.graphics.fillStyle(color, 1.0);
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        this.graphics.fillCircle(
          Math.cos(angle) * dotDist,
          Math.sin(angle) * dotDist,
          dotR,
        );
      }
    } else {
      // cooldown: 仅外圈 + 4 点 (东南西北), 低 alpha
      this.graphics.lineStyle(1, color, 0.3);
      this.graphics.strokeCircle(0, 0, outerR);
      this.graphics.fillStyle(color, 0.4);
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 * i) / 4;
        this.graphics.fillCircle(
          Math.cos(angle) * dotDist,
          Math.sin(angle) * dotDist,
          dotR,
        );
      }
    }
  }

  update(mouseX: number, mouseY: number, hasCapacity: boolean): void {
    this.graphics.setPosition(mouseX, mouseY);
    const newState: CrosshairState = hasCapacity ? 'ready' : 'cooldown';
    if (newState !== this.currentState) {
      this.currentState = newState;
      this.draw(newState);
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.scene.input.setDefaultCursor('default'); // 恢复系统光标
  }
}
