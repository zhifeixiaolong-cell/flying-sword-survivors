import Phaser from 'phaser';
import {
  SWORD_BLADE_LENGTH_NEW,
  SWORD_BLADE_WIDTH_NEW,
  SWORD_COLOR_BLADE,
  SWORD_COLOR_BLADE_GLOW,
  SWORD_COLOR_BLADE_HIGHLIGHT,
  SWORD_COLOR_GUARD,
  SWORD_COLOR_HANDLE,
  SWORD_GUARD_LENGTH,
  SWORD_GUARD_WIDTH,
  SWORD_HANDLE_LENGTH,
  SWORD_HANDLE_WIDTH,
  SWORD_POMMEL_RADIUS,
  SWORD_TIP_LENGTH,
} from '../config';

/**
 * 在给定 Graphics 上绘制 M2 素剑 (白银朴素剑形).
 * 剑沿 +x 方向 (剑尖朝右, 剑柄朝左). pivot 原点 (0, 0) 位于护手中心
 * (剑柄/剑刃分界处), 即 graphics 原点 — setRotation 围绕此点旋转.
 *
 * 坐标布局 (沿 x 轴, pivot 在 0):
 *   剑柄首中心:   x = -(GUARD_LENGTH + HANDLE_LENGTH + POMMEL_RADIUS)
 *                   = -(2 + 3 + 1.5) = -6.5
 *   剑柄中心:     x = -(GUARD_LENGTH + HANDLE_LENGTH/2) = -3.5
 *   护手中心:     x = 0  ← pivot
 *   剑刃中心:     x = BLADE_LENGTH_NEW / 2 = 7.5
 *   剑尖端:       x = BLADE_LENGTH_NEW + TIP_LENGTH = 18
 *   柄首端到尖端总长: 6.5 + 18 = 24.5 px
 *
 * @param g 要绘制的 Phaser Graphics 对象 (调用前会 clear)
 * @param alphaMul 整体 alpha 倍率 (供显隐 / 流动效果叠加, 默认 1.0)
 */
export function drawSword(
  g: Phaser.GameObjects.Graphics,
  alphaMul = 1.0,
): void {
  g.clear();

  // 1. 外圈光晕 (最底层, 比剑刃略大, 低 alpha) — 给剑一点"光感"
  g.fillStyle(SWORD_COLOR_BLADE_GLOW, 0.2 * alphaMul);
  g.fillEllipse(
    SWORD_BLADE_LENGTH_NEW / 2,
    0,
    SWORD_BLADE_LENGTH_NEW + 8,
    SWORD_BLADE_WIDTH_NEW + 4,
  );

  // 2. 剑刃主体 (白银长方形, fillRect 让边缘清晰, 不像椭圆收缩)
  g.fillStyle(SWORD_COLOR_BLADE, 0.9 * alphaMul);
  g.fillRect(
    0,
    -SWORD_BLADE_WIDTH_NEW / 2,
    SWORD_BLADE_LENGTH_NEW,
    SWORD_BLADE_WIDTH_NEW,
  );

  // 3. 剑尖 (三角形)
  g.fillStyle(SWORD_COLOR_BLADE, 0.9 * alphaMul);
  g.fillTriangle(
    SWORD_BLADE_LENGTH_NEW,
    -SWORD_BLADE_WIDTH_NEW / 2,
    SWORD_BLADE_LENGTH_NEW,
    SWORD_BLADE_WIDTH_NEW / 2,
    SWORD_BLADE_LENGTH_NEW + SWORD_TIP_LENGTH,
    0,
  );

  // 4. 剑刃中央高光线 (更亮的细线, 沿剑刃中央, 营造剑脊感)
  g.fillStyle(SWORD_COLOR_BLADE_HIGHLIGHT, 1.0 * alphaMul);
  g.fillRect(0, -0.5, SWORD_BLADE_LENGTH_NEW, 1);

  // 5. 护手 (cross-guard, 横向矩形, 深灰金属). 沿 -x 长 GUARD_LENGTH
  g.fillStyle(SWORD_COLOR_GUARD, 1.0 * alphaMul);
  g.fillRect(
    -SWORD_GUARD_LENGTH,
    -SWORD_GUARD_WIDTH / 2,
    SWORD_GUARD_LENGTH,
    SWORD_GUARD_WIDTH,
  );

  // 6. 剑柄 (handle, 黑色矩形, 缠绳风格)
  g.fillStyle(SWORD_COLOR_HANDLE, 1.0 * alphaMul);
  g.fillRect(
    -SWORD_GUARD_LENGTH - SWORD_HANDLE_LENGTH,
    -SWORD_HANDLE_WIDTH / 2,
    SWORD_HANDLE_LENGTH,
    SWORD_HANDLE_WIDTH,
  );

  // 7. 剑柄首 (pommel, 圆球, 深灰金属)
  g.fillStyle(SWORD_COLOR_GUARD, 1.0 * alphaMul);
  g.fillCircle(
    -SWORD_GUARD_LENGTH - SWORD_HANDLE_LENGTH - SWORD_POMMEL_RADIUS,
    0,
    SWORD_POMMEL_RADIUS,
  );
}
