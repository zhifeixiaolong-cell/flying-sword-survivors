import Phaser from 'phaser';
import {
  SWORD_HOVER_ANCHOR_DIR_X,
  SWORD_HOVER_ANCHOR_DIR_Y,
  SWORD_HOVER_BASE_ALPHA,
  SWORD_HOVER_DISTANCE,
} from '../config';
import { drawSword, drawSwordFlow } from './SwordRenderer';

// 悬浮剑 (Stage 5): 待命状态下展示在玩家身边的 M2 素剑.
//
// 浮游炮语义: 位置固定 (ANCHOR_DIR × DISTANCE), 朝向跟随光标.
// 双层 graphics:
// - graphics (底层): 完整素剑 (drawSword 一次性绘制)
// - flowGraphics (顶层): 白色高光带沿剑刃从柄到尖匀速滑动 (drawSwordFlow 每帧重绘)
//
// 设计文档 §7 "灵气从主人流向远端": 流动周期 1.5s, 线性 ease, 永久循环.
export class SwordHover {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics; // 底层素剑
  private readonly flowGraphics: Phaser.GameObjects.Graphics; // 顶层流动高光带

  private baseAlpha = 0; // 显隐 tween 控制 (0 = 隐藏, SWORD_HOVER_BASE_ALPHA = 显示)
  private phase = 0; // 0~1 流动相位, 由线性 tween 驱动
  private currentRotation = 0; // 鼠标贴玩家时保持上一帧朝向
  private currentlyVisible = false; // 状态记忆, 避免每帧重复创建 tween

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 底层: 完整素剑, 一次性绘制
    this.graphics = scene.add.graphics();
    drawSword(this.graphics);
    this.graphics.alpha = 0;

    // 顶层: 流动高光带, 每帧重绘 (drawSwordFlow 在 update 内调用)
    this.flowGraphics = scene.add.graphics();
    this.flowGraphics.alpha = 0;
    this.flowGraphics.setDepth(this.graphics.depth + 1);

    // 流动 phase tween: 线性匀速 0→1, 1500ms 周期, 永久循环.
    // phase 走到 1 后自动跳回 0 (repeat 行为), 形成"流到剑尖立即从剑柄重启".
    scene.tweens.add({
      targets: this,
      phase: 1,
      duration: 1500,
      ease: 'Linear',
      repeat: -1,
    });
  }

  update(
    playerX: number,
    playerY: number,
    mouseX: number,
    mouseY: number,
    hasCapacity: boolean,
  ): void {
    // 位置: 固定在玩家身边 ANCHOR_DIR × DISTANCE 处 (浮游炮锚点). 两层同步.
    const pivotX = playerX + SWORD_HOVER_ANCHOR_DIR_X * SWORD_HOVER_DISTANCE;
    const pivotY = playerY + SWORD_HOVER_ANCHOR_DIR_Y * SWORD_HOVER_DISTANCE;
    this.graphics.setPosition(pivotX, pivotY);
    this.flowGraphics.setPosition(pivotX, pivotY);

    // 朝向: 跟随光标. 鼠标贴玩家时保持上一帧.
    const aimDx = mouseX - playerX;
    const aimDy = mouseY - playerY;
    const aimMag = Math.hypot(aimDx, aimDy);
    if (aimMag >= 1e-6) {
      this.currentRotation = Math.atan2(aimDy, aimDx);
    }
    this.graphics.setRotation(this.currentRotation);
    this.flowGraphics.setRotation(this.currentRotation);

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

    // 应用 alpha (两层同步显隐)
    this.graphics.alpha = this.baseAlpha;
    this.flowGraphics.alpha = this.baseAlpha;

    // 每帧重绘流动高光带 (phase 新位置)
    drawSwordFlow(this.flowGraphics, this.phase);
  }

  destroy(): void {
    this.graphics.destroy();
    this.flowGraphics.destroy();
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
