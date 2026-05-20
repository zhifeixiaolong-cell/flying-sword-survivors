import Phaser from 'phaser';
import {
  SWORD_BLADE_COLOR,
  SWORD_BLADE_LENGTH,
  SWORD_BLADE_WIDTH,
  SWORD_HALO_LENGTH,
  SWORD_HALO_WIDTH,
  SWORD_HOVER_ANCHOR_DIR_X,
  SWORD_HOVER_ANCHOR_DIR_Y,
  SWORD_HOVER_BRIGHT_ALPHA,
  SWORD_HOVER_BRIGHT_WINDOW,
  SWORD_HOVER_DARK_ALPHA,
  SWORD_HOVER_DISTANCE,
  SWORD_HOVER_FLOW_PERIOD,
  SWORD_HOVER_HALO_BASE_ALPHA,
  SWORD_HOVER_PIVOT_OFFSET,
  SWORD_HOVER_SEGMENT_COUNT,
} from '../config';

// 悬浮剑 (Stage 5): 待命状态下展示在玩家身边的虚化剑.
//
// 浮游炮语义: 位置固定 (ANCHOR_DIR × DISTANCE), 朝向跟随光标. 两层视觉:
// - haloGraphics (底层): 静态 alpha 0.15 作背景, 不流动
// - bladeGraphics (中层): 分 N 段每帧重绘, 段 alpha 由 phase 驱动形成"明暗波
//   从剑柄滚到剑尖" (设计文档 §7 灵气流转)
//
// 显隐 / 流动 / 朝向三个状态独立, 不互相干扰.
export class SwordHover {
  private readonly scene: Phaser.Scene;
  private readonly haloGraphics: Phaser.GameObjects.Graphics;
  private readonly bladeGraphics: Phaser.GameObjects.Graphics;

  // 两层独立 base alpha (显隐 tween 控制)
  private haloBaseAlpha = 0;
  private bladeBaseAlpha = 0;

  // §7 流动呼吸 phase: 0~1 线性循环, 1500ms 周期. 段 i 的亮峰相位 = i / N.
  private phase = 0;

  // 当前朝向 (鼠标贴玩家时保持上一帧)
  private currentRotation = 0;

  // 显隐状态记忆, 避免每帧重复创建相同方向 tween
  private currentlyVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 底层: halo, 一次性绘制. 中心偏移到 PIVOT_OFFSET 让 pivot 落在剑下 1/3.
    const halo = scene.add.graphics();
    halo.fillStyle(SWORD_BLADE_COLOR, 1.0); // graphics 内满 alpha, 外层 graphics.alpha 控显示
    halo.fillEllipse(SWORD_HOVER_PIVOT_OFFSET, 0, SWORD_HALO_LENGTH, SWORD_HALO_WIDTH);
    halo.alpha = 0; // 起始隐藏
    this.haloGraphics = halo;

    // 中层: blade, 不一次性绘制 — renderBladeSegments 每帧分段重绘.
    // graphics.alpha 保持 1.0 (段 alpha 在 fillStyle 里独立控制).
    const blade = scene.add.graphics();
    blade.alpha = 1.0;
    blade.setDepth(halo.depth + 1);
    this.bladeGraphics = blade;

