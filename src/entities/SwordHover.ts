import Phaser from 'phaser';
import {
  SWORD_BLADE_COLOR,
  SWORD_BLADE_LENGTH,
  SWORD_BLADE_WIDTH,
  SWORD_HALO_LENGTH,
  SWORD_HALO_WIDTH,
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
    // 剑下 1/3 处. 浮游炮语义: 剑柄端朝玩家, 剑尖端朝鼠标, 旋转时剑尖划弧.
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
    // 位置 + 朝向: 沿 player → mouse 方向, 距玩家 30px
    const dx = mouseX - playerX;
    const dy = mouseY - playerY;
    const mag = Math.hypot(dx, dy);
    if (mag >= 1e-6) {
      const dirX = dx / mag;
      const dirY = dy / mag;
      this.graphics.setPosition(
        playerX + dirX * SWORD_HOVER_DISTANCE,
        playerY + dirY * SWORD_HOVER_DISTANCE,
      );
      this.graphics.setRotation(Math.atan2(dirY, dirX));
    }
    // 鼠标贴在玩家身上: 位置/朝向不变, 保持上一帧状态

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
