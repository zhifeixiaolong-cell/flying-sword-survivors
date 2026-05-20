import Phaser from 'phaser';
import {
  SWORD_BLADE_COLOR,
  SWORD_BLADE_LENGTH,
  SWORD_BLADE_WIDTH,
  SWORD_HALO_LENGTH,
  SWORD_HALO_WIDTH,
  SWORD_HOVER_ANCHOR_DIR_X,
  SWORD_HOVER_ANCHOR_DIR_Y,
  SWORD_HOVER_BASE_ALPHA,
  SWORD_HOVER_DISTANCE,
  SWORD_HOVER_HALO_ALPHA,
  SWORD_HOVER_PIVOT_OFFSET,
} from '../config';

// 悬浮剑 (Stage 5): 待命状态下展示在玩家身边的虚化剑.
// 设计文档 §7: 距玩家中心 30px, 朝向沿 player → mouse 单位向量, 池非空时显示.
// 视觉与实战飞剑同形不同 alpha — graphics.alpha 控制整体可见度 (含显隐 + 呼吸).
//
// 显隐 tween (baseAlpha 0 ↔ SWORD_HOVER_BASE_ALPHA) 与呼吸 tween (breathOffset
// 0 ↔ SWORD_HOVER_BREATH_RANGE) 独立工作, 每帧 update 合成: alpha = base + offset.
export class SwordHover {
  private readonly scene: Phaser.Scene;
  private readonly graphics: Phaser.GameObjects.Graphics;

  // tween 目标 (两个独立字段, 各由独立 tween 驱动)
  private baseAlpha = 0; // 显隐 tween 控制 (0 = 隐藏, SWORD_HOVER_BASE_ALPHA = 显示)
  private breathOffset = 0; // 呼吸 tween 控制 (Stage 5 Commit 2 才启动 tween)

  // 显隐状态记忆 — 避免每帧重复创建相同方向的 tween
  private currentlyVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const g = scene.add.graphics();
    // 梭形中心偏移到 (PIVOT_OFFSET, 0), 让 graphics 原点 (= 旋转 pivot) 落在
    // 剑下 1/3 处 (距柄 8px / 距尖 16px). 浮游炮语义: 剑悬浮在玩家身边
    // 固定位置 (ANCHOR_DIR × DISTANCE), 朝向跟鼠标 — 不是位置和朝向都跟光标.
    // 1. 柔光晕 (底层): hover 专属 draw alpha (高于实战剑, 配合外层 graphics.alpha 衰减)
    g.fillStyle(SWORD_BLADE_COLOR, SWORD_HOVER_HALO_ALPHA);
    g.fillEllipse(SWORD_HOVER_PIVOT_OFFSET, 0, SWORD_HALO_LENGTH, SWORD_HALO_WIDTH);
    // 2. 梭形剑身 (顶层): 满 alpha, 整体可见度由外层 graphics.alpha 调控
    g.fillStyle(SWORD_BLADE_COLOR, 1.0);
    g.fillEllipse(SWORD_HOVER_PIVOT_OFFSET, 0, SWORD_BLADE_LENGTH, SWORD_BLADE_WIDTH);
    g.alpha = 0; // 起始隐藏, 第一次 update + hasCapacity 触发显示 tween
    this.graphics = g;
  }

  // 每帧由 MainScene 调用. playerX/Y = 玩家身体中心, hasCapacity = 池非满.
  update(
    playerX: number,
    playerY: number,
    mouseX: number,
    mouseY: number,
    hasCapacity: boolean,
  ): void {
    // 位置: 固定在玩家身边 ANCHOR_DIR × DISTANCE 处 (单剑 = 45° 右上), 静态.
    this.graphics.setPosition(
      playerX + SWORD_HOVER_ANCHOR_DIR_X * SWORD_HOVER_DISTANCE,
      playerY + SWORD_HOVER_ANCHOR_DIR_Y * SWORD_HOVER_DISTANCE,
    );
    // 朝向: 跟随光标 (剑尖朝鼠标方向), 动态. 鼠标贴在玩家身上时朝向保持上一帧.
    const aimDx = mouseX - playerX;
    const aimDy = mouseY - playerY;
    const aimMag = Math.hypot(aimDx, aimDy);
    if (aimMag >= 1e-6) {
      this.graphics.setRotation(Math.atan2(aimDy, aimDx));
    }

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

    // 合成最终 alpha (Commit 1: breathOffset 永远 = 0, 等同 baseAlpha)
    this.graphics.alpha = this.baseAlpha + this.breathOffset;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