    // §7 流动 phase tween: 线性匀速 0→1, 1500ms 周期, 无 yoyo, 永久循环.
    // phase 走到 1 后自动跳回 0 (repeat 行为), 形成"流到剑尖立即从剑柄重启".
    scene.tweens.add({
      targets: this,
      phase: 1,
      duration: SWORD_HOVER_FLOW_PERIOD,
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
    // 位置: pivot 固定在玩家身边 ANCHOR_DIR × DISTANCE 处 (浮游炮锚点)
    const pivotX = playerX + SWORD_HOVER_ANCHOR_DIR_X * SWORD_HOVER_DISTANCE;
    const pivotY = playerY + SWORD_HOVER_ANCHOR_DIR_Y * SWORD_HOVER_DISTANCE;

    // 朝向: 跟随光标. 鼠标贴在玩家身上 (aimMag < 1e-6) 时保持上一帧朝向.
    const aimDx = mouseX - playerX;
    const aimDy = mouseY - playerY;
    const aimMag = Math.hypot(aimDx, aimDy);
    if (aimMag >= 1e-6) {
      this.currentRotation = Math.atan2(aimDy, aimDx);
    }

    // halo / blade 都以 pivot 为旋转中心, 跟剑身一起旋转
    this.haloGraphics.setPosition(pivotX, pivotY);
    this.haloGraphics.setRotation(this.currentRotation);
    this.bladeGraphics.setPosition(pivotX, pivotY);
    this.bladeGraphics.setRotation(this.currentRotation);

    // 显隐 tween: 状态切换时启动一次, 同时 tween 两个 baseAlpha
    if (hasCapacity && !this.currentlyVisible) {
      this.currentlyVisible = true;
      this.scene.tweens.add({
        targets: this,
        haloBaseAlpha: SWORD_HOVER_HALO_BASE_ALPHA, // 0.15
        bladeBaseAlpha: 1.0, // 段 alpha 原范围 (0.5~1.0) 完全呈现
        duration: 100,
        ease: 'Power2',
      });
    } else if (!hasCapacity && this.currentlyVisible) {
      this.currentlyVisible = false;
      this.scene.tweens.add({
        targets: this,
        haloBaseAlpha: 0,
        bladeBaseAlpha: 0,
        duration: 100,
        ease: 'Power2',
      });
    }

    // 应用 alpha. halo 静态由 graphics.alpha 控制; blade 段 alpha 在 fillStyle
    // 里, graphics.alpha 保持 1.0, 显隐通过 bladeBaseAlpha 乘到每段.
    this.haloGraphics.alpha = this.haloBaseAlpha;
    this.renderBladeSegments();
  }

  // §7 分段重绘: 每帧 clear + N 次 fillEllipse, 每段 alpha 是 phase + i 的函数.
  // 段 i 亮峰相位 = i/N, 形成"明暗波从段 0 (剑柄) 滚到段 N-1 (剑尖)".
  private renderBladeSegments(): void {
    this.bladeGraphics.clear();
    const N = SWORD_HOVER_SEGMENT_COUNT;
    const totalLength = SWORD_BLADE_LENGTH;
    const segWidth = totalLength / N; // 4px per segment (24 / 6)

    // 剑身覆盖 (graphics 局部 x): PIVOT_OFFSET - L/2 ~ PIVOT_OFFSET + L/2 = -8 ~ +16
    // 段 0 中心 x = -8 + segWidth/2 = -6
    const startX = SWORD_HOVER_PIVOT_OFFSET - totalLength / 2 + segWidth / 2;
    const brightHalf = SWORD_HOVER_BRIGHT_WINDOW / 2; // 0.15

    for (let i = 0; i < N; i++) {
      const segCenterX = startX + i * segWidth;
      // 段 i 距亮峰的相位距离. 模 1 循环边界用 dist > 0.5 ? 1 - dist : dist 处理.
      let dist = Math.abs(this.phase - i / N);
      if (dist > 0.5) dist = 1 - dist;

      let segAlpha: number;
      if (dist < brightHalf) {
        // 亮区内: BRIGHT_ALPHA → DARK_ALPHA 线性插值, dist=0 时最亮
        segAlpha =
          SWORD_HOVER_BRIGHT_ALPHA -
          (SWORD_HOVER_BRIGHT_ALPHA - SWORD_HOVER_DARK_ALPHA) * (dist / brightHalf);
      } else {
        segAlpha = SWORD_HOVER_DARK_ALPHA;
      }

      // 显隐控制乘到每段最终 alpha (bladeBaseAlpha 显示时=1.0, 隐藏=0)
      const finalAlpha = segAlpha * this.bladeBaseAlpha;
      this.bladeGraphics.fillStyle(SWORD_BLADE_COLOR, finalAlpha);
      this.bladeGraphics.fillEllipse(segCenterX, 0, segWidth, SWORD_BLADE_WIDTH);
    }
  }

  destroy(): void {
    this.haloGraphics.destroy();
    this.bladeGraphics.destroy();
  }

  // pivot 在世界坐标的位置 = playerBodyCenter + ANCHOR_DIR × DISTANCE.
  // MainScene 用此方法获取出/入鞘点 + distance 衰减参考点, 保证视觉连贯
  // (实战剑出/入鞘都在 hover pivot 位置, 不再"从身体中心冒出").
  // 入参是玩家身体中心 (= player.x, player.y - PLAYER_SIZE/2).
  getPivotPosition(playerBodyX: number, playerBodyY: number): { x: number; y: number } {
    return {
      x: playerBodyX + SWORD_HOVER_ANCHOR_DIR_X * SWORD_HOVER_DISTANCE,
      y: playerBodyY + SWORD_HOVER_ANCHOR_DIR_Y * SWORD_HOVER_DISTANCE,
    };
  }
}
