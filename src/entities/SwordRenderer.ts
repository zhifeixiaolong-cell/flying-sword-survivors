import Phaser from 'phaser';
import {
  SWORD_BLADE_LENGTH_NEW,
  SWORD_BLADE_WIDTH_NEW,
  SWORD_COLOR_BLADE,
  SWORD_COLOR_BLADE_GLOW,
  SWORD_COLOR_BLADE_HIGHLIGHT,
  SWORD_COLOR_GUARD,
  SWORD_COLOR_HANDLE,
  SWORD_COLOR_HANDLE_BIND,
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

  // 1a. 外层光晕 (最大, 最淡, 扩散感) — 模拟剑刃自发光向外渐变
  g.fillStyle(SWORD_COLOR_BLADE_GLOW, 0.1 * alphaMul);
  g.fillEllipse(
    SWORD_BLADE_LENGTH_NEW / 2,
    0,
    SWORD_BLADE_LENGTH_NEW + 12,
    SWORD_BLADE_WIDTH_NEW + 8,
  );
  // 1b. 内层光晕 (较小, 较亮, 集中)
  g.fillStyle(SWORD_COLOR_BLADE_GLOW, 0.25 * alphaMul);
  g.fillEllipse(
    SWORD_BLADE_LENGTH_NEW / 2,
    0,
    SWORD_BLADE_LENGTH_NEW + 6,
    SWORD_BLADE_WIDTH_NEW + 3,
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

  // 6. 剑柄 (handle, 深棕主色)
  g.fillStyle(SWORD_COLOR_HANDLE, 1.0 * alphaMul);
  const handleStartX = -SWORD_GUARD_LENGTH - SWORD_HANDLE_LENGTH;
  g.fillRect(
    handleStartX,
    -SWORD_HANDLE_WIDTH / 2,
    SWORD_HANDLE_LENGTH,
    SWORD_HANDLE_WIDTH,
  );

  // 6b. 缠绳纹理 (3 道更深细线, 分段缠绳感)
  g.fillStyle(SWORD_COLOR_HANDLE_BIND, 1.0 * alphaMul);
  for (let i = 1; i <= 3; i++) {
    const lineX = handleStartX + (SWORD_HANDLE_LENGTH * i) / 4;
    g.fillRect(lineX - 0.25, -SWORD_HANDLE_WIDTH / 2, 0.5, SWORD_HANDLE_WIDTH);
  }

  // 7. 剑柄首 (pommel, 圆球, 深灰金属)
  g.fillStyle(SWORD_COLOR_GUARD, 1.0 * alphaMul);
  g.fillCircle(
    -SWORD_GUARD_LENGTH - SWORD_HANDLE_LENGTH - SWORD_POMMEL_RADIUS,
    0,
    SWORD_POMMEL_RADIUS,
  );
}

/**
 * 悬浮剑流动高光带 (覆盖剑刃区域, 按设计文档 §7 "灵气从主人流向远端").
 *
 * ⚠️ M2 阶段未启用 — Phaser Graphics 在 15px 剑刃上做"亮区轴向流动"是技术栈
 * 极限, 多次尝试 (亮斑滑动 / 分段 alpha / 双层叠加 / 大幅增强参数) 均不够明显.
 * 撤回到"完整素剑静态显示", 流动留待 M5 引入 sprite 美术资产时重做.
 *
 * 此函数作为 M5 起点保留: 接口已稳定, M5 时改实现方式 (帧动画 / shader
 * UV scrolling), 调用方 (SwordHover) 重新接入即可. 参数当前严格按 §7 原文:
 * 亮区 30%, alpha 0.5 (纯白), 周期 1.5s 在调用方的 phase tween 内.
 *
 * @param g 流动专用 Graphics (调用前会 clear). 与底层 drawSword 用同一坐标系
 *          (sword 沿 +x, pivot 在护手中心), 通过 setPosition + setRotation 同步.
 * @param phase 0~1, 0 = 剑柄端 (剑刃 x=0), 1 = 剑尖端 (剑刃 x=BLADE_LENGTH_NEW)
 * @param alphaMul 整体 alpha 倍率 (供显隐控制)
 */
export function drawSwordFlow(
  g: Phaser.GameObjects.Graphics,
  phase: number,
  alphaMul = 1.0,
): void {
  g.clear();
  // §7 原参数 (M2 未启用, M5 重做时可在 sprite 上落地)
  const flowWidth = SWORD_BLADE_LENGTH_NEW * 0.3;
  const flowCenterX = SWORD_BLADE_LENGTH_NEW * phase;
  g.fillStyle(SWORD_COLOR_BLADE_HIGHLIGHT, 0.5 * alphaMul);
  g.fillRect(
    flowCenterX - flowWidth / 2,
    -SWORD_BLADE_WIDTH_NEW / 2,
    flowWidth,
    SWORD_BLADE_WIDTH_NEW,
  );
}
