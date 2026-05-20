import Phaser from 'phaser';
import {
  SWORD_HOVER_ANCHOR_DIR_X,
  SWORD_HOVER_ANCHOR_DIR_Y,
  SWORD_HOVER_BASE_ALPHA,
  SWORD_HOVER_DISTANCE,
} from '../config';
import { drawSword } from './SwordRenderer';

// 悬浮剑 (Stage 5): 待命状态下展示在玩家身边的 M2 素剑.
//
// 浮游炮语义: 位置固定 (ANCHOR_DIR × DISTANCE), 朝向跟随光标.
// 剑形由 drawSword 一次性绘制, 显隐由 graphics.alpha tween 控制.
//
// 流动呼吸效果 (设计文档 §7) 在 M2 阶段未启用 — Phaser Graphics 在 15px 剑刃
// 上做"亮区轴向流动"是技术栈极限. SwordRenderer.drawSwordFlow 保留作为 M5
// 接入起点, 那时配合 sprite 美术资产重做.
export class SwordHover {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics;

  private baseAlpha = 0; // 显隐 tween 控制
  private currentRotation = 0; // 鼠标贴玩家时保持上一帧朝向
  private currentlyVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    drawSword(this.graphics);
    this.graphics.alpha = 0;
  }

  update(
    playerX: number,
    playerY: number,
    mouseX: number,
    mouseY: number,
    hasCapacity: boolean,
  ): void {
    // 位置: 固定在玩家身边 ANCHOR_DIR × DISTANCE 处 (浮游炮锚点)
    const pivotX = playerX + SWORD_HOVER_ANCHOR_DIR_X * SWORD_HOVER_DISTANCE;
    const pivotY = playerY + SWORD_HOVER_ANCHOR_DIR_Y * SWORD_HOVER_DISTANCE;
    this.graphics.setPosition(pivotX, pivotY);

    // 朝向: 跟随光标. 鼠标贴玩家时保持上一帧.
    const aimDx = mouseX - playerX;
    const aimDy = mouseY - playerY;
    const aimMag = Math.hypot(aimDx, aimDy);
    if (aimMag >= 1e-6) {
      this.currentRotation = Math.atan2(aimDy, aimDx);
    }
    this.graphics.setRotation(this.currentRotation);

    // 显隐 tween: 状态切换时启动一次, 不每帧重启
    if (hasCapacity && !this.currentlyVisible) {
      this.currentlyVisible = true;
      this.scene.tweens.add({
        targets: this,
        baseAlpha: SWORD_HOVER_BASE_ALPHA,
        duration: 100,
        ease: 'Power2',
      });
    } else if (!hasCapacity && this.currentlyVisible) {
      this.currentlyVisible = false;
      this.scene.tweens.add({
        targets: this,
        baseAlpha: 0,
        duration: 100,
        ease: 'Power2',
      });
    }

    this.graphics.alpha = this.baseAlpha;
  }

  destroy(): void {
    this.graphics.destroy();
  }

  // pivot 在世界坐标的位置 = playerBodyCenter + ANCHOR_DIR × DISTANCE.
  // MainScene 用此方法获取出/入鞘点 + distance 衰减参考点, 保证视觉连贯
  // (实战剑出/入鞘都在 hover pivot 位置, 不再"从身体中心冒出").
  // 入参是玩家身体中心 (= player.x, player.y - PLAYER_SIZE/2).
  getPivotPosition(
    playerBodyX: number,
    playerBodyY: number,
  ): { x: number; y: number } {
    return {
      x: playerBodyX + SWORD_HOVER_ANCHOR_DIR_X * SWORD_HOVER_DISTANCE,
      y: playerBodyY + SWORD_HOVER_ANCHOR_DIR_Y * SWORD_HOVER_DISTANCE,
    };
  }
}
